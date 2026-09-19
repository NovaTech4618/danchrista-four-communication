"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Building2, CircleHelp, ImagePlus, MessageCircle, ShieldCheck, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";
import { settingsService } from "@/services/settingsService";
import TwoFactorAuthCard from "@/components/settings/TwoFactorAuthCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { void fetchSettings(); }, []);

  async function fetchSettings() {
    const { data, error } = await settingsService.getProfileAndCompany();
    setLoading(false);
    if (error || !data) { console.error("Settings load error:", error); toast.error("Failed to load settings."); return; }
    setUserId(data.id); setCompanyId(data.company_id); setFullName(data.full_name || ""); setRole(data.role || "");
    const company = Array.isArray(data.companies) ? data.companies[0] : data.companies;
    setCompanyName(company?.name || ""); setCompanyLogo(company?.logo_url || null);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !fullName.trim()) return toast.error("Full name is required.");
    setSavingProfile(true); const { error } = await settingsService.updateFullName(userId, fullName.trim()); setSavingProfile(false);
    if (error) toast.error(error.message); else toast.success("Profile updated!");
  }

  async function handleSaveCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!companyId || !companyName.trim()) return toast.error("Business name is required.");
    setSavingCompany(true); const { error } = await settingsService.updateCompanyName(companyId, companyName.trim()); setSavingCompany(false);
    if (error) toast.error(error.message); else toast.success("Business name updated!");
  }

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file || !companyId) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return toast.error("Use a PNG, JPG or WebP image.");
    if (file.size > 2 * 1024 * 1024) return toast.error("Keep the shop logo under 2 MB.");
    const extension = file.name.split(".").pop()?.toLowerCase() || "png";
    const newPath = `${companyId}/branding/logo-${Date.now()}.${extension}`;
    const oldPath = getStoragePath(companyLogo);
    setUploadingLogo(true);
    const { error: uploadError } = await supabase.storage.from("inventory-images").upload(newPath, file, { contentType: file.type, upsert: false, cacheControl: "31536000" });
    if (uploadError) { setUploadingLogo(false); toast.error(uploadError.message || "Could not upload shop logo."); return; }
    const { data: publicUrlData } = supabase.storage.from("inventory-images").getPublicUrl(newPath);
    const logoUrl = publicUrlData.publicUrl;
    const { error: saveError } = await settingsService.updateCompanyLogo(companyId, logoUrl);
    if (saveError) { await supabase.storage.from("inventory-images").remove([newPath]); setUploadingLogo(false); toast.error(saveError.message || "Could not save shop logo."); return; }
    if (oldPath && oldPath !== newPath) await supabase.storage.from("inventory-images").remove([oldPath]);
    setCompanyLogo(logoUrl); setUploadingLogo(false); toast.success("Shop logo updated.");
  }

  async function handleLogoRemove() {
    if (!companyId || !companyLogo) return;
    setUploadingLogo(true); const path = getStoragePath(companyLogo);
    const { error: saveError } = await settingsService.updateCompanyLogo(companyId, null);
    if (saveError) { setUploadingLogo(false); toast.error(saveError.message || "Could not remove shop logo."); return; }
    if (path) await supabase.storage.from("inventory-images").remove([path]);
    setCompanyLogo(null); setUploadingLogo(false); toast.success("Shop logo removed.");
  }

  if (loading) return <AppLayout><div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading settings…</div></AppLayout>;
  const initial = (companyName || "D").charAt(0).toUpperCase();

  return (
    <AppLayout>
      <div className="space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600">Amezing</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Settings</h1><p className="mt-1 text-sm text-slate-500">Manage the shop, your profile and staff access.</p></div>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">{role || "Staff"}</span>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1.3fr_.7fr]">
          <div className="rounded-3xl bg-slate-950 p-7 text-white shadow-xl shadow-slate-950/10 sm:p-8"><div className="flex items-start gap-5"><div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-teal-400 font-heading text-2xl font-bold text-slate-950">{companyLogo ? <div className="size-full bg-cover bg-center" style={{ backgroundImage: `url(${companyLogo})` }} aria-label={`${companyName || "Shop"} logo`} /> : initial}</div><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">Current shop</p><h2 className="mt-2 truncate font-heading text-2xl font-bold">{companyName || "Amezing Limited"}</h2><p className="mt-2 text-sm text-slate-400">This is the business record space used by Amezing.</p></div></div></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"><div className="flex items-start gap-4"><div className="grid size-11 place-items-center rounded-xl bg-teal-50 text-teal-700"><ImagePlus className="size-5" /></div><div className="min-w-0 flex-1"><p className="font-semibold text-slate-950">Shop picture</p><p className="mt-1 text-sm leading-6 text-slate-500">Use the shop logo across the workspace. PNG, JPG and WebP images up to 2 MB are supported.</p><div className="mt-5 flex flex-wrap items-center gap-3"><input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoUpload} className="sr-only" /><Button type="button" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo} className="gap-2"><Upload className="size-4" />{uploadingLogo ? "Updating…" : companyLogo ? "Change logo" : "Upload logo"}</Button>{companyLogo && <Button type="button" variant="outline" onClick={() => void handleLogoRemove()} disabled={uploadingLogo} className="gap-2 text-slate-600"><Trash2 className="size-4" />Remove</Button>}</div></div></div></div>
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card><CardHeader><CardTitle>Your Profile</CardTitle></CardHeader><CardContent><form onSubmit={handleSaveProfile} className="space-y-4"><div><label className="mb-1 block text-xs text-muted-foreground">Full Name</label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" /></div><Button type="submit" disabled={savingProfile}>{savingProfile ? "Saving…" : "Save Profile"}</Button></form></CardContent></Card>
          <Card><CardHeader><CardTitle>Business Details</CardTitle></CardHeader><CardContent><form onSubmit={handleSaveCompany} className="space-y-4"><div><label className="mb-1 block text-xs text-muted-foreground">Business / Shop Name</label><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Amezing Limited" /></div><Button type="submit" disabled={savingCompany}>{savingCompany ? "Saving…" : "Save Business Details"}</Button></form></CardContent></Card>
          <TwoFactorAuthCard />
        </div>

        <section><h2 className="font-heading text-lg font-bold text-slate-950">Shop tools</h2><div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><SettingsLink href="/whatsapp" icon={MessageCircle} title="WhatsApp" text="Open customer communication tools." /><SettingsLink href="/staff" icon={Building2} title="Staff" text="Manage your team and see exactly what each person can access." /><SettingsLink href="/help" icon={CircleHelp} title="Help & Support" text="Guides, quick links and system status." /></div></section>

        <Link href="/audit" className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm hover:border-slate-300"><ShieldCheck className="size-5 text-slate-500" /><span><strong className="text-slate-900">Audit Log</strong><span className="ml-2 text-slate-500">Owner security history stays separate from ordinary business activity.</span></span></Link>
      </div>
    </AppLayout>
  );
}

function getStoragePath(url: string | null) { if (!url) return null; const marker = "/storage/v1/object/public/inventory-images/"; const index = url.indexOf(marker); return index >= 0 ? decodeURIComponent(url.slice(index + marker.length)) : null; }
function SettingsLink({ href, icon: Icon, title, text }: { href: string; icon: typeof Building2; title: string; text: string }) { return <Link href={href} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"><div className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><Icon className="size-5" /></div><p className="mt-4 font-semibold text-slate-950">{title}</p><p className="mt-1 text-sm leading-6 text-slate-500">{text}</p></Link>; }
