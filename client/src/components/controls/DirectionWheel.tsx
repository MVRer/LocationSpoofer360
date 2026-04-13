import { useRef, useCallback } from "react";
import { useStore } from "../../store";
import { api } from "../../services/api";

const DIRECTIONS = [
  { angle: 0, label: "N" },
  { angle: 45, label: "NE" },
  { angle: 90, label: "E" },
  { angle: 135, label: "SE" },
  { angle: 180, label: "S" },
  { angle: 225, label: "SW" },
  { angle: 270, label: "W" },
  { angle: 315, label: "NW" },
];

export function DirectionWheel() {
  const heading = useStore((s) => s.heading);
  const moveState = useStore((s) => s.moveState);
  const wheelRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const getAngleFromEvent = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      const svg = wheelRef.current;
      if (!svg) return 0;
      const rect = svg.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      let angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
      return ((angle % 360) + 360) % 360;
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (moveState === "navigation") return;
      dragging.current = true;
      const angle = getAngleFromEvent(e);
      api.setHeading(angle);

      const onMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        const a = getAngleFromEvent(ev);
        api.setHeading(a);
      };
      const onUp = () => {
        dragging.current = false;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [getAngleFromEvent, moveState]
  );

  const disabled = moveState === "navigation";

  return (
    <div className={`direction-wheel ${disabled ? "disabled" : ""}`}>
      <svg
        ref={wheelRef}
        viewBox="0 0 120 120"
        width="120"
        height="120"
        onMouseDown={handleMouseDown}
        style={{ cursor: disabled ? "default" : "pointer" }}
      >
        {/* Outer ring */}
        <circle cx="60" cy="60" r="55" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
        <circle cx="60" cy="60" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

        {/* Direction labels */}
        {DIRECTIONS.map((d) => {
          const rad = ((d.angle - 90) * Math.PI) / 180;
          const x = 60 + 48 * Math.cos(rad);
          const y = 60 + 48 * Math.sin(rad);
          return (
            <text
              key={d.label}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="rgba(255,255,255,0.6)"
              fontSize="9"
              fontWeight="bold"
            >
              {d.label}
            </text>
          );
        })}

        {/* Heading indicator */}
        <g transform={`rotate(${heading}, 60, 60)`}>
          <polygon
            points="60,15 54,30 66,30"
            fill="#2196F3"
            opacity="0.9"
          />
          <line x1="60" y1="30" x2="60" y2="60" stroke="#2196F3" strokeWidth="2" opacity="0.5" />
        </g>
      </svg>
    </div>
  );
}
