# Realtime Boundary

Socket.IO setup lives here.

Auction and bidding events are active through `AuctionRealtimeHandler`.

| Event | Direction | Purpose |
| --- | --- | --- |
| `auction:join` | client -> server | Join `auction:{auctionId}` and receive a full snapshot. |
| `auction:resync` | client -> server | Receive the current authoritative snapshot without changing presence. |
| `auction:leave` | client -> server | Leave the auction room and update presence stats. |
| `bid:place` | client -> server | Submit bid intent `{ auctionId, amountMinor, requestId }`. |
| `auction:snapshot` | server -> client | Full authoritative room state for joins and resync. |
| `auction:state` | server -> room | Authoritative state after accepted bid or lifecycle change. |
| `bid:accepted` | server -> room | Accepted bid after durable persistence. |
| `bid:rejected` | server -> client | Rejected bid intent with stable machine code. |
| `stats:update` | server -> room | Non-blocking room presence/heat update. |
| `auction:started` / `auction:ended` | server -> room | Timer-driven lifecycle snapshots. |

Socket handlers must authenticate users again, persist authoritative state
before emitting, and keep chat/metrics separate from the auction bid queue.
