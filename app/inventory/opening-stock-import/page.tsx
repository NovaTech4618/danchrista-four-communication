"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileSpreadsheet, Upload, CheckCircle2, AlertTriangle } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { inventoryService } from "@/services/inventoryService";
import { staffService } from "@/services/staffService";
import type { InventoryItem } from "@/types/inventory";

const ANDROID_BRANDS = ["itel", "Infinix", "Tecno", "Redmi", "Huawei", "Oppo", "Vivo", "Gionee", "Nokia"];
const PHONE_PARTS: Record<string, string[]> = {
  iPhone: ["Charging Flex", "Earpiece Flex", "Back Glass", "Home Button"],
  Samsung: ["Down Board", "Power Flex"],
  ...Object.fromEntries(ANDROID_BRANDS.map((brand) => [brand, ["Down Board", "Power Flex"]])),
};
const CSV_HEADERS = [
  "inventory_id",
  "item_name",
  "brand",
  "subcategory",
  "compatible_models",
  "physical_quantity",
  "cost_price",
  "selling_price",
  "minimum_selling_price",
  "minimum_stock",
];

type StockRow = {
  line: number;
  item: InventoryItem;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  minimumSellingPrice: number;
  minimumStock: number;
};
type ImportIssue = { line: number; item: string; reason: string };

function isTrackedPhonePart(item: InventoryItem) {
  if (item.category !== "Phone Parts" || !item.brand || item.subcategory === "Screen Guard") return false;
  return Boolean(PHONE_PARTS[item.brand]?.includes(item.subcategory || ""));
}
function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}
function toCsv(rows: unknown[][]) {
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    const next = source[i + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i++;
      row.push(cell.trim());
      cell = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else {
      cell += char;
    }
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  if (quoted) throw new Error("The CSV has an unfinished quoted field. Re-save it as CSV and try again.");
  return rows;
}
function downloadCsv(filename: string, rows: unknown[][]) {
  const blob = new Blob(["\uFEFF" + toCsv(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function OpeningStockImportPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [summary, setSummary] = useState("");
  const [issues, setIssues] = useState<ImportIssue[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const [roleResult, inventoryResult] = await Promise.all([
        staffService.getMyRole(),
        inventoryService.getInventory(),
      ]);
      if (!active) return;
      setRole(roleResult.data ?? null);
      if (inventoryResult.error) setLoadError(inventoryResult.error.message || "Phone parts could not be loaded.");
      else setItems((inventoryResult.data ?? []) as InventoryItem[]);
      setLoading(false);
    }
    void load().catch((error: unknown) => {
      if (!active) return;
      setLoadError(error instanceof Error ? error.message : "The opening-stock catalogue could not be loaded.");
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const trackedParts = useMemo(() => items.filter(isTrackedPhonePart), [items]);
  const zeroStockParts = useMemo(
    () => trackedParts.filter((item) => Number(item.quantity || 0) === 0),
    [trackedParts],
  );

  function downloadTemplate() {
    const rows: unknown[][] = [CSV_HEADERS];
    zeroStockParts.forEach((item) => {
      const selling = Number(item.selling_price || 0);
      rows.push([
        item.id,
        item.item_name,
        item.brand || "",
        item.subcategory || "",
        item.compatible_models || "",
        "",
        Number(item.cost_price || 0) > 0 ? item.cost_price : "",
        selling > 0 ? item.selling_price : "",
        selling > 0 ? item.minimum_selling_price : "",
        item.minimum_stock ?? 5,
      ]);
    });
    downloadCsv("amezing-opening-stock-template.csv", rows);
  }

  async function importCsv() {
    if (!file) {
      setSummary("Choose your completed CSV file first.");
      return;
    }
    if (role !== "owner") {
      setSummary("Only the company owner can establish opening stock.");
      return;
    }

    setBusy(true);
    setProgress("Checking CSV...");
    setSummary("");
    setIssues([]);

    let parsed: StockRow[] = [];
    let skipped = 0;
    const validationIssues: ImportIssue[] = [];

    try {
      const csvRows = parseCsv(await file.text());
      if (csvRows.length < 2) throw new Error("The file needs the header row and at least one item row.");
      const headers = csvRows[0].map((value) => value.toLowerCase().trim());
      const required = ["inventory_id", "physical_quantity", "cost_price", "selling_price", "minimum_selling_price"];
      const missing = required.filter((header) => !headers.includes(header));
      if (missing.length) throw new Error("Missing required CSV columns: " + missing.join(", ") + ".");

      const col = (row: string[], name: string) => {
        const index = headers.indexOf(name);
        return index < 0 ? "" : (row[index] ?? "").trim();
      };
      const byId = new Map(trackedParts.map((item) => [item.id, item]));
      const seen = new Set<string>();

      csvRows.slice(1).forEach((row, index) => {
        const line = index + 2;
        const id = col(row, "inventory_id");
        const rawQuantity = col(row, "physical_quantity");
        if (!rawQuantity) { skipped++; return; }
        const quantity = Number(rawQuantity);
        if (quantity === 0) { skipped++; return; }
        const item = byId.get(id);
        const label = item?.item_name || col(row, "item_name") || id || "Unknown item";
        if (!id || !item) {
          validationIssues.push({ line, item: label, reason: "Inventory ID is not in the current supported phone-parts catalogue." });
          return;
        }
        if (seen.has(id)) {
          validationIssues.push({ line, item: label, reason: "This inventory ID appears more than once in the CSV." });
          return;
        }
        seen.add(id);
        if (Number(item.quantity || 0) !== 0) {
          validationIssues.push({ line, item: label, reason: "This item no longer has zero stock. Refresh the template before importing it." });
          return;
        }
        if (!Number.isInteger(quantity) || quantity < 1) {
          validationIssues.push({ line, item: label, reason: "Physical quantity must be a whole number greater than zero, or left blank for no change." });
          return;
        }

        const rawCost = col(row, "cost_price");
        const rawSelling = col(row, "selling_price");
        const rawFloor = col(row, "minimum_selling_price");
        const rawMinimum = col(row, "minimum_stock");
        const costPrice = Number(rawCost);
        const sellingPrice = Number(rawSelling);
        const minimumSellingPrice = Number(rawFloor);
        const minimumStock = rawMinimum ? Number(rawMinimum) : Number(item.minimum_stock ?? 5);

        if (!rawCost || !Number.isFinite(costPrice) || costPrice < 0) {
          validationIssues.push({ line, item: label, reason: "Enter the real unit cost. Do not leave it blank or guess." });
          return;
        }
        if (!rawSelling || !Number.isFinite(sellingPrice) || sellingPrice <= 0) {
          validationIssues.push({ line, item: label, reason: "Enter the real selling/engineer charge price; it must be greater than zero." });
          return;
        }
        if (!rawFloor || !Number.isFinite(minimumSellingPrice) || minimumSellingPrice < 0 || minimumSellingPrice > sellingPrice) {
          validationIssues.push({ line, item: label, reason: "Enter a verified minimum selling price between zero and the selling price." });
          return;
        }
        if (!Number.isInteger(minimumStock) || minimumStock < 0) {
          validationIssues.push({ line, item: label, reason: "Minimum stock must be a whole number of zero or more." });
          return;
        }

        parsed.push({ line, item, quantity, costPrice, sellingPrice, minimumSellingPrice, minimumStock });
      });

      if (validationIssues.length) {
        setIssues(validationIssues);
        setSummary("Nothing was written. Fix the rows listed below, then import again.");
        setProgress("");
        return;
      }
      if (!parsed.length) {
        setSummary("No opening stock was entered. Rows with a blank or zero physical quantity were skipped; no stock was changed.");
        setProgress("");
        return;
      }

      const failures: ImportIssue[] = [];
      let succeeded = 0;
      for (let i = 0; i < parsed.length; i++) {
        const row = parsed[i];
        setProgress("Recording opening stock " + (i + 1) + " of " + parsed.length + "...");
        try {
          const { data, error } = await inventoryService.setOpeningStock(
            row.item.id,
            row.quantity,
            row.costPrice,
            row.sellingPrice,
            row.minimumSellingPrice,
            row.minimumStock,
          );
          if (error) failures.push({ line: row.line, item: row.item.item_name, reason: error.message || "Opening-stock record was rejected." });
          else if (!data) failures.push({ line: row.line, item: row.item.item_name, reason: "The database did not confirm the opening-stock record." });
          else succeeded++;
        } catch (error) {
          failures.push({ line: row.line, item: row.item.item_name, reason: error instanceof Error ? error.message : "Opening-stock record failed." });
        }
      }

      setIssues(failures);
      setSummary(
        succeeded + " item(s) recorded; " + failures.length + " failed; " + skipped +
        " blank/zero row(s) skipped. " +
        (failures.length ? "Do not re-import successful rows; fix only the failed rows." : "The saved quantities and prices came from your CSV."),
      );
      setProgress("");
      const refreshed = await inventoryService.getInventory();
      if (!refreshed.error && refreshed.data) setItems(refreshed.data as InventoryItem[]);
    } catch (error) {
      setSummary(error instanceof Error ? error.message : "CSV import failed. No stock should be assumed changed.");
      setProgress("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-5xl space-y-5 pb-8">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1d6a54]">Amezing Limited · Owner tool</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#182a28]">Bulk Opening Stock</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#74837e]">Count the real stock first, fill the blank quantities and verified prices, then import the rows you are ready to establish.</p>
          </div>
          <Link href="/inventory" className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dfe6df] bg-white px-3 text-sm font-semibold text-[#285c4d]"><ArrowLeft className="size-4" />Phone Parts</Link>
        </header>

        {role !== null && role !== "owner" && (
          <section role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">Only the company owner can establish opening stock. No changes have been made.</section>
        )}
        {loadError && <section role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{loadError}</section>}

        <section className="grid gap-3 sm:grid-cols-3">
          <Metric label="Supported phone parts" value={trackedParts.length} />
          <Metric label="Items currently at zero" value={zeroStockParts.length} />
          <Metric label="Opening stock entered here" value="Only CSV quantities" />
        </section>

        <section className="rounded-2xl border border-[#e5e9e5] bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eef4f1] text-[#1d6a54]"><Download className="size-5" /></span>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-[#182a28]">1. Download the current catalogue</h2>
              <p className="mt-1 text-sm leading-6 text-[#74837e]">The template includes existing catalogue IDs and excludes screen guards and unsupported items. Physical quantity is blank. Any zero price fields are also blank so you do not mistake a default zero for a verified price.</p>
              <button type="button" onClick={downloadTemplate} disabled={loading || !!loadError || role !== "owner" || zeroStockParts.length === 0} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#123b34] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><FileSpreadsheet className="size-4" />Download CSV template</button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#e5e9e5] bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f8f1df] text-[#805d12]"><Upload className="size-5" /></span>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-[#182a28]">2. Upload your completed CSV</h2>
              <p className="mt-1 text-sm leading-6 text-[#74837e]">Keep the inventory IDs unchanged. Enter whole-number quantities and actual unit cost, selling price, and minimum selling price. Blank or zero quantities are skipped.</p>
              <input aria-label="Completed opening stock CSV" type="file" accept=".csv,text/csv" disabled={busy || role !== "owner"} onChange={(event) => { setFile(event.target.files?.[0] ?? null); setSummary(""); setIssues([]); }} className="mt-3 block w-full max-w-xl text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#eef4f1] file:px-3 file:py-2 file:font-semibold file:text-[#285c4d]" />
              {file && <p className="mt-2 text-xs text-[#5b6d68]">Selected: {file.name}</p>}
              <button type="button" onClick={() => void importCsv()} disabled={busy || loading || !file || role !== "owner" || !!loadError} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#c8d8ce] bg-[#f3f7f4] px-4 py-2 text-sm font-bold text-[#285c4d] disabled:opacity-50">{busy ? "Processing..." : "Validate and import opening stock"}</button>
            </div>
          </div>
        </section>

        {progress && <p role="status" className="rounded-xl border border-[#dfe6df] bg-[#f8faf8] px-4 py-3 text-sm text-[#285c4d]">{progress}</p>}
        {summary && <section role="status" className="rounded-xl border border-[#dfe6df] bg-white p-4 text-sm text-[#285c4d]"><p className="flex items-center gap-2 font-bold"><CheckCircle2 className="size-4" />Import result</p><p className="mt-1 leading-6">{summary}</p></section>}
        {issues.length > 0 && <section role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <p className="flex items-center gap-2 font-bold text-amber-950"><AlertTriangle className="size-4" />Rows that need attention ({issues.length})</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead><tr className="border-b border-amber-200 text-xs text-amber-900"><th className="py-2 pr-3">CSV row</th><th className="py-2 pr-3">Item</th><th className="py-2">Reason</th></tr></thead>
              <tbody>{issues.map((issue) => <tr key={issue.line + issue.item} className="border-b border-amber-100 align-top"><td className="py-2 pr-3">{issue.line}</td><td className="py-2 pr-3 font-semibold">{issue.item}</td><td className="py-2">{issue.reason}</td></tr>)}</tbody>
            </table>
          </div>
        </section>}

        <section className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
          <p className="font-bold">Safety rules</p>
          <p>Nothing changes when validation finds a problem. Each accepted row is written through the existing opening-stock database function, which prevents opening stock from being established twice for the same item and records an opening movement. If the database rejects a row, it is listed above; already successful rows are not rolled back, so do not re-import them.</p>
        </section>
        {loading && <p role="status" className="text-sm text-[#74837e]">Loading the current catalogue…</p>}
      </main>
    </AppLayout>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-2xl border border-[#e5e9e5] bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-[#74837e]">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-[#182a28]">{value}</p></div>;
}
