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
async function createCommentary(req, res) {
  try {
    const bookCode = toStr(req.body?.bookCode);
    const verse_ids = Array.isArray(req.body?.verse_ids) ? req.body.verse_ids.map(toInt).filter(Boolean) : null;

    if (!verse_ids || verse_ids.length === 0) {
      return res.status(400).json({ error: "verse_ids must be a non-empty array of integers" });
    }

    const commentary = await service.insert(bookCode, verse_ids);
    return res.status(201).json(commentary);
  } catch (err) {
    console.error("createCommentary error:", err);
    res.status(400).json({ error: err.message });
  }
}

// DELETE /commentaries/:id
async function deleteCommentary(req, res) {
  try {
    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });

    const result = await service.remove(id);
    res.json(result);
  } catch (err) {
    console.error("deleteCommentary error:", err);
    res.status(400).json({ error: err.message });
  }
}

// POST /commentaries/:id/toggle
async function toggleApproval(req, res) {
  try {
    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });

    const updated = await service.toggleApproval(id);
    res.json(updated);
  } catch (err) {
    console.error("toggleApproval error:", err);
    res.status(400).json({ error: err.message });
  }
}

// PUT /commentaries/:id
// Body: { text: string|null }
async function updateCommentary(req, res) {
  try {
    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });

    const text = req.body?.text ?? null;
    const updated = await service.update(id, text);
    res.json(updated);
  } catch (err) {
    console.error("updateCommentary error:", err);
    res.status(400).json({ error: err.message });
  }
}

// POST /commentaries/:id/verses
// Body: { verseId: number }
async function addVerse(req, res) {
  try {
    const id = toInt(req.params.id);
    const verseId = toInt(req.body?.verseId);
    if (!id || !verseId) return res.status(400).json({ error: "Invalid id or verseId" });

    const updated = await service.addVerse(id, verseId);
    res.json(updated);
  } catch (err) {
    console.error("addVerse error:", err);
    res.status(400).json({ error: err.message });
  }
}

// DELETE /commentaries/:id/verses/:verseId
async function removeVerse(req, res) {
  try {
    const id = toInt(req.params.id);
    const verseId = toInt(req.params.verseId);
    if (!id || !verseId) return res.status(400).json({ error: "Invalid id or verseId" });

    const result = await service.removeVerse(id, verseId);
    res.json(result);
  } catch (err) {
    console.error("removeVerse error:", err);
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
async function listCommentaries(req, res) {
  try {
    const bookName = toStr(req.query.bookName);
    const chapterNum = toInt(req.query.chapterNum);
    const verseNum = toInt(req.query.verseNum);

    if (bookName || Number.isFinite(chapterNum) || Number.isFinite(verseNum)) {
      const rows = await service.filter(bookName, chapterNum, verseNum);
      return res.json(rows);
    }

    const rows = await service.get();
    res.json(rows);
  } catch (err) {
    console.error("listCommentaries error:", err);
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

module.exports = {
  createCommentary,
  deleteCommentary,
  toggleApproval,
  updateCommentary,
  addVerse,
  removeVerse,
  exportOne,
  listCommentaries,
  getById,
};
