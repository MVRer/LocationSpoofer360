import { LayersControl, MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import { ClickHandler } from "./ClickHandler";
import { LocationMarker } from "./LocationMarker";
import { RouteOverlay } from "./RouteOverlay";

export function MapView() {
  return (
    <MapContainer
      center={[37.7749, -122.4194]}
      zoom={13}
      zoomControl={false}
      className="w-full h-full"
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Standard">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satellite">
          <TileLayer
            attribution="&copy; Esri"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Topo">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>
      </LayersControl>
      <ZoomControl position="topright" />
      <LocationMarker />
      <RouteOverlay />
      <ClickHandler />
    </MapContainer>
  );
}
