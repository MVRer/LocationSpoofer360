import { useStore } from "../../store";
import { api } from "../../services/api";
import { sliderToKmh, kmhToSlider, formatSpeed } from "../../lib/speed";

export function Header() {
  const {
    moveType,
    speedKmh,
    autoReverse,
    moveState,
    currentLocation,
    sidebarOpen,
    toggleSidebar,
  } = useStore();

  const handleMoveTypeChange = (type: "walk" | "cycle" | "drive") => {
    api.setMoveType(type);
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const kmh = sliderToKmh(parseFloat(e.target.value));
    api.setSpeed(kmh);
  };

  const handleAutoReverse = () => {
    api.setAutoReverse(!autoReverse);
    useStore.getState().setAutoReverse(!autoReverse);
  };

  const handleReset = () => {
    api.resetLocation();
  };

  const handleGpxUpload = () => {
    useStore.getState().openDialog("gpx");
  };

  const handleSettings = () => {
    useStore.getState().openDialog("settings");
  };

  return (
    <header className="header">
      <div className="header-left">
        <button
          className="btn btn-icon"
          onClick={toggleSidebar}
          title="Toggle sidebar"
        >
          {sidebarOpen ? "◀" : "▶"}
        </button>

        <div className="move-type-selector">
          {(["walk", "cycle", "drive"] as const).map((type) => (
            <button
              key={type}
              className={`btn btn-type ${moveType === type ? "active" : ""}`}
              onClick={() => handleMoveTypeChange(type)}
            >
              {type === "walk" ? "🚶" : type === "cycle" ? "🚴" : "🚗"}
              <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
            </button>
          ))}
        </div>

        <div className="speed-control">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={kmhToSlider(speedKmh)}
            onChange={handleSpeedChange}
            className="speed-slider"
          />
          <span className="speed-label">{formatSpeed(speedKmh)}</span>
        </div>
      </div>

      <div className="header-right">
        <button
          className={`btn btn-sm ${autoReverse ? "active" : ""}`}
          onClick={handleAutoReverse}
          disabled={moveState !== "navigation"}
          title="Auto-reverse route"
        >
          ↺ Reverse
        </button>

        <button className="btn btn-sm" onClick={handleGpxUpload} title="Load GPX file">
          GPX
        </button>

        <button
          className="btn btn-sm btn-danger"
          onClick={handleReset}
          disabled={!currentLocation}
          title="Reset location"
        >
          Reset
        </button>

        <button className="btn btn-icon" onClick={handleSettings} title="Settings">
          ⚙
        </button>
      </div>
    </header>
  );
}
