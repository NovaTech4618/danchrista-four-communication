"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, Package, HandCoins, ShoppingCart, Wrench, ArrowLeftRight, Wallet, UserRound, X, History } from "lucide-react";
import { hasPermission } from "@/lib/permissions";
import { staffService } from "@/services/staffService";
import type { StaffRole } from "@/types/staff";

const items = [
  { label: "Home", href: "/workspace", permission: null, icon: Home },
  { label: "History", href: "/activity", permission: "staff" as const, icon: History },
  { label: "Sales", href: "/sales", permission: "sales" as const, icon: ShoppingCart },
  { label: "Stock", href: "/inventory", permission: "inventory" as const, icon: Package },
  { label: "Debts", href: "/owed-owing", permission: "outstanding" as const, icon: HandCoins },
];

const actions = [
  { label: "New sale", detail: "Record goods sold", href: "/sales", permission: "sales" as const, icon: ShoppingCart },
  { label: "Receive repair", detail: "Register a device", href: "/repairs/new", permission: "repairs" as const, icon: Wrench },
  { label: "Parts movement", detail: "Issue or return parts", href: "/parts-collection", permission: "inventory" as const, icon: ArrowLeftRight },
  { label: "Daily expenses", detail: "Record shop expenses", href: "/reports/daily-closing", permission: "daily_closing" as const, icon: Wallet },
  { label: "Engineer accounts", detail: "Work and balances", href: "/engineers", permission: "engineers" as const, icon: UserRound },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [role, setRole] = useState<StaffRole | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    void staffService.getMyRole().then(({ data }) => {
      if (active && data) setRole(data);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const visibleItems = items.filter((item) =>
    item.permission === null || (role !== null && hasPermission(role, item.permission))
  );
  const visibleActions = actions.filter((item) => role !== null && hasPermission(role, item.permission));
  const leftItems = visibleItems.filter((item) => item.label === "Home");
  const secondItem = role && hasPermission(role, "staff") ? visibleItems.find((item) => item.label === "History") : visibleItems.find((item) => item.label === "Sales");
  const stockItem = visibleItems.find((item) => item.label === "Stock") || (role && hasPermission(role, "repairs") ? { label: "Repairs", href: "/repairs", permission: "repairs" as const, icon: Wrench } : undefined);
  const debtsItem = visibleItems.find((item) => item.label === "Debts") || (role && hasPermission(role, "daily_closing") ? { label: "Close", href: "/reports/daily-closing", permission: "daily_closing" as const, icon: Wallet } : undefined);

  return (
    <>
      {menuOpen && (
        <>
          <button type="button" aria-label="Close quick actions" className="fixed inset-0 z-40 bg-[#071a15]/55 backdrop-blur-[2px] lg:hidden" onClick={() => setMenuOpen(false)} />
          <section aria-label="Quick actions" className="fixed inset-x-3 bottom-[5.8rem] z-50 rounded-3xl border border-[#294b40] bg-[#102b23] p-4 text-white shadow-[0_24px_70px_rgba(0,0,0,0.35)] lg:hidden">
            <div className="mb-3 flex items-center justify-between">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7ed5a7]">Quick actions</p><h2 className="mt-1 text-lg font-bold">What do you need to record?</h2></div>
              <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close quick actions" className="grid size-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-white"><X className="size-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {visibleActions.map(({ label, detail, href, icon: Icon }) => (
                <Link key={label} href={href} onClick={() => setMenuOpen(false)} className="flex min-h-[84px] items-start gap-2.5 rounded-2xl border border-white/10 bg-white/[0.045] p-3 transition hover:border-[#5ca982] hover:bg-white/[0.08]">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#174a37] text-[#8fe0b4]"><Icon className="size-4" /></span>
                  <span className="min-w-0"><span className="block text-sm font-semibold">{label}</span><span className="mt-1 block text-[11px] leading-4 text-[#b6c9be]">{detail}</span></span>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
      <nav aria-label="Main mobile navigation" className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 items-center gap-1 rounded-2xl border border-[#28463b] bg-[#0c211b]/95 px-2 py-2 shadow-[0_12px_36px_rgba(0,0,0,0.28)] backdrop-blur-xl lg:hidden">
        {[...leftItems, ...(secondItem ? [secondItem] : [])].map(({ label, href, icon: Icon }) => {
          const active = href === "/workspace" ? pathname === "/workspace" || pathname === "/dashboard" : pathname === href || pathname.startsWith(href + "/");
          return <Link key={label} href={href} aria-current={active ? "page" : undefined} className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold transition ${active ? "bg-[#174a37] text-[#91e2b5]" : "text-[#b5c8be] hover:bg-white/5 hover:text-white"}`}><Icon className="size-[18px]" strokeWidth={1.9} /><span>{label}</span></Link>;
        })}
        <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-label={menuOpen ? "Close quick actions" : "Open quick actions"} className={`mx-auto grid size-12 -translate-y-2 place-items-center rounded-2xl border border-[#8be0b0]/30 shadow-[0_8px_22px_rgba(0,0,0,0.22)] transition ${menuOpen ? "rotate-45 bg-[#285c43] text-white" : "bg-[#42c978] text-[#08271a] hover:bg-[#6ce093]"}`}><Plus className="size-6" strokeWidth={2.5} /></button>
        {[stockItem, debtsItem].filter((item): item is NonNullable<typeof item> => Boolean(item)).map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return <Link key={label} href={href} aria-current={active ? "page" : undefined} className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold transition ${active ? "bg-[#174a37] text-[#91e2b5]" : "text-[#b5c8be] hover:bg-white/5 hover:text-white"}`}><Icon className="size-[18px]" strokeWidth={1.9} /><span>{label}</span></Link>;
        })}
      </nav>
    </>
  );
}
