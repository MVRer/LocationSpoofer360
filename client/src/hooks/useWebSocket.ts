import { useEffect, useRef } from "react";
import { useStore } from "../store";
import type { ServerMessage } from "@shared/protocol";

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const store = useStore();

  useEffect(() => {
    function connect() {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const msg: ServerMessage = JSON.parse(event.data);
          handleMessage(msg);
        } catch {
          // ignore
        }
      };

      ws.onclose = () => {
        setTimeout(connect, 2000);
      };

      ws.onerror = () => {
        ws.close();
      };
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
            s.addToast("Navigation finished", "success");
          } else {
            s.addToast("Route reversed, continuing navigation", "info");
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

    connect();

    return () => {
      wsRef.current?.close();
    };
  }, []);
}
