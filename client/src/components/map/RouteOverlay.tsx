import type { LatLngExpression } from "leaflet";
import { Polyline } from "react-leaflet";
import { useStore } from "../../store";

export function RouteOverlay() {
  const traveledRoute = useStore((s) => s.traveledRoute);
  const upcomingRoute = useStore((s) => s.upcomingRoute);

  const traveled: LatLngExpression[] = traveledRoute.map((c) => [c.lat, c.lng]);
  const upcoming: LatLngExpression[] = upcomingRoute.map((c) => [c.lat, c.lng]);

  return (
    <>
      {traveled.length > 1 && (
        <Polyline
          positions={traveled}
          pathOptions={{ color: "#6b7280", weight: 4, opacity: 0.6 }}
        />
      )}
      {upcoming.length > 1 && (
        <Polyline
          positions={upcoming}
          pathOptions={{ color: "#3b82f6", weight: 4, opacity: 0.9 }}
        />
      )}
    </>
  );
}
