import { useMapEvents } from "react-leaflet";
import { normalizeCoord } from "../../lib/geo";
import { useStore } from "../../store";

export function ClickHandler() {
  useMapEvents({
    click(e) {
      const store = useStore.getState();
      if (!store.selectedUdid) return;
      const coord = normalizeCoord(e.latlng.lat, e.latlng.lng);
      store.openDialog("teleport", coord);
    },
  });

  return null;
}
