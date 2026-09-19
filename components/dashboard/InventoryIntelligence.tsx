"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Flame, PackageSearch, Timer } from "lucide-react";
import { toast } from "sonner";
import { inventoryService } from "@/services/inventoryService";
import { saleService } from "@/services/saleService";
import type { InventoryItem } from "@/types/inventory";
import type { Sale } from "@/types/sale";

function sold(sales: Sale[], id: string, days: number) {
  const cutoff = Date.now() - days * 86400000;
  return sales.reduce((sum, sale) => {
    if (new Date(sale.sale_date).getTime() < cutoff) return sum;
    return sum + (sale.sale_items || []).reduce((n, item) => n + (item.inventory_id === id ? Number(item.quantity || 0) : 0), 0);
  }, 0);
}

export default function InventoryIntelligence() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([inventoryService.getInventory(), saleService.getSales()]).then(([i, s]) => {
      if (i.error || s.error) toast.error("Could not load stock intelligence.");
      setInventory((i.data || []) as InventoryItem[]);
      setSales((s.data || []) as Sale[]);
      setLoading(false);
    });
  }, []);

  const data = useMemo(() => {
    const rows = inventory.map(item => ({ item, week: sold(sales, item.id, 7), month: sold(sales, item.id, 30) }));
    return {
      reorder: rows.filter(x => x.item.quantity <= x.item.minimum_stock).sort((a, b) => a.item.quantity - b.item.quantity),
      fast: rows.filter(x => x.month > 0).sort((a, b) => b.month - a.month).slice(0, 5),
      slow: rows.filter(x => x.item.quantity > 0 && x.month === 0).sort((a, b) => b.item.quantity - a.item.quantity).slice(0, 5),
    };
  }, [inventory, sales]);

  if (loading) return <div className="rounded-2xl border border-[#CFE3F2] bg-white p-6 text-sm text-[#62788F]">Reading stock movement…</div>;

  return <section className="rounded-2xl border border-[#CFE3F2] bg-white shadow-[0_10px_28px_rgba(18,59,52,0.06)]">
    <div className="flex flex-col gap-3 border-b border-[#E8F2FA] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0B3D91]">Inventory intelligence</p><h2 className="mt-1 font-heading text-lg font-bold text-[#102A43]">What should the owner know about stock?</h2></div>
      <Link href="/inventory" className="inline-flex items-center gap-1 text-xs font-bold text-[#0B3D91]">Open inventory <ArrowRight className="size-3" /></Link>
    </div>
    <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-3">
      <Insight title="Reorder now" icon={AlertTriangle} tone="amber" count={data.reorder.length}>{data.reorder.slice(0, 5).map(({ item }) => <Row key={item.id} name={item.item_name} detail={`${item.quantity} left · minimum ${item.minimum_stock}`} />)}{!data.reorder.length && <Empty>Nothing is below its reorder level.</Empty>}</Insight>
      <Insight title="Moving fast" icon={Flame} tone="green" count={data.fast.length}>{data.fast.map(({ item, week, month }) => <Row key={item.id} name={item.item_name} detail={`${month} sold in 30d · ${week} this week`} />)}{!data.fast.length && <Empty>No sales movement recorded yet.</Empty>}</Insight>
      <Insight title="Not moving" icon={Timer} tone="slate" count={data.slow.length}>{data.slow.map(({ item }) => <Row key={item.id} name={item.item_name} detail={`${item.quantity} in stock · 0 sold in 30d`} />)}{!data.slow.length && <Empty>Every stocked item has moved in the last 30 days.</Empty>}</Insight>
    </div>
    <div className="flex items-center gap-2 border-t border-[#E8F2FA] px-5 py-3 text-xs text-[#62788F]"><PackageSearch className="size-3.5" />Movement is calculated from recorded sales; it does not change stock by itself.</div>
  </section>;
}

function Insight({ title, icon: Icon, tone, count, children }: { title: string; icon: typeof AlertTriangle; tone: "amber" | "green" | "slate"; count: number; children: React.ReactNode }) {
  const tones = { amber: "bg-[#FFF6DC] text-[#8A641D]", green: "bg-[#EAF7FF] text-[#0B3D91]", slate: "bg-[#F2F8FC] text-[#53635e]" };
  return <div className="rounded-xl border border-[#E8F2FA] p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className={`flex size-8 items-center justify-center rounded-lg ${tones[tone]}`}><Icon className="size-4" /></span><h3 className="text-sm font-bold text-[#102A43]">{title}</h3></div><span className="rounded-full bg-[#F2F8FC] px-2 py-1 text-[11px] font-bold text-[#607A90]">{count}</span></div><div className="mt-3 space-y-2">{children}</div></div>;
}
function Row({ name, detail }: { name: string; detail: string }) { return <div className="rounded-lg bg-[#F5FAFE] px-3 py-2"><p className="truncate text-xs font-semibold text-[#263734]">{name}</p><p className="mt-0.5 text-[11px] text-[#62788F]">{detail}</p></div>; }
function Empty({ children }: { children: React.ReactNode }) { return <p className="py-3 text-xs leading-5 text-[#7A90A5]">{children}</p>; }
