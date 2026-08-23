import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { SchemeResponse } from "../types";
import { SchemeList } from "../components/SchemeList";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorState } from "../components/ErrorState";

export function SchemesPage() {
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

  useEffect(fetchSchemes, []);

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>All Government Schemes</h1>
          <p>Browse all 19 central and state government welfare and business schemes.</p>
        </div>
        {loading && <LoadingSpinner message="Loading schemes..." />}
        {error && <ErrorState message={error} onRetry={fetchSchemes} />}
        {!loading && !error && <SchemeList schemes={schemes} />}
      </div>
    </div>
  );
}
