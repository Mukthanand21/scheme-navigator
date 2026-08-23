import { Link } from "react-router-dom";
import type { SchemeResponse } from "../types";

function formatAmount(n?: number | null): string {
  if (n == null) return "—";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function getBenefitBadgeClass(type?: string | null): string {
  if (!type) return "badge-muted";
  const t = type.toLowerCase();
  if (t.includes("grant")) return "badge-emerald";
  if (t.includes("loan")) return "badge-saffron";
  if (t.includes("subsidy")) return "badge-violet";
  if (t.includes("insurance")) return "badge-sky";
  return "badge-muted";
}

export function SchemeCard({ scheme, index = 0 }: { scheme: SchemeResponse; index?: number }) {
  return (
    <div className="card scheme-card" style={{ animationDelay: `${index * 0.06}s` }}>
      <div className="scheme-card-header">
        <div>
          <h3>{scheme.name}</h3>
          {scheme.telugu_name && <div className="telugu-name">{scheme.telugu_name}</div>}
        </div>
        <span className={`badge ${getBenefitBadgeClass(scheme.benefit_type)}`}>
          {scheme.benefit_type || "N/A"}
        </span>
      </div>

      <p className="description">{scheme.description}</p>

      <div className="amount-range">
        <span className="amount">{formatAmount(scheme.amount_min)}</span>
        {scheme.amount_min !== scheme.amount_max && (
          <>
            <span className="separator">—</span>
            <span className="amount">{formatAmount(scheme.amount_max)}</span>
          </>
        )}
        {scheme.unit && <span className="unit">{scheme.unit}</span>}
      </div>

      <div className="detail-row" style={{ fontSize: "0.85rem" }}>
        {scheme.interest_rate && scheme.interest_rate !== "N/A" && (
          <span className="badge badge-muted">📈 {scheme.interest_rate}</span>
        )}
        {scheme.success_rate && (
          <span className={`badge success-badge-${scheme.success_rate}`}>
            {scheme.success_rate === "high" ? "✓" : "○"} {scheme.success_rate} success
          </span>
        )}
        {scheme.processing_time_days && (
          <span className="badge badge-muted">⏱ {scheme.processing_time_days}d</span>
        )}
      </div>

      <div className="scheme-card-footer">
        <div className="tags">
          {scheme.tags.slice(0, 4).map((t) => (
            <span key={t} className="tag">{t}</span>
          ))}
          {scheme.tags.length > 4 && <span className="tag">+{scheme.tags.length - 4}</span>}
        </div>
        <Link to={`/schemes/${scheme.id}`} className="btn btn-outline btn-sm" style={{ marginLeft: "auto" }}>
          Details →
        </Link>
      </div>
    </div>
  );
}
