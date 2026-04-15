# Safar

## Run the web application

From the repository root:

```bash
npm run install:all
cp monument-app/server/.env.example monument-app/server/.env
cp monument-app/client/.env.example monument-app/client/.env
```

Edit `monument-app/server/.env` and `monument-app/client/.env` (at minimum `MONGODB_URI`, `JWT_SECRET`, and `VITE_MAPBOX_ACCESS_TOKEN`). Start MongoDB, then:

```bash
cd monument-app/server && npm run seed && cd ../..
npm run build:client
npm run dev
```

Open **http://localhost:5001/**

---

Optional: React hot-reload on **http://localhost:5173/** (keep `npm run dev` running in another terminal):

```bash
npm run dev:client
```
