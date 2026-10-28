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
  showOnHome?: boolean;
};
export type SectionGroup = {
  title: string;
  description: string;
  items: SectionItem[];
};

export const workspaceGroups: SectionGroup[] = [
  {
    title: "Work",
    description: "Work",
    items: [
      {
        title: "Repairs",
        href: "/repairs",
        description: "Log phones and track repairs.",
        permission: "repairs",
        icon: Wrench,
      },
      {
        title: "Parts Out",
        href: "/parts-collection",
        description: "Track parts out, used, and returned.",
        permission: "inventory",
        icon: ArrowLeftRight,
      },
      {
        title: "Part Entry",
        href: "/engineer-workflow",
        description: "Log parts and work for one engineer.",
        permission: "engineer_work",
        showOnHome: false,
        icon: ClipboardCheck,
      },
      {
        title: "Engineers",
        href: "/engineers",
        description: "Parts, payments, and balances.",
        permission: "engineers",
        icon: UserRound,
      },
      {
        title: "Report",
        href: "/reports",
        description: "Daily engineer parts and payments.",
        permission: "profit",
        icon: BarChart3,
      },
      {
        title: "Repair Parts",
        href: "/technician-ledger",
        description: "Parts linked to one repair.",
        permission: "engineers",
        showOnHome: false,
        icon: Boxes,
      },
      {
        title: "Closing",
        href: "/reports/daily-closing",
        description: "Log expenses and close the day.",
        permission: "daily_closing",
        icon: ClipboardList,
      },
    ],
  },
  {
    title: "Stock",
    description: "Stock",
    items: [
      {
        title: "Phone Parts",
        href: "/inventory",
        description: "Parts, prices, and stock.",
        permission: "inventory",
        icon: Package,
      },
      {
        title: "Stockroom",
        href: "/inventory/stockroom",
        description: "Browse all stock.",
        permission: "inventory",
        showOnHome: false,
        icon: Boxes,
      },
      {
        title: "Purchases",
        href: "/inventory/purchases",
        description: "Track stock purchases.",
        permission: "suppliers",
        showOnHome: false,
        icon: FileText,
      },
      {
        title: "Payables",
        href: "/inventory/suppliers",
        description: "Pay supplier bills.",
        permission: "suppliers",
        showOnHome: false,
        icon: CreditCard,
      },
      {
        title: "Verify Stock",
        href: "/inventory/verify",
        description: "Check counted stock.",
        permission: "profit",
        showOnHome: false,
        icon: ClipboardCheck,
      },
      {
        title: "Opening Stock",
        href: "/inventory/opening-stock-import",
        description: "Set opening stock.",
        permission: "profit",
        showOnHome: false,
        icon: FileText,
      },
      {
        title: "Import Stock",
        href: "/inventory/import",
        description: "Import stock lists.",
        permission: "profit",
        showOnHome: false,
        icon: FileText,
      },
      {
        title: "History",
        href: "/inventory/movements",
        description: "See stock changes.",
        permission: "profit",
        showOnHome: false,
        icon: Activity,
      },
      {
        title: "Accessories",
        href: "/inventory/accessories",
        description: "Track accessories.",
        permission: "inventory",
        showOnHome: false,
        icon: Cable,
      },
      {
        title: "Sales",
        href: "/sales",
        description: "Record shop sales.",
        permission: "sales",
        icon: ShoppingCart,
      },
      {
        title: "Customers",
        href: "/customers",
        description: "Save customer contacts.",
        permission: "customers",
        icon: Users,
      },
      {
        title: "Devices",
        href: "/devices",
        description: "Save device details.",
        permission: "repairs",
        icon: Smartphone,
      },
      {
        title: "Requests",
        href: "/customer-requests",
        description: "Review requests.",
        permission: "customers",
        icon: MessageCircle,
      },
      {
        title: "Services",
        href: "/technical-services",
        description: "Set service prices.",
        permission: "repairs",
        showOnHome: false,
        icon: Zap,
      },
    ],
  },
  {
    title: "Money",
    description: "Money",
    items: [
      {
        title: "Debts",
        href: "/owed-owing",
        description: "View unpaid balances.",
        permission: "outstanding",
        icon: HandCoins,
      },
      {
        title: "Invoices",
        href: "/invoices",
        description: "Bills and receipts.",
        permission: "invoices",
        icon: FileText,
      },
      {
        title: "Customer Debt",
        href: "/outstanding",
        description: "Track customer debt.",
        permission: "outstanding",
        showOnHome: false,
        icon: HandCoins,
      },
      {
        title: "Shop Debt",
        href: "/credit",
        description: "Track shop debts.",
        permission: "payments",
        showOnHome: false,
        icon: CreditCard,
      },
      {
        title: "Parts Credit",
        href: "/parts-credit",
        description: "Track parts sold on credit.",
        permission: "payments",
        showOnHome: false,
        icon: Boxes,
      },
      {
        title: "Money",
        href: "/finance",
        description: "Money in and out.",
        permission: "payments",
        icon: Wallet,
      },
      {
        title: "Accounts",
        href: "/accounts",
        description: "Balances and transfers.",
        permission: "profit",
        icon: Landmark,
      },
      {
        title: "Suppliers",
        href: "/suppliers",
        description: "Supplier contacts and bills.",
        permission: "suppliers",
        icon: Boxes,
      },
    ],
  },
  {
    title: "More",
    description: "More",
    items: [



      {
        title: "Alerts",
        href: "/alerts",
        description: "Items needing attention.",
        permission: "profit",
        showOnHome: false,
        icon: BellRing,
      },
      {
        title: "Activity",
        href: "/activity",
        description: "See who changed what.",
        permission: "staff",
        showOnHome: false,
        icon: Activity,
      },
      {
        title: "Search",
        href: "/search",
        description: "Find records fast.",
        permission: "search",
        showOnHome: false,
        icon: Search,
      },
      {
        title: "WhatsApp",
        href: "/whatsapp",
        description: "Customer messages.",
        permission: "whatsapp",
        icon: MessageCircle,
      },
      {
        title: "Staff",
        href: "/staff",
        description: "Staff and access.",
        permission: "staff",
        icon: Users,
      },
      {
        title: "Settings",
        href: "/settings",
        description: "Business setup.",
        permission: "settings",
        icon: Settings,
      },
      {
        title: "Help",
        href: "/help",
        description: "Short guide to the app.",
        permission: "help",
        icon: BookOpen,
      },
      {
        title: "Assistant",
        href: "/assistant",
        description: "Get app help.",
        permission: "assistant",
        showOnHome: false,
        icon: Sparkles,
      },
      {
        title: "Support Tickets",
        href: "/tickets",
        description: "Track help requests.",
        permission: "help",
        showOnHome: false,
        icon: CircleHelp,
      },
    ],
  },
];
