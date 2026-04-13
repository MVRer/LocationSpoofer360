import L from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import { Marker, useMap } from "react-leaflet";
import { normalizeCoord } from "../../lib/geo";
import { useStore } from "../../store";

export function LocationMarker() {
  const currentLocation = useStore((s) => s.currentLocation);
  const heading = useStore((s) => s.heading);
  const autoFocus = useStore((s) => s.autoFocus);
  const moveState = useStore((s) => s.moveState);
  const map = useMap();
  const markerRef = useRef<L.Marker>(null);
  const initialFocusDone = useRef(false);

  // Create icon ONCE — never recreate so DOM element persists for CSS transitions
  const icon = useMemo(
    () =>
      L.divIcon({
        className: "location-marker",
        html: `<div class="marker-dot">
          <div class="marker-inner"></div>
          <div class="marker-arrow"></div>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
    [],
  );

  // Update heading via DOM manipulation (preserves element for transitions)
  useEffect(() => {
    const el = markerRef.current?.getElement();
    const dot = el?.querySelector(".marker-dot") as HTMLElement | null;
    if (dot) dot.style.transform = `rotate(${heading}deg)`;
  }, [heading]);

  // Disable transition during drag
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    const onDragStart = () => {
      const el = marker.getElement();
      if (el) el.classList.add("dragging");
    };
    const onDragEnd = () => {
      const el = marker.getElement();
      if (el) el.classList.remove("dragging");
    };

    marker.on("dragstart", onDragStart);
    marker.on("dragend", onDragEnd);
    return () => {
      marker.off("dragstart", onDragStart);
      marker.off("dragend", onDragEnd);
    };
  }, []);

  // Auto-follow: always follow during navigation, otherwise respect autoFocus
  useEffect(() => {
    if (!currentLocation) return;

    const isNavigating = moveState === "navigation" || moveState === "auto";
    const shouldFollow = isNavigating || autoFocus || !initialFocusDone.current;

    if (!shouldFollow) return;

    map.setView([currentLocation.lat, currentLocation.lng], map.getZoom(), {
      animate: true,
      duration: 0.4,
    });
    initialFocusDone.current = true;
  }, [currentLocation, map, autoFocus, moveState]);

  if (!currentLocation) return null;

  const handleDragEnd = () => {
    const marker = markerRef.current;
    if (marker) {
      const pos = marker.getLatLng();
      const coord = normalizeCoord(pos.lat, pos.lng);
      useStore.getState().openDialog("teleport", coord);
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
