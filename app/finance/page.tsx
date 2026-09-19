"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { financeService } from "@/services/financeService";
import type { FinancialCategory, FinancialDirection, FinancialTransaction } from "@/types/finance";

const money = (n: number) => `₦${Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
const labels: Record<string, string> = {
  sales: "Sales",
  customer_payment: "Customer payment",
  engineer_payment: "Engineer payment",
  repair_payment: "Repair payment",
  part_purchase: "Part purchase",
  salary: "Salary",
  rent: "Rent",
  utility: "Utility",
  other: "Other",
};

export default function FinancePage() {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [direction, setDirection] = useState<FinancialDirection>("out");
  const [category, setCategory] = useState<FinancialCategory>("other");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [description, setDescription] = useState("");
  const [period, setPeriod] = useState("month");
  const [saving, setSaving] = useState(false);
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

  async function submitMoney(event: FormEvent) {
    event.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0 || !description.trim()) {
      setMessage("Enter an amount and description.");
      return;
    }

    setSaving(true);
    setMessage("");
    const result = await financeService.createTransaction({
      direction,
      category,
      amount: value,
      payment_method: method,
      description,
    });

    if (result.error) {
      setMessage(result.error.message);
      setSaving(false);
      return;
    }

    setAmount("");
    setDescription("");
    setMessage("Money movement recorded.");
    await load();
    setSaving(false);
  }

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

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="overflow-hidden rounded-2xl border border-[#dfe6df] bg-white">
            <div className="flex flex-col gap-3 border-b border-[#edf0ed] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1d6a54]">Cash book</p>
                <h2 className="mt-1 font-heading text-lg font-bold text-[#182a28]">Recent money movement</h2>
              </div>
              <select value={period} onChange={(event) => setPeriod(event.target.value)} className="h-10 rounded-xl border border-[#dfe6df] bg-white px-3 text-sm">
                <option value="day">Today</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
                <option value="all">All time</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-[#f7f8f5]">
                  <tr>
                    <th className="px-5 py-3 text-[10px] uppercase tracking-wide text-[#74837e]">Date</th>
                    <th className="px-5 py-3 text-[10px] uppercase tracking-wide text-[#74837e]">Description</th>
                    <th className="px-5 py-3 text-[10px] uppercase tracking-wide text-[#74837e]">Type</th>
                    <th className="px-5 py-3 text-right text-[10px] uppercase tracking-wide text-[#74837e]">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((transaction) => (
                    <tr key={transaction.id} className="border-t border-[#edf0ed]">
                      <td className="px-5 py-4 text-xs text-[#74837e]">{new Date(transaction.occurred_at).toLocaleDateString("en-NG")}</td>
                      <td className="px-5 py-4 font-medium">{transaction.description}</td>
                      <td className="px-5 py-4 text-xs text-[#53635d]">{labels[transaction.category] ?? transaction.category}</td>
                      <td className={`px-5 py-4 text-right font-bold ${transaction.direction === "in" ? "text-emerald-700" : "text-red-700"}`}>
                        {transaction.direction === "in" ? "+" : "−"}{money(Number(transaction.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <div className="py-12 text-center text-sm text-[#74837e]">No money movement in this period.</div>}
            </div>
          </section>

          <section className="rounded-2xl border border-[#dfe6df] bg-white p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1d6a54]">Cash book entry</p>
            <h2 className="mt-1 font-heading text-lg font-bold">Record movement</h2>
            <form onSubmit={submitMoney} className="mt-5 space-y-4">
              <label className="block text-xs font-bold text-[#53635d]">
                Direction
                <select value={direction} onChange={(event) => setDirection(event.target.value as FinancialDirection)} className="mt-1 h-11 w-full rounded-xl border border-[#dfe6df] bg-white px-3 text-sm">
                  <option value="out">Money out</option>
                  <option value="in">Money in</option>
                </select>
              </label>
              <label className="block text-xs font-bold text-[#53635d]">
                Category
                <select value={category} onChange={(event) => setCategory(event.target.value as FinancialCategory)} className="mt-1 h-11 w-full rounded-xl border border-[#dfe6df] bg-white px-3 text-sm">
                  <option value="other">Other</option>
                  <option value="part_purchase">Part purchase</option>
                  <option value="salary">Salary</option>
                  <option value="rent">Rent</option>
                  <option value="utility">Utility</option>
                </select>
              </label>
              <Field label="Amount" value={amount} onChange={setAmount} placeholder="₦0" type="number" />
              <label className="block text-xs font-bold text-[#53635d]">
                Payment method
                <select value={method} onChange={(event) => setMethod(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-[#dfe6df] bg-white px-3 text-sm">
                  <option value="cash">Cash</option>
                  <option value="transfer">Transfer</option>
                  <option value="pos">POS</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <Field label="Description" value={description} onChange={setDescription} placeholder="e.g. shop electricity" />
              <button disabled={saving} className="h-11 w-full rounded-xl bg-[#123b34] px-4 text-sm font-bold text-white disabled:opacity-50">
                {saving ? "Saving…" : "Record movement"}
              </button>
            </form>
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

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string }) {
  return (
    <label className="block text-xs font-bold text-[#53635d]">
      {label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} min={type === "number" ? "0" : undefined} className="mt-1 h-11 w-full rounded-xl border border-[#dfe6df] bg-white px-3 text-sm font-normal outline-none focus:border-[#1d6a54] focus:ring-2 focus:ring-[#1d6a54]/10" />
    </label>
  );
}
