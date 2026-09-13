export function normalizeWhatsAppPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  if (digits.length === 10) return `234${digits}`;
  return digits;
}

export function openWhatsApp(phone: string, message: string) {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) return false;
  const url = `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
  window.location.assign(url);
  return true;
}

export async function notifyOwnerOnWhatsApp(type: "sale" | "repair", id: string) {
  try {
    const { getCurrentSession } = await import("@/lib/supabase");
    const session = await getCurrentSession();
    if (!session?.access_token) return { ok: false, error: "Not authenticated" };

    const response = await fetch("/api/whatsapp/owner-notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ type, id }),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      return {
        ok: false,
        error: result?.error || "WhatsApp notification failed",
      };
    }

    return {
      ok: true,
      messageId: result?.messageId ?? null,
      mode: result?.mode ?? null,
    };
  } catch (error) {
    console.error("Owner WhatsApp notification error", error);
    return { ok: false, error: "WhatsApp notification failed" };
  }
}

export function customerBalanceMessage(name: string, balance: number) {
  const amount = `₦${Number(balance || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
  return `Hello ${name}, this is a friendly reminder from our workshop. Your current outstanding balance is ${amount}. Please let us know when you plan to settle it. Thank you.`;
}

export function customerGeneralMessage(name: string) {
  return `Hello ${name}, this is a message from our workshop. We wanted to get in touch regarding your account/service. Please let us know how we can assist you. Thank you.`;
}
