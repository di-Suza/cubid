# API Tests

API tests should run with:

```bash
npm --prefix api test
```

Use fakes for payment gateways, sockets, Redis, and external providers.
Normal tests must not require network calls.

Current coverage includes:

- `AuctionQueueService` per-auction serialization
- `AuctionEngineService` accepted/rejected bid rules, duplicate request IDs,
  winner finalization, and no-bid finalization
- `AuctionPresenceService` authenticated-user and guest counting
- `AuctionRealtimeHandler` join, bid broadcast, ended-bid finalization, and
  non-blocking chat broadcast
- `AuctionTimerService` overdue start/end recovery
- `ChatService` authenticated trim/persist validation
