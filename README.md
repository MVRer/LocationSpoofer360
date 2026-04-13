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

bun run dev
```

Open `http://localhost:5173` in your browser — single server, single port.

### Production

```bash
bun run build
bun run start
```

Production server runs at `http://localhost:3001`.

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
Browser (:5173)                     Bun + React Router v7           pymobiledevice3
+---------------------+  loaders   +---------------------+  spawn  +----------+
| React + Leaflet     |<---------->| SSR + API routes    |<------->| tunneld  |
| Zustand, Tailwind   |  actions   | Movement engine     |         | DVT sim  |
|                     |<---SSE-----| Device polling      |         |          |
+---------------------+            +---------------------+         +----------+
```

Single server, single port. No proxy, no WebSocket.

- **Framework**: [React Router v7](https://reactrouter.com/) (framework mode, SSR)
- **Runtime**: [Bun](https://bun.sh)
- **UI**: React 19, Tailwind CSS 4, [Leaflet](https://leafletjs.com/) (OpenStreetMap)
- **State**: [Zustand](https://zustand.docs.pmnd.rs/)
- **Real-time**: Server-Sent Events (SSE) for location/device/navigation updates
- **Routing**: [Valhalla](https://github.com/valhalla/valhalla) (OpenStreetMap)
- **Geocoding**: [Photon](https://photon.komoot.io/) (OpenStreetMap)
- **Linting**: [Biome](https://biomejs.dev/)

### Project Structure

```
app/          React Router app (routes, components, hooks, store)
app/routes/   File-based routes + API resource routes
server/       Backend (simulation, device management, tunnel, SSE)
shared/       Types and constants shared between client and server
```

## Development

```bash
bun run dev          # Start dev server (single port, HMR + SSR)
bun run build        # Production build
bun run start        # Start production server
bun run typecheck    # Type check
bun run lint         # Lint with Biome
bun run lint:fix     # Auto-fix lint issues
bun run format       # Format with Biome
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for code standards, commit conventions, and contribution guidelines.

## License

MIT
