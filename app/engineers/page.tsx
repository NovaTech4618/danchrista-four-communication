"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, UserRound, Wallet, Search, X } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { engineerService } from "@/services/engineerService";
import { inventoryService } from "@/services/inventoryService";
import EngineerShareStatementButton from "@/components/engineers/EngineerShareStatementButton";
import type { Engineer, EngineerBalance, EngineerTransaction, EngineerInput } from "@/types/engineer";
import type { InventoryItem } from "@/types/inventory";

const money = (value: number) => `₦${Number(value || 0).toLocaleString()}`;
const transactionLabel: Record<string, string> = {
  parts_out: "Parts collected",
  parts_in: "Parts returned",
  payment_in: "Payment received",
  payment_out: "Payment to engineer",
  opening_balance: "Opening balance",
  adjustment_debit: "Debit adjustment",
  adjustment_credit: "Credit adjustment",
  faulty_return: "Faulty part returned",
  replacement: "Faulty-part replacement",
};

const emptyEngineer: EngineerInput = { name: "", phone: "", business_name: "", address: "", notes: "" };
type Action = "parts" | "return" | "replacement" | "payment" | "payment-out" | "opening" | null;
type Period = "all" | "day" | "week" | "month" | "year";

function periodStart(period: Period) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (period === "day") return start;
  if (period === "week") {
    const day = start.getDay();
    start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
    return start;
  }
  if (period === "month") {
    start.setDate(1);
    return start;
  }
  if (period === "year") {
    start.setMonth(0, 1);
    return start;
  }
  return null;
}

export default function EngineersPage() {
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [balances, setBalances] = useState<EngineerBalance[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [transactions, setTransactions] = useState<EngineerTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [action, setAction] = useState<Action>(null);
  const [period, setPeriod] = useState<Period>("all");
  const [engineerSearch, setEngineerSearch] = useState("");
  const [accountFilter, setAccountFilter] = useState<"all" | "owing" | "clear" | "inactive">("all");
  const [showEngineerForm, setShowEngineerForm] = useState(false);
  const [editingEngineer, setEditingEngineer] = useState<Engineer | null>(null);
  const [engineerForm, setEngineerForm] = useState<EngineerInput>(emptyEngineer);
  const [inventoryId, setInventoryId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [returnCondition, setReturnCondition] = useState<"normal" | "faulty">("normal");
  const [faultyReturnId, setFaultyReturnId] = useState("");

  const balanceMap = useMemo(() => new Map(balances.map((item) => [item.engineer_id, item])), [balances]);
  const selectedEngineer = engineers.find((engineer) => engineer.id === selectedId);
  const visibleEngineers = useMemo(() => {
    const q = engineerSearch.trim().toLowerCase();
    return engineers.filter((engineer) => {
      const balance = Number(balanceMap.get(engineer.id)?.balance ?? 0);
      const text = [engineer.name, engineer.phone, engineer.business_name].filter(Boolean).join(" ").toLowerCase();
      const matchesSearch = !q || text.includes(q);
      const matchesFilter = accountFilter === "all"
        || (accountFilter === "owing" && balance > 0)
        || (accountFilter === "clear" && balance <= 0 && engineer.status === "active")
        || (accountFilter === "inactive" && engineer.status === "inactive");
      return matchesSearch && matchesFilter;
    });
  }, [engineers, balanceMap, engineerSearch, accountFilter]);
  const selectedBalance = selectedId ? balanceMap.get(selectedId) : undefined;

  const filteredTransactions = useMemo(() => {
    const start = periodStart(period);
    if (!start) return transactions;
    return transactions.filter((transaction) => new Date(transaction.transaction_date) >= start);
  }, [transactions, period]);

  const debitTransactions = useMemo(
    () => filteredTransactions.filter((transaction) => Number(transaction.debit) > 0),
    [filteredTransactions],
  );

  const debitTotal = useMemo(
    () => debitTransactions.reduce((sum, transaction) => sum + Number(transaction.debit || 0), 0),
    [debitTransactions],
  );

  const periodLabel = period === "all" ? "All time" : period === "day" ? "Today" : period === "week" ? "This week" : period === "month" ? "This month" : "This year";

  async function load() {
    setLoading(true);
    setError("");
    const [engineersRes, balancesRes, inventoryRes] = await Promise.all([
      engineerService.getEngineers(),
      engineerService.getBalances(),
      inventoryService.getInventory(),
    ]);
    if (engineersRes.error) setError(engineersRes.error.message);
    else setEngineers((engineersRes.data ?? []) as Engineer[]);
    if (balancesRes.error) setError(balancesRes.error.message);
    else setBalances((balancesRes.data ?? []) as EngineerBalance[]);
    if (inventoryRes.error) setError(inventoryRes.error.message);
    else setInventory((inventoryRes.data ?? []) as InventoryItem[]);
    setLoading(false);
  }

  async function selectEngineer(id: string) {
    setSelectedId(id);
    setAction(null);
    setMessage("");
    setError("");
    setDetailLoading(true);
    const result = await engineerService.getTransactions(id);
    if (result.error) setError(result.error.message);
    else setTransactions((result.data ?? []) as EngineerTransaction[]);
    setDetailLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  function resetAction() {
    setAction(null);
    setInventoryId("");
    setQuantity(1);
    setUnitPrice("");
    setAmount("");
    setPaymentMethod("cash");
    setNotes("");
    setReturnCondition("normal");
    setFaultyReturnId("");
  }

  function openCreate() {
    setEditingEngineer(null);
    setEngineerForm(emptyEngineer);
    setShowEngineerForm(true);
    setError("");
    setMessage("");
  }

  function openEdit(engineer: Engineer) {
    setEditingEngineer(engineer);
    setEngineerForm({
      name: engineer.name,
      phone: engineer.phone ?? "",
      business_name: engineer.business_name ?? "",
      address: engineer.address ?? "",
      notes: engineer.notes ?? "",
    });
    setShowEngineerForm(true);
    setError("");
    setMessage("");
  }

  async function submitEngineer(event: React.FormEvent) {
    event.preventDefault();
    if (!engineerForm.name?.trim()) {
      setError("Engineer name is required.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    const result = editingEngineer
      ? await engineerService.updateEngineer(editingEngineer.id, engineerForm)
      : await engineerService.createEngineer(engineerForm);
    if (result.error) {
      setError(result.error.message);
      setSaving(false);
      return;
    }
    const saved = result.data as Engineer;
    setShowEngineerForm(false);
    setEngineerForm(emptyEngineer);
    setMessage(editingEngineer ? "Engineer updated successfully." : "Engineer added successfully.");
    await load();
    if (saved?.id) await selectEngineer(saved.id);
    setSaving(false);
  }

  async function toggleStatus(engineer: Engineer) {
    const nextStatus = engineer.status === "active" ? "inactive" : "active";
    setSaving(true);
    setError("");
    setMessage("");
    const result = await engineerService.setEngineerStatus(engineer.id, nextStatus);
    if (result.error) setError(result.error.message);
    else {
      setMessage(`${engineer.name} is now ${nextStatus}.`);
      await load();
    }
    setSaving(false);
  }

  async function submitAction(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedId || !action) return;
    setSaving(true);
    setError("");
    setMessage("");

    let result;
    if (action === "parts" || action === "return" || action === "replacement") {
      if (!inventoryId || quantity < 1) {
        setError("Select a part and enter a valid quantity.");
        setSaving(false);
        return;
      }
      if (action === "replacement") {
        if (!faultyReturnId) { setError("Select the faulty return this replacement is for."); setSaving(false); return; }
        result = await engineerService.recordReplacement(faultyReturnId, inventoryId, quantity, notes.trim() || null);
      } else if (action === "parts") {
        const price = Number(unitPrice);
        if (!Number.isFinite(price) || price < 0) { setError("Enter a valid unit price."); setSaving(false); return; }
        result = await engineerService.recordPartsOut(selectedId, inventoryId, quantity, price, notes.trim() || null);
      } else {
        result = await engineerService.recordPartsIn(selectedId, inventoryId, quantity, returnCondition, notes.trim() || null);
      }
    } else if (action === "payment" || action === "payment-out") {
      const value = Number(amount);
      if (!Number.isFinite(value) || value <= 0) {
        setError("Enter a valid payment amount.");
        setSaving(false);
        return;
      }
      result = action === "payment"
        ? await engineerService.recordPaymentIn(selectedId, value, paymentMethod, notes.trim() || null)
        : await engineerService.recordPaymentOut(selectedId, value, paymentMethod, notes.trim() || null);
    } else {
      const value = Number(amount);
      if (!Number.isFinite(value) || value <= 0) {
        setError("Enter a valid opening balance.");
        setSaving(false);
        return;
      }
      result = await engineerService.recordOpeningBalance(selectedId, value, notes.trim() || null);
    }

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
      return;
    }

    const successMessage =
      action === "parts"
        ? "Parts collection recorded successfully."
        : action === "return"
          ? returnCondition === "faulty" ? "Faulty return recorded. It was kept out of sellable stock and credited back to the engineer." : "Parts return recorded successfully. Inventory and engineer balance have been updated."
          : action === "replacement"
            ? "Replacement recorded. No extra engineer debt was created."
          : action === "payment"
            ? "Payment received from engineer recorded successfully."
            : action === "payment-out"
              ? "Payment to engineer recorded successfully. Engineer balance has been updated."
              : "Opening balance recorded successfully.";
    setMessage(successMessage);
    resetAction();
    await Promise.all([load(), selectEngineer(selectedId)]);
    setSaving(false);
  }

  function downloadDebitPdf() {
    if (!selectedEngineer || debitTransactions.length === 0) {
      setMessage("There are no debit transactions in the selected period to export.");
      return;
    }
    window.print();
  }

  const actionLabels: Record<NonNullable<Action>, string> = {
    parts: "Record parts collected",
    return: "Record parts returned",
    payment: "Receive payment",
    "payment-out": "Pay engineer",
    replacement: "Issue replacement for faulty part",
    opening: "Opening balance",
  };

  const inputClass = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15";

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-4 p-1">
          <div className="h-8 w-48 animate-pulse rounded bg-slate-100" />
          <div className="h-36 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          .engineer-debit-report, .engineer-debit-report * { visibility: visible !important; }
          .engineer-debit-report { position: absolute; inset: 0; width: 100%; padding: 24px; background: white; color: black; }
          @page { margin: 12mm; }
        }
      `}</style>

      <div className="space-y-7">
        <header className="flex flex-wrap items-start justify-between gap-4 print:hidden">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600">Workshop operations</p>
            <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-slate-950">Engineers</h1>
            <p className="mt-1 text-sm text-slate-500">Track contract technicians, parts collected, returns and payments.</p>
          </div>
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:border-teal-200 hover:text-teal-700">
            <ArrowLeft className="size-4" /> Back to dashboard
          </Link>
        </header>

        {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 print:hidden">{error}</div>}
        {message && <div className="rounded-xl border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800 print:hidden">{message}</div>}

        <section className="engineer-debit-report hidden print:block">
          <div className="mb-6 border-b pb-4">
            <h1 className="text-2xl font-bold">AMEZING — Engineer Debit Statement</h1>
            <p className="mt-1 text-lg font-semibold">Engineer: {selectedEngineer?.name ?? ""}</p>
            <p>Period: {periodLabel}</p>
            {selectedEngineer?.phone && <p>Phone: {selectedEngineer.phone}</p>}
          </div>
          <div className="mb-5 grid grid-cols-3 gap-4">
            <div className="rounded border p-3"><p className="text-xs">Debit transactions</p><p className="text-xl font-bold">{debitTransactions.length}</p></div>
            <div className="rounded border p-3"><p className="text-xs">Period debit</p><p className="text-xl font-bold">{money(debitTotal)}</p></div>
            <div className="rounded border p-3"><p className="text-xs">Current outstanding balance</p><p className="text-xl font-bold">{money(Number(selectedBalance?.balance ?? 0))}</p></div>
          </div>
          <table className="w-full border-collapse text-sm">
            <thead><tr className="border-b-2"><th className="p-2 text-left">Date</th><th className="p-2 text-left">Description</th><th className="p-2 text-left">Type</th><th className="p-2 text-right">Debit</th></tr></thead>
            <tbody>{debitTransactions.map((transaction) => <tr key={transaction.id} className="border-b"><td className="p-2">{new Date(transaction.transaction_date).toLocaleDateString()}</td><td className="p-2">{transaction.description}</td><td className="p-2">{transactionLabel[transaction.transaction_type] ?? transaction.transaction_type}</td><td className="p-2 text-right">{money(Number(transaction.debit))}</td></tr>)}</tbody>
          </table>
          <div className="mt-8 border-t pt-4 text-xs">Generated from AMEZING Repair Suite • {new Date().toLocaleString()}</div>
        </section>

        {showEngineerForm && (
          <Card className="border-slate-200 shadow-sm print:hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-heading text-lg">{editingEngineer ? "Edit engineer" : "Add engineer"}</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">Account history is preserved when an engineer is deactivated.</p>
                </div>
                <button type="button" onClick={() => setShowEngineerForm(false)} className="text-sm font-medium text-slate-500 hover:text-slate-800">Cancel</button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitEngineer}>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700">Name *<input required value={engineerForm.name ?? ""} onChange={(e) => setEngineerForm({ ...engineerForm, name: e.target.value })} className={inputClass} /></label>
                  <label className="text-sm font-medium text-slate-700">Phone<input value={engineerForm.phone ?? ""} onChange={(e) => setEngineerForm({ ...engineerForm, phone: e.target.value })} className={inputClass} /></label>
                  <label className="text-sm font-medium text-slate-700">Business name<input value={engineerForm.business_name ?? ""} onChange={(e) => setEngineerForm({ ...engineerForm, business_name: e.target.value })} className={inputClass} /></label>
                  <label className="text-sm font-medium text-slate-700">Address<input value={engineerForm.address ?? ""} onChange={(e) => setEngineerForm({ ...engineerForm, address: e.target.value })} className={inputClass} /></label>
                  <label className="text-sm font-medium text-slate-700 md:col-span-2">Notes<textarea value={engineerForm.notes ?? ""} onChange={(e) => setEngineerForm({ ...engineerForm, notes: e.target.value })} rows={2} className={inputClass} /></label>
                </div>
                <Button disabled={saving} type="submit" className="mt-4">{saving ? "Saving..." : editingEngineer ? "Save changes" : "Add engineer"}</Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] print:hidden">
          <Card className="border-slate-200 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5">
              <div>
                <CardTitle className="font-heading text-lg">Engineer accounts</CardTitle>
                <p className="mt-1 text-sm text-slate-500">Balance = debit minus credit.</p>
              </div>
              <Button size="sm" onClick={openCreate}><Plus className="size-4" /> Add engineer</Button>
            </div>
            <div className="divide-y divide-slate-100">
              {engineers.length === 0 ? (
                <div className="flex flex-col items-center gap-2 p-10 text-center text-slate-500">
                  <UserRound className="size-6 text-slate-300" />
                  {engineers.length === 0 ? "No engineers found." : "No engineers match this search or filter."}
                </div>
              ) : visibleEngineers.map((engineer) => {
                const balance = balanceMap.get(engineer.id);
                const owing = Number(balance?.balance ?? 0) > 0;
                return (
                  <div key={engineer.id} className={`p-4 transition ${selectedId === engineer.id ? "bg-teal-50/60" : "hover:bg-slate-50"}`}>
                    <div className="flex items-start gap-3">
                      <button type="button" onClick={() => void selectEngineer(engineer.id)} className="min-w-0 flex-1 text-left">
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">{engineer.name}</p>
                            <p className="truncate text-sm text-slate-500">{engineer.phone || engineer.business_name || "No contact details"}</p>
                          </div>
                          <span className={`font-heading font-bold ${owing ? "text-rose-600" : "text-slate-900"}`}>{money(Number(balance?.balance ?? 0))}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                          <Badge variant={engineer.status === "active" ? "secondary" : "outline"} className="capitalize">{engineer.status}</Badge>
                          <span>{Number(balance?.total_debit ?? 0) > 0 ? `${money(Number(balance?.total_debit))} debits` : "No activity"}</span>
                        </div>
                      </button>
                      <div className="flex shrink-0 gap-1.5">
                        <button type="button" onClick={() => openEdit(engineer)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">Edit</button>
                        <button disabled={saving} type="button" onClick={() => void toggleStatus(engineer)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">{engineer.status === "active" ? "Deactivate" : "Activate"}</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            {!selectedEngineer ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center gap-2 p-8 text-center text-slate-500">
                <Wallet className="size-6 text-slate-300" />
                Select an engineer to view their ledger.
              </div>
            ) : (
              <>
                <div className="border-b border-slate-100 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="font-heading text-xl font-semibold text-slate-950">{selectedEngineer.name}</h2>
                      <p className="text-sm text-slate-500">{selectedEngineer.phone || "No phone number"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Current balance</p>
                      <p className={`font-heading text-2xl font-bold ${Number(selectedBalance?.balance ?? 0) > 0 ? "text-rose-600" : "text-slate-950"}`}>{money(Number(selectedBalance?.balance ?? 0))}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => setAction("parts")}>Record parts collected</Button>
                    <Button size="sm" variant="outline" onClick={() => setAction("return")}>Record parts returned</Button>
                    <Button size="sm" variant="outline" onClick={() => setAction("replacement")}>Replace faulty part</Button>
                    <Button size="sm" variant="outline" onClick={() => setAction("payment")}>Receive payment</Button>
                    <Button size="sm" variant="outline" onClick={() => setAction("payment-out")}>Pay engineer</Button>
                    <Button size="sm" variant="outline" onClick={() => setAction("opening")}>Opening balance</Button>
                  </div>
                  <div className="mt-3"><EngineerShareStatementButton engineer={selectedEngineer} balance={selectedBalance} transactions={filteredTransactions} /></div>
                </div>

                {action && (
                  <form onSubmit={submitAction} className="border-b border-slate-100 bg-slate-50/60 p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-heading font-semibold text-slate-900">{actionLabels[action]}</h3>
                        {action === "return" && <p className="mt-1 text-xs text-slate-500">Normal return goes back to sellable stock. Faulty return is kept separately and does not increase sellable stock.</p>}
                        {action === "replacement" && <p className="mt-1 text-xs text-slate-500">A replacement consumes stock but adds ₦0 debt to the engineer and links back to the faulty return.</p>}
                        {action === "payment-out" && <p className="mt-1 text-xs text-slate-500">This records money paid by the shop to the engineer and reduces the engineer&apos;s outstanding balance.</p>}
                        {action === "payment-out" && <p className="mt-1 text-xs text-slate-500">This records money paid by the shop to the engineer and reduces the engineer&apos;s outstanding balance.</p>}
                      </div>
                      <button type="button" onClick={resetAction} className="text-sm font-medium text-slate-500 hover:text-slate-800">Cancel</button>
                    </div>

                    {(action === "parts" || action === "return" || action === "replacement") ? (
                      <div className="grid gap-4 md:grid-cols-3">
                        <label className="text-sm font-medium text-slate-700 md:col-span-2">Part
                          <select value={inventoryId} onChange={(e) => { setInventoryId(e.target.value); const item = inventory.find((x) => x.id === e.target.value); setUnitPrice(item ? String(item.selling_price) : ""); }} className={inputClass}>
                            <option value="">Select part</option>
                            {inventory.map((item) => <option key={item.id} value={item.id}>{item.item_name} — {money(item.selling_price)} (stock: {item.quantity})</option>)}
                          </select>
                        </label>
                        <label className="text-sm font-medium text-slate-700">Quantity<input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className={inputClass} /></label>
                        {action === "return" && <label className="text-sm font-medium text-slate-700">Condition<select value={returnCondition} onChange={(e) => setReturnCondition(e.target.value as "normal" | "faulty")} className={inputClass}><option value="normal">Normal — back to stock</option><option value="faulty">Faulty — keep separate</option></select></label>}
                        {action === "parts" && <label className="text-sm font-medium text-slate-700">Unit price<input type="number" min="0" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className={inputClass} /></label>}
                        {action === "replacement" && <label className="text-sm font-medium text-slate-700 md:col-span-2">Faulty return<select required value={faultyReturnId} onChange={(e) => setFaultyReturnId(e.target.value)} className={inputClass}><option value="">Select the faulty return</option>{transactions.filter((t) => t.transaction_type === "faulty_return").map((t) => <option key={t.reference_id ?? t.id} value={t.reference_id ?? ""}>{t.description} · {new Date(t.transaction_date).toLocaleDateString()}</option>)}</select></label>}
                        <label className="text-sm font-medium text-slate-700 md:col-span-2">Notes<input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" className={inputClass} /></label>
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="text-sm font-medium text-slate-700">Amount<input required type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className={inputClass} /></label>
                        {(action === "payment" || action === "payment-out") && (
                          <label className="text-sm font-medium text-slate-700">Payment method
                            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputClass}>
                              <option value="cash">Cash</option>
                              <option value="transfer">Transfer</option>
                              <option value="pos">POS</option>
                              <option value="other">Other</option>
                            </select>
                          </label>
                        )}
                        <label className="text-sm font-medium text-slate-700 md:col-span-2">Notes<input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" className={inputClass} /></label>
                      </div>
                    )}

                    <Button disabled={saving} type="submit" className="mt-4">{saving ? "Saving..." : action === "payment-out" ? "Record payment to engineer" : action === "payment" ? "Record payment received" : "Save transaction"}</Button>
                  </form>
                )}

                <div className="p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-heading font-semibold text-slate-900">Transaction history</h3>
                      <span className="text-sm text-slate-500">{filteredTransactions.length} of {transactions.length} transactions</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <select aria-label="Filter transaction period" value={period} onChange={(e) => setPeriod(e.target.value as Period)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500">
                        <option value="all">All time</option>
                        <option value="day">Today</option>
                        <option value="week">This week</option>
                        <option value="month">This month</option>
                        <option value="year">This year</option>
                      </select>
                      <button type="button" onClick={downloadDebitPdf} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:border-teal-200 hover:text-teal-700">Download debit PDF</button>
                    </div>
                  </div>

                  <div className="mb-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"><p className="text-xs text-slate-500">Period</p><p className="font-heading font-semibold text-slate-900">{periodLabel}</p></div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"><p className="text-xs text-slate-500">Period debits</p><p className="font-heading font-semibold text-slate-900">{money(debitTotal)}</p></div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"><p className="text-xs text-slate-500">Current balance</p><p className="font-heading font-semibold text-slate-900">{money(Number(selectedBalance?.balance ?? 0))}</p></div>
                  </div>

                  {detailLoading ? (
                    <p className="py-8 text-center text-slate-500">Loading ledger...</p>
                  ) : filteredTransactions.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center text-slate-500">No transactions in this period.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-3 py-3 text-left">Date</th>
                            <th className="px-3 py-3 text-left">Description</th>
                            <th className="px-3 py-3 text-left">Type</th>
                            <th className="px-3 py-3 text-right">Debit</th>
                            <th className="px-3 py-3 text-right">Credit</th>
                            <th className="px-3 py-3 text-right">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...filteredTransactions].reverse().map((transaction, index, chronological) => {
                            const running = chronological.slice(0, index + 1).reduce((sum, row) => sum + Number(row.debit) - Number(row.credit), 0);
                            return (
                              <tr key={transaction.id} className="border-t border-slate-100">
                                <td className="whitespace-nowrap px-3 py-3 text-slate-600">{new Date(transaction.transaction_date).toLocaleDateString()}</td>
                                <td className="px-3 py-3 text-slate-700">{transaction.description}</td>
                                <td className="px-3 py-3 text-slate-500">{transactionLabel[transaction.transaction_type] ?? transaction.transaction_type}</td>
                                <td className="px-3 py-3 text-right text-slate-700">{Number(transaction.debit) ? money(Number(transaction.debit)) : "—"}</td>
                                <td className="px-3 py-3 text-right text-slate-700">{Number(transaction.credit) ? money(Number(transaction.credit)) : "—"}</td>
                                <td className="px-3 py-3 text-right font-semibold text-slate-900">{money(running)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
