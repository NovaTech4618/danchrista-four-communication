"use client";

import { useState } from "react";
import { UserPlus, Users } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import CustomerForm from "@/components/customers/CustomerForm";
import CustomerDirectory from "@/components/customers/CustomerDirectory";
import type { Customer } from "@/types/customer";

export default function CustomersPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-[1500px] space-y-5 p-5 sm:p-6 lg:p-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#087443]">Repair desk</p>
            <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Customers</h1>
            <p className="mt-1 text-sm text-slate-500">Keep customer details and repair history easy to find.</p>
          </div>
        </header>

        <section className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <section className="min-w-0">
            <div className="mb-3 flex items-center gap-2 px-1">
              <UserPlus className="size-4 text-[#087443]" aria-hidden="true" />
              <h2 className="font-heading text-base font-semibold text-slate-950">{editingCustomer ? "Edit customer" : "New customer"}</h2>
            </div>
            <CustomerForm onCustomerAdded={() => setRefreshKey((prev) => prev + 1)} editingCustomer={editingCustomer} onCancelEdit={() => setEditingCustomer(null)} />
          </section>

          <section className="min-w-0">
            <div className="mb-3 flex items-center gap-2 px-1">
              <Users className="size-4 text-slate-500" aria-hidden="true" />
              <div><h2 className="font-heading text-base font-semibold text-slate-950">Customer list</h2><p className="text-xs text-slate-500">Open a customer to see their devices and repair history.</p></div>
            </div>
            <CustomerDirectory refreshKey={refreshKey} onEdit={setEditingCustomer} />
          </section>
        </section>
      </main>
    </AppLayout>
  );
}
