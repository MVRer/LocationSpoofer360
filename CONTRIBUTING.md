# Contributing to LocationSpoofer360

## Prerequisites

- [Bun](https://bun.sh) v1.0+
- [pymobiledevice3](https://github.com/doronz88/pymobiledevice3) installed and accessible in PATH
- Node.js 18+ (for some tooling compatibility)

## Development Setup

```bash
git clone git@github.com:MVRer/LocationSpoofer360.git
cd LocationSpoofer360
bun install
cd client && bun install && cd ..
bun run dev
```

The dev server runs at `http://localhost:3000` (Vite) with API proxy to `:3001` (Bun).

## Project Structure

```
server/          Bun HTTP + WebSocket server
  api/           REST endpoint handlers
  device/        pymobiledevice3 binary discovery, device listing
  tunnel/        tunneld lifecycle management
  simulation/    DVT process, movement engine, navigation, route tracking
  gpx/           GPX file parser
  ws/            WebSocket connection management

client/          React + Vite frontend
  src/
    components/  React components (layout, map, controls, dialogs, common)
    hooks/       Custom React hooks (WebSocket, keyboard)
    services/    API client, geocoding, routing
    store/       Zustand state management
    lib/         Utility functions (geo math, speed calculations)

shared/          Types, constants, and protocol definitions shared between server and client
```

## Code Standards

### General

- TypeScript strict mode everywhere
- No `any` types unless absolutely unavoidable (suppress with a comment explaining why)
- No emojis in code, UI, documentation, or commit messages
- Use `const` over `let` wherever possible; never use `var`
- Prefer explicit return types on exported functions
- No unused imports or variables (enforced by Biome)

### Frontend

- Use Tailwind CSS for all styling; no CSS-in-JS, no CSS modules, no global stylesheets (except Leaflet overrides)
- Use `@heroicons/react` for icons; no emoji characters in UI
- Use Zustand for state management; no prop drilling beyond 1 level
- Components should be function components only
- Keep components small and focused; extract when a component exceeds ~100 lines

### Backend

- Use `Bun.spawn` for subprocess management
- All API handlers return JSON via the `json()` / `error()` helpers from `router.ts`
- Broadcast state changes over WebSocket immediately after mutation
- Clean up resources (processes, timers) on shutdown

### Linting and Formatting

```bash
bun run lint        # Check for issues
bun run lint:fix    # Fix auto-fixable issues
bun run format      # Format all files
bun run check       # Fix everything (lint + format + unsafe fixes)
```

Biome is the sole linter and formatter. Do not add ESLint, Prettier, or other formatting tools.

## Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/) strictly.

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type       | When to use                                           |
|------------|-------------------------------------------------------|
| `feat`     | New feature or capability                             |
| `fix`      | Bug fix                                               |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf`     | Performance improvement                               |
| `docs`     | Documentation only                                    |
| `style`    | Formatting, whitespace (not CSS changes)              |
| `test`     | Adding or updating tests                              |
| `build`    | Build system or dependency changes                    |
| `ci`       | CI/CD configuration                                   |
| `chore`    | Maintenance tasks that don't fit other types          |

### Scopes

Use the directory or module name: `server`, `client`, `shared`, `api`, `map`, `movement`, `navigation`, `tunnel`, `gpx`, `ui`.

### Rules

- Subject line: imperative mood, lowercase, no period, max 72 characters
- Body: explain *why*, not *what* (the diff shows what)
- Reference issues with `Closes #N` or `Fixes #N` in the footer
- One logical change per commit

### Examples

```
feat(navigation): add OSRM route calculation with walk/cycle/drive profiles
fix(tunnel): use bash -c for Linux tunneld kill to avoid Bun spawn shell issue
refactor(server): extract GPS coordinate math into shared/geo module
```

## Pull Requests

### Before Submitting

1. Run `bun run lint` and fix all issues
2. Run `bun run build` to verify the client builds
3. Test with the dev server (`bun run dev`)
4. If touching the movement engine or navigation, test with a real device if possible

### PR Format

```
## Summary

Brief description of what changed and why.

## Changes

- Bullet list of specific changes

## Testing

How this was tested (manual steps, device tested with, browser, etc.)
```

### Review Criteria

- Code follows the standards above
- No regressions in existing functionality
- New features include appropriate WebSocket events
- API changes are backwards-compatible or clearly documented as breaking

## Issues

### Bug Reports

Include:
- Steps to reproduce
- Expected behavior vs actual behavior
- Device model and iOS version (if device-related)
- Browser and OS
- Server logs (if applicable)

### Feature Requests

Include:
- Clear description of the desired behavior
- Why existing functionality doesn't cover the use case
- Any reference to how the original LocationSpoofer macOS app handles it (if applicable)
