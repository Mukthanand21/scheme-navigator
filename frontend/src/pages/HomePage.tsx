import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";

export function HomePage() {
  const { t, lang } = useLanguage();

  const features = lang === "te" ? [
    { icon: "🏛️", title: "19 ప్రభుత్వ పథకాలు", desc: "కేంద్ర మరియు తెలంగాణ రాష్ట్ర సంక్షేమ, రుణ, సబ్సిడీ పథకాలు." },
    { icon: "🔗", title: "గ్రాఫ్ ఆధారిత మ్యాచింగ్", desc: "లింగం, కులం మరియు ఇతర అర్హతలతో కూడిన అధునాతన మల్టీ-హాప్ ట్రావర్సల్ మ్యాచింగ్." },
    { icon: "🌐", title: "తెలుగు మద్దతు", desc: "అన్ని పథకాల పేర్లు మరియు వివరాలు తెలుగులో పూర్తిగా అందుబాటులో ఉన్నాయి." },
    { icon: "⚡", title: "తక్షణ ఫలితాలు", desc: "మీ ప్రొఫైల్ ఆధారంగా అర్హత గల పథకాలను క్షణాల్లో కనుగొనండి." }
  ] : [
    { icon: "🏛️", title: "19 Government Schemes", desc: "Central & Telangana state schemes for welfare, loans, subsidies, and grants." },
    { icon: "🔗", title: "Graph-Powered Matching", desc: "Multi-hop traversal through gender, caste, and requirement nodes for accurate eligibility." },
    { icon: "🌐", title: "Telugu Support", desc: "All scheme names and descriptions available in Telugu for wider accessibility." },
    { icon: "⚡", title: "Instant Results", desc: "Get your eligible schemes in seconds with smart requirement matching." }
  ];

  return (
    <div className="page">
      <div className="container">
        <div className="hero">
          <div className="hero-content">
            <h1>
              {lang === "te" ? <>మీ ప్రభుత్వ <span className="gradient-text">పథకాలను కనుగొనండి</span></> : <>Discover Your <span className="gradient-text">Government Schemes</span></>}
            </h1>
            <p>
              {t("heroDesc")}
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginTop: "24px" }}>
              <Link to="/profile" className="btn btn-primary">
                🔍 {t("btnSubmit")}
              </Link>
              <Link to="/schemes" className="btn btn-secondary">
                📋 {t("navBrowseAll")}
              </Link>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
          {features.map((f) => (
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
