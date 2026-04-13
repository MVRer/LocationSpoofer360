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
    <div className="flex gap-0.5 bg-slate-950 rounded-md p-0.5">
      {TYPES.map(({ type, icon, label }) => (
        <button
          key={type}
          className={`flex items-center gap-1 px-2.5 py-1 border-none rounded cursor-pointer text-xs transition-all ${
            moveType === type
              ? "bg-blue-500 text-white"
              : "bg-transparent text-slate-400 hover:text-white"
          }`}
          onClick={() => api.setMoveType(type)}
        >
          <span>{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
