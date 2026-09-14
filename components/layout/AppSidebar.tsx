"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3, Bot, ClipboardList, ContactRound, FileText, HandCoins, HelpCircle,
  LayoutDashboard, LogOut, MessageCircle, Package, Receipt, Search, Settings,
  ShoppingCart, Smartphone, Truck, UserCog, Users, WalletCards, Wrench,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import { staffService } from "@/services/staffService";
import { companyService } from "@/services/companyService";
import { supabase } from "@/lib/supabase";
import { hasPermission, type Permission } from "@/lib/permissions";
import type { StaffRole } from "@/types/staff";

type Icon = typeof LayoutDashboard;
type NavItem = { title: string; url: string; icon: Icon; permission: Permission };
type NavGroup = { label: string; items: NavItem[] };

const operations: NavGroup = { label: "Operations", items: [
  { title: "Repairs", url: "/repairs", icon: Wrench, permission: "repairs" },
  { title: "Sales", url: "/sales", icon: ShoppingCart, permission: "sales" },
  { title: "Mobile Sales", url: "/sales/mobile", icon: Smartphone, permission: "mobile_sales" },
  { title: "Invoices", url: "/invoices", icon: FileText, permission: "invoices" },
  { title: "Expenses", url: "/expenses", icon: Receipt, permission: "expenses" },
] };

const business: NavGroup = { label: "Business", items: [
  { title: "Inventory", url: "/inventory", icon: Package, permission: "inventory" },
  { title: "Customers", url: "/customers", icon: ContactRound, permission: "customers" },
  { title: "Suppliers", url: "/suppliers", icon: Truck, permission: "suppliers" },
  { title: "Engineers", url: "/engineers", icon: UserCog, permission: "engineers" },
] };

const money: NavGroup = { label: "Money & Reports", items: [
  { title: "Payments & Credit", url: "/finance", icon: WalletCards, permission: "payments" },
  { title: "Outstanding", url: "/outstanding", icon: HandCoins, permission: "outstanding" },
  { title: "Daily Profit", url: "/reports", icon: BarChart3, permission: "profit" },
  { title: "Daily Closing", url: "/reports/daily-closing", icon: ClipboardList, permission: "daily_closing" },
] };

const communication: NavGroup = { label: "Communication", items: [
  { title: "WhatsApp", url: "/whatsapp", icon: MessageCircle, permission: "whatsapp" },
  { title: "Assistant", url: "/assistant", icon: Bot, permission: "assistant" },
] };

function menuButtonClass() {
  return "h-9 rounded-lg border border-transparent text-slate-300 transition-colors duration-150 hover:border-white/[0.06] hover:bg-white/[0.055] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#12b76a] data-[active=true]:border-[#12b76a]/20 data-[active=true]:bg-[#12b76a]/10 data-[active=true]:font-semibold data-[active=true]:text-[#34d399] data-[active=true]:shadow-[inset_2px_0_0_#12b76a]";
}

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [myRole, setMyRole] = useState<StaffRole | null>(null);
  const [profile, setProfile] = useState<{ fullName: string; companyName: string } | null>(null);

  useEffect(() => {
    let active = true;
    void staffService.getMyRole().then(({ data }) => { if (active && data) setMyRole(data); });
    void companyService.getCompany().then(({ data }) => {
      if (!active || !data) return;
      const record = data as unknown as { full_name?: string; companies?: { name?: string } | { name?: string }[] };
      const companyRecord = Array.isArray(record.companies) ? record.companies[0] : record.companies;
      setProfile({ fullName: record.full_name ?? "Account", companyName: companyRecord?.name ?? "Danchrista Four Communication" });
    });
    return () => { active = false; };
  }, []);

  async function handleLogout() { await supabase.auth.signOut(); router.push("/login"); }

  function renderItem(item: NavItem) {
    if (!hasPermission(myRole, item.permission)) return null;
    const active = pathname === item.url || (item.url !== "/dashboard" && pathname.startsWith(`${item.url}/`));
    return <SidebarMenuItem key={item.url}><SidebarMenuButton isActive={active} tooltip={item.title} render={<a href={item.url} />} className={menuButtonClass()}><item.icon className="size-[17px]" aria-hidden="true" /><span>{item.title}</span></SidebarMenuButton></SidebarMenuItem>;
  }

  function renderGroup(group: NavGroup) {
    const allowedItems = group.items.filter((item) => hasPermission(myRole, item.permission));
    if (!allowedItems.length) return null;
    return <SidebarGroup key={group.label} className="px-1.5 py-2"><SidebarGroupLabel className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.17em] text-slate-600 group-data-[collapsible=icon]:px-0">{group.label}</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>{allowedItems.map(renderItem)}</SidebarMenu></SidebarGroupContent></SidebarGroup>;
  }

  const canManageStaff = hasPermission(myRole, "staff");
  const initial = profile?.fullName?.trim()?.[0]?.toUpperCase() ?? "D";
  const management: NavItem[] = [
    ...(canManageStaff ? [{ title: "Staff", url: "/staff", icon: Users, permission: "staff" as const }] : []),
    ...(hasPermission(myRole, "search") ? [{ title: "Search", url: "/search", icon: Search, permission: "search" as const }] : []),
    ...(hasPermission(myRole, "settings") ? [{ title: "Settings", url: "/settings", icon: Settings, permission: "settings" as const }] : []),
  ];

  return <Sidebar collapsible="icon" className="border-r border-white/[0.07] bg-[#111111] text-slate-200">
    <SidebarHeader className="border-b border-white/[0.06] bg-[#111111] px-3 py-3"><div className="flex items-center gap-3 px-1 py-1"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#12b76a] font-heading text-sm font-black text-white">D</div><div className="min-w-0 group-data-[collapsible=icon]:hidden"><span className="font-heading text-base font-bold tracking-tight text-white">Danchrista</span><span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">Four Communication</span></div></div></SidebarHeader>
    <SidebarContent className="bg-[#111111] px-2 py-2">
      <SidebarGroup className="px-1.5 py-2"><SidebarMenu>{hasPermission(myRole, "dashboard") && <SidebarMenuItem><SidebarMenuButton isActive={pathname === "/dashboard"} tooltip="Dashboard" render={<a href="/dashboard" />} className={menuButtonClass()}><LayoutDashboard className="size-[17px]" aria-hidden="true" /><span>Dashboard</span></SidebarMenuButton></SidebarMenuItem>}</SidebarMenu></SidebarGroup>
      {renderGroup(operations)}{renderGroup(business)}{renderGroup(money)}{renderGroup(communication)}
      {management.length > 0 && renderGroup({ label: "Manage", items: management })}
    </SidebarContent>
    <SidebarFooter className="border-t border-white/[0.06] bg-[#111111] p-2"><div className="mb-2 flex items-center gap-3 rounded-lg bg-white/[0.04] px-3 py-2.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#12b76a] text-sm font-black text-white">{initial}</div><div className="min-w-0 group-data-[collapsible=icon]:hidden"><p className="truncate text-sm font-semibold text-white">{profile?.fullName ?? "Loading…"}</p><p className="truncate text-xs text-slate-500">{profile?.companyName ?? "Danchrista Four Communication"}</p></div></div><SidebarMenu><SidebarMenuItem><SidebarMenuButton tooltip="Help & Support" render={<a href="/help" />} className={menuButtonClass()}><HelpCircle className="size-[17px]" aria-hidden="true" /><span>Help & Support</span></SidebarMenuButton></SidebarMenuItem><SidebarMenuItem><SidebarMenuButton tooltip="Log out" onClick={handleLogout} className={menuButtonClass()}><LogOut className="size-[17px]" aria-hidden="true" /><span>Log out</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarFooter>
  </Sidebar>;
}
