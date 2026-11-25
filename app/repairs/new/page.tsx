"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ClipboardCheck, Phone, Smartphone, UserRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/lib/supabase";
import { repairService } from "@/services/repairService";
import { repairOperationsService } from "@/services/repairOperationsService";
import { REPAIR_PRIORITIES } from "@/types/repair";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const inputClass = "h-11 rounded-xl border-slate-200 bg-white";
const selectClass = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
const brands = ["Apple", "Samsung", "Tecno", "Infinix", "itel", "Redmi", "Xiaomi", "Nokia", "Huawei", "Oppo", "Vivo", "Realme", "Google", "OnePlus", "Other"];

function localDate(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}
function suggestedDate() {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return localDate(date);
}

export default function NewRepairPage() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [deviceType, setDeviceType] = useState("Phone");
  const [serviceType, setServiceType] = useState("Standard Repair");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [serial, setSerial] = useState("");
  const [color, setColor] = useState("");
  const [issue, setIssue] = useState("");
  const [technician, setTechnician] = useState("");
  const [estimated, setEstimated] = useState("");
  const [deposit, setDeposit] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [priority, setPriority] = useState("Normal");
  const [expectedDate, setExpectedDate] = useState(suggestedDate);
  const [deviceCondition, setDeviceCondition] = useState("");
  const [screenCondition, setScreenCondition] = useState("");
  const [bodyCondition, setBodyCondition] = useState("");
  const [accessories, setAccessories] = useState("");
  const [missingItems, setMissingItems] = useState("");
  const [intakeNotes, setIntakeNotes] = useState("");
  const [waterDamage, setWaterDamage] = useState(false);
  const [physicalDamage, setPhysicalDamage] = useState(false);
  const [customerAcknowledged, setCustomerAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!customerName.trim()) return void toast.error("Enter the customer's name.");
    if (!brand.trim() || !model.trim()) return void toast.error("Enter the device brand and model.");
    if (!issue.trim()) return void toast.error("Record the problem reported by the customer.");
    if (serviceType === "Standard Repair" && !expectedDate) return void toast.error("Choose a target date for this standard repair.");
    if (serviceType === "Standard Repair" && expectedDate > suggestedDate()) return void toast.error("Standard repairs must have a target within three days. Use Network Unlock for jobs with a different timeframe.");

    const estimatedCost = estimated.trim() ? Number(estimated) : null;
    const paid = deposit.trim() ? Number(deposit) : 0;
    if (estimatedCost !== null && (!Number.isFinite(estimatedCost) || estimatedCost < 0)) return void toast.error("Estimated cost is invalid.");
    if (!Number.isFinite(paid) || paid < 0) return void toast.error("Deposit is invalid.");
    if (estimatedCost !== null && paid > estimatedCost) return void toast.error("Deposit cannot be greater than the estimate.");

    setLoading(true);
    try {
      // This RPC is the single transaction that creates/reuses the customer,
      // creates the device and repair, and records any deposit.
      const { data, error } = await supabase.rpc("create_walk_in_repair", {
        p_customer_name: customerName.trim(),
        p_phone: phone.trim() || null,
        p_device_type: deviceType,
        p_brand: brand.trim(),
        p_model: model.trim(),
        p_serial_number: serial.trim() || null,
        p_color: color.trim() || null,
        p_issue: issue.trim(),
        p_technician: technician.trim() || null,
        p_estimated_cost: estimatedCost,
        p_deposit: paid,
        p_payment_method: paymentMethod,
        p_priority: priority,
        p_expected_completion_date: expectedDate || null,
        p_service_type: serviceType,
      });
      if (error) throw new Error(error.message);
      const created = Array.isArray(data) ? data[0] : data;
      if (!created?.repair_id) throw new Error("The database did not return the new repair number.");

      // Save check-in condition against the same repair record. A failed intake
      // save must not hide or duplicate a repair that was already created.
      const { data: repair, error: repairError } = await repairService.getRepairById(created.repair_id);
      if (repairError || !repair) {
        toast.error("Repair created, but check-in details could not be loaded. Add them from the repair record.");
      } else {
        const { data: authData } = await supabase.auth.getUser();
        const acknowledgedAt = customerAcknowledged ? new Date().toISOString() : null;
        const { error: intakeError } = await repairOperationsService.saveIntake({
          company_id: repair.company_id,
          branch_id: repair.branch_id,
          repair_id: created.repair_id,
          device_condition: deviceCondition.trim() || null,
          screen_condition: screenCondition.trim() || null,
          body_condition: bodyCondition.trim() || null,
          power_test: "untested",
          charging_test: "untested",
          camera_test: "untested",
          speaker_test: "untested",
          microphone_test: "untested",
          buttons_test: "untested",
          biometric_test: "untested",
          network_test: "untested",
          water_damage: waterDamage,
          physical_damage: physicalDamage,
          customer_password_provided: false,
          accessories_received: accessories.trim() || null,
          missing_items: missingItems.trim() || null,
          intake_notes: intakeNotes.trim() || null,
          customer_acknowledged: customerAcknowledged,
          acknowledged_at: acknowledgedAt,
          acknowledged_by: customerAcknowledged ? authData.user?.id ?? null : null,
        });
        if (intakeError) toast.error("Repair created, but the check-in condition was not saved. Please complete it on the repair record.");
        else toast.success("Repair received. Customer, device, deposit and check-in details saved.");
      }
      router.push(`/repairs/${created.repair_id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the repair.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-4xl space-y-5 p-4 sm:p-6 lg:p-8">
        <div className="flex items-start gap-3">
          <Link href="/repairs" aria-label="Back to repairs" className="mt-1 inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"><ArrowLeft className="size-4" /></Link>
          <div><p className="text-sm font-semibold text-teal-700">Repair desk · Check-in</p><h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Receive a device</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Create one repair record for the customer, device, reported fault and anything left with the shop.</p></div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><UserRound className="size-4 text-teal-700" /> 1. Customer</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Customer name" required><Input className={inputClass} value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Name of the person bringing the device" autoComplete="name" required /></Field>
              <Field label="Phone number"><div className="relative"><Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input className={`${inputClass} pl-10`} value={phone} onChange={e => setPhone(e.target.value)} placeholder="080..." inputMode="tel" autoComplete="tel" /></div></Field>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Smartphone className="size-4 text-teal-700" /> 2. Device</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Device type"><select className={selectClass} value={deviceType} onChange={e => setDeviceType(e.target.value)}><option>Phone</option><option>Tablet</option><option>Laptop</option><option>Watch</option><option>Other</option></select></Field>
              <Field label="Brand" required><select className={selectClass} value={brand} onChange={e => setBrand(e.target.value)} required><option value="">Select brand</option>{brands.map(item => <option key={item}>{item}</option>)}</select></Field>
              <Field label="Model" required><Input className={inputClass} value={model} onChange={e => setModel(e.target.value)} placeholder="e.g. iPhone 13 Pro Max" required /></Field>
              <Field label="IMEI / serial number"><Input className={inputClass} value={serial} onChange={e => setSerial(e.target.value)} placeholder="Optional" /></Field>
              <Field label="Colour"><Input className={inputClass} value={color} onChange={e => setColor(e.target.value)} placeholder="Optional" /></Field>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ClipboardCheck className="size-4 text-teal-700" /> 3. Check-in condition</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Field label="Problem reported by customer" required><textarea className="min-h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" value={issue} onChange={e => setIssue(e.target.value)} placeholder="Write what the customer says is wrong. Do not guess the diagnosis." required /></Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Overall condition"><Input className={inputClass} value={deviceCondition} onChange={e => setDeviceCondition(e.target.value)} placeholder="e.g. Used, worn frame" /></Field>
                <Field label="Screen condition"><Input className={inputClass} value={screenCondition} onChange={e => setScreenCondition(e.target.value)} placeholder="e.g. Cracked at top" /></Field>
                <Field label="Body condition"><Input className={inputClass} value={bodyCondition} onChange={e => setBodyCondition(e.target.value)} placeholder="e.g. Dents on sides" /></Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Accessories received"><Input className={inputClass} value={accessories} onChange={e => setAccessories(e.target.value)} placeholder="e.g. SIM tray, case, charger — or None" /></Field>
                <Field label="Missing items / customer warnings"><Input className={inputClass} value={missingItems} onChange={e => setMissingItems(e.target.value)} placeholder="e.g. No SIM tray, customer reports..." /></Field>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Check checked={waterDamage} onChange={setWaterDamage} label="Possible water / liquid damage" />
                <Check checked={physicalDamage} onChange={setPhysicalDamage} label="Visible physical damage" />
              </div>
              <Field label="Additional check-in notes"><textarea className="min-h-20 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" value={intakeNotes} onChange={e => setIntakeNotes(e.target.value)} placeholder="Anything important to remember about this device..." /></Field>
              <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm leading-5 text-slate-700"><input type="checkbox" className="mt-1 size-4 accent-teal-700" checked={customerAcknowledged} onChange={e => setCustomerAcknowledged(e.target.checked)} /><span>I have shown the customer the recorded condition, accessories and missing items, and they have acknowledged it.</span></label>
              <p className="flex items-start gap-2 text-xs leading-5 text-slate-500"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-teal-700" />Do not write down a customer's PIN, password or private messages. Ask them to unlock the device themselves when testing requires it.</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader><CardTitle className="text-base">4. Job and payment</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Service type"><select className={selectClass} value={serviceType} onChange={e => { setServiceType(e.target.value); if (e.target.value === "Network Unlock") setExpectedDate(""); else if (!expectedDate) setExpectedDate(suggestedDate()); }}><option>Standard Repair</option><option>Network Unlock</option></select></Field>
              <Field label="Assigned technician (optional)"><Input className={inputClass} value={technician} onChange={e => setTechnician(e.target.value)} placeholder="Name of technician" /></Field>
              <Field label="Priority"><select className={selectClass} value={priority} onChange={e => setPriority(e.target.value)}>{REPAIR_PRIORITIES.map(item => <option key={item}>{item}</option>)}</select></Field>
              <Field label="Target completion date"><Input className={inputClass} type="date" min={localDate(new Date())} max={serviceType === "Standard Repair" ? suggestedDate() : undefined} required={serviceType === "Standard Repair"} value={expectedDate} onChange={e => setExpectedDate(e.target.value)} /></Field>
              <p className="self-end text-xs leading-5 text-slate-500">Standard repairs are limited to a three-day target by the shop workflow. Network unlock jobs have no automatic three-day limit.</p>
              <Field label="Estimated cost (₦)"><Input className={inputClass} type="number" min="0" step="0.01" value={estimated} onChange={e => setEstimated(e.target.value)} placeholder="Leave blank if not yet known" /></Field>
              <Field label="Deposit received (₦)"><Input className={inputClass} type="number" min="0" step="0.01" value={deposit} onChange={e => setDeposit(e.target.value)} placeholder="0" /></Field>
              <Field label="Deposit payment method"><select className={selectClass} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}><option value="cash">Cash</option><option value="transfer">Transfer</option><option value="pos">POS</option><option value="other">Other</option></select></Field>
            </CardContent>
          </Card>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link href="/repairs" className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700">Cancel</Link><Button type="submit" className="h-11 rounded-xl bg-slate-950 px-6 hover:bg-slate-800" disabled={loading}>{loading ? "Saving repair..." : "Receive device & create repair"}</Button></div>
        </form>
      </main>
    </AppLayout>
  );
}

function Field({ label, required = false, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="block min-w-0 text-sm font-medium text-slate-700">{label}{required && <span className="ml-1 text-red-600">*</span>}<div className="mt-1.5">{children}</div></label>;
}

function Check({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-700"><input type="checkbox" className="size-4 accent-teal-700" checked={checked} onChange={e => onChange(e.target.checked)} />{label}</label>;
}
