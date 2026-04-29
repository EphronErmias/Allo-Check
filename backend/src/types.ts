import type { DeviceStatus, DisplayLevel } from "./enums.js";

export type DeviceLookupResponse = {
  found: boolean;
  status?: DeviceStatus;
  displayLevel?: DisplayLevel;
  deviceId?: string | null;
  deviceName?: string;
  brand?: string;
  imei?: string;
  serialNumber?: string;
  statusLabel?: string;
  notes?: string;
  message?: string;
  manufacturer?: string | null;
  model?: string | null;
};

export type DeviceRow = {
  id: string;
  imei: string;
  serial_number: string | null;
  status: DeviceStatus;
  manufacturer: string | null;
  model: string | null;
  device_name: string | null;
};
