import { useStore } from "../../store";
import { api } from "../../services/api";
import type { MoveType } from "@shared/types";

const TYPES: { type: MoveType; icon: string; label: string }[] = [
  { type: "walk", icon: "🚶", label: "Walk" },
  { type: "cycle", icon: "🚴", label: "Cycle" },
  { type: "drive", icon: "🚗", label: "Drive" },
];

export function MoveTypeSelector() {
  const moveType = useStore((s) => s.moveType);

  return (
    <div className="move-type-selector">
      {TYPES.map(({ type, icon, label }) => (
        <button
          key={type}
          className={`btn btn-type ${moveType === type ? "active" : ""}`}
          onClick={() => api.setMoveType(type)}
        >
          <span>{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
