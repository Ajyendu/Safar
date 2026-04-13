import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import { connectDb } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import monumentRoutes from "./routes/monumentRoutes.js";
import qrRoutes from "./routes/qrRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();
const port = Number(process.env.PORT) || 5001;
const corsOrigin = process.env.CORS_ORIGIN || "*";

app.use(
  cors({
    origin: corsOrigin === "*" ? true : corsOrigin.split(",").map((s) => s.trim()),
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "monument-app-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/monuments", monumentRoutes);
app.use("/api/qr", qrRoutes);
app.use("/api/admin", adminRoutes);

/** Repo root (Safar/) — same process serves API + static landing (“combined”). */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const safarRepoRoot = path.resolve(__dirname, "../../..");
const safarIndex = path.join(safarRepoRoot, "index.html");
if (fs.existsSync(safarIndex)) {
  app.use(express.static(safarRepoRoot, { fallthrough: true }));
  console.log(`[server] Combined static site → http://localhost:${port}/ (from ${safarRepoRoot})`);
}

app.use((req, res, _next) => {
  if (req.path.startsWith("/api")) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(404).send("Not found");
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

async function main() {
  await connectDb();
  app.listen(port, () => {
    console.log(`[server] Listening on http://localhost:${port}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
