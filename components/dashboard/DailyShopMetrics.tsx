"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, HandCoins, ShoppingCart, WalletCards } from "lucide-react";
import { dashboardService } from "@/services/dashboardService";
import { supabase } from "@/lib/supabase";

const money = (value: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);

export default function DailyShopMetrics() {
  const [sales, setSales] = useState<number | null>(null);
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof dashboardService.getSummary>>["data"]>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const { count } = await supabase.from("sales").select("id", { count: "exact", head: true }).gte("sales_date", start.toISOString());
      const result = await dashboardService.getSummary();
      if (!active) return;
      setSales(count ?? 0);
      setSummary(result.data);
    }
    void load();
    return () => { active = false; };
  }, []);

  return <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <Metric label="Sales today" value={sales === null ? "—" : String(sales)} hint="Walk-in sales recorded" icon={ShoppingCart} />
    <Metric label="Money received" value={summary ? money(summary.cash_today) : "—"} hint="Recorded today" icon={WalletCards} />
    <Metric label="Owed to Amezing Limited" value={summary ? money(summary.outstanding_customer) : "—"} hint="Unpaid customer debit" icon={HandCoins} tone="amber" />
    <Metric label="Stock attention" value={summary ? String(summary.low_stock_count) : "—"} hint="Low or empty items" icon={AlertTriangle} tone="red" />
  </section>;
}

function Metric({ label, value, hint, icon: Icon, tone = "green" }: { label: string; value: string; hint: string; icon: typeof ShoppingCart; tone?: "green" | "amber" | "red" }) {
  const toneClass = tone === "red" ? "bg-red-50 text-red-700" : tone === "amber" ? "bg-amber-50 text-amber-700" : "bg-[#eef4f1] text-[#1d6a54]";
  return <div className="rounded-2xl border border-[#dfe6df] bg-white p-5 shadow-[0_8px_24px_rgba(18,59,52,0.05)]"><div className={`flex size-9 items-center justify-center rounded-xl ${toneClass}`}><Icon className="size-4" /></div><p className="mt-4 text-xs font-semibold text-[#74837e]">{label}</p><p className="mt-1 font-heading text-2xl font-bold text-[#182a28]">{value}</p><p className="mt-1 text-[11px] text-[#9aa9a4]">{hint}</p></div>;
}
