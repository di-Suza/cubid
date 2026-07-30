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

## Domain B Runtime

Domain B is implemented around the `auction-engine` module and the realtime
gateway.

- `AuctionQueueService` serializes mutations per auction.
- `AuctionEngineService` validates bid intent, assigns server sequences, writes
  accepted bids before returning, and finalizes auctions idempotently.
- `AuctionSnapshotService` builds reconnect-safe room snapshots with
  `version`, `lastSequence`, recent bids, timeline, permissions, stats, and
  payment status.
- `AuctionTimerService` restores start/end timers on API boot and reconciles
  overdue auctions from MongoDB state.
- `AuctionRealtimeHandler` owns Socket.IO room join/resync/leave/bid events and
  broadcasts only after authoritative state is ready.
- `ChatService` persists authenticated room messages outside the auction queue
  so chat cannot delay bid mutations.

Frontend Domain B code currently lives in reusable hooks and shared contracts:
`useAuctionRoom` for room lifecycle/snapshots and `useBidIntent` for bid intent
acks. The live auction room page composes snapshots, bid form state, recent
bids, timeline, room metrics, payment state, and chat.

## Domain A Runtime

Domain A is implemented around REST APIs and RTK Query pages that surround the
realtime engine.

- `AuthService` creates JWT access tokens and HTTP-only refresh sessions whose
  stored refresh tokens are hashed.
- `UserService` exposes the current authenticated user without password hashes.
- `AuctionService` creates auctions from the authenticated seller, records
  `AUCTION_CREATED`, schedules Domain B timers, lists public auctions, returns
  public detail DTOs, and lists owner auctions.
- `PaymentService` lists winner payment records and performs mock checkout
  transitions only for the persisted winner.
- The web app restores sessions on boot, reconnects Socket.IO with the current
  access token, guards protected routes, and uses RTK Query for marketplace
  screens.

REST detail/list data is public-safe marketplace data. Mutable live state,
bid acceptance, timer completion, winner declaration, and room payment status
remain server-authoritative through Domain B snapshots.
