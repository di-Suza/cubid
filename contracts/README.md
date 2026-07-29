# Contracts

This folder owns API contracts.

Initial status:

- REST is the default HTTP API style.
- Socket.IO event names are documented in the realtime infrastructure.
- Domain B socket payloads are implemented for auction join/resync/leave,
  bid intent, snapshots, accepted/rejected bids, stats, chat messages, and
  lifecycle events.
- OpenAPI can be added under `contracts/openapi` as endpoints become real.

Contract rules:

- Backend validators and frontend RTK Query types must agree.
- Backend realtime payloads and frontend entity types must agree.
- Breaking response changes require a docs update.
- Error codes should be stable and machine-readable.
