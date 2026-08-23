export function LoadingSpinner({ message = "Searching schemes..." }: { message?: string }) {
  return (
    <div className="state-container">
      <div className="spinner" />
      <h3>{message}</h3>
      <p>This may take a moment while we query the database.</p>
    </div>
  );
}
