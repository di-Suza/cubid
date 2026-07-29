# Test Strategy

Executable tests will live inside `api/tests` and `web/tests` so each package
can compile and run independently.

Current executable gates:

- API auction queue serialization
- API bid validation, ordering, duplicate request handling, and finalization
- API room presence accounting

Planned gates:

- Additional API validators and route/controller behavior
- Timer finalization and recovery
- Payment idempotency
- Socket snapshot and reconnect behavior
- Frontend helpers, hooks, RTK Query cache behavior, and page smoke tests
- End-to-end demo flows after selectors and seed data are stable
