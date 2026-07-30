# Test Strategy

Executable tests will live inside `api/tests` and `web/tests` so each package
can compile and run independently.

Current executable gates:

- API auth/session service rules
- API auction creation, discovery, owner query, and winner payment rules
- API image upload validation for auction creation
- API gateway payment order/verification rules
- API auction queue serialization
- API bid validation, ordering, duplicate request handling, and finalization
- API room presence accounting
- API realtime room/bid/chat handler behavior
- API timer restore start/end reconciliation
- Web TypeScript checks for realtime room hooks and live room composition
- Web TypeScript checks for auth/session pages, marketplace pages, dashboard,
  payment UX, profile, route guards, and app shell
- Optional E2E smoke runner for a running local API

Planned gates:

- Additional API validators and route/controller behavior
- More payment webhook idempotency edge cases
- Socket transport tests with a real Socket.IO server
- Frontend helpers, hooks, RTK Query cache behavior, and page smoke tests
- End-to-end demo flows after selectors and seed data are stable
