const express = require('express');
const { protect } = require('../middleware/auth');
const { getSummary } = require('../controllers/analyticsController');

const router = express.Router();
router.use(protect);

router.get('/summary', getSummary);

module.exports = router;
