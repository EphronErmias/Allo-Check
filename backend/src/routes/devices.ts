import { Router } from "express";
import rateLimit from "express-rate-limit";
import type { LookupService } from "../lookup.js";

const lookupLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

export function devicesRouter(lookup: LookupService): Router {
  const r = Router();

  r.get(
    "/lookup",
    lookupLimiter,
    async (req, res, next) => {
      try {
        const imei = req.query.imei as string | undefined;
        const serial = req.query.serial as string | undefined;
        const out = await lookup.lookupByQuery({ imei, serial });
        res.json(out);
      } catch (e) {
        next(e);
      }
    },
  );

  return r;
}
