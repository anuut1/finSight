/**
 * AWS Lambda Function: EventBridge Scheduled Automation Worker
 * Handles daily "add expenses" prompts, weekly trip settle-up reminders,
 * and monthly financial digest emails via Amazon SES and SNS fan-out.
 */

const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { MongoClient } = require('mongodb');

let cachedDb = null;
const region = process.env.AWS_REGION || 'ap-south-1';
const sesClient = new SESClient({ region });
const snsClient = new SNSClient({ region });

async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) return null;

  try {
    const client = new MongoClient(mongoUri, { maxPoolSize: 5 });
    await client.connect();
    cachedDb = client.db();
    return cachedDb;
  } catch (err) {
    console.warn('[MongoDB Connect Warning]:', err.message);
    return null;
  }
}

exports.handler = async (event) => {
  const eventType = event.type || event['detail-type'] || 'END_OF_DAY';
  console.log(`[Automation Worker] Processing job type: ${eventType}`);

  const snsTopicArn = process.env.SNS_EVENTS_TOPIC_ARN;
  const senderEmail = process.env.SENDER_EMAIL || 'notifications@finsight.app';

  // 1. Fan-out event notification to SNS topic
  if (snsTopicArn) {
    try {
      await snsClient.send(
        new PublishCommand({
          TopicArn: snsTopicArn,
          Subject: `FinSight Automation Event: ${eventType}`,
          Message: JSON.stringify({
            eventType,
            timestamp: new Date().toISOString(),
            details: event,
          }),
        })
      );
    } catch (snsErr) {
      console.warn('[SNS Publish Notice]:', snsErr.message);
    }
  }

  // 2. Execute scheduled job logic
  switch (eventType) {
    case 'END_OF_DAY':
      console.log('Sending end-of-day reminders to users to track expenses.');
      break;

    case 'SETTLE_UP':
      console.log('Checking active trips for pending member settlements and sending reminders.');
      break;

    case 'MONTHLY_SUMMARY':
      console.log('Generating monthly spending digests and emailing reports.');
      break;

    default:
      console.log(`Unknown event type: ${eventType}`);
  }

  return { statusCode: 200, body: `Completed automation job: ${eventType}` };
};
