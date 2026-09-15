# Danchrista Financial Model

Status: Phase 1 financial-truth foundation

## Principle

Danchrista separates economic performance from cash movement. A payment is not new revenue when the underlying sale, repair, engineer charge, or invoice has already created the receivable/revenue event.

## Authoritative event mapping

| Business event | Revenue | Cash movement | Receivable | COGS / cost |
|---|---|---|---|---|
| Sale | Yes, `sales.total` at sale date | Only when paid through the sale's payment method | Yes when customer is charged on credit | Inventory stock movement of type `sale` at recorded historical `unit_cost` |
| Sale payment / settlement | No | Yes | Reduces customer receivable | No |
| Repair recognized | Yes when the repair reaches a chargeable completed/collected state and has a recognized charge | Only when payment is recorded | Yes when unpaid | `repair_use` stock movements, less valid repair returns |
| Repair payment | No | Yes | Reduces repair/customer receivable | No |
| Invoice linked to sale | No additional revenue | Payment creates cash | Represents/settles the sale receivable | No additional COGS |
| Invoice linked to repair | No additional revenue | Payment creates cash | Represents/settles repair receivable | No additional COGS |
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
A completed sale row is the revenue event. Its payment method describes how the sale was settled, but reporting must not use the payment ledger as additional revenue.

### Repairs
The current workflow has `Completed` and `Collected` terminal chargeable states and stores `final_cost` or `estimated_cost`. Repair revenue is recognized from the chargeable repair event, not from repair payments. Cancelled/Returned Unrepaired repairs are not revenue events.

Where a repair is completed but not yet collected, the system can show revenue and a receivable separately.

### Engineers
`engineer_parts_out` and `engineer_work_charge` are charge events. `engineer_payment_in` is settlement cash only. `engineer_parts_in` reverses a parts charge. `opening_balance` is brought-forward receivable, not current revenue. `payment_out` is a cash cost and must not inflate the engineer receivable.

### Invoices
Invoices are representation/billing documents, not automatically new revenue. A linked sale or repair remains the underlying economic event. A standalone invoice can be a revenue event only when it represents a standalone charge that has no other underlying sale/repair event.

## Cash

Cash received is derived from actual payment/money-in events, classified by payment method. Sales, repairs, and engineer charges are not cash merely because they exist.

## Receivables

Customer balances are derived from the customer debt ledger, whose entries are linked to source records. Repair balance reporting must use the same underlying ledger relationship rather than independently calculating a conflicting balance.

Engineer balances are derived from `engineer_transactions`, excluding `payment_out` from the receivable balance because that event is a cash cost rather than an amount owed by the engineer.

## COGS

For the current system, historical cost is captured by inventory stock movements. Sale, repair-use, and engineer-out movements carry `unit_cost`/`total_cost`; returns reverse the relevant cost. This is sufficient for current historical reporting. The single current `inventory.cost_price` is not used to reconstruct old sales.

A future batch/FIFO model is not required for Phase 1.

## Profit

Gross profit = recognized revenue - recognized inventory/direct cost.

Net profit = gross profit - operating expenses - direct engineer costs where applicable.

Cash received and receivables are never added to revenue merely because money moved.

If a revenue event has no traceable cost, the report must expose that limitation rather than invent a cost.

## Business timezone

All stored transaction timestamps remain `timestamptz`. Reporting periods and business dates are derived using `companies.timezone`. Danchrista is configured as `Africa/Lagos`. Browser timezone is not authoritative.

## Reporting rule

Each economic event should have one authoritative source. Reporting functions may join sources, but must not independently reinterpret the same payment as a second revenue event.

## Production reconciliation baseline

At the Phase 1 audit baseline, production contains:

- Sales revenue: ₦132,659,500
- Repair payments: ₦33,000
- Standalone invoice/payment: ₦5,000
- Engineer parts charges net of returns: ₦510,000
- Financial inflows: ₦132,712,600
- Financial outflows: ₦607,000
- Inventory cost movements: ₦64,970,000 net of returns
- Operating expense (rent): ₦600,000
- Engineer payment-out cash cost: ₦7,000

The baseline demonstrates why financial inflow is not revenue: it includes engineer settlements and other cash movements. It also demonstrates why engineer parts-out revenue must be represented separately from engineer payment-in cash.

No historical production rows are deleted or rewritten as part of this Phase 1 work.
