const IMEI_LEN = 15;

export function normalizeImei(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== IMEI_LEN) {
    const err = new Error("IMEI must contain exactly 15 digits") as Error & {
      statusCode: number;
    };
    err.statusCode = 400;
    throw err;
  }
  return digits;
}

export function normalizeSerial(raw: string | undefined): string | null {
  if (raw == null || !String(raw).trim()) return null;
  const s = String(raw).trim();
  if (s.length > 64) {
    const err = new Error("Serial number is too long (max 64 characters)") as Error & {
      statusCode: number;
    };
    err.statusCode = 400;
    throw err;
  }
  return s;
}
