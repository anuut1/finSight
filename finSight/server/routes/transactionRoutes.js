const express = require('express');
const {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  parseQuickAdd,
} = require('../controllers/transactionController');

const router = express.Router();

router.post('/quick-add/parse', parseQuickAdd);
router.get('/', getTransactions);
router.post('/', createTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;

