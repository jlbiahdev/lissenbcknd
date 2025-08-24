const express = require('express');
const router = express.Router();
const controller = require('../controllers/stats.controller');

router.get('/activity/recent', controller.getRecentActivity);
router.get('/verses', controller.getVerses);
router.get('/weekly', controller.getWeeklyStats);

module.exports = router;
