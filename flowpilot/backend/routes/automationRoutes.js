const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getAutomations,
  createAutomation,
  updateAutomation,
  deleteAutomation,
  runAutomation,
} = require('../controllers/automationController');

const router = express.Router();
router.use(protect);

router.route('/').get(getAutomations).post(createAutomation);
router.route('/:id').put(updateAutomation).delete(deleteAutomation);
router.post('/:id/run', runAutomation);

module.exports = router;
