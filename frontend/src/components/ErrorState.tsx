export function ErrorState({ message = "Service unavailable", onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="state-container">
      <div className="error-container" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div className="state-icon">⚠️</div>
        <h3>Something went wrong</h3>
        <p>{message}</p>
        {onRetry && (
          <button className="btn btn-primary btn-sm" onClick={onRetry}>
            ↻ Try Again
          </button>
        )}
      </div>
    </div>
  );
}
