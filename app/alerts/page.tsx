"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { notifyOwnerOnWhatsApp } from "@/lib/whatsapp";
import AppLayout from "@/components/layout/AppLayout";

type Alert = { id: string; alert_type: string; title: string; message: string; severity: string; entity_type: string | null; entity_id: string | null; is_read: boolean; created_at: string };
type OwnerTransaction = { id: string; event_type: "sale" | "repair"; entity_id: string; title: string; message: string; whatsapp_status: string; created_at: string };

const icon = (t: string) => t === "low_stock" ? "📦" : t === "overdue_repair" ? "🔧" : t === "customer_balance" ? "💰" : t === "supplier_payable" ? "🚚" : "🔔";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [ownerTransactions, setOwnerTransactions] = useState<OwnerTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    const { error: refreshError } = await supabase.rpc("refresh_operational_alerts");
    if (refreshError) {
      setError(refreshError.message);
      setLoading(false);
      return;
    }
    const [{ data, error: alertsError }, { data: transactionData }] = await Promise.all([
      supabase.rpc("get_operational_alerts", { p_limit: 100 }),
      supabase
        .from("owner_transaction_notifications")
        .select("id, event_type, entity_id, title, message, whatsapp_status, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    if (alertsError) setError(alertsError.message);
    setAlerts((data ?? []) as Alert[]);
    setOwnerTransactions((transactionData ?? []) as OwnerTransaction[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function markRead(id: string) {
    await supabase.from("operational_alerts").update({ is_read: true }).eq("id", id);
    setAlerts((items) => items.map((x) => x.id === id ? { ...x, is_read: true } : x));
  }

  async function markAll() {
    const unread = alerts.filter((a) => !a.is_read).map((a) => a.id);
    if (unread.length) await supabase.from("operational_alerts").update({ is_read: true }).in("id", unread);
    setAlerts((items) => items.map((x) => ({ ...x, is_read: true })));
  }

  const unread = alerts.filter((a) => !a.is_read).length;

  return <AppLayout><div className="space-y-6">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600">Operations</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Alerts & Notifications</h1><p className="mt-1 text-sm text-slate-500">Things the Boss needs to know about the shop.</p></div>
      <div className="flex gap-2"><button onClick={markAll} disabled={!unread} className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold disabled:opacity-40">Mark all read</button><button onClick={() => void load()} className="h-10 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white">Refresh</button></div>
    </header>

    <div className="grid gap-4 sm:grid-cols-4"><Card title="Total alerts" value={String(alerts.length)} /><Card title="Unread" value={String(unread)} /><Card title="Critical" value={String(alerts.filter((a) => a.severity === "critical").length)} /><Card title="Warnings" value={String(alerts.filter((a) => a.severity === "warning").length)} /></div>

    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {loading ? <p className="p-10 text-center text-sm text-slate-400">Checking alerts…</p> : error ? <div className="p-10 text-center"><p className="text-sm text-red-600">{error}</p><button onClick={() => void load()} className="mt-3 rounded-lg bg-slate-950 px-4 py-2 text-xs font-semibold text-white">Retry</button></div> : alerts.length === 0 ? <div className="p-12 text-center"><div className="text-3xl">✓</div><h2 className="mt-3 font-semibold text-slate-900">No alerts</h2><p className="mt-1 text-sm text-slate-500">There is nothing to fix right now.</p></div> : <div className="divide-y divide-slate-100">{alerts.map((a) => <div key={a.id} className={`flex gap-4 p-5 ${a.is_read ? "" : "bg-teal-50/40"}`}><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg">{icon(a.alert_type)}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-slate-900">{a.title}</h2><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${a.severity === "critical" ? "bg-red-100 text-red-700" : a.severity === "warning" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{a.severity}</span>{!a.is_read && <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold uppercase text-teal-700">New</span>}</div><p className="mt-1 text-sm text-slate-600">{a.message}</p><p className="mt-2 text-xs text-slate-400">{new Date(a.created_at).toLocaleString("en-NG")}</p></div><div className="flex shrink-0 items-start gap-2">{a.entity_type === "repair" && a.entity_id && <Link href={`/repairs/${a.entity_id}`} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Open</Link>}{a.entity_type === "inventory" && a.entity_id && <Link href="/inventory" className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Stock</Link>}{a.entity_type === "customer" && a.entity_id && <Link href={`/customers/${a.entity_id}`} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Customer</Link>}{!a.is_read && <button onClick={() => void markRead(a.id)} className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white">Read</button>}</div></div>)}</div>}
    </section>

    {ownerTransactions.length > 0 && <section className="rounded-2xl border border-teal-100 bg-white shadow-sm">
      <div className="border-b border-teal-100 bg-teal-50/60 p-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Owner only</p><h2 className="mt-1 text-lg font-bold text-slate-950">Sales & Repair</h2><p className="mt-1 text-sm text-slate-500">Messages about new sales and repairs.</p></div>
      <div className="divide-y divide-slate-100">{ownerTransactions.map((item) => <div key={item.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2"><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-600">{item.event_type}</span><h3 className="font-semibold text-slate-900">{item.title}</h3></div><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{item.message}</p><p className="mt-2 text-xs text-slate-400">{new Date(item.created_at).toLocaleString("en-NG")}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase ${item.whatsapp_status === "sent" ? "bg-emerald-100 text-emerald-700" : item.whatsapp_status === "failed" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>WhatsApp: {item.whatsapp_status}</span></div>)}</div>
    </section>}
  </div></AppLayout>;
}

function Card({ title, value }: { title: string; value: string }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p><p className="mt-2 text-2xl font-bold text-slate-950">{value}</p></div>; }
