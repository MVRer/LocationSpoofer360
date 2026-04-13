export const SPEED_SLIDER_LOG_BASE = 16;
export const SPEED_SLIDER_MAX_EXPONENT = 2;
export const MIN_SPEED_KMH = 1;
export const MAX_SPEED_KMH = 256;
export const SPEED_VARIANCE_MIN = 0.8;
export const SPEED_VARIANCE_MAX = 1.2;

export const DEFAULT_SPEEDS: Record<string, number> = {
  walk: 5,
  cycle: 15,
  drive: 50,
};

export const AUTO_MOVE_INTERVAL_MS = 1000;
export const DEVICE_POLL_INTERVAL_MS = 3000;
export const TUNNEL_CHECK_TIMEOUT_MS = 30000;
export const TUNNEL_CHECK_INTERVAL_MS = 2000;

export const SERVER_PORT = 3001;
export const CLIENT_PORT = 3000;

export function kmhToMs(kmh: number): number {
  return (kmh * 1000) / 3600;
}

export function msToKmh(ms: number): number {
  return (ms * 3600) / 1000;
}

export function sliderToKmh(sliderValue: number): number {
  return Math.pow(SPEED_SLIDER_LOG_BASE, sliderValue * SPEED_SLIDER_MAX_EXPONENT);
}

export function kmhToSlider(kmh: number): number {
  return Math.log(kmh) / (Math.log(SPEED_SLIDER_LOG_BASE) * SPEED_SLIDER_MAX_EXPONENT);
}
