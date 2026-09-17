import Link from "next/link";
import { ArrowRight, BarChart3, HandCoins, Package, Plus, ShoppingCart, WalletCards, Wrench, AlertTriangle, TrendingUp } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ManagementInsights from "@/components/dashboard/ManagementInsights";
import RecentActivity from "@/components/dashboard/RecentActivity";
import LowStock from "@/components/dashboard/LowStock";

const actions = [
  { title: "New sale", description: "Fast walk-in sales. Customer details are optional.", href: "/sales", icon: ShoppingCart, primary: true },
  { title: "New repair", description: "Take in a phone and keep its status visible.", href: "/repairs", icon: Wrench },
  { title: "Inventory", description: "Find accessories and parts, prices and stock.", href: "/inventory", icon: Package },
  { title: "Record debit", description: "See who collected goods and still owes us.", href: "/outstanding", icon: HandCoins },
];

export default function DashboardPage() {
  return <AppLayout>
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[28px] bg-[#123b34] px-5 py-7 text-white shadow-[0_24px_60px_rgba(18,59,52,0.18)] sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full border-[42px] border-[#d7a95a]/10" />
        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#d7a95a]"><span className="size-1.5 rounded-full bg-[#d7a95a]" /> Danchrista Four Communication</div>
            <h1 className="mt-4 font-heading text-3xl font-bold tracking-[-0.035em] sm:text-4xl">What is happening in the shop?</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#c7d8d2] sm:text-base">Record the work as it happens. The owner view keeps stock, money owed, repairs and sales visible without forcing staff to understand accounting.</p>
          </div>
          <Link href="/sales" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#d7a95a] px-6 py-3 text-sm font-bold text-[#123b34] shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-[#e5bc75]"><Plus className="size-4" /> New sale</Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Sales today" value="—" hint="Recorded sales" icon={ShoppingCart} />
        <Metric label="Money received" value="—" hint="Cash + transfer + POS" icon={WalletCards} />
        <Metric label="People owing us" value="—" hint="Outstanding debit" icon={HandCoins} tone="amber" />
        <Metric label="Stock attention" value="—" hint="Low / out of stock" icon={AlertTriangle} tone="red" />
      </section>

      <section aria-labelledby="quick-actions" className="space-y-4">
        <div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1d6a54]">Daily work</p><h2 id="quick-actions" className="mt-1 font-heading text-2xl font-bold tracking-tight text-[#182a28]">Do the next thing quickly.</h2><p className="mt-1 text-sm text-[#74837e]">These are the records staff should be able to reach in seconds.</p></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {actions.map(({ title, description, href, icon: Icon, primary }) => <Link key={title} href={href} className={`group relative rounded-2xl border p-5 transition hover:-translate-y-1 ${primary ? "border-[#123b34] bg-[#123b34] text-white shadow-[0_16px_34px_rgba(18,59,52,0.14)]" : "border-[#dfe6df] bg-white text-[#182a28] shadow-[0_10px_28px_rgba(18,59,52,0.06)] hover:border-[#1d6a54]/30"}`}><span className={`flex size-10 items-center justify-center rounded-xl ${primary ? "bg-[#d7a95a] text-[#123b34]" : "bg-[#eef4f1] text-[#1d6a54]"}`}><Icon className="size-4" /></span><p className="mt-5 text-sm font-bold">{title}</p><p className={`mt-1.5 text-xs leading-5 ${primary ? "text-[#c7d8d2]" : "text-[#687974]"}`}>{description}</p><ArrowRight className={`absolute right-5 top-5 size-4 transition-transform group-hover:translate-x-1 ${primary ? "text-[#d7a95a]" : "text-[#9aa9a4]"}`} /></Link>)}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)]">
        <div className="overflow-hidden rounded-2xl border border-[#dfe6df] bg-white shadow-[0_10px_28px_rgba(18,59,52,0.06)]">
          <div className="flex items-center justify-between border-b border-[#edf0ed] px-5 py-4 sm:px-6"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1d6a54]">Owner view</p><h2 className="mt-1 font-heading text-lg font-bold text-[#182a28]">Business movement</h2><p className="mt-0.5 text-xs text-[#74837e]">Use reports for the detailed numbers.</p></div><Link href="/reports" className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-bold text-[#1d6a54] hover:bg-[#eef4f1]">Reports <BarChart3 className="size-3.5" /></Link></div>
          <div className="p-4 sm:p-6"><ManagementInsights /></div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-[#e8e4da] bg-[#fbfaf7] shadow-[0_10px_28px_rgba(18,59,52,0.06)]"><div className="flex items-center gap-3 border-b border-[#e8e4da] px-5 py-4 sm:px-6"><div className="flex size-9 items-center justify-center rounded-xl bg-[#f2d8a5]/50 text-[#8a641d]"><Package className="size-4" /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a641d]">Stockroom</p><h2 className="mt-1 font-heading text-base font-bold text-[#182a28]">Needs attention</h2></div></div><div className="p-4 sm:p-5"><LowStock /></div></div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <OwnerCard title="Debit — money owed to Danchrista" description="People who collected goods without fully paying." href="/outstanding" icon={HandCoins}><div className="rounded-xl bg-[#fff8e9] p-4 text-sm text-[#6e551d]">The detailed debit ledger is being built around Danchrista's real daily book: <strong>name → item collected → price → paid/unpaid → running balance</strong>.</div></OwnerCard>
        <OwnerCard title="Credit — money Danchrista owes" description="Goods collected from people that still need to be paid for." href="/finance" icon={WalletCards}><div className="rounded-xl bg-[#eef4f1] p-4 text-sm text-[#285c4d]">Keep this separate from sales and stock. The owner should always be able to see <strong>who we owe, how much, and when payment is due</strong>.</div></OwnerCard>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#dfe6df] bg-white shadow-[0_10px_28px_rgba(18,59,52,0.06)]"><div className="flex items-center justify-between border-b border-[#edf0ed] px-5 py-4 sm:px-6"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1d6a54]">Repairs</p><h2 className="mt-1 font-heading text-lg font-bold text-[#182a28]">Recent repair activity</h2></div><Link href="/repairs" className="text-xs font-bold text-[#1d6a54]">Open repairs</Link></div><div className="p-4 sm:p-6"><RecentActivity /></div></section>

      <section className="rounded-2xl border border-[#dfe6df] bg-[#f7f8f5] p-5 sm:p-6"><div className="flex items-start gap-3"><TrendingUp className="mt-0.5 size-5 text-[#1d6a54]" /><div><h2 className="font-heading text-base font-bold text-[#182a28]">Owner rule</h2><p className="mt-1 text-sm leading-6 text-[#687974]">The dashboard should answer five questions without digging: <strong>what sold, what is low, what is moving fast, who owes us, and who do we owe.</strong></p></div></div></section>
    </div>
  </AppLayout>;
}

function Metric({ label, value, hint, icon: Icon, tone = "green" }: { label: string; value: string; hint: string; icon: typeof ShoppingCart; tone?: "green" | "amber" | "red" }) {
  const toneClass = tone === "red" ? "bg-red-50 text-red-700" : tone === "amber" ? "bg-amber-50 text-amber-700" : "bg-[#eef4f1] text-[#1d6a54]";
  return <div className="rounded-2xl border border-[#dfe6df] bg-white p-5 shadow-[0_8px_24px_rgba(18,59,52,0.05)]"><div className={`flex size-9 items-center justify-center rounded-xl ${toneClass}`}><Icon className="size-4" /></div><p className="mt-4 text-xs font-semibold text-[#74837e]">{label}</p><p className="mt-1 font-heading text-2xl font-bold text-[#182a28]">{value}</p><p className="mt-1 text-[11px] text-[#9aa9a4]">{hint}</p></div>;
}

function OwnerCard({ title, description, href, icon: Icon, children }: { title: string; description: string; href: string; icon: typeof HandCoins; children: React.ReactNode }) {
  return <div className="rounded-2xl border border-[#dfe6df] bg-white p-5 shadow-[0_8px_24px_rgba(18,59,52,0.05)]"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><Icon className="size-4 text-[#1d6a54]" /><h2 className="font-heading text-base font-bold text-[#182a28]">{title}</h2></div><p className="mt-1 text-xs text-[#74837e]">{description}</p></div><Link href={href} className="text-xs font-bold text-[#1d6a54]">Open</Link></div><div className="mt-4">{children}</div></div>;
}
