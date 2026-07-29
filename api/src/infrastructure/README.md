# Infrastructure Boundary

Infrastructure owns runtime adapters and provider integrations.

Planned areas:

- `database`: MongoDB connection and future transaction helpers.
- `realtime`: Socket.IO gateway and event contracts.
- `cache`: Redis client and future distributed locks.
- `payments`: Razorpay/Stripe provider adapters.
- `observability`: structured logging and metrics.
- `storage`: future media provider adapter.

Domain services should call product-level operations, not provider SDKs
directly.
