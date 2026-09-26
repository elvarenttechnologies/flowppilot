const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['planning', 'active', 'on-hold', 'completed'], default: 'planning' },
    progress: { type: Number, min: 0, max: 100, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
