import { DeviceStatus } from "./enums.js";

export const DISPLAY_EMPTY = "—";

export function statusLabelFor(status: DeviceStatus): string {
  switch (status) {
    case DeviceStatus.CLEAN:
      return "Clean";
    case DeviceStatus.STOLEN_BLACKLISTED:
      return "Stolen / Blacklisted";
    case DeviceStatus.LOCKED_NON_PAYMENT:
      return "Locked (non-payment)";
    case DeviceStatus.UNDER_FINANCING:
      return "Under financing";
    case DeviceStatus.UNREGISTERED_UNKNOWN:
      return "Unknown / Not registered";
    default:
      return DISPLAY_EMPTY;
  }
}

export function notesForRegistryStatus(status: DeviceStatus): string {
  switch (status) {
    case DeviceStatus.CLEAN:
      return "No adverse records are linked to this IMEI or serial in the AlloCheck registry. This does not replace carrier, financing, or insurer checks.";
    case DeviceStatus.STOLEN_BLACKLISTED:
      return "This device is reported stolen or appears on a blocklist. Do not buy or activate until cleared with authorities and the registering partner.";
    case DeviceStatus.LOCKED_NON_PAYMENT:
      return "This device may be network- or finance-locked for non-payment or contract breach. Contact the brand, carrier, or lessor before purchase.";
    case DeviceStatus.UNDER_FINANCING:
      return "This device is associated with active financing or leasing. Outstanding obligations may block activation or resale until settled.";
    case DeviceStatus.UNREGISTERED_UNKNOWN:
      return "This record is registered with limited or unverified detail. Confirm identity and title with the seller, carrier, and any finance provider.";
    default:
      return "See AlloCheck policy for interpretation of this status.";
  }
}

export function notesWhenNoRecord(): string {
  return "No device record exists for this search. Manufacturers, carriers, or insurers may still hold data—verify before purchase.";
}

export function notesMissingQuery(): string {
  return "Enter a valid 15-digit IMEI or a device serial number to run a check.";
}

export function notesInvalidSerial(): string {
  return "Serial number could not be read. Use only supported characters and length.";
}
