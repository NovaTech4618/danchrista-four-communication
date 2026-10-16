import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function reply(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply(405, { error: "Method not allowed." });

  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const site = Deno.env.get("APP_SITE_URL") ?? "https://danchrista-four-communication.vercel.app";
  if (!url || !anon || !service) return reply(500, { error: "Staff invitation service is not configured." });

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return reply(401, { error: "Sign in as the shop owner first." });

  const userClient = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } },
  });
  const { data: authData, error: authError } = await userClient.auth.getUser(authorization.slice(7));
  if (authError || !authData.user) return reply(401, { error: "Your session is invalid. Sign in again." });

  let body: { email?: string; branch_ids?: string[] };
  try { body = await req.json(); } catch { return reply(400, { error: "Invalid request body." }); }

  const email = body.email?.trim().toLowerCase();
  const branchIds = body.branch_ids;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return reply(400, { error: "Enter a valid email address." });
  }
  if (!Array.isArray(branchIds) || branchIds.length === 0 || branchIds.some((id) => typeof id !== "string")) {
    return reply(400, { error: "Choose a valid shop branch." });
  }
  if (email === authData.user.email?.toLowerCase()) return reply(400, { error: "You cannot invite your own account." });

  const { data: invitation, error: invitationError } = await userClient.rpc("create_staff_invitation", {
    p_email: email,
    p_role: "apprentice",
    p_branch_ids: branchIds,
  });
  if (invitationError || !invitation) {
    return reply(400, { error: invitationError?.message ?? "Could not create the staff invitation." });
  }
  const invitationId = typeof invitation === "string" ? invitation : invitation.id;
  if (!invitationId) return reply(500, { error: "Invitation was created but its ID could not be confirmed." });

  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const redirectTo = site.replace(/\/$/, "") + "/login?type=invite";

  // Auth-generated action links work without SMTP; the owner shares them privately.
  let { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo },
  });

  // If this email already has an Auth account, generate a sign-in link for that
  // same email instead. The invitation RPC still controls whether access is granted.
  if (linkError && /already|registered|exists/i.test(linkError.message)) {
    const existingAccountLink = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });
    linkData = existingAccountLink.data;
    linkError = existingAccountLink.error;
  }

  if (linkError || !linkData?.properties?.action_link) {
    await userClient.from("staff_invitations").update({ status: "revoked" }).eq("id", invitationId);
    console.error("Staff invitation link generation failed", { message: linkError?.message ?? "No action link returned" });
    return reply(502, { error: "Could not create a secure invitation link. Please check the email address and try again." });
  }

  return reply(200, {
    ok: true,
    invitationId,
    email,
    actionLink: linkData.properties.action_link,
    message: "Secure invitation link created. Share it privately with the intended staff member.",
  });
});