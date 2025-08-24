const service = require('../services/stats.service');

async function getRecentActivity(req, res) {
  try {
    const activity = await service.getRecentActivity();
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getVerses(req, res) {
  try {
    console.log("stats.controller:: Fetching verses...");
    const verses = await service.getVerses();
    res.json(verses);
  } catch (error) {
    console.error("stats.controller:: Error fetching verses:", error);
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
