# Realtime Boundary

Socket.IO setup lives here.

Feature handlers should be registered through this boundary when auction,
bidding, chat, stats, and payment events become active. Socket handlers must
authenticate users again, persist authoritative state before emitting, and keep
chat/metrics separate from the auction bid queue.
