// services/stats.service.js
const { Verse } = require('../models');
const { Op } = require('sequelize');
const sequelize = require("../config/db");

// ------------------------------------------------------------------
// getRecentActivity()
// - Avant : événements tirés de meditative_verses
// - Maintenant : on base les événements sur commentaries + commentary_verses
//   * create  : mv.created_at (commentary_verses)
//   * comment : m.updated_at (commentaries) si commentary non vide
//   * approve : m.updated_at (commentaries) si approved = true
//   On émet un événement PAR VERSE lié (comme avant).
// ------------------------------------------------------------------
async function getRecentActivity() {
  const sql = `
    WITH ev AS (
      -- Créations : création du lien verse<->meditation
      SELECT
        mv.verse_id AS verse_id,
        'create'    AS ev_type,
        mv.created_at AS at
      FROM commentary_verses mv

      UNION ALL

      -- Commentaires : MAJ du commentary d'une meditation (répliqué sur chaque vers lié)
      SELECT
        mv.verse_id AS verse_id,
        'comment'   AS ev_type,
        m.updated_at AS at
      FROM commentaries m
      JOIN commentary_verses mv ON mv.commentary_id = m.id
      WHERE m.updated_at IS NOT NULL
        AND NULLIF(TRIM(m.text), '') IS NOT NULL

      UNION ALL

      -- Approbations : approved = TRUE, date = updated_at (répliqué sur chaque vers lié)
      SELECT
        mv.verse_id AS verse_id,
        'approve'   AS ev_type,
        m.updated_at AS at
      FROM commentaries m
      JOIN commentary_verses mv ON mv.commentary_id = m.id
      WHERE m.approved = TRUE
    )
    SELECT
      e.ev_type,
      e.at,
      v.id                AS verse_id,
      b.name              AS book_name,
      c.number            AS chapter_num,
      v.number            AS verse_num
    FROM ev e
    JOIN verses v   ON v.id = e.verse_id
    JOIN chapters c ON c.id = v.chapter_id
    JOIN books b    ON b.id = c.book_id
    WHERE e.at IS NOT NULL
    ORDER BY e.at DESC
  `;

  const rows = await sequelize.query(sql, {
    type: sequelize.QueryTypes.SELECT,
  });

  const out = rows.map(r => ({
    id: `${r.ev_type}_${r.verse_id}_${new Date(r.at).getTime()}`,
    type: r.ev_type, // 'create' | 'comment' | 'approve'
    label: `${r.book_name} ${r.chapter_num}:${r.verse_num} — ${
      r.ev_type === 'create' ? 'créé' : r.ev_type === 'comment' ? 'commenté' : 'approuvé'
    }`,
    atISO: new Date(r.at).toISOString(),
  }));

  return out;
}

// ------------------------------------------------------------------
// getVerses()
// - total        : Verse.count()
// - meditatives  : nb de versets liés à une meditation (distinct verse_id)
// - approved     : nb de versets liés à une meditation approuvée
// - pending      : nb de versets liés à une meditation non approuvée OU sans commentaire
//                  (on évalue au niveau de la meditation liée)
// ------------------------------------------------------------------
async function getVerses() {
  const total = await Verse.count();

  const qMeditatives = `
    SELECT COUNT(DISTINCT mv.verse_id)::int AS n
    FROM commentary_verses mv
  `;
  const qApproved = `
    SELECT COUNT(DISTINCT mv.verse_id)::int AS n
    FROM commentary_verses mv
    JOIN commentaries m ON m.id = mv.commentary_id
    WHERE m.approved = TRUE
  `;
  const qPending = `
    SELECT COUNT(DISTINCT mv.verse_id)::int AS n
    FROM commentary_verses mv
    JOIN commentaries m ON m.id = mv.commentary_id
    WHERE (m.approved = FALSE OR m.approved IS NULL)
       OR (m.text IS NULL OR NULLIF(TRIM(m.text), '') IS NULL)
  `;

  const [[{ n: meditatives }], [{ n: approved }], [{ n: pending }]] = await Promise.all([
    sequelize.query(qMeditatives, { type: sequelize.QueryTypes.SELECT }),
    sequelize.query(qApproved,    { type: sequelize.QueryTypes.SELECT }),
    sequelize.query(qPending,     { type: sequelize.QueryTypes.SELECT }),
  ]);

  return { total, meditatives, approved, pending };
}

// ------------------------------------------------------------------
// getWeeklyStats()
// - created   : nb de liens verse<->meditation créés par jour (meditation_verses.created_at)
// - commented : nb de versets dont la meditation a été commentée dans la fenêtre
//               (compte les verse-links des meditations avec updated_at dans la fenêtre)
// - approved  : nb de versets dont la meditation a été approuvée dans la fenêtre
// ------------------------------------------------------------------
async function getWeeklyStats() {
  const { start, end, labels, dayIndex } = weekWindow();

  const qCreated = `
    SELECT DATE_TRUNC('day', mv.created_at) AS day, COUNT(*)::int AS count
    FROM commentary_verses mv
    WHERE mv.created_at >= :start AND mv.created_at < :end
    GROUP BY day ORDER BY day
  `;

  const qCommented = `
    SELECT DATE_TRUNC('day', m.updated_at) AS day, COUNT(mv.verse_id)::int AS count
    FROM commentaries m
    JOIN commentary_verses mv ON mv.commentary_id = m.id
    WHERE m.updated_at IS NOT NULL
      AND m.updated_at >= :start AND m.updated_at < :end
      AND NULLIF(TRIM(m.text), '') IS NOT NULL
    GROUP BY day ORDER BY day
  `;

  const qApproved = `
    SELECT DATE_TRUNC('day', m.updated_at) AS day, COUNT(mv.verse_id)::int AS count
    FROM commentaries m
    JOIN commentary_verses mv ON mv.commentary_id = m.id
    WHERE m.approved = TRUE
      AND m.updated_at >= :start AND m.updated_at < :end
    GROUP BY day ORDER BY day
  `;

  const [rC, rCm, rA] = await Promise.all([
    sequelize.query(qCreated,   { replacements: { start, end }, type: sequelize.QueryTypes.SELECT }),
    sequelize.query(qCommented, { replacements: { start, end }, type: sequelize.QueryTypes.SELECT }),
    sequelize.query(qApproved,  { replacements: { start, end }, type: sequelize.QueryTypes.SELECT }),
  ]);

  const created   = Array(7).fill(0);
  const commented = Array(7).fill(0);
  const approved  = Array(7).fill(0);

  for (const r of rC)  { const i = dayIndex(new Date(r.day)); if (i>=0 && i<7) created[i]   = r.count; }
  for (const r of rCm) { const i = dayIndex(new Date(r.day)); if (i>=0 && i<7) commented[i] = r.count; }
  for (const r of rA)  { const i = dayIndex(new Date(r.day)); if (i>=0 && i<7) approved[i]  = r.count; }

  return { labels, created, commented, approved };
}

function weekWindow(base = new Date()) {
  const dt = new Date(base);
  const day = dt.getDay(); // 0=dim..6=sam
  const diffToMonday = (day + 6) % 7;
  const start = new Date(dt);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - diffToMonday);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const labels = ["L","M","M","J","V","S","D"];
  const dayIndex = (d) => Math.floor((d - start) / 86400000);

  return { start, end, labels, dayIndex };
}

module.exports = {
  getRecentActivity,
  getVerses,
  getWeeklyStats,
};
