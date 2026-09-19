# Amezing Limited — Real Product Map

## Product definition

This is a private business management system for **Amezing Limited**. It is not a generic repair-shop SaaS.

The rule is simple:

> **The software must follow the way Amezing Limited already works.**

The three real records are the foundation:

1. **Sales / accessories book** — what was sold and how much was received.
2. **Parts book** — what phone parts are in stock, what moved, prices and reorder needs.
3. **Debit / credit book** — who collected goods and owes Amezing Limited, and who supplied/left goods with Amezing Limited and is owed money.

Repairs are a separate daily workflow because a repair must follow a phone from intake to collection.

---

## 1. SALES — fastest screen in the system

Normal accessory sales are usually anonymous walk-ins.

### Normal flow

**Select item → quantity → price → payment → complete**

Customer name, phone number and other details are optional for ordinary walk-in sales.

### Only ask for customer details when useful

Examples:
- credit/debit account
- repair
- receipt/statement requested
- customer wants an account/history

### Sale automatically

- records sale
- records payment method
- decreases stock
- preserves selling price
- preserves cost basis
- calculates revenue/profit data
- keeps a transaction history

Sales must remain fast enough for a busy counter.

---

## 2. INVENTORY — like a simple shopping catalogue

Inventory is divided into two obvious shelves.

### Accessories & Gadgets

Examples:
- Chargers
- USB cables
- Earphones/headsets
- Power banks
- Speakers
- Phone cases
- Screen protectors
- Smartwatches
- Other accessories

### Phone Parts

Examples:
- Displays / downboards
- Charging flex / flat cables
- Earpiece flex
- Back glass / housing
- Power
- Audio
- Camera
- Other phone parts

Phone-part brands/models can then be grouped underneath these categories: Tecno, Infinix, itel, Samsung, Redmi, Nokia, iPhone, etc.

### Every item should eventually contain

- Item name
- Category
- Subcategory
- Brand/model compatibility where useful
- Quantity
- Cost price
- Normal selling price
- **Minimum selling price / price floor**
- Minimum stock / reorder level
- Supplier
- Shelf/location
- Product picture

### Owner stock signals

The system must answer automatically:

- What is low?
- What is empty?
- What is moving fast?
- What is not moving?
- What is below the reorder level?
- Which products are being sold too cheaply?

### Price-floor rule

Normal selling price is the staff's default price.

Minimum selling price is the lowest acceptable price. A sale below that price should require an owner/authorized override rather than silently allowing it.

---

## 3. REPAIRS — simple repair book

Repair intake should not feel like accounting software.

### Minimum useful record

- Customer name
- Customer phone
- Device
- Problem
- Price / estimate
- Deposit/payment where applicable
- Status

### Status flow

**Received → Diagnosis → Approved → Repairing → Testing → Ready/Completed → Collected**

Exceptional states such as No Fix, Failed Repair, Returned Unrepaired and Cancelled remain available.

### Repair screen must make these obvious

- Who brought the phone?
- What phone is it?
- What is wrong?
- How much?
- Has the customer paid?
- Is the phone ready?
- Who is handling it?

---

## 4. DEBIT — people who owe Amezing Limited

This is a first-class module, not a small part of Sales.

The real daily record is:

**Name → item collected → price → paid/unpaid**

### Each person needs

- Name
- Phone / WhatsApp number
- Items collected
- Amount charged
- Amount paid
- Outstanding balance
- Dates
- Transaction history

### Example

| Person | Item | Price | Status |
|---|---|---:|---|
| Ahmed | Charger | ₦8,000 | Not paid |
| Musa | Earpiece | ₦5,000 | Paid |
| John | Screen | ₦25,000 | Part paid |

### Owner functions

- See everyone owing Amezing Limited
- See total outstanding
- Open a person's account
- Record another item
- Record a payment
- See running balance
- Generate weekly statement
- Generate monthly statement
- Send reminder/statement to WhatsApp

A person's account should never be reduced to one balance number; the transaction history is the source of truth.

---

## 5. CREDIT — people Amezing Limited owes

This is the opposite direction and must remain separate from customer debit.

Amezing Limited sometimes collects goods from people and needs to pay them later.

### The credit record needs

- Person/supplier name
- Phone / WhatsApp
- Goods collected
- Quantity where relevant
- Agreed value
- Amount already paid
- Outstanding amount
- Due date
- Payment history
- Notes

### Owner questions

- Who do we owe?
- How much do we owe them?
- What goods did we collect?
- When should we pay?
- What have we already paid?
- What is due soon?

### Reminder

The system should support due-date reminders so Amezing Limited does not forget to pay someone on time.

This ledger must not be mixed with customer debit, engineer balances or ordinary shop expenses.

---

## 6. OWNER DASHBOARD

The dashboard is not a generic analytics screen.

It should answer five questions immediately:

1. **What sold?**
2. **What is low?**
3. **What is moving fast?**
4. **Who owes us?**
5. **Who do we owe?**

### Primary actions

- Record Sale
- New Repair
- Check Inventory
- Record Debit
- Record Credit/payment

### Owner signals

- Sales today
- Money received
- Low stock
- Out of stock
- Fast-moving goods
- Outstanding customer debit
- Outstanding Amezing Limited credit
- Repairs waiting/ready
- Daily closing

---

## 7. NAVIGATION

Keep it shallow and understandable.

### Dashboard
Owner's view of today's shop.

### Daily Books
- Sales
- Repairs
- Inventory

### Owing & Owed
- Debit — People owe us
- Credit — We owe people

### Owner Control
- Reports
- Daily closing
- Alerts

### People & Tools
- Staff
- WhatsApp
- Search
- Settings

Do not expose database concepts such as RPCs, financial foundations, stock movement engines or internal accounting structures as primary user navigation.

---

## 8. MONEY RULES

Never confuse:

**Revenue ≠ cash received ≠ outstanding debit ≠ credit owed ≠ profit.**

A sale can create revenue and stock movement without requiring customer information.

A debit creates an amount owed to Amezing Limited.

A credit creates an amount Amezing Limited owes someone else.

A payment changes a balance; it should not erase the original transaction.

Profit requires reliable cost data.

---

## 9. WHATSAPP

WhatsApp should be useful, not decoration.

### Customer debit
- weekly statement
- monthly statement
- outstanding reminder

### Credit/payables
- due reminder where appropriate

### Repairs
- ready-for-collection message where appropriate

### Owner alerts
- low stock
- important stock signals
- payment/due reminders

Messages must be generated from real records, not manually typed amounts that can become inaccurate.

---

## 10. BUILD ORDER

### Part 1 — Daily usability
Sales, dashboard, navigation and simple repair intake.

### Part 2 — Inventory intelligence
Categories, pictures, stock levels, low-stock alerts, fast-moving analysis and price-floor enforcement.

### Part 3 — Debit
Daily debit entry, accounts, payments, balances and statements.

### Part 4 — Credit
People Amezing Limited owes, goods collected, due dates, payments and reminders.

### Part 5 — Repair completion
Simple repair lifecycle, payments, collection and parts usage.

### Part 6 — Owner reports
Sales, stock, repairs, debit, credit, profit and daily comparison.

### Part 7 — Daily closing
A single reconciliation screen for the owner.

### Part 8 — WhatsApp automation
Statements, reminders and owner alerts.

### Part 9 — Security and hardening
RLS, permissions, audit history, idempotency and financial integrity.

### Part 10 — Polish
Pictures, responsive UX, search, receipts and other improvements only when they solve a real shop problem.

---

## Final product rule

Before adding anything, ask:

> **Would a Amezing Limited worker or owner actually use this during a normal working day?**

If the answer is no, it does not belong in the core system.
