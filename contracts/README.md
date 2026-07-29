# Contracts

This folder owns API contracts.

Initial status:

- REST is the default HTTP API style.
- Socket.IO event names are documented in the realtime infrastructure.
- OpenAPI can be added under `contracts/openapi` as endpoints become real.

Contract rules:

- Backend validators and frontend RTK Query types must agree.
- Breaking response changes require a docs update.
- Error codes should be stable and machine-readable.
