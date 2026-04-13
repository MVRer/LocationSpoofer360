import type { ServerMessage } from "@shared/protocol";
import { useEffect } from "react";
import { useStore } from "../store";

export function useSSE() {
  useEffect(() => {
    const es = new EventSource("/api/events");

    let locCount = 0;

    es.onmessage = (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data);

        if (msg.type === "location:changed") {
          locCount++;
          if (locCount % 10 === 0) {
            console.log(
              `[sse] loc #${locCount} | ${msg.lat.toFixed(6)}, ${msg.lng.toFixed(6)} | heading: ${msg.heading.toFixed(0)}`,
            );
          }
        } else if (msg.type === "navigation:progress") {
          console.log(
            `[sse] nav progress ${(msg.progress * 100).toFixed(1)}% | upcoming: ${msg.upcoming.length} pts`,
          );
        } else if (msg.type === "moveState:changed") {
          console.log(`[sse] moveState: ${msg.state}`);
        } else if (msg.type === "navigation:finished") {
          console.log(`[sse] nav finished | reversed: ${msg.autoReversed}`);
        }

        handleMessage(msg);
      } catch (err) {
        console.error("[sse] parse error:", err);
      }
    };

    es.onerror = () => {
      console.warn("[sse] connection error, auto-reconnecting...");
    };

    return () => es.close();
  }, []);
}

function handleMessage(msg: ServerMessage) {
  const s = useStore.getState();
  switch (msg.type) {
    case "device:list":
      s.setDevices(msg.devices);
      break;
    case "device:connected":
      s.addDevice(msg.device);
      break;
    case "device:disconnected":
      s.removeDevice(msg.udid);
      break;
    case "tunnel:status":
      s.setTunnelRunning(msg.running);
      break;
    case "location:changed":
      s.setCurrentLocation({ lat: msg.lat, lng: msg.lng });
      s.setHeading(msg.heading);
      break;
    case "location:reset":
      s.setCurrentLocation(null);
      s.setTraveledRoute([]);
      s.setUpcomingRoute([]);
      s.setTotalDistance(0);
      break;
    case "location:error":
      s.addToast(msg.message, "error");
      break;
    case "moveState:changed":
      s.setMoveState(msg.state);
      break;
    case "moveType:changed":
      s.setMoveType(msg.moveType);
      break;
    case "speed:changed":
      s.setSpeedKmh(msg.kmh);
      break;
    case "navigation:progress":
      s.setTraveledRoute(msg.traveled);
      s.setUpcomingRoute(msg.upcoming);
      s.setNavigationProgress(msg.progress);
      break;
    case "navigation:finished":
      if (!msg.autoReversed) {
        s.setTraveledRoute([]);
        s.setUpcomingRoute([]);
        s.setNavigationProgress(0);
        s.setNavigationDestinationName(null);
        s.setNavigationStartTime(null);
        s.addToast("Navigation finished", "success");
      } else {
        s.addToast("Route reversed, continuing", "info");
      }
      break;
    case "distance:update":
      s.setTotalDistance(msg.totalMeters);
      break;
    case "error":
      s.addToast(msg.message, "error");
      break;
  }
}
