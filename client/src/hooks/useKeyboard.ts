import { useEffect } from "react";
import { api } from "../services/api";
import { useStore } from "../store";

export function useKeyboard() {
  const movementBehavior = useStore((s) => s.movementBehavior);
  const heading = useStore((s) => s.heading);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't handle keys when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (movementBehavior === "natural") {
        handleNatural(e);
      } else {
        handleTraditional(e);
      }
    }

    function handleNatural(e: KeyboardEvent) {
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          api.setHeading(0).then(() => api.step());
          break;
        case "ArrowDown":
          e.preventDefault();
          api.setHeading(180).then(() => api.step());
          break;
        case "ArrowLeft":
          e.preventDefault();
          api.setHeading(270).then(() => api.step());
          break;
        case "ArrowRight":
          e.preventDefault();
          api.setHeading(90).then(() => api.step());
          break;
        case " ":
          e.preventDefault();
          toggleAutoMove();
          break;
      }
    }

    function handleTraditional(e: KeyboardEvent) {
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          api.step();
          break;
        case "ArrowDown":
          e.preventDefault();
          api.setHeading(heading + 180).then(() => api.step());
          break;
        case "ArrowLeft":
          e.preventDefault();
          api.setHeading(heading - 22.5);
          break;
        case "ArrowRight":
          e.preventDefault();
          api.setHeading(heading + 22.5);
          break;
        case " ":
          e.preventDefault();
          toggleAutoMove();
          break;
      }
    }

    function toggleAutoMove() {
      const state = useStore.getState().moveState;
      if (state === "auto") {
        api.setMode("manual");
      } else {
        api.setMode("auto");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [movementBehavior, heading]);
}
