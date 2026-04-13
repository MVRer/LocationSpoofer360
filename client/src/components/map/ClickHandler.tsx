import { useMapEvents } from "react-leaflet";
import { useStore } from "../../store";

export function ClickHandler() {
  useMapEvents({
    click(e) {
      const store = useStore.getState();
      if (!store.selectedUdid) return;
      store.openDialog("teleport", {
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
    },
  });

  return null;
}
