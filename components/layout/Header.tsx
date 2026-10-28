"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft, Bell, BookOpen, Boxes, Home, LogOut, Menu, Package,
  Search, Settings, ShoppingCart, Users, Wallet, Wrench, X,
} from "lucide-react";
import { supabase, getCurrentSession } from "@/lib/supabase";
import { hasPermission, type Permission } from "@/lib/permissions";
import { staffService } from "@/services/staffService";
import type { StaffRole } from "@/types/staff";

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
  "/invoices": "Invoices", "/activity": "Activity", "/expenses": "Expenses",
  "/suppliers": "Suppliers", "/parts-collection": "Parts Out", "/engineers": "Engineers",
  "/owed-owing": "Debts",
};

function getPageTitle(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const root = "/" + pathname.split("/")[1];
  return PAGE_TITLES[root] || "Amezing Limited";
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [fullName, setFullName] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const [role, setRole] = useState<StaffRole | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isHome = pathname === "/workspace" || pathname === "/dashboard";

  useEffect(() => {
    let active = true;
    setMobileMenuOpen(false);
    void fetchProfile();
    void loadAlerts();
    void staffService.getMyRole().then(({ data }) => {
      if (active) setRole(data ?? null);
    });
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
    setMobileMenuOpen(false);
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const displayName = fullName || "Staff member";
  const initial = displayName.charAt(0).toUpperCase();
  const iconButtonClass = "inline-flex size-10 sm:size-9 items-center justify-center rounded-xl border border-[#dfe6df] bg-white text-[#5b6d68] transition hover:border-[#c8d3ce] hover:bg-[#f5f7f4] hover:text-[#123b34] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d6a54]";
  const allMobileLinks: Array<{ title: string; href: string; permission: Permission | null; icon: typeof Home }> = [
    { title: "Home", href: "/workspace", permission: null, icon: Home },
    { title: "New repair", href: "/repairs/new", permission: "repairs", icon: Wrench },
    { title: "Parts out", href: "/parts-collection", permission: "inventory", icon: Boxes },
    { title: "Phone parts", href: "/inventory", permission: "inventory", icon: Package },
    { title: "Engineers", href: "/engineers", permission: "engineers", icon: Users },
    { title: "Sales", href: "/sales", permission: "sales", icon: ShoppingCart },
    { title: "Closing", href: "/reports/daily-closing", permission: "daily_closing", icon: Wallet },
    { title: "Help", href: "/help", permission: "help", icon: BookOpen },
    { title: "Search", href: "/search", permission: "search", icon: Search },
    { title: "Settings", href: "/settings", permission: "settings", icon: Settings },
    { title: "Staff", href: "/staff", permission: "staff", icon: Users },
  ];
  const mobileLinks = allMobileLinks.filter((item) => !item.permission || hasPermission(role, item.permission));

  return (
    <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between gap-2 border-b border-[#dfe6df] bg-[#fbfaf7]/95 px-3 backdrop-blur-xl sm:gap-3 sm:px-5 md:min-h-[72px] md:px-8" role="banner">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {!isHome && (
          <button type="button" onClick={() => router.push("/workspace")} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-[#dfe6df] bg-white px-2.5 text-xs font-semibold text-[#285c4d] transition hover:bg-[#eef4f1] sm:h-10 sm:px-3 sm:text-sm" aria-label="Back to Home">
            <ArrowLeft className="size-4" /><Home className="hidden size-4 sm:block" /><span>Home</span>
          </button>
        )}
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1d6a54]">Amezing</p>
          <h1 className="truncate font-heading text-lg font-bold tracking-tight text-[#182a28] md:text-xl">{getPageTitle(pathname)}</h1>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {hasPermission(role, "search") && (
          <button type="button" onClick={() => router.push("/search")} className={iconButtonClass} aria-label="Search" title="Search"><Search className="size-4" /></button>
        )}
        {hasPermission(role, "profit") && (
          <button type="button" onClick={() => router.push("/alerts")} className={iconButtonClass + " relative"} aria-label={unread > 0 ? "Notifications, " + unread + " unread" : "Notifications"} title="Notifications">
            <Bell className="size-4" />
            {unread > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c84b4b] px-1 text-[9px] font-bold text-white">{unread > 99 ? "99+" : unread}</span>}
          </button>
        )}
        <div className="hidden items-center gap-2 rounded-xl border border-[#dfe6df] bg-white px-2 py-1.5 sm:flex">
          <div className="flex size-7 items-center justify-center rounded-lg bg-[#123b34] font-heading text-sm font-bold text-[#d7a95a]">{initial}</div>
          <div className="min-w-0 text-left">
            <p className="max-w-32 truncate text-xs font-bold text-[#182a28]">{displayName}</p>
            <p className="max-w-32 truncate text-[10px] text-[#74837e]">{companyName || "Account"}</p>
          </div>
        </div>
        {hasPermission(role, "settings") && (
          <button type="button" onClick={() => router.push("/settings")} className={iconButtonClass + " hidden sm:inline-flex"} aria-label="Settings" title="Settings"><Settings className="size-4" /></button>
        )}
        <button type="button" onClick={handleLogout} className={iconButtonClass + " hidden sm:inline-flex"} aria-label="Log out" title="Log out"><LogOut className="size-4" /></button>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          className={iconButtonClass + " sm:hidden"}
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="amezing-mobile-menu"
          title="More"
        >
          {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>
      {mobileMenuOpen && (
        <nav id="amezing-mobile-menu" aria-label="Mobile navigation" className="absolute right-3 top-[calc(100%+8px)] z-50 max-h-[calc(100dvh-5.5rem)] w-[min(20rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-[#dfe6df] bg-white p-3 shadow-[0_16px_44px_rgba(18,59,52,0.18)] sm:hidden">
          <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#74837e]">Go to</p>
          <div className="grid grid-cols-2 gap-1">
            {mobileLinks.map(({ title, href, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)} aria-current={pathname === href ? "page" : undefined} className={pathname === href ? "flex min-h-11 items-center gap-2 rounded-xl bg-[#eef4f1] px-3 py-2 text-sm font-semibold text-[#123b34]" : "flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#40534d] transition hover:bg-[#f5f8f5]"}>
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 truncate">{title}</span>
              </Link>
            ))}
          </div>
          <div className="my-2 border-t border-[#e6ebe6]" />
          <button type="button" onClick={handleLogout} className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50">
            <LogOut className="size-4" aria-hidden="true" /> Sign out
          </button>
        </nav>
      )}
    </header>
  );
}
