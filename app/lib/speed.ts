import {
  MAX_SPEED_KMH,
  MIN_SPEED_KMH,
  SPEED_SLIDER_LOG_BASE,
  SPEED_SLIDER_MAX_EXPONENT,
} from "@shared/constants";

export function sliderToKmh(value: number): number {
  const kmh = SPEED_SLIDER_LOG_BASE ** (value * SPEED_SLIDER_MAX_EXPONENT);
  return Math.max(MIN_SPEED_KMH, Math.min(MAX_SPEED_KMH, kmh));
}

export function kmhToSlider(kmh: number): number {
  return Math.log(kmh) / (Math.log(SPEED_SLIDER_LOG_BASE) * SPEED_SLIDER_MAX_EXPONENT);
}

export function formatSpeed(kmh: number): string {
  if (kmh < 10) return `${kmh.toFixed(1)} km/h`;
  return `${Math.round(kmh)} km/h`;
}
