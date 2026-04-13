import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import { LocationMarker } from "./LocationMarker";
import { RouteOverlay } from "./RouteOverlay";
import { ClickHandler } from "./ClickHandler";

export function MapView() {
  return (
    <MapContainer
      center={[37.7749, -122.4194]}
      zoom={13}
      zoomControl={false}
      className="map-container"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="topright" />
      <LocationMarker />
      <RouteOverlay />
      <ClickHandler />
    </MapContainer>
  );
}
