# API Tests

API tests should run with:

```bash
npm --prefix api test
```

Use fakes for payment gateways, sockets, Redis, and external providers.
Normal tests must not require network calls.
