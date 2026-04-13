export interface Coord {
  lat: number;
  lng: number;
}

export interface Device {
  udid: string;
  name: string;
  productType: string;
  osVersion: string;
  connectionType: "usb" | "network";
}

export type MoveType = "walk" | "cycle" | "drive";
export type MoveState = "idle" | "manual" | "auto" | "navigation";

export interface Settings {
  speedKmh: number;
  moveType: MoveType;
  speedVariance: boolean;
  confirmTeleport: boolean;
  autoReverse: boolean;
  movementBehavior: "natural" | "traditional";
}

export interface RecentLocation {
  coord: Coord;
  name: string;
  timestamp: number;
}

export interface NavigationState {
  traveled: Coord[];
  upcoming: Coord[];
  progress: number;
  totalDistanceMeters: number;
}

export interface GpxData {
  name: string;
  tracks: GpxTrack[];
  routes: GpxRoute[];
  waypoints: Coord[];
}

export interface GpxTrack {
  name: string;
  segments: Coord[][];
}

export interface GpxRoute {
  name: string;
  points: Coord[];
}
