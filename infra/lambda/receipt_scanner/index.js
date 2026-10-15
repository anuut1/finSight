/**
 * AWS Lambda Function: FinSight Async Receipt Scanner
 * Triggered by SQS queue receiving S3 ObjectCreated events.
 * Calls Amazon Textract AnalyzeExpense, normalizes expense line items,
 * and updates the receipt document in MongoDB Atlas.
 */

const { TextractClient, AnalyzeExpenseCommand } = require('@aws-sdk/client-textract');
const { MongoClient, ObjectId } = require('mongodb');

let cachedDb = null;
const textractClient = new TextractClient({
  region: process.env.AWS_REGION || 'ap-south-1',
});

async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI environment variable is missing');
  }

  const client = new MongoClient(mongoUri, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
  });

  await client.connect();
  const db = client.db();
  cachedDb = db;
  return db;
}

function normalizeAmount(val) {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : Math.round((val + Number.EPSILON) * 100) / 100;
  }
  const clean = String(val).replace(/,/g, '').replace(/[^0-9.-]/g, '');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : Math.round((num + Number.EPSILON) * 100) / 100;
}

function normalizeDate(valStr = '') {
  if (!valStr) return new Date().toISOString().slice(0, 10);
  const parsed = Date.parse(valStr);
  if (!isNaN(parsed)) {
    return new Date(parsed).toISOString().slice(0, 10);
  }
  const match = String(valStr).match(/\b([0-9]{1,2})[-/.]([0-9]{1,2})[-/.]([0-9]{2,4})\b/);
  if (match) {
    const [, p1, p2, yrRaw] = match;
    const yr = yrRaw.length === 2 ? `20${yrRaw}` : yrRaw;
    const n1 = parseInt(p1, 10);
    const n2 = parseInt(p2, 10);
    const mo = n1 > 12 ? n2 : n1;
    const da = n1 > 12 ? n1 : n2;
    return `${yr}-${String(mo).padStart(2, '0')}-${String(da).padStart(2, '0')}`;
  }
  return new Date().toISOString().slice(0, 10);
}

function extractFromTextractResponse(response) {
  const expenseDocs = response.ExpenseDocuments || [];
  if (!expenseDocs.length) {
    const err = new Error('No receipt or expense document detected in the file.');
    err.code = 'NO_DOCUMENT_FOUND';
    throw err;
  }

  const doc = expenseDocs[0];
  const summaryFields = doc.SummaryFields || [];

  const getSummaryField = (typeName) => {
    const f = summaryFields.find((sf) => sf.Type?.Text === typeName);
    return {
      text: f?.ValueDetection?.Text || '',
      confidence: f?.ValueDetection?.Confidence || 0,
    };
  };

  const vendor = getSummaryField('VENDOR_NAME').text || 'Receipt Expense';
  const dateStr = getSummaryField('INVOICE_RECEIPT_DATE').text;
  const date = normalizeDate(dateStr);
  const total = normalizeAmount(getSummaryField('TOTAL').text);
  const subtotal = normalizeAmount(getSummaryField('SUBTOTAL').text);
  const tax = normalizeAmount(getSummaryField('TAX').text);

  const items = [];
  const lowConfidenceItems = [];
  const lineItemGroups = doc.LineItemGroups || [];

  for (const group of lineItemGroups) {
    const lineItems = group.LineItems || [];
    for (const item of lineItems) {
      const expenseFields = item.LineItemExpenseFields || [];

      const getExpenseField = (typeName) => {
        const field = expenseFields.find((f) => f.Type?.Text === typeName);
        return {
          text: field?.ValueDetection?.Text || '',
          confidence: field?.ValueDetection?.Confidence || 0,
        };
      };

      const nameField = getExpenseField('ITEM');
      const priceField = getExpenseField('PRICE');
      const quantityField = getExpenseField('QUANTITY');

      const name = nameField.text.trim();
      const rawPrice = priceField.text;
      const rawQty = quantityField.text;

      if (!name && !rawPrice) continue;

      const price = normalizeAmount(rawPrice);
      const quantity = rawQty ? Math.max(1, parseInt(rawQty.replace(/[^0-9]/g, '') || '1', 10)) : 1;
      const minConfidence = Math.min(nameField.confidence || 100, priceField.confidence || 100);
      const isLowConfidence = minConfidence < 80.0;

      const displayName = name || 'Unidentified Item';
      if (isLowConfidence) {
        lowConfidenceItems.push(displayName);
      }

      items.push({
        name: displayName,
        quantity,
        price,
        lowConfidence: isLowConfidence,
        confidence: Math.round(minConfidence),
      });
    }
  }

  if (items.length === 0) {
    const err = new Error('No itemized receipt line items could be detected.');
    err.code = 'NO_ITEMS_DETECTED';
    throw err;
  }

  const computedTotal = total > 0 ? total : items.reduce((acc, curr) => acc + curr.price, 0);

  return {
    vendor,
    date,
    items,
    subtotal: subtotal > 0 ? subtotal : computedTotal,
    tax,
    total: computedTotal,
    lowConfidenceItems,
  };
}

exports.handler = async (event) => {
  console.log(`[Lambda Receipt Scanner] Received ${event.Records?.length || 0} SQS records`);

  const db = await connectToDatabase();
  const receiptsCollection = db.collection('receipts');

  for (const record of event.Records || []) {
    let s3Event;
    try {
      s3Event = JSON.parse(record.body);
    } catch {
      s3Event = record.body;
    }

    const s3Records = s3Event.Records || [];
    for (const s3Record of s3Records) {
      const bucket = s3Record.s3?.bucket?.name;
      const rawKey = s3Record.s3?.object?.key;
      if (!bucket || !rawKey) continue;

      const key = decodeURIComponent(rawKey.replace(/\+/g, ' '));
      console.log(`[Processing Receipt] S3 Object: ${bucket}/${key}`);

      // Key pattern: receipts/{userId}/{receiptId}.{ext}
      const parts = key.split('/');
      const filename = parts[parts.length - 1] || '';
      const receiptIdStr = filename.split('.')[0];

      let receipt = null;
      if (ObjectId.isValid(receiptIdStr)) {
        receipt = await receiptsCollection.findOne({ _id: new ObjectId(receiptIdStr) });
      }
      if (!receipt) {
        receipt = await receiptsCollection.findOne({ s3Key: key });
      }

      // Idempotency: if already processed, skip
      if (receipt && receipt.status === 'completed') {
        console.log(`[Receipt ${receiptIdStr}] Already completed. Skipping.`);
        continue;
      }

      const receiptId = receipt ? receipt._id : (ObjectId.isValid(receiptIdStr) ? new ObjectId(receiptIdStr) : null);

      if (receiptId) {
        await receiptsCollection.updateOne(
          { _id: receiptId },
          { $set: { status: 'processing', s3Bucket: bucket, s3Key: key, updatedAt: new Date() } }
        );
      }

      // Check HEIC / HEIF format
      const lowerKey = key.toLowerCase();
      if (lowerKey.endsWith('.heic') || lowerKey.endsWith('.heif')) {
        const errorPayload = {
          code: 'UNSUPPORTED_FORMAT_HEIC',
          message: 'HEIC format from iOS is not natively supported by Textract. Please re-upload as JPEG or PNG.',
        };
        if (receiptId) {
          await receiptsCollection.updateOne(
            { _id: receiptId },
            { $set: { status: 'failed', error: errorPayload, updatedAt: new Date() } }
          );
        }
        console.warn(`[Receipt ${key}] Rejected due to HEIC format.`);
        continue; // Don't throw so SQS doesn't retry invalid format
      }

      try {
        const command = new AnalyzeExpenseCommand({
          Document: {
            S3Object: {
              Bucket: bucket,
              Name: key,
            },
          },
        });

        const startTime = Date.now();
        const response = await textractClient.send(command);
        console.log(`[Textract Completed] Duration: ${Date.now() - startTime}ms`);

        const parsedResult = extractFromTextractResponse(response);

        if (receiptId) {
          await receiptsCollection.updateOne(
            { _id: receiptId },
            {
              $set: {
                status: 'completed',
                result: parsedResult,
                error: null,
                updatedAt: new Date(),
              },
            }
          );
          console.log(`[Receipt ${receiptId}] Successfully parsed and stored ${parsedResult.items.length} items.`);
        }
      } catch (err) {
        console.error(`[Receipt Error ${key}]:`, err.name || 'Error', err.message);

        const isFatalDocError = [
          'NO_ITEMS_DETECTED',
          'NO_DOCUMENT_FOUND',
          'UnsupportedDocumentException',
          'BadDocumentException',
          'DocumentTooLargeException',
        ].includes(err.code || err.name);

        if (receiptId) {
          await receiptsCollection.updateOne(
            { _id: receiptId },
            {
              $set: {
                status: 'failed',
                error: {
                  code: err.code || err.name || 'TEXTRACT_ERROR',
                  message: err.message,
                },
                updatedAt: new Date(),
              },
            }
          );
        }

        // Only rethrow transient errors (throttling, network) so SQS retries
        if (!isFatalDocError) {
          throw err;
        }
      }
    }
  }

  return { statusCode: 200, body: 'Processed' };
};
