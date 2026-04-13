import { useStore } from "../../store";
import { api } from "../../services/api";
import { sliderToKmh, kmhToSlider, formatSpeed } from "../../lib/speed";

export function SpeedSlider() {
  const speedKmh = useStore((s) => s.speedKmh);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const kmh = sliderToKmh(parseFloat(e.target.value));
    api.setSpeed(kmh);
  };

  return (
    <div className="speed-control">
      <input
        type="range"
        min="0"
        max="1"
        step="0.005"
        value={kmhToSlider(speedKmh)}
        onChange={handleChange}
        className="speed-slider"
      />
      <span className="speed-label">{formatSpeed(speedKmh)}</span>
    </div>
  );
}
