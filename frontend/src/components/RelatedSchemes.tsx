import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { RelatedSchemeResponse } from "../types";

function formatAmount(n?: number | null): string {
  if (n == null) return "—";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function RelatedSchemes({ schemeId }: { schemeId: string }) {
  const [related, setRelated] = useState<RelatedSchemeResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getRelatedSchemes(schemeId).then(setRelated).catch(() => setRelated([])).finally(() => setLoading(false));
  }, [schemeId]);

  if (loading) return <div className="state-container" style={{ padding: "40px" }}><div className="spinner" /></div>;
  if (related.length === 0) return null;

  return (
    <div className="related-section">
      <h2>You may also qualify for</h2>
      <p>Schemes similar to this one, based on shared categories and requirements.</p>
      <div className="schemes-grid">
        {related.map((s, i) => (
          <div key={s.id} className="card scheme-card" style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="scheme-card-header">
              <div>
                <h3>{s.name}</h3>
                {s.telugu_name && <div className="telugu-name">{s.telugu_name}</div>}
              </div>
              <div className="similarity-badge">🔗 {s.shared_tags} shared tags</div>
            </div>
            <p className="description">{s.description}</p>
            <div className="amount-range">
              <span className="amount">{formatAmount(s.amount_min)}</span>
              {s.amount_min !== s.amount_max && (
                <><span className="separator">—</span><span className="amount">{formatAmount(s.amount_max)}</span></>
              )}
            </div>
            <div className="scheme-card-footer">
              <div className="tags">
                {s.tags.slice(0, 3).map((t) => <span key={t} className="tag">{t}</span>)}
              </div>
              <Link to={`/schemes/${s.id}`} className="btn btn-outline btn-sm" style={{ marginLeft: "auto" }}>
                Details →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
