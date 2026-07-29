# Security Policy

Security rules are part of the architecture, not optional polish.

- Hash passwords and OTPs.
- Store refresh tokens only as hashes.
- Keep refresh tokens in HTTP-only cookies.
- Keep access tokens out of persistent browser storage.
- Validate HTTP and socket payloads.
- Authenticate every protected HTTP route and socket handler.
- Enforce seller self-bid prevention on the server.
- Never trust client time, bid amount calculations, winner IDs, payment state,
  or permission flags.
- Use Helmet, CORS restrictions, cookie parsing, rate limits, and centralized
  error handling.
- Redact secrets, cookies, tokens, passwords, and OTPs from logs.
- Verify payment gateway callbacks on the server.
