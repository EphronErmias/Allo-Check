import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
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

export function seedIfEmpty(db: DatabaseSync): void {
  const row = db.prepare("SELECT COUNT(*) as c FROM devices").get() as { c: number | bigint };
  const n = typeof row.c === "bigint" ? Number(row.c) : row.c;
  if (n > 0) return;

  const insert = db.prepare(
    `INSERT INTO devices (id, imei, serial_number, status, manufacturer, model, device_name, registered_by_partner_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`,
  );

  db.exec("BEGIN IMMEDIATE;");
  try {
    for (const d of DEMO) {
      insert.run(
        randomUUID(),
        d.imei,
        d.serialNumber,
        d.status,
        d.manufacturer,
        d.model,
        d.deviceName,
      );
    }
    db.exec("COMMIT;");
  } catch (e) {
    db.exec("ROLLBACK;");
    throw e;
  }

  console.log(
    `Seeded ${DEMO.length} demo devices (e.g. IMEI 356897123456789 or serial R58N123456L)`,
  );
}
