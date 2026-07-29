# Bid Entity

Bid request and accepted-bid types belong here. Validation remains server-owned.

Bid intent is `{ auctionId, amountMinor, requestId }`; the server derives the
bidder from the authenticated socket session and returns `PlaceBidResult`.
