import React, { useEffect, useMemo, useRef, useState } from "react";
import "../styles/index.css";
import { API_BASE } from "../api/client";

const USE_MOCK = false;

export default function VerseListPage() {

  // --------------------- State ---------------------
  const [filters, setFilters] = useState({
    bible: "",
    book: "",
    chapter: "",
    q: "",
    meditative: "all", // all | yes | no
    approved: "all", // all | yes | no
  });
  const [sort, setSort] = useState({ by: "ref", dir: "asc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(null); // verse object or null
  const [editForm, setEditForm] = useState({ commentary: "", themes: [] });
  const [themes, setThemes] = useState([]);

  // --------------------- Derived ---------------------
  const availableBibles = useMemo(() => {
    const codes = rows.map(r => r?.Bible?.code).filter(Boolean);
    return Array.from(new Set(codes));
  }, [rows]);

  const availableBooks = useMemo(() => {
    const map = new Map(
      rows
        .map(r => r?.Book && { id: r.Book.id, name: r.Book.name })
        .filter(Boolean)
        .map(b => [b.name, b])
    );
    return Array.from(map.values()).sort((a, b) => a.id - b.id);
  }, [rows]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return rows.slice(start, end);
  }, [rows, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

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
  }, [filters, sort.by, sort.dir, page, pageSize]);

  // Sync modal form
  useEffect(() => {
    if (editing) {
      setEditForm({
        commentary: editing.commentary ?? editing.Meditative?.commentary ?? "",
        themes: editing.Meditative?.themes ?? editing.themes ?? [],
      });
    }
  }, [editing]);
  
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/themes`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        if (!alive) return;
        setThemes(data);
      } catch (_) {}
    })();
    return () => { alive = false; };
  }, []);

  // --------------------- Handlers ---------------------
  function updateFilter(name, value) {
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1); // reset to first page on any filter change
  }

  function onSort(by) {
    setSort(prev => ({ by, dir: prev.by === by && prev.dir === "asc" ? "desc" : "asc" }));
  }

  async function toggleMeditative(verse) {
    const currentMedit = !!(verse.is_meditative ?? verse.Meditative); // bool ou présence assoc
    const newVal = !currentMedit;

    // optimistic UI
    setRows(prev => prev.map(r =>
      r.id === verse.id
        ? { ...r, is_meditative: newVal, Meditative: newVal ? (r.Meditative || {}) : null }
        : r
    ));
    try {
      if (newVal) {
        await apiPost(`${API_BASE}/meditations/${verse.id}/add`, { });
      } else {
        await apiPost(`${API_BASE}/meditations/${verse.id}/remove`, { });
      }
    } catch (e) {
      // rollback on error
      setRows(prev => prev.map(r =>
        r.id === verse.id
          ? { ...r, is_meditative: currentMedit, Meditative: verse.Meditative }
          : r
      ));
      alert("Échec de la mise à jour: " + (e?.message || ""));
    }
  }

  async function save() {
    if (!editing) return;
    const payload = { 
      commentary: editForm.commentary.trim(), 
      themes: editForm.themes || []
    };

    // optimistic UI
    setRows(prev => prev.map(r =>
      r.id === editing.id
        ? {
            ...r,
            commentary: payload.commentary,
            Meditative: r.Meditative 
              ? { ...r.Meditative, commentary: payload.commentary, themes: payload.themes }
              : { commentary: payload.commentary, themes: payload.themes },
            updated_at: new Date().toISOString()
          }
        : r
    ));
    try {
      await apiPut(`${API_BASE}/meditations/${editing.id}/edit`, payload);
      setEditing(null);
    } catch (e) {
      alert("Échec de l'enregistrement: " + (e?.message || ""));
    }
  }

  async function toggleApproveVerse(verse) {
    const currentlyApproved = !!(verse.approved ?? verse.Meditative?.approved);

    // UI optimiste
    setRows(prev => prev.map(r =>
      r.id === verse.id
        ? {
            ...r,
            is_meditative: true,
            Meditative: r.Meditative
              ? { ...r.Meditative, approved: !currentlyApproved }
              : { approved: !currentlyApproved }
          }
        : r
    ));

    try {
      await apiPost(`${API_BASE}/meditations/${verse.id}/approve`, {});
      setEditing(null);
    } catch (e) {
      // rollback si échec
      setRows(prev => prev.map(r =>
        r.id === verse.id
          ? { ...r, Meditative: verse.Meditative ?? null }
          : r
      ));
      alert("Échec de l’opération : " + (e?.message || ""));
    }
  }

  function exportJSON() {
    const exportable = rows.map((r) => {
      const isMedit = !!(r.is_meditative ?? r.Meditative);
      const appr = !!(r.approved ?? r.Meditative?.approved);
      const bookName = r?.Book?.name ?? r?.book ?? "";
      const bible = r?.Book?.code ?? r?.bible ?? "";
      // Compat multiples formes
      const chapter = r?.chapterNum ?? r?.chapter ?? r?.chapterNumber ?? null;
      const verse = r?.verseNum ?? r?.number ?? r?.verse ?? null;
      return {
        id: r.id, bible, book: bookName, chapter, verse, text: r.text,
        is_meditative: isMedit,
        commentary: r.commentary ?? r.Meditative?.commentary ?? "",
        approved: appr,
      };
    });
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
    setFilters({ bible: "", book: "", chapter: "", q: "", meditative: "all", approved: "all" });
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
            {availableBibles.map((b, i) => <option key={`${b}-${i}`} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Livre</label>
          <input
            list="book-list"
            value={filters.book}
            onChange={e => updateFilter("book", e.target.value)}
            placeholder="Ex: Psaumes"
          />
          <datalist id="book-list">
            {availableBooks.map((b) => (
              <option key={b.id} value={b.name} />
            ))}
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
        <div className="field">
          <label>Approuvé</label>
          <select value={filters.approved} onChange={e => updateFilter("approved", e.target.value)}>
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
                {pageRows.length === 0 ? (
                  <tr><td colSpan={6} className="empty">Aucun verset</td></tr>
                ) : (
                  pageRows.map(v => {
                    const isMedit = !!(v.is_meditative ?? v.Meditative);
                    const isApproved = !!(v.approved ?? v.Meditative?.approved);
                    const upd = v.updated_at ?? v.Meditative?.updated_at;
                    return (
                      <tr key={v.id}>
                        <td className="ref"><RefCell v={v} /></td>
                        <td title={v.text} className="text">{truncate(v.text, 180)}</td>
                        <td>
                          <label className="switch" aria-label={`Déclarer méditatif: ${v.id}`}>
                            <input type="checkbox" checked={isMedit} onChange={() => toggleMeditative(v)} />
                            <span className="slider" />
                          </label>
                        </td>
                        <td>{isApproved ? <span className="badge ok">Oui</span> : <span className="badge">Non</span>}</td>
                        <td>{formatDate(upd)}</td>
                        <td className="row-actions">
                          <button className="btn sm" onClick={() => setEditing(v)}>Éditer</button>
                        </td>
                      </tr>
                    );
                  })
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
            <textarea
              rows={8}
              value={editForm.commentary}
              onChange={e => setEditForm(f => ({ ...f, commentary: e.target.value }))}
              placeholder="Votre commentaire pastoral…"
            />

            <label>Thèmes</label>
            <ThemeMulti
              value={editForm.themes}
              onChange={(next) => setEditForm(f => ({ ...f, themes: next }))}
              options={themes}
            />

            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setEditing(null)}>Annuler</button>
              <button className="btn pri" onClick={save}>Enregistrer</button>
              <button 
                className={`btn ${editing.Meditative?.approved ? "danger" : "success"}`}
                onClick={() => toggleApproveVerse(editing)}
              >
                {editing.Meditative?.approved ? "Unapprove" : "Approve"}
              </button>
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
  const bookName = v?.Book?.name ?? v?.book ?? "";
  const bookCode = v?.Book?.code ?? v?.bookCode ?? "";
  const bibleCode = v?.Bible?.code ?? v?.bible ?? "";

  // Compat : anciens champs si présents, sinon nouveaux
  const ch = v?.chapterNum ?? v?.chapter ?? v?.chapterNumber ?? null;
  const ve = v?.verseNum ?? v?.number ?? v?.verse ?? null;

  const cv = ch != null && ve != null ? `${ch}:${ve}` : (ve != null ? `?:${ve}` : "—");
  const title = `${bibleCode || ""} ${bookName || ""} ${cv}`.trim();

  return (
    <span className="refcell" title={title}>
      <span className="book">{bookCode}</span>{" "}
      <span className="cv">{cv}</span>
      {!short && bibleCode ? <span className="bible"> · {bibleCode}</span> : null}
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

function ThemeMulti({ value = [], onChange, options = [] }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    let arr = options;
    if (s) arr = arr.filter(t => (t.name || "").toLowerCase().includes(s));

    // retirer ceux déjà choisis
    const chosen = new Set((value || []).map(v => (typeof v === "string" ? v : v.name)));
    return arr.filter(t => !chosen.has(t.name)).slice(0, 8);
  }, [q, options, value]);

  const add = (name) => {
    if (!name) return;
    const n = name.trim();
    if (!n) return;
    if ((value || []).some(v => (typeof v === "string" ? v : v.name) === n)) return;
    onChange([...(value || []), n]);
    setQ("");
  };
  const remove = (idx) => onChange((value || []).filter((_, i) => i !== idx));

  return (
    <div className="themes-picker">
      <div className="themes-list">
        {(value || []).length === 0 && <span className="themes-empty">Aucun thème</span>}
        {(value || []).map((t, i) => {
          const label = typeof t === "string" ? t : t.name;
          return (
            <span key={`${label}-${i}`} className="theme-chip-lite">
              {label}
              <button type="button" className="chip-x" onClick={() => remove(i)} aria-label={`Retirer ${label}`}>×</button>
            </span>
          );
        })}
      </div>
      <div className="themes-input">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(q); } }}
          placeholder="Ajouter un thème…"
        />
        <button type="button" className="btn sm" onClick={() => add(q)}>Ajouter</button>
      </div>
      {list.length > 0 && (
        <div className="theme-suggest">
          {list.map(t => (
            <button key={t.id} type="button" className="pill" onClick={() => add(t.name)}>{t.name}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// --------------------- Data layer ---------------------
async function fetchVerses({ filters, sort }) {
  const qs = new URLSearchParams();

  if (filters.bible) qs.set("bible", filters.bible);
  if (filters.book) qs.set("book", filters.book);
  if (filters.chapter) qs.set("chapter", filters.chapter);
  if (filters.q) qs.set("textLike", filters.q);
  if (filters.meditative !== "all") qs.set("isMeditative", filters.meditative === "yes" ? "1" : "0");
  if (filters.approved !== "all") qs.set("isApproved", filters.approved === "yes" ? "1" : "0");

  // Tri (non utilisé côté backend, conservé si tu l’actives plus tard)
  qs.set("sort", `${sort.by}:${sort.dir}`);

  const res = await fetch(`${API_BASE}/bibles/verses?${qs.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  return data;
}

async function apiPost(url, body) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
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

function useLockBodyScroll() {
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; };
  }, []);
}
