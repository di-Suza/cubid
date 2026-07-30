# Auction Entity

Auction types shared across discovery, room, owner dashboard, bids, payments,
and timelines belong here.

Realtime snapshots use `auctionId`, `version`, and `lastSequence` from the
server-authoritative engine. REST summaries may still use `id`.

REST summaries are public-safe and can include optional live-adjacent fields
such as bid count, highest bidder, winner, version, and timestamps. They are
display data only; live room authority still comes from snapshots.
