const Project = require('../models/Project');
const pick = require('../utils/pick');

const UPDATABLE_FIELDS = ['name', 'description', 'status', 'progress', 'client'];

async function getProjects(req, res, next) {
  try {
    const projects = await Project.find({ workspace: req.user.workspace._id })
      .populate('client', 'name company')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    next(err);
  }
}

async function createProject(req, res, next) {
  try {
    const { name, description, status, progress, client } = req.body;
    if (!name) return res.status(400).json({ message: 'Project name is required.' });

    const project = await Project.create({
      workspace: req.user.workspace._id,
      name,
      description,
      status,
      progress,
      client: client || null,
    });
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
}

async function updateProject(req, res, next) {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, workspace: req.user.workspace._id },
      pick(req.body, UPDATABLE_FIELDS),
      { new: true, runValidators: true }
    );
    if (!project) return res.status(404).json({ message: 'Project not found.' });
    res.json(project);
  } catch (err) {
    next(err);
  }
}

async function deleteProject(req, res, next) {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, workspace: req.user.workspace._id });
    if (!project) return res.status(404).json({ message: 'Project not found.' });
    res.json({ message: 'Project deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProjects, createProject, updateProject, deleteProject };
