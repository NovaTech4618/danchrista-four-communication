"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, ChevronDown, LogOut, MoreHorizontal, Search, Settings, ShoppingCart, Wrench, Package, LayoutDashboard, Users, HandCoins, BarChart3, ClipboardList, UserRound, MessageCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { supabase, getCurrentSession } from "@/lib/supabase";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { staffService } from "@/services/staffService";
import { hasPermission, type Permission } from "@/lib/permissions";
import type { StaffRole } from "@/types/staff";
import { AmezingLogo } from "@/components/brand/AmezingLogo";

type NavItem = { title: string; url: string; icon: typeof LayoutDashboard; permission: Permission };

const primary: NavItem[] = [
  { title: "Home", url: "/dashboard", icon: LayoutDashboard, permission: "dashboard" as Permission },
  { title: "Sales", url: "/sales", icon: ShoppingCart, permission: "sales" },
  { title: "Repairs", url: "/repairs", icon: Wrench, permission: "repairs" },
  { title: "Inventory", url: "/inventory", icon: Package, permission: "inventory" },
];

const more: NavItem[] = [
  { title: "Customers", url: "/customers", icon: Users, permission: "customers" },
  { title: "Engineers", url: "/engineers", icon: UserRound, permission: "engineers" },
  { title: "Debit", url: "/outstanding", icon: HandCoins, permission: "outstanding" },
  { title: "Reports", url: "/reports", icon: BarChart3, permission: "profit" },
  { title: "Daily closing", url: "/reports/daily-closing", icon: ClipboardList, permission: "daily_closing" },
  { title: "WhatsApp", url: "/whatsapp", icon: MessageCircle, permission: "whatsapp" },
  { title: "Search", url: "/search", icon: Search, permission: "search" },
  { title: "Settings", url: "/settings", icon: Settings, permission: "settings" },
];

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard", "/sales": "Sales", "/customers": "Customers", "/repairs": "Repairs",
  "/inventory": "Inventory", "/reports": "Reports", "/settings": "Settings", "/alerts": "Alerts",
  "/search": "Search", "/whatsapp": "WhatsApp", "/engineers": "Engineers", "/outstanding": "Debit",
  "/reports/daily-closing": "Daily closing",
};

function getPageTitle(pathname: string) {
  if (pageTitles[pathname]) return pageTitles[pathname];
  const root = `/${pathname.split("/")[1]}`;
  return pageTitles[root] || "Workspace";
}

function isActive(pathname: string, url: string) {
  return pathname === url || pathname.startsWith(`${url}/`);
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<StaffRole | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;
    void staffService.getMyRole().then(({ data }) => { if (active && data) setRole(data); });
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
      if (active) setUnread(((data ?? []) as Array<{ is_read: boolean }>).filter((a) => !a.is_read).length);
    }
  }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const displayName = fullName || "Staff member";
  const initial = displayName.charAt(0).toUpperCase();
  const visiblePrimary = primary.filter((item) => hasPermission(role, item.permission));
  const visibleMore = more.filter((item) => hasPermission(role, item.permission));
  const moreActive = visibleMore.some((item) => isActive(pathname, item.url));

  const linkClass = (active: boolean) =>
    `inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${active ? "bg-[#123b34] text-white shadow-sm" : "text-[#61716c] hover:bg-[#eef4f1] hover:text-[#123b34]"}`;

  const iconButtonClass = "inline-flex size-10 items-center justify-center rounded-xl border border-[#dfe6df] bg-white text-[#526762] transition hover:border-[#c8d3ce] hover:bg-[#f5f7f4] hover:text-[#123b34] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d6a54]";

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#dfe6df] bg-[#fbfaf7]/95 backdrop-blur-xl" role="banner">
        <div className="mx-auto flex min-h-16 max-w-[1600px] items-center gap-3 px-3 sm:px-5 lg:px-8">
          <Link href="/dashboard" className="shrink-0 rounded-xl p-1 focus-visible:outline-2 focus-visible:outline-[#1d6a54]" aria-label="Danchrista Four Communication home">
            <AmezingLogo />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
            {visiblePrimary.map((item) => {
              const active = isActive(pathname, item.url);
              return <Link key={item.url} href={item.url} className={linkClass(active)}><item.icon className="size-4" /><span>{item.title}</span></Link>;
            })}
            {visibleMore.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold outline-none transition-all ${moreActive ? "bg-[#eef4f1] text-[#123b34]" : "text-[#61716c] hover:bg-[#eef4f1] hover:text-[#123b34]"}`}>
                  <MoreHorizontal className="size-4" /> More <ChevronDown className="size-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 rounded-2xl border-[#dfe6df] p-1.5">
                  {visibleMore.map((item) => <DropdownMenuItem key={item.url} asChild><Link href={item.url} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5"><item.icon className="size-4" /><span>{item.title}</span></Link></DropdownMenuItem>)}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <button type="button" onClick={() => router.push("/search")} className={`${iconButtonClass} hidden sm:inline-flex`} aria-label="Search"><Search className="size-4" /></button>
            <button type="button" onClick={() => router.push("/alerts")} className={`${iconButtonClass} relative`} aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}><Bell className="size-4" />{unread > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c84b4b] px-1 text-[9px] font-bold text-white">{unread > 99 ? "99+" : unread}</span>}</button>
            <DropdownMenu>
              <DropdownMenuTrigger className="hidden items-center gap-2 rounded-xl border border-[#dfe6df] bg-white px-2 py-1.5 text-left outline-none transition hover:bg-[#f5f7f4] sm:flex">
                <span className="flex size-8 items-center justify-center rounded-lg bg-[#123b34] font-heading text-sm font-bold text-[#d7a95a]">{initial}</span>
                <span className="hidden max-w-36 md:block"><span className="block truncate text-xs font-bold text-[#182a28]">{displayName}</span><span className="block truncate text-[10px] text-[#74837e]">{companyName || "Account"}</span></span>
                <ChevronDown className="size-3.5 text-[#74837e]" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-2xl border-[#dfe6df] p-1.5">
                <DropdownMenuItem asChild><Link href="/settings" className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5"><Settings className="size-4" />Settings</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer rounded-xl px-3 py-2.5"><LogOut className="mr-3 size-4" />Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="fixed inset-x-3 bottom-3 z-50 flex items-center justify-around rounded-2xl border border-[#dfe6df] bg-white/95 p-1.5 shadow-[0_12px_40px_rgba(18,59,52,0.16)] backdrop-blur-xl lg:hidden" aria-label="Quick navigation">
        {visiblePrimary.slice(0, 4).map((item) => {
          const active = isActive(pathname, item.url);
          return <Link key={item.url} href={item.url} className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-bold ${active ? "bg-[#123b34] text-white" : "text-[#687873]"}`}><item.icon className="size-4" /><span className="truncate">{item.title}</span></Link>;
        })}
        {visibleMore.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-bold text-[#687873] outline-none"><MoreHorizontal className="size-4" /><span>More</span></DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="mb-2 w-56 rounded-2xl border-[#dfe6df] p-1.5">
              {visibleMore.map((item) => <DropdownMenuItem key={item.url} asChild><Link href={item.url} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5"><item.icon className="size-4" /><span>{item.title}</span></Link></DropdownMenuItem>)}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </>
  );
}
