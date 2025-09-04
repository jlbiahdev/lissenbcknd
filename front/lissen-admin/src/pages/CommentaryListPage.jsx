import React, { useEffect, useMemo, useState } from "react";
import "../styles/index.css";
import { API_BASE } from "../api/client";

export default function CommentaryListPage() {
  // --------------------- State ---------------------
  const [filters, setFilters] = useState({ bookName: "", chapterNum: "", verseNum: "" });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [editing, setEditing] = useState(null); // commentary (full) or null
  const [textDraft, setTextDraft] = useState("");

  // --------------------- Derived ---------------------
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize]);

  // --------------------- Effects ---------------------
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      const { bookName, chapterNum, verseNum } = filters;
      if (bookName?.trim()) params.set("bookName", bookName.trim());
      if (chapterNum) params.set("chapterNum", String(chapterNum));
      if (verseNum) params.set("verseNum", String(verseNum));
      const res = await fetch(`${API_BASE}/commentaries?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
      setPage(1);
    } catch (e) {
      setError(e?.message || "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }

  // --------------------- Handlers ---------------------
  function updateFilter(name, val) {
    setFilters(prev => ({ ...prev, [name]: val }));
  }

  async function onApplyFilters() {
    await load();
  }

  function onResetFilters() {
    setFilters({ bookName: "", chapterNum: "", verseNum: "" });
    setPage(1);
    load();
  }

  async function openEdit(id) {
    try {
      const res = await fetch(`${API_BASE}/commentaries/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const row = await res.json();
      setEditing(row);
      setTextDraft(row?.text ?? "");
    } catch (e) {
      alert("Impossible d’ouvrir le commentaire : " + (e?.message || ""));
    }
  }

  async function saveText() {
    if (!editing) return;
    try {
      const res = await fetch(`${API_BASE}/commentaries/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textDraft }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();

      // Maj liste
      setRows(prev => prev.map(r =>
        r.id === updated.id
          ? {
              ...r,
              commentary: updated.text ?? null,
              approved: updated.approved,
              commentaryUpdatedAt: updated.commentaryUpdatedAt
            }
          : r
      ));

      // Maj modal
      setEditing(prev =>
        prev
          ? {
              ...prev,
              commentary: updated.text ?? null,
              approved: updated.approved,
              commentaryUpdatedAt: updated.commentaryUpdatedAt
            }
          : prev
      );

      alert("Commentaire enregistré (désapprouvé jusqu’à validation).");
    } catch (e) {
      alert("Échec de l’enregistrement : " + (e?.message || ""));
    }
  }

  async function toggleApprove(row) {
    try {
      // Optimistic
      setRows(prev => prev.map(r => r.id === row.id ? { ...r, approved: !r.approved } : r));
      if (editing?.id === row.id) setEditing(prev => prev ? { ...prev, approved: !prev.approved } : prev);

      const res = await fetch(`${API_BASE}/commentaries/${row.id}/toggle`, { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const upd = await res.json();

      // Sync
      setRows(prev => prev.map(r => r.id === row.id ? { ...r, approved: upd.approved } : r));
      if (editing?.id === row.id) setEditing(prev => prev ? { ...prev, approved: upd.approved } : prev);
    } catch (e) {
      // Rollback
      setRows(prev => prev.map(r => r.id === row.id ? { ...r, approved: row.approved } : r));
      if (editing?.id === row.id) setEditing(prev => prev ? { ...prev, approved: row.approved } : prev);
      alert("Échec de la validation : " + (e?.message || ""));
    }
  }

  async function removeCommentary(id) {
    if (!window.confirm("Supprimer ce commentaire ?")) return;
    try {
      const res = await fetch(`${API_BASE}/commentaries/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setRows(prev => prev.filter(r => r.id !== id));
      if (editing?.id === id) setEditing(null);
    } catch (e) {
      alert("Échec de la suppression : " + (e?.message || ""));
    }
  }

  async function unlinkVerse(verseId) {
    if (!editing) return;
    if (!window.confirm("Retirer ce verset du commentaire ?")) return;
    try {
      const res = await fetch(`${API_BASE}/commentaries/${editing.id}/verses/${verseId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Maj modal
      setEditing(prev => prev ? { ...prev, verses: (prev.verses || []).filter(v => v.id !== verseId) } : prev);
      // Maj liste
      setRows(prev => prev.map(r =>
        r.id === editing.id
          ? { ...r, verses: (r.verses || []).filter(v => v.id !== verseId) }
          : r
      ));
    } catch (e) {
      alert("Échec du retrait : " + (e?.message || ""));
    }
  }

  // --------------------- Render ---------------------
  return (
    <div className="verse-page">
      <header className="page-header">
        <div className="title-wrap">
          <h1 className="title">Commentaries Bibliques</h1>
          <span className="sub">Liste et gestion des commentaires</span>
        </div>
        <div className="header-actions">
          <button className="btn" onClick={load}>Actualiser</button>
        </div>
      </header>

      <section className="filters" aria-label="Filtres">
        <div className="field">
          <label>Livre (contient)</label>
          <input
            value={filters.bookName}
            onChange={(e) => updateFilter("bookName", e.target.value)}
            placeholder="Ex: Psaumes"
          />
        </div>
        <div className="field">
          <label>Chapitre</label>
          <input
            type="number" min={1}
            value={filters.chapterNum}
            onChange={(e) => updateFilter("chapterNum", e.target.value)}
            placeholder="Ex: 23"
          />
        </div>
        <div className="field">
          <label>Verset</label>
          <input
            type="number" min={1}
            value={filters.verseNum}
            onChange={(e) => updateFilter("verseNum", e.target.value)}
            placeholder="Ex: 1"
          />
        </div>
        <div className="field field--actions">
          <button className="btn" onClick={onApplyFilters}>Filtrer</button>
          <button className="btn ghost" onClick={onResetFilters}>Réinitialiser</button>
        </div>
      </section>

      <section className="card">
        {error && <div className="alert error">{error}</div>}
        {loading ? (
          <div className="loading">Chargement…</div>
        ) : (
          <div className="table-wrap">
            <table className="table" role="table" aria-label="Liste des commentaires">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Titre</th>
                  <th>Aperçu</th>
                  <th>Approuvé</th>
                  <th>Maj</th>
                  <th style={{width:140 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr key="empty"><td colSpan={7} className="empty">Aucun commentaire</td></tr>
                ) : (
                  pageRows.map(row => (
                    <tr key={row.commentary.id}>
                        <td>{row.commentary.id}</td>
                        <td>{row.commentary.title || "Commentaire"}</td>
                        <td title={row.commentary.text || "—"} className="text">{truncate(row.commentary.text || "—", 120)}</td>
                        <td>{row.commentary.approved ? <span className="badge ok">Oui</span> : <span className="badge">Non</span>}</td>
                        <td>{formatDate(row.commentary.updatedAt)}</td>
                        <td className="row-actions">
                            <IconButton
                                title="Voir / Éditer"
                                onClick={() => openEdit(row.commentary.id)}
                                className="pri"
                            >
                                <EditIcon />
                            </IconButton>

                            <IconButton
                                title={row.commentary.approved ? "Retirer l’approbation" : "Approuver"}
                                onClick={() => toggleApprove(row.commentary)}
                                className={row.commentary.approved ? "danger" : "success"}
                            >
                                {row.commentary.approved ? <UndoIcon /> : <CheckIcon />}
                            </IconButton>

                            <IconButton
                                title="Supprimer"
                                onClick={() => removeCommentary(row.commentary.id)}  // ✅ passer le commentaire, pas la ligne entière
                                className="danger"
                            >
                                <TrashIcon />
                            </IconButton>
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
                {[10, 20, 50, 100].map(n => <option key={`ps-${n}`} value={n}>{n}</option>)}
              </select>
            </label>
          </div>
        </footer>
      </section>

      {editing && (
        <Modal title={`Commentary #${editing.id}`} onClose={() => setEditing(null)}>
          <div className="form">
            <div className="muted">Titre</div>
            <div className="mb-8">{editing.title || "Commentaire"}</div>

            <label>Texte</label>
            <textarea
              rows={10}
              value={textDraft}
              onChange={(e) => setTextDraft(e.target.value)}
              placeholder="Saisissez le commentaire…"
            />

            <label>Versets liés</label>
            <ul className="list flat">
              {(editing.verses || []).length === 0 && <li key="empty" className="muted">Aucun verset lié</li>}
              {(editing.verses || []).map(v => (
                <li key={`link-${editing.id}-${v.id}`} className="row between">
                  <span><VerseRef v={v} /></span>
                  <button className="btn sm ghost" onClick={() => unlinkVerse(v.id)}>Retirer</button>
                </li>
              ))}
            </ul>

            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setEditing(null)}>Fermer</button>
              <button className="btn pri" onClick={saveText}>Enregistrer</button>
              <button
                className={`btn ${editing.approved ? "danger" : "success"}`}
                onClick={() => toggleApprove(editing)}
              >
                {editing.approved ? "Unapprove" : "Approve"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// --------------------- Subcomponents ---------------------

function VerseRef({ v }) {
  const bookCode = v?.chapter?.book?.code ?? "";
  const ch = v?.chapter?.number ?? "?";
  const ve = v?.number ?? "?";
  return (
    <span className="refcell">
      <span className="book">{bookCode}</span>{" "}
      <span className="cv">{ch}:{ve}</span>
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
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function IconButton({ onClick, title, ariaLabel, children, className = "" }) {
  return (
    <button
      type="button"
      className={`icon-btn ${className}`}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel || title}
    >
      {children}
    </button>
  );
}

// --- Icônes (SVG inline) ---
function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" fill="none" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M7 7h7a5 5 0 110 10H6" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M7 7l3 3M7 7l3-3" fill="none" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M3 6h18M8 6V4h8v2m-1 0v14a2 2 0 01-2 2H9a2 2 0 01-2-2V6" fill="none" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M14.06 6.19l3.75 3.75" fill="none" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
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
