# Web Tests

Web tests should run with:

```bash
npm --prefix web test
```

Start with pure helpers and hook-adjacent logic. Add component tests after the
first real screens exist.

Current web gate is TypeScript validation for auth/session restore, route
guards, marketplace pages, create-auction form, live room page, socket hooks,
chat panel, dashboard, winner payment UX, profile, app shell, and shared REST
and realtime contracts.
