import "dotenv/config";
import dns from "node:dns";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { createDbPool, initDb } from "./db.js";
import { LookupService } from "./lookup.js";
import { seedIfEmpty } from "./seed.js";
import { devicesRouter } from "./routes/devices.js";
import { healthRouter } from "./routes/health.js";
import { contactRouter } from "./routes/contact.js";
import { sharesRouter } from "./routes/shares.js";

const PORT = Number(process.env.PORT) || 4000;
const DATABASE_URL = process.env.DATABASE_URL;
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "*";
/** Public API URL for split UI deploys (no trailing slash). Empty = same origin as this server. */
const PUBLIC_API_URL = process.env.PUBLIC_API_URL?.trim().replace(/\/$/, "") ?? "";

const backendDir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(backendDir, "../public");

function hasFrontendBuild(): boolean {
  return fs.existsSync(path.join(publicDir, "index.html"));
}

// Supabase hosts may resolve dual-stack records; prefer IPv4 first to avoid
// ENETUNREACH in environments without outbound IPv6 routing.
dns.setDefaultResultOrder("ipv4first");

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

async function main(): Promise<void> {
  const db = createDbPool(DATABASE_URL!);
  await initDb(db);
  await seedIfEmpty(db);
  const lookup = new LookupService(db);

  const app = express();
  // Required behind Render/nginx so express-rate-limit reads X-Forwarded-For correctly.
  app.set("trust proxy", 1);
  app.use(express.json({ limit: "50kb" }));
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin: CORS_ORIGIN === "*" ? true : CORS_ORIGIN.split(",").map((s) => s.trim()),
    }),
  );

  const api = express.Router();
  api.use("/health", healthRouter());
  api.use("/devices", devicesRouter(lookup));
  api.use("/shares", sharesRouter(db));
  api.use("/contact", contactRouter(db));
  app.use("/api/v1", api);

  app.get("/config.json", (_req, res) => {
    res.json({ apiUrl: PUBLIC_API_URL });
  });

  if (hasFrontendBuild()) {
    app.use(express.static(publicDir, { index: false }));
    app.get("*", (req, res, next) => {
      if (req.method !== "GET" && req.method !== "HEAD") return next();
      if (req.path.startsWith("/api/")) return next();
      res.sendFile(path.join(publicDir, "index.html"));
    });
    console.log(`Serving frontend from ${publicDir}`);
  }

  app.use(
    (
      err: Error & { statusCode?: number },
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      const code = err.statusCode ?? 500;
      if (code === 400) {
        res.status(400).json({
          statusCode: 400,
          message: err.message,
          error: "Bad Request",
        });
        return;
      }
      console.error(err);
      res.status(500).json({ statusCode: 500, message: "Internal Server Error" });
    },
  );

  app.listen(PORT, () => {
    console.log(`AlloCheck listening on http://localhost:${PORT}`);
    if (PUBLIC_API_URL) {
      console.log(`PUBLIC_API_URL for clients: ${PUBLIC_API_URL}`);
    }
  });
}

main().catch((err) => {
  console.error("Failed to start API:", err);
  process.exit(1);
});
