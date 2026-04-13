import type { Coord, Device, MoveState, MoveType } from "./types.js";

export type ServerMessage =
  | { type: "device:list"; devices: Device[] }
  | { type: "device:connected"; device: Device }
  | { type: "device:disconnected"; udid: string }
  | { type: "tunnel:status"; running: boolean }
  | { type: "location:changed"; lat: number; lng: number; heading: number }
  | { type: "location:reset" }
  | { type: "location:error"; message: string }
  | { type: "moveState:changed"; state: MoveState }
  | { type: "moveType:changed"; moveType: MoveType }
  | { type: "speed:changed"; kmh: number }
  | { type: "navigation:progress"; traveled: Coord[]; upcoming: Coord[]; progress: number }
  | { type: "navigation:finished"; autoReversed: boolean }
  | { type: "distance:update"; totalMeters: number }
  | { type: "error"; message: string };

export type ClientMessage = { type: "ping" };
