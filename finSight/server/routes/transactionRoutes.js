const express = require('express');
const multer = require('multer');
const {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  parseQuickAdd,
  parseBankAlertEndpoint,
  scanReceiptEndpoint,
  getDrafts,
  approveDraft,
  approveAllDrafts,
  rejectDraft,
  magicApproveDrafts,
  triggerEodReminder,
} = require('../controllers/transactionController');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Drafts & EOD Reminders
router.get('/drafts/magic-approve', magicApproveDrafts);
router.post('/drafts/eod-trigger', triggerEodReminder);
router.get('/drafts', getDrafts);
router.post('/drafts/approve-all', approveAllDrafts);
router.patch('/drafts/:id/approve', approveDraft);
router.delete('/drafts/:id', rejectDraft);

// Natural Language Quick Add & Parsers
router.post('/receipt/scan', upload.single('receipt'), scanReceiptEndpoint);
router.post('/quick-add/parse', parseQuickAdd);
router.post('/parse-bank-alert', parseBankAlertEndpoint);

// CRUD
router.get('/', getTransactions);
router.post('/', createTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;

