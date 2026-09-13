"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity, AlertTriangle, BarChart3, BellRing, Bot, Building2, ClipboardCheck, FileText,
  Globe2, HandCoins, HelpCircle, LayoutDashboard, LogOut, MessageCircle, Package, Search,
  Settings, ShieldCheck, ShoppingCart, Smartphone, UserCog, Users, WalletCards, Wrench, Truck,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import { staffService } from "@/services/staffService";
import { companyService } from "@/services/companyService";
import { supabase } from "@/lib/supabase";
import type { StaffRole } from "@/types/staff";

type Icon = typeof LayoutDashboard;
type NavItem = { title: string; url: string; icon: Icon };
type NavGroup = { label: string; items: NavItem[] };

const operations: NavGroup = { label: "Operations", items: [
  { title: "Repairs", url: "/repairs", icon: Wrench }, { title: "Customers", url: "/customers", icon: Users },
  { title: "Devices", url: "/devices", icon: Smartphone }, { title: "Sales / POS", url: "/sales", icon: ShoppingCart },
  { title: "Inventory", url: "/inventory", icon: Package },
] };
const workshop: NavGroup = { label: "Workshop", items: [
  { title: "Engineer Workflow", url: "/engineer-workflow", icon: UserCog }, { title: "Parts Ledger", url: "/technician-ledger", icon: ClipboardCheck },
  { title: "Suppliers & Purchases", url: "/inventory/purchases", icon: Truck },
] };
const money: NavGroup = { label: "Sales & Finance", items: [
  { title: "Invoices", url: "/invoices", icon: FileText }, { title: "Outstanding", url: "/outstanding", icon: HandCoins },
  { title: "Finance", url: "/finance", icon: WalletCards }, { title: "Reports", url: "/reports", icon: BarChart3 },
] };
const communication: NavGroup = { label: "Communication", items: [
  { title: "WhatsApp Center", url: "/whatsapp", icon: MessageCircle }, { title: "Customer Requests", url: "/customer-requests", icon: BellRing },
  { title: "Assistant", url: "/assistant", icon: Bot },
] };
const manageRoles: StaffRole[] = ["owner", "branch_manager"];

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
      setProfile({ fullName: record.full_name ?? "Account", companyName: companyRecord?.name ?? "NOVATECH" });
    });
    return () => { active = false; };
  }, []);

  async function handleLogout() { await supabase.auth.signOut(); router.push("/login"); }

  function renderItem(item: NavItem) {
    const active = pathname === item.url || (item.url !== "/dashboard" && pathname.startsWith(`${item.url}/`));
    return <SidebarMenuItem key={item.url}><SidebarMenuButton isActive={active} tooltip={item.title} render={<a href={item.url} />} className={menuButtonClass()}><item.icon className="size-[17px]" aria-hidden="true" /><span>{item.title}</span></SidebarMenuButton></SidebarMenuItem>;
  }

  function renderGroup(group: NavGroup) {
    return <SidebarGroup key={group.label} className="px-1.5 py-2"><SidebarGroupLabel className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.17em] text-slate-600 group-data-[collapsible=icon]:px-0">{group.label}</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>{group.items.map(renderItem)}</SidebarMenu></SidebarGroupContent></SidebarGroup>;
  }

  const canManageStaff = myRole !== null && manageRoles.includes(myRole);
  const initial = profile?.fullName?.trim()?.[0]?.toUpperCase() ?? "N";
  const management: NavItem[] = [
    ...(canManageStaff ? [
      { title: "Staff & Branches", url: "/staff", icon: Building2 },
      { title: "Public Showcase", url: "/settings/showcase", icon: Globe2 },
      { title: "Audit Log", url: "/audit", icon: ShieldCheck },
    ] : []),
    { title: "Activity", url: "/activity", icon: Activity }, { title: "Alerts", url: "/alerts", icon: AlertTriangle },
    { title: "Settings", url: "/settings", icon: Settings },
  ];

  return <Sidebar collapsible="icon" className="border-r border-white/[0.07] bg-[#111111] text-slate-200">
    <SidebarHeader className="border-b border-white/[0.06] bg-[#111111] px-3 py-3"><div className="flex items-center gap-3 px-1 py-1"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#12b76a] font-heading text-sm font-black text-white">N</div><div className="min-w-0 group-data-[collapsible=icon]:hidden"><span className="font-heading text-base font-bold tracking-tight text-white">Novatech</span><span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">Repair Suite</span></div></div></SidebarHeader>
    <SidebarContent className="bg-[#111111] px-2 py-2">
      <SidebarGroup className="px-1.5 py-2"><SidebarMenu><SidebarMenuItem><SidebarMenuButton isActive={pathname === "/dashboard"} tooltip="Dashboard" render={<a href="/dashboard" />} className={menuButtonClass()}><LayoutDashboard className="size-[17px]" aria-hidden="true" /><span>Dashboard</span></SidebarMenuButton></SidebarMenuItem><SidebarMenuItem><SidebarMenuButton isActive={pathname === "/search"} tooltip="Search" render={<a href="/search" />} className={menuButtonClass()}><Search className="size-[17px]" aria-hidden="true" /><span>Search</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarGroup>
      {renderGroup(operations)}{renderGroup(workshop)}{renderGroup(money)}{renderGroup(communication)}
      {renderGroup({ label: "Management", items: management })}
    </SidebarContent>
    <SidebarFooter className="border-t border-white/[0.06] bg-[#111111] p-2">
      <div className="mb-2 flex items-center gap-3 rounded-lg bg-white/[0.04] px-3 py-2.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#12b76a] text-sm font-black text-white">{initial}</div>
        <div className="min-w-0 group-data-[collapsible=icon]:hidden">
          <p className="truncate text-sm font-semibold text-white">{profile?.fullName ?? "Loading…"}</p>
          <p className="truncate text-xs text-slate-500">{profile?.companyName ?? ""}</p>
        </div>
      </div>
      <SidebarMenu><SidebarMenuItem><SidebarMenuButton isActive={pathname === "/help"} tooltip="Help & Support" render={<a href="/help" />} className={menuButtonClass()}><HelpCircle className="size-[17px]" aria-hidden="true" /><span>Help & Support</span></SidebarMenuButton></SidebarMenuItem><SidebarMenuItem><SidebarMenuButton tooltip="Log out" onClick={handleLogout} className={menuButtonClass()}><LogOut className="size-[17px]" aria-hidden="true" /><span>Log out</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu>
    </SidebarFooter>
  </Sidebar>;
}
