"use client";

import { useEffect, useState } from "react";

import AppLayout from "@/components/layout/AppLayout";
import SaleForm from "@/components/sales/SaleForm";
import { staffService } from "@/services/staffService";
import type { StaffRole } from "@/types/staff";
import SalesTable from "@/components/sales/SalesTable";
import SalePriceApprovals from "@/components/sales/SalePriceApprovals";
import SaleReturnsPanel from "@/components/sales/SaleReturnsPanel";
import ReturnApprovalPanel from "@/components/sales/ReturnApprovalPanel";
import { saleService } from "@/services/saleService";

export default function SalesPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [myRole, setMyRole] = useState<StaffRole | null>(null);
  const [sales, setSales] = useState<any[]>([]);

  useEffect(() => { void staffService.getMyRole().then(({ data }) => setMyRole(data)); void saleService.getSales().then(({ data }) => setSales((data ?? []) as any[])); }, []);

  function handleSaleCompleted() {
    setRefreshKey((prev) => prev + 1);
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1d6a54]">Shop sales</p><h1 className="text-3xl font-bold tracking-tight text-slate-950">Sales</h1><p className="text-sm text-slate-500">Sell stock quickly. Choose the item, quantity and payment.</p></div></header>
        <SaleForm onSaleCompleted={handleSaleCompleted} />
        {myRole === "owner" && <SalePriceApprovals />}
        <ReturnApprovalPanel />
        <SaleReturnsPanel sales={sales} />
        <SalesTable refreshKey={refreshKey} canViewSummary={myRole === "owner"} />
      </div>
    </AppLayout>
  );
}