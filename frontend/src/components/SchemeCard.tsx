import { Link } from "react-router-dom";
import type { SchemeResponse } from "../types";
import { useLanguage } from "../i18n/LanguageContext";

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
  const { t, lang } = useLanguage();

  const translateBenefit = (type?: string | null): string => {
    if (!type) return "N/A";
    if (lang !== "te") return type;
    const lower = type.toLowerCase();
    if (lower.includes("grant")) return "గ్రాంట్ (Grant)";
    if (lower.includes("loan")) return "రుణం (Loan)";
    if (lower.includes("subsidy")) return "సబ్సిడీ (Subsidy)";
    if (lower.includes("insurance")) return "భీమా (Insurance)";
    return type;
  };

  const displayName = lang === "te" && scheme.telugu_name ? scheme.telugu_name : scheme.name;
  const subName = lang === "te" && scheme.telugu_name ? scheme.name : scheme.telugu_name;
  const displayDesc = lang === "te" && scheme.telugu_description ? scheme.telugu_description : scheme.description;

  const successLabel = lang === "te"
    ? `${scheme.success_rate === "high" ? "✓" : "○"} ${scheme.success_rate === "high" ? "అధిక" : scheme.success_rate === "medium" ? "మధ్యమ" : "తక్కువ"} విజయం`
    : `${scheme.success_rate === "high" ? "✓" : "○"} ${scheme.success_rate} success`;

  return (
    <div className="card scheme-card" style={{ animationDelay: `${index * 0.06}s` }}>
      <div className="scheme-card-header">
        <div>
          <h3>{displayName}</h3>
          {subName && <div className="telugu-name">{subName}</div>}
        </div>
        <span className={`badge ${getBenefitBadgeClass(scheme.benefit_type)}`}>
          {translateBenefit(scheme.benefit_type)}
        </span>
      </div>

      <p className="description">{displayDesc}</p>

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
            {successLabel}
          </span>
        )}
        {scheme.processing_time_days && (
          <span className="badge badge-muted">
            ⏱ {scheme.processing_time_days} {lang === "te" ? "రోజులు" : "days"}
          </span>
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
          {t("details")}
        </Link>
      </div>
    </div>
  );
}
