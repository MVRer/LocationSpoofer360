import type { Coord, Device, MoveState, MoveType, RecentLocation } from "@shared/types";
import { create } from "zustand";

interface AppState {
  // Devices
  devices: Device[];
  selectedUdid: string | null;
  tunnelRunning: boolean;

  // Location
  currentLocation: Coord | null;
  heading: number;
  moveState: MoveState;
  moveType: MoveType;
  speedKmh: number;
  totalDistanceMeters: number;

  // Navigation
  traveledRoute: Coord[];
  upcomingRoute: Coord[];
  navigationProgress: number;
  autoReverse: boolean;

  // UI
  sidebarOpen: boolean;
  searchQuery: string;
  recentLocations: RecentLocation[];
  activeDialog: string | null;
  dialogData: unknown;
  toasts: { id: number; message: string; type: "info" | "error" | "success" }[];

  // Settings
  confirmTeleport: boolean;
  speedVariance: boolean;
  movementBehavior: "natural" | "traditional";

  // Actions
  setDevices: (devices: Device[]) => void;
  addDevice: (device: Device) => void;
  removeDevice: (udid: string) => void;
  setSelectedUdid: (udid: string | null) => void;
  setTunnelRunning: (running: boolean) => void;
  setCurrentLocation: (coord: Coord | null) => void;
  setHeading: (heading: number) => void;
  setMoveState: (state: MoveState) => void;
  setMoveType: (type: MoveType) => void;
  setSpeedKmh: (kmh: number) => void;
  setTotalDistance: (meters: number) => void;
  setTraveledRoute: (coords: Coord[]) => void;
  setUpcomingRoute: (coords: Coord[]) => void;
  setNavigationProgress: (progress: number) => void;
  setAutoReverse: (enabled: boolean) => void;
  toggleSidebar: () => void;
  setSearchQuery: (query: string) => void;
  setRecentLocations: (locs: RecentLocation[]) => void;
  addRecentLocation: (loc: RecentLocation) => void;
  clearRecentLocations: () => void;
  autoFocus: boolean;
  toggleAutoFocus: () => void;
  openDialog: (name: string, data?: unknown) => void;
  closeDialog: () => void;
  addToast: (message: string, type?: "info" | "error" | "success") => void;
  removeToast: (id: number) => void;
  setConfirmTeleport: (enabled: boolean) => void;
  setSpeedVariance: (enabled: boolean) => void;
  setMovementBehavior: (behavior: "natural" | "traditional") => void;
}

let toastId = 0;

export const useStore = create<AppState>((set) => ({
  // Initial state
  devices: [],
  selectedUdid: null,
  tunnelRunning: false,
  currentLocation: null,
  heading: 0,
  moveState: "idle",
  moveType: "walk",
  speedKmh: 5,
  totalDistanceMeters: 0,
  traveledRoute: [],
  upcomingRoute: [],
  navigationProgress: 0,
  autoReverse: false,
  sidebarOpen: true,
  searchQuery: "",
  recentLocations: [],
  activeDialog: null,
  dialogData: null,
  toasts: [],
  confirmTeleport: true,
  speedVariance: false,
  movementBehavior: "natural",

  // Actions
  setDevices: (devices) => set({ devices }),
  addDevice: (device) =>
    set((s) => ({
      devices: s.devices.some((d) => d.udid === device.udid) ? s.devices : [...s.devices, device],
    })),
  removeDevice: (udid) =>
    set((s) => ({
      devices: s.devices.filter((d) => d.udid !== udid),
      selectedUdid: s.selectedUdid === udid ? null : s.selectedUdid,
    })),
  setSelectedUdid: (udid) => set({ selectedUdid: udid }),
  setTunnelRunning: (running) => set({ tunnelRunning: running }),
  setCurrentLocation: (coord) => set({ currentLocation: coord }),
  setHeading: (heading) => set({ heading }),
  setMoveState: (state) => set({ moveState: state }),
  setMoveType: (type) => set({ moveType: type }),
  setSpeedKmh: (kmh) => set({ speedKmh: kmh }),
  setTotalDistance: (meters) => set({ totalDistanceMeters: meters }),
  setTraveledRoute: (coords) => set({ traveledRoute: coords }),
  setUpcomingRoute: (coords) => set({ upcomingRoute: coords }),
  setNavigationProgress: (progress) => set({ navigationProgress: progress }),
  setAutoReverse: (enabled) => set({ autoReverse: enabled }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSearchQuery: (query) => set({ searchQuery: query }),
  autoFocus: true,
  toggleAutoFocus: () => set((s) => ({ autoFocus: !s.autoFocus })),
  setRecentLocations: (locs) => set({ recentLocations: locs }),
  addRecentLocation: (loc) =>
    set((s) => ({
      recentLocations: [
        loc,
        ...s.recentLocations.filter(
          (r) => r.coord.lat !== loc.coord.lat || r.coord.lng !== loc.coord.lng,
        ),
      ].slice(0, 10),
    })),
  clearRecentLocations: () => set({ recentLocations: [] }),
  openDialog: (name, data) => set({ activeDialog: name, dialogData: data }),
  closeDialog: () => set({ activeDialog: null, dialogData: null }),
  addToast: (message, type = "info") => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setConfirmTeleport: (enabled) => set({ confirmTeleport: enabled }),
  setSpeedVariance: (enabled) => set({ speedVariance: enabled }),
  setMovementBehavior: (behavior) => set({ movementBehavior: behavior }),
}));
