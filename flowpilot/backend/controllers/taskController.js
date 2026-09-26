const Task = require('../models/Task');
const pick = require('../utils/pick');

const UPDATABLE_FIELDS = ['title', 'description', 'status', 'priority', 'project', 'assignee', 'dueDate'];

async function getTasks(req, res, next) {
  try {
    const filter = { workspace: req.user.workspace._id };
    if (req.query.project) filter.project = req.query.project;
    if (req.query.status) filter.status = req.query.status;

    const tasks = await Task.find(filter)
      .populate('project', 'name')
      .populate('assignee', 'name')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
}

async function createTask(req, res, next) {
  try {
    const { title, description, status, priority, project, assignee, dueDate } = req.body;
    if (!title) return res.status(400).json({ message: 'Task title is required.' });

    const task = await Task.create({
      workspace: req.user.workspace._id,
      title,
      description,
      status,
      priority,
      project: project || null,
      assignee: assignee || null,
      dueDate: dueDate || null,
    });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, workspace: req.user.workspace._id },
      pick(req.body, UPDATABLE_FIELDS),
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    res.json(task);
  } catch (err) {
    next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, workspace: req.user.workspace._id });
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    res.json({ message: 'Task deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getTasks, createTask, updateTask, deleteTask };
