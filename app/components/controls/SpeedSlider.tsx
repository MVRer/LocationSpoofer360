import { formatSpeed, kmhToSlider, sliderToKmh } from "../../lib/speed";
import { api } from "../../services/api";
import { useStore } from "../../store";

export function SpeedSlider() {
  const speedKmh = useStore((s) => s.speedKmh);

  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min="0"
        max="1"
        step="0.005"
        value={kmhToSlider(speedKmh)}
        onChange={(e) => api.setSpeed(sliderToKmh(parseFloat(e.target.value)))}
        className="w-28 accent-blue-500"
      />
      <span className="text-[11px] text-slate-400 min-w-[55px]">{formatSpeed(speedKmh)}</span>
    </div>
  );
}
