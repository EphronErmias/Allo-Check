import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import {
  DISPLAY_EMPTY,
  notesForRegistryStatus,
  notesInvalidSerial,
  notesMissingQuery,
  notesWhenNoRecord,
  statusLabelFor,
} from "./display.js";
import { DeviceStatus, DisplayLevel, statusToDisplayLevel } from "./enums.js";
import type { DeviceLookupResponse, DeviceRow } from "./types.js";
import { normalizeImei, normalizeSerial } from "./validation.js";

export class LookupService {
  constructor(private readonly db: Pool) {}

  private resolveDeviceName(device: DeviceRow): string {
    const explicit = device.device_name?.trim();
    if (explicit) return explicit;
    const parts = [device.manufacturer?.trim(), device.model?.trim()].filter(Boolean);
    return parts.length ? parts.join(" ") : DISPLAY_EMPTY;
  }

  private buildFound(device: DeviceRow): DeviceLookupResponse {
    const status = device.status as DeviceStatus;
    const notes = notesForRegistryStatus(status);
    const displayLevel = statusToDisplayLevel(status);
    return {
      found: true,
      status,
      displayLevel,
      deviceId: device.id,
      deviceName: this.resolveDeviceName(device),
      brand: device.manufacturer?.trim() || DISPLAY_EMPTY,
      imei: device.imei,
      serialNumber: device.serial_number?.trim() || DISPLAY_EMPTY,
      statusLabel: statusLabelFor(status),
      notes,
      message: notes,
      manufacturer: device.manufacturer,
      model: device.model,
    };
  }

  private buildNotFound(ctx: {
    queryImei: string | null;
    querySerial: string | null;
  }): DeviceLookupResponse {
    const notes = notesWhenNoRecord();
    return {
      found: false,
      status: DeviceStatus.UNREGISTERED_UNKNOWN,
      displayLevel: DisplayLevel.WARNING,
      deviceId: null,
      deviceName: DISPLAY_EMPTY,
      brand: DISPLAY_EMPTY,
      imei: ctx.queryImei ?? DISPLAY_EMPTY,
      serialNumber: ctx.querySerial ?? DISPLAY_EMPTY,
      statusLabel: DISPLAY_EMPTY,
      notes,
      message: notes,
    };
  }

  private buildMissingQuery(): DeviceLookupResponse {
    const notes = notesMissingQuery();
    return {
      found: false,
      status: DeviceStatus.UNREGISTERED_UNKNOWN,
      displayLevel: DisplayLevel.WARNING,
      deviceId: null,
      deviceName: DISPLAY_EMPTY,
      brand: DISPLAY_EMPTY,
      imei: DISPLAY_EMPTY,
      serialNumber: DISPLAY_EMPTY,
      statusLabel: DISPLAY_EMPTY,
      notes,
      message: notes,
    };
  }

  private buildInvalidSerial(): DeviceLookupResponse {
    const notes = notesInvalidSerial();
    return {
      found: false,
      status: DeviceStatus.UNREGISTERED_UNKNOWN,
      displayLevel: DisplayLevel.WARNING,
      deviceId: null,
      deviceName: DISPLAY_EMPTY,
      brand: DISPLAY_EMPTY,
      imei: DISPLAY_EMPTY,
      serialNumber: DISPLAY_EMPTY,
      statusLabel: DISPLAY_EMPTY,
      notes,
      message: notes,
    };
  }

  private async recordSearchLog(
    res: DeviceLookupResponse,
    queryImei: string | null,
    querySerial: string | null,
  ): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO device_search_logs (id, query_imei, query_serial, found, result_status, display_level, result_message, device_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          randomUUID(),
          queryImei,
          querySerial,
          res.found,
          res.status ?? DeviceStatus.UNREGISTERED_UNKNOWN,
          res.displayLevel ?? DisplayLevel.WARNING,
          res.notes ?? res.message ?? null,
          res.deviceId ?? null,
        ],
      );
    } catch (e) {
      console.warn("Failed to persist search log:", e);
    }
  }

  async lookupByQuery(query: { imei?: string; serial?: string }): Promise<DeviceLookupResponse> {
    const hasImei = query.imei != null && String(query.imei).trim().length > 0;
    const hasSerial = query.serial != null && String(query.serial).trim().length > 0;

    if (!hasImei && !hasSerial) {
      const res = this.buildMissingQuery();
      await this.recordSearchLog(res, null, null);
      return res;
    }

    if (hasImei) {
      const imei = normalizeImei(query.imei!);
      const row = await this.db.query<DeviceRow>(
        `SELECT id, imei, serial_number, status, manufacturer, model, device_name
         FROM devices WHERE imei = $1`,
        [imei],
      );
      const device = row.rows[0];
      const res = device
        ? this.buildFound(device)
        : this.buildNotFound({ queryImei: imei, querySerial: null });
      await this.recordSearchLog(res, imei, null);
      return res;
    }

    const serial = normalizeSerial(query.serial);
    if (!serial) {
      const res = this.buildInvalidSerial();
      await this.recordSearchLog(res, null, null);
      return res;
    }

    const row = await this.db.query<DeviceRow>(
      `SELECT id, imei, serial_number, status, manufacturer, model, device_name
       FROM devices WHERE serial_number = $1`,
      [serial],
    );
    const device = row.rows[0];
    const res = device
      ? this.buildFound(device)
      : this.buildNotFound({ queryImei: null, querySerial: serial });
    await this.recordSearchLog(res, null, serial);
    return res;
  }
}
