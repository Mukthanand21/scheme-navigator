import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import type { SchemeResponse } from "../types";
import { SchemeList } from "../components/SchemeList";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";

import { useLanguage } from "../i18n/LanguageContext";

export function ResultsPage() {
  const { citizenId } = useParams<{ citizenId: string }>();
  const { t } = useLanguage();
  const [prevCitizenId, setPrevCitizenId] = useState(citizenId);
  const [schemes, setSchemes] = useState<SchemeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (citizenId !== prevCitizenId) {
    setPrevCitizenId(citizenId);
    setLoading(true);
    setError(null);
  }

  const fetchResults = () => {
    if (!citizenId) return;
    setLoading(true);
    setError(null);
    api.getEligibleSchemes(citizenId)
      .then(setSchemes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!citizenId) return;
    let active = true;
    api.getEligibleSchemes(citizenId)
      .then((res) => {
        if (active) setSchemes(res);
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
  }, [citizenId]);

  return (
    <div className="page">
      <div className="container">
        <Link to="/profile" className="back-link">
          {t("resultsBack")}
        </Link>

        <div className="results-header">
          <div>
            <h1>{t("resultsTitle")}</h1>
            <p className="results-count">
              {!loading && !error && (
                schemes.length === 1
                  ? t("resultsCountOne")
                  : t("resultsCountMany", { count: schemes.length })
              )}
            </p>
          </div>
          <Link to="/schemes" className="btn btn-secondary btn-sm">
            📋 {t("navBrowseAll")}
          </Link>
        </div>

        {loading && <LoadingSpinner message={t("btnSubmitting")} />}
        {error && <ErrorState message={error} onRetry={fetchResults} />}
        {!loading && !error && schemes.length === 0 && (
          <EmptyState
            title={t("resultsEmptyTitle")}
            message={t("resultsEmptyDesc")}
          />
        )}
        {!loading && !error && schemes.length > 0 && <SchemeList schemes={schemes} />}
      </div>
    </div>
  );
}
