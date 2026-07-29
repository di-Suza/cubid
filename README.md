# Cubid BidArena

Cubid is the BidArena hack-sprint workspace. The repository is intentionally
prepared as an industry-style full-stack TypeScript monorepo before feature
implementation starts.

The current baseline contains:

- `api`: Express, MongoDB, Socket.IO, middleware, errors, validators, configs,
  health checks, and domain skeletons.
- `web`: React, Vite, routing, app providers, RTK Query, shared UI, socket
  client, and feature/page skeletons.
- `contracts`: API contract ownership and future OpenAPI location.
- `tests`: test strategy and planned gates.
- `docs`: architecture decisions and implementation guidance.

Feature logic should be added inside the existing module boundaries instead of
creating ad hoc folders.

## Scripts

```bash
npm run dev:api
npm run dev:web
npm run check
npm run test
npm run verify
```

Local defaults:

- API: `http://localhost:8081`
- API base URL: `http://localhost:8081/api`
- Web: `http://localhost:5173`

## Architecture Rule

Backend request path:

```txt
route -> middleware/validator -> controller -> service -> repository -> model
```

Frontend import direction:

```txt
app -> pages -> widgets -> features -> entities -> shared
```

The backend is the single source of truth for auction state, bidding,
permissions, timers, winner declaration, and payments.
