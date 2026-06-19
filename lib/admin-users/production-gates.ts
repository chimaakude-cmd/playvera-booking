import { isEmergencyPinConfigured } from "./emergency-access";

export function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === "production";
}

export function isDevelopmentEnvironment(): boolean {
  return !isProductionEnvironment();
}

/** Explicit override for emergency PIN/login in production (default off). */
export function isEmergencyRecoveryOverrideEnabled(): boolean {
  return process.env.ADMIN_EMERGENCY_RECOVERY_ENABLED === "true";
}

export function isAdminRepairEnabled(): boolean {
  if (isProductionEnvironment()) {
    return process.env.ADMIN_REPAIR_ENABLED === "true";
  }
  return true;
}

export function isAdminTestLoginEnabled(): boolean {
  return !isProductionEnvironment();
}

export function isEmergencyPinUiEnabled(): boolean {
  if (isProductionEnvironment()) {
    return false;
  }
  return (
    process.env.ADMIN_EMERGENCY_PIN_UI_ENABLED === "true" &&
    isEmergencyPinConfigured()
  );
}

export function isEmergencyLoginApiEnabled(): boolean {
  if (isProductionEnvironment()) {
    return isEmergencyRecoveryOverrideEnabled() && isEmergencyPinConfigured();
  }
  return isEmergencyPinConfigured();
}
