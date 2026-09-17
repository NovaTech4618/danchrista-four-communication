# Danchrista Four Communication — Claude Handoff

## Identity — DO NOT CHANGE
This is a private business management system for **Danchrista Four Communication Ventures**, the user's boss's real shop.

It is NOT NOVATECH.
It is NOT SaaS.
It is NOT multi-tenant.
It does NOT need multiple branches.
Do not reintroduce generic SaaS/product/marketing language.

The goal is simple: build something genuinely better than the notebook/books the owner currently uses for daily records.

## Current stack
- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind v4
- Supabase/Postgres/RLS
- GitHub repo: `NovaTech4618/danchrista-four-communication`
- Vercel project: `danchrista-four-communication`

## What is already solid
- Financial/database foundation and earlier integrity gates are established.
- Sales, inventory, repairs, debit, credit/payables, cash book, reports and daily closing exist.
- Inventory minimum selling-price/price-floor enforcement is implemented at database level and audited.
- Inventory intelligence is on the dashboard.
- Debit is based around people who owe Danchrista, with customer ledger/payment history.
- Credit is separate: people Danchrista owes. A person can exist on both sides without balances being netted.
- Finance is a cash/money book, not the credit ledger.
- Danchrista branding has replaced visible NOVATECH branding in the main UI.
- Search, dashboard, sidebar, home page, assistant and reports have been cleaned toward a simple shop interface.

## Latest work tonight
Repair workflow was tightened:
- Active statuses use the audited `change_repair_status` RPC.
- Completion and collection are separate stages.
- Completed repairs remain visible until actually collected.
- Payment is tracked separately and cannot exceed outstanding balance.
- Exceptional outcomes include No Fix / Failed Repair / Returned Unrepaired / Cancelled.

Recent commits:
- `7b03622` — hardened repair status handling
- `1140c12` — completion + collection workflow
- `c8d2f87` — keep completed repairs visible until collection
- `3790e41` — clean Danchrista owner reports

## Owner reports
`/reports` is now intentionally concise. It focuses on:
- sales revenue
- repair value
- money received
- gross/net profit
- parts cost
- operating expenses
- customer debt
- engineer balance
- repair counts
- low stock
- daily profit
- payment-method mix
- existing detailed report components

## Daily closing
The existing daily closing page is:
`/reports/daily-closing`

It already supports:
- business date
- opening cash
- reconciliation
- expected cash
- actual counted cash
- discrepancy
- payment-method actuals
- close/reopen workflow

Do not replace the financial logic casually. Verify the service/RPC/schema before modifying it.

## Important business model
### Sales
Fast walk-in sale flow. Customer details are optional for ordinary sales.

### Inventory
Two main shelves:
1. Accessories & Gadgets
2. Phone Parts

Need practical categories, stock quantities, cost price, selling price, minimum selling price, reorder level and useful stock intelligence.

### Repairs
Core flow:
Received → Diagnosis → Estimate Sent → Customer Approved → Repairing → Testing → Completed → Collected
Exceptional outcomes: No Fix, Failed Repair, Returned Unrepaired, Cancelled.

### Debit — people owe Danchrista
Name → phone → item/service → amount → paid → outstanding → history.
WhatsApp reminders should use the stored number.

### Credit — Danchrista owes people
Person → goods collected → agreed value → payments → balance → due date.
Keep this separate from customer debit and ordinary expenses.

## UI rule
Every screen should answer a real Danchrista question quickly.
Remove unnecessary explanatory paragraphs, premium/SaaS language, fake product positioning and branch/tenant concepts from visible UI.

## Before making changes
1. Inspect the actual current file/schema/service.
2. Do not assume an old implementation is still current.
3. Preserve financial integrity and existing RPC boundaries.
4. Make coherent changes rather than cosmetic patches.
5. Verify TypeScript/build where possible.
6. Commit working changes with a clear message.

## Likely next work
1. Verify the repair workflow visually and against actual Supabase data/RPC behavior.
2. Verify `/reports` and `/reports/daily-closing` on the deployed Danchrista project.
3. Continue visible branding cleanup, especially any remaining user-facing `NOVATECH`, branch-manager, branch, or SaaS wording.
4. Improve daily closing only if a real Danchrista workflow gap is found.
5. Then harden the remaining daily-use flows rather than adding new product scope.

## Do not do tonight without a real need
- Do not redesign the database from scratch.
- Do not add multi-branch support.
- Do not add multi-tenant SaaS architecture.
- Do not rename the repo/project back to NOVATECH.
- Do not add AI features just for decoration.
- Do not add marketing pages or unnecessary dashboard explanations.

## User preference
The user wants agent-style execution. Avoid repeatedly explaining what you are about to do. Inspect, implement, verify, commit, then report the meaningful result and any real blocker.
