"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Bell, Home, LogOut, Search, Settings } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { supabase, getCurrentSession } from "@/lib/supabase";

const PAGE_TITLES: Record<string, string> = {
  "/workspace": "Home", "/dashboard": "Home", "/customers": "Customers", "/devices": "Devices",
  "/customer-requests": "Requests", "/phone-parts": "Phone Parts",
  "/inventory/accessories": "Accessories", "/inventory/purchases": "Purchases",
  "/inventory/movements": "History", "/inventory/stockroom": "Stockroom",
  "/inventory/verify": "Verify Stock", "/inventory/import": "Import",
  "/inventory/opening-stock-import": "Opening Stock", "/inventory/suppliers": "Payables",
  "/reports/daily-closing": "Closing", "/accounts": "Accounts",
  "/credit": "Shop Debt", "/parts-credit": "Parts Credit",
  "/outstanding": "Owing", "/tickets": "Support", "/assistant": "Assistant",
  "/repairs": "Repairs", "/inventory": "Phone Parts", "/sales": "Sales", "/finance": "Money",
  "/reports": "Report", "/settings": "Settings",
  "/help": "Help", "/technical-services": "Services", "/staff": "Staff",
  "/alerts": "Alerts", "/search": "Search", "/whatsapp": "WhatsApp",
  "/engineer-workflow": "Part Entry", "/technician-ledger": "Repair Parts",
  "/invoices": "Invoices",
  "/activity": "Activity", "/expenses": "Expenses", "/suppliers": "Suppliers",
  "/parts-collection": "Parts Out", "/engineers": "Engineers", "/owed-owing": "Debts",
};
function getPageTitle(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const root = `/${pathname.split("/")[1]}`;
  return PAGE_TITLES[root] || "Amezing Limited";
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [fullName, setFullName] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const isHome = pathname === "/workspace" || pathname === "/dashboard";

  useEffect(() => {
    let active = true;
    void fetchProfile();
    void loadAlerts();
    return () => { active = false; };

    async function fetchProfile() {
      const session = await getCurrentSession();
      if (!session?.user || !active) return;
      const { data } = await supabase.from("profiles").select("full_name, companies(name)").eq("id", session.user.id).maybeSingle();
      if (!active || !data) return;
      const company = Array.isArray(data.companies) ? data.companies[0] : data.companies;
      setFullName(data.full_name);
      setCompanyName(company?.name ?? null);
    }
    async function loadAlerts() {
      const { data } = await supabase.rpc("get_operational_alerts", { p_limit: 100 });
      if (!active) return;
      setUnread(((data ?? []) as Array<{ is_read: boolean }>).filter((a) => !a.is_read).length);
    }
  }, [pathname]);

  async function handleLogout() { await supabase.auth.signOut(); router.replace("/login"); }
  const displayName = fullName || "Staff member";
  const initial = displayName.charAt(0).toUpperCase();
  const iconButtonClass = "inline-flex size-9 items-center justify-center rounded-xl border border-[#dfe6df] bg-white text-[#5b6d68] transition hover:border-[#c8d3ce] hover:bg-[#f5f7f4] hover:text-[#123b34] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d6a54]";

  return (
    <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between gap-3 border-b border-[#dfe6df] bg-[#fbfaf7]/95 px-3 backdrop-blur-xl sm:px-5 md:min-h-[72px] md:px-8" role="banner">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {!isHome && (
          <button type="button" onClick={() => router.push("/workspace")} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-[#dfe6df] bg-white px-2.5 text-xs font-semibold text-[#285c4d] transition hover:bg-[#eef4f1] sm:px-3 sm:text-sm" aria-label="Back to Home">
            <ArrowLeft className="size-4" /><Home className="hidden size-4 sm:block" /><span>Home</span>
          </button>
        )}
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1d6a54]">Amezing</p>
          <h1 className="truncate font-heading text-lg font-bold tracking-tight text-[#182a28] md:text-xl">{getPageTitle(pathname)}</h1>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <button type="button" onClick={() => router.push("/search")} className={`${iconButtonClass} hidden sm:inline-flex`} aria-label="Search"><Search className="size-4" /></button>
        <button type="button" onClick={() => router.push("/alerts")} className={`${iconButtonClass} relative`} aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}><Bell className="size-4" />{unread > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c84b4b] px-1 text-[9px] font-bold text-white">{unread > 99 ? "99+" : unread}</span>}</button>
        <div className="hidden items-center gap-2 rounded-xl border border-[#dfe6df] bg-white px-2 py-1.5 sm:flex"><div className="flex size-7 items-center justify-center rounded-lg bg-[#123b34] font-heading text-sm font-bold text-[#d7a95a]">{initial}</div><div className="min-w-0 text-left"><p className="max-w-32 truncate text-xs font-bold text-[#182a28]">{displayName}</p><p className="max-w-32 truncate text-[10px] text-[#74837e]">{companyName || "Account"}</p></div></div>
        <button type="button" onClick={() => router.push("/settings")} className={`${iconButtonClass} hidden sm:inline-flex`} aria-label="Settings"><Settings className="size-4" /></button>
        <button type="button" onClick={handleLogout} className={`${iconButtonClass} hidden sm:inline-flex`} aria-label="Log out"><LogOut className="size-4" /></button>
      </div>
    </header>
  );
}
