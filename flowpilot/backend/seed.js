// Populates your MongoDB Atlas database with a demo workspace so you have
// something to look at immediately. Run with: npm run seed

require('dotenv').config();
const connectDB = require('./config/db');
const mongoose = require('mongoose');

const User = require('./models/User');
const Workspace = require('./models/Workspace');
const Client = require('./models/Client');
const Project = require('./models/Project');
const Task = require('./models/Task');
const Automation = require('./models/Automation');
const AutomationRun = require('./models/AutomationRun');

const DEMO_EMAIL = 'demo@flowpilot.com';
const DEMO_PASSWORD = 'Demo12345!';

async function seed() {
  await connectDB();

  const existing = await User.findOne({ email: DEMO_EMAIL });
  if (existing) {
    console.log('Demo account already exists. Skipping seed.');
    console.log(`Log in with: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
    return mongoose.disconnect();
  }

  const tempUser = new User({ name: 'Demo Owner', email: DEMO_EMAIL, password: DEMO_PASSWORD, role: 'owner' });
  const workspace = await Workspace.create({ name: 'Ferra Studio (Demo)', plan: 'growth', owner: tempUser._id });
  tempUser.workspace = workspace._id;
  await tempUser.save();

  const clients = await Client.insertMany([
    { workspace: workspace._id, name: 'Rania Saeed', email: 'rania@halcyon.com', company: 'Halcyon', status: 'active' },
    { workspace: workspace._id, name: 'Dev Kapoor', email: 'dev@ferra.studio', company: 'Ferra Studio', status: 'active' },
    { workspace: workspace._id, name: 'Mara Tan', email: 'mara@northwind.co', company: 'Northwind', status: 'lead' },
  ]);

  const projects = await Project.insertMany([
    { workspace: workspace._id, client: clients[0]._id, name: 'Client Onboarding Revamp', status: 'active', progress: 70 },
    { workspace: workspace._id, client: clients[1]._id, name: 'Website Redesign', status: 'active', progress: 40 },
    { workspace: workspace._id, client: clients[2]._id, name: 'Q4 Ops Audit', status: 'planning', progress: 10 },
  ]);

  await Task.insertMany([
    { workspace: workspace._id, project: projects[0]._id, title: 'Draft onboarding email template', status: 'done', priority: 'high' },
    { workspace: workspace._id, project: projects[0]._id, title: 'Set up client welcome workflow', status: 'in-progress', priority: 'high' },
    { workspace: workspace._id, project: projects[1]._id, title: 'Wireframe homepage', status: 'done', priority: 'medium' },
    { workspace: workspace._id, project: projects[1]._id, title: 'Review copy with client', status: 'todo', priority: 'medium' },
    { workspace: workspace._id, project: projects[2]._id, title: 'Collect Q3 automation logs', status: 'todo', priority: 'low' },
  ]);

  const automations = await Automation.insertMany([
    {
      workspace: workspace._id,
      name: 'Follow up with leads',
      trigger: 'Lead inactive 3 days',
      aiStep: 'Draft a personalized follow-up email matching our tone',
      action: 'Send email & log activity',
      status: 'active',
      runsCount: 0,
      successCount: 0,
    },
    {
      workspace: workspace._id,
      name: 'New client onboarding',
      trigger: 'New client added to FlowPilot',
      aiStep: 'Draft onboarding email & task list',
      action: 'Send email, create 4 tasks',
      status: 'active',
      runsCount: 0,
      successCount: 0,
    },
  ]);

  // Backfill 7 days of automation run history so the dashboard chart isn't empty
  const runs = [];
  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const runsToday = 4 + Math.floor(Math.random() * 10);
    for (let r = 0; r < runsToday; r += 1) {
      const automation = automations[Math.floor(Math.random() * automations.length)];
      const succeeded = Math.random() < 0.93;
      runs.push({
        workspace: workspace._id,
        automation: automation._id,
        status: succeeded ? 'success' : 'failed',
        message: succeeded ? `${automation.action} completed successfully.` : `${automation.action} failed.`,
        createdAt: day,
      });
      automation.runsCount += 1;
      if (succeeded) automation.successCount += 1;
    }
  }
  await AutomationRun.insertMany(runs);
  await Promise.all(automations.map((a) => a.save()));

  console.log('\nDemo data created successfully!');
  console.log('----------------------------------------');
  console.log(`Log in at /login.html with:`);
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log('----------------------------------------\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
