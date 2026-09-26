const mongoose = require('mongoose');

const automationRunSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    automation: { type: mongoose.Schema.Types.ObjectId, ref: 'Automation', required: true },
    status: { type: String, enum: ['success', 'failed'], required: true },
    message: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AutomationRun', automationRunSchema);
