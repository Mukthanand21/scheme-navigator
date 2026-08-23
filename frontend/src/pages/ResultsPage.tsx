import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import type { SchemeResponse } from "../types";
import { SchemeList } from "../components/SchemeList";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";

export function ResultsPage() {
  const { citizenId } = useParams<{ citizenId: string }>();
  const [schemes, setSchemes] = useState<SchemeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = () => {
    if (!citizenId) return;
    setLoading(true);
    setError(null);
    api.getEligibleSchemes(citizenId)
      .then(setSchemes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(fetchResults, [citizenId]);

  return (
    <div className="page">
      <div className="container">
        <Link to="/profile" className="back-link">← Create New Profile</Link>

        <div className="results-header">
          <div>
            <h1>Your Eligible Schemes</h1>
            <p className="results-count">
              {!loading && !error && (
                <>Found <strong>{schemes.length}</strong> matching scheme{schemes.length !== 1 ? "s" : ""}</>
              )}
            </p>
          </div>
          <Link to="/schemes" className="btn btn-secondary btn-sm">📋 Browse All</Link>
        </div>

        {loading && <LoadingSpinner message="Finding your eligible schemes..." />}
        {error && <ErrorState message={error} onRetry={fetchResults} />}
        {!loading && !error && schemes.length === 0 && (
          <EmptyState
            title="No matching schemes found"
            message="Your profile didn't match any schemes. Try adjusting your details — some schemes have specific age, caste, or document requirements."
          />
        )}
        {!loading && !error && schemes.length > 0 && <SchemeList schemes={schemes} />}
      </div>
    </div>
  );
}
