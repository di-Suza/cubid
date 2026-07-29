# Architecture Decisions

## ADR-001: TypeScript Modular Monorepo

Status: Accepted

Cubid uses one repository with separately deployable `api` and `web` packages.
This keeps sprint development simple while preserving clean backend and frontend
boundaries.

## ADR-002: Backend Layered Modules

Status: Accepted

Backend domains follow:

```txt
route -> controller -> service -> repository -> model
```

Business rules belong in services. Database access belongs in repositories.

## ADR-003: Feature-First Frontend With Explicit Layers

Status: Accepted

Frontend code follows:

```txt
app -> pages -> widgets -> features -> entities -> shared
```

Features own workflows. Shared code must stay domain-neutral.

## ADR-004: Socket.IO For Live Auction Rooms

Status: Accepted

Live auction state, bids, chat, stats, and reconnection snapshots use Socket.IO.
Bid validation still happens only on the server.

## ADR-005: MongoDB As Durable Source Of Truth

Status: Accepted

Auctions, bids, timelines, payments, users, sessions, and chat records are
stored in MongoDB. In-memory socket state is never durable truth.

## ADR-006: Server-Authoritative Auction Engine

Status: Accepted

Bid intent is accepted only through the backend auction engine. The server
derives the bidder from the socket session, processes one mutation at a time per
auction, assigns the sequence, persists the accepted bid, and then broadcasts
the resulting snapshot.

## ADR-007: Reconnect By Full Snapshot

Status: Accepted

Realtime clients recover by joining the auction room and receiving a full
snapshot containing `version` and `lastSequence`. Frontend hooks ignore older
snapshots so delayed events cannot move the UI backward.
