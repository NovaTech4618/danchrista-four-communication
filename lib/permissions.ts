import type { StaffRole } from "@/types/staff";

export type Permission =
  | "dashboard"
  | "repairs"
  | "sales"
  | "mobile_sales"
  | "invoices"
  | "expenses"
  | "inventory"
  | "customers"
  | "suppliers"
  | "engineers"
  | "payments"
  | "outstanding"
  | "profit"
  | "daily_closing"
  | "whatsapp"
  | "assistant"
  | "staff"
  | "search"
  | "settings";

const ROLE_PERMISSIONS: Record<StaffRole, readonly Permission[]> = {
  owner: [
    "dashboard", "repairs", "sales", "mobile_sales", "invoices", "expenses",
    "inventory", "customers", "suppliers", "engineers", "payments", "outstanding",
    "profit", "daily_closing", "whatsapp", "assistant", "staff", "search", "settings",
  ],
  branch_manager: [
    "dashboard", "repairs", "sales", "mobile_sales", "invoices", "expenses",
    "inventory", "customers", "suppliers", "engineers", "payments", "outstanding",
    "profit", "daily_closing", "whatsapp", "assistant", "staff", "search",
  ],
  front_desk: [
    "dashboard", "repairs", "sales", "mobile_sales", "invoices", "customers",
    "payments", "outstanding", "whatsapp", "search",
  ],
  technician: ["dashboard", "repairs", "customers"],
};

export function hasPermission(role: StaffRole | null | undefined, permission: Permission) {
  return !!role && ROLE_PERMISSIONS[role].includes(permission);
}

export function permissionsFor(role: StaffRole | null | undefined) {
  return role ? ROLE_PERMISSIONS[role] : [];
}

export function permissionForPath(pathname: string): Permission | null {
  const rules: Array<[string, Permission]> = [
    ["/dashboard", "dashboard"],
    ["/repairs", "repairs"],
    ["/sales/mobile", "mobile_sales"],
    ["/sales", "sales"],
    ["/invoices", "invoices"],
    ["/expenses", "expenses"],
    ["/inventory", "inventory"],
    ["/customers", "customers"],
    ["/suppliers", "suppliers"],
    ["/engineers", "engineers"],
    ["/finance", "payments"],
    ["/outstanding", "outstanding"],
    ["/reports/daily-closing", "daily_closing"],
    ["/reports", "profit"],
    ["/whatsapp", "whatsapp"],
    ["/assistant", "assistant"],
    ["/staff", "staff"],
    ["/search", "search"],
    ["/settings", "settings"],
  ];

  const match = rules.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  return match?.[1] ?? null;
}

export const DEFAULT_ROLE_PATH: Record<StaffRole, string> = {
  owner: "/dashboard",
  branch_manager: "/dashboard",
  front_desk: "/repairs",
  technician: "/repairs",
};
