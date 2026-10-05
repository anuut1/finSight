const express = require('express');
const { generateReceiptUploadUrl, generateReceiptViewUrl, bucketName } = require('../services/s3Service');
const { analyzeReceiptExpense } = require('../services/textractService');

const router = express.Router();

/**
 * POST /api/receipts/presigned-url
 * Returns a pre-signed S3 upload URL for direct client-side upload.
 */
router.post('/presigned-url', async (req, res) => {
  try {
    const { contentType = 'image/jpeg' } = req.body;
    const data = await generateReceiptUploadUrl(req.user.id, contentType);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('Error generating pre-signed S3 URL:', err);
    return res.status(500).json({ success: false, message: 'Could not generate upload URL' });
  }
});

/**
 * POST /api/receipts/analyze-s3
 * Analyzes a receipt previously uploaded to S3 via Textract.
 */
router.post('/analyze-s3', async (req, res) => {
  try {
    const { key } = req.body;
    if (!key) {
      return res.status(400).json({ success: false, message: 'S3 object key is required' });
    }

    const result = await analyzeReceiptExpense({ bucket: bucketName, key });
    const viewUrl = await generateReceiptViewUrl(key);

    return res.json({
      success: true,
      data: {
        ...result,
        receiptUrl: viewUrl,
        s3Key: key,
      },
    });
  } catch (err) {
    console.error('Error analyzing S3 receipt:', err);
    return res.status(500).json({ success: false, message: 'Failed to analyze receipt from S3' });
  }
});

module.exports = router;
