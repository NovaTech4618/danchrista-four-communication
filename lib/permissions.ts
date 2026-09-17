import type { StaffRole } from "@/types/staff";

export type Permission =
  | "dashboard" | "repairs" | "sales" | "mobile_sales" | "invoices" | "expenses"
  | "inventory" | "customers" | "suppliers" | "engineers" | "engineer_work" | "payments" | "outstanding"
  | "profit" | "daily_closing" | "whatsapp" | "assistant" | "staff" | "search" | "settings" | "help";

const ROLE_PERMISSIONS: Record<StaffRole, readonly Permission[]> = {
  owner: ["dashboard","repairs","sales","mobile_sales","invoices","expenses","inventory","customers","suppliers","engineers","engineer_work","payments","outstanding","profit","daily_closing","whatsapp","assistant","staff","search","settings","help"],
  branch_manager: ["dashboard","repairs","sales","mobile_sales","invoices","expenses","inventory","customers","suppliers","engineers","engineer_work","payments","outstanding","profit","daily_closing","whatsapp","assistant","staff","search","help"],
  front_desk: ["dashboard","repairs","sales","mobile_sales","invoices","customers","engineer_work","outstanding","whatsapp","search","help"],
  technician: ["dashboard","repairs","customers","help"],
};

export function hasPermission(role: StaffRole | null | undefined, permission: Permission) {
  return !!role && ROLE_PERMISSIONS[role].includes(permission);
}

export function permissionsFor(role: StaffRole | null | undefined) {
  return role ? ROLE_PERMISSIONS[role] : [];
}

export function permissionForPath(pathname: string): Permission | null {
  const rules: Array<[string, Permission]> = [
    ["/dashboard", "dashboard"], ["/repairs", "repairs"], ["/technical-services", "repairs"],
    ["/tickets", "repairs"], ["/devices", "repairs"], ["/customer-requests", "customers"],
    ["/sales/mobile", "mobile_sales"], ["/sales", "sales"], ["/invoices", "invoices"],
    ["/expenses", "expenses"], ["/inventory", "inventory"], ["/customers", "customers"],
    ["/suppliers", "suppliers"], ["/engineer-workflow", "engineer_work"], ["/engineers", "engineers"],
    ["/technician-ledger", "engineers"], ["/finance", "payments"], ["/parts-credit", "payments"],
    ["/outstanding", "outstanding"], ["/reports/daily-closing", "daily_closing"], ["/reports", "profit"],
    ["/audit", "staff"], ["/activity", "staff"], ["/alerts", "profit"], ["/whatsapp", "whatsapp"],
    ["/assistant", "assistant"], ["/staff", "staff"], ["/search", "search"], ["/settings", "settings"],
    ["/help", "help"],
  ];
  const match = rules.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  return match?.[1] ?? null;
}

export const DEFAULT_ROLE_PATH: Record<StaffRole, string> = {
  owner: "/dashboard", branch_manager: "/dashboard", front_desk: "/engineer-workflow", technician: "/repairs",
};
