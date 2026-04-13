import { useEffect, useRef, useMemo } from "react";
import { Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { useStore } from "../../store";
import { api } from "../../services/api";

export function LocationMarker() {
  const { currentLocation, heading, moveState } = useStore();
  const map = useMap();
  const markerRef = useRef<L.Marker>(null);
  const initialFocusDone = useRef(false);

  const icon = useMemo(
    () =>
      L.divIcon({
        className: "location-marker",
        html: `<div class="marker-dot" style="transform: rotate(${heading}deg)">
          <div class="marker-inner"></div>
          <div class="marker-arrow"></div>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
    [heading]
  );

  useEffect(() => {
    if (currentLocation && (!initialFocusDone.current || moveState === "idle" || moveState === "manual")) {
      map.setView([currentLocation.lat, currentLocation.lng], map.getZoom(), {
        animate: true,
        duration: 0.5,
      });
      initialFocusDone.current = true;
    }
  }, [currentLocation, map, moveState]);

  if (!currentLocation) return null;

  const handleDragEnd = () => {
    const marker = markerRef.current;
    if (marker) {
      const pos = marker.getLatLng();
      const store = useStore.getState();
      store.openDialog("teleport", { lat: pos.lat, lng: pos.lng });
    }
  };

  return (
    <Marker
      ref={markerRef}
      position={[currentLocation.lat, currentLocation.lng]}
      icon={icon}
      draggable
      eventHandlers={{ dragend: handleDragEnd }}
    />
  );
}
