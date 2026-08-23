import type { SchemeResponse } from "../types";
import { SchemeCard } from "./SchemeCard";

export function SchemeList({ schemes }: { schemes: SchemeResponse[] }) {
  return (
    <div className="schemes-grid">
      {schemes.map((s, i) => (
        <SchemeCard key={s.id} scheme={s} index={i} />
      ))}
    </div>
  );
}
