import { useRef, useCallback } from "react";
import { useStore } from "../../store";
import { api } from "../../services/api";

export function MovementButton() {
  const { moveState, currentLocation } = useStore();
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>();
  const isLongPress = useRef(false);

  const handleMouseDown = useCallback(() => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      // Long press: toggle auto-move
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
      // Short press: single step
      api.step();
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    clearTimeout(longPressTimer.current);
  }, []);

  const isActive = moveState === "auto" || moveState === "navigation";

  return (
    <button
      className={`movement-btn ${isActive ? "active" : ""}`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      disabled={!currentLocation}
      title="Click: step | Hold: auto-move"
    >
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path
          d="M12 2L4.5 20.3l.7.7L12 18l6.8 3 .7-.7z"
          fill="currentColor"
          style={{ transform: `rotate(${useStore.getState().heading}deg)`, transformOrigin: "center" }}
        />
      </svg>
    </button>
  );
}
