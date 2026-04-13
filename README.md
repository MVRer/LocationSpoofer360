# LocationSpoofer360

Web-based iOS location spoofer for iOS 17+. No Xcode, no code signing, no app compilation required.

Built on [pymobiledevice3](https://github.com/doronz88/pymobiledevice3) -- the same tool the original LocationSpoofer macOS app uses under the hood.

## Features

- **Teleport** -- Click anywhere on the map to set your iOS device GPS location
- **Navigate** -- Calculate a real route (walk/cycle/drive) between two points and auto-follow it
- **Movement simulation** -- Walk, cycle, or drive at configurable speeds (1-256 km/h)
- **Direction control** -- 8-direction compass wheel, arrow keys, heading rotation
- **GPX import** -- Load `.gpx` route files and follow them
- **Location search** -- Search addresses via OpenStreetMap / Nominatim
- **Route visualization** -- Traveled (gray) and upcoming (blue) route overlay on the map
- **Auto-reverse** -- Loop routes by reversing at the end
- **Speed variance** -- Randomize speed +/-20% for realistic movement
- **Recent locations** -- Persisted quick access to previously visited spots
- **Map types** -- Standard, satellite, and topographic map layers
- **Auto-focus** -- Toggle whether the map follows your current spoofed location
- **Keyboard shortcuts** -- Arrow keys for movement, spacebar for auto-move toggle
- **Cross-platform** -- Works on macOS and Linux

## Prerequisites

- [Bun](https://bun.sh) v1.0+
- [pymobiledevice3](https://github.com/doronz88/pymobiledevice3)
- Python 3.8+
- iOS 17+ device with **Developer Mode** enabled (Settings > Privacy & Security > Developer Mode)

## Quick Start

```bash
pip3 install pymobiledevice3

git clone https://github.com/MVRer/LocationSpoofer360.git
cd LocationSpoofer360
bun install
cd client && bun install && cd ..

bun run dev
```

Open `http://localhost:3000` in your browser.

### Production

```bash
bun run build
bun start
```

Both the API and built client are served from `http://localhost:3001`.

## Usage

1. Connect your iOS device via USB
2. Click **Start Tunnel** in the sidebar (admin password prompt will appear)
3. Select your device from the sidebar
4. Click the map to teleport, or choose **Navigate** to follow a calculated route

### Controls

| Action | Input |
|--------|-------|
| Teleport | Click on map |
| Navigate | Click map, select "Navigate" |
| Step forward | Click movement button / Arrow Up |
| Auto-move | Long-press movement button / Spacebar |
| Change heading | Drag compass wheel / Arrow Left, Right |
| Change speed | Drag speed slider in toolbar |
| Load GPX | Click GPX button in toolbar |
| Reset location | Click Reset button |
| Go to coordinates | Click Coords button in toolbar |

### Arrow Key Modes

- **Natural** (default): Arrows move in that cardinal direction
- **Traditional**: Up/Down move forward/backward, Left/Right rotate heading

## Architecture

```
Browser (:3000)              Bun Server (:3001)           pymobiledevice3
+-----------------+   REST   +------------------+  spawn  +----------+
| React + Leaflet |<-------->| HTTP + WebSocket  |<------->| tunneld  |
| OSM tiles       |   + WS   | Movement engine   |         | DVT sim  |
+-----------------+          +------------------+         +----------+
```

- **Frontend**: React, Vite, Tailwind CSS, Leaflet (OpenStreetMap)
- **Backend**: Bun HTTP server, WebSocket
- **Routing**: [OSRM](http://project-osrm.org/) (open source, replaces Apple MapKit)
- **Geocoding**: [Nominatim](https://nominatim.org/) (OpenStreetMap)
- **Linting**: [Biome](https://biomejs.dev/)

## Development

```bash
bun run dev          # Start dev server (client + server)
bun run lint         # Lint with Biome
bun run lint:fix     # Auto-fix lint issues
bun run format       # Format with Biome
bun run build        # Production build
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for code standards, commit conventions, and contribution guidelines.

## License

MIT
