const Project = require('../models/Project');
const Task = require('../models/Task');
const Client = require('../models/Client');
const Automation = require('../models/Automation');
const AutomationRun = require('../models/AutomationRun');

// GET /api/analytics/summary
async function getSummary(req, res, next) {
  try {
    const workspaceId = req.user.workspace._id;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [activeProjects, totalClients, tasksCompletedThisMonth, totalTasks, automations] = await Promise.all([
      Project.countDocuments({ workspace: workspaceId, status: 'active' }),
      Client.countDocuments({ workspace: workspaceId }),
      Task.countDocuments({ workspace: workspaceId, status: 'done', updatedAt: { $gte: startOfMonth } }),
      Task.countDocuments({ workspace: workspaceId }),
      Automation.find({ workspace: workspaceId }),
    ]);

    const totalRuns = automations.reduce((sum, a) => sum + a.runsCount, 0);
    const totalSuccess = automations.reduce((sum, a) => sum + a.successCount, 0);
    const successRate = totalRuns > 0 ? Math.round((totalSuccess / totalRuns) * 100) : 0;

    // Runs per day for the last 7 days, for the bar chart.
    // Bucketed in UTC consistently (both the range start and each run's key)
    // so the day a run lands in doesn't shift depending on the server's
    // local timezone.
    const now = new Date();
    const sevenDaysAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6));

    const runs = await AutomationRun.find({ workspace: workspaceId, createdAt: { $gte: sevenDaysAgo } });

    const dayBuckets = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sevenDaysAgo);
      d.setUTCDate(d.getUTCDate() + i);
      return { date: d.toISOString().slice(0, 10), count: 0 };
    });

    runs.forEach((run) => {
      const key = run.createdAt.toISOString().slice(0, 10);
      const bucket = dayBuckets.find((b) => b.date === key);
      if (bucket) bucket.count += 1;
    });

    res.json({
      activeProjects,
      totalClients,
      tasksCompletedThisMonth,
      totalTasks,
      automationSuccessRate: successRate,
      runsLast7Days: dayBuckets,
      totalAutomationRuns: totalRuns,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSummary };
