const express = require('express');
const { protect } = require('../middleware/auth');
const { getProjects, createProject, updateProject, deleteProject } = require('../controllers/projectController');

const router = express.Router();
router.use(protect);

router.route('/').get(getProjects).post(createProject);
router.route('/:id').put(updateProject).delete(deleteProject);

module.exports = router;
