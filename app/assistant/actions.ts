"use server";

import { createClient } from "@/lib/supabase/server";

export type AssistantResult = { ok: boolean; text: string; conversationId?: string };
export type AssistantConversationMessage = { role: "user" | "assistant"; content: string };

type Row = Record<string, unknown>;
const MAX_QUESTION_LENGTH = 2000;
const MAX_CONTEXT_CHARS = 90_000;

function boundedText(value: string, max: number) { return value.length <= max ? value : `${value.slice(0, max)}\n[context truncated]`; }
function rows(value: unknown): Row[] { return Array.isArray(value) ? value.filter((v): v is Row => !!v && typeof v === "object") : []; }
function num(row: Row, ...keys: string[]) { for (const key of keys) { const n = Number(row[key]); if (Number.isFinite(n)) return n; } return 0; }
function text(row: Row, ...keys: string[]) { for (const key of keys) { if (row[key] !== null && row[key] !== undefined) return String(row[key]); } return ""; }
function dateOf(row: Row, ...keys: string[]) { return text(row, ...keys).slice(0, 10); }
function todayInLagos() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date()); }
function daysAgo(date: string, today: string) { const a = Date.parse(`${date}T00:00:00Z`); const b = Date.parse(`${today}T00:00:00Z`); return Number.isFinite(a) && Number.isFinite(b) ? Math.floor((b - a) / 86400000) : null; }

async function authenticatedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { supabase, user: null };
  return { supabase, user };
}

export async function getAssistantConversation(conversationId?: string): Promise<{ ok: boolean; messages: AssistantConversationMessage[] }> {
  if (!conversationId) return { ok: true, messages: [] };
  const { supabase, user } = await authenticatedClient();
  if (!user) return { ok: false, messages: [] };
  const { data: conversation } = await supabase.from("assistant_conversations").select("id").eq("id", conversationId).eq("created_by", user.id).maybeSingle();
  if (!conversation) return { ok: false, messages: [] };
  const { data, error } = await supabase.from("assistant_messages").select("role,content").eq("conversation_id", conversation.id).order("created_at", { ascending: true }).limit(100);
  if (error) return { ok: false, messages: [] };
  return { ok: true, messages: (data ?? []).filter((m): m is AssistantConversationMessage => (m.role === "user" || m.role === "assistant") && typeof m.content === "string") };
}

export async function askAssistant(question: string, conversationId?: string): Promise<AssistantResult> {
  const cleanQuestion = question.trim();
  if (!cleanQuestion) return { ok: false, text: "Please ask a question." };
  if (cleanQuestion.length > MAX_QUESTION_LENGTH) return { ok: false, text: `Please keep your question under ${MAX_QUESTION_LENGTH.toLocaleString()} characters.` };

  const { supabase, user } = await authenticatedClient();
  if (!user) return { ok: false, text: "Your session has expired. Please sign in again." };
  const { data: profile } = await supabase.from("profiles").select("full_name,role,company_id").eq("id", user.id).maybeSingle();
  if (!profile?.company_id) return { ok: false, text: "Your Amezing account is not fully configured yet. Please contact the owner." };
  const companyId = profile.company_id;

  const [{ data: repairs }, { data: inventory }, { data: customers }, { data: services }, { data: engineers }, { data: sales }, { data: debts }, { data: engineerTransactions }, { data: dashboard }] = await Promise.all([
    supabase.from("repairs").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(100),
    supabase.from("inventory").select("*").eq("company_id", companyId).order("quantity", { ascending: true }).limit(150),
    supabase.from("customers").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(120),
    supabase.from("technical_services").select("*").eq("company_id", companyId).order("name").limit(100),
    supabase.from("engineers").select("*").eq("company_id", companyId).limit(100),
    supabase.from("sales").select("*").eq("company_id", companyId).order("sale_date", { ascending: false }).limit(120),
    supabase.from("customer_debt_ledger").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(150),
    supabase.from("engineer_transactions").select("id,engineer_id,transaction_type,description,debit,credit,payment_method,transaction_date,notes,created_at").eq("company_id", companyId).order("transaction_date", { ascending: false }).limit(500),
    supabase.rpc("get_dashboard_summary"),
  ]);

  const currentDate = todayInLagos();
  const salesRows = rows(sales), repairRows = rows(repairs), inventoryRows = rows(inventory), customerRows = rows(customers), engineerRows = rows(engineers), debtRows = rows(debts), engineerTransactionRows = rows(engineerTransactions);
  const todaySales = salesRows.filter(r => dateOf(r, "sale_date", "sales_date", "created_at") === currentDate);
  const recentSales = salesRows.filter(r => { const d = dateOf(r, "sale_date", "sales_date", "created_at"); const age = daysAgo(d, currentDate); return age !== null && age >= 0 && age <= 6; });
  const todayRepairs = repairRows.filter(r => dateOf(r, "created_at", "repair_date") === currentDate);
  const openRepairs = repairRows.filter(r => !["completed", "delivered", "collected", "cancelled", "closed"].includes(text(r, "status").toLowerCase()));
  const lowStock = inventoryRows.filter(r => num(r, "quantity", "stock", "current_quantity") <= Math.max(0, num(r, "reorder_level", "low_stock_threshold", "minimum_stock")));
  const salesTotal = (list: Row[]) => list.reduce((s, r) => s + num(r, "total", "grand_total", "amount"), 0);
  const customerDebtTotal = debtRows.reduce((s, r) => s + Math.max(0, num(r, "balance", "outstanding", "debit", "amount_due")), 0);
  const engineerSignals = engineerRows.map(e => {
    const id = text(e, "id", "engineer_id"), name = text(e, "full_name", "name", "engineer_name") || "Unnamed engineer";
    const related = engineerTransactionRows.filter(t => text(t, "engineer_id") === id);
    const debit = related.reduce((s, t) => s + Math.max(0, num(t, "debit")), 0), credit = related.reduce((s, t) => s + Math.max(0, num(t, "credit")), 0);
    const payments = related.filter(t => text(t, "transaction_type").toLowerCase() === "payment_in");
    const lastPaymentDate = payments.map(t => dateOf(t, "transaction_date", "created_at")).filter(Boolean).sort().at(-1) ?? "";
    return { name, balance: debit - credit, transactionCount: related.length, paymentCount: payments.length, lastPaymentDate, lastPaymentAgeDays: lastPaymentDate ? daysAgo(lastPaymentDate, currentDate) : null };
  }).filter(e => e.balance > 0 || e.transactionCount > 0).sort((a, b) => b.balance - a.balance);

  const intelligence = {
    today: { date: currentDate, salesCount: todaySales.length, salesTotal: salesTotal(todaySales), repairsCreated: todayRepairs.length },
    last7Days: { salesCount: recentSales.length, salesTotal: salesTotal(recentSales), averageDailySales: salesTotal(recentSales) / 7 },
    repairs: { openCount: openRepairs.length, createdToday: todayRepairs.length },
    inventory: { itemCount: inventoryRows.length, lowStockCount: lowStock.length, lowStockItems: lowStock.slice(0, 25).map(r => ({ name: text(r, "name", "item_name", "product_name"), quantity: num(r, "quantity", "stock", "current_quantity"), reorderLevel: num(r, "reorder_level", "low_stock_threshold", "minimum_stock") })) },
    customers: { count: customerRows.length }, debts: { customerDebtRows: debtRows.length, customerDebtTotal }, engineers: { count: engineerRows.length, balances: engineerSignals }, dashboard,
  };

  let conversation = conversationId;
  if (conversation) {
    const { data: existing } = await supabase.from("assistant_conversations").select("id").eq("id", conversation).eq("created_by", user.id).eq("company_id", companyId).maybeSingle();
    if (!existing) conversation = undefined;
  }
  if (!conversation) {
    const { data: created, error } = await supabase.from("assistant_conversations").insert({ company_id: companyId, created_by: user.id, title: cleanQuestion.slice(0, 80) }).select("id").single();
    if (error || !created) return { ok: false, text: "I couldn't start this conversation. Please try again." };
    conversation = created.id;
  }
  const { error: userMessageError } = await supabase.from("assistant_messages").insert({ conversation_id: conversation, company_id: companyId, user_id: user.id, role: "user", content: cleanQuestion });
  if (userMessageError) return { ok: false, text: "I couldn't save your message. Please try again.", conversationId: conversation };

  const context = boundedText(JSON.stringify({ currentDate, profile, intelligence, records: { repairs: repairRows, inventory: inventoryRows, customers: customerRows, services: rows(services), engineers: engineerRows, sales: salesRows, customerDebtLedger: debtRows, engineerTransactions: engineerTransactionRows } }), MAX_CONTEXT_CHARS);
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-5.6-luna";
  if (!apiKey) return { ok: false, text: "The Amezing Assistant is not connected to its AI service yet. Add OPENAI_API_KEY to the server environment.", conversationId: conversation };

  const history = await supabase.from("assistant_messages").select("role,content").eq("conversation_id", conversation).order("created_at", { ascending: true }).limit(30);
  const historyText = boundedText((history.data ?? []).map(m => `${String(m.role).toUpperCase()}: ${String(m.content)}`).join("\n"), 50_000);
  const instructions = `You are Amezing Assistant, a practical business assistant for Amezing Limited.

Investigate the shop records and give the owner or authorized staff a useful answer. Do not sound like a SaaS product.

DATE: Today is ${currentDate} in Africa/Lagos. Use this exact date. A sale is dated by sale_date when available.

RULES:
1. Start with the finding, not a generic introduction.
2. Use deterministic signals first, then reason over them.
3. Separate FACT from INFERENCE. Never invent a cause.
4. Use concrete naira amounts, counts, dates and names when useful.
5. Keep customer debit and engineer balances separate. Never net different ledgers together.
6. For low sales, compare today with the 7-day average and inspect customer, repair and inventory signals.
7. For delayed repairs, inspect status, age, assigned person and balance. Do not invent an expected completion date.
8. For stock questions, inspect quantity and reorder thresholds and connect stock to sales or repairs where useful.
9. Never claim you changed a record, collected money, contacted someone or performed an action unless a real tool confirms it.
10. If the records cannot establish the cause, say what is missing.

Keep answers calm, direct and practical. Simple lookup: 1–2 sentences. Investigation: finding → evidence → meaning → next useful check.

LIVE DANCHRISTA DATA:
${context}`;

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model, instructions, input: historyText, store: false }) });
  } catch (error) {
    console.error("Amezing Assistant network error", error);
    return { ok: false, text: "I can't reach the AI service right now. Please try again shortly.", conversationId: conversation };
  }
  if (!response.ok) {
    const detail = await response.text(); console.error("Amezing Assistant provider error", response.status, detail);
    const message = response.status === 401 ? "The AI provider rejected the API key. Check OPENAI_API_KEY." : response.status === 429 ? "The AI service is temporarily rate-limited or out of available quota. Try again shortly." : `The AI service returned an error (${response.status}). Check the server configuration.`;
    return { ok: false, text: message, conversationId: conversation };
  }
  const payload = await response.json() as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
  const answer = payload.output_text?.trim() || payload.output?.flatMap(item => item.content ?? []).map(part => part.text ?? "").join("\n").trim();
  const resultText = answer || "I couldn't produce a response from the available Amezing records.";
  const { error: assistantMessageError } = await supabase.from("assistant_messages").insert({ conversation_id: conversation, company_id: companyId, user_id: user.id, role: "assistant", content: resultText });
  if (assistantMessageError) console.error("Amezing Assistant save error", assistantMessageError);
  await supabase.from("assistant_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversation).eq("company_id", companyId);
  return { ok: true, text: resultText, conversationId: conversation };
}
