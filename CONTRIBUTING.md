# Contributing to Aniraku

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

1. Fork and clone the repo
2. Install Go 1.24+ and Node.js 18+
3. Copy `config.example.yaml` to `config.yaml` with your Supabase credentials
4. Run the backend: `go run ./cmd/aurelia-server/`
5. Run the frontend: `cd web && pnpm dev`

## Project Structure

```
aurelia/
├── cmd/aurelia-server/    # Server entrypoint
├── internal/
│   ├── api/               # HTTP handlers and routing
│   ├── auth/              # JWT authentication
│   ├── config/            # Configuration loading
│   ├── core/              # Shared models
│   ├── metadata/          # AniList client
│   ├── streaming/         # Provider manager (Miruro, Senshi)
└── web/                   # React frontend
```

## Guidelines

- Keep it simple. No over-engineering.
- Follow existing code style
- Test your changes with multiple anime (popular + old)
- One PR per feature/fix

## Adding a Streaming Provider

1. Create a new file in `internal/extensions/builtin/`
2. Implement the `StreamingProvider` interface
3. Register it in `cmd/aurelia-server/main.go`

## Reporting Issues

Use GitHub Issues. Include:
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS

## License

By contributing, you agree your code is licensed under MIT.
