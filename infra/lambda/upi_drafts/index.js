/**
 * AWS Lambda Function: Trip-Mode UPI Draft Ingestion
 * Invoked by API Gateway HTTP endpoint: POST /upi/drafts
 * Parses incoming payment strings/webhooks, runs Bedrock cleanup,
 * and saves draft payments to MongoDB for trip expense assignment or polling.
 */

const { MongoClient, ObjectId } = require('mongodb');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

let cachedDb = null;
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'ap-south-1',
});

async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGO_URI is missing');

  const client = new MongoClient(mongoUri, { maxPoolSize: 5 });
  await client.connect();
  const db = client.db();
  cachedDb = db;
  return db;
}

function cleanMerchantRuleBased(raw = '') {
  let clean = raw
    .replace(/(?:UPI|VPA|P2A|P2M|IMPS|NEFT|Ref|Txn|ID|No|Auth)[\s/:#-]*[a-zA-Z0-9_-]+/gi, '')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+/g, '')
    .replace(/paid to|debited for|spent at|towards/gi, '')
    .replace(/[^a-zA-Z0-9\s&'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return clean && clean.length >= 2 ? clean : 'UPI Payment';
}

exports.handler = async (event) => {
  console.log('[UPI Draft Ingestion] Request received');

  try {
    let body = {};
    if (event.body) {
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    }

    const { rawText = '', amount = 0, tripId, userId, upiRef = '' } = body;

    if (!amount || Number(amount) <= 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'Valid amount greater than 0 is required' }),
      };
    }

    let cleanMerchant = cleanMerchantRuleBased(rawText);
    let category = 'Food & Dining';

    // Attempt Bedrock AI cleanup if model configured
    try {
      const prompt = `Clean this messy Indian UPI text into a clean merchant name and assign category (Food & Dining, Groceries, Travel, Shopping, Bills & Utilities, Entertainment, Other):
Raw text: "${rawText}"
Respond strictly with JSON: {"cleanMerchant": "Name", "category": "Category"}`;

      const command = new InvokeModelCommand({
        modelId: process.env.BEDROCK_MODEL_ID || 'amazon.titan-text-express-v1',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          inputText: prompt,
          textGenerationConfig: { maxTokenCount: 100, temperature: 0.1 },
        }),
      });

      const bedrockRes = await bedrockClient.send(command);
      const resBody = JSON.parse(new TextDecoder().decode(bedrockRes.body));
      const text = resBody.results?.[0]?.outputText || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.cleanMerchant) cleanMerchant = parsed.cleanMerchant;
        if (parsed.category) category = parsed.category;
      }
    } catch (aiErr) {
      console.warn('[Bedrock fallback used]:', aiErr.message);
    }

    const db = await connectToDatabase();
    const draftsCollection = db.collection('upidrafts');

    const draftDoc = {
      userId: userId && ObjectId.isValid(userId) ? new ObjectId(userId) : null,
      tripId: tripId && ObjectId.isValid(tripId) ? new ObjectId(tripId) : null,
      rawText,
      cleanMerchant,
      amount: Number(amount),
      category,
      upiRef,
      status: 'pending_assignment',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const insertResult = await draftsCollection.insertOne(draftDoc);

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        data: {
          draftId: insertResult.insertedId,
          cleanMerchant,
          amount: Number(amount),
          category,
          status: 'pending_assignment',
        },
      }),
    };
  } catch (err) {
    console.error('[UPI Ingestion Error]:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: err.message || 'Internal server error' }),
    };
  }
};
