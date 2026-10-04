"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ClipboardList, Home, LogOut, Package, Search, ShoppingCart, UserRound, Wrench } from "lucide-react";
import { FloatingAssistant } from "@/components/assistant/FloatingAssistant";
import { getCurrentSession, supabase } from "@/lib/supabase";
import { DEFAULT_ROLE_PATH, hasPermission, permissionForPath } from "@/lib/permissions";
import { staffService } from "@/services/staffService";
import { AmezingLogo } from "@/components/brand/AmezingLogo";
import type { StaffRole } from "@/types/staff";

const nav = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Sales", href: "/sales", icon: ShoppingCart, permission: "sales" as const },
  { label: "Repairs", href: "/repairs", icon: Wrench, permission: "repairs" as const },
  { label: "Stock", href: "/inventory", icon: Package, permission: "inventory" as const },
  { label: "Engineers", href: "/engineers", icon: UserRound, permission: "engineers" as const },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<StaffRole | null>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function check() {
      const session = await getCurrentSession();
      if (!mounted) return;
      if (!session?.user) { router.replace("/login"); return; }
      const required = permissionForPath(pathname);
      const result = await staffService.getMyRole();
      if (!mounted) return;
      if (result.error || !result.data) { await supabase.auth.signOut(); router.replace("/login"); return; }
      if (required && !hasPermission(result.data, required)) { router.replace(DEFAULT_ROLE_PATH[result.data]); return; }
      setRole(result.data);
      const alerts = await supabase.rpc("get_operational_alerts", { p_limit: 100 });
      if (mounted) setUnread(((alerts.data ?? []) as Array<{ is_read: boolean }>).filter((a) => !a.is_read).length);
      setReady(true);
    }
    void check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session?.user) router.replace("/login");
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, [pathname, router]);

  if (!ready) return <div className="grid min-h-screen place-items-center bg-[#fbfaf7]"><div className="text-center"><AmezingLogo /><p className="mt-4 text-sm text-[#74837e]">Opening Amezing…</p></div></div>;

  const visibleNav = nav.filter((item) => !item.permission || hasPermission(role, item.permission));

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-[#182a28]">
      <header className="sticky top-0 z-40 border-b border-[#dfe6df] bg-[#fbfaf7]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between gap-3 px-4 sm:px-6">
          <a href="/dashboard" aria-label="Amezing Limited home"><AmezingLogo /></a>
          <nav className="hidden items-center gap-1 md:flex">
            {visibleNav.map(({label,href,icon:Icon}) => <a key={href} href={href} className={pathname===href||pathname.startsWith(href+"/") ? "rounded-xl bg-[#123b34] px-3.5 py-2 text-xs font-bold text-white" : "rounded-xl px-3.5 py-2 text-xs font-semibold text-[#60716b] hover:bg-[#eef4f1]"}><Icon className="mr-1.5 inline size-3.5" />{label}</a>)}
          </nav>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => router.push("/search")} className="grid size-9 place-items-center rounded-xl border border-[#dfe6df] bg-white text-[#60716b]" aria-label="Search"><Search className="size-4" /></button>
            <button type="button" onClick={() => router.push("/alerts")} className="relative grid size-9 place-items-center rounded-xl border border-[#dfe6df] bg-white text-[#60716b]" aria-label="Alerts"><Bell className="size-4" />{unread>0&&<span className="absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">{unread>99?"99+":unread}</span>}</button>
            <button type="button" onClick={async()=>{await supabase.auth.signOut();router.replace("/login")}} className="hidden size-9 place-items-center rounded-xl border border-[#dfe6df] bg-white text-[#60716b] sm:grid" aria-label="Log out"><LogOut className="size-4"/></button>
          </div>
        </div>
      </header>
      <main id="main-content" className="mx-auto w-full max-w-[1500px] px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-8">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#dfe6df] bg-white/95 px-2 py-2 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {visibleNav.map(({label,href,icon:Icon}) => <a key={href} href={href} className={pathname===href||pathname.startsWith(href+"/") ? "rounded-xl bg-[#eef4f1] py-2 text-center text-[10px] font-bold text-[#1d6a54]" : "rounded-xl py-2 text-center text-[10px] font-semibold text-[#74837e]"}><Icon className="mx-auto size-4"/><span>{label}</span></a>)}
        </div>
      </nav>
      <FloatingAssistant />
    </div>
  );
}
