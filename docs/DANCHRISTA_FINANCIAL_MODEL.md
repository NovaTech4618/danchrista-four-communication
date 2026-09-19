# Amezing Limited Financial Model

Status: Phase 1 financial-truth foundation

## Principle

Amezing Limited separates economic performance from cash movement. A payment is not new revenue when the underlying sale, repair, engineer charge, or invoice has already created the receivable/revenue event.

## Authoritative event mapping

| Business event | Revenue | Cash movement | Receivable | COGS / cost |
|---|---|---|---|---|
| Sale | Yes, `sales.total` at sale date | Sale payment event | Sale/customer charge is immediately settled in the current model | Inventory stock movement of type `sale` at recorded historical `unit_cost` |
| Sale payment / settlement | No | Yes | Reduces customer receivable where a receivable exists | No |
| Repair recognized | Yes when the repair reaches a chargeable completed/collected state and has a recognized charge | Only when payment is recorded | Yes when unpaid | `repair_use` stock movements, less valid repair returns |
| Repair payment | No | Yes | Reduces repair/customer receivable | No |
| Invoice linked to sale | No additional revenue | Payment creates cash | Billing document only; does not create another customer charge | No additional COGS |
| Invoice linked to repair | No additional revenue | Payment creates cash | Billing document settles the repair receivable; does not create another charge | No additional COGS |
| Standalone invoice | Yes only when it represents a standalone charge not already represented by sale/repair | Payment creates cash | Creates/settles its own receivable | Only if a traceable cost source exists |
| Engineer parts out | Yes: parts are transferred/sold to engineer on credit | No immediate cash unless separately paid | Increases engineer receivable | `engineer_out` stock movement at recorded historical cost |
| Engineer parts in / return | Reverses the corresponding engineer charge | No | Reduces engineer receivable | Reverses corresponding `engineer_out` cost |
| Engineer work charge | Yes when a service charge is posted | No immediate cash | Increases engineer receivable | Direct cost only if an actual cost event exists |
| Engineer payment in | No | Yes | Reduces engineer receivable | No |
| Engineer payment out | No revenue; treated as a cash out/direct engineer cost unless a future payable model explicitly represents another economic event | Yes | Does **not** increase engineer receivable | Direct engineer cost |
| Opening engineer balance | No current-period revenue | No | Establishes opening receivable | No |
| Expense | No | Yes out | No | Operating expense |

## Recognition decisions

### Sales
A completed sale row is the revenue event. Its payment method describes how the sale was settled. The current Amezing Limited model treats sales as immediately settled; a future true customer-credit sale workflow must introduce an explicit receivable/payment event rather than reusing the current cash semantics.

### Repairs
The current workflow has `Completed` and `Collected` terminal chargeable states and stores `final_cost` or `estimated_cost`. Repair revenue is recognized from the chargeable repair event, not from repair payments. Cancelled/Returned Unrepaired repairs are not revenue events.

Where a repair is completed but not yet collected, the system can show revenue and a receivable separately.

Repair charge history is anchored in `customer_debt_ledger`. If an unrecognized repair amount changes, the difference is recorded as a ledger adjustment rather than silently replacing the original charge. Once a repair has reached `Completed` or `Collected`, its financial amount is immutable because changing it would otherwise retroactively alter recognized revenue. An explicit revenue-adjustment workflow would be required for a post-recognition correction.

### Engineers
`engineer_parts_out` and `engineer_work_charge` are charge events. `engineer_payment_in` is settlement cash only. `engineer_parts_in` reverses a parts charge. `opening_balance` is brought-forward receivable, not current revenue. `payment_out` is a cash cost and must not inflate the engineer receivable.

### Invoices
Invoices are representation/billing documents, not automatically new revenue. A linked sale or repair remains the underlying economic event. Linked invoice totals must equal the source sale/repair total. A standalone invoice can be a revenue event only when it represents a standalone charge that has no other underlying sale/repair event.

Invoice payments are settlement events only. Linked-sale invoice payments do not create a second customer receivable because the sale is already the economic event. Linked-repair invoice payments settle the repair receivable. Standalone invoice payments settle the standalone invoice receivable.

## Customer receivables — authoritative model

`customer_debt_ledger` is the authoritative customer receivable ledger.

For each customer:

**valid charges + valid adjustments − valid payment credits = outstanding**

The ledger is the source of truth. Repair and invoice balance projections must reconcile back to it; they must not invent a competing customer balance calculation.

- A repair creates one customer charge in the ledger.
- A repair payment creates one customer credit.
- A linked repair invoice creates no second charge; its payment credits the same repair receivable.
- A linked sale invoice creates no charge and its payment does not create a customer credit in the current immediately-settled sale model.
- A standalone invoice creates one charge; its payments create credits.
- Repair amount changes before recognition are represented by adjustment entries.
- A repair with financial history cannot be moved to another customer/device.
- Customer balances are not permitted to become negative through the supported payment flows.

`customer_financial_reconciliation` compares the authoritative ledger balance against source-derived repair and standalone-invoice balances. A discrepancy is a data/reporting integrity issue and must be investigated rather than hidden.

## Returns and refunds

Inventory returns are supported for repair/engineer stock movements and reverse the corresponding historical COGS. A customer sale/repair cash-refund workflow is **not** currently modeled as a first-class financial event. Therefore the system must not fake a refund by deleting or editing a payment. If a genuine customer refund is required, a dedicated refund/reversal event must be introduced first so revenue, cash, receivable, inventory, and COGS can all be adjusted together.

A repair marked returned/cancelled after payment therefore requires an explicit refund workflow; it must not silently turn a paid customer balance into an unexplained credit.

## Historical edits and deletion safety

Finalized financial events are append-only in practice:

- sales do not expose destructive financial editing;
- invoice/payment records are not directly editable/deletable through the supported workflow;
- repair payments are recorded through an idempotent RPC and are not edited in place;
- recognized repair amounts are immutable;
- pre-recognition repair amount changes create adjustment ledger entries;
- retries with the same payment idempotency key return the original payment instead of creating a second financial event.

Corrections should be represented by a reversal/adjustment event where the business model supports it, not by rewriting history.

## Cash

Cash received is derived from actual payment/money-in events, classified by payment method. Sales, repairs, and engineer charges are not cash merely because they exist.

## Receivables

Customer balances are derived from the customer debt ledger, whose entries are linked to source records. Repair and invoice balance reporting now follows the same underlying customer receivable model.

Engineer balances are derived from `engineer_transactions`, excluding `payment_out` from the receivable balance because that event is a cash cost rather than an amount owed by the engineer. Engineer payment-in and part-return operations reject amounts that would create a negative receivable; prepayment is not currently a supported engineer-account state.

## COGS

For the current system, historical cost is captured by inventory stock movements. Sale, repair-use, and engineer-out movements carry `unit_cost`/`total_cost`; returns reverse the relevant cost. This is sufficient for current historical reporting. The single current `inventory.cost_price` is not used to reconstruct old sales.

A future batch/FIFO model is not required for Phase 1.

## Profit

Gross profit = recognized revenue - recognized inventory/direct cost.

Net profit = gross profit - operating expenses - direct engineer costs where applicable.

Cash received and receivables are never added to revenue merely because money moved.

If a revenue event has no traceable cost, the report must expose that limitation rather than invent a cost.

## Business timezone

All stored transaction timestamps remain `timestamptz`. Reporting periods and business dates are derived using `companies.timezone`. Amezing Limited is configured as `Africa/Lagos`. Browser timezone is not authoritative.

## Reporting rule

Each economic event should have one authoritative source. Reporting functions may join sources, but must not independently reinterpret the same payment as a second revenue event.

## Production reconciliation baseline

The production baseline used before the reporting change is:

- Sales revenue: ₦132,659,500
- Repair payments: ₦33,000
- Standalone invoice/payment: ₦5,000
- Engineer parts charges net of returns: ₦510,000
- Financial inflows: ₦132,712,600
- Financial outflows: ₦607,000
- Inventory COGS, net of sale/repair/engineer returns: ₦64,740,000
- Operating expense (rent): ₦600,000
- Engineer payment-out cash cost: ₦7,000
- Engineer receivable after excluding payment-out from the receivable ledger: ₦510,900
- Customer outstanding: ₦0

### Old reporting model

The old profit function treated financial inflows in categories `sales`, `customer_payment`, and `repair_payment` as revenue and also added `other` inflow to profit. On the production baseline this produced:

- Revenue: ₦132,697,500
- COGS: ₦64,740,000
- Operating expenses: ₦600,000
- Engineer cost: ₦7,000
- Other inflow added to profit: ₦3,000
- Net profit: ₦67,353,500

### New authoritative model

- Sales revenue: ₦132,659,500
- Repair revenue: ₦33,000
- Engineer parts revenue net of returns: ₦510,000
- Standalone invoice revenue: ₦5,000
- **Total revenue: ₦133,207,500**
- Cash received: ₦132,712,600
- COGS: ₦64,740,000
- Gross profit: ₦68,467,500
- Operating expenses: ₦600,000
- Engineer direct cost: ₦7,000
- **Net profit: ₦67,860,500**
- Customer outstanding: ₦0
- Engineer outstanding: ₦510,900

### Difference explained

The new model is ₦507,000 higher in net profit. ₦510,000 is newly recognized engineer parts revenue that was previously absent from revenue reporting. The old model also incorrectly added ₦3,000 of generic `other` cash inflow to profit; the new model correctly leaves that unclassified cash movement out of profit until it has an identified economic source.

No historical production rows were deleted or rewritten as part of Phase 1.
