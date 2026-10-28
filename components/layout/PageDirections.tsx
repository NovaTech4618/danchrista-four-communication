"use client";

import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

type Guide = {
  steps: readonly [string, string, string];
  nextHref?: string;
  nextLabel?: string;
};

const guides: Record<string, Guide> = {
  "/repairs": {
    steps: ["Choose “New repair” to register a phone.", "Search by customer, phone model, or fault to find a repair.", "Open the repair to change its status or check payment."],
    nextHref: "/repairs/new", nextLabel: "Register a repair",
  },
  "/repairs/new": {
    steps: ["Enter the customer's details.", "Choose the phone and write down the fault.", "Check the price and details, then save the repair."],
    nextHref: "/repairs", nextLabel: "View repairs",
  },
  "/parts-collection": {
    steps: ["Choose the engineer receiving the part.", "Select the part and enter the quantity given out.", "Record returns, parts used, or payment when they happen."],
    nextHref: "/engineers", nextLabel: "Check engineer balance",
  },
  "/engineers": {
    steps: ["Choose an engineer, or add them if they are new.", "Pick the action you need: parts, return, work, or payment.", "Check the engineer's balance and records before leaving."],
    nextHref: "/parts-collection", nextLabel: "Record parts out",
  },
  "/engineer-workflow": {
    steps: ["Choose the engineer.", "Enter the part, quantity, and work details that apply.", "Check the amount, then save the record."],
    nextHref: "/engineers", nextLabel: "Check engineer records",
  },
  "/technician-ledger": {
    steps: ["Find the repair or engineer you need.", "Check which parts were linked to the repair.", "Use Parts Out to record a new movement; this page is for checking."],
    nextHref: "/parts-collection", nextLabel: "Record parts out",
  },
  "/reports": {
    steps: ["Choose the date you want to check.", "Review parts given out, returned, used, and paid for.", "Use the totals to answer questions; record changes on the correct page."],
    nextHref: "/parts-collection", nextLabel: "Record a parts movement",
  },
  "/reports/daily-closing": {
    steps: ["Enter the cash available at the start of the day.", "Record shop expenses and count the money received by payment type.", "Review the figures carefully before saving the day's closing."],
    nextHref: "/finance", nextLabel: "View money records",
  },
  "/phone-parts": {
    steps: ["Search for the part or browse the list.", "Check the available quantity and part details.", "Use Parts Out to give parts to an engineer, or Sales to sell an item."],
    nextHref: "/inventory", nextLabel: "Open Phone Parts",
  },
  "/inventory": {
    steps: ["Search for a part or browse the list.", "Use Add item for a new part, or Edit to correct an item.", "Check the quantity before giving parts out or selling them."],
    nextHref: "/parts-collection", nextLabel: "Give parts to an engineer",
  },
  "/inventory/stockroom": {
    steps: ["Choose the stock group you want to browse.", "Search for the item by name or model.", "Open Phone Parts to manage part details and quantities."],
    nextHref: "/inventory", nextLabel: "Open Phone Parts",
  },
  "/inventory/accessories": {
    steps: ["Search for the accessory.", "Check its available quantity and price.", "Record an accessory sale on Sales, not Parts Out."],
    nextHref: "/sales", nextLabel: "Record a sale",
  },
  "/inventory/purchases": {
    steps: ["Choose the stock item you bought.", "Enter the quantity and purchase details shown on your record.", "Save once, then check the stock quantity."],
    nextHref: "/inventory", nextLabel: "Check stock",
  },
  "/inventory/suppliers": {
    steps: ["Find the supplier bill you need.", "Check the amount still unpaid.", "Record a payment only after it has actually been made."],
    nextHref: "/suppliers", nextLabel: "View suppliers",
  },
  "/inventory/verify": {
    steps: ["Count the stock on the shelf.", "Enter the quantity you physically counted.", "Review any difference before confirming the count."],
    nextHref: "/inventory", nextLabel: "Return to Phone Parts",
  },
  "/inventory/opening-stock-import": {
    steps: ["Use this when setting up the starting stock count.", "Check the file or quantities before importing.", "Review the stock list after the import finishes."],
    nextHref: "/inventory", nextLabel: "Check stock",
  },
  "/inventory/import": {
    steps: ["Prepare the stock list in the required format.", "Check item names and quantities before importing.", "Review the imported items for mistakes."],
    nextHref: "/inventory", nextLabel: "Check stock",
  },
  "/inventory/movements": {
    steps: ["Choose the item or date you need to check.", "Read the change and quantity in each record.", "Use Phone Parts to correct stock details or Parts Out to record a movement."],
    nextHref: "/inventory", nextLabel: "Open Phone Parts",
  },
  "/sales": {
    steps: ["Choose the item and quantity the customer is buying.", "Check the total and select how the customer paid.", "Save the sale; only record a return if goods came back."],
    nextHref: "/inventory", nextLabel: "Check stock",
  },
  "/customers": {
    steps: ["Search for the customer before adding a new one.", "Open their record to check saved contact details.", "Use the same customer record when registering their repair or sale."],
    nextHref: "/repairs/new", nextLabel: "Register a repair",
  },
  "/devices": {
    steps: ["Search for the phone before adding it again.", "Check the model and owner details.", "Link the correct phone to the repair record."],
    nextHref: "/repairs", nextLabel: "View repairs",
  },
  "/customer-requests": {
    steps: ["Open the customer's request.", "Check what they asked for and update its status.", "Contact the customer before marking a request as handled."],
    nextHref: "/customers", nextLabel: "Find a customer",
  },
  "/technical-services": {
    steps: ["Find the service you need.", "Check its name and set price.", "Save only after confirming the correct service and price."],
    nextHref: "/sales", nextLabel: "Record a sale",
  },
  "/owed-owing": {
    steps: ["Choose the correct list: people who owe the shop or bills the shop owes.", "Find the customer, engineer, or supplier.", "Record payments only after money changes hands; check the balance afterwards."],
    nextHref: "/finance", nextLabel: "View money records",
  },
  "/outstanding": {
    steps: ["Find the customer who still owes money.", "Check the original amount and payments already made.", "Record a payment when received, then check the remaining balance."],
    nextHref: "/owed-owing", nextLabel: "View all debts",
  },
  "/credit": {
    steps: ["Find the shop debt record.", "Check who or what the amount is for.", "Record a payment only when it is actually paid."],
    nextHref: "/owed-owing", nextLabel: "View all debts",
  },
  "/parts-credit": {
    steps: ["Find the parts sold on credit.", "Check the amount still unpaid.", "Record money received against the correct record."],
    nextHref: "/owed-owing", nextLabel: "View all debts",
  },
  "/invoices": {
    steps: ["Choose a customer, or leave it as walk-in.", "Enter what the bill is for and the full amount.", "Create the invoice, then open it to check payment or print a receipt."],
    nextHref: "/customers", nextLabel: "Find a customer",
  },
  "/finance": {
    steps: ["Choose the money-in or money-out action on this page.", "Enter the real amount, payment method, and reason.", "Save once and check the new record in the list."],
    nextHref: "/reports/daily-closing", nextLabel: "Close the day",
  },
  "/accounts": {
    steps: ["Choose the account you want to check.", "Review its balance and recent movements.", "Use transfer or adjustment actions only when the real transaction has happened."],
    nextHref: "/finance", nextLabel: "View money records",
  },
  "/suppliers": {
    steps: ["Search for the supplier before adding another record.", "Open the supplier to check contact details and bills.", "Use Payables to record a payment against a bill."],
    nextHref: "/inventory/suppliers", nextLabel: "View supplier bills",
  },
  "/whatsapp": {
    steps: ["Find the customer or conversation.", "Check the contact before sending a message.", "Keep customer details private and update the app record after follow-up."],
    nextHref: "/customers", nextLabel: "Find a customer",
  },
  "/staff": {
    steps: ["Choose the staff member or add a new one.", "Give only the access needed for their job.", "Check the name and access before saving."],
    nextHref: "/settings", nextLabel: "Open settings",
  },
  "/settings": {
    steps: ["Open the setting you need to change.", "Read the current value before editing it.", "Save changes only after checking them."],
    nextHref: "/help", nextLabel: "Open Help",
  },
  "/help": {
    steps: ["Start on Home and choose the task you need.", "Use the three steps shown on each page.", "Return to Home to switch tasks."],
    nextHref: "/workspace", nextLabel: "Back to Home",
  },
  "/search": {
    steps: ["Type a name, phone number, or item name.", "Open the matching result.", "Check the record before changing anything."],
    nextHref: "/workspace", nextLabel: "Back to Home",
  },
  "/alerts": {
    steps: ["Open an alert to see what needs attention.", "Check the source record before acting.", "Fix the issue on its own page, then return to check it."],
    nextHref: "/workspace", nextLabel: "Back to Home",
  },
  "/activity": {
    steps: ["Choose the date or record you want to review.", "Check who made the change and when.", "Use the original page to correct a mistake."],
    nextHref: "/workspace", nextLabel: "Back to Home",
  },
  "/tickets": {
    steps: ["Open the support request.", "Read the problem and any replies.", "Update the request after taking action."],
    nextHref: "/help", nextLabel: "Open Help",
  },
  "/assistant": {
    steps: ["Describe the app problem in simple words.", "Include the page name and what happened.", "Check important records yourself before saving changes."],
    nextHref: "/help", nextLabel: "Open Help",
  },
  "/expenses": {
    steps: ["Enter the real expense amount.", "Choose the correct reason and payment method.", "Save once, then check the closing record."],
    nextHref: "/reports/daily-closing", nextLabel: "Close the day",
  },
};

const fallback: Guide = {
  steps: ["Read the page heading to see where you are.", "Use the form or filters to find the record you need.", "Check the details before saving; use Home to switch tasks."],
  nextHref: "/help", nextLabel: "Open Help",
};

export default function PageDirections({ pathname }: { pathname: string }) {
  if (pathname === "/workspace" || pathname === "/dashboard" || pathname === "/login") return null;
  const exact = guides[pathname];
  const section = guides[`/${pathname.split("/")[1]}`];
  const guide = exact ?? section ?? fallback;

  return (
    <section aria-label="How to use this page" className="mx-auto mb-4 w-full max-w-[1600px] rounded-2xl border border-[#dfe6df] bg-[#f4f8f5] px-3 py-3 sm:px-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold text-[#183d33]">
          <BookOpen className="size-4" aria-hidden="true" />
          What to do here
        </h2>
        <Link href={guide.nextHref ?? "/help"} className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-xs font-bold text-[#1d6a54] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d6a54]">
          {guide.nextLabel ?? "Open Help"} <ArrowRight className="size-3.5" />
        </Link>
      </div>
      <ol className="mt-3 grid gap-2 sm:grid-cols-3">
        {guide.steps.map((step, index) => (
          <li key={step} className="flex items-start gap-2 rounded-xl border border-[#e0e9e2] bg-white px-3 py-2.5">
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#e5f0e9] text-[10px] font-extrabold text-[#1d6a54]">{index + 1}</span>
            <span className="text-xs leading-5 text-[#40534d]">{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
