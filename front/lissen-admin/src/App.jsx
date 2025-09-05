import React from "react";
import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import "./styles/index.css";

import Dashboard from "./pages/Dashboard.jsx";
import VerseListPage from "./pages/VerseListPage.jsx";
import ThemeListPage from "./pages/ThemeListPage";
import CommentaryListPage from "./pages/CommentaryListPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="topbar">
        <div className="topbar-inner">
          <div className="brand">Lissen Admin</div>
          <div className="spacer" />
          <nav className="nav">
            <NavLink to="/" end className={({isActive}) => isActive ? "active" : ""}>Tableau de bord</NavLink>
            {/* <NavLink to="/verses" className={({isActive}) => isActive ? "active" : ""}>Gérer les versets</NavLink> */}
            {/* <NavLink to="/queue" className={({isActive}) => isActive ? "active" : ""}>File de commentaires</NavLink> */}
          </nav>
        </div>
      </div>

      <main className="container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/verses" element={<VerseListPage />} />
          <Route path="/themes" element={<ThemeListPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/commentaries" element={<CommentaryListPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
