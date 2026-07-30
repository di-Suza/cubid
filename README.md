# Cubid BidArena

Cubid is the BidArena hack-sprint workspace. The repository is intentionally
prepared as an industry-style full-stack TypeScript monorepo before feature
implementation starts.

The current baseline contains:

- `api`: Express, MongoDB, Socket.IO, middleware, errors, validators, configs,
  health checks, domain skeletons, and the Domain B server-authoritative auction
  engine plus Domain A auth, marketplace, owner, and payment REST flows.
- `web`: React, Vite, routing, app providers, RTK Query, shared UI, socket
  client, realtime auction hooks, live room UI, auth screens, marketplace
  discovery, creation, dashboard, wins, profile, and app shell.
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

## Domain B Status

Domain B currently owns the auction engine, realtime room state, server timers,
bid ordering, idempotent bid requests, finalization, and winner payment
bootstrap. The live auction room is wired to authoritative snapshots, bid
intent acknowledgements, room stats, recent bids, timeline state, and
non-blocking chat.

## Domain A Status

Domain A now owns the usable marketplace path around the engine:

- Email/password registration, login, refresh-session restore, and logout.
- Public auction discovery and detail REST endpoints.
- Authenticated auction creation with seller-derived ownership.
- Owner dashboard and my-auctions queries.
- Winner payment list and mock success/failure checkout UX.
- Profile, route guards, authenticated shell navigation, and public landing.

Live bidding remains socket-authoritative through Domain B; the web room uses
REST detail only as a pre-snapshot fallback.
