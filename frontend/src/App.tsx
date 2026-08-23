import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { ProfilePage } from "./pages/ProfilePage";
import { ResultsPage } from "./pages/ResultsPage";
import { SchemesPage } from "./pages/SchemesPage";
import { SchemeDetailPage } from "./pages/SchemeDetailPage";
import "./index.css";

export default function App() {
  return (
    <BrowserRouter>
      <nav className="navbar">
        <div className="container">
          <NavLink to="/" className="navbar-brand">
            <span className="icon">🏛️</span> Scheme Navigator
          </NavLink>
          <div className="navbar-links">
            <NavLink to="/" end className={({ isActive }) => isActive ? "active" : ""}>Home</NavLink>
            <NavLink to="/profile" className={({ isActive }) => isActive ? "active" : ""}>Check Eligibility</NavLink>
            <NavLink to="/schemes" className={({ isActive }) => isActive ? "active" : ""}>Browse Schemes</NavLink>
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
