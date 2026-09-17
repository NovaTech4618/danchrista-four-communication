"use client";

import { useEffect, useState } from "react";
import { Bot, LockKeyhole, Send, Sparkles, Zap } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { askPremiumAssistant, checkPremiumAccess, getPremiumConversation } from "./actions";

type Message = { role: "user" | "assistant"; text: string };
const CONVERSATION_STORAGE_KEY = "danchrista-assistant-conversation";
const suggestions = [
  "Why are sales low today?",
  "Which repairs need attention right now?",
  "What stock should I restock first?",
  "What changed in the shop today?",
  "Show me anything unusual I should check.",
];
const welcomeMessage: Message = { role: "assistant", text: "Tell me what you are worried about in the shop. I can check the records and ask a follow-up question when I need more information." };

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [premium, setPremium] = useState<boolean | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>();

  useEffect(() => {
    let active = true;
    const savedConversationId = window.localStorage.getItem(CONVERSATION_STORAGE_KEY) || undefined;
    async function initialize() {
      try {
        const access = await checkPremiumAccess();
        if (!active) return;
        if (!access.ok) { setPremium(false); return; }
        setPremium(access.premium);
        if (access.premium && savedConversationId) {
          const history = await getPremiumConversation(savedConversationId);
          if (!active) return;
          if (history.ok && history.messages.length > 0) {
            setConversationId(savedConversationId);
            setMessages(history.messages.map((message) => ({ role: message.role, text: message.content })));
          } else window.localStorage.removeItem(CONVERSATION_STORAGE_KEY);
        }
      } catch (error) {
        console.error("Assistant initialization error", error);
        if (active) setPremium(false);
      }
    }
    void initialize();
    return () => { active = false; };
  }, []);

  useEffect(() => { if (conversationId) window.localStorage.setItem(CONVERSATION_STORAGE_KEY, conversationId); }, [conversationId]);

  async function send(value = input) {
    const text = value.trim();
    if (!text || busy || premium !== true) return;
    setInput(""); setMessages((m) => [...m, { role: "user", text }]); setBusy(true);
    try {
      const result = await askPremiumAssistant(text, conversationId);
      setPremium(result.premium);
      if (result.conversationId) setConversationId(result.conversationId);
      setMessages((m) => [...m, { role: "assistant", text: result.text }]);
    } catch { setMessages((m) => [...m, { role: "assistant", text: "The assistant could not complete that request. Please try again." }]); }
    finally { setBusy(false); }
  }

  function startNewConversation() { window.localStorage.removeItem(CONVERSATION_STORAGE_KEY); setConversationId(undefined); setMessages([welcomeMessage]); }

  if (premium === null) return <AppLayout><div className="mx-auto max-w-4xl"><Card className="border-slate-200"><CardContent className="flex min-h-72 items-center justify-center p-10"><div className="flex items-center gap-3 text-sm text-slate-500"><Sparkles className="size-4 animate-pulse text-teal-600" />Checking assistant access…</div></CardContent></Card></div></AppLayout>;
  if (premium === false) return <AppLayout><div className="mx-auto max-w-4xl"><Card className="overflow-hidden border-slate-200"><CardContent className="p-10 text-center sm:p-16"><div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-slate-950 text-white"><LockKeyhole className="size-7" /></div><p className="mt-6 font-mono text-xs font-bold uppercase tracking-[.18em] text-teal-700">Private assistant</p><h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-slate-950">Danchrista Assistant</h1><p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-600">A private assistant for Danchrista shop records.</p><div className="mt-8 grid gap-3 text-left sm:grid-cols-2"><Feature text="Natural-language questions" /><Feature text="Live repairs, inventory, sales and finance context" /><Feature text="Business comparisons and investigation" /><Feature text="Private conversation history" /></div></CardContent></Card></div></AppLayout>;

  return <AppLayout><main className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-6xl flex-col gap-5"><section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-start gap-4"><div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white"><Bot className="size-6" /></div><div><div className="flex items-center gap-2"><Sparkles className="size-4 text-teal-600" /><p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-teal-700">Shop assistant</p></div><h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Ask about the shop.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Ask what happened, what needs attention, or what the records show.</p></div></div><div className="flex items-center gap-2 self-start"><button type="button" onClick={startNewConversation} disabled={busy} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-950 disabled:opacity-50">New chat</button><div className="inline-flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700"><Zap className="size-3.5" /> ASSISTANT</div></div></div></section><Card className="flex min-h-[600px] flex-1 flex-col overflow-hidden"><CardContent className="flex flex-1 flex-col p-0"><div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-8">{messages.map((m, i) => <div key={`${m.role}-${i}`} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[90%] rounded-xl px-4 py-3 text-sm leading-7 ${m.role === "user" ? "bg-slate-950 text-white" : "border border-slate-200 bg-slate-50 text-slate-700"}`}><p className="whitespace-pre-wrap">{m.text}</p></div></div>)}{busy && <div className="flex items-center gap-2 text-sm text-slate-400"><Sparkles className="size-4 animate-pulse" />Checking the shop data…</div>}</div><div className="border-t border-slate-100 p-4 sm:p-5"><div className="mb-4 flex flex-wrap gap-2">{suggestions.map((s) => <button key={s} type="button" onClick={() => void send(s)} disabled={busy || premium !== true} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 disabled:opacity-50">{s}</button>)}</div><form onSubmit={(e) => { e.preventDefault(); void send(); }} className="flex gap-2"><Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about the shop…" disabled={busy || premium !== true} className="h-12" /><Button type="submit" disabled={busy || !input.trim() || premium !== true} className="h-12 px-5"><Send className="size-4" /></Button></form></div></CardContent></Card></main></AppLayout>;
}
function Feature({ text }: { text: string }) { return <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">✓ {text}</div>; }
