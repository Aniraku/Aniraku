# Aniraku

An open-source anime streaming platform built with Go and React. Features multiple streaming sources with automatic fallback and a clean modern UI.

## Features

- **Multi-source streaming** — Miruro (primary) with Senshi HLS fallback
- **SUB/DUB support** — Language selection per episode
- **Anime metadata** — AniList integration for covers, descriptions, schedules
- **Artplayer** — Custom video player with skip intro, playback rate, PIP, fullscreen, hotkeys
- **Watch history** — Auto-saves progress per episode
- **Catalog & search** — Browse by genre, format, status, season
- **Dark mode** — Always-on dark theme
- **Responsive** — Mobile-first design

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Go 1.24, Chi router, zerolog |
| Frontend | React 18, Vite, Artplayer |
| Metadata | AniList GraphQL API |
| Streaming | Miruro API, Senshi HLS |
| Auth | Supabase (JWT) |
| Database | Supabase (PostgreSQL) |

## Quick Start

### Prerequisites

- Go 1.24+
- Node.js 18+
- pnpm

### Backend

```bash
# Install dependencies
go mod download

# Build
go build -o aurelia-server ./cmd/aurelia-server/

# Run
./aurelia-server --config config.yaml
```

Server starts on `http://127.0.0.1:43211`

### Frontend

```bash
cd web

# Install dependencies
pnpm install

# Development
pnpm dev

# Build for production
pnpm build
```

## Configuration

Copy `config.example.yaml` to `config.yaml` and configure:

```yaml
server:
  host: "127.0.0.1"
  port: 43211
  debug: true

supabase:
  url: "https://your-project.supabase.co"
  key: "your-anon-key"
  service_key: "your-service-key"
  jwt_aud: "authenticated"
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/anime/{id}` | Anime details |
| GET | `/api/v1/anime/{id}/episodes` | Episode list |
| POST | `/api/v1/stream` | Get streaming source |
| GET | `/api/v1/miruro/episodes/{id}` | Miruro episode list |
| GET | `/api/v1/miruro/has-dub/{id}` | Check DUB availability |
| GET | `/api/v1/search?q=...` | Search anime |
| GET | `/api/v1/browse` | Browse catalog |
| GET | `/api/v1/trending` | Trending anime |

## Architecture

```
Client → Miruro (primary) → Senshi HLS (fallback)
```

## License

MIT
