"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, Search, Settings } from "lucide-react";
import { supabase, getCurrentSession } from "@/lib/supabase";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { NovatechLogo } from "@/components/brand/NovatechLogo";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard", "/customers": "Customers", "/devices": "Devices", "/repairs": "Repairs",
  "/inventory": "Inventory", "/sales": "Sales", "/finance": "Finance", "/reports": "Reports",
  "/settings": "Settings", "/settings/subscription": "Subscription", "/help": "Help & Support",
  "/technical-services": "Technical Services", "/staff": "Staff & Branches", "/alerts": "Alerts",
  "/search": "Global Search", "/whatsapp": "WhatsApp Center", "/engineer-workflow": "Engineer Workflow",
  "/technician-ledger": "Parts Ledger", "/customer-requests": "Customer Requests", "/invoices": "Invoices",
  "/outstanding": "Outstanding", "/activity": "Activity History", "/expenses": "Expenses", "/suppliers": "Suppliers",
};

function getPageTitle(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const root = `/${pathname.split("/")[1]}`;
  return PAGE_TITLES[root] || "NOVATECH";
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [fullName, setFullName] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);

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

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const displayName = fullName || "Staff member";
  const initial = displayName.charAt(0).toUpperCase();
  const iconButtonClass = "inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--novatech-primary)]";

  return (
    <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between gap-2 border-b border-slate-200 bg-white/95 px-3 shadow-[0_1px_10px_rgba(18,59,52,0.04)] backdrop-blur sm:px-4 md:min-h-[72px] md:px-8" role="banner">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <SidebarTrigger className="size-9 shrink-0 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden" aria-label="Open navigation" />
        <Separator orientation="vertical" className="h-6 shrink-0 md:hidden" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate font-heading text-lg font-bold tracking-tight text-slate-950 md:text-xl">{getPageTitle(pathname)}</h1>
          </div>
          <p className="hidden max-w-[45vw] truncate text-xs text-slate-500 sm:block">{companyName || "Danchrista Four Communication"}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <button type="button" onClick={() => router.push("/search")} className={`${iconButtonClass} hidden sm:inline-flex`} aria-label="Search"><Search className="size-4" aria-hidden="true" /></button>
        <button type="button" onClick={() => router.push("/alerts")} className={`${iconButtonClass} relative`} aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}>
          <Bell className="size-4" aria-hidden="true" />
          {unread > 0 && <span className="absolute -right-1 -top-1 flex min-w-4 h-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white" aria-hidden="true">{unread > 99 ? "99+" : unread}</span>}
        </button>
        <div className="flex size-9 items-center justify-center rounded-lg bg-[#123b34] font-heading font-semibold text-white sm:size-auto sm:gap-2 sm:px-2 sm:py-2" aria-label={`Signed in as ${displayName}`}>
          <div className="flex size-7 items-center justify-center rounded-md bg-[#d7a95a] font-heading text-sm font-bold text-[#123b34]">{initial}</div>
          <div className="hidden min-w-0 text-left sm:block"><p className="max-w-36 truncate text-sm font-semibold text-white">{displayName}</p><p className="max-w-36 truncate text-xs text-[#c7d8d2]">{companyName || "Account"}</p></div>
        </div>
        <button type="button" onClick={() => router.push("/settings")} className={`${iconButtonClass} hidden sm:inline-flex`} aria-label="Settings"><Settings className="size-4" aria-hidden="true" /></button>
        <button type="button" onClick={handleLogout} className={`${iconButtonClass} hidden sm:inline-flex`} aria-label="Log out"><LogOut className="size-4" aria-hidden="true" /></button>
      </div>
    </header>
  );
}
