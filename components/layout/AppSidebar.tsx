"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bot,
  ClipboardList,
  ContactRound,
  FileText,
  HandCoins,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Package,
  Receipt,
  Search,
  Settings,
  ShoppingCart,
  Smartphone,
  Truck,
  UserCog,
  Users,
  WalletCards,
  Wrench,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { staffService } from "@/services/staffService";
import { companyService } from "@/services/companyService";
import { supabase } from "@/lib/supabase";
import { hasPermission, type Permission } from "@/lib/permissions";
import type { StaffRole } from "@/types/staff";

type Icon = typeof LayoutDashboard;
type NavItem = { title: string; url: string; icon: Icon; permission: Permission };
type NavGroup = { label: string; items: NavItem[] };

const operations: NavGroup = {
  label: "Operations",
  items: [
    { title: "Repairs", url: "/repairs", icon: Wrench, permission: "repairs" },
    { title: "Sales", url: "/sales", icon: ShoppingCart, permission: "sales" },
    { title: "Mobile Sales", url: "/sales/mobile", icon: Smartphone, permission: "mobile_sales" },
    { title: "Engineer Work", url: "/engineer-workflow", icon: UserCog, permission: "engineer_work" },
    { title: "Invoices", url: "/invoices", icon: FileText, permission: "invoices" },
    { title: "Expenses", url: "/expenses", icon: Receipt, permission: "expenses" },
  ],
};

const business: NavGroup = {
  label: "Business",
  items: [
    { title: "Inventory", url: "/inventory", icon: Package, permission: "inventory" },
    { title: "Customers", url: "/customers", icon: ContactRound, permission: "customers" },
    { title: "Suppliers", url: "/suppliers", icon: Truck, permission: "suppliers" },
    { title: "Engineers", url: "/engineers", icon: UserCog, permission: "engineers" },
  ],
};

const money: NavGroup = {
  label: "Money & Reports",
  items: [
    { title: "Payments & Credit", url: "/finance", icon: WalletCards, permission: "payments" },
    { title: "Outstanding", url: "/outstanding", icon: HandCoins, permission: "outstanding" },
    { title: "Daily Profit", url: "/reports", icon: BarChart3, permission: "profit" },
    { title: "Daily Closing", url: "/reports/daily-closing", icon: ClipboardList, permission: "daily_closing" },
  ],
};

const communication: NavGroup = {
  label: "Communication",
  items: [
    { title: "WhatsApp", url: "/whatsapp", icon: MessageCircle, permission: "whatsapp" },
    { title: "Assistant", url: "/assistant", icon: Bot, permission: "assistant" },
  ],
};

function menuButtonClass() {
  return "h-9 rounded-xl border border-transparent text-[#dfe9e3] transition-colors duration-150 hover:border-[#d7a95a]/30 hover:bg-[#184b43] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7a95a]/60";
}

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [myRole, setMyRole] = useState<StaffRole | null>(null);
  const [profile, setProfile] = useState<{ fullName: string; companyName: string } | null>(null);

  useEffect(() => {
    let active = true;
    void staffService.getMyRole().then(({ data }) => {
      if (active && data) setMyRole(data);
    });
    void companyService.getCompany().then(({ data }) => {
      if (!active) return;
      if (data) {
        setProfile({
          fullName: data.full_name ?? "Danchrista",
          companyName: data.companies?.[0]?.name ?? "Danchrista Four Communication",
        });
      }
    });

    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function renderItem(item: NavItem) {
    if (!hasPermission(myRole, item.permission)) return null;
    const active = pathname === item.url || (item.url !== "/dashboard" && pathname.startsWith(`${item.url}`));
    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          render={<a href={item.url} className={active ? "bg-[#184b43] text-white" : ""} />}
          isActive={active}
          className={menuButtonClass()}
        >
          <item.icon className="size-4" />
          <span>{item.title}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  function renderGroup(group: NavGroup) {
    const allowedItems = group.items.filter((item) => hasPermission(myRole, item.permission));
    if (!allowedItems.length) return null;

    return (
      <SidebarGroup key={group.label} className="px-0">
        <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c7d8d2]">
          {group.label}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {allowedItems.map((item) => renderItem(item))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  const canManageStaff = hasPermission(myRole, "staff");
  const initial = profile?.fullName?.trim()?.[0]?.toUpperCase() ?? "D";

  const management: NavItem[] = [
    ...(canManageStaff ? [{ title: "Staff", url: "/staff", icon: Users, permission: "staff" as const }] : []),
    ...(hasPermission(myRole, "search") ? [{ title: "Search", url: "/search", icon: Search, permission: "search" as const }] : []),
    ...(hasPermission(myRole, "settings") ? [{ title: "Settings", url: "/settings", icon: Settings, permission: "settings" as const }] : []),
    ...(hasPermission(myRole, "help") ? [{ title: "Help", url: "/help", icon: HelpCircle, permission: "help" as const }] : []),
  ];

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-[#d7a95a]/15 bg-[#123b34] text-[#edf3ef] shadow-[0_24px_48px_rgba(18,59,52,0.25)]"
    >
      <SidebarHeader className="border-b border-[#d7a95a]/15 bg-[#123b34] px-3 py-3">
        <div className="flex items-center gap-3 px-1">
          <div className="grid size-9 place-items-center rounded-xl bg-[#d7a95a] text-[#123b34] shadow-sm">
            <span className="text-sm font-bold">{initial}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{profile?.fullName || "Danchrista"}</p>
            <p className="truncate text-[10px] uppercase tracking-[0.18em] text-[#c7d8d2]">
              {profile?.companyName || "Four Communication"}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-[#123b34] px-2 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<a href="/dashboard" className={pathname === "/dashboard" ? "bg-[#184b43] text-white" : ""} />}
              isActive={pathname === "/dashboard"}
              className={menuButtonClass()}
            >
              <LayoutDashboard className="size-4" />
              <span>Dashboard</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {renderGroup(operations)}
        {renderGroup(business)}
        {renderGroup(money)}
        {renderGroup(communication)}

        {management.length > 0 && (
          <SidebarGroup className="px-0 pt-2">
            <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c7d8d2]">
              Management
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {management.map((item) => renderItem(item))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-[#d7a95a]/15 bg-[#123b34] p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-xl border border-[#d7a95a]/15 bg-[#184b43] px-3 py-2.5 text-sm font-medium text-[#edf3ef] transition hover:bg-[#1c554e]"
        >
          <LogOut className="size-4 text-[#d7a95a]" />
          Log out
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
