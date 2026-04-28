export enum DeviceStatus {
  CLEAN = "CLEAN",
  STOLEN_BLACKLISTED = "STOLEN_BLACKLISTED",
  LOCKED_NON_PAYMENT = "LOCKED_NON_PAYMENT",
  UNDER_FINANCING = "UNDER_FINANCING",
  UNREGISTERED_UNKNOWN = "UNREGISTERED_UNKNOWN",
}

export enum DisplayLevel {
  SAFE = "SAFE",
  WARNING = "WARNING",
  BLOCKED = "BLOCKED",
}

export function statusToDisplayLevel(status: DeviceStatus): DisplayLevel {
  switch (status) {
    case DeviceStatus.CLEAN:
      return DisplayLevel.SAFE;
    case DeviceStatus.STOLEN_BLACKLISTED:
    case DeviceStatus.LOCKED_NON_PAYMENT:
      return DisplayLevel.BLOCKED;
    case DeviceStatus.UNDER_FINANCING:
    case DeviceStatus.UNREGISTERED_UNKNOWN:
    default:
      return DisplayLevel.WARNING;
  }
}
