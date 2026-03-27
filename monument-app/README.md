# Monument Navigator Platform

Full-stack demo: **geofence → Monument Mode → internal Mapbox map**, **A\*** routing on a graph, **QR verification**, **MongoDB** content, **JWT** auth, and a minimal **admin** list.

## Folder structure

```
monument-app/
├── README.md
├── server/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── index.js                 # Express entry
│       ├── config/db.js
│       ├── models/                  # User, Monument
│       ├── middleware/auth.js
│       ├── routes/                  # auth, monuments, qr, admin
│       ├── controllers/
│       ├── utils/pathfinding.js     # Haversine + A*
│       └── seed/
│           ├── indiaGateData.js     # Sample India Gate graph + QR nodes
│           └── runSeed.js
└── client/
    ├── package.json
    ├── vite.config.js               # Proxies /api → localhost:5001
    ├── tailwind.config.js
    ├── .env.example
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api/client.js
        ├── context/AuthContext.jsx
        ├── lib/geo.js               # Geofence, nearest node, bearing
        ├── hooks/useGeolocation.js
        ├── components/              # Map UI, QR, prompts
        └── pages/                   # Home, Login, Profile, Admin
```

## Prerequisites

- Node.js 18+
- MongoDB running locally (or connection string)
- [Mapbox](https://mapbox.com/) access token (for maps)

### Port 5000 already in use (macOS)

**AirPlay Receiver** (Control Center) often binds to port **5000**, which causes `EADDRINUSE`. This project defaults to **5001** for the API. Set `PORT=5001` in `server/.env` and keep the Vite proxy pointed at the same port (see `client/vite.config.js`). Alternatively, disable AirPlay Receiver under **System Settings → General → AirDrop & Handoff**.

## Backend setup

```bash
cd server
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET
npm install
npm run seed    # Upserts India Gate sample data
npm run dev     # http://localhost:5001 (see PORT in server/.env)
```

### API overview

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | `{ email, password, displayName? }` |
| POST | `/api/auth/login` | `{ email, password }` |
| GET | `/api/auth/me` | Bearer JWT |
| GET | `/api/monuments` | Published monuments |
| GET | `/api/monuments/:slug` | Full monument (graph, pathways, QR) |
| GET | `/api/monuments/:slug/navigation?from=&to=` | A* route (node ids) |
| POST | `/api/qr/verify` | `{ qrId, monumentSlug? }` — optional auth |
| POST | `/api/qr/visit` | `{ slug }` — optional auth |
| GET | `/api/admin/monuments` | **JWT required** (add admin role checks in production) |
| POST/PATCH/DELETE | `/api/admin/monuments` | CRUD |

## Frontend setup

```bash
cd client
cp .env.example .env
# Set VITE_MAPBOX_ACCESS_TOKEN
npm install
npm run dev     # http://localhost:5173
```

Imports use `react-map-gl` (Mapbox GL peer). Ensure `mapbox-gl` is installed (already in `client/package.json`).

Open `/` — when GPS is inside the India Gate geofence (~160 m demo radius), you get **Monument Mode** (popup + button). Internal map shows pathways, nodes, live position, route line, and direction arrow.

**Testing without visiting India Gate:** increase `geofence.radiusMeters` in `server/src/seed/indiaGateData.js`, re-run `npm run seed`, or use browser / OS location spoofing.

## India Gate sample QR IDs

Encode these strings in physical QR codes (or type them in a test harness):

- `ig-qr-entry-gate-001` — Entry Gate  
- `ig-qr-main-arch-001` — Main Arch  
- `ig-qr-amar-jawan-001` — Amar Jawan Jyoti  
- `ig-qr-central-lawn-001` — Central Lawn  
- `ig-qr-pathway-001` — Surrounding Pathway  

## Security notes

- Move **JWT** and **MongoDB** secrets to environment variables in production.
- Restrict **Mapbox** tokens by URL.
- Add **admin roles** on `User` and enforce in `adminRoutes` before go-live.

## Bonus features included

- **Voice guide:** “Voice guide (browser TTS)” on QR content sheet when no `audioUrl` is set.
- **AR / advanced AR:** not implemented; Mapbox + compass arrow provides a lightweight “live direction” hint.
