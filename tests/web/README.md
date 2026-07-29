# Web Tests

Web tests should run with:

```bash
npm --prefix web test
```

Start with pure helpers and hook-adjacent logic. Add component tests after the
first real screens exist.

Current web gate is TypeScript validation for the live room page, socket hooks,
chat panel, and shared realtime contracts.
