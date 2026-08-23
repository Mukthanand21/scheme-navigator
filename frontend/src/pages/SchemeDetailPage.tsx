import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import type { SchemeDetailResponse } from "../types";
import { RelatedSchemes } from "../components/RelatedSchemes";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorState } from "../components/ErrorState";
import { useLanguage } from "../i18n/LanguageContext";

function formatAmount(n?: number | null): string {
  if (n == null) return "—";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function SchemeDetailPage() {
  const { schemeId } = useParams<{ schemeId: string }>();
  const [prevSchemeId, setPrevSchemeId] = useState(schemeId);
  const [scheme, setScheme] = useState<SchemeDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (schemeId !== prevSchemeId) {
    setPrevSchemeId(schemeId);
    setLoading(true);
    setError(null);
    setScheme(null);
  }

  const fetchScheme = () => {
    if (!schemeId) return;
    setLoading(true);
    setError(null);
    api.getScheme(schemeId).then(setScheme).catch((err) => setError(err.message)).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!schemeId) return;
    let active = true;
    api.getScheme(schemeId)
      .then((res) => {
        if (active) setScheme(res);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [schemeId]);

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

  if (loading) return <div className="page"><div className="container"><LoadingSpinner message={t("loading")} /></div></div>;
  if (error) return <div className="page"><div className="container"><ErrorState message={error} onRetry={fetchScheme} /></div></div>;
  if (!scheme) return null;

  const displayName = lang === "te" && scheme.telugu_name ? scheme.telugu_name : scheme.name;
  const subName = lang === "te" && scheme.telugu_name ? scheme.name : scheme.telugu_name;
  const displayDesc = lang === "te" && scheme.telugu_description ? scheme.telugu_description : scheme.description;
  const subDesc = lang === "te" && scheme.telugu_description ? scheme.description : scheme.telugu_description;

  const casteLabels: Record<string, string> = {
    general: lang === "te" ? "జనరల్" : "General",
    obc: lang === "te" ? "ఓబీసీ" : "OBC",
    bc: lang === "te" ? "బీసీ" : "BC",
    sc: lang === "te" ? "ఎస్సీ" : "SC",
    st: lang === "te" ? "ఎస్టీ" : "ST",
    ebc: lang === "te" ? "ఈబీసీ" : "EBC",
    minority: lang === "te" ? "మైనారిటీ" : "Minority",
  };

  const flagLabels: Record<string, string> = {
    "GST Registration": lang === "te" ? "జీఎస్టీ రిజిస్ట్రేషన్" : "GST Registration",
    "Bank Account": lang === "te" ? "బ్యాంక్ ఖాతా" : "Bank Account",
    "White Ration Card": lang === "te" ? "వైట్ రేషన్ కార్డ్" : "White Ration Card",
    "Land Ownership": lang === "te" ? "వ్యవసాయ/వ్యాపార భూమి" : "Land Ownership",
  };

  const successText = scheme.success_rate
    ? (scheme.success_rate === "high" ? (lang === "te" ? "అధిక" : "High") : scheme.success_rate === "medium" ? (lang === "te" ? "మధ్యమ" : "Medium") : (lang === "te" ? "తక్కువ" : "Low"))
    : "N/A";

  const formattedCastes = scheme.castes?.length === 7
    ? t("allCastes")
    : scheme.castes?.map(c => casteLabels[c.toLowerCase()] || c).join(", ").toUpperCase() || t("anyGender");

  const formattedGenders = scheme.genders?.map(g => {
    if (g.toLowerCase() === "male") return t("genderMale");
    if (g.toLowerCase() === "female") return t("genderFemale");
    return g;
  }).join(", ") || t("anyGender");

  return (
    <div className="page">
      <div className="container">
        <Link to="/schemes" className="back-link">{t("schemeDetailBack")}</Link>

        <div className="scheme-detail">
          <div className="scheme-detail-header">
            <h1>{displayName}</h1>
            {subName && <div className="telugu">{subName}</div>}
            <p className="description">{displayDesc}</p>
            {subDesc && (
              <p className="description" style={{ color: "var(--text-muted)", marginTop: "8px", fontStyle: "italic" }}>
                {subDesc}
              </p>
            )}
          </div>

          <div className="detail-grid">
            <div className="card">
              <div className="detail-section">
                <h4>{t("financialInfo")}</h4>
                <div className="detail-row"><span className="label">{t("amountRange")}</span><span className="value">{formatAmount(scheme.amount_min)} — {formatAmount(scheme.amount_max)}</span></div>
                <div className="detail-row"><span className="label">{t("interestRate")}</span><span className="value">{scheme.interest_rate || "N/A"}</span></div>
                <div className="detail-row"><span className="label">{t("benefitType")}</span><span className="value">{translateBenefit(scheme.benefit_type)}</span></div>
                {scheme.unit && <div className="detail-row"><span className="label">{t("unit")}</span><span className="value">{scheme.unit}</span></div>}
              </div>
            </div>

            <div className="card">
              <div className="detail-section">
                <h4>{t("eligibilityInfo")}</h4>
                <div className="detail-row"><span className="label">{t("age")}</span><span className="value">{scheme.age_min ?? t("anyAge")} — {scheme.age_max ?? t("noLimit")}</span></div>
                <div className="detail-row"><span className="label">{t("gender")}</span><span className="value">{formattedGenders}</span></div>
                <div className="detail-row"><span className="label">{t("caste")}</span><span className="value">{formattedCastes}</span></div>
                {scheme.max_annual_income && <div className="detail-row"><span className="label">{t("maxIncome")}</span><span className="value">{formatAmount(scheme.max_annual_income)}</span></div>}
                {scheme.max_annual_turnover && <div className="detail-row"><span className="label">{t("maxTurnover")}</span><span className="value">{formatAmount(scheme.max_annual_turnover)}</span></div>}
                {scheme.max_units_usage && <div className="detail-row"><span className="label">{t("maxUnits")}</span><span className="value">{scheme.max_units_usage}</span></div>}
                {scheme.required_flags.length > 0 && (
                  <div className="detail-row"><span className="label">{t("requirements")}</span><span className="value">{scheme.required_flags.map(f => flagLabels[f] || f).join(", ")}</span></div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="detail-section">
                <h4>{t("processingInfo")}</h4>
                <div className="detail-row"><span className="label">{t("processingTime")}</span><span className="value">{scheme.processing_time_days ? `${scheme.processing_time_days} ${t("days")}` : "N/A"}</span></div>
                <div className="detail-row"><span className="label">{t("successRate")}</span><span className="value" style={{ textTransform: "capitalize" }}>{successText}</span></div>
                <div className="detail-row"><span className="label">{t("helpline")}</span><span className="value">{scheme.helpline || "N/A"}</span></div>
              </div>
            </div>

            <div className="card">
              <div className="detail-section">
                <h4>{t("documentsRequired")}</h4>
                <ul className="documents-list">
                  {scheme.documents.map((d) => <li key={d}>{d}</li>)}
                  {scheme.documents.length === 0 && <li style={{ color: "var(--text-muted)" }}>{t("noDocuments")}</li>}
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
                {t("applyOnline")}
              </a>
            )}
            {scheme.apply_offline && (
              <div className="btn btn-secondary" style={{ cursor: "default" }}>
                {t("applyOffline", { location: scheme.apply_offline })}
              </div>
            )}
          </div>
        </div>

        {schemeId && <RelatedSchemes schemeId={schemeId} />}
      </div>
    </div>
  );
}
