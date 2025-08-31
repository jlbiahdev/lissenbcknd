// controllers/stats.controller.js
const service = require('../services/stats.service');

async function getRecentActivity(req, res) {
  try {
    const activity = await service.getRecentActivity();
    res.json(activity);
  } catch (error) {
    console.error("stats.controller:: Error fetching recent activity:", error);
    res.status(500).json({ error: error.message });
  }
}

async function getVerses(req, res) {
  try {
    const verses = await service.getVerses();
    res.json(verses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getWeeklyStats(req, res) {
  try {
    const stats = await service.getWeeklyStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getRecentActivity,
  getVerses,
  getWeeklyStats,
};
