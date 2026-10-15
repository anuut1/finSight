const express = require('express');
const router = express.Router();
const demoController = require('../controllers/demoController');

router.post('/seed', demoController.seedDemoData);
router.post('/reset', demoController.resetDemoData);

module.exports = router;
