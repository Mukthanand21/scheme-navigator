import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import type { SchemeDetailResponse } from "../types";
import { RelatedSchemes } from "../components/RelatedSchemes";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorState } from "../components/ErrorState";

function formatAmount(n?: number | null): string {
  if (n == null) return "—";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function SchemeDetailPage() {
  const { schemeId } = useParams<{ schemeId: string }>();
  const [scheme, setScheme] = useState<SchemeDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScheme = () => {
    if (!schemeId) return;
    setLoading(true);
    setError(null);
    api.getScheme(schemeId).then(setScheme).catch((err) => setError(err.message)).finally(() => setLoading(false));
  };

  useEffect(fetchScheme, [schemeId]);

  if (loading) return <div className="page"><div className="container"><LoadingSpinner message="Loading scheme details..." /></div></div>;
  if (error) return <div className="page"><div className="container"><ErrorState message={error} onRetry={fetchScheme} /></div></div>;
  if (!scheme) return null;

  return (
    <div className="page">
      <div className="container">
        <Link to="/schemes" className="back-link">← All Schemes</Link>

        <div className="scheme-detail">
          <div className="scheme-detail-header">
            <h1>{scheme.name}</h1>
            {scheme.telugu_name && <div className="telugu">{scheme.telugu_name}</div>}
            <p className="description">{scheme.description}</p>
            {scheme.telugu_description && (
              <p className="description" style={{ color: "var(--text-muted)", marginTop: "8px", fontStyle: "italic" }}>
                {scheme.telugu_description}
              </p>
            )}
          </div>

          <div className="detail-grid">
            <div className="card">
              <div className="detail-section">
                <h4>💰 Financial Details</h4>
                <div className="detail-row"><span className="label">Amount Range</span><span className="value">{formatAmount(scheme.amount_min)} — {formatAmount(scheme.amount_max)}</span></div>
                <div className="detail-row"><span className="label">Interest Rate</span><span className="value">{scheme.interest_rate || "N/A"}</span></div>
                <div className="detail-row"><span className="label">Benefit Type</span><span className="value">{scheme.benefit_type || "N/A"}</span></div>
                {scheme.unit && <div className="detail-row"><span className="label">Unit</span><span className="value">{scheme.unit}</span></div>}
              </div>
            </div>

            <div className="card">
              <div className="detail-section">
                <h4>✅ Eligibility</h4>
                <div className="detail-row"><span className="label">Age</span><span className="value">{scheme.age_min ?? "Any"} — {scheme.age_max ?? "No limit"}</span></div>
                <div className="detail-row"><span className="label">Gender</span><span className="value">{scheme.genders?.join(", ") || "Any"}</span></div>
                <div className="detail-row"><span className="label">Caste</span><span className="value">{scheme.castes?.length === 7 ? "All categories" : scheme.castes?.join(", ").toUpperCase() || "Any"}</span></div>
                {scheme.max_annual_income && <div className="detail-row"><span className="label">Max Income</span><span className="value">{formatAmount(scheme.max_annual_income)}</span></div>}
                {scheme.max_annual_turnover && <div className="detail-row"><span className="label">Max Turnover</span><span className="value">{formatAmount(scheme.max_annual_turnover)}</span></div>}
                {scheme.max_units_usage && <div className="detail-row"><span className="label">Max Units</span><span className="value">{scheme.max_units_usage}</span></div>}
                {scheme.required_flags.length > 0 && (
                  <div className="detail-row"><span className="label">Requirements</span><span className="value">{scheme.required_flags.join(", ")}</span></div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="detail-section">
                <h4>📊 Processing</h4>
                <div className="detail-row"><span className="label">Processing Time</span><span className="value">{scheme.processing_time_days ? `${scheme.processing_time_days} days` : "N/A"}</span></div>
                <div className="detail-row"><span className="label">Success Rate</span><span className="value" style={{ textTransform: "capitalize" }}>{scheme.success_rate || "N/A"}</span></div>
                <div className="detail-row"><span className="label">Helpline</span><span className="value">{scheme.helpline || "N/A"}</span></div>
              </div>
            </div>

            <div className="card">
              <div className="detail-section">
                <h4>📄 Documents Required</h4>
                <ul className="documents-list">
                  {scheme.documents.map((d) => <li key={d}>{d}</li>)}
                  {scheme.documents.length === 0 && <li style={{ color: "var(--text-muted)" }}>No specific documents listed</li>}
                </ul>
              </div>
            </div>
          </div>

          <div className="tags" style={{ marginBottom: "24px" }}>
            {scheme.tags.map((t) => <span key={t} className="tag">{t}</span>)}
          </div>

          <div className="apply-actions">
            {scheme.apply_url && (
              <a href={scheme.apply_url.startsWith("http") ? scheme.apply_url : `https://${scheme.apply_url}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                🌐 Apply Online
              </a>
            )}
            {scheme.apply_offline && (
              <div className="btn btn-secondary" style={{ cursor: "default" }}>
                🏢 Offline: {scheme.apply_offline}
              </div>
            )}
          </div>
        </div>

        {schemeId && <RelatedSchemes schemeId={schemeId} />}
      </div>
    </div>
  );
}
