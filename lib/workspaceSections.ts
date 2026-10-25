import {
  Activity, ArrowLeftRight, BarChart3, BellRing, BookOpen, Boxes, Cable,
  CircleHelp, ClipboardCheck, ClipboardList, CreditCard, FileText, HandCoins,
  Landmark, MessageCircle, Package, Search, Settings, ShoppingCart, Smartphone,
  Sparkles, Users, UserRound, Wallet, Wrench, Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Permission } from "@/lib/permissions";

export type SectionItem = {
  title: string;
  href: string;
  description: string;
  permission: Permission;
  icon: LucideIcon;
};
export type SectionGroup = {
  title: string;
  description: string;
  items: SectionItem[];
};

export const workspaceGroups: SectionGroup[] = [
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
        title: "Engineer Work",
        href: "/engineer-workflow",
        description: "A quick-entry form to record parts collected, returns, and work done for one selected engineer. Use Daily Parts Collection to review the day's wider movement history.",
        permission: "engineer_work",
        icon: ClipboardCheck,
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
        title: "Technician Parts Ledger",
        href: "/technician-ledger",
        description: "Track parts used for a specific repair, returns against that repair, and the remaining part quantity. This is repair-specific, not the general engineer account.",
        permission: "engineers",
        icon: Boxes,
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
        title: "Stock History",
        href: "/inventory/movements",
        description: "Review why inventory quantities changed—purchases, sales, repair use, engineer issue/return or a recorded stock adjustment.",
        permission: "inventory",
        icon: Activity,
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
