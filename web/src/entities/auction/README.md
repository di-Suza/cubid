# Auction Entity

Auction types shared across discovery, room, owner dashboard, bids, payments,
and timelines belong here.

Realtime snapshots use `auctionId`, `version`, and `lastSequence` from the
server-authoritative engine. REST summaries may still use `id`.
