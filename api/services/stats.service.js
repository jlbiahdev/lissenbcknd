const { Verse, MeditativeVerse } = require('../models');
const { Op } = require('sequelize');
const sequelize = require("../config/db");

async function getRecentActivity(limit) {


    // On remonte des 3 “sources d’événements” et on unifie via UNION ALL
    // On joint aux verses/books pour fabriquer un label lisible "Livre ch:v"
    const sql = `
      WITH ev AS (
        -- Créations (sélectionnés comme méditatifs)
        SELECT
          mv.verse_id            AS verse_id,
          'create'               AS ev_type,
          mv.created_at          AS at
        FROM meditative_verses mv

        UNION ALL

        -- Commentaires (saisis/modifiés)
        SELECT
          mv.verse_id            AS verse_id,
          'comment'              AS ev_type,
          mv.commentary_updated_at AS at
        FROM meditative_verses mv
        WHERE mv.commentary_updated_at IS NOT NULL
          AND NULLIF(TRIM(mv.commentary), '') IS NOT NULL

        UNION ALL

        -- Approbations (dernière mise à jour approuvée)
        SELECT
          mv.verse_id            AS verse_id,
          'approve'              AS ev_type,
          mv.updated_at          AS at
        FROM meditative_verses mv
        WHERE mv.approved = TRUE
      )
      SELECT
        e.ev_type,
        e.at,
        v.id           AS verse_id,
        b.name         AS book_name,
        v.chapter_number  AS chapter_num,
        v.number    AS verse_num
      FROM ev e
      JOIN verses v ON v.id = e.verse_id
      JOIN books  b ON b.id = v.book_id
      WHERE e.at IS NOT NULL
      ORDER BY e.at DESC
      LIMIT :limit
    `;

    const rows = await sequelize.query(sql, {
      replacements: { limit },
      type: sequelize.QueryTypes.SELECT,
    });

    const out = rows.map(r => ({
      id: `${r.ev_type}_${r.verse_id}_${new Date(r.at).getTime()}`,
      type: r.ev_type, // 'create' | 'comment' | 'approve'
      label: `${r.book_name} ${r.chapter_num}:${r.verse_num} — ${r.ev_type === 'create' ? 'créé' : r.ev_type === 'comment' ? 'commenté' : 'approuvé'}`,
      atISO: new Date(r.at).toISOString(),
    }));

    return out;
}

async function getVerses() {
    const total = await Verse.count();
    // versets taggés méditatifs
    const meditatives = await MeditativeVerse.count();
    // versets approuvés
    const approved = await MeditativeVerse.count({ where: { approved: true } });
    // en attente = pas approuvés OU pas de commentaire
    const pending = await MeditativeVerse.count({
      where: {
        [Op.or]: [
          { approved: false },
          { commentary: null },
          { commentary: "" }
        ]
      }
    });

    return { total, meditatives, approved, pending };
}

async function getWeeklyStats() {
    const { start, end, labels, dayIndex } = weekWindow(); // lundi 00:00 -> lundi+7 00:00

    // 1) Créés (sélectionnés comme méditatifs)
    const qCreated = `
      SELECT DATE_TRUNC('day', created_at) AS day, COUNT(*)::int AS count
      FROM meditative_verses
      WHERE created_at >= :start AND created_at < :end
      GROUP BY day ORDER BY day
    `;

    // 2) Commentés (contenu saisi/modifié dans la fenêtre)
    const qCommented = `
      SELECT DATE_TRUNC('day', commentary_updated_at) AS day, COUNT(*)::int AS count
      FROM meditative_verses
      WHERE commentary_updated_at IS NOT NULL
        AND commentary_updated_at >= :start AND commentary_updated_at < :end
        AND NULLIF(TRIM(commentary), '') IS NOT NULL
      GROUP BY day ORDER BY day
    `;

    // 3) Approuvés (dernière approbation dans la fenêtre)
    // ⚠️ colonne renommée: approved (anciennement comment_approved)
    const qApproved = `
      SELECT DATE_TRUNC('day', updated_at) AS day, COUNT(*)::int AS count
      FROM meditative_verses
      WHERE approved = TRUE
        AND updated_at >= :start AND updated_at < :end
      GROUP BY day ORDER BY day
    `;

    const [rC, rCm, rA] = await Promise.all([
      sequelize.query(qCreated,   { replacements: { start, end }, type: sequelize.QueryTypes.SELECT }),
      sequelize.query(qCommented, { replacements: { start, end }, type: sequelize.QueryTypes.SELECT }),
      sequelize.query(qApproved,  { replacements: { start, end }, type: sequelize.QueryTypes.SELECT }),
    ]);

    // préparer les séries (7 cases L..D)
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
  const day = dt.getDay();                 // 0=dim..6=sam
  const diffToMonday = (day + 6) % 7;
  const start = new Date(dt);
  start.setHours(0,0,0,0);
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
