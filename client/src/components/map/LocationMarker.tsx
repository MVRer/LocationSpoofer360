import L from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import { Marker, useMap } from "react-leaflet";
import { useStore } from "../../store";

export function LocationMarker() {
  const currentLocation = useStore((s) => s.currentLocation);
  const heading = useStore((s) => s.heading);
  const autoFocus = useStore((s) => s.autoFocus);
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
    [heading],
  );

  useEffect(() => {
    if (!currentLocation) return;
    if (!autoFocus && initialFocusDone.current) return;
    map.setView([currentLocation.lat, currentLocation.lng], map.getZoom(), {
      animate: true,
      duration: 0.5,
    });
    initialFocusDone.current = true;
  }, [currentLocation, map, autoFocus]);

  if (!currentLocation) return null;

  const handleDragEnd = () => {
    const marker = markerRef.current;
    if (marker) {
      const pos = marker.getLatLng();
      useStore.getState().openDialog("teleport", { lat: pos.lat, lng: pos.lng });
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
