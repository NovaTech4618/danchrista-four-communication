"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeftRight, BarChart3, BellRing, Boxes, ClipboardList, HandCoins,
  Landmark, Package, Search, Settings, ShoppingCart, UserRound, Users, Wrench, MessageCircle
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { staffService } from "@/services/staffService";
import { hasPermission } from "@/lib/permissions";

const tiles = [
  { title: "Daily Parts Collection", href: "/parts-collection", icon: ArrowLeftRight, permission: "inventory" as const },
  { title: "Engineers", href: "/engineers", icon: UserRound, permission: "engineers" as const },
  { title: "Daily Report", href: "/reports", icon: BarChart3, permission: "profit" as const },
  { title: "Phone Parts", href: "/inventory", icon: Package, permission: "inventory" as const },
  { title: "Owed & Owing", href: "/owed-owing", icon: HandCoins, permission: "outstanding" as const },
  { title: "Search", href: "/search", icon: Search, permission: "search" as const },
  { title: "WhatsApp", href: "/whatsapp", icon: MessageCircle, permission: "whatsapp" as const },
];

const moreTools = [
  { title: "Sales", href: "/sales", icon: ShoppingCart, permission: "sales" as const },
  { title: "Repairs", href: "/repairs", icon: Wrench, permission: "repairs" as const },
  { title: "Money & Accounts", href: "/accounts", icon: Landmark, permission: "profit" as const },
  { title: "Alerts", href: "/alerts", icon: BellRing, permission: "profit" as const },
  { title: "Daily Closing", href: "/reports/daily-closing", icon: ClipboardList, permission: "daily_closing" as const },
  { title: "Staff", href: "/staff", icon: Users, permission: "staff" as const },
  { title: "Settings", href: "/settings", icon: Settings, permission: "settings" as const },
];

export default function WorkspacePage() {
  const [role, setRole] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    let active = true;
    void staffService.getMyRole().then((result) => {
      if (active && result.data) setRole(result.data);
    });
    return () => { active = false; };
  }, []);

  const visibleTiles = role ? tiles.filter((tile) => hasPermission(role as never, tile.permission)) : [];
  const visibleTools = role ? moreTools.filter((tool) => hasPermission(role as never, tool.permission)) : [];

  return (
    <AppLayout>
      <main className="mx-auto max-w-5xl space-y-6 pb-6">
        <header className="px-1 pb-1 pt-2 text-center sm:pt-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1d6a54]">Amezing Limited</p>
          <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight text-[#182a28] sm:text-4xl">What do you need?</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-5 text-[#74837e]">Choose one tile. Finish your task, then tap Home to return here.</p>
        </header>

        <section aria-label="Main workspace">
          {role === null ? (
            <div className="grid grid-cols-3 gap-3 sm:gap-4" aria-label="Loading workspace" aria-busy="true">
              {tiles.slice(0, 6).map((tile) => <div key={tile.title} className="aspect-square animate-pulse rounded-2xl border border-[#e5ebe6] bg-white" />)}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:gap-4 md:grid-cols-4">
              {visibleTiles.map(({ title, href, icon: Icon }) => (
                <Link key={title} href={href} className="group flex aspect-square min-w-0 flex-col items-center justify-center gap-3 rounded-2xl border border-[#e5e9e5] bg-white px-2 py-3 text-center shadow-[0_3px_7px_rgba(24,42,40,0.10)] transition active:scale-[0.98] hover:-translate-y-0.5 hover:border-[#bfd2c8] hover:shadow-[0_8px_18px_rgba(18,59,52,0.12)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d6a54]">
                  <span className="grid size-12 place-items-center rounded-2xl bg-[#eef4f1] text-[#1d6a54] transition group-hover:bg-[#123b34] group-hover:text-[#d7a95a] sm:size-14"><Icon className="size-6 sm:size-7" strokeWidth={1.8} /></span>
                  <span className="text-xs font-bold leading-4 text-[#263a35] sm:text-sm">{title}</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {role !== null && visibleTools.length > 0 && (
          <section className="pt-1">
            <button type="button" onClick={() => setShowMore((value) => !value)} aria-expanded={showMore} className="flex min-h-12 w-full items-center justify-between rounded-xl border border-[#e5e9e5] bg-white px-4 text-sm font-bold text-[#285c4d] shadow-sm transition hover:bg-[#f5f8f5]">
              <span>{showMore ? "Hide extra tools" : "More tools"}</span>
              <span className="text-lg" aria-hidden="true">{showMore ? "−" : "+"}</span>
            </button>
            {showMore && <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {visibleTools.map(({ title, href, icon: Icon }) => (
                <Link key={title} href={href} className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-[#e5e9e5] bg-white p-2 text-center shadow-sm hover:bg-[#f5f8f5]">
                  <Icon className="size-5 text-[#1d6a54]" /><span className="text-xs font-semibold leading-4 text-[#344943]">{title}</span>
                </Link>
              ))}
            </div>}
          </section>
        )}
      </main>
    </AppLayout>
  );
}
