"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deviceService } from "@/services/deviceService";

export default function EditDevicePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState({ device_type: "", brand: "", model: "", serial_number: "", color: "", condition: "", accessories: "", problem: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error } = await deviceService.getDeviceById(params.id);
      if (error || !data) {
        toast.error("Device not found.");
        router.replace("/devices");
        return;
      }
      setForm({
        device_type: data.device_type || "", brand: data.brand || "", model: data.model || "",
        serial_number: data.serial_number || "", color: data.color || "", condition: data.condition || "",
        accessories: data.accessories || "", problem: data.problem || "",
      });
      setLoading(false);
    }
    void load();
  }, [params.id, router]);

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.device_type.trim() || !form.brand.trim() || !form.model.trim() || !form.problem.trim()) {
      toast.error("Device type, brand, model and problem are required.");
      return;
    }
    setSaving(true);
    const { error } = await deviceService.updateDevice(params.id, {
      device_type: form.device_type.trim(), brand: form.brand.trim(), model: form.model.trim(),
      serial_number: form.serial_number.trim() || null, color: form.color.trim() || null,
      condition: form.condition.trim() || null, accessories: form.accessories.trim() || null,
      problem: form.problem.trim(),
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Device updated.");
    router.push(`/devices/${params.id}`);
  }

  return <AppLayout><main className="mx-auto w-full max-w-3xl space-y-5 p-5 sm:p-6 lg:p-8"><Link href={`/devices/${params.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"><ArrowLeft className="size-4" /> Back to device</Link><Card><CardHeader><CardTitle>Edit device</CardTitle></CardHeader><CardContent>{loading ? <div className="space-y-3"><div className="h-10 animate-pulse rounded-lg bg-slate-100" /><div className="h-10 animate-pulse rounded-lg bg-slate-100" /><div className="h-10 animate-pulse rounded-lg bg-slate-100" /></div> : <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2"><Field label="Device type" value={form.device_type} onChange={(v) => update("device_type", v)} required /><Field label="Brand" value={form.brand} onChange={(v) => update("brand", v)} required /><Field label="Model" value={form.model} onChange={(v) => update("model", v)} required /><Field label="IMEI / Serial" value={form.serial_number} onChange={(v) => update("serial_number", v)} /><Field label="Color" value={form.color} onChange={(v) => update("color", v)} /><Field label="Condition" value={form.condition} onChange={(v) => update("condition", v)} /><Field label="Accessories" value={form.accessories} onChange={(v) => update("accessories", v)} /><div className="sm:col-span-2"><label className="text-sm font-medium text-slate-700">Problem <span className="text-red-600">*</span></label><textarea value={form.problem} onChange={(e) => update("problem", e.target.value)} className="mt-1.5 min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10" required /></div><div className="flex gap-2 sm:col-span-2"><Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button><Button type="button" variant="outline" onClick={() => router.push(`/devices/${params.id}`)}>Cancel</Button></div></form>}</CardContent></Card></main></AppLayout>;
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return <label className="text-sm font-medium text-slate-700">{label} {required && <span className="text-red-600">*</span>}<Input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5" required={required} /></label>;
}
