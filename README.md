# Safar

Safar combines a static marketing/landing site, a **monument navigation** web app (Mapbox, geofences, QR checkpoints, internal routing), and an **Express + MongoDB** API.

## Prerequisites

- **Node.js** 18+ (with npm)
- **MongoDB** running locally or a connection string to a hosted cluster

## Install dependencies

From the repository root:

```bash
npm run install:all
```

This installs packages for `monument-app/server` and `monument-app/client`.

## Configuration

### API / server (`monument-app/server`)

1. Copy the example env file:

   ```bash
   cp monument-app/server/.env.example monument-app/server/.env
   ```

2. Edit `monument-app/server/.env`. Important variables:

   | Variable | Purpose |
   |----------|---------|
   | `PORT` | HTTP port (default **5001** — avoids macOS AirPlay on 5000) |
   | `MONGODB_URI` | MongoDB connection string |
   | `JWT_SECRET` | Secret for signing user and admin JWTs |
   | `JWT_EXPIRES_IN` | User session lifetime (e.g. `7d`) |
   | `CORS_ORIGIN` | Allowed browser origin(s) for the API |
   | `ADMIN_ID` / `ADMIN_PASSWORD` | Admin dashboard login (**required in production**; in dev, defaults to `admin` / `admin` if unset) |
   | `GOOGLE_CLIENT_ID` | Optional; must match the client if you use Google sign-in |

### Client (`monument-app/client`)

1. Copy the example env file:

   ```bash
   cp monument-app/client/.env.example monument-app/client/.env
   ```

2. Set **Mapbox** (required for maps):

   - `VITE_MAPBOX_ACCESS_TOKEN` — public token from [Mapbox](https://account.mapbox.com/)

3. Optional:

   - `VITE_GOOGLE_CLIENT_ID` — Google Identity Services (login)
   - `VITE_API_BASE_URL` — e.g. `http://127.0.0.1:5001` when the built UI is opened from a static host instead of Vite (the combined server already serves API + site on one origin)

## Seed the database

Load the default **India Gate** monument document (graph, pathways, QR checkpoints):

```bash
cd monument-app/server && npm run seed
```

Requires `MONGODB_URI` in `monument-app/server/.env`.

## Run the app

### Recommended: API + static site together (port 5001)

From the **repository root**:

```bash
npm run dev
```

This starts the Express server, which:

- Serves the API under `/api/...`
- Serves the repo root static files (`index.html`, `/assets`, etc.)
- Loads the React bundle from `monument-app/client/dist/` when you use in-app routes

**Open in the browser:** [http://localhost:5001/](http://localhost:5001/)

The monument client uses **hash routing** (e.g. `#/login`, `#/profile`).

### Optional: Vite dev server for the React client (port 5173)

Use this when you want fast HMR while editing React; keep the API running on 5001.

Terminal 1 (API + static, from repo root):

```bash
npm run dev
```

Terminal 2 (Vite, from repo root):

```bash
npm run dev:client
```

**Open:** [http://localhost:5173/](http://localhost:5173/) — Vite proxies `/api` to `http://127.0.0.1:5001` by default.

### Run only the API (no static site)

```bash
cd monument-app/server && npm run dev
```

Useful for debugging; you lose the combined landing + `dist` loading unless you configure another static host.

## Build the React client for production / combined mode

The combined server expects a built bundle under `monument-app/client/dist/`:

```bash
npm run build:client
```

Then start (or restart) `npm run dev` from the repo root and use [http://localhost:5001/](http://localhost:5001/).

## Admin dashboard

A **separate** static admin UI (not the main React app) lives in `admin-dashboard/`.

- **URL (combined server):** [http://localhost:5001/admin-dashboard/](http://localhost:5001/admin-dashboard/)
- **Login:** `POST /api/admin/auth/login` with JSON `{ "adminId", "adminPassword" }`
- **Development defaults** (when `NODE_ENV` is not `production` and env vars are unset): **admin** / **admin**
- **Production:** set `ADMIN_ID` and `ADMIN_PASSWORD` in `monument-app/server/.env`

## API overview (short)

| Area | Base path |
|------|-----------|
| Health | `GET /api/health` |
| Auth | `/api/auth/...` (login, OTP, Google; public registration is disabled) |
| Monuments | `/api/monuments/...` (public monument payload, navigation) |
| QR | `/api/qr/...` |
| Admin (JWT from admin login) | `/api/admin/...` |

## Project layout

```
Safar/
├── index.html              # Landing / shell
├── assets/                 # Static assets for the main site
├── admin-dashboard/        # Standalone admin UI (HTML/CSS/JS)
├── monument-app/
│   ├── server/             # Express API (see package.json scripts)
│   └── client/             # Vite + React monument app
└── package.json            # Root scripts: dev, build:client, install:all
```

## Troubleshooting

- **Connection refused on port 5173** — Vite is not running; use **5001** with `npm run dev` from the repo root, or run `npm run dev:client` for 5173.
- **Maps blank** — Set `VITE_MAPBOX_ACCESS_TOKEN` in `monument-app/client/.env` and rebuild if you use `dist`.
- **MongoDB errors** — Ensure MongoDB is running and `MONGODB_URI` is correct; run `npm run seed` in `monument-app/server` once.
- **Admin login 503 in production** — Set `ADMIN_ID` and `ADMIN_PASSWORD` in the server `.env`.
