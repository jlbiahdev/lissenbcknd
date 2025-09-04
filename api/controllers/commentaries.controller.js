// controllers/commentaries.controller.js
const service = require('../services/commentaries.service');

function toInt(v) {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function toStr(v) {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s === '' ? undefined : s;
}

// POST /commentaries
// Body: { bookCode?: string, verse_ids: number[] }
async function add(req, res) {
  try {
    const bookCode = toStr(req.body?.bookCode);
    const verse_ids = Array.isArray(req.body?.verse_ids) ? req.body.verse_ids.map(toInt).filter(Boolean) : null;

    if (!verse_ids || verse_ids.length === 0) {
      return res.status(400).json({ error: "verse_ids must be a non-empty array of integers" });
    }

    const commentary = await service.add(bookCode, verse_ids);
    return res.status(201).json(commentary);
  } catch (err) {
    console.error("add error:", err);
    res.status(400).json({ error: err.message });
  }
}

// PUT /commentaries/:id
async function update(req, res) {
  try {
    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });

    const payload = {};
    if (typeof req.body?.text === 'string') payload.text = req.body.text;
    if (Array.isArray(req.body?.verseIds))  payload.verseIds = req.body.verseIds;

    const out = await service.update(id, payload);
    res.json(out);
  } catch (err) {
    console.error("update error:", err);
    res.status(400).json({ error: err.message });
  }
}

// DELETE /commentaries/:id
async function remove(req, res) {
  try {
    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });

    const result = await service.remove(id);
    res.json(result);
  } catch (err) {
    console.error("remove error:", err);
    res.status(400).json({ error: err.message });
  }
}

// GET /commentaries/:id/export
async function exportOne(req, res) {
  try {
    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });

    const json = await service.exports(id);
    res.json(json);
  } catch (err) {
    console.error("exportOne error:", err);
    res.status(400).json({ error: err.message });
  }
}

// GET /commentaries
// Optional query: ?bookName=...&chapterNum=...&verseNum=...
async function get(req, res) {
  try {
    const { bookName, bookCode, chapterNum, verseNum, approved } = req.query;
    const data = await service.get({ bookName, bookCode, chapterNum, verseNum, approved });
    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error('commentaries.get error:', err);
    res.status(500).json({ error: err.message });
  }
}

// GET /commentaries/:id
async function getById(req, res) {
  try {
    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });

    const row = await service.getById(id);
    res.json(row);
  } catch (err) {
    console.error("getById error:", err);
    res.status(404).json({ error: err.message });
  }
}

// POST /commentaries/:id/toggle
async function toggleApproval(req, res) {
  try {
    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });

    const out = await service.toggleApproval(id);
    res.json(out);
  } catch (err) {
    console.error("toggleApproval error:", err);
    res.status(400).json({ error: err.message });
  }
}


module.exports = {
  add,
  update,
  remove,
  exportOne,
  get,
  getById,
  toggleApproval,
};
