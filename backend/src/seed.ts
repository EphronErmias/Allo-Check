import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { DeviceStatus } from "./enums.js";

const DEMO: Array<{
  imei: string;
  serialNumber: string | null;
  status: DeviceStatus;
  manufacturer: string | null;
  model: string | null;
  deviceName: string | null;
}> = [
  {
    imei: "356897123456789",
    serialNumber: "R58N123456L",
    status: DeviceStatus.CLEAN,
    manufacturer: "Samsung",
    model: "Galaxy S23",
    deviceName: "Samsung Galaxy S23",
  },
  {
    imei: "234567890123456",
    serialNumber: "ALLO-DEMO-STOLEN",
    status: DeviceStatus.STOLEN_BLACKLISTED,
    manufacturer: "Demo",
    model: "Handset X",
    deviceName: "Demo Handset X",
  },
  {
    imei: "345678901234567",
    serialNumber: "ALLO-DEMO-LOCKED",
    status: DeviceStatus.LOCKED_NON_PAYMENT,
    manufacturer: "Demo",
    model: "Handset Y",
    deviceName: "Demo Handset Y",
  },
  {
    imei: "456789012345678",
    serialNumber: "ALLO-DEMO-FINANCE",
    status: DeviceStatus.UNDER_FINANCING,
    manufacturer: "Demo",
    model: "Handset Z",
    deviceName: "Demo Handset Z",
  },
  {
    imei: "567890123456789",
    serialNumber: "ALLO-DEMO-UNKNOWN",
    status: DeviceStatus.UNREGISTERED_UNKNOWN,
    manufacturer: "Demo",
    model: "Handset W",
    deviceName: "Demo Handset W",
  },
];

export async function seedIfEmpty(db: Pool): Promise<void> {
  const row = await db.query<{ c: string }>("SELECT COUNT(*)::text as c FROM devices");
  const n = Number(row.rows[0]?.c ?? "0");
  if (n > 0) return;
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    for (const d of DEMO) {
      await client.query(
        `INSERT INTO devices (id, imei, serial_number, status, manufacturer, model, device_name, registered_by_partner_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NULL)`,
        [randomUUID(), d.imei, d.serialNumber, d.status, d.manufacturer, d.model, d.deviceName],
      );
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }

  console.log(
    `Seeded ${DEMO.length} demo devices (e.g. IMEI 356897123456789 or serial R58N123456L)`,
  );
}
