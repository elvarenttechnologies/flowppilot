const mongoose = require('mongoose');

const automationSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    name: { type: String, required: true, trim: true },
    trigger: { type: String, required: true },
    aiStep: { type: String, default: '' },
    action: { type: String, required: true },
    status: { type: String, enum: ['active', 'paused'], default: 'active' },
    runsCount: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Automation', automationSchema);
