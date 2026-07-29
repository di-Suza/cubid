# Cubid Architecture Guide

This document is the working architecture baseline for the BidArena sprint.
Keep it aligned with the SRS and the implementation handoff.

## System Map

```txt
React + TypeScript web app
  |
  | REST through RTK Query
  | Socket.IO for live rooms
  v
Express + TypeScript API
  |
  +-- MongoDB through Mongoose
  +-- Socket.IO realtime gateway
  +-- Payment gateway adapter boundary
  +-- Optional Redis for future scale/locks
```

The sprint should remain a modular monolith. Domains are separated in code so
the team can work independently without pretending the system is already
microservices.

## Backend Layers

```txt
route -> validator/middleware -> controller -> service -> repository -> model
```

- Routes own HTTP wiring.
- Validators own request shape checks.
- Controllers map transport input and response output.
- Services own use cases, policy, and state transitions.
- Repositories own persistence queries and transaction boundaries.
- Models own schema shape, indexes, and persistence constraints.

## Frontend Layers

```txt
app -> pages -> widgets -> features -> entities -> shared
```

- `app` owns providers, store, routing, layouts, and bootstrap.
- `pages` are route-level composition wrappers.
- `widgets` are reusable composed page sections.
- `features` own product workflows.
- `entities` own shared business nouns and types.
- `shared` owns domain-neutral UI, API, hooks, config, and utilities.

## BidArena Invariants

- Server state is authoritative.
- Each auction gets serialized bid processing.
- Accepted bids are persisted before broadcast.
- Server time controls bid acceptance and auction completion.
- Finalization is idempotent.
- Payment amount and winner identity are derived from persisted state.
- Reconnecting clients receive a full snapshot.
- Chat and heat metrics never block bid processing.
