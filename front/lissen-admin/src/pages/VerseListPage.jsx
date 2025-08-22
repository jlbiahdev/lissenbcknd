import React, { useEffect, useMemo, useRef, useState } from "react";
import "../styles/index.css";

/**
 * VerseListPage.jsx — Lissen Admin Front (Vanilla CSS)
 *
 * Features (v1):
 * - Filters: Bible, Book, Chapter, Text search, Meditative (All/Yes/No)
 * - Sortable columns (Ref, Text, Meditative, Approved, Updated)
 * - Pagination w/ page size
 * - Toggle meditative flag (optimistic)
 * - Edit commentary + approval in a modal (optimistic)
 * - Export current filtered list to JSON
 * - Vanilla CSS injected via <style> (no Tailwind)
 *
 * API Integration:
 * - Set USE_MOCK = false to call your backend.
 * - Configure API_BASE if needed (defaults to window.__API_BASE__ || "/api").
 * - Expected endpoints (adjust to your routes):
 *   GET   /verses?bible=&book=&chapter=&q=&isMeditative=&page=&pageSize=&sort=
 *   PATCH /verses/:id { is_meditative }
 *   PUT   /verses/:id/commentary { commentary, approved }
 */

const USE_MOCK = true; // TODO: switch to false when backend is ready
const API_BASE = (typeof window !== "undefined" && window.__API_BASE__) || "/api";

export default function VerseListPage() {

  // --------------------- State ---------------------
  const [filters, setFilters] = useState({
    bible: "",
    book: "",
    chapter: "",
    q: "",
    meditative: "all", // all | yes | no
  });
  const [sort, setSort] = useState({ by: "ref", dir: "asc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(null); // verse object or null
  const [editForm, setEditForm] = useState({ commentary: "", approved: false });

  // --------------------- Derived ---------------------
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Books/chapter helpers (basic placeholders; feel free to wire real metadata)
  const availableBibles = useMemo(() => ["LSG", "KJV", "S21"], []);
  const availableBooks = useMemo(() =>
    (
      USE_MOCK ? MOCK_BOOKS : Array.from(new Set(rows.map(r => r.book)))
    ).sort(), [rows]
  );

  // --------------------- Effects ---------------------
  useEffect(() => {
    let isActive = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const { items, total } = await fetchVerses({
          filters,
          page,
          pageSize,
          sort,
        });
        if (!isActive) return;
        setRows(items);
        setTotal(total);
      } catch (e) {
        if (!isActive) return;
        setError(e?.message || "Une erreur est survenue.");
      } finally {
        if (isActive) setLoading(false);
      }
    }
    load();
    return () => { isActive = false; };
  }, [filters, page, pageSize, sort.by, sort.dir]);

  // Keep edit form in sync when a new verse opens
  useEffect(() => {
    if (editing) {
      setEditForm({ commentary: editing.commentary || "", approved: !!editing.approved });
    }
  }, [editing]);

  // --------------------- Handlers ---------------------
  function updateFilter(name, value) {
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1); // reset to first page on any filter change
  }

  function onSort(by) {
    setSort(prev => ({ by, dir: prev.by === by && prev.dir === "asc" ? "desc" : "asc" }));
  }

  async function toggleMeditative(verse) {
    const newVal = !verse.is_meditative;
    // optimistic UI
    setRows(prev => prev.map(r => r.id === verse.id ? { ...r, is_meditative: newVal } : r));
    try {
      if (!USE_MOCK) {
        await apiPatch(`${API_BASE}/verses/${verse.id}`, { is_meditative: newVal });
      } else {
        await mockDelay(250);
      }
    } catch (e) {
      // rollback on error
      setRows(prev => prev.map(r => r.id === verse.id ? { ...r, is_meditative: !newVal } : r));
      alert("Échec de la mise à jour: " + (e?.message || ""));
    }
  }

  async function saveCommentary() {
    if (!editing) return;
    const payload = { commentary: editForm.commentary.trim(), approved: !!editForm.approved };

    // optimistic UI
    setRows(prev => prev.map(r => r.id === editing.id ? { ...r, ...payload, updated_at: new Date().toISOString() } : r));
    try {
      if (!USE_MOCK) {
        await apiPut(`${API_BASE}/verses/${editing.id}/commentary`, payload);
      } else {
        await mockDelay(400);
      }
      setEditing(null);
    } catch (e) {
      alert("Échec de l'enregistrement: " + (e?.message || ""));
    }
  }

  function exportJSON() {
    const exportable = rows.map(({ id, bible, book, chapter, verse, text, is_meditative, commentary, approved }) => ({
      id, bible, book, chapter, verse, text, is_meditative, commentary: commentary || "", approved: !!approved,
    }));
    const blob = new Blob([JSON.stringify(exportable, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meditative-verses-page-${page}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function resetFilters() {
    setFilters({ bible: "", book: "", chapter: "", q: "", meditative: "all" });
    setPage(1);
    setSort({ by: "ref", dir: "asc" });
  }

  // --------------------- Render ---------------------
  return (
    <div className="verse-page">
      <header className="page-header">
        <div className="title-wrap">
          <h1 className="title">Verses</h1>
          <span className="sub">Gestion des versets & méditations</span>
        </div>
        <div className="header-actions">
          <button className="btn" onClick={() => window.location.reload()}>Actualiser</button>
          <button className="btn pri" onClick={exportJSON}>Exporter JSON</button>
        </div>
      </header>

      <section className="filters" aria-label="Filtres">
        <div className="field">
          <label>Bible</label>
          <select value={filters.bible} onChange={e => updateFilter("bible", e.target.value)}>
            <option value="">Toutes</option>
            {availableBibles.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Livre</label>
          <input list="book-list" value={filters.book} onChange={e => updateFilter("book", e.target.value)} placeholder="Ex: Psaumes" />
          <datalist id="book-list">
            {availableBooks.map(b => <option key={b} value={b} />)}
          </datalist>
        </div>
        <div className="field">
          <label>Chapitre</label>
          <input type="number" min={1} value={filters.chapter} onChange={e => updateFilter("chapter", e.target.value)} placeholder="Ex: 23" />
        </div>
        <div className="field">
          <label>Texte contient</label>
          <input value={filters.q} onChange={e => updateFilter("q", e.target.value)} placeholder="Rechercher..." />
        </div>
        <div className="field">
          <label>Méditatif</label>
          <select value={filters.meditative} onChange={e => updateFilter("meditative", e.target.value)}>
            <option value="all">Tous</option>
            <option value="yes">Oui</option>
            <option value="no">Non</option>
          </select>
        </div>
        <div className="field field--actions">
          <button className="btn ghost" onClick={resetFilters}>Réinitialiser</button>
        </div>
      </section>

      <section className="card">
        {error && <div className="alert error">{error}</div>}
        {loading ? (
          <div className="loading">Chargement…</div>
        ) : (
          <div className="table-wrap">
            <table className="table" role="table" aria-label="Liste des versets">
              <thead>
                <tr>
                  <Th label="Réf" sortKey="ref" sort={sort} onSort={onSort} />
                  <Th label="Texte" sortKey="text" sort={sort} onSort={onSort} />
                  <Th label="Méditatif" sortKey="is_meditative" sort={sort} onSort={onSort} />
                  <Th label="Approuvé" sortKey="approved" sort={sort} onSort={onSort} />
                  <Th label="Maj" sortKey="updated_at" sort={sort} onSort={onSort} />
                  <th style={{width:120}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={6} className="empty">Aucun verset</td></tr>
                ) : (
                  rows.map(v => (
                    <tr key={v.id}>
                      <td className="ref"><RefCell v={v} /></td>
                      <td title={v.text} className="text">{truncate(v.text, 180)}</td>
                      <td>
                        <label className="switch" aria-label={`Déclarer méditatif: ${v.id}`}>
                          <input type="checkbox" checked={!!v.is_meditative} onChange={() => toggleMeditative(v)} />
                          <span className="slider" />
                        </label>
                      </td>
                      <td>{v.approved ? <span className="badge ok">Oui</span> : <span className="badge">Non</span>}</td>
                      <td>{formatDate(v.updated_at)}</td>
                      <td className="row-actions">
                        <button className="btn sm" onClick={() => setEditing(v)}>Éditer</button>
                        <button className="btn sm ghost" onClick={() => window.location.assign(`/verses/${v.id}`)}>Voir</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <footer className="pager">
          <div className="left">{Intl.NumberFormat().format(total)} résultat(s)</div>
          <div className="mid">
            <button className="btn sm ghost" disabled={page <= 1} onClick={() => setPage(1)}>&laquo;</button>
            <button className="btn sm ghost" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Préc</button>
            <span className="page-indicator">Page {page} / {totalPages}</span>
            <button className="btn sm ghost" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Suiv</button>
            <button className="btn sm ghost" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>&raquo;</button>
          </div>
          <div className="right">
            <label className="page-size">
              <span>Taille</span>
              <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
                {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          </div>
        </footer>
      </section>

      {editing && (
        <Modal onClose={() => setEditing(null)} title={<RefCell v={editing} short /> }>
          <div className="form">
            <label>Commentaire</label>
            <textarea rows={8} value={editForm.commentary} onChange={e => setEditForm(f => ({ ...f, commentary: e.target.value }))} placeholder="Votre commentaire pastoral…" />

            <label className="chk">
              <input type="checkbox" checked={!!editForm.approved} onChange={e => setEditForm(f => ({ ...f, approved: e.target.checked }))} />
              <span>Approuvé</span>
            </label>

            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setEditing(null)}>Annuler</button>
              <button className="btn pri" onClick={saveCommentary}>Enregistrer</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// --------------------- Components ---------------------
function Th({ label, sortKey, sort, onSort }) {
  const active = sort.by === sortKey;
  const dir = active ? sort.dir : undefined;
  return (
    <th role="columnheader" className={active ? `sorted ${dir}` : undefined}>
      <button className="th-btn" onClick={() => onSort(sortKey)}>
        <span>{label}</span>
        <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" className="chev">
          <path d="M7 14l5-5 5 5" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>
    </th>
  );
}

function RefCell({ v, short = false }) {
  const ref = `${v.bible || ""} ${v.book} ${v.chapter}:${v.verse}`.trim();
  return (
    <span className="refcell" title={ref}>
      <span className="book">{v.book}</span>{" "}
      <span className="cv">{v.chapter}:{v.verse}</span>
      {!short && v.bible ? <span className="bible"> · {v.bible}</span> : null}
    </span>
  );
}

function Modal({ title, children, onClose }) {
  useLockBodyScroll();
  return (
    <div className="modal-root" role="dialog" aria-modal="true">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="document">
        <header className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="icon-btn" aria-label="Fermer" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" /></svg>
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

// --------------------- Data layer ---------------------
async function fetchVerses({ filters, page, pageSize, sort }) {
  if (USE_MOCK) {
    const all = MOCK_DATA;
    let items = all.filter(v =>
      (!filters.bible || v.bible === filters.bible) &&
      (!filters.book || v.book.toLowerCase().includes(filters.book.toLowerCase())) &&
      (!filters.chapter || String(v.chapter) === String(filters.chapter)) &&
      (!filters.q || v.text.toLowerCase().includes(filters.q.toLowerCase())) &&
      (filters.meditative === "all" || (filters.meditative === "yes" ? v.is_meditative : !v.is_meditative))
    );
    items = sortArray(items, sort.by, sort.dir);
    const total = items.length;
    const start = (page - 1) * pageSize;
    const paged = items.slice(start, start + pageSize);
    await mockDelay(300);
    return { items: paged, total };
  }

  const params = new URLSearchParams();
  if (filters.bible) params.set("bible", filters.bible);
  if (filters.book) params.set("book", filters.book);
  if (filters.chapter) params.set("chapter", filters.chapter);
  if (filters.q) params.set("q", filters.q);
  if (filters.meditative !== "all") params.set("isMeditative", filters.meditative === "yes" ? "1" : "0");
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  params.set("sort", `${sort.by}:${sort.dir}`);

  const res = await fetch(`${API_BASE}/verses?${params.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiPatch(url, body) {
  const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiPut(url, body) {
  const res = await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// --------------------- Utils ---------------------
function truncate(str, n) { return str && str.length > n ? str.slice(0, n - 1) + "…" : str; }
function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
function sortArray(arr, by, dir) {
  const s = [...arr];
  const m = dir === "desc" ? -1 : 1;
  s.sort((a, b) => {
    const va = by === "ref" ? `${a.book}-${a.chapter}-${a.verse}` : a[by];
    const vb = by === "ref" ? `${b.book}-${b.chapter}-${b.verse}` : b[by];
    if (va == null && vb == null) return 0;
    if (va == null) return -1 * m;
    if (vb == null) return 1 * m;
    if (typeof va === "boolean") return (Number(va) - Number(vb)) * m;
    if (typeof va === "number") return (va - vb) * m;
    return String(va).localeCompare(String(vb)) * m;
  });
  return s;
}
function mockDelay(ms) { return new Promise(r => setTimeout(r, ms)); }

function useLockBodyScroll() {
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; };
  }, []);
}

// --------------------- Mock Data ---------------------
const MOCK_BOOKS = [
  "Genèse", "Exode", "Lévitique", "Nombres", "Deutéronome",
  "Josué", "Juges", "Ruth", "1 Samuel", "2 Samuel", "1 Rois", "2 Rois",
  "Psaumes", "Proverbes", "Ésaïe", "Jérémie", "Ézéchiel",
  "Matthieu", "Marc", "Luc", "Jean", "Actes", "Romains"
];

const MOCK_DATA = Array.from({ length: 120 }).map((_, i) => {
  const book = MOCK_BOOKS[i % MOCK_BOOKS.length];
  const chapter = (i % 50) + 1;
  const verse = (i % 20) + 1;
  const is_meditative = i % 3 === 0;
  const approved = i % 5 === 0;
  return {
    id: `v_${i + 1}`,
    bible: ["LSG", "KJV", "S21"][i % 3],
    book,
    chapter,
    verse,
    text: `Texte d'exemple du verset ${book} ${chapter}:${verse} — « Le Seigneur est mon berger, je ne manquerai de rien. »` ,
    is_meditative,
    commentary: is_meditative ? `Commentaire pastoral (mock) #${i + 1}` : "",
    approved,
    updated_at: new Date(Date.now() - i * 86400000).toISOString(),
  };
});