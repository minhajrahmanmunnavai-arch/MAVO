# MAVO frontend

This is the React website built with Vite.

## Deploy to Vercel

Create a Vercel project with the `frontend` directory as its Root Directory.
Use `npm run build` as the build command and `dist` as the output directory.
The included `vercel.json` sends nested browser routes to the app entry point,
so refreshing a product, cart, or admin route loads the React application.

The frontend uses `https://mavo-hzbl.onrender.com` as its production API by
default. To override it, set `VITE_API_BASE_URL` in the Vercel project
environment variables to the backend origin (without an `/api` suffix).
`VITE_SITE_URL` may be set to the canonical public website origin; otherwise,
the Vercel production URL is used when generating `robots.txt`.

Only public frontend configuration belongs in `VITE_*` variables: Vite embeds
them in the client bundle. Never add database URLs, JWT secrets, Cloudinary
secrets, SMTP credentials, or other private backend values to the frontend.
Local `.env` files are ignored; use `.env.example` only for placeholders.

## Backend requirements

The backend must allow the deployed website origin in `CORS_ORIGINS` (or
`FRONTEND_URL`) and run with `HTTPS_ENABLED=true` behind HTTPS. Axios and
Socket.IO send credentials to the configured API. Since Vercel and Render
domains are cross-site, cookie authentication may require
`COOKIE_SAME_SITE=none` with `NODE_ENV=production`; browsers that block
third-party cookies can still prevent sign-in. A custom frontend and API
domain under the same registrable domain is preferable when available.

Product, cart, wishlist, order, admin, chat, and notification API calls share
the configured Axios client. Product and review image uploads use multipart
requests through that client; uploaded image URLs are supplied by the backend.
