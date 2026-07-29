# Test Strategy

Executable tests will live inside `api/tests` and `web/tests` so each package
can compile and run independently.

Planned gates:

- API validators and service rules
- Auction queue and concurrent bid ordering
- Timer finalization and recovery
- Payment idempotency
- Socket snapshot and reconnect behavior
- Frontend helpers, hooks, RTK Query cache behavior, and page smoke tests
- End-to-end demo flows after selectors and seed data are stable
