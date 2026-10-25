"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity, ArrowLeftRight, BarChart3, BellRing, BookOpen, Boxes, Cable,
  CircleHelp, ClipboardCheck, ClipboardList, CreditCard, FileText, HandCoins,
  Landmark, MessageCircle, Package, Search, Settings, ShoppingCart, Smartphone,
  Sparkles, Users, UserRound, Wallet, Wrench, Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { staffService } from "@/services/staffService";
import { hasPermission, type Permission } from "@/lib/permissions";
import type { StaffRole } from "@/types/staff";

type SectionItem = {
  title: string;
  href: string;
  description: string;
  permission: Permission;
  icon: LucideIcon;
};
type SectionGroup = {
  title: string;
  description: string;
  items: SectionItem[];
};

const groups: SectionGroup[] = [
  {
    title: "Daily shop work",
    description: "The main jobs to complete during a normal day.",
    items: [
      {
        title: "Repairs",
        href: "/repairs",
        description: "Receive a phone, record its fault, assign an engineer, follow progress, and record when it is ready or collected.",
        permission: "repairs",
        icon: Wrench,
      },
      {
        title: "Daily Parts Collection",
        href: "/parts-collection",
        description: "Record parts issued to engineers, mark parts used or returned, and check what is still out on a selected date.",
        permission: "inventory",
        icon: ArrowLeftRight,
      },
      {
        title: "Engineers",
        href: "/engineers",
        description: "Open an engineer’s record to manage part issues, returns, work entries, payments, balances, and statements.",
        permission: "engineers",
        icon: UserRound,
      },
      {
        title: "Engineer Daily Report",
        href: "/reports",
        description: "Review parts given out, returned, used, engineer payments, and parts still outstanding for the selected day. This is not the customer-sales report.",
        permission: "profit",
        icon: BarChart3,
      },
      {
        title: "Daily Expenses & Closing",
        href: "/reports/daily-closing",
        description: "Record transport, feeding, electricity, water and other shop expenses; reconcile the day against actual cash and payment totals.",
        permission: "daily_closing",
        icon: ClipboardList,
      },
    ],
  },
  {
    title: "Stock, customers & sales",
    description: "Keep goods, customer records and shop sales in the right place.",
    items: [
      {
        title: "Phone Parts",
        href: "/inventory",
        description: "Manage phone-repair parts, model compatibility, prices, quantities, low-stock levels, purchases and stock history.",
        permission: "inventory",
        icon: Package,
      },
      {
        title: "Accessories & Gadgets",
        href: "/inventory/accessories",
        description: "Manage retail accessories separately from repair parts, including their own quantities, selling prices and low-stock levels.",
        permission: "inventory",
        icon: Cable,
      },
      {
        title: "Sales",
        href: "/sales",
        description: "Record a sale of stocked goods, apply an authorised price or discount, choose the payment method, and keep stock and sales records connected.",
        permission: "sales",
        icon: ShoppingCart,
      },
      {
        title: "Customers",
        href: "/customers",
        description: "Save customer names and phone numbers and open their records when you need to find related activity.",
        permission: "customers",
        icon: Users,
      },
      {
        title: "Devices",
        href: "/devices",
        description: "Keep details of customer phones and other devices so they can be identified and connected to repair work.",
        permission: "repairs",
        icon: Smartphone,
      },
      {
        title: "Customer Requests",
        href: "/customer-requests",
        description: "Review incoming requests before or while they are turned into a proper customer or repair record.",
        permission: "customers",
        icon: MessageCircle,
      },
      {
        title: "Technical Services",
        href: "/technical-services",
        description: "Maintain the shop’s service catalogue and labour/service prices used when quoting or selling technical work.",
        permission: "repairs",
        icon: Zap,
      },
    ],
  },
  {
    title: "Debts, money & purchasing",
    description: "Use the section that matches the transaction being recorded; these books serve different purposes.",
    items: [
      {
        title: "Owed & Owing",
        href: "/owed-owing",
        description: "Get a follow-up view of customer and engineer balances and amounts payable to suppliers, including people reaching a reminder threshold.",
        permission: "outstanding",
        icon: HandCoins,
      },
      {
        title: "Invoices & Receipts",
        href: "/invoices",
        description: "Create a customer invoice, collect full or partial payments, view the remaining balance, and print receipts.",
        permission: "invoices",
        icon: FileText,
      },
      {
        title: "People Who Owe Us",
        href: "/outstanding",
        description: "Use the customer debit book for a person who collected goods or value and has not fully paid; record the amount paid and balance.",
        permission: "outstanding",
        icon: HandCoins,
      },
      {
        title: "People Amezing Owes",
        href: "/credit",
        description: "Record goods or value the shop received from another person on credit, then track payments and the remaining payable.",
        permission: "payments",
        icon: CreditCard,
      },
      {
        title: "Customer Parts Credit",
        href: "/parts-credit",
        description: "Track a customer taking a specific stocked part on credit. Use it only for this parts-credit workflow, not as a normal completed sale.",
        permission: "payments",
        icon: Boxes,
      },
      {
        title: "Money Movement",
        href: "/finance",
        description: "Review the recorded financial ledger: money in, money out, and net movement over a selected period. Entries come from real business events.",
        permission: "payments",
        icon: Wallet,
      },
      {
        title: "Accounts",
        href: "/accounts",
        description: "Check balances across cash, bank, POS and mobile-money accounts, review movements, and record transfers between accounts.",
        permission: "profit",
        icon: Landmark,
      },
      {
        title: "Suppliers & Purchases",
        href: "/suppliers",
        description: "Maintain supplier details, review purchasing history, and track the amount still payable to each supplier.",
        permission: "suppliers",
        icon: Boxes,
      },
    ],
  },
  {
    title: "Control, communication & help",
    description: "Tools for finding records, managing access, and checking what happened.",
    items: [
      {
        title: "Engineer Work",
        href: "/engineer-workflow",
        description: "A quick-entry form to record parts collected, returns, and work done for one selected engineer. Use Daily Parts Collection to review the day's wider movement history.",
        permission: "engineer_work",
        icon: ClipboardCheck,
      },
      {
        title: "Technician Parts Ledger",
        href: "/technician-ledger",
        description: "Track parts used for a specific repair, returns against that repair, and the remaining part quantity. This is repair-specific, not the general engineer account.",
        permission: "engineers",
        icon: Boxes,
      },
      {
        title: "Stock History",
        href: "/inventory/movements",
        description: "Review why inventory quantities changed—purchases, sales, repair use, engineer issue/return or a recorded stock adjustment.",
        permission: "inventory",
        icon: Activity,
      },
      {
        title: "Alerts",
        href: "/alerts",
        description: "Review operational warnings that need attention, such as stock or account exceptions.",
        permission: "profit",
        icon: BellRing,
      },
      {
        title: "Activity History",
        href: "/activity",
        description: "Review the timeline of important business actions when you need to know what changed and when.",
        permission: "staff",
        icon: Activity,
      },
      {
        title: "Search",
        href: "/search",
        description: "Find a customer, repair, stock item or other available record without opening each section one by one.",
        permission: "search",
        icon: Search,
      },
      {
        title: "WhatsApp",
        href: "/whatsapp",
        description: "Open the communication workspace for customer updates and permitted payment follow-ups.",
        permission: "whatsapp",
        icon: MessageCircle,
      },
      {
        title: "Staff",
        href: "/staff",
        description: "Manage staff accounts and their permitted access. Use the least access each person needs for their job.",
        permission: "staff",
        icon: Users,
      },
      {
        title: "Settings",
        href: "/settings",
        description: "Manage business and workspace configuration available to the owner.",
        permission: "settings",
        icon: Settings,
      },
      {
        title: "Help & Section Guide",
        href: "/help",
        description: "Read what each section does, how the workflows relate, and where to go for a task.",
        permission: "help",
        icon: BookOpen,
      },
      {
        title: "Amezing Assistant",
        href: "/assistant",
        description: "Open the in-app assistant for help understanding how to use the workspace.",
        permission: "assistant",
        icon: Sparkles,
      },
      {
        title: "Support Tickets",
        href: "/tickets",
        description: "Open or review a support request when an issue needs follow-up.",
        permission: "help",
        icon: CircleHelp,
      },
    ],
  },
];

export default function WorkspacePage() {
  const [role, setRole] = useState<StaffRole | null>(null);

  useEffect(() => {
    let active = true;
    void staffService.getMyRole().then((result) => {
      if (active && result.data) setRole(result.data);
    });
    return () => { active = false; };
  }, []);

  return (
    <AppLayout>
      <main className="mx-auto max-w-7xl space-y-8 pb-8">
        <header className="rounded-3xl border border-[#dfe6df] bg-white px-5 py-7 text-center shadow-sm sm:px-8 sm:py-9">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1d6a54]">Amezing Limited</p>
          <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight text-[#182a28] sm:text-4xl">Shop workspace</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#65766f]">
            Choose the section that matches the job. Each card explains what it records and when to use it. Finish a task, then use Home to return here.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs text-[#52675e]">
            <span className="rounded-full border border-[#dfe6df] px-3 py-1.5">Real shop records only</span>
            <span className="rounded-full border border-[#dfe6df] px-3 py-1.5">Stock and money remain traceable</span>
            <Link href="/help" className="rounded-full border border-[#dfe6df] px-3 py-1.5 font-semibold text-[#1d6a54] hover:bg-[#f5f8f5]">Read the section guide →</Link>
          </div>
        </header>

        {role === null ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading workspace" aria-busy="true">
            {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-36 animate-pulse rounded-2xl border border-[#e5ebe6] bg-white" />)}
          </div>
        ) : (
          <div className="space-y-8">
            {groups.map((group) => {
              const items = group.items.filter((item) => hasPermission(role, item.permission));
              if (!items.length) return null;
              return (
                <section key={group.title} aria-labelledby={group.title.replaceAll(" ", "-").toLowerCase()}>
                  <header className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <h2 id={group.title.replaceAll(" ", "-").toLowerCase()} className="font-heading text-xl font-bold text-[#182a28] sm:text-2xl">{group.title}</h2>
                    <p className="text-sm text-[#74837e]">{group.description}</p>
                  </header>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {items.map(({ title, href, description, icon: Icon }) => (
                      <Link
                        key={title}
                        href={href}
                        className="group flex min-h-36 min-w-0 gap-3 rounded-2xl border border-[#e3e9e4] bg-white p-4 shadow-[0_2px_6px_rgba(24,42,40,0.04)] transition hover:-translate-y-0.5 hover:border-[#bfd2c8] hover:shadow-[0_8px_18px_rgba(18,59,52,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d6a54] sm:p-5"
                      >
                        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#eef4f1] text-[#1d6a54] transition group-hover:bg-[#123b34] group-hover:text-[#d7a95a]">
                          <Icon className="size-5" strokeWidth={1.8} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-[#263a35] sm:text-base">{title}</span>
                          <span className="mt-1.5 block text-xs leading-5 text-[#74837e] sm:text-sm sm:leading-5">{description}</span>
                          <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#1d6a54]">Open section <span aria-hidden="true">→</span></span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs leading-5 text-[#89958f]">
          Only sections allowed for your account are shown. If a task does not match these descriptions, stop and check the guide before entering the same transaction in a different book.
        </p>
      </main>
    </AppLayout>
  );
}
