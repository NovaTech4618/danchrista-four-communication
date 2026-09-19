import Link from "next/link";
import { LucideIcon } from "lucide-react";

type DashboardCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  label?: string;
  href?: string;
};

export default function DashboardCard({ title, value, icon: Icon, color, label, href }: DashboardCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`size-1.5 shrink-0 rounded-full ${color}`} />
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{title}</p>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{value}</p>
          {label && <p className="mt-2 text-xs font-medium text-slate-500">{label}</p>}
        </div>
        <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${color} shadow-sm transition-transform duration-200 group-hover:scale-105`}>
          <Icon className="text-white" size={20} strokeWidth={2} />
        </div>
      </div>
      {href && <span className="mt-3 block text-[11px] font-semibold text-[#087443] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">Open details →</span>}
    </>
  );

  const className = "group block rounded-xl border border-slate-200 bg-white p-5 shadow-[var(--novatech-shadow-card)] transition-colors hover:border-slate-300 hover:bg-slate-[1%] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#12b76a]";
  return href ? <Link href={href} className={className}>{content}</Link> : <div className={className}>{content}</div>;
}
