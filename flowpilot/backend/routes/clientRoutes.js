const express = require('express');
const { protect } = require('../middleware/auth');
const { getClients, createClient, updateClient, deleteClient } = require('../controllers/clientController');

const router = express.Router();
router.use(protect);

router.route('/').get(getClients).post(createClient);
router.route('/:id').put(updateClient).delete(deleteClient);

module.exports = router;
