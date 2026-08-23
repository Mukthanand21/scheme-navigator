import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { ProfilePage } from "./pages/ProfilePage";
import { ResultsPage } from "./pages/ResultsPage";
import { SchemesPage } from "./pages/SchemesPage";
import { SchemeDetailPage } from "./pages/SchemeDetailPage";
import { LanguageProvider, useLanguage } from "./i18n/LanguageContext";
import "./index.css";

function AppContent() {
  const { t, toggleLanguage } = useLanguage();

  return (
    <BrowserRouter>
      <nav className="navbar">
        <div className="container">
          <NavLink to="/" className="navbar-brand">
            <span className="icon">🏛️</span> {t("heroTitle")}
          </NavLink>
          <div className="navbar-links" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <NavLink to="/" end className={({ isActive }) => isActive ? "active" : ""}>
              {t("navHome")}
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => isActive ? "active" : ""}>
              {t("navFindSchemes")}
            </NavLink>
            <NavLink to="/schemes" className={({ isActive }) => isActive ? "active" : ""}>
              {t("navBrowseAll")}
            </NavLink>
            <button 
              onClick={toggleLanguage} 
              className="btn btn-outline btn-sm lang-toggle"
              style={{ padding: "4px 8px", fontSize: "13px", height: "auto" }}
            >
              {t("navLanguage")}
            </button>
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/results/:citizenId" element={<ResultsPage />} />
        <Route path="/schemes" element={<SchemesPage />} />
        <Route path="/schemes/:schemeId" element={<SchemeDetailPage />} />
      </Routes>

      <footer className="footer">
        <div className="container">
          Scheme Navigator — CognoDB Assignment • Built with FastAPI + React + CognoDB
        </div>
      </footer>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
