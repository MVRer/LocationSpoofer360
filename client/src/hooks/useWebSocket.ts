import type { ServerMessage } from "@shared/protocol";
import { useEffect, useRef } from "react";
import { useStore } from "../store";

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    function connect() {
      // In dev mode (Vite on :3000), connect directly to backend on :3001
      // In production, same host serves everything
      const isDev = window.location.port === "3000";
      const wsUrl = isDev
        ? "ws://localhost:3001/ws"
        : `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[ws] CONNECTED to", wsUrl);
        ws.send(JSON.stringify({ type: "init" }));
      };

      let locCount = 0;
      ws.onmessage = (event) => {
        try {
          const msg: ServerMessage = JSON.parse(event.data);
          if (msg.type === "location:changed") {
            locCount++;
            if (locCount % 10 === 0) {
              console.log(`[ws] loc #${locCount} | ${msg.lat.toFixed(6)}, ${msg.lng.toFixed(6)} | heading: ${msg.heading.toFixed(0)}`);
            }
          } else if (msg.type === "navigation:progress") {
            console.log(`[ws] nav progress ${(msg.progress * 100).toFixed(1)}% | upcoming: ${msg.upcoming.length} pts | traveled: ${msg.traveled.length} pts`);
          } else if (msg.type === "moveState:changed") {
            console.log(`[ws] moveState: ${msg.state}`);
          } else if (msg.type === "navigation:finished") {
            console.log(`[ws] nav finished | reversed: ${msg.autoReversed}`);
          }
          handleMessage(msg);
        } catch (err) {
          console.error("[ws] parse error:", err);
        }
      };

      ws.onclose = () => {
        console.log("[ws] DISCONNECTED, reconnecting in 2s...");
        setTimeout(connect, 2000);
      };

      ws.onerror = (err) => {
        console.error("[ws] ERROR:", err);
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

    connect();
    return () => {
      wsRef.current?.close();
    };
  }, []);
}
