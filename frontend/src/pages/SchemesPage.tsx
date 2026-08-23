import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { SchemeResponse } from "../types";
import { SchemeList } from "../components/SchemeList";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorState } from "../components/ErrorState";
import { useLanguage } from "../i18n/LanguageContext";

export function SchemesPage() {
  const { t } = useLanguage();
  const [schemes, setSchemes] = useState<SchemeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchemes = () => {
    setLoading(true);
    setError(null);
    api.listSchemes()
      .then(setSchemes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    api.listSchemes()
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
  }, []);

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>{t("browseTitle")}</h1>
          <p>{t("browseSubtitle")}</p>
        </div>
        {loading && <LoadingSpinner message={t("loading")} />}
        {error && <ErrorState message={error} onRetry={fetchSchemes} />}
        {!loading && !error && <SchemeList schemes={schemes} />}
      </div>
    </div>
  );
}
