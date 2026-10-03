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
} = require('../controllers/transactionController');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

router.post('/receipt/scan', upload.single('receipt'), scanReceiptEndpoint);
router.post('/quick-add/parse', parseQuickAdd);
router.post('/parse-bank-alert', parseBankAlertEndpoint);
router.get('/', getTransactions);
router.post('/', createTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;

