const Client = require('../models/Client');
const pick = require('../utils/pick');

const UPDATABLE_FIELDS = ['name', 'email', 'company', 'status', 'notes'];

async function getClients(req, res, next) {
  try {
    const clients = await Client.find({ workspace: req.user.workspace._id }).sort({ createdAt: -1 });
    res.json(clients);
  } catch (err) {
    next(err);
  }
}

async function createClient(req, res, next) {
  try {
    const { name, email, company, status, notes } = req.body;
    if (!name) return res.status(400).json({ message: 'Client name is required.' });

    const client = await Client.create({
      workspace: req.user.workspace._id,
      name,
      email,
      company,
      status,
      notes,
    });
    res.status(201).json(client);
  } catch (err) {
    next(err);
  }
}

async function updateClient(req, res, next) {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, workspace: req.user.workspace._id },
      pick(req.body, UPDATABLE_FIELDS),
      { new: true, runValidators: true }
    );
    if (!client) return res.status(404).json({ message: 'Client not found.' });
    res.json(client);
  } catch (err) {
    next(err);
  }
}

async function deleteClient(req, res, next) {
  try {
    const client = await Client.findOneAndDelete({ _id: req.params.id, workspace: req.user.workspace._id });
    if (!client) return res.status(404).json({ message: 'Client not found.' });
    res.json({ message: 'Client deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getClients, createClient, updateClient, deleteClient };
