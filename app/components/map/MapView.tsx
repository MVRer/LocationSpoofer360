import { LayersControl, MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import { ClickHandler } from "./ClickHandler";
import { LocationMarker } from "./LocationMarker";
import { RouteOverlay } from "./RouteOverlay";
import { useInitialLocation } from "../../hooks/useInitialLocation";

const CARTO_ATTR =
  '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export function MapView() {
  const initial = useInitialLocation();

  return (
    <MapContainer
      center={[initial.lat, initial.lng]}
      zoom={initial.zoom}
      zoomControl={false}
      className="w-full h-full"
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Voyager">
          <TileLayer
            attribution={CARTO_ATTR}
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Dark">
          <TileLayer
            attribution={CARTO_ATTR}
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Light">
          <TileLayer
            attribution={CARTO_ATTR}
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satellite">
          <TileLayer
            attribution="&copy; Esri"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
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
