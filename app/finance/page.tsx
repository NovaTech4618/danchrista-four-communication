"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { financeService } from "@/services/financeService";
import type { FinancialTransaction } from "@/types/finance";

const money = (n: number) => `₦${Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

export default function FinancePage() {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [period, setPeriod] = useState("month");
  const [message, setMessage] = useState("");

  async function load() {
    const result = await financeService.getTransactions();
    if (result.error) {
      setMessage(result.error.message);
      return;
    }
    setTransactions((result.data ?? []) as FinancialTransaction[]);
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    if (period === "all") return transactions;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    if (period === "week") start.setDate(start.getDate() - 6);
    if (period === "month") start.setDate(1);
    return transactions.filter((t) => new Date(t.occurred_at) >= start);
  }, [transactions, period]);

  const totals = filtered.reduce(
    (summary, transaction) => {
      const value = Number(transaction.amount);
      if (transaction.direction === "in") summary.in += value;
      else summary.out += value;
      return summary;
    },
    { in: 0, out: 0 },
  );

  return (
    <AppLayout>
      <main className="space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1d6a54]">Owner money book</p>
            <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-[#182a28]">Money movement</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#74837e]">
              Record money that enters or leaves Amezing. Debit and Credit have their own books.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/outstanding" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#dfe6df] bg-white px-4 text-sm font-bold text-[#123b34]">
              People who owe us
            </Link>
            <Link href="/credit" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#123b34] px-4 text-sm font-bold text-white">
              People we owe
            </Link>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <Metric label="Money in" value={money(totals.in)} />
          <Metric label="Money out" value={money(totals.out)} tone="red" />
          <Metric label="Net movement" value={money(totals.in - totals.out)} tone={totals.in - totals.out >= 0 ? "green" : "red"} />
        </section>

        {message && (
          <div className="rounded-xl border border-[#dfe6df] bg-white px-4 py-3 text-sm text-[#53635d]" role="status">
            {message}
          </div>
        )}

        <section className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-[#dfe6df] bg-white p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1d6a54]">Authoritative ledger</p>
            <h2 className="mt-1 font-heading text-lg font-bold">Where money movements come from</h2>
            <p className="mt-3 text-sm leading-6 text-[#53635d]">This screen shows the financial ledger. Staff should not create arbitrary ledger entries here because the ledger is populated by real business events.</p>
            <ul className="mt-4 space-y-2 text-sm text-[#53635d]">
              <li>• Sales and repair payments create money received.</li>
              <li>• Engineer payments and legitimate shop expenses create recorded money outflows.</li>
              <li>• Daily Closing reconciles the recorded movements against the physical cash position.</li>
            </ul>
          </section>
          <section className="rounded-2xl border border-[#dfe6df] bg-white p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1d6a54]">Quick links</p>
            <h2 className="mt-1 font-heading text-lg font-bold">Record the real event</h2>
            <div className="mt-4 grid gap-2">
              <Link href="/sales" className="rounded-xl border border-[#dfe6df] px-4 py-3 text-sm font-bold text-[#123b34] hover:bg-[#f7f8f5]">New Sale →</Link>
              <Link href="/repairs" className="rounded-xl border border-[#dfe6df] px-4 py-3 text-sm font-bold text-[#123b34] hover:bg-[#f7f8f5]">Repair payments →</Link>
              <Link href="/reports/daily-closing" className="rounded-xl border border-[#dfe6df] px-4 py-3 text-sm font-bold text-[#123b34] hover:bg-[#f7f8f5]">Daily Closing / Expenses →</Link>
            </div>
          </section>
        </section>
      </main>
    </AppLayout>
  );
}

function Metric({ label, value, tone = "green" }: { label: string; value: string; tone?: "green" | "red" }) {
  return (
    <div className="rounded-2xl border border-[#dfe6df] bg-white p-5">
      <p className="text-xs font-semibold text-[#74837e]">{label}</p>
      <p className={`mt-2 font-heading text-2xl font-bold ${tone === "red" ? "text-red-700" : "text-[#123b34]"}`}>{value}</p>
    </div>
  );
}
