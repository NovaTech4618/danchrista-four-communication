"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Bot, ClipboardList, ContactRound, FileText, HandCoins, HelpCircle, LayoutDashboard, LogOut, MessageCircle, Package, Receipt, Search, Settings, ShoppingCart, Smartphone, Truck, UserCog, Users, WalletCards, Wrench } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { staffService } from "@/services/staffService";
import { companyService } from "@/services/companyService";
import { supabase } from "@/lib/supabase";
import { hasPermission, type Permission } from "@/lib/permissions";
import type { StaffRole } from "@/types/staff";
import { DanchristaLogo } from "@/components/brand/NovatechLogo";

type Icon = typeof LayoutDashboard;
type NavItem = { title: string; url: string; icon: Icon; permission: Permission };
type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  { label: "Operations", items: [
    { title: "Repairs", url: "/repairs", icon: Wrench, permission: "repairs" }, { title: "Sales", url: "/sales", icon: ShoppingCart, permission: "sales" }, { title: "Mobile Sales", url: "/sales/mobile", icon: Smartphone, permission: "mobile_sales" }, { title: "Engineer Work", url: "/engineer-workflow", icon: UserCog, permission: "engineer_work" }, { title: "Invoices", url: "/invoices", icon: FileText, permission: "invoices" }, { title: "Expenses", url: "/expenses", icon: Receipt, permission: "expenses" },
  ] },
  { label: "Business", items: [
    { title: "Inventory", url: "/inventory", icon: Package, permission: "inventory" }, { title: "Customers", url: "/customers", icon: ContactRound, permission: "customers" }, { title: "Suppliers", url: "/suppliers", icon: Truck, permission: "suppliers" }, { title: "Engineers", url: "/engineers", icon: UserCog, permission: "engineers" },
  ] },
  { label: "Money & Reports", items: [
    { title: "Payments & Credit", url: "/finance", icon: WalletCards, permission: "payments" }, { title: "Outstanding", url: "/outstanding", icon: HandCoins, permission: "outstanding" }, { title: "Daily Profit", url: "/reports", icon: BarChart3, permission: "profit" }, { title: "Daily Closing", url: "/reports/daily-closing", icon: ClipboardList, permission: "daily_closing" },
  ] },
  { label: "Communication", items: [
    { title: "WhatsApp", url: "/whatsapp", icon: MessageCircle, permission: "whatsapp" }, { title: "Assistant", url: "/assistant", icon: Bot, permission: "assistant" },
  ] },
];

function menuButtonClass(active: boolean) {
  return `h-10 rounded-xl border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7a95a]/70 ${active ? "border-white/10 bg-white text-[#123b34] shadow-sm" : "border-transparent text-[#dbe7e2] hover:border-white/5 hover:bg-white/10 hover:text-white"}`;
}

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [myRole, setMyRole] = useState<StaffRole | null>(null);
  const [profile, setProfile] = useState<{ fullName: string; companyName: string } | null>(null);

  useEffect(() => {
    let active = true;
    void staffService.getMyRole().then(({ data }) => { if (active && data) setMyRole(data); });
    void companyService.getCompany().then(({ data }) => { if (active && data) setProfile({ fullName: data.full_name ?? "Staff member", companyName: data.companies?.[0]?.name ?? "Danchrista Four Communication" }); });
    return () => { active = false; };
  }, []);

  async function handleLogout() { await supabase.auth.signOut(); router.replace("/login"); }

  function renderItem(item: NavItem) {
    if (!hasPermission(myRole, item.permission)) return null;
    const active = pathname === item.url || (item.url !== "/dashboard" && pathname.startsWith(`${item.url}/`));
    return <SidebarMenuItem key={item.title}><SidebarMenuButton render={<a href={item.url} className={active ? "bg-white text-[#123b34]" : ""} />} isActive={active} className={menuButtonClass(active)} tooltip={item.title}><item.icon className="size-4" /><span>{item.title}</span></SidebarMenuButton></SidebarMenuItem>;
  }

  function renderGroup(group: NavGroup) {
    const allowed = group.items.filter((item) => hasPermission(myRole, item.permission));
    if (!allowed.length) return null;
    return <SidebarGroup key={group.label} className="px-0"><SidebarGroupLabel className="px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[#9eb8ad]">{group.label}</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>{allowed.map(renderItem)}</SidebarMenu></SidebarGroupContent></SidebarGroup>;
  }

  const management: NavItem[] = [
    ...(hasPermission(myRole, "staff") ? [{ title: "Staff", url: "/staff", icon: Users, permission: "staff" as const }] : []),
    ...(hasPermission(myRole, "search") ? [{ title: "Search", url: "/search", icon: Search, permission: "search" as const }] : []),
    ...(hasPermission(myRole, "settings") ? [{ title: "Settings", url: "/settings", icon: Settings, permission: "settings" as const }] : []),
    ...(hasPermission(myRole, "help") ? [{ title: "Help", url: "/help", icon: HelpCircle, permission: "help" as const }] : []),
  ];

  return <Sidebar collapsible="icon" className="border-r border-[#d7a95a]/10 bg-[#123b34] text-white shadow-[12px_0_40px_rgba(18,59,52,0.14)]">
    <SidebarHeader className="border-b border-white/10 bg-[#123b34] px-3 py-4"><a href="/dashboard" className="block rounded-xl px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7a95a]" aria-label="Danchrista Four Communication dashboard"><DanchristaLogo dark /></a></SidebarHeader>
    <SidebarContent className="bg-[#123b34] px-2 py-3">
      <SidebarMenu className="mb-2"><SidebarMenuItem><SidebarMenuButton render={<a href="/dashboard" className={pathname === "/dashboard" ? "bg-white text-[#123b34]" : ""} />} isActive={pathname === "/dashboard"} className={menuButtonClass(pathname === "/dashboard")} tooltip="Dashboard"><LayoutDashboard className="size-4" /><span>Dashboard</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu>
      {groups.map(renderGroup)}
      {management.length > 0 && <SidebarGroup className="px-0 pt-2"><SidebarGroupLabel className="px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[#9eb8ad]">Management</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>{management.map(renderItem)}</SidebarMenu></SidebarGroupContent></SidebarGroup>}
    </SidebarContent>
    <SidebarFooter className="border-t border-white/10 bg-[#123b34] p-3"><div className="mb-2 hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 group-data-[collapsible=icon]:hidden"><p className="truncate text-xs font-semibold text-white">{profile?.fullName || "Staff member"}</p><p className="mt-0.5 truncate text-[10px] text-[#9eb8ad]">{profile?.companyName || "Danchrista Four Communication"}</p></div><button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium text-[#dbe7e2] transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7a95a]"><LogOut className="size-4 text-[#d7a95a]" /><span>Log out</span></button></SidebarFooter>
  </Sidebar>;
}
