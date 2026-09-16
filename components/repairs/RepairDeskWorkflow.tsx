"use client";

import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  ["01", "Intake", "Customer + device + complaint"],
  ["02", "Engineer", "Assign ownership"],
  ["03", "Work", "Status + diagnosis + solution"],
  ["04", "Parts", "Issue parts through inventory"],
  ["05", "Payment", "Paid vs outstanding"],
  ["06", "Completion", "Finish when status allows"],
  ["07", "Invoice", "Linked repair invoice"],
  ["08", "Collection", "Payment + handover"],
] as const;

type Props = { status: string; engineerAssigned: boolean; hasHandover: boolean };

export default function RepairDeskWorkflow({ status, engineerAssigned, hasHandover }: Props) {
  const completed = new Set<number>();
  completed.add(1);
  if (engineerAssigned) completed.add(2);
  if (["Repairing", "Testing", "Completed", "Ready for Collection", "Collected"].includes(status)) completed.add(3);
  if (["Completed", "Ready for Collection", "Collected"].includes(status)) completed.add(6);
  if (hasHandover || status === "Collected") completed.add(8);

  let next = "Assign an engineer";
  if (!engineerAssigned) next = "Assign an engineer";
  else if (!["Repairing", "Testing", "Completed", "Ready for Collection", "Collected"].includes(status)) next = "Move the repair into work";
  else if (!["Completed", "Ready for Collection", "Collected"].includes(status)) next = "Finish testing, then complete the repair";
  else if (status !== "Collected") next = "Finish payment, invoice and customer handover";
  else next = "Repair workflow complete";

  return <Card className="border-slate-200 bg-slate-950 text-white shadow-sm">
    <CardContent className="p-4 sm:p-5">
      <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-300">Repair desk · next action</p><p className="mt-1 text-base font-semibold">{next}</p></div>
      <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
        {steps.map(([number, label, description], index) => { const done = completed.has(index + 1); return <div key={number} className="relative rounded-xl border border-white/10 bg-white/[0.04] p-3"><div className="flex items-center gap-2"><span className="text-[10px] font-bold text-teal-300">{number}</span>{done ? <CheckCircle2 className="size-4 text-teal-300"/> : <Circle className="size-4 text-slate-500"/>}</div><p className="mt-2 text-xs font-semibold">{label}</p><p className="mt-0.5 text-[10px] leading-4 text-slate-400">{description}</p>{index < steps.length - 1 && <ArrowRight className="absolute -right-2 top-5 z-10 hidden size-3 text-slate-600 xl:block"/>}</div>; })}
      </div>
    </CardContent>
  </Card>;
}
