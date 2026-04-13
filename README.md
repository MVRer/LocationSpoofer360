# LocationSpoofer360

A web-based iOS location spoofer for iOS 17+. No Xcode, no code signing, no app compilation. Just `bun run dev` and go.

Built on [pymobiledevice3](https://github.com/doronz88/pymobiledevice3) — the same tool the original LocationSpoofer macOS app uses under the hood for iOS 17+.

## Features

- **Teleport** — Click anywhere on the map to set your iOS device's GPS location
- **Navigate** — Calculate a real route (walk/cycle/drive) between two points and auto-follow it
- **Movement simulation** — Walk, cycle, or drive at configurable speeds (1–256 km/h)
- **Direction control** — 8-direction compass wheel, arrow keys, heading rotation
- **GPX import** — Load `.gpx` route files and follow them
- **Location search** — Search addresses via OpenStreetMap/Nominatim
- **Route visualization** — See traveled (gray) and upcoming (blue) route on the map
- **Auto-reverse** — Loop routes by reversing at the end
- **Speed variance** — Randomize speed ±20% for realistic movement
- **Recent locations** — Quick access to previously visited spots
- **Keyboard shortcuts** — Arrow keys for movement, spacebar for auto-move toggle
- **Cross-platform** — Works on macOS and Linux

## Prerequisites

- [Bun](https://bun.sh) runtime
- [pymobiledevice3](https://github.com/doronz88/pymobiledevice3) — `pip3 install pymobiledevice3`
- Python 3.8+
- iOS 17+ device with **Developer Mode** enabled (Settings > Privacy & Security > Developer Mode)

## Quick Start

```bash
# Install pymobiledevice3
pip3 install pymobiledevice3

# Clone and install
git clone https://github.com/MVRer/LocationSpoofer360.git
cd LocationSpoofer360
bun install
cd client && bun install && cd ..

# Run
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Connect** your iOS device via USB
2. Click **Start Tunnel** in the sidebar (you'll be prompted for your admin password)
3. Select your device from the sidebar
4. **Click the map** to teleport, or choose **Navigate** to follow a route

### Controls

| Action | Control |
|--------|---------|
| Teleport | Click on map |
| Navigate | Click map > "Navigate" |
| Step forward | Click movement button / Arrow Up |
| Auto-move | Long-press movement button / Spacebar |
| Change heading | Drag compass wheel / Arrow Left/Right |
| Change speed | Drag speed slider in toolbar |
| Load GPX | Click "GPX" button in toolbar |
| Reset location | Click "Reset" button |

### Arrow Key Modes

- **Natural** (default): Arrows move in that cardinal direction
- **Traditional**: Up/Down move forward/backward, Left/Right rotate heading

## Architecture

```
Browser (:3000)              Bun Server (:3001)           pymobiledevice3
┌─────────────────┐   REST   ┌──────────────────┐  spawn  ┌──────────┐
│ React + Leaflet │◄────────►│ HTTP + WebSocket  │◄───────►│ tunneld  │
│ OSM tiles       │   + WS   │ Movement engine   │         │ DVT sim  │
└─────────────────┘          └──────────────────┘         └──────────┘
```

- **Frontend**: React + Vite + Leaflet (OpenStreetMap)
- **Backend**: Bun HTTP server + WebSocket
- **Routing**: [OSRM](http://project-osrm.org/) (free, replaces Apple MapKit)
- **Geocoding**: [Nominatim](https://nominatim.org/) (free, OpenStreetMap)

## License

MIT
