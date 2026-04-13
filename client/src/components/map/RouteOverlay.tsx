import type { LatLngExpression } from "leaflet";
import { useEffect, useRef } from "react";
import { Polyline, useMap } from "react-leaflet";
import { useStore } from "../../store";

function UpdatingPolyline({
  positions,
  color,
  weight,
  opacity,
  dashArray,
}: {
  positions: LatLngExpression[];
  color: string;
  weight: number;
  opacity: number;
  dashArray?: string;
}) {
  const ref = useRef<L.Polyline>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.setLatLngs(positions);
    }
  }, [positions]);

  if (positions.length < 2) return null;

  return (
    <Polyline
      ref={ref}
      positions={positions}
      pathOptions={{ color, weight, opacity, dashArray }}
    />
  );
}

export function RouteOverlay() {
  const traveledRoute = useStore((s) => s.traveledRoute);
  const upcomingRoute = useStore((s) => s.upcomingRoute);
  const previewRoute = useStore((s) => s.previewRoute);

  const traveled: LatLngExpression[] = traveledRoute.map((c) => [c.lat, c.lng]);
  const upcoming: LatLngExpression[] = upcomingRoute.map((c) => [c.lat, c.lng]);
  const preview: LatLngExpression[] = previewRoute?.map((c) => [c.lat, c.lng]) ?? [];

  return (
    <>
      <UpdatingPolyline positions={preview} color="#4285F4" weight={5} opacity={0.8} dashArray="10, 8" />
      <UpdatingPolyline positions={traveled} color="#6b7280" weight={5} opacity={0.7} />
      <UpdatingPolyline positions={upcoming} color="#4285F4" weight={5} opacity={0.9} />
    </>
  );
}
