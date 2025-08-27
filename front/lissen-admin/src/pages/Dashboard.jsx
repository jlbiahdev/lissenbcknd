import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/index.css";
import { API_BASE } from "../api/client";

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

export default function Dashboard(){

  const [stats, setStats] = useState({ total:0, meditative:0, approved:0, pending:0 });
  const [activity, setActivity] = useState([]);
  const [weekly, setWeekly] = useState({ labels:[], created:[], commented:[], approved:[] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    console.log("Fetching dashboard data...");
    let alive = true;
    (async () => {
      setLoading(true); setError("");
      try {
        const [s, a, w] = await Promise.all([
          fetchStats(), fetchActivity(), fetchWeekly()
        ]);
        if (!alive) return;
        console.log("Dashboard data fetched:", { stats: s, activity: a, weekly: w });
        setStats(s);
        setActivity(a);
        setWeekly(w);
      } catch(e) {
        if (!alive) return;
        setError(e?.message || "Erreur de chargement du dashboard");
      } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false };
  }, []);

  const QUICK_LINKS = [
    { icon: "✍️", title: "Versets à commenter", sub: "Méditatif = oui", to: "/verses?meditative=yes", enabled: true },
    { icon: "✅", title: "Approbations en attente", sub: "Commentaires non validés", to: "/verses?approved=no", enabled: true },

    { icon: "🧘", title: "Méditations", sub: "Composer & publier", to: "/meditations", enabled: false },
    { icon: "📰", title: "Blog", sub: "Rédiger un article", to: "/blog", enabled: false },
    { icon: "📚", title: "Études bibliques", sub: "Séries & leçons", to: "/studies", enabled: false },
    { icon: "🙏", title: "Prières", sub: "Thématiques & séries", to: "/prayers", enabled: false },
    { icon: "🎛️", title: "Tous les modules", sub: "Catalogue des features", to: "/modules", enabled: false },
    { icon: "🏷️", title: "Thèmes", sub: "Gérer les tags", to: "/themes", enabled: true },
  ];

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
            <StatCard label="Méditatifs" value={stats.meditatives} hint="Taggés à commenter" tone="accent2" />
            <StatCard label="Approuvés" value={stats.approved} hint="Commentaires validés" tone="ok" />
            <StatCard label="En attente" value={stats.pending} hint="À commenter ous à relire" />
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
                {QUICK_LINKS.map((q, idx) =>
                  q.enabled ? (
                    <Link key={idx} className="quick" to={q.to}>
                      <div className="q-icon">{q.icon}</div>
                      <div className="q-title">{q.title}</div>
                      <div className="q-sub">{q.sub}</div>
                    </Link>
                  ) : (
                    <div key={idx} className="quick disabled" aria-disabled="true" title="Bientôt">
                      <div className="q-icon">{q.icon}</div>
                      <div className="q-title">
                        {q.title} <span className="soon">Bientôt</span>
                      </div>
                      <div className="q-sub">{q.sub}</div>
                    </div>
                  )
                )}
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

function MiniChart({ data, height = 120 }) {
  const pad = 24;
  const width = 520;

  // coerce + guard
  const created   = (data.created   || []).map(Number);
  const commented = (data.commented || []).map(Number);
  const approved  = (data.approved  || []).map(Number);
  const labels    = (data.labels && data.labels.length ? data.labels : ["L","M","M","J","V","S","D"]);

  console.log("MiniChart data:", data);
  const maxY = Math.max(1, ...created, ...commented, ...approved);
  const series = [
    { key: "created",   values: created,   stroke: "var(--accent)"   },
    { key: "commented", values: commented, stroke: "var(--accent-2)" },
    { key: "approved",  values: approved,  stroke: "var(--muted)"    },
  ];
  const paths = series.map(s => linePath(s.values, width, height, pad, maxY));

  const sumCreated = created.reduce((a, b) => a + b, 0);
  const sumCommented = commented.reduce((a, b) => a + b, 0);
  const sumApproved = approved.reduce((a, b) => a + b, 0);

  return (
    <>
      <svg className="mini-chart" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <g className="axes" stroke="var(--border)" strokeWidth="1">
          <line x1={pad} y1={height-pad} x2={width-pad/2} y2={height-pad} />
          <line x1={pad} y1={pad/2} x2={pad} y2={height-pad} />
          {labels.map((lab, i) => (
            <text key={i} x={pad + i * ((width - pad*2)/ (labels.length-1 || 1))} y={height-6} textAnchor="middle" fill="var(--muted)">
              {lab}
            </text>
          ))}
        </g>
        {paths.map((d, i) => (
          <path key={i} className={`s-${series[i].key}`} d={d} fill="none" strokeWidth="2" />
        ))}
      </svg>
      <div className="legend">
        <span><i className="dot created" /> Créations ({sumCreated})</span>
        <span><i className="dot commented" /> Commentaires ({sumCommented})</span>
        <span><i className="dot approved" /> Approbations ({sumApproved})</span>
      </div>
    </>
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
  const url = `${API_BASE}/stats/verses`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  console.log("Real data fetched:", data);
  return data;

}

async function fetchActivity(){
  const res = await fetch(`${API_BASE}/stats/activity`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchWeekly(){
  const res = await fetch(`${API_BASE}/stats/weekly`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ---------------- Utils & Styles ----------------
function labelType(t){ return t === "create" ? "Création" : t === "comment" ? "Commentaire" : "Approbation"; }
function formatDateTime(iso){ if (!iso) return "—"; const d = new Date(iso); return new Intl.DateTimeFormat(undefined, { dateStyle:"short", timeStyle:"short" }).format(d); }
function delay(ms){ return new Promise(r => setTimeout(r, ms)); }
