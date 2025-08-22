import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/index.css";

/**
 * Dashboard.jsx — Lissen Admin Front (Vanilla CSS)
 *
 * Objectifs:
 * - Vue d'ensemble rapide (compteurs clés)
 * - Liens d'accès rapides (gestion des versets, file de commentaires, paramètres)
 * - Section "Activité récente"
 * - Graphiques légers en pur SVG (sans lib)
 * - Thème et styles harmonisés (mêmes tokens que VerseList/Detail)
 *
 * Intégration API:
 * - Set USE_MOCK = false pour brancher les endpoints réels.
 * - Endpoints attendus (à adapter):
 *   GET /stats/verses => { total, meditative, approved, pending }
 *   GET /activity/recent => [ { id, type, label, atISO } ]
 *   GET /stats/weekly => { labels:[], created:[], commented:[], approved:[] }
 */

const USE_MOCK = true;
const API_BASE = (typeof window !== "undefined" && window.__API_BASE__) || "/api";

export default function Dashboard(){

  const [stats, setStats] = useState({ total:0, meditative:0, approved:0, pending:0 });
  const [activity, setActivity] = useState([]);
  const [weekly, setWeekly] = useState({ labels:[], created:[], commented:[], approved:[] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setError("");
      try {
        const [s, a, w] = await Promise.all([
          fetchStats(), fetchActivity(), fetchWeekly()
        ]);
        if (!alive) return;
        setStats(s); setActivity(a); setWeekly(w);
      } catch(e){ if (!alive) return; setError(e?.message || "Erreur de chargement du dashboard"); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false };
  }, []);

  return (
    <div className="dash-page">
      <header className="dash-header">
        <h1 className="title">Tableau de bord</h1>
        <nav className="quick-nav">
          <Link className="btn pri" to="/verses">Gérer les versets</Link>
          <Link className="btn ghost" to="/commentary-queue">File de commentaires</Link>
          <Link className="btn ghost" to="/settings">Paramètres</Link>
        </nav>
      </header>

      {error && <div className="alert error">{error}</div>}

      {loading ? (
        <div className="loading lg">Chargement…</div>
      ) : (
        <>
          <section className="cards-4">
            <StatCard label="Total versets" value={stats.total} hint="Toutes versions confondues" />
            <StatCard label="Méditatifs" value={stats.meditative} hint="Taggés à commenter" tone="accent2" />
            <StatCard label="Approuvés" value={stats.approved} hint="Commentaire validé" tone="ok" />
            <StatCard label="En attente" value={stats.pending} hint="À commenter ou à relire" />
          </section>

          <section className="grid-2">
            <div className="card panel">
              <div className="panel-head">
                <h3>Tendance hebdo</h3>
                <span className="sub">Créations / Commentaires / Approbations</span>
              </div>
              <MiniChart data={weekly} height={140} />
            </div>

            <div className="card panel">
              <div className="panel-head">
                <h3>Accès rapides</h3>
                <span className="sub">Les actions les plus courantes</span>
              </div>
              <div className="quick-grid">
                <Link className="quick" to="/verses?meditative=yes">
                  <div className="q-icon">✍️</div>
                  <div className="q-title">Versets à commenter</div>
                  <div className="q-sub">Filtre "méditatif = oui"</div>
                </Link>
                <Link className="quick" to="/verses?approved=no">
                  <div className="q-icon">📝</div>
                  <div className="q-title">Commentaires en brouillon</div>
                  <div className="q-sub">Non approuvés</div>
                </Link>
                <Link className="quick" to="/verses?book=Psaumes">
                  <div className="q-icon">🎯</div>
                  <div className="q-title">Psaumes</div>
                  <div className="q-sub">Filtrer par livre</div>
                </Link>
                <Link className="quick" to="/verses/new">
                  <div className="q-icon">➕</div>
                  <div className="q-title">Lorem, ipsum dolor.</div>
                  <div className="q-sub">Lorem, ipsum.</div>
                </Link>
              </div>
            </div>
          </section>

          <section className="card panel">
            <div className="panel-head">
              <h3>Activité récente</h3>
              <span className="sub">10 derniers événements</span>
            </div>
            {activity.length === 0 ? (
              <div className="empty">Aucune activité récente</div>
            ) : (
              <ul className="activity">
                {activity.map(it => (
                  <li key={it.id}>
                    <span className={`pill ${it.type}`}>{labelType(it.type)}</span>
                    <span className="label">{it.label}</span>
                    <span className="date">{formatDateTime(it.atISO)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, hint, tone }){
  return (
    <div className={`card stat ${tone || ""}`}>
      <div className="value">{Intl.NumberFormat().format(value || 0)}</div>
      <div className="label">{label}</div>
      {hint ? <div className="hint">{hint}</div> : null}
    </div>
  );
}

function MiniChart({ data, height = 120 }){
  const pad = 24; // padding for axes labels
  const width = 520;
  const maxY = Math.max(1, ...data.created, ...data.commented, ...data.approved);
  const labels = data.labels.length ? data.labels : ["L", "M", "M", "J", "V", "S", "D"];

  const series = [
    { key: "created", values: data.created },
    { key: "commented", values: data.commented },
    { key: "approved", values: data.approved },
  ];
  const paths = series.map(s => linePath(s.values, width, height, pad, maxY));

  return (
    <svg className="mini-chart" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <g className="axes">
        <line x1={pad} y1={height-pad} x2={width-pad/2} y2={height-pad} />
        <line x1={pad} y1={pad/2} x2={pad} y2={height-pad} />
        {labels.map((lab, i) => (
          <text key={i} x={pad + i * ((width - pad*2)/ (labels.length-1 || 1))} y={height-6} textAnchor="middle">{lab}</text>
        ))}
      </g>
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" strokeWidth="2" />
      ))}
    </svg>
  );
}

function linePath(values, width, height, pad, maxY){
  const n = Math.max(1, values.length);
  const w = width - pad*2; const h = height - pad*2;
  const step = n > 1 ? w / (n - 1) : 0;
  const y = (v) => height - pad - (h * (v / (maxY || 1)));
  const x = (i) => pad + i * step;
  let d = "";
  values.forEach((v, i) => {
    const cmd = i === 0 ? "M" : "L";
    d += `${cmd}${x(i)},${y(v || 0)}`;
  });
  return d || `M${pad},${height-pad} L${width-pad},${height-pad}`;
}

// ---------------- Data ----------------
async function fetchStats(){
  if (USE_MOCK) {
    await delay(200);
    return { total: 3120, meditative: 1040, approved: 680, pending: 2440 };
  }
  const res = await fetch(`${API_BASE}/stats/verses`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
async function fetchActivity(){
  if (USE_MOCK) {
    await delay(220);
    return Array.from({ length: 10 }).map((_, i) => ({
      id: `a_${i+1}`,
      type: ["create","comment","approve"][i % 3],
      label: `Psaumes ${(i%50)+1}:${(i%20)+1} — mise à jour`,
      atISO: new Date(Date.now() - i * 3600_000).toISOString(),
    }));
  }
  const res = await fetch(`${API_BASE}/activity/recent`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
async function fetchWeekly(){
  if (USE_MOCK) {
    await delay(200);
    const labels = ["L","M","M","J","V","S","D"];
    const created = [4,8,3,10,6,2,7];
    const commented = [2,5,1,8,3,1,4];
    const approved = [1,4,1,6,3,1,2];
    return { labels, created, commented, approved };
  }
  const res = await fetch(`${API_BASE}/stats/weekly`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ---------------- Utils & Styles ----------------
function labelType(t){ return t === "create" ? "Création" : t === "comment" ? "Commentaire" : "Approbation"; }
function formatDateTime(iso){ if (!iso) return "—"; const d = new Date(iso); return new Intl.DateTimeFormat(undefined, { dateStyle:"short", timeStyle:"short" }).format(d); }
function delay(ms){ return new Promise(r => setTimeout(r, ms)); }
