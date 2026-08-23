export function EmptyState({ title = "No matching schemes found", message = "Try adjusting your profile to see more results." }: { title?: string; message?: string }) {
  return (
    <div className="state-container">
      <div className="state-icon">🔍</div>
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}
