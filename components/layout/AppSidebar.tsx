"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Boxes, ChevronDown, ClipboardList, HandCoins, Home, LogOut, MessageCircle, Package, Search, Settings, ShoppingCart, Users, Wrench, UserRound, Landmark } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { staffService } from "@/services/staffService";
import { companyService } from "@/services/companyService";
import { supabase } from "@/lib/supabase";
import { hasPermission, type Permission } from "@/lib/permissions";
import type { StaffRole } from "@/types/staff";
import { AmezingLogo } from "@/components/brand/AmezingLogo";

type Icon = typeof Home;
type NavItem = { title: string; url: string; icon: Icon; permission: Permission };
const primaryItems: NavItem[] = [
  { title: "Daily Parts Collection", url: "/parts-collection", icon: ClipboardList, permission: "inventory" },
  { title: "Inventory", url: "/inventory", icon: Package, permission: "inventory" },
  { title: "Engineers", url: "/engineers", icon: UserRound, permission: "engineers" },
];

const groups: { label: string; items: NavItem[] }[] = [
  { label: "Shop records", items: [
    { title: "Sales", url: "/sales", icon: ShoppingCart, permission: "sales" },
    { title: "Repairs", url: "/repairs", icon: Wrench, permission: "repairs" },
    { title: "Owed & Owing", url: "/owed-owing", icon: HandCoins, permission: "outstanding" },
  ] },
  { label: "Owner tools", items: [
    { title: "Reports", url: "/reports", icon: BarChart3, permission: "profit" },
    { title: "Accounts", url: "/accounts", icon: Landmark, permission: "profit" },
    { title: "Daily Closing", url: "/reports/daily-closing", icon: ClipboardList, permission: "daily_closing" },
    { title: "Alerts", url: "/alerts", icon: Boxes, permission: "inventory" },
  ] },
  { label: "People & tools", items: [
    { title: "Staff", url: "/staff", icon: Users, permission: "staff" },
    { title: "WhatsApp", url: "/whatsapp", icon: MessageCircle, permission: "whatsapp" },
    { title: "Search", url: "/search", icon: Search, permission: "search" },
  ] },
];

function menuButtonClass(active: boolean) { return `h-10 rounded-xl border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7a95a]/70 ${active ? "border-white/10 bg-white text-[#123b34] shadow-sm" : "border-transparent text-[#dbe7e2] hover:border-white/5 hover:bg-white/10 hover:text-white"}`; }

export default function AppSidebar() {
  const pathname = usePathname(); const router = useRouter(); const { isMobile, setOpenMobile } = useSidebar(); const [myRole, setMyRole] = useState<StaffRole | null>(null); const [profile, setProfile] = useState<{ fullName: string; companyName: string } | null>(null); const [moreOpen, setMoreOpen] = useState(false);
  useEffect(() => { let active = true; void staffService.getMyRole().then(({ data }) => { if (active && data) setMyRole(data); }); void companyService.getCompany().then(({ data }) => { if (active && data) setProfile({ fullName: data.full_name ?? "Staff member", companyName: data.companies?.[0]?.name ?? "Amezing Limited" }); }); return () => { active = false; }; }, []);
  useEffect(() => {
    const currentIsInMoreTools = groups.some((group) => group.items.some((item) => pathname === item.url || pathname.startsWith(`${item.url}/`)));
    if (currentIsInMoreTools) setMoreOpen(true);
  }, [pathname]);
  async function handleLogout() { await supabase.auth.signOut(); router.replace("/login"); }
  function navigate(url: string) {
    if (isMobile) setOpenMobile(false);
    router.push(url);
  }
  function renderItem(item: NavItem) {
    if (!hasPermission(myRole, item.permission)) return null;
    const active = pathname === item.url || pathname.startsWith(`${item.url}/`);
    return <SidebarMenuItem key={item.title}><SidebarMenuButton render={<Link href={item.url} />} isActive={active} className={menuButtonClass(active)} tooltip={item.title} onClick={() => navigate(item.url)} aria-current={active ? "page" : undefined}><item.icon className="size-4" /><span>{item.title}</span></SidebarMenuButton></SidebarMenuItem>;
  }
  return <Sidebar collapsible="icon" className="border-r border-[#d7a95a]/10 bg-[#123b34] text-white shadow-[12px_0_40px_rgba(18,59,52,0.14)]">
    <SidebarHeader className="border-b border-white/10 bg-[#123b34] px-3 py-4"><Link href="/workspace" onClick={() => navigate("/workspace")} aria-label="Amezing dashboard" className="block rounded-xl px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7a95a]"><AmezingLogo dark /></Link></SidebarHeader>
    <SidebarContent className="bg-[#123b34] px-2 py-3">
      <SidebarGroup className="px-0">
        <SidebarGroupLabel className="px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[#9eb8ad]">Main</SidebarGroupLabel>
        <SidebarGroupContent><SidebarMenu>
          <SidebarMenuItem><SidebarMenuButton render={<Link href="/workspace" />} isActive={pathname === "/dashboard"} className={menuButtonClass(pathname === "/dashboard")} tooltip="Home" onClick={() => navigate("/dashboard")} aria-current={pathname === "/dashboard" ? "page" : undefined}><LayoutHome className="size-4" /><span>Home</span></SidebarMenuButton></SidebarMenuItem>
          {primaryItems.filter((item) => hasPermission(myRole, item.permission)).map(renderItem)}
        </SidebarMenu></SidebarGroupContent>
      </SidebarGroup>
      <SidebarGroup className="px-0 pt-2">
        <SidebarGroupContent><SidebarMenu><SidebarMenuItem>
          <SidebarMenuButton onClick={() => setMoreOpen((open) => !open)} className={menuButtonClass(groups.some((group) => group.items.some((item) => pathname === item.url || pathname.startsWith(item.url + "/"))))} tooltip="More tools" aria-expanded={moreOpen}>
            <Boxes className="size-4" /><span className="flex-1 text-left">More tools</span><ChevronDown className={`size-4 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
          </SidebarMenuButton>
        </SidebarMenuItem></SidebarMenu></SidebarGroupContent>
      </SidebarGroup>
      {moreOpen && groups.map((group) => { const allowed = group.items.filter((item) => hasPermission(myRole, item.permission)); if (!allowed.length) return null; return <SidebarGroup key={group.label} className="px-0"><SidebarGroupLabel className="px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[#9eb8ad]">{group.label}</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>{allowed.map(renderItem)}</SidebarMenu></SidebarGroupContent></SidebarGroup>; })}
      {hasPermission(myRole, "settings") && <SidebarGroup className="px-0 pt-2"><SidebarGroupLabel className="px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[#9eb8ad]">System</SidebarGroupLabel><SidebarGroupContent><SidebarMenu><SidebarMenuItem><SidebarMenuButton render={<Link href="/settings" />} isActive={pathname.startsWith("/settings")} className={menuButtonClass(pathname.startsWith("/settings"))} tooltip="Settings" onClick={() => navigate("/settings")} aria-current={pathname.startsWith("/settings") ? "page" : undefined}><Settings className="size-4" /><span>Settings</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarGroupContent></SidebarGroup>}
    </SidebarContent>
    <SidebarFooter className="border-t border-white/10 bg-[#123b34] p-3"><div className="mb-2 hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 group-data-[collapsible=icon]:hidden"><p className="truncate text-xs font-semibold text-white">{profile?.fullName || "Staff member"}</p><p className="mt-0.5 truncate text-[10px] text-[#9eb8ad]">{profile?.companyName || "Amezing Limited"}</p></div><button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium text-[#dbe7e2] transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7a95a]"><LogOut className="size-4 text-[#d7a95a]" /><span>Log out</span></button></SidebarFooter>
  </Sidebar>;
}
