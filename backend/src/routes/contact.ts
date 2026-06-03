import { randomUUID } from "node:crypto";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import type { Pool } from "pg";

const contactLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const INQUIRY_TYPES = new Set([
  "individual",
  "business_owner",
  "retail_partner",
  "enterprise",
  "other",
]);

export type ContactSubmissionBody = {
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  phone: string;
  inquiryType: string;
  message: string;
  marketingOptIn?: boolean;
};

function trimField(value: unknown, maxLen: number): string {
  const s = String(value ?? "").trim();
  if (s.length > maxLen) {
    const err = new Error(`${maxLen} character limit exceeded`) as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }
  return s;
}

function validateBody(body: unknown): ContactSubmissionBody {
  if (!body || typeof body !== "object") {
    const err = new Error("Invalid request body") as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }
  const b = body as Record<string, unknown>;
  const firstName = trimField(b.firstName, 80);
  const lastName = trimField(b.lastName, 80);
  const companyName = trimField(b.companyName, 160);
  const email = trimField(b.email, 254);
  const phone = trimField(b.phone, 32);
  const inquiryType = trimField(b.inquiryType, 32);
  const message = trimField(b.message, 4000);

  if (!firstName || !lastName) {
    const err = new Error("First and last name are required") as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const err = new Error("A valid email address is required") as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }
  if (!phone) {
    const err = new Error("Phone number is required") as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }
  if (!INQUIRY_TYPES.has(inquiryType)) {
    const err = new Error("Please select how you are getting in touch") as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }
  if (!message) {
    const err = new Error("Message is required") as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }

  return {
    firstName,
    lastName,
    companyName,
    email,
    phone,
    inquiryType,
    message,
    marketingOptIn: Boolean(b.marketingOptIn),
  };
}

export function contactRouter(pool: Pool): Router {
  const r = Router();

  r.post("/", contactLimiter, async (req, res, next) => {
    try {
      const data = validateBody(req.body);
      await pool.query(
        `INSERT INTO contact_submissions (
          id, first_name, last_name, company_name, email, phone, inquiry_type, message, marketing_opt_in
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          randomUUID(),
          data.firstName,
          data.lastName,
          data.companyName || null,
          data.email,
          data.phone,
          data.inquiryType,
          data.message,
          data.marketingOptIn ?? false,
        ],
      );
      res.status(201).json({ ok: true, message: "Thank you. We will be in touch soon." });
    } catch (e) {
      next(e);
    }
  });

  return r;
}
