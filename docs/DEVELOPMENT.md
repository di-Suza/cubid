# Development Guide

## First Principle

Do not add feature behavior outside the owning module. If a file is missing,
add it inside the existing architecture instead of creating a shortcut.

## Backend Checklist

1. Add or update the route class.
2. Add validators before controller execution.
3. Keep controller methods thin.
4. Put business rules in the service class.
5. Put Mongoose queries in the repository class.
6. Add or update model indexes beside the schema.
7. Reuse shared errors, constants, middleware, and validators.
8. For auction mutations, use `AuctionEngineService` so bid ordering,
   persistence-before-broadcast, and finalization stay server-owned.

## Frontend Checklist

1. Add route wrappers under `pages`.
2. Keep workflow orchestration in feature hooks.
3. Add RTK Query endpoints under the owning feature.
4. Put durable shared types in `entities` when more than one feature needs
   them.
5. Reuse shared UI and utilities before creating local copies.
6. For live auction state, consume `useAuctionRoom` and `useBidIntent` instead
   of opening ad hoc Socket.IO connections.
7. For room chat, use `useAuctionChat` and `AuctionChatPanel`; chat must stay
   non-blocking relative to bid processing.

## Domain Ownership

Domain B owns realtime sync and the server-authoritative auction engine. Domain
A marketplace/auth/listing modules should not be changed for Domain B work
unless a shared contract update is required.

Current Domain A REST/UI ownership:

- Auth/session flows live in `api/src/modules/auth`, `api/src/modules/users`,
  and `web/src/features/auth`.
- Marketplace listing and creation flows live in `api/src/modules/auctions`
  and `web/src/features/auctions`.
- Winner payment UX lives in `api/src/modules/payments` and
  `web/src/features/payments`.
- App shell, route guards, dashboard, profile, and landing pages live in the
  existing frontend layers.

When adding Domain A behavior, keep REST endpoints as DTOs and keep live bid
submission on Socket.IO through `useBidIntent`.

## Commit Style

Use concise conventional commits:

```txt
chore: initialize workspace docs
feat(api): add health and middleware baseline
feat(web): scaffold app shell
test(api): cover bid validation rules
docs: update architecture decisions
```
