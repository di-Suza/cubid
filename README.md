# Cubid is a full-stack real-time auction platform for creating listings, discovering live auctions, bidding in server-authoritative rooms, chatting in real time, and completing winner payments.

Cubid is built as a TypeScript monorepo with an Express API, MongoDB
persistence, Socket.IO realtime rooms, a React/Vite frontend, and payment
gateway adapters for checkout flows. The application keeps auction state on the
server so bid ordering, timers, winners, and payment status cannot be decided by
the browser.

## Core Features

- Public landing page and auction marketplace discovery.
- Email/password registration, login, refresh-session restore, and logout.
- Authenticated seller auction creation with image upload data URLs or image URL
  fallback.
- Public auction detail pages and live auction rooms.
- Server-authoritative bidding with serialized per-auction bid processing.
- Realtime room snapshots, bid acknowledgements, lifecycle updates, viewers,
  recent bids, timeline events, and room stats.
- Read-only public room visibility for guests with authenticated bid/chat
  actions.
- Authenticated room chat that does not block auction bid processing.
- Owner dashboard, my-auctions, profile, and winner payment screens.
- Winner payment order creation, server-side verification, signed webhook
  handling, and retryable failed payment state.
- Mock payment mode for local demos plus Razorpay and Stripe gateway adapters.
- API-hosted static frontend build under `api/views` for single-service
  deployment.

## Tech Stack

| Layer | Tools |
| --- | --- |
| Runtime | Node.js 22+, TypeScript, ES modules |
| API | Express 5, Mongoose, Socket.IO, Zod, express-validator |
| Security | Helmet, CORS allowlists, HTTP-only refresh cookies, rate limits, centralized errors |
| Auth | JWT access tokens, hashed refresh sessions, bcrypt password hashing |
| Payments | Mock gateway, Razorpay adapter, Stripe adapter, signed webhook verification |
| Web | React 19, Vite 6, React Router, Redux Toolkit, RTK Query, Socket.IO client |
| Testing | Node test runner, TypeScript typechecks, smoke test script |
| Local infra | Docker Compose for MongoDB, Redis, API, and web dev services |

## Repository Structure

```txt
cubid/
  api/
    src/
      app.ts                         Express app, middleware, API routes, SPA static serve
      server.ts                      HTTP and Socket.IO bootstrap
      config/                        Environment, MongoDB, logger setup
      core/                          Shared core boundaries for events, HTTP, policies
      infrastructure/
        database/                    Database infrastructure entry points
        payments/                    Mock, Razorpay, and Stripe gateway adapters
        realtime/                    Socket.IO service, handlers, auth, presence, event types
        cache/ storage/ observability/
      modules/
        auth/                        Registration, login, refresh sessions, logout
        users/                       Current user/profile data
        auctions/                    Auction creation, discovery, owner listings, detail DTOs
        auction-engine/              Bid queue, engine, snapshots, timers
        bids/                        Bid module boundary and persistence
        chat/                        Auction room chat persistence
        payments/                    Winner payments, orders, verification, webhooks
        results/                     Auction result model boundary
        timeline/                    Auction lifecycle timeline model boundary
        health/                      Health check endpoint
      shared/
        constants/                   Roles, HTTP status, auction constants
        errors/                      AppError and typed HTTP errors
        middleware/                  Auth, validation, rate limit, request logging, error handling
        utils/                       Tokens, cookies, password helpers, async handler
        validators/                  Shared validators
      scripts/seedDemo.ts            Demo data seeding
      testing/                       API testing notes
    tests/                           API unit/service tests
    views/                           Production web build served by the API
  web/
    src/
      app/                           Providers, router, store, layouts, auth bootstrap
      pages/                         Route entry points
      widgets/                       Reusable composed UI sections
      features/                      Product workflows and RTK Query APIs
      entities/                      Business types for auction, bid, chat, payment, user, timeline
      shared/                        API client, socket client, UI primitives, hooks, config, assets
      styles/                        Global styling
      testing/                       Web testing notes
  contracts/                         REST and realtime contract notes
  docs/                              Architecture, deployment, development, security docs
  tests/e2e/                         Smoke test runner
  docker-compose.yml                 Local MongoDB, Redis, API, and web stack
  package.json                       Root workspace scripts
```

## Architecture

Cubid is a modular monolith. The API and web app are organized by clear module
boundaries so features can grow without introducing ad hoc folders or hidden
cross-layer dependencies.

Backend request path:

```txt
route -> validator/middleware -> controller -> service -> repository -> model
```

Frontend import direction:

```txt
app -> pages -> widgets -> features -> entities -> shared
```

System map:

```txt
React + TypeScript web app
  |
  | REST through RTK Query
  | Socket.IO for live rooms
  v
Express + TypeScript API
  |
  +-- MongoDB through Mongoose
  +-- Socket.IO realtime gateway
  +-- Payment gateway adapter boundary
  +-- API-hosted static SPA build
```

## Backend Design

The API starts in `api/src/server.ts`, builds the Express app from
`api/src/app.ts`, connects to MongoDB, attaches Socket.IO, restores auction
timers, and listens on `PORT`.

The Express app includes:

- Request logging.
- Helmet security headers.
- CORS allowlist with credentials.
- API rate limiting.
- JSON and URL-encoded body parsing.
- Raw body capture for payment webhook verification.
- Cookie parsing for refresh sessions.
- Mounted API routes under `/api`.
- Static SPA serving from `api/views` for non-API routes.
- Central not-found and error handling.

Key backend invariants:

- The server is the source of truth for auction state.
- Each auction serializes bid mutations through a per-auction queue.
- Accepted bids are persisted before they are broadcast.
- Server time controls auction start, bid acceptance, and finalization.
- Finalization is idempotent.
- Winner identity and payment amount come from persisted auction state.
- Reconnecting clients receive a full authoritative snapshot.
- Chat and room metrics never block bidding.

## REST API

All REST routes are mounted under `/api`.

### Health

- `GET /api/health` - service health response.

### Auth and Users

- `POST /api/auth/register` - create a user, return `{ accessToken, user }`,
  and set the refresh cookie.
- `POST /api/auth/login` - sign in, return `{ accessToken, user }`, and set the
  refresh cookie.
- `POST /api/auth/refresh` - restore a session from the refresh cookie.
- `POST /api/auth/logout` - revoke the refresh session and clear the cookie.
- `GET /api/auth/me` - return the authenticated user.
- `GET /api/users/me` - return the authenticated user through the user module.

### Auctions

- `GET /api/auctions?page&limit&status&search` - public marketplace listing.
- `POST /api/auctions` - authenticated seller auction creation. The seller is
  derived from the authenticated user. Product images can be sent as
  `imageDataUrl` or `imageUrl`.
- `GET /api/auctions/me?page&limit&status` - authenticated seller listings.
- `GET /api/auctions/:auctionId` - public-safe auction detail.

### Payments

- `GET /api/payments/me/wins` - authenticated winner payment records.
- `POST /api/payments/:paymentId/order` - create a gateway checkout order or
  session from the stored payment record.
- `POST /api/payments/:paymentId/verify` - verify a provider checkout result on
  the server.
- `POST /api/payments/webhook` - process signed Razorpay or Stripe callbacks.
- `POST /api/payments/:paymentId/mock-checkout` - local demo checkout with
  `{ outcome: "SUCCESSFUL" | "FAILED" }`.

Live bids are Socket.IO-only through `bid:place`; REST never creates bids.

## Realtime API

Socket.IO is attached to the API server and uses the same backend origin in
production. Authenticated sockets can include the current access token during
connection; guests can still receive public room state.

Important events:

- `connection:ready`
- `connection:error`
- `auction:join`
- `auction:leave`
- `auction:resync`
- `auction:snapshot`
- `auction:state`
- `auction:started`
- `auction:ended`
- `auction:marketplace:update`
- `bid:place`
- `bid:accepted`
- `bid:rejected`
- `chat:send`
- `chat:message`
- `stats:update`
- `room:error`

Room snapshots include versioning, last sequence, recent bids, timeline,
viewer stats, permissions, winner data, and payment state. Marketplace pages
listen to `auction:marketplace:update` so new, started, updated, and ended
auctions can appear without a manual refresh.

## Frontend Design

The web app is a React/Vite application with route-level lazy loading,
Redux Toolkit state, RTK Query API clients, Socket.IO lifecycle management, and
shared UI primitives.

Routes:

- `/` - landing page.
- `/auctions` - public auction discovery.
- `/auctions/:auctionId` - live auction room.
- `/sign-in` and `/sign-up` - authentication pages.
- `/dashboard` - authenticated dashboard.
- `/create-auction` - seller auction creation.
- `/my-auctions` - seller auction management.
- `/my-wins` - winner payment list and checkout actions.
- `/profile` - authenticated profile page.

Frontend data flow:

- RTK Query owns REST fetches, mutations, caching, and optimistic list refreshes.
- Socket lifecycle reconnects when the auth token changes.
- Auction room hooks subscribe to snapshots, bid acks, chat, stats, and room
  errors.
- Shared config defaults to same-origin `/api` and current-origin Socket.IO in
  production.
- Vite dev proxy forwards `/api` and `/socket.io` to the local API server.

## Data Model Overview

MongoDB collections are modeled with Mongoose:

- Users: account identity, email, password hash, role, and status.
- Auth sessions: hashed refresh tokens and session expiry.
- Auctions: seller, title, description, image, money fields, status, start/end
  times, versioning, current highest bid, winner, and payment state.
- Bids: accepted bid records with bidder, amount, request id, and sequence.
- Timeline events: auction lifecycle and engine events.
- Chat messages: authenticated room messages.
- Payments: winner payment records, provider order/session ids, provider
  payment ids, amount, gateway, and status.
- Results: auction result boundary for completed auctions.

## Local Setup

Prerequisites:

- Node.js 22 or newer.
- npm.
- MongoDB locally or through Docker Compose.
- Optional Redis for the local compose stack.

Install dependencies:

```bash
npm install
npm --prefix api install
npm --prefix web install
```

Create local environment files from the examples:

```bash
copy .env.example .env
copy api\.env.example api\.env
```

Start MongoDB with Docker Compose:

```bash
docker compose up -d mongo
```

Run the API and web app in separate terminals:

```bash
npm run dev:api
npm run dev:web
```

Local defaults:

- API: `http://localhost:8081`
- REST base URL: `http://localhost:8081/api`
- Web: `http://localhost:5073`

## Demo Data

Seed demo accounts and auctions after MongoDB is running:

```bash
npm run seed:demo
```

Demo accounts use `Password123!`:

- `seller@cubid.demo`
- `bidder@cubid.demo`
- `rival@cubid.demo`

## Scripts

```bash
npm run dev:api
npm run dev:web
npm run seed:demo
npm run test:e2e:smoke
npm run check
npm run test
npm run verify
npm run build:api
npm run build:web
npm run start:api
```

Script purpose:

- `check` runs API and web TypeScript checks.
- `test` runs API service tests and web typecheck tests.
- `verify` runs tests, checks, and both builds.
- `test:e2e:smoke` checks health, discovery, registration, auction creation,
  and owner listing when a local API is reachable.

## Deployment

Cubid supports a single-service Node deployment where the API serves the
compiled frontend from `api/views`.

Render configuration:

```txt
Root Directory: api
Build Command: npm install && npm run build
Start Command: npm run start
```

Production environment values:

```env
NODE_ENV=production
MONGODB_URI=<mongodb-uri>
WEB_APP_URL=https://<your-app>.onrender.com
CORS_ORIGIN=https://<your-app>.onrender.com
SOCKET_CORS_ORIGIN=https://<your-app>.onrender.com
JWT_ACCESS_SECRET=<strong-secret>
JWT_REFRESH_SECRET=<strong-secret>
COOKIE_SECRET=<strong-secret>
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL_DAYS=30
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300
PAYMENT_GATEWAY=razorpay
RAZORPAY_KEY_ID=<razorpay-key-id>
RAZORPAY_KEY_SECRET=<razorpay-key-secret>
RAZORPAY_WEBHOOK_SECRET=<razorpay-webhook-secret>
```

Use `PAYMENT_GATEWAY=mock` only for local demos or non-production test
deployments. For Stripe, set `PAYMENT_GATEWAY=stripe`, `STRIPE_SECRET_KEY`, and
`STRIPE_WEBHOOK_SECRET`.

## Security Notes

- Passwords and refresh tokens are stored as hashes.
- Refresh tokens are sent through HTTP-only cookies.
- Access tokens are kept in frontend runtime state, not persistent browser
  storage.
- HTTP and socket payloads are validated on the server.
- Seller self-bidding is rejected by the server.
- Client time, bid amounts, winner identity, and payment state are never trusted.
- Payment provider callbacks are verified on the server using provider secrets.
- Secrets must remain in API environment variables.

## Project Docs

- `docs/ARCHITECTURE.md` - architecture rules and runtime invariants.
- `docs/DEPLOYMENT.md` - deployment notes.
- `docs/DEVELOPMENT.md` - development guidance.
- `docs/SECURITY.md` - security policy and audit notes.
- `contracts/README.md` - REST and realtime contract summary.
- `tests/README.md` - testing strategy.
