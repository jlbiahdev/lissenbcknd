import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
// Page styles: add this file next to your other styles and import it in styles/index.css
// import "../styles/commentaryQueue.css";

/**
 * CommentaryQueue.jsx — File d'attente des versets à commenter (Vanilla CSS)
 *
 * Montre uniquement les versets marqués "méditatif = oui" ET (commentaire vide OU non approuvé).
 * Permet : recherche/filtre, tri, pagination, édition rapide (commentaire + approbation),
 * navigation vers la fiche détail.
 *
 * Intégration API :
 *  - Passez USE_MOCK à false et implémentez fetchQueue() & saveVerse() avec vos routes.
 */

const USE_MOCK = true; // ← passez à false pour brancher l'API
const API_BASE = (typeof window !== "undefined" && window.__API_BASE__) || "/api";

export default function CommentaryQueue() {
  const nav = useNavigate();

  // ---------------- State ----------------
  const [filters, setFilters] = useState({ bible: "", book: "", q: "" });
  const [sort, setSort] = useState({ by: "priority", dir: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ commentary: "", approved: false });

  const availableBibles = useMemo(() => ["LSG", "KJV", "S21"], []);
  const booksFromData = useMemo(() => Array.from(new Set(rows.map(r => r.book))).sort(), [rows]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setError("");
      try {
        const { items, total } = await fetchQueue({ filters, sort, page, pageSize });
        if (!alive) return;
        setRows(items); setTotal(total);
      } catch (e) {
        if (!alive) return; setError(e?.message || "Une erreur est survenue.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [filters.bible, filters.book, filters.q, sort.by, sort.dir, page, pageSize]);

  useEffect(() => {
    if (!editing) return; setEditForm({ commentary: editing.commentary || "", approved: !!editing.approved });
  }, [editing]);

  function updateFilter(name, value){ setFilters(p => ({ ...p, [name]: value })); setPage(1); }
  function onSort(by){ setSort(prev => ({ by, dir: prev.by === by && prev.dir === "asc" ? "desc" : "asc" })); }
  function openDetail(v){ nav(`/verses/${v.id}`); }

  async function saveEdit(){
    if (!editing) return;
    const payload = { commentary: editForm.commentary.trim(), approved: !!editForm.approved };
    // Optimistic update
    setRows(prev => prev.map(r => r.id === editing.id ? { ...r, ...payload, updated_at: new Date().toISOString() } : r));
    try{
      await saveVerse(editing.id, payload);
      setEditing(null);
    }catch(e){ alert("Échec de l'enregistrement: " + (e?.message || "")); }
  }

  return (
    <div className="queue-page container">
      <div className="page-title">
        <h1>File de commentaires</h1>
        <div className="page-sub">Méditatifs sans commentaire ou non approuvés</div>
      </div>

      <section className="filters card">
        <div className="field">
          <label>Bible</label>
          <select value={filters.bible} onChange={e => updateFilter("bible", e.target.value)}>
            <option value="">Toutes</option>
            {availableBibles.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Livre</label>
          <input list="books" value={filters.book} onChange={e => updateFilter("book", e.target.value)} placeholder="Ex: Psaumes" />
          <datalist id="books">
            {booksFromData.map(b => <option key={b} value={b} />)}
          </datalist>
        </div>
        <div className="field">
          <label>Texte contient</label>
          <input value={filters.q} onChange={e => updateFilter("q", e.target.value)} placeholder="Recherche…" />
        </div>
        <div className="field field--actions">
          <button className="btn ghost" onClick={() => { setFilters({ bible:"", book:"", q:"" }); setPage(1); }}>Réinitialiser</button>
        </div>
      </section>

      <section className="card">
        {error && <div className="alert error">{error}</div>}
        {loading ? (
          <div className="loading">Chargement…</div>
        ) : (
          <div className="table-wrap">
            <table className="table" role="table" aria-label="File de commentaires">
              <thead>
                <tr>
                  <Th label="Priorité" sortKey="priority" sort={sort} onSort={onSort} />
                  <Th label="Réf" sortKey="ref" sort={sort} onSort={onSort} />
                  <Th label="Texte" sortKey="text" sort={sort} onSort={onSort} />
                  <Th label="Commentaire" sortKey="has_commentary" sort={sort} onSort={onSort} />
                  <Th label="Approuvé" sortKey="approved" sort={sort} onSort={onSort} />
                  <Th label="Maj" sortKey="updated_at" sort={sort} onSort={onSort} />
                  <th style={{width:160}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={7} className="empty">Aucun verset en attente</td></tr>
                ) : rows.map(v => (
                  <tr key={v.id}>
                    <td>{v.priority}</td>
                    <td className="cell-ref">{v.book} {v.chapter}:{v.verse} {v.bible ? `· ${v.bible}` : ""}</td>
                    <td className="cell-text" title={v.text}>{truncate(v.text, 120)}</td>
                    <td>{v.commentary?.trim() ? <span className="badge ok">Oui</span> : <span className="badge">Non</span>}</td>
                    <td>{v.approved ? <span className="badge ok">Oui</span> : <span className="badge">Non</span>}</td>
                    <td>{formatDate(v.updated_at)}</td>
                    <td className="row-actions">
                      <button className="btn sm" onClick={() => setEditing(v)}>Éditer</button>
                      <button className="btn sm ghost" onClick={() => openDetail(v)}>Ouvrir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <footer className="pager">
          <div className="left">{Intl.NumberFormat().format(total)} en attente</div>
          <div className="mid">
            <button className="btn sm ghost" disabled={page<=1} onClick={() => setPage(1)}>&laquo;</button>
            <button className="btn sm ghost" disabled={page<=1} onClick={() => setPage(p=>p-1)}>Préc</button>
            <span className="page-indicator">Page {page} / {totalPages}</span>
            <button className="btn sm ghost" disabled={page>=totalPages} onClick={() => setPage(p=>p+1)}>Suiv</button>
            <button className="btn sm ghost" disabled={page>=totalPages} onClick={() => setPage(totalPages)}>&raquo;</button>
          </div>
          <div className="right">
            <label className="page-size">
              <span>Taille</span>
              <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
                {[10,20,50,100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          </div>
        </footer>
      </section>

      {editing && (
        <div className="modal-root" role="dialog" aria-modal="true">
          <div className="modal-backdrop" onClick={() => setEditing(null)} />
          <div className="modal-card">
            <header className="modal-header">
              <h3 className="modal-title">{editing.book} {editing.chapter}:{editing.verse} {editing.bible?`· ${editing.bible}`:""}</h3>
              <button className="icon-btn" onClick={() => setEditing(null)} aria-label="Fermer">
                <svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" /></svg>
              </button>
            </header>
            <div className="modal-body">
              <div className="form">
                <label>Commentaire</label>
                <textarea rows={8} value={editForm.commentary} onChange={e => setEditForm(f => ({ ...f, commentary: e.target.value }))} placeholder="Saisir un commentaire pastoral…" />
                <label className="chk">
                  <input type="checkbox" checked={!!editForm.approved} onChange={e => setEditForm(f => ({ ...f, approved: e.target.checked }))} />
                  <span>Approuver</span>
                </label>
                <div className="modal-actions">
                  <button className="btn ghost" onClick={() => setEditing(null)}>Annuler</button>
                  <button className="btn pri" onClick={saveEdit}>Enregistrer</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ label, sortKey, sort, onSort }){
  const active = sort.by === sortKey; const dir = active ? sort.dir : undefined;
  return (
    <th className={active ? `sorted ${dir}` : undefined}>
      <button className="th-btn" onClick={() => onSort(sortKey)}>
        <span>{label}</span>
        <svg viewBox="0 0 24 24" width="16" height="16" className="chev"><path d="M7 14l5-5 5 5" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
      </button>
    </th>
  );
}

// ---------------- Data layer ----------------
async function fetchQueue({ filters, sort, page, pageSize }){
  if (USE_MOCK){
    let items = MOCK_DATA.filter(v => v.is_meditative && (!v.commentary?.trim() || !v.approved));
    if (filters.bible) items = items.filter(v => v.bible === filters.bible);
    if (filters.book) items = items.filter(v => v.book.toLowerCase().includes(filters.book.toLowerCase()));
    if (filters.q) items = items.filter(v => v.text.toLowerCase().includes(filters.q.toLowerCase()));
    items = sortArray(items, sort.by, sort.dir);
    const total = items.length; const start = (page-1)*pageSize; const paged = items.slice(start, start+pageSize);
    await delay(250); return { items: paged, total };
  }
  // TODO: remplacez par vos routes
  const params = new URLSearchParams();
  if (filters.bible) params.set("bible", filters.bible);
  if (filters.book) params.set("book", filters.book);
  if (filters.q) params.set("q", filters.q);
  params.set("page", String(page)); params.set("pageSize", String(pageSize)); params.set("sort", `${sort.by}:${sort.dir}`);
  const res = await fetch(`${API_BASE}/verses/queue?${params.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json();
}

async function saveVerse(id, body){
  if (USE_MOCK){ await delay(200); return { ok:true }; }
  const res = await fetch(`${API_BASE}/verses/${id}`,{ method:"PUT", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body)});
  if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json();
}

// ---------------- Utils & Mock ----------------
function truncate(str,n){ return str && str.length>n ? str.slice(0,n-1)+"…" : str; }
function formatDate(iso){ if(!iso) return "—"; const d=new Date(iso); return new Intl.DateTimeFormat(undefined,{year:"numeric",month:"2-digit",day:"2-digit"}).format(d); }
function sortArray(arr, by, dir){ const m=dir==="desc"?-1:1; return [...arr].sort((a,b)=>{ const va = by==="ref"?`${a.book}-${a.chapter}-${a.verse}`:a[by]; const vb = by==="ref"?`${b.book}-${b.chapter}-${b.verse}`:b[by]; if(va==null&&vb==null) return 0; if(va==null) return -1*m; if(vb==null) return 1*m; if(typeof va==="boolean") return (Number(va)-Number(vb))*m; if(typeof va==="number") return (va-vb)*m; return String(va).localeCompare(String(vb))*m; }); }
function delay(ms){ return new Promise(r=>setTimeout(r,ms)); }

const BOOKS = ["Genèse","Exode","Lévitique","Nombres","Deutéronome","Josué","Juges","Ruth","1 Samuel","2 Samuel","1 Rois","2 Rois","Psaumes","Proverbes","Ésaïe","Jérémie","Ézéchiel","Matthieu","Marc","Luc","Jean","Actes","Romains"];
const MOCK_DATA = Array.from({ length: 120 }).map((_, i) => {
  const book = BOOKS[i % BOOKS.length]; const chapter=(i%50)+1; const verse=(i%20)+1;
  const is_meditative = i % 2 === 0; const approved = i % 5 === 0; const hasComment = i % 3 === 0;
  return {
    id: `v_${i+1}`,
    bible: ["LSG","KJV","S21"][i%3],
    book, chapter, verse,
    text: `Texte d'exemple du verset ${book} ${chapter}:${verse} — « Le Seigneur est mon berger, je ne manquerai de rien. »`,
    is_meditative,
    commentary: hasComment ? `Brouillon #${i+1}` : "",
    approved,
    updated_at: new Date(Date.now()-i*86400000).toISOString(),
    priority: Math.floor(Math.random()*100), // juste pour le tri
    has_commentary: hasComment,
  };
});
