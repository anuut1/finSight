const { TextractClient, AnalyzeExpenseCommand } = require('@aws-sdk/client-textract');
const { VALID_CATEGORIES } = require('./quickAddParser');

function inferCategoryFromMerchant(merchant = '') {
  const m = merchant.toLowerCase();
  if (/starbucks|cafe|coffee|restaurant|mcdonald|burger|subway|pizza|swiggy|zomato|dining|bar|grill|bakery/i.test(m)) {
    return 'Food & Dining';
  }
  if (/walmart|target|costco|blinkit|zepto|instamart|grocery|supermarket|market|safeway|trader joe|kroger/i.test(m)) {
    return 'Groceries';
  }
  if (/uber|lyft|shell|bp|chevron|petrol|fuel|gas|flight|airline|delta|united|irctc|parking|transit/i.test(m)) {
    return 'Travel';
  }
  if (/amazon|apple|zara|h&m|clothing|store|retail|electronics|best buy|nike/i.test(m)) {
    return 'Shopping';
  }
  if (/cvs|walgreens|pharmacy|hospital|health|medical|clinic|doctor|apollo/i.test(m)) {
    return 'Healthcare';
  }
  if (/cinema|theater|amc|pvr|netflix|entertainment/i.test(m)) {
    return 'Entertainment';
  }
  if (/utility|electric|water|gas bill|internet|telecom|verizon|at&t|airtel/i.test(m)) {
    return 'Bills & Utilities';
  }
  return 'Other';
}

/**
 * Normalizes price strings (e.g. "₹1,250.00", "$45.50", " 1,200 ") to numbers.
 */
function normalizeAmount(val) {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : Math.round((val + Number.EPSILON) * 100) / 100;
  }
  const str = String(val);
  const clean = str.replace(/,/g, '').replace(/[^0-9.-]/g, '');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Normalizes date strings to ISO YYYY-MM-DD format.
 */
function normalizeDate(valStr = '') {
  if (!valStr) return new Date().toISOString().slice(0, 10);
  const parsed = Date.parse(valStr);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
  }

  // Handle common DD/MM/YYYY or MM/DD/YYYY
  const match = String(valStr).match(/\b([0-9]{1,2})[-/.]([0-9]{1,2})[-/.]([0-9]{2,4})\b/);
  if (match) {
    const [, p1, p2, yr] = match;
    const year = yr.length === 2 ? `20${yr}` : yr;
    const month = Number(p1) > 12 ? p2 : p1;
    const day = Number(p1) > 12 ? p1 : p2;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  return new Date().toISOString().slice(0, 10);
}

/**
 * Extracts structured expense information from AWS Textract AnalyzeExpense response.
 *
 * Expected clean shape:
 * { vendor, date, items: [{ name, quantity, price }], subtotal, tax, total, lowConfidenceItems: [] }
 */
function extractFromTextractResponse(response) {
  const doc = response?.ExpenseDocuments?.[0];
  if (!doc) {
    const err = new Error('No expense document detected in the receipt.');
    err.code = 'NO_DOCUMENT_FOUND';
    err.statusCode = 422;
    throw err;
  }

  let vendor = '';
  let date = '';
  let total = null;
  let subtotal = null;
  let tax = null;

  // 1. Process Summary Fields (Vendor, Total, Subtotal, Tax, Date)
  if (Array.isArray(doc.SummaryFields)) {
    for (const field of doc.SummaryFields) {
      const type = field.Type?.Text?.toUpperCase() || '';
      const val = field.ValueDetection?.Text || '';

      if (!vendor && (type === 'VENDOR_NAME' || type === 'RECEIPT_HOUSE' || type === 'NAME')) {
        vendor = val.trim();
      } else if (total === null && (type === 'TOTAL' || type === 'AMOUNT_PAID' || type === 'GRAND_TOTAL')) {
        total = normalizeAmount(val);
      } else if (subtotal === null && (type === 'SUBTOTAL' || type === 'SUB_TOTAL' || type === 'NET_AMOUNT')) {
        subtotal = normalizeAmount(val);
      } else if (tax === null && (type === 'TAX' || type === 'TOTAL_TAX' || type === 'SALES_TAX' || type === 'GST' || type === 'VAT')) {
        tax = normalizeAmount(val);
      } else if (!date && (type === 'INVOICE_RECEIPT_DATE' || type === 'DATE' || type === 'TRANSACTION_DATE')) {
        date = normalizeDate(val);
      }
    }
  }

  // 2. Process Line Items (LineItemGroups -> LineItems -> LineItemExpenseFields)
  const items = [];
  const lowConfidenceItems = [];

  if (Array.isArray(doc.LineItemGroups)) {
    for (const group of doc.LineItemGroups) {
      for (const lineItem of group.LineItems || []) {
        let name = '';
        let price = null;
        let quantity = null;
        const confidences = [];

        for (const expenseField of lineItem.LineItemExpenseFields || []) {
          const fType = expenseField.Type?.Text?.toUpperCase() || '';
          const fVal = expenseField.ValueDetection?.Text || '';
          const conf = expenseField.ValueDetection?.Confidence;

          if (typeof conf === 'number') {
            confidences.push(conf);
          }

          if (fType === 'ITEM' || fType === 'DESCRIPTION' || fType === 'PRODUCT_CODE') {
            if (!name) name = fVal.trim();
          } else if (fType === 'PRICE' || fType === 'TOTAL_PRICE' || fType === 'EXTENDED_PRICE' || fType === 'UNIT_PRICE') {
            if (price === null || fType === 'PRICE' || fType === 'TOTAL_PRICE') {
              price = normalizeAmount(fVal);
            }
          } else if (fType === 'QUANTITY' || fType === 'QTY') {
            const parsedQty = parseFloat(fVal.replace(/[^0-9.]/g, ''));
            if (!isNaN(parsedQty) && parsedQty > 0) {
              quantity = parsedQty;
            }
          }
        }

        // Only register if item has a name or a price
        if (name || price !== null) {
          const itemObj = {
            name: name || 'Unlabeled Item',
            quantity: quantity !== null ? quantity : 1,
            price: price !== null ? price : 0,
          };

          const minConfidence = confidences.length > 0 ? Math.min(...confidences) : 100;
          if (minConfidence < 80) {
            lowConfidenceItems.push({
              ...itemObj,
              confidence: Math.round(minConfidence * 10) / 10,
            });
          }

          items.push(itemObj);
        }
      }
    }
  }

  // Error handling: ensure at least one item was detected
  if (items.length === 0) {
    const noItemsErr = new Error(
      'No line items detected on receipt. Please ensure the receipt is clear, well-lit, and contains itemized items and prices.'
    );
    noItemsErr.code = 'NO_ITEMS_DETECTED';
    noItemsErr.statusCode = 422;
    throw noItemsErr;
  }

  // Compute calculated fallbacks for missing summary fields
  const calculatedSubtotal = Math.round((items.reduce((sum, item) => sum + item.price, 0) + Number.EPSILON) * 100) / 100;
  if (subtotal === null) {
    subtotal = calculatedSubtotal;
  }
  if (tax === null) {
    tax = 0;
  }
  if (total === null) {
    total = Math.round((subtotal + tax + Number.EPSILON) * 100) / 100;
  }
  if (!date) {
    date = new Date().toISOString().slice(0, 10);
  }
  if (!vendor) {
    vendor = 'Receipt Vendor';
  }

  const category = inferCategoryFromMerchant(vendor);

  return {
    vendor,
    date,
    items,
    subtotal,
    tax,
    total,
    lowConfidenceItems,
    // Backward compatibility aliases
    merchant: vendor,
    amount: total,
    category,
    description: vendor,
    lineItems: items.map((it) => ({
      description: it.quantity > 1 ? `${it.quantity}x ${it.name}` : it.name,
      name: it.name,
      quantity: it.quantity,
      price: it.price,
    })),
    source: 'aws-textract',
  };
}

/**
 * Validate input mime type and size before sending to AWS Textract.
 */
function validateReceiptInput(input, mimeType) {
  const isBuffer = Buffer.isBuffer(input);

  if (isBuffer) {
    const normalizedMime = (mimeType || 'image/jpeg').toLowerCase();
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

    if (normalizedMime === 'image/heic' || normalizedMime === 'image/heif') {
      const err = new Error(
        'HEIC format from iPhones is not supported directly by AWS Textract. Please convert to JPEG or PNG before uploading.'
      );
      err.code = 'UNSUPPORTED_FILE_TYPE';
      err.statusCode = 400;
      throw err;
    }

    if (normalizedMime === 'image/webp') {
      const err = new Error(
        'WebP format is not supported by AWS Textract. Please upload a JPEG, PNG, or PDF file.'
      );
      err.code = 'UNSUPPORTED_FILE_TYPE';
      err.statusCode = 400;
      throw err;
    }

    if (!allowedMimes.includes(normalizedMime)) {
      const err = new Error(
        `Unsupported file type (${mimeType}). AWS Textract supports JPEG, PNG, and PDF files.`
      );
      err.code = 'UNSUPPORTED_FILE_TYPE';
      err.statusCode = 400;
      throw err;
    }

    // AWS Textract synchronous limit is 10 MB (10,485,760 bytes)
    const MAX_SYNC_BYTES = 10 * 1024 * 1024;
    if (input.length > MAX_SYNC_BYTES) {
      const err = new Error('File size exceeds the 10MB limit for AWS Textract.');
      err.code = 'FILE_TOO_LARGE';
      err.statusCode = 400;
      throw err;
    }
  }
}

/**
 * Main AnalyzeExpense entry point.
 * Sends image bytes or S3 object to AWS Textract AnalyzeExpense.
 */
async function analyzeReceiptExpense(input, mimeType = 'image/jpeg') {
  validateReceiptInput(input, mimeType);

  // Optional mock mode for local testing without live AWS credentials
  if (process.env.TEXTRACT_MOCK === 'true') {
    return {
      vendor: 'Starbucks Indiranagar',
      date: '2026-10-03',
      items: [
        { name: 'Caffè Mocha (Grande)', quantity: 1, price: 345.00 },
        { name: 'Blueberry Muffin', quantity: 1, price: 220.00 },
        { name: 'Carry Bag', quantity: 1, price: 15.00 },
      ],
      subtotal: 580.00,
      tax: 28.25,
      total: 608.25,
      lowConfidenceItems: [
        { name: 'Carry Bag', quantity: 1, price: 15.00, confidence: 68.5 },
      ],
      merchant: 'Starbucks Indiranagar',
      amount: 608.25,
      category: 'Food & Dining',
      description: 'Starbucks Indiranagar',
      lineItems: [
        { description: 'Caffè Mocha (Grande)', name: 'Caffè Mocha (Grande)', quantity: 1, price: 345.00 },
        { description: 'Blueberry Muffin', name: 'Blueberry Muffin', quantity: 1, price: 220.00 },
        { description: 'Carry Bag', name: 'Carry Bag', quantity: 1, price: 15.00 },
      ],
      source: 'mock-test',
    };
  }

  const isBuffer = Buffer.isBuffer(input);
  const isS3Object = input && typeof input === 'object' && input.bucket && input.key;

  try {
    const clientConfig = {
      region: process.env.AWS_REGION || 'ap-south-1',
    };

    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      clientConfig.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      };
    }

    const client = new TextractClient(clientConfig);

    const documentParam = isS3Object
      ? { S3Object: { Bucket: input.bucket, Name: input.key } }
      : { Bytes: isBuffer ? input : Buffer.from(input) };

    const command = new AnalyzeExpenseCommand({
      Document: documentParam,
    });

    const response = await client.send(command);

    // Requirement 5: Log raw Textract response in development only
    if (process.env.NODE_ENV === 'development') {
      console.log('[AWS Textract Raw Response]:', JSON.stringify(response, null, 2));
    }

    return extractFromTextractResponse(response);
  } catch (err) {
    // If the error was already structured (e.g. NO_ITEMS_DETECTED), rethrow directly
    if (err.code === 'NO_ITEMS_DETECTED' || err.code === 'NO_DOCUMENT_FOUND') {
      throw err;
    }

    if (process.env.NODE_ENV === 'development') {
      console.error('[AWS Textract Error]:', err.name, err.message);
    }

    let userMessage = `Textract AnalyzeExpense failed: ${err.message}`;
    let statusCode = 502;

    if (err.name === 'SubscriptionRequiredException') {
      userMessage =
        `AWS Textract subscription required. The AWS account needs an active subscription for Amazon Textract in region '${process.env.AWS_REGION || 'ap-south-1'}'. Please visit the AWS Management Console to activate Textract.`;
      statusCode = 400;
    } else if (err.name === 'AccessDeniedException') {
      userMessage =
        "AWS Textract access denied. The IAM user/role lacks 'textract:AnalyzeExpense' permission.";
      statusCode = 403;
    } else if (err.name === 'UnsupportedDocumentException') {
      userMessage = 'Unsupported document format. AWS Textract supports JPEG, PNG, and PDF files.';
      statusCode = 400;
    } else if (err.name === 'BadDocumentException') {
      userMessage = 'Corrupt or unreadable document. Please provide a clear, valid image file.';
      statusCode = 400;
    } else if (err.name === 'DocumentTooLargeException') {
      userMessage = 'File size is too large for AWS Textract (maximum 10MB).';
      statusCode = 400;
    }

    const customErr = new Error(userMessage);
    customErr.name = err.name || 'TextractError';
    customErr.code = err.name;
    customErr.statusCode = statusCode;
    throw customErr;
  }
}

module.exports = {
  analyzeReceiptExpense,
  inferCategoryFromMerchant,
  extractFromTextractResponse,
  normalizeAmount,
  normalizeDate,
  validateReceiptInput,
};
