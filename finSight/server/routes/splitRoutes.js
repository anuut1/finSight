const express = require('express');
const {
  getGroups,
  createGroup,
  addExpense,
  addSettlement,
  deleteGroup,
} = require('../controllers/splitController');

const router = express.Router();

router.get('/groups', getGroups);
router.post('/groups', createGroup);
router.delete('/groups/:groupId', deleteGroup);
router.post('/groups/:groupId/expenses', addExpense);
router.post('/groups/:groupId/settlements', addSettlement);

module.exports = router;
