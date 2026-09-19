"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, UserRound, Smartphone, X } from "lucide-react";
import { engineerService } from "@/services/engineerService";
import { supabase } from "@/lib/supabase";
import type { InventoryItem } from "@/types/inventory";

type Engineer = { id: string; name: string; status: string; phone?: string | null; business_name?: string | null };

function isPhonePart(item: InventoryItem) {
  return item.item_type === "part" || item.category === "Phone Parts";
}

function modelTokens(item: InventoryItem) {
  return (item.compatible_models || "").split(/[,|/;]+/).map(function (v) { return v.trim(); }).filter(Boolean);
}

function matches(item: InventoryItem, query: string) {
  var q = query.trim().toLowerCase();
  if (!q) return true;
  return [item.item_name, item.brand, item.compatible_models, item.subcategory, item.sku]
    .filter(Boolean).join(" ").toLowerCase().includes(q);
}

function money(n: number) {
  return "₦" + Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });
}

export default function EngineerPartIssuePanel({ items, onSaved }: { items: InventoryItem[]; onSaved: () => void }) {
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [engineerId, setEngineerId] = useState("");
  const [engineerSearch, setEngineerSearch] = useState("");
  const [partSearch, setPartSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");
  const [inventoryId, setInventoryId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [openEngineer, setOpenEngineer] = useState(false);
  const [openPart, setOpenPart] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(function () {
    engineerService.getEngineers().then(function (result) {
      setEngineers(((result.data || []) as Engineer[]).filter(function (e) { return e.status === "active"; }));
    });
  }, []);

  const selectedEngineer = engineers.find(function (e) { return e.id === engineerId; });
  const selectedPart = items.find(function (i) { return i.id === inventoryId; });
  const parts = useMemo(function () { return items.filter(isPhonePart).filter(function (i) { return Number(i.quantity) > 0; }); }, [items]);

  const engineerResults = useMemo(function () {
    var q = engineerSearch.trim().toLowerCase();
    return engineers.filter(function (e) {
      return !q || [e.name, e.phone, e.business_name].filter(Boolean).join(" ").toLowerCase().includes(q);
    }).slice(0, 8);
  }, [engineers, engineerSearch]);

  const modelResults = useMemo(function () {
    var q = modelSearch.trim().toLowerCase();
    var seen = new Set<string>();
    var result: string[] = [];
    parts.forEach(function (item) {
      modelTokens(item).forEach(function (model) {
        var key = model.toLowerCase();
        if (!seen.has(key) && (!q || key.includes(q))) {
          seen.add(key);
          result.push(model);
        }
      });
    });
    return result.slice(0, 20);
  }, [parts, modelSearch]);

  const partResults = useMemo(function () {
    return parts.filter(function (item) {
      return (!modelSearch || matches(item, modelSearch)) && (!partSearch || matches(item, partSearch));
    }).slice(0, 30);
  }, [parts, modelSearch, partSearch]);

  function chooseEngineer(e: Engineer) {
    setEngineerId(e.id);
    setEngineerSearch(e.name);
    setOpenEngineer(false);
  }

  function choosePart(item: InventoryItem) {
    setInventoryId(item.id);
    setPartSearch(item.item_name);
    setUnitPrice(String(item.selling_price || 0));
    setOpenPart(false);
  }

  async function submit() {
    if (!engineerId || !inventoryId) return;
    var qty = Number(quantity);
    var price = Number(unitPrice);
    if (!Number.isInteger(qty) || qty < 1) return setMessage("Enter a valid quantity.");
    if (!Number.isFinite(price) || price < 0) return setMessage("Enter a valid part price.");
    if (selectedPart && qty > Number(selectedPart.quantity)) return setMessage("Not enough stock available.");
    setBusy(true);
    setMessage("");
    var result = await engineerService.recordPartsOut(engineerId, inventoryId, qty, price, notes || null);
    if (result.error) {
      setMessage(result.error.message || "Could not record the part.");
    } else {
      setMessage("Part collected. Stock was reduced and the engineer debit was recorded.");
      setQuantity("1");
      setNotes("");
      onSaved();
    }
    setBusy(false);
  }

  return (
    <section className="rounded-2xl border border-[#dfe6df] bg-white p-5 shadow-[0_10px_28px_rgba(18,59,52,0.08)]">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1d6a54]">Engineer parts</p>
        <h2 className="mt-1 text-xl font-bold text-[#182a28]">Issue phone part</h2>
        <p className="mt-1 text-sm text-[#74837e]">Pick the engineer and part without typing long names. Payment is separate, so this can be issued at ₦0 paid.</p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="relative">
          <label className="mb-1.5 block text-xs font-bold text-[#285c4d]">Engineer</label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#1d6a54]" />
            <input value={engineerSearch} onChange={function (e) { setEngineerSearch(e.target.value); setEngineerId(""); setOpenEngineer(true); }} onFocus={function () { setOpenEngineer(true); }} placeholder="Type 1–2 letters, e.g. ay" className="h-11 w-full rounded-xl border border-[#dfe6df] pl-10 pr-10 text-sm outline-none focus:border-[#1d6a54] focus:ring-2 focus:ring-[#1d6a54]/10" />
            {engineerSearch && <button type="button" onClick={function () { setEngineerSearch(""); setEngineerId(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#74837e]"><X className="size-4" /></button>}
          </div>
          {openEngineer && !engineerId && (
            <div className="absolute z-30 mt-1 max-h-64 w-[calc(100%-2.5rem)] overflow-auto rounded-xl border border-[#dfe6df] bg-white p-1 shadow-xl">
              {engineerResults.length ? engineerResults.map(function (e) {
                return <button type="button" key={e.id} onClick={function () { chooseEngineer(e); }} className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-[#f6f1e9]">
                  <span><span className="block text-sm font-semibold text-[#182a28]">{e.name}</span><span className="text-xs text-[#74837e]">{e.business_name || e.phone || "Active engineer"}</span></span>
                  <span className="text-xs font-bold text-[#1d6a54]">Select</span>
                </button>;
              }) : <p className="px-3 py-4 text-sm text-[#74837e]">No active engineer found.</p>}
            </div>
          )}
          {selectedEngineer && <p className="mt-2 rounded-lg bg-[#f6f1e9] px-3 py-2 text-xs font-semibold text-[#1d6a54]">Selected: {selectedEngineer.name}</p>}
        </div>

        <div className="relative">
          <label className="mb-1.5 block text-xs font-bold text-[#285c4d]">Model / model number</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#1d6a54]" />
            <input value={modelSearch} onChange={function (e) { setModelSearch(e.target.value); setPartSearch(""); setInventoryId(""); }} placeholder="Try A15, C55, 13…" className="h-11 w-full rounded-xl border border-[#dfe6df] pl-10 text-sm outline-none focus:border-[#1d6a54] focus:ring-2 focus:ring-[#1d6a54]/10" />
          </div>
          {modelSearch && <div className="mt-2 flex flex-wrap gap-2">{modelResults.map(function (model) {
            return <button type="button" key={model} onClick={function () { setModelSearch(model); setPartSearch(""); setInventoryId(""); setOpenPart(true); }} className="rounded-full border border-[#63a28d] bg-white px-3 py-1.5 text-xs font-semibold text-[#1d6a54] hover:bg-[#f6f1e9]">{model}</button>;
          })}</div>}
        </div>
      </div>

      <div className="relative mt-4">
        <label className="mb-1.5 block text-xs font-bold text-[#285c4d]">Phone part</label>
        <div className="relative">
          <Smartphone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#1d6a54]" />
          <input value={partSearch} onChange={function (e) { setPartSearch(e.target.value); setInventoryId(""); setOpenPart(true); }} onFocus={function () { setOpenPart(true); }} placeholder="Search charging flex, downboard, back glass, model number…" className="h-11 w-full rounded-xl border border-[#dfe6df] pl-10 text-sm outline-none focus:border-[#1d6a54] focus:ring-2 focus:ring-[#1d6a54]/10" />
        </div>
        {openPart && (
          <div className="absolute z-20 mt-1 max-h-80 w-full overflow-auto rounded-xl border border-[#dfe6df] bg-white p-1 shadow-xl">
            {partResults.length ? partResults.map(function (item) {
              return <button type="button" key={item.id} onClick={function () { choosePart(item); }} className="flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-[#f6f1e9]">
                <span className="min-w-0"><span className="block truncate text-sm font-semibold text-[#182a28]">{item.item_name}</span><span className="block text-xs text-[#74837e]">{item.brand || "Other"}{item.compatible_models ? " · " + item.compatible_models : ""} · {item.subcategory || "Phone part"}</span></span>
                <span className="shrink-0 text-right"><span className="block text-xs font-bold text-[#1d6a54]">{item.quantity} in stock</span><span className="text-xs text-[#74837e]">{money(item.selling_price)}</span></span>
              </button>;
            }) : <p className="px-3 py-4 text-sm text-[#74837e]">No phone part matches. Try a shorter model number.</p>}
          </div>
        )}
      </div>

      {selectedPart && (
        <div className="mt-3 rounded-xl border border-[#d7a95a] bg-[#f6f1e9] p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[#1d6a54]">Selected part</p>
          <p className="mt-1 font-semibold text-[#182a28]">{selectedPart.item_name}</p>
          <p className="text-xs text-[#74837e]">{selectedPart.brand || "Other"}{selectedPart.compatible_models ? " · " + selectedPart.compatible_models : ""}</p>
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <input type="number" min="1" max={selectedPart ? selectedPart.quantity : undefined} value={quantity} onChange={function (e) { setQuantity(e.target.value); }} placeholder="Quantity" className="h-11 rounded-xl border border-[#dfe6df] px-3 text-sm" />
        <input type="number" min="0" value={unitPrice} onChange={function (e) { setUnitPrice(e.target.value); }} placeholder="Part price / unit" className="h-11 rounded-xl border border-[#dfe6df] px-3 text-sm" />
        <input value={notes} onChange={function (e) { setNotes(e.target.value); }} placeholder="Optional note" className="h-11 rounded-xl border border-[#dfe6df] px-3 text-sm" />
      </div>

      {message && <p className="mt-3 rounded-xl bg-[#f6f1e9] px-3 py-2.5 text-xs font-semibold text-[#1d6a54]">{message}</p>}
      <button type="button" disabled={busy || !engineerId || !inventoryId} onClick={submit} className="mt-3 h-11 w-full rounded-xl bg-[#1d6a54] px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
        {busy ? "Recording…" : "Record part collected · payment can be ₦0"}
      </button>
      <p className="mt-2 text-center text-[11px] text-[#74837e]">This records stock out + engineer debit. Engineer payment is recorded separately in the ledger.</p>
    </section>
  );
}
