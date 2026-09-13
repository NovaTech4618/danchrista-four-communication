"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

type EnrollState = { factorId: string; qrCode: string; secret: string } | null;

export default function TwoFactorAuthCard() {
  const [loading, setLoading] = useState(true);
  const [enabledFactorId, setEnabledFactorId] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState<EnrollState>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function refreshFactors() {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const verified = data.totp.find((f) => f.status === "verified");
    setEnabledFactorId(verified?.id ?? null);
    setLoading(false);
  }

  useEffect(() => {
    void refreshFactors();
  }, []);

  async function startEnroll() {
    setBusy(true);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setEnrolling({ factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
  }

  async function confirmEnroll() {
    if (!enrolling || code.trim().length < 6) {
      toast.error("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setBusy(true);
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: enrolling.factorId });
    if (challengeError) {
      setBusy(false);
      toast.error(challengeError.message);
      return;
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: enrolling.factorId,
      challengeId: challenge.id,
      code: code.trim(),
    });
    setBusy(false);
    if (verifyError) {
      toast.error("That code didn't match. Check your authenticator app and try again.");
      return;
    }
    toast.success("Two-factor authentication is on.");
    setEnrolling(null);
    setCode("");
    await refreshFactors();
  }

  async function disable() {
    if (!enabledFactorId) return;
    setBusy(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId: enabledFactorId });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Two-factor authentication turned off.");
    await refreshFactors();
  }

  return (
    <Card>
      <CardHeader><CardTitle>Two-Factor Authentication</CardTitle></CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Checking status…</p>
        ) : enrolling ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Scan this with an authenticator app (Google Authenticator, Authy, 1Password), then enter the 6-digit code it shows.
            </p>
            <div
              className="mx-auto max-w-[200px] rounded-xl border border-slate-200 p-3"
              // Supabase returns a trusted, server-generated SVG for the TOTP QR code, not user input.
              dangerouslySetInnerHTML={{ __html: enrolling.qrCode }}
            />
            <p className="break-all text-center text-xs text-slate-400">Manual key: {enrolling.secret}</p>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" maxLength={6} className="text-center tracking-[0.3em]" />
            <div className="flex gap-2">
              <Button onClick={confirmEnroll} disabled={busy} className="flex-1">{busy ? "Verifying…" : "Verify & enable"}</Button>
              <Button variant="outline" onClick={() => { setEnrolling(null); setCode(""); }} disabled={busy}>Cancel</Button>
            </div>
          </div>
        ) : enabledFactorId ? (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><ShieldCheck className="size-5" /></div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Enabled</p>
                <p className="text-xs text-slate-500">A code is required at sign-in.</p>
              </div>
            </div>
            <Button variant="outline" onClick={disable} disabled={busy}><ShieldOff className="mr-2 size-4" />{busy ? "Turning off…" : "Turn off"}</Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-slate-600">Add an authenticator app as a second step when signing in.</p>
            <Button onClick={startEnroll} disabled={busy}>{busy ? "Starting…" : "Enable"}</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
