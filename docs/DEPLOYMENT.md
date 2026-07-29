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
