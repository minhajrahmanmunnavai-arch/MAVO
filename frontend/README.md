# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## Authentication deployment

Authentication uses `HttpOnly` cookies and does not store credentials or tokens in browser storage. In development, Vite proxies `/api` requests to `http://localhost:3000`; set `VITE_API_PROXY_TARGET` if the backend uses another address.

For a separate frontend/API deployment, set `VITE_API_BASE_URL` at frontend build time and set the backend `CORS_ORIGINS` to the exact HTTPS frontend origin (comma-separated for multiple origins). Keep the frontend and API on the same site where possible and use `COOKIE_SAME_SITE=strict`. Production startup requires `HTTPS_ENABLED=true` to confirm TLS terminates at the server or trusted reverse proxy. Set `COOKIE_SAME_SITE=none` only when cross-site cookies are necessary; that requires HTTPS, and production must run with `NODE_ENV=production`. If deployed behind a reverse proxy, set `TRUST_PROXY_HOPS` to the exact number of trusted proxy hops.

The backend validates required secrets and database configuration before listening, uses secure host-only cookies in production, checks mutation origins, adds security headers, and stores authentication rate limits in MongoDB so they are shared across backend replicas. Refresh sessions are stored as hashes in MongoDB and rotate during refresh. Existing users may need to sign in once after deploying this change because older refresh tokens were not stored as revocable sessions.
