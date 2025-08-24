const { Verse, MeditativeVerse } = require('../models');
const { Op } = require('sequelize');

async function getRecentActivity() {
  return await Verse.find().sort({ createdAt: -1 }).limit(10);
}

async function getVerses() {
    console.log("stats.service:: Fetching verses...");
    const total = await Verse.count();

    console.log(`stats.service:: Fetched total verses: ${total}`);
    // versets taggés méditatifs
    const meditatives = await MeditativeVerse.count();

    console.log(`stats.service:: Fetched meditative verses: ${meditatives}`);
    // versets approuvés
    const approved = await MeditativeVerse.count({ where: { verseApproved: true } });

    console.log(`stats.service:: Fetched approved verses: ${approved}`);
  
    // en attente = pas approuvés OU pas de commentaire
    const pending = await MeditativeVerse.count({
      where: {
        [Op.or]: [
          { verseApproved: false },
          { commentApproved: false },
          { commentary: null },
          { commentary: "" }
        ]
      }
    });
    console.log(`stats.service:: Fetched pending verses: ${pending}`);

    return { total, meditatives, approved, pending };
}

async function getWeeklyStats() {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  return await Verse.aggregate([
    { $match: { createdAt: { $gte: startOfWeek } } },
    { $group: { _id: null, count: { $sum: 1 } } },
  ]);
}

module.exports = {
  getRecentActivity,
  getVerses,
  getWeeklyStats,
};
