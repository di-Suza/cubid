# Payments Boundary

Gateway adapters live here. The current implementation supports:

- `mock` for local demos and tests
- `razorpay` for real order creation, checkout verification, and webhook
  signature verification
- `stripe` for Checkout Session creation, session verification, and webhook
  signature verification

The web winner flow expects a real provider. `mock` remains available for
backend tests and controlled local checks, but it no longer auto-completes
payments from the UI.

Payment services must derive winner identity and amount from persisted auction
state, never from frontend payloads.
