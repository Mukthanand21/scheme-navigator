import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <div className="page">
      <div className="container">
        <div className="hero">
          <div className="hero-content">
            <h1>
              Discover Your <span className="gradient-text">Government Schemes</span>
            </h1>
            <p>
              Find Indian government welfare and business schemes you're eligible for — based on your age, gender, caste, income, and more.
            </p>
            <div className="telugu">
              మీ ప్రభుత్వ పథకాలను కనుగొనండి — మీ వయస్సు, లింగం, కులం, ఆదాయం ఆధారంగా
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/profile" className="btn btn-primary">🔍 Check My Eligibility</Link>
              <Link to="/schemes" className="btn btn-secondary">📋 Browse All Schemes</Link>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
          {[
            { icon: "🏛️", title: "19 Government Schemes", desc: "Central & Telangana state schemes for welfare, loans, subsidies, and grants." },
            { icon: "🔗", title: "Graph-Powered Matching", desc: "Multi-hop traversal through gender, caste, and requirement nodes for accurate eligibility." },
            { icon: "🌐", title: "Telugu Support", desc: "All scheme names and descriptions available in Telugu for wider accessibility." },
            { icon: "⚡", title: "Instant Results", desc: "Get your eligible schemes in seconds with smart requirement matching." },
          ].map((f) => (
            <div key={f.title} className="card" style={{ textAlign: "center", padding: "32px 24px" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>{f.icon}</div>
              <h3 style={{ fontSize: "1.05rem", marginBottom: "8px" }}>{f.title}</h3>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
