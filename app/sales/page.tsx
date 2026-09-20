"use client";

import { useEffect, useState } from "react";

import AppLayout from "@/components/layout/AppLayout";
import SaleForm from "@/components/sales/SaleForm";
import { staffService } from "@/services/staffService";
import type { StaffRole } from "@/types/staff";
import SalesTable from "@/components/sales/SalesTable";

export default function SalesPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [myRole, setMyRole] = useState<StaffRole | null>(null);

  useEffect(() => { void staffService.getMyRole().then(({ data }) => setMyRole(data)); }, []);

  function handleSaleCompleted() {
    setRefreshKey((prev) => prev + 1);
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Sales</h1>
        <SaleForm onSaleCompleted={handleSaleCompleted} />
        <SalesTable refreshKey={refreshKey} canViewSummary={myRole === "owner"} />
      </div>
    </AppLayout>
  );
}