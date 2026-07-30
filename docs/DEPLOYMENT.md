# Deployment Guide

## API

The API package is designed for Render, a VPS, or any Node-capable container
host.

Required environment values:

- `NODE_ENV`
- `PORT`
- `MONGODB_URI`
- `CORS_ORIGIN`
- `SOCKET_CORS_ORIGIN`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `COOKIE_SECRET`
- `WEB_APP_URL`
- `PAYMENT_GATEWAY`

Provider-specific payment values:

- Razorpay: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and
  `RAZORPAY_WEBHOOK_SECRET`.
- Stripe: `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.

Keep `PAYMENT_GATEWAY=mock` only for local demos or non-production test
deployments.

## Web

The web package is designed for Vercel or any static host.

Required environment values:

- `VITE_API_BASE_URL`
- `VITE_SOCKET_URL`

## Local Docker

```bash
docker compose up --build
```

The local stack starts MongoDB, Redis, the API, and the Vite web app.
