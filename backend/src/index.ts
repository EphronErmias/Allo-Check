import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { openDb } from "./db.js";
import { LookupService } from "./lookup.js";
import { seedIfEmpty } from "./seed.js";
import { devicesRouter } from "./routes/devices.js";
import { healthRouter } from "./routes/health.js";

const PORT = Number(process.env.PORT) || 4000;
const SQLITE_PATH = process.env.SQLITE_PATH ?? "./data/allocheck.sqlite";
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "*";

const db = openDb(SQLITE_PATH);
seedIfEmpty(db);
const lookup = new LookupService(db);

const app = express();
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: CORS_ORIGIN === "*" ? true : CORS_ORIGIN.split(",").map((s) => s.trim()),
  }),
);

const api = express.Router();
api.use("/health", healthRouter());
api.use("/devices", devicesRouter(lookup));
app.use("/api/v1", api);

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
  console.log(`AlloCheck API listening on http://localhost:${PORT}`);
});
