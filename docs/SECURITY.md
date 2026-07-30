# Security Policy

Security rules are part of the architecture, not optional polish.

- Hash passwords and OTPs.
- Store refresh tokens only as hashes.
- Keep refresh tokens in HTTP-only cookies.
- Keep access tokens out of persistent browser storage.
- Current auth implementation returns access tokens to in-memory Redux state
  and stores refresh tokens as HTTP-only cookies with server-side hashes.
- Validate HTTP and socket payloads.
- Authenticate every protected HTTP route and socket handler.
- Enforce seller self-bid prevention on the server.
- Never trust client time, bid amount calculations, winner IDs, payment state,
  or permission flags.
- Use Helmet, CORS restrictions, cookie parsing, rate limits, and centralized
  error handling.
- Redact secrets, cookies, tokens, passwords, and OTPs from logs.
- Verify payment gateway callbacks on the server.

## Current Audit Note

`npm --prefix web audit` currently reports a high-severity advisory for
`react-router` through `react-router-dom`. The package has been updated to the
latest registry version available in this environment (`7.18.2`), but npm audit
still reports the advisory range as unresolved and no newer fixed version is
available from the registry here. Re-run audit after a patched router release is
published.
