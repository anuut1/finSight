const express = require('express');
const {
  getGroups,
  createGroup,
  addExpense,
  addSettlement,
  deleteGroup,
  getActiveTrip,
  startTrip,
  endTrip,
  getTripSummary,
} = require('../controllers/splitController');

const router = express.Router();

router.get('/trips/active', getActiveTrip);
router.post('/trips/start', startTrip);
router.post('/trips/:groupId/end', endTrip);
router.get('/trips/:groupId/summary', getTripSummary);

router.get('/groups', getGroups);
router.post('/groups', createGroup);
router.delete('/groups/:groupId', deleteGroup);
router.post('/groups/:groupId/expenses', addExpense);
router.post('/groups/:groupId/settlements', addSettlement);

module.exports = router;
