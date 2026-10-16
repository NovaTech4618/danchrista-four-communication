import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
function reply(status: number, body: Record<string, unknown>) { return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply(405, { error: "Method not allowed" });
  const url = Deno.env.get("SUPABASE_URL"), anon = Deno.env.get("SUPABASE_ANON_KEY"), service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const site = Deno.env.get("APP_SITE_URL") ?? "https://danchrista-four-communication.vercel.app";
  if (!url || !anon || !service) return reply(500, { error: "Invitation email service is not configured." });
  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return reply(401, { error: "Authentication required." });
  const userClient = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: authorization } } });
  const { data: authData, error: authError } = await userClient.auth.getUser(authorization.slice(7));
  if (authError || !authData.user) return reply(401, { error: "Your session is invalid. Sign in again." });
  let body: { email?: string; branch_ids?: string[] };
  try { body = await req.json(); } catch { return reply(400, { error: "Invalid request body." }); }
  const email = body.email?.trim().toLowerCase(), branchIds = body.branch_ids;
  if (!email || !email.includes("@") || email.startsWith("@") || email.endsWith("@")) return reply(400, { error: "Enter a valid email address." });
  if (!Array.isArray(branchIds) || branchIds.length === 0 || branchIds.some((id) => typeof id !== "string")) return reply(400, { error: "Choose a valid shop branch." });
  if (email === authData.user.email?.toLowerCase()) return reply(400, { error: "You cannot invite your own account." });
  const { data: invitation, error: invitationError } = await userClient.rpc("create_staff_invitation", { p_email: email, p_role: "apprentice", p_branch_ids: branchIds });
  if (invitationError || !invitation) return reply(400, { error: invitationError?.message ?? "Could not create the staff invitation." });
  const invitationId = typeof invitation === "string" ? invitation : invitation.id;
  if (!invitationId) return reply(500, { error: "Invitation was created but its ID could not be confirmed." });
  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: emailError } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: site.replace(/\/$/, "") + "/login?type=invite" });
  if (emailError) {
    await userClient.from("staff_invitations").update({ status: "revoked" }).eq("id", invitationId);
    console.error("Staff invitation email failed", { message: emailError.message });
    return reply(502, { error: "Supabase could not send the email. Check Auth email/SMTP settings and try again." });
  }
  return reply(200, { ok: true, invitationId, email, message: "Invitation email accepted by Supabase Auth." });
});