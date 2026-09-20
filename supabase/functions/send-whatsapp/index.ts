import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function hex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256(value: string) {
  return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405 });
  }

  try {
    const providedSecret = req.headers.get("x-cron-secret");
    if (!providedSecret || providedSecret.length < 32) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
    }

    const { data: expectedHash, error: secretError } = await supabase.rpc(
      "get_whatsapp_dispatch_secret_hash",
    );

    if (secretError || !expectedHash) {
      console.error("dispatch authentication is not configured");
      return new Response(JSON.stringify({ error: "service_unavailable" }), { status: 503 });
    }

    const providedHash = await sha256(providedSecret);
    if (providedHash !== expectedHash) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
    }

    const staleCutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    await supabase
      .from("whatsapp_message_log")
      .update({
        status: "queued",
        processing_at: null,
        error: "Recovered from an interrupted dispatch attempt",
      })
      .eq("status", "processing")
      .lt("processing_at", staleCutoff);

    const { data: queued, error: queueError } = await supabase
      .from("whatsapp_message_log")
      .select("id, company_id, phone, body")
      .eq("status", "queued")
      .order("created_at", { ascending: true })
      .limit(25);

    if (queueError) throw queueError;

    let claimed = 0;
    let sent = 0;
    let failed = 0;
    const settingsCache = new Map<string, any>();

    for (const candidate of queued ?? []) {
      const { data: msg, error: claimError } = await supabase
        .from("whatsapp_message_log")
        .update({
          status: "processing",
          processing_at: new Date().toISOString(),
          error: null,
        })
        .eq("id", candidate.id)
        .eq("status", "queued")
        .select("id, company_id, phone, body")
        .maybeSingle();

      if (claimError) {
        console.error("message claim failed", claimError.message);
        continue;
      }
      if (!msg) continue;

      claimed++;

      try {
        let settings = settingsCache.get(msg.company_id);
        if (!settings) {
          const { data: s, error: settingsError } = await supabase
            .from("whatsapp_settings")
            .select("*")
            .eq("company_id", msg.company_id)
            .single();

          if (settingsError) throw settingsError;
          settings = s;
          settingsCache.set(msg.company_id, s);
        }

        if (!settings?.is_enabled || !settings.access_token || !settings.phone_number_id) {
          await supabase
            .from("whatsapp_message_log")
            .update({
              status: "failed",
              processing_at: null,
              error: "WhatsApp is not configured for this company",
            })
            .eq("id", msg.id)
            .eq("status", "processing");
          failed++;
          continue;
        }

        let phone = (msg.phone || "").replace(/[^0-9]/g, "");
        if (phone.startsWith("0")) {
          phone = (settings.default_country_code || "234") + phone.slice(1);
        }
        if (phone.length < 8) {
          throw new Error("Invalid destination phone number");
        }

        const resp = await fetch(
          `https://graph.facebook.com/v20.0/${settings.phone_number_id}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${settings.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: phone,
              type: "text",
              text: { body: msg.body },
            }),
          },
        );

        const result = await resp.json().catch(() => null);

        if (!resp.ok) {
          await supabase
            .from("whatsapp_message_log")
            .update({
              status: "failed",
              processing_at: null,
              error: `WhatsApp provider returned HTTP ${resp.status}`,
            })
            .eq("id", msg.id)
            .eq("status", "processing");
          failed++;
          continue;
        }

        await supabase
          .from("whatsapp_message_log")
          .update({
            status: "sent",
            processing_at: null,
            sent_at: new Date().toISOString(),
            provider_message_id: result?.messages?.[0]?.id ?? null,
            error: null,
          })
          .eq("id", msg.id)
          .eq("status", "processing");

        sent++;
      } catch (innerError) {
        console.error("message dispatch failed", innerError);
        await supabase
          .from("whatsapp_message_log")
          .update({
            status: "failed",
            processing_at: null,
            error: "Unexpected dispatch failure",
          })
          .eq("id", msg.id)
          .eq("status", "processing");
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ processed: claimed, sent, failed }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("dispatch worker failed", error);
    return new Response(JSON.stringify({ error: "internal_error" }), { status: 500 });
  }
});
