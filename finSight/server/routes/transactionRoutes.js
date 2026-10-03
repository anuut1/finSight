const express = require('express');
const {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  parseQuickAdd,
  parseBankAlertEndpoint,
} = require('../controllers/transactionController');

const router = express.Router();

router.post('/quick-add/parse', parseQuickAdd);
router.post('/parse-bank-alert', parseBankAlertEndpoint);
router.get('/', getTransactions);
router.post('/', createTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;

