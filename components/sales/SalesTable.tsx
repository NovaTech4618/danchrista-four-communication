"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { saleService } from "@/services/saleService";
import type { Sale } from "@/types/sale";

import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

type SalesTableProps = {
  refreshKey: number;
};

function dayKey(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-CA"); // YYYY-MM-DD, stable sort key
}

function dayLabel(key: string) {
  const date = new Date(`${key}T00:00:00`);
  const today = new Date();
  const todayKey = today.toLocaleDateString("en-CA");
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toLocaleDateString("en-CA");

  if (key === todayKey) return "Today";
  if (key === yesterdayKey) return "Yesterday";
  return date.toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export default function SalesTable({ refreshKey }: SalesTableProps) {
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    fetchSales();
  }, [refreshKey]);

  async function fetchSales() {
    const { data, error } = await saleService.getSales();

    if (error) {
      toast.error("Failed to load sales.");
      return;
    }

    setSales((data as Sale[]) || []);
  }

  // Grouped day-by-day, most recent first, with each day's total shown next
  // to its date - the flat one-row-per-sale list made it hard to answer
  // "how much did we make on a given day" without adding it up by hand.
  const groups = useMemo(() => {
    const byDay = new Map<string, Sale[]>();
    for (const sale of sales) {
      const key = dayKey(sale.sale_date);
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key)!.push(sale);
    }
    return [...byDay.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([key, daySales]) => ({
        key,
        label: dayLabel(key),
        sales: daySales,
        total: daySales.reduce((sum, s) => sum + Number(s.total || 0), 0),
        count: daySales.length,
      }));
  }, [sales]);

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-bold mb-4">Sales History</h2>

        {sales.length === 0 ? (
          <p className="text-gray-500">No sales yet.</p>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <div key={group.key} className="overflow-hidden rounded-xl border border-slate-200">
                <div className="flex items-center justify-between bg-slate-50 px-4 py-3">
                  <div>
                    <p className="font-semibold text-slate-900">{group.label}</p>
                    <p className="text-xs text-slate-500">{group.count} sale{group.count === 1 ? "" : "s"}</p>
                  </div>
                  <p className="font-data text-lg font-bold text-teal-700">
                    ₦{group.total.toLocaleString()}
                  </p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.sales.map((sale) => {
                      const customer = Array.isArray(sale.customers) ? sale.customers[0] : sale.customers;

                      return (
                        <TableRow key={sale.id}>
                          <TableCell>
                            {new Date(sale.sale_date).toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" })}
                          </TableCell>
                          <TableCell>{customer?.full_name || "Walk-in"}</TableCell>
                          <TableCell>{sale.payment_method || "-"}</TableCell>
                          <TableCell>₦{Number(sale.total).toLocaleString()}</TableCell>
                          <TableCell>
                            <Link href={`/sales/${sale.id}`} className="text-blue-600 hover:underline">
                              View
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}