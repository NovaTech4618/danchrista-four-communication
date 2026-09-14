# Danchrista Product Map

## Product decision

Danchrista Four Communication Ventures is the product requirement. The existing NOVATECH application is implementation material, not the product definition.

Primary goal: at closing time, the owner should understand what was sold, what cash was received, what is owed, what stock moved, what was bought, and whether the day produced a profit or loss without manually reconciling multiple books.

## Real shop books -> system

### Book 1 — Sales
Gadgets and accessories, including phones, privacy phones, Android accessories, Samsung screen guards, chargers, Type-C cables, iPhone chargers, earbuds, smartwatches, power banks and similar retail goods.

System outcome:
- Sale transaction
- Sale items
- Payment/cash record
- Stock decrease
- Cost of goods sold
- Gross profit
- Receipt/invoice when required

### Book 2 — Parts
Phone parts such as downboards, charging flex/flat cables, back glass and other repair parts.

System outcome:
- Inventory quantity
- Cost price
- Selling price
- Stock movement
- Engineer issue/return
- Repair usage/return
- Purchase/receiving history

### Book 3 — Engineer credit
An engineer may collect a part/service now and pay later.

System outcome:
- Engineer account
- Debit for part/service issued on credit
- Payment against account
- Running balance
- Complete transaction history
- Parts vs service breakdown
- Outstanding/debt ageing information

## Core business equation

Never collapse these concepts:

**Revenue != Cash received != Outstanding credit != Profit**

For an inventory item:
- Revenue = selling price actually charged
- COGS = cost basis of inventory consumed/sold
- Gross profit = revenue - COGS
- Cash received = amount actually paid now
- Credit = amount still owed

Operating expenses (rent, salary, utilities, etc.) are separate from gross profit. Net operating result should only be presented when the system has the required expense data.

## Core actions

The application should be organized around actions rather than database concepts.

1. **Record Sale**
   - Select item(s), quantity and price
   - Choose payment state/method
   - Automatically update stock, sale totals, payment and profit data

2. **Give Part to Engineer**
   - Select engineer, part and quantity
   - Automatically decrease stock
   - Create engineer debit when unpaid
   - Record the responsible staff member and timestamp

3. **Receive Engineer Payment**
   - Select engineer and amount
   - Automatically reduce outstanding balance
   - Record payment method and timestamp

4. **Record Repair**
   - Customer/device/problem
   - Engineer assignment
   - Service charge
   - Parts used
   - Payment/deposit/credit state
   - Repair status
   - Profit contribution when cost data exists

5. **Add Stock / Receive Purchase**
   - Supplier/purchase reference
   - Item and quantity
   - Unit cost
   - Payment state
   - Automatically increase stock and preserve purchase cost history

6. **Daily Closing**
   - Sales/revenue
   - Cash received by payment method
   - Engineer credit issued
   - Engineer payments received
   - Repair/service revenue
   - Purchases/cash out
   - Gross profit
   - Operating expenses where recorded
   - Net result where determinable
   - Stock anomalies / adjustments

## Owner homepage

The first screen should be a business control panel, not a generic SaaS dashboard.

Header:
- Danchrista
- Good morning/afternoon/evening. Here's today's shop.

Primary numbers:
- Today's Sales
- Today's Gross Profit
- Cash Received
- Engineer Debt
- Active Repairs
- Low Stock

Primary actions:
- Record Sale
- Give Part
- Receive Payment
- Record Repair
- Add Stock

Secondary intelligence:
- What needs attention?
- Who owes the most?
- Low stock
- Today's largest transactions
- Sales/profit trend versus previous day
- Closing checklist

## Navigation model

Keep navigation shallow:

- Overview
- Sales
- Parts & Stock
- Engineers
- Repairs
- Money
- Reports
- Settings

Avoid exposing internal concepts such as "financial ledger", "stock movement foundation", or "RPC" as primary navigation. Those are implementation details.

## Existing implementation assessment

### Strong material to preserve/adapt

- `inventory` already stores `selling_price`, `cost_price`, quantity, minimum stock and item type.
- `sales` + `sale_items` already represent retail transactions.
- `inventory_stock_movements` already models sale, purchase, repair use, engineer issue/return and adjustments.
- `engineers` + engineer transaction/parts/payment tables already model the credit workflow.
- `repairs` already connects devices, engineers, parts usage and repair payments.
- `financial_transactions` provides a separate money/cash layer.
- `inventory_purchases` + purchase items provide purchase history.
- Branch, role, RLS and audit infrastructure should be preserved where it supports security without adding unnecessary user-facing complexity.

### Important gaps to resolve before calling the product complete

1. Retail sales must explicitly support the business distinction between paid-now and credit/amount-due where Danchrista needs it; payment method alone is not sufficient to represent every cash/credit situation.
2. Profit must be based on reliable cost-of-goods data, not only selling totals.
3. Engineer credit must be a first-class action with one transaction path that atomically handles stock + debt + audit records.
4. Repair service revenue, repair parts cost, deposits/payments and outstanding balances must feed one consistent financial model without duplicate entries.
5. Purchase cash-out must be distinguishable from inventory value and gross-profit calculations.
6. Daily closing needs a single owner-facing reconciliation view rather than forcing the owner to assemble figures from separate modules.
7. User-facing terminology should be Danchrista/shop language, not generic enterprise SaaS terminology.
8. The current dashboard should be simplified around today's business state and quick actions.

## Rebuild rule

Before adding a feature, answer:

> Does this help the Danchrista owner record a real shop action, control stock/money/debt, close the day, or understand the business?

If not, it does not belong in the core product.

## Build sequence

### Phase A — Truth model
Map every real-world action to exactly one authoritative database workflow and define invariants.

### Phase B — Core transactions
Sales, stock receiving, engineer issue, engineer payment, repair + parts + payment.

### Phase C — Owner control panel
Today's numbers, quick actions, attention items and daily closing.

### Phase D — Reports
Sales, gross profit, cash, engineer debt, stock, purchases, repairs and daily comparison.

### Phase E — Hardening
RLS, RPC execution boundaries, transaction atomicity, audit logs, idempotency and production verification.

### Phase F — Polish
Responsive UX, receipts, WhatsApp, assistant/intelligence and optional multi-branch features only after the core workflow is stable.

## Current principle

**One action -> one authoritative workflow -> all necessary records update automatically.**
