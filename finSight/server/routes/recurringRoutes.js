const express = require('express');
const {
  getRecurringTemplates,
  createRecurringTemplate,
  updateRecurringTemplate,
  deleteRecurringTemplate,
  logRecurringPayment,
  initStarterPresets,
} = require('../controllers/recurringController');

const router = express.Router();

router.get('/', getRecurringTemplates);
router.post('/', createRecurringTemplate);
router.post('/presets', initStarterPresets);
router.put('/:id', updateRecurringTemplate);
router.delete('/:id', deleteRecurringTemplate);
router.post('/:id/log', logRecurringPayment);

module.exports = router;
