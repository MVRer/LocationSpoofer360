import { useCallback, useRef } from "react";
import { api } from "../../services/api";
import { useStore } from "../../store";

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

  const getAngleFromEvent = useCallback((e: React.MouseEvent | MouseEvent) => {
    const svg = wheelRef.current;
    if (!svg) return 0;
    const rect = svg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    return ((((Math.atan2(dx, -dy) * 180) / Math.PI) % 360) + 360) % 360;
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (moveState === "navigation") return;
      dragging.current = true;
      const angle = getAngleFromEvent(e);
      api.setHeading(angle);

      const onMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        api.setHeading(getAngleFromEvent(ev));
      };
      const onUp = () => {
        dragging.current = false;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [getAngleFromEvent, moveState],
  );

  const disabled = moveState === "navigation";

  return (
    <svg
      ref={wheelRef}
      viewBox="0 0 120 120"
      width="120"
      height="120"
      onMouseDown={handleMouseDown}
      className={`${disabled ? "opacity-40 pointer-events-none" : "opacity-80 hover:opacity-100 cursor-pointer"} transition-opacity`}
    >
      {/* Background ring */}
      <circle
        cx="60"
        cy="60"
        r="55"
        fill="rgba(15,23,42,0.7)"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="2"
      />
      <circle cx="60" cy="60" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

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
            fill="rgba(255,255,255,0.5)"
            fontSize="9"
            fontWeight="bold"
          >
            {d.label}
          </text>
        );
      })}

      {/* Heading indicator */}
      <g transform={`rotate(${heading}, 60, 60)`}>
        <polygon points="60,12 54,28 66,28" fill="#3b82f6" opacity="0.9" />
        <line x1="60" y1="28" x2="60" y2="38" stroke="#3b82f6" strokeWidth="2" opacity="0.4" />
      </g>
    </svg>
  );
}
