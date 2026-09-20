"use client";

import { useState } from "react";
import { Eye, Globe2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { settingsService } from "@/services/settingsService";

type Props = {
  companyId: string;
  initialShowcaseName: string | null;
  initialSlug: string;
  initialEnabled: boolean;
  initialDescription: string | null;
  initialPhone: string | null;
  initialAddress: string | null;
  initialServices: string[];
};

export default function CompanyShowcaseSettings({ companyId, initialShowcaseName, initialSlug, initialEnabled, initialDescription, initialPhone, initialAddress, initialServices }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [showcaseName, setShowcaseName] = useState(initialShowcaseName || "");
  const [slug, setSlug] = useState(initialSlug);
  const [description, setDescription] = useState(initialDescription || "");
  const [phone, setPhone] = useState(initialPhone || "");
  const [address, setAddress] = useState(initialAddress || "");
  const [services, setServices] = useState(initialServices.join(", "));
  const [saving, setSaving] = useState(false);

  async function save() {
    const cleanName = showcaseName.trim();
    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (!cleanName) return toast.error("Public business name is required.");
    if (!cleanSlug) return toast.error("Choose a public link name.");

    setSaving(true);
    const { error } = await settingsService.updateShowcase(companyId, {
      slug: cleanSlug,
      showcase_name: cleanName,
      showcase_enabled: enabled,
      showcase_description: description.trim() || null,
      showcase_phone: phone.trim() || null,
      showcase_address: address.trim() || null,
      showcase_services: services.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 12),
    });
    setSaving(false);

    if (error) return toast.error(error.message || "Could not save showcase settings.");
    setShowcaseName(cleanName);
    setSlug(cleanSlug);
    toast.success(enabled ? "Public showcase is live." : "Public showcase saved and hidden.");
  }

  const field = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100";

  return <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-4">
        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700"><Globe2 className="size-5" /></div>
        <div><h2 className="font-heading text-lg font-bold text-slate-950">Public business showcase</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Give customers a simple public page. Internal customers, repairs, stock, payments and staff records stay private.</p></div>
      </div>
      <label className="inline-flex cursor-pointer items-center gap-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="size-4 accent-teal-600" />Publish showcase</label>
    </div>

    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <label className="text-xs font-semibold text-slate-600">Public business name<Input value={showcaseName} onChange={(e) => setShowcaseName(e.target.value)} placeholder="Amezing Limited" className="mt-1.5" /><span className="mt-1.5 block font-normal text-slate-400">This is the name customers will see.</span></label>
      <label className="text-xs font-semibold text-slate-600">Public link name<Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="amezing-four-communications" className="mt-1.5" /><span className="mt-1.5 block font-normal text-slate-400">/showcase/{slug || "your-business"}</span></label>
      <label className="text-xs font-semibold text-slate-600">Public phone<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Business phone number" className={field} /></label>
      <label className="md:col-span-2 text-xs font-semibold text-slate-600">Short business description<textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell customers what your business does." rows={3} className={field} /></label>
      <label className="text-xs font-semibold text-slate-600">Address<input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Business location" className={field} /></label>
      <label className="text-xs font-semibold text-slate-600">Services<input value={services} onChange={(e) => setServices(e.target.value)} placeholder="Phone repair, accessories, software service" className={field} /><span className="mt-1.5 block font-normal text-slate-400">Separate services with commas.</span></label>
    </div>

    <div className="mt-6 flex flex-wrap items-center gap-3"><Button type="button" onClick={() => void save()} disabled={saving} className="gap-2"><Save className="size-4" />{saving ? "Saving…" : "Save showcase"}</Button>{enabled && <a href={`/showcase/${slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Eye className="size-4" />View public page</a>}</div>
  </section>;
}
