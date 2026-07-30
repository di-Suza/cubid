# End-To-End Tests

E2E tests are planned after the first stable BidArena user journey exists.

Priority journeys:

- Register and login
- Create auction
- Join as guest and authenticated bidder
- Place competing bids
- Refresh/reconnect and resync
- Finalize auction
- Winner payment retry/success

Domain A now has stable routes and API contracts for these journeys. E2E can
target the public discovery route, protected create/dashboard routes, and the
winner payment page once deterministic seed data is added.
