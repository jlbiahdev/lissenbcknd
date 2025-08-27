import React, { useEffect, useMemo, useState } from "react";
import "../styles/index.css";
import { API_BASE } from "../api/client";

const USE_MOCK = false;

export default function ThemeListPage(){
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(t => (t.name||"").toLowerCase().includes(s));
  }, [rows, q]);

  useEffect(() => {
    let alive = true;
    (async () => {
        setLoading(true);
        setError("");
        try {
            const data = await fetchThemes();
            if (!alive) return;
            setRows(data.items || data || []); // accepte {items:[]} ou []
        } catch(e){
            if (!alive) return;
            setError(e?.message || "Erreur de chargement");
        } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false };
  }, []);

  async function handleSave(){
    if (!editing) return;
    const payload = {
      name: (editing.name||"").trim(),
    };
    if (!payload.name) { alert("Le nom est requis."); return; }

    try {
      if (editing.id){
        const updated = await updateTheme(editing.id, payload);
        setRows(rs => rs.map(r => r.id === editing.id ? updated : r));
      } else {
        const created = await createTheme(payload);
        setRows(rs => [created, ...rs]);
      }
      setEditing(null);
    } catch(e){
      alert(e?.message || "Échec de l’enregistrement");
    }
  }

  return (
    <div className="verse-page">{/* reuse ton shell et tes tokens */}
      <header className="page-header">
        <div className="title-wrap">
          <h1 className="title">Thèmes</h1>
          <span className="sub">Gestion des thèmes (tags) pour les méditations</span>
        </div>
        <div className="header-actions">
          <button className="btn pri" onClick={() => setEditing({ name:"", slug:"", color:"", description:"" })}>Nouveau thème</button>
        </div>
      </header>

      <section className="filters">
        <div className="field" style={{flex:1}}>
          <label>Rechercher</label>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Nom, slug, description…" />
        </div>
      </section>

      <section className="card">
        {error && <div className="alert error">{error}</div>}
        {loading ? (
          <div className="loading">Chargement…</div>
        ) : (
          <div className="table-wrap">
            <table className="table" aria-label="Liste des thèmes">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th style={{width:160}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="empty">Aucun thème</td></tr>
                ) : filtered.map(t => (
                  <tr key={t.id}>
                    <td><span className="theme-chip-lite" style={{borderColor:"var(--border)"}}>{t.name}</span></td>
                    <td className="row-actions">
                      <button className="btn sm" onClick={()=>setEditing(t)}>Éditer</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editing && (
        <Modal title={editing.id ? "Éditer le thème" : "Nouveau thème"} onClose={()=>setEditing(null)}>
          <div className="form">
            <label>Nom *</label>
            <input value={editing.name||""} onChange={e=>setEditing(x=>({ ...x, name:e.target.value }))} />

            <div className="modal-actions">
              <button className="btn ghost" onClick={()=>setEditing(null)}>Annuler</button>
              <button className="btn pri" onClick={handleSave}>Enregistrer</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ———— util modal minimal ———— */
function Modal({ title, children, onClose }) {
  useEffect(() => { const o = document.body.style.overflow; document.body.style.overflow = "hidden"; return ()=>{document.body.style.overflow=o}; }, []);
  return (
    <div className="modal-root" role="dialog" aria-modal="true">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card">
        <header className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer">×</button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

/* ———— Data layer ———— */
// Adapte les routes à ton API: GET/POST/PUT/DELETE /themes
async function fetchThemes(){
  if (USE_MOCK) { await delay(200); return MOCK_THEMES; }
  const r = await fetch(`${API_BASE}/themes`); if(!r.ok) throw new Error(`HTTP ${r.status}`); return r.json();
}

async function createTheme(body){
  if (USE_MOCK) { await delay(150); return { id: Date.now(), ...body }; }
  const r = await fetch(`${API_BASE}/themes`, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(body) });
  if(!r.ok) throw new Error(`HTTP ${r.status}`); return r.json();
}

async function updateTheme(id, body){
  const r = await fetch(`${API_BASE}/themes/${id}`, { method:"PUT", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(body) });
  if(!r.ok) throw new Error(`HTTP ${r.status}`); return r.json();
}

const delay = (ms)=>new Promise(r=>setTimeout(r,ms));

/* ———— Mock ———— */
const MOCK_THEMES = [
  { id:1, name:"Foi", slug:"foi", color:"#3b82f6", description:"Confiance en Dieu" },
  { id:2, name:"Espérance", slug:"esperance", color:"#10b981", description:"Attente confiante" },
  { id:3, name:"Amour", slug:"amour", color:"#ef4444", description:"Charité agapè" },
];
