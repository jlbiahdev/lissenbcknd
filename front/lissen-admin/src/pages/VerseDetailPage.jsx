import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/index.css";

/**
 * VerseDetailPage.jsx — Lissen Admin Front (Vanilla CSS)
 *
 * Features (v1):
 * - Loads a single verse by :id (mock or API)
 * - Shows full reference, text, metadata
 * - Edit: commentary, approved, is_meditative (optimistic)
 * - Quick actions: Approve, Toggle Meditative, Copy Ref, Export JSON
 * - Inline validation + dirty state protection on navigation
 * - Reuses the same visual language as VerseListPage (Vanilla CSS injected)
 *
 * API Integration:
 * - Set USE_MOCK = false to call your backend.
 * - API_BASE defaults to window.__API_BASE__ || "/api".
 * - Expected endpoints (adjust to your routes):
 *   GET  /verses/:id
 *   PUT  /verses/:id   { commentary, approved, is_meditative }
 */

const USE_MOCK = true; // TODO: switch to false when backend is ready
const API_BASE = (typeof window !== "undefined" && window.__API_BASE__) || "/api";

export default function VerseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [model, setModel] = useState(null); // server state
  const [form, setForm] = useState(null);   // local editable copy
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  const dirty = useMemo(() => model && form && JSON.stringify(slim(model)) !== JSON.stringify(slim(form)), [model, form]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setError("");
      try {
        const data = await fetchVerseById(id);
        if (!alive) return;
        setModel(data);
        setForm(structuredClone(data));
      } catch (e) {
        if (!alive) return; setError(e?.message || "Impossible de charger le verset.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  useEffect(() => {
    const beforeUnload = (e) => {
      if (dirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);

  function onBack() {
    if (dirty && !confirm("Des modifications non enregistrées seront perdues. Continuer ?")) return;
    navigate(-1);
  }

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    try {
      const payload = { commentary: (form.commentary || "").trim(), approved: !!form.approved, is_meditative: !!form.is_meditative };
      await saveVerse(form.id, payload);
      setModel(prev => ({ ...prev, ...payload, updated_at: new Date().toISOString() }));
      setForm(prev => ({ ...prev, ...payload }));
      setSavedAt(new Date());
    } catch (e) {
      alert("Échec de l'enregistrement: " + (e?.message || ""));
    } finally {
      setSaving(false);
    }
  }

  async function toggleMeditative() {
    if (!form) return;
    const next = !form.is_meditative;
    setForm(f => ({ ...f, is_meditative: next }));
    try {
      await saveVerse(form.id, { is_meditative: next, commentary: (form.commentary||"").trim(), approved: !!form.approved });
      setModel(m => ({ ...m, is_meditative: next, updated_at: new Date().toISOString() }));
      setSavedAt(new Date());
    } catch (e) {
      setForm(f => ({ ...f, is_meditative: !next }));
      alert("Échec de la mise à jour: " + (e?.message || ""));
    }
  }

  async function quickApprove() {
    if (!form) return;
    const next = !form.approved;
    setForm(f => ({ ...f, approved: next }));
    try {
      await saveVerse(form.id, { approved: next, commentary: (form.commentary||"").trim(), is_meditative: !!form.is_meditative });
      setModel(m => ({ ...m, approved: next, updated_at: new Date().toISOString() }));
      setSavedAt(new Date());
    } catch (e) {
      setForm(f => ({ ...f, approved: !next }));
      alert("Échec de la mise à jour: " + (e?.message || ""));
    }
  }

  function copyRef() {
    if (!form) return;
    const ref = buildRef(form);
    navigator.clipboard.writeText(ref).then(() => {
      toast("Référence copiée");
    });
  }

  function exportJSON() {
    if (!form) return;
    const blob = new Blob([JSON.stringify(form, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${form.book}-${form.chapter}-${form.verse}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  if (loading) return <PageShell><div className="loading lg">Chargement…</div></PageShell>;
  if (error) return <PageShell><div className="alert error">{error}</div></PageShell>;
  if (!form) return null;

  return (
    <PageShell>
      <header className="detail-header">
        <button className="btn ghost" onClick={onBack}>← Retour</button>
        <div className="refbig" title={buildRef(form)}>
          <span className="book">{form.book}</span> <span className="cv">{form.chapter}:{form.verse}</span>
          {form.bible ? <span className="bible">· {form.bible}</span> : null}
        </div>
        <div className="header-actions">
          <button className="btn ghost" onClick={copyRef}>Copier réf.</button>
          <button className="btn ghost" onClick={exportJSON}>Exporter</button>
          <button className={"btn " + (form.approved ? "pri" : "") } onClick={quickApprove}>
            {form.approved ? "Retirer l'approbation" : "Approuver"}
          </button>
          <button className={"btn " + (dirty ? "pri" : "") } disabled={!dirty || saving} onClick={handleSave}>
            {saving ? "Enregistrement…" : dirty ? "Enregistrer" : "Enregistré"}
          </button>
        </div>
      </header>

      <section className="card detail-card">
        <div className="meta">
          <div className="meta-item"><span className="k">ID</span><span className="v">{form.id}</span></div>
          <div className="meta-item"><span className="k">Méditatif</span>
            <label className="switch" aria-label="Basculer méditatif">
              <input type="checkbox" checked={!!form.is_meditative} onChange={toggleMeditative} />
              <span className="slider" />
            </label>
          </div>
          <div className="meta-item"><span className="k">Approuvé</span><span className={"badge " + (form.approved?"ok":"")}>{form.approved?"Oui":"Non"}</span></div>
          <div className="meta-item"><span className="k">Maj</span><span className="v">{formatDate(form.updated_at)}</span></div>
        </div>

        <div className="verse-text">
          <h4>Texte</h4>
          <p>{form.text}</p>
        </div>

        <div className="form">
          <label>Commentaire pastoral</label>
          <textarea
            rows={10}
            value={form.commentary || ""}
            onChange={e => setForm(f => ({ ...f, commentary: e.target.value }))}
            placeholder="Votre commentaire pastoral…"
          />

          <label className="chk">
            <input type="checkbox" checked={!!form.approved} onChange={e => setForm(f => ({ ...f, approved: e.target.checked }))} />
            <span>Approuvé</span>
          </label>
        </div>

        {savedAt && <div className="saved-hint">Sauvegardé à {savedAt.toLocaleTimeString()}</div>}
      </section>
    </PageShell>
  );
}

// --------------- Layout shell ---------------
function PageShell({ children }){
  return (
    <div className="verse-page">
      {children}
    </div>
  );
}

// --------------- Data layer ---------------
async function fetchVerseById(id){
  if (USE_MOCK){
    await mockDelay(300);
    const found = MOCK_DATA.find(v => v.id === id) || MOCK_DATA[0];
    if (!found) throw new Error("Introuvable");
    return structuredClone(found);
  }
  const res = await fetch(`${API_BASE}/verses/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function saveVerse(id, body){
  if (USE_MOCK){ await mockDelay(300); return { ok:true }; }
  const res = await fetch(`${API_BASE}/verses/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// --------------- Utils ---------------
function buildRef(v){ return `${v.book} ${v.chapter}:${v.verse}${v.bible?` · ${v.bible}`:""}`; }
function slim(v){ return { commentary: v.commentary || "", approved: !!v.approved, is_meditative: !!v.is_meditative }; }
function mockDelay(ms){ return new Promise(r => setTimeout(r, ms)); }
function formatDate(iso){ if (!iso) return "—"; const d = new Date(iso); return new Intl.DateTimeFormat(undefined, { year:"numeric", month:"2-digit", day:"2-digit" }).format(d); }
function toast(msg){
  const el = document.createElement("div");
  el.className = "toast"; el.textContent = msg; document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 200); }, 1500);
}

// --------------- Mock (reuses list page structure loosely) ---------------
const MOCK_BOOKS = [
  "Genèse", "Exode", "Lévitique", "Nombres", "Deutéronome",
  "Josué", "Juges", "Ruth", "1 Samuel", "2 Samuel", "1 Rois", "2 Rois",
  "Psaumes", "Proverbes", "Ésaïe", "Jérémie", "Ézéchiel",
  "Matthieu", "Marc", "Luc", "Jean", "Actes", "Romains"
];
const MOCK_DATA = Array.from({ length: 24 }).map((_, i) => {
  const book = MOCK_BOOKS[i % MOCK_BOOKS.length];
  const chapter = (i % 50) + 1; const verse = (i % 20) + 1;
  const is_meditative = i % 3 === 0; const approved = i % 5 === 0;
  return {
    id: `v_${i + 1}`,
    bible: ["LSG", "KJV", "S21"][i % 3],
    book, chapter, verse,
    text: `Texte d'exemple du verset ${book} ${chapter}:${verse} — « Le Seigneur est mon berger, je ne manquerai de rien. »`,
    is_meditative,
    commentary: is_meditative ? `Commentaire pastoral (mock) #${i + 1}` : "",
    approved,
    updated_at: new Date(Date.now() - i * 86400000).toISOString(),
  };
});