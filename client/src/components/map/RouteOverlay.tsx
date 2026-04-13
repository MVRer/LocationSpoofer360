import { Polyline } from "react-leaflet";
import { useStore } from "../../store";

export function RouteOverlay() {
  const { traveledRoute, upcomingRoute } = useStore();

  return (
    <>
      {traveledRoute.length > 1 && (
        <Polyline
          positions={traveledRoute.map((c) => [c.lat, c.lng])}
          pathOptions={{ color: "#888", weight: 4, opacity: 0.6 }}
        />
      )}
      {upcomingRoute.length > 1 && (
        <Polyline
          positions={upcomingRoute.map((c) => [c.lat, c.lng])}
          pathOptions={{ color: "#2196F3", weight: 4, opacity: 0.9 }}
        />
      )}
    </>
  );
}
