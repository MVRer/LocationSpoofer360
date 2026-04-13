import { useEffect, useState } from "react";

interface InitialLocation {
  lat: number;
  lng: number;
  zoom: number;
}

// Mexico City fallback
const FALLBACK: InitialLocation = { lat: 19.4326, lng: -99.1332, zoom: 12 };

export function useInitialLocation(): InitialLocation {
  const [location, setLocation] = useState<InitialLocation>(FALLBACK);

  useEffect(() => {
    let cancelled = false;

    async function detect() {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            maximumAge: 300000,
          });
        });
        if (!cancelled) {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, zoom: 12 });
          return;
        }
      } catch {
        // Geolocation denied or timed out
      }

      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        if (!cancelled && typeof data.latitude === "number" && typeof data.longitude === "number") {
          setLocation({ lat: data.latitude, lng: data.longitude, zoom: 10 });
          return;
        }
      } catch {
        // IP geolocation failed
      }
    }

    detect();
    return () => { cancelled = true; };
  }, []);

  return location;
}
