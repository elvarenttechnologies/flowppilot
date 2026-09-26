const Automation = require('../models/Automation');
const AutomationRun = require('../models/AutomationRun');
const pick = require('../utils/pick');

const UPDATABLE_FIELDS = ['name', 'trigger', 'aiStep', 'action', 'status'];

async function getAutomations(req, res, next) {
  try {
    const automations = await Automation.find({ workspace: req.user.workspace._id }).sort({ createdAt: -1 });
    res.json(automations);
  } catch (err) {
    next(err);
  }
}

async function createAutomation(req, res, next) {
  try {
    const { name, trigger, aiStep, action, status } = req.body;
    if (!name || !trigger || !action) {
      return res.status(400).json({ message: 'Name, trigger and action are required.' });
    }

    const automation = await Automation.create({
      workspace: req.user.workspace._id,
      name,
      trigger,
      aiStep,
      action,
      status,
    });
    res.status(201).json(automation);
  } catch (err) {
    next(err);
  }
}

async function updateAutomation(req, res, next) {
  try {
    const automation = await Automation.findOneAndUpdate(
      { _id: req.params.id, workspace: req.user.workspace._id },
      pick(req.body, UPDATABLE_FIELDS),
      { new: true, runValidators: true }
    );
    if (!automation) return res.status(404).json({ message: 'Automation not found.' });
    res.json(automation);
  } catch (err) {
    next(err);
  }
}

async function deleteAutomation(req, res, next) {
  try {
    const automation = await Automation.findOneAndDelete({ _id: req.params.id, workspace: req.user.workspace._id });
    if (!automation) return res.status(404).json({ message: 'Automation not found.' });
    res.json({ message: 'Automation deleted.' });
  } catch (err) {
    next(err);
  }
}

// POST /api/automations/:id/run  -> simulates one execution and logs it
async function runAutomation(req, res, next) {
  try {
    const automation = await Automation.findOne({ _id: req.params.id, workspace: req.user.workspace._id });
    if (!automation) return res.status(404).json({ message: 'Automation not found.' });

    const succeeded = Math.random() < 0.92; // ~92% success rate, like a real automation
    const run = await AutomationRun.create({
      workspace: req.user.workspace._id,
      automation: automation._id,
      status: succeeded ? 'success' : 'failed',
      message: succeeded
        ? `${automation.action} completed successfully.`
        : `${automation.action} failed - will retry automatically.`,
    });

    automation.runsCount += 1;
    if (succeeded) automation.successCount += 1;
    await automation.save();

    res.status(201).json({ automation, run });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAutomations, createAutomation, updateAutomation, deleteAutomation, runAutomation };
