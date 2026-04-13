import { useCallback, useRef } from "react";
import { api } from "../../services/api";
import { useStore } from "../../store";

export function MovementButton() {
  const moveState = useStore((s) => s.moveState);
  const currentLocation = useStore((s) => s.currentLocation);
  const heading = useStore((s) => s.heading);
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>();
  const isLongPress = useRef(false);

  const handleMouseDown = useCallback(() => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      if (moveState === "auto") {
        api.setMode("manual");
      } else {
        api.setMode("auto");
      }
    }, 500);
  }, [moveState]);

  const handleMouseUp = useCallback(() => {
    clearTimeout(longPressTimer.current);
    if (!isLongPress.current) {
      api.step();
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    clearTimeout(longPressTimer.current);
  }, []);

  const isActive = moveState === "auto" || moveState === "navigation";

  return (
    <button
      type="button"
      className={`w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all border-2 ${
        isActive
          ? "bg-blue-500 border-blue-500 text-white"
          : "bg-slate-900 border-white/20 text-slate-200 hover:border-blue-500"
      } disabled:opacity-30 disabled:cursor-not-allowed`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      disabled={!currentLocation}
      title="Click: step | Hold: auto-move"
    >
      <svg viewBox="0 0 24 24" width="18" height="18">
        <path
          d="M12 2L4.5 20.3l.7.7L12 18l6.8 3 .7-.7z"
          fill="currentColor"
          style={{ transform: `rotate(${heading}deg)`, transformOrigin: "center" }}
        />
      </svg>
    </button>
  );
}
