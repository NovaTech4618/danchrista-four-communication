# Danchrista Four Communication — Real Workflow

This project is a private business system for Danchrista Four Communication Ventures. It is not a generic repair-shop SaaS.

## Core rule

**The worker records what happened. The system keeps the business picture.**

Do not force normal shop transactions to behave like customer-management software.

## 1. Sales

Normal sales are mostly anonymous walk-ins.

Required flow:

1. Choose goods.
2. Choose quantity.
3. Confirm selling price.
4. Choose payment method.
5. Complete sale.

Customer name/phone is optional. It becomes relevant when the transaction needs a person/account record, especially for credit/debit.

Every completed sale reduces inventory automatically.

Sales must remain conceptually separate from the debit book and phone-parts book.

## 2. Inventory

Inventory is presented like a shopping catalogue, not a giant accounting table.

Top-level groups:

- Accessories & gadgets
- Phone parts

Phone parts should eventually be subdivided into useful families such as:

- Downboards: Tecno, Infinix, itel, Samsung, Redmi, Nokia
- Charging flex
- Earpiece flex
- iPhone charging / earpiece flex
- Back glass / housing
- Other phone parts

Accessories should have similarly obvious categories such as chargers, cables, earphones, headsets, power banks, speakers and phone accessories.

Each item needs, at minimum:

- name
- category/subcategory
- quantity
- selling price
- cost price
- minimum stock/reorder level
- shelf/location where useful

Required owner signals:

- low stock
- out of stock
- fast-moving items
- slow/non-moving items
- selling price
- minimum/floor price (requires the inventory schema to gain a dedicated field before enforcement)

The floor price must eventually protect the shop from selling below the owner's allowed minimum without an authorized override.

## 3. Repairs

Repair intake must be short.

Core record:

- person/customer
- item/device
- problem/service
- price
- status

Typical statuses:

- Received
- In progress
- Ready
- Collected

Do not make repair intake depend on a large customer profile before saving a job.

## 4. Debit — people who owe Danchrista

This is a first-class business ledger, not a small option hidden inside sales.

The daily record is essentially:

**Name → item collected → price → paid/unpaid → running balance**

The system must support multiple entries for the same person and calculate the outstanding balance.

Each account should store a phone/WhatsApp number when reminders/statements are needed.

Owner views should answer:

- who owes us?
- how much?
- what did they collect?
- what have they paid?
- what is still outstanding?
- what happened this week/month?

Future messaging flow:

- generate weekly/monthly statement
- send statement/reminder to WhatsApp
- keep a record of the message/statement event

## 5. Credit / Payables — people Danchrista owes

This is the opposite direction and must remain separate from debit.

When Danchrista collects goods from someone and has not fully paid them, the system records:

- person/supplier
- WhatsApp/phone
- item/goods received
- value
- amount already paid
- balance owed by Danchrista
- due date
- payment status

Owner views should answer:

- who do we owe?
- how much?
- what goods did we collect?
- when is payment due?
- what has already been paid?

The system should support reminders before/at the due date.

## 6. Dashboard

The dashboard should answer five owner questions immediately:

1. What sold today?
2. What stock is low or finished?
3. What goods are moving fast?
4. Who owes Danchrista?
5. Who does Danchrista owe?

Quick actions should prioritize:

- New sale
- New repair
- Inventory
- Record debit

## 7. Separation of records

Danchrista has different real-world books. The software must respect that separation:

- Sales/accessories book
- Phone-parts/stock book
- Repairs book
- Debit/receivables book
- Credit/payables book
- Money/cash movement

They can connect underneath the system, but the UI must not collapse them into one confusing transaction screen.

## 8. Design principle

A new staff member should be able to operate the system without understanding accounting terminology.

The interface should use plain shop language, large obvious actions, minimal required fields, and clear owner-only detail.

## 9. Current implementation boundary

The UI has been redesigned around this model. The existing financial and inventory foundations should be preserved.

The next deep backend phase is the dedicated debit/credit ledger. It should not be simulated with the existing engineer-only ledger because Danchrista's debit book is broader than engineers.
