import { randomBytes } from "node:crypto";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import type { Pool } from "pg";

const shareCreateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

function shareTtlMs(): number {
  const days = Number(process.env.SHARE_TTL_DAYS);
  const d = Number.isFinite(days) && days > 0 ? days : 30;
  return d * 86_400_000;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Minimal validation: must look like a lookup API payload. */
function validateLookupSnapshot(body: unknown): body is Record<string, unknown> {
  if (!isRecord(body)) return false;
  if (typeof body.found !== "boolean") return false;
  return true;
}

export function sharesRouter(pool: Pool): Router {
  const r = Router();

  r.post(
    "/",
    shareCreateLimiter,
    async (req, res, next) => {
      try {
        const payload = req.body?.payload;
        if (!validateLookupSnapshot(payload)) {
          res.status(400).json({ statusCode: 400, message: "Invalid payload", error: "Bad Request" });
          return;
        }
        const id = randomBytes(24).toString("hex");
        const expiresAt = new Date(Date.now() + shareTtlMs());
        await pool.query(
          `INSERT INTO lookup_result_shares (id, payload, expires_at) VALUES ($1, $2::jsonb, $3)`,
          [id, JSON.stringify(payload), expiresAt.toISOString()],
        );
        res.status(201).json({ token: id, expiresAt: expiresAt.toISOString() });
      } catch (e) {
        next(e);
      }
    },
  );

  r.get("/:token", async (req, res, next) => {
    try {
      const token = String(req.params.token ?? "").trim();
      if (!/^[a-f0-9]{48}$/i.test(token)) {
        res.status(404).json({ statusCode: 404, message: "Not found", error: "Not Found" });
        return;
      }
      const { rows } = await pool.query<{
        payload: unknown;
        created_at: string;
        expires_at: string;
      }>(
        `SELECT payload, created_at, expires_at
         FROM lookup_result_shares
         WHERE id = $1`,
        [token],
      );
      const row = rows[0];
      if (!row) {
        res.status(404).json({ statusCode: 404, message: "Not found", error: "Not Found" });
        return;
      }
      if (new Date(row.expires_at).getTime() < Date.now()) {
        await pool.query(`DELETE FROM lookup_result_shares WHERE id = $1`, [token]);
        res.status(404).json({ statusCode: 404, message: "Link expired", error: "Not Found" });
        return;
      }
      res.json({
        payload: row.payload,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
      });
    } catch (e) {
      next(e);
    }
  });

  return r;
}
