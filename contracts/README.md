# Contracts

This folder owns API contracts.

Initial status:

- REST is the default HTTP API style.
- Socket.IO event names are documented in the realtime infrastructure.
- Domain B socket payloads are implemented for auction join/resync/leave,
  bid intent, snapshots, accepted/rejected bids, stats, chat messages,
  marketplace list updates, and lifecycle events.
- OpenAPI can be added under `contracts/openapi` as endpoints become real.

Contract rules:

- Backend validators and frontend RTK Query types must agree.
- Backend realtime payloads and frontend entity types must agree.
- Breaking response changes require a docs update.
- Error codes should be stable and machine-readable.

## REST Contracts Implemented

Auth:

- `POST /api/auth/register` -> `{ accessToken, user }` and refresh cookie.
- `POST /api/auth/login` -> `{ accessToken, user }` and refresh cookie.
- `POST /api/auth/refresh` -> `{ accessToken, user }` from refresh cookie.
- `POST /api/auth/logout` -> clears/revokes refresh cookie.
- `GET /api/auth/me` and `GET /api/users/me` -> `{ user }`.

Auctions:

- `GET /api/auctions?page&limit&status&search` -> `{ items, meta }`.
- `POST /api/auctions` with `imageDataUrl` upload or `imageUrl` fallback ->
  `{ auction }`; seller is derived from auth.
- `GET /api/auctions/me?page&limit&status` -> authenticated owner auctions.
- `GET /api/auctions/:auctionId` -> public-safe auction detail.

Payments:

- `GET /api/payments/me/wins` -> winner payment records with auction summary.
- `POST /api/payments/:paymentId/order` -> provider checkout order/session
  derived from persisted winner payment.
- `POST /api/payments/:paymentId/verify` -> server-side checkout verification.
- `POST /api/payments/webhook` -> provider callback with server signature
  verification.
- `POST /api/payments/:paymentId/mock-checkout` with
  `{ outcome: "SUCCESSFUL" | "FAILED" }` -> persisted payment status.

Live bids remain Socket.IO-only through `bid:place`; REST does not create bids.
