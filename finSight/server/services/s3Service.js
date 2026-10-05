const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');

const region = process.env.AWS_REGION || 'ap-south-1';
const bucketName = process.env.AWS_RECEIPTS_BUCKET || 'finsight-receipts-private-prod';

// S3 Client automatically resolves credentials:
// 1. In AWS App Runner / ECS: via IAM Task/Instance Role
// 2. Locally: via AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY or ~/.aws/credentials
const s3Client = new S3Client({
  region,
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

/**
 * Generate a pre-signed S3 upload URL for direct, secure browser uploads.
 * This ensures large images never consume backend RAM or bandwidth.
 *
 * @param {string} userId - ID of the user uploading the receipt
 * @param {string} contentType - MIME type (image/jpeg, image/png, image/webp)
 * @returns {Promise<{ uploadUrl: string, key: string, bucket: string, expiresIn: number }>}
 */
async function generateReceiptUploadUrl(userId, contentType = 'image/jpeg') {
  const fileId = crypto.randomUUID();
  const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
  const key = `receipts/${userId}/${fileId}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  // URL expires in 15 minutes (900 seconds)
  const expiresIn = 900;
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

  return {
    uploadUrl,
    key,
    bucket: bucketName,
    expiresIn,
  };
}

/**
 * Generate a pre-signed S3 download/view URL for a private receipt.
 *
 * @param {string} key - S3 object key
 * @returns {Promise<string>} Pre-signed download URL valid for 1 hour
 */
async function generateReceiptViewUrl(key) {
  if (!key) return null;

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

module.exports = {
  s3Client,
  bucketName,
  generateReceiptUploadUrl,
  generateReceiptViewUrl,
};
