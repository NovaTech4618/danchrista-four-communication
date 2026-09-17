"use client";

import { useState } from "react";
import type { Engineer, EngineerBalance, EngineerTransaction } from "@/types/engineer";

const money = (value: number) => `₦${Number(value || 0).toLocaleString("en-NG")}`;

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  if (digits.startsWith("234")) return digits;
  return digits;
}

function buildStatement(engineer: Engineer, balance: EngineerBalance | undefined, transactions: EngineerTransaction[]) {
  const lines = transactions.slice(0, 12).map((transaction) => {
    const date = new Date(transaction.transaction_date).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" });
    const value = Number(transaction.debit) > 0 ? `+${money(Number(transaction.debit))} owed` : `-${money(Number(transaction.credit))} paid`;
    const method = transaction.payment_method ? ` • ${transaction.payment_method.toUpperCase()}` : "";
    return `${date} — ${transaction.description}${method}: ${value}`;
  });

  return [
    "DANCHRISTA FOUR COMMUNICATION — Engineer Account Statement",
    "",
    `Engineer: ${engineer.name}`,
    engineer.business_name ? `Business: ${engineer.business_name}` : "",
    `Current outstanding: ${money(Number(balance?.balance ?? 0))}`,
    "",
    "Recent activity:",
    ...(lines.length ? lines : ["No transactions recorded."]),
    "",
    "This statement reflects the transactions currently recorded in the Danchrista Four Communication account.",
  ].filter(Boolean).join("\n");
}

export default function EngineerShareStatementButton({ engineer, balance, transactions }: { engineer: Engineer; balance?: EngineerBalance; transactions: EngineerTransaction[] }) {
  const [copied, setCopied] = useState(false);

  const statement = buildStatement(engineer, balance, transactions);

  async function copyStatement() {
    await navigator.clipboard.writeText(statement);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function shareWhatsApp() {
    const phone = normalizePhone(engineer.phone ?? "");
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(statement)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => void copyStatement()} className="rounded-md border px-3 py-2 text-sm hover:bg-muted">
        {copied ? "Copied" : "Copy statement"}
      </button>
      {engineer.phone && (
        <button type="button" onClick={shareWhatsApp} className="rounded-md border px-3 py-2 text-sm hover:bg-muted">
          WhatsApp statement
        </button>
      )}
    </div>
  );
}
