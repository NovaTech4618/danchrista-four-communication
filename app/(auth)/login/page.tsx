"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { NovatechLogo } from "@/components/brand/NovatechLogo";

type AuthMode = "login" | "signup" | "setup" | "verify" | "forgot" | "reset" | "mfa";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState("");

  function getAuthRedirectUrl() {
    return `${window.location.origin}/login`;
  }

  function getAuthUrlValue(name: string) {
    const searchParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
    const hashParams = new URLSearchParams(hash);
    return searchParams.get(name) ?? hashParams.get(name);
  }

  function hasRecoverySignal() {
    return getAuthUrlValue("type") === "recovery";
  }

  function showCallbackError() {
    const error = getAuthUrlValue("error_description") ?? getAuthUrlValue("error");
    if (!error) return;
    const friendlyError = decodeURIComponent(error.replace(/\+/g, " "));
    setAuthError(
      friendlyError.toLowerCase().includes("expired") || friendlyError.toLowerCase().includes("invalid")
        ? "That link is invalid or has expired. Request a new one and try again."
        : friendlyError,
    );
  }

  async function ensureCompanyThenRedirect() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.company_id) {
      setLoading(false);
      router.replace("/dashboard");
      return;
    }

    const { data: joinedCompanyId, error: inviteError } = await supabase.rpc("accept_staff_invitation");
    setLoading(false);

    if (!inviteError && joinedCompanyId) {
      toast.success("Welcome to the team!");
      router.replace("/dashboard");
      return;
    }

    setMode("setup");
  }

  useEffect(() => {
    showCallbackError();
    if (hasRecoverySignal()) setMode("reset");

    // A visit to /login must remain a login page. Do not redirect because a
    // previous browser session already exists. Redirect only after an explicit
    // sign-in, sign-up, or password recovery action.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setAuthError("");
        setMode("reset");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleCreateCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim()) {
      toast.error("Business name is required.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.rpc("create_company_for_new_user", { company_name: companyName.trim() });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Welcome to NOVATECH!");
    router.replace("/dashboard");
  }

  async function resendVerification() {
    if (!email.trim()) {
      toast.error("Enter your email first.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: getAuthRedirectUrl() },
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Verification email sent again.");
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Enter your email first.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: getAuthRedirectUrl() });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Password reset email sent.");
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Use at least 8 characters for your new password.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Password updated. Welcome back.");
    setNewPassword("");
    await ensureCompanyThenRedirect();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Email and password are required.");
      return;
    }

    if (mode === "signup" && password.length < 8) {
      toast.error("Use at least 8 characters for your password.");
      return;
    }

    setAuthError("");
    setLoading(true);

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: getAuthRedirectUrl() },
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (!data.session) {
        setLoading(false);
        setMode("verify");
        return;
      }

      await ensureCompanyThenRedirect();
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setLoading(false);
        setMode("verify");
        return;
      }

      toast.error("Unable to sign in. Check your email and password.");
      setLoading(false);
      return;
    }

    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.nextLevel === "aal2" && aal.nextLevel !== aal.currentLevel) {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const factor = factors?.totp.find((f) => f.status === "verified");
      if (factor) {
        setMfaFactorId(factor.id);
        setLoading(false);
        setMode("mfa");
        return;
      }
    }

    await ensureCompanyThenRedirect();
  }

  async function handleMfaVerify(e: React.FormEvent) {
    e.preventDefault();
    if (mfaCode.trim().length < 6) {
      toast.error("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setLoading(true);
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
    if (challengeError) {
      setLoading(false);
      toast.error(challengeError.message);
      return;
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: mfaFactorId,
      challengeId: challenge.id,
      code: mfaCode.trim(),
    });
    if (verifyError) {
      setLoading(false);
      toast.error("That code didn't match. Try again.");
      return;
    }
    await ensureCompanyThenRedirect();
  }

  if (mode === "mfa") {
    return (
      <AuthShell>
        <NovatechLogo />
        <div className="mx-auto mt-8 grid size-14 place-items-center rounded-2xl bg-teal-50 text-teal-700"><ShieldCheck className="size-6" /></div>
        <h1 className="mt-6 text-center font-heading text-3xl font-bold tracking-tight">Enter your code</h1>
        <p className="mt-3 text-center text-sm leading-6 text-slate-500">Open your authenticator app and enter the 6-digit code for this account.</p>
        <form onSubmit={handleMfaVerify} className="mt-7 space-y-4">
          <input
            type="text"
            inputMode="numeric"
            autoFocus
            maxLength={6}
            placeholder="123456"
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value)}
            className="control text-center text-lg tracking-[0.4em]"
          />
          <button type="submit" disabled={loading} className="group flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50">{loading ? "Verifying…" : "Verify"}<ArrowRight className="size-4" /></button>
        </form>
        <button type="button" onClick={() => { setMode("login"); setMfaCode(""); }} className="mt-3 w-full rounded-xl border border-slate-200 px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">Back to sign in</button>
      </AuthShell>
    );
  }

  if (mode === "verify") {
    return (
      <AuthShell>
        <NovatechLogo />
        <div className="mx-auto mt-8 grid size-14 place-items-center rounded-2xl bg-teal-50 text-teal-700"><Mail className="size-6" /></div>
        <h1 className="mt-6 text-center font-heading text-3xl font-bold tracking-tight">Check your email</h1>
        <p className="mt-3 text-center text-sm leading-6 text-slate-500">We sent a verification link to <strong className="font-semibold text-slate-800">{email}</strong>.</p>
        {authError && <ErrorMessage>{authError}</ErrorMessage>}
        <button type="button" onClick={resendVerification} disabled={loading} className="mt-7 w-full rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50">{loading ? "Sending…" : "Resend verification email"}</button>
        <button type="button" onClick={() => { setAuthError(""); setMode("login"); }} className="mt-3 w-full rounded-xl border border-slate-200 px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">Back to sign in</button>
        <p className="mt-6 text-center text-xs text-slate-400">Check spam or promotions if it doesn’t arrive.</p>
      </AuthShell>
    );
  }

  if (mode === "setup") {
    return (
      <AuthShell>
        <NovatechLogo />
        <div className="mt-8"><p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">First step</p><h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">Set up your workshop</h1><p className="mt-3 text-sm leading-6 text-slate-500">Your account is ready. Give the business a name and NOVATECH will create the workspace.</p></div>
        <form onSubmit={handleCreateCompany} className="mt-7 space-y-4">
          <FieldLabel label="Business / shop name"><input type="text" autoFocus placeholder="e.g. Danchrista Four Communications" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="control" /></FieldLabel>
          <button type="submit" disabled={loading} className="group flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50">{loading ? "Creating workspace…" : "Create my workspace"}<ArrowRight className="size-4" /></button>
        </form>
      </AuthShell>
    );
  }

  if (mode === "forgot") {
    return (
      <AuthShell>
        <NovatechLogo />
        <div className="mt-8"><p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Account recovery</p><h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">Reset your password</h1><p className="mt-3 text-sm leading-6 text-slate-500">Enter your account email and we’ll send a secure reset link.</p></div>
        {authError && <ErrorMessage>{authError}</ErrorMessage>}
        <form onSubmit={handleForgotPassword} className="mt-7 space-y-4">
          <FieldLabel label="Email"><input type="email" autoFocus autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="control" /></FieldLabel>
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50">{loading ? "Sending reset link…" : "Send reset link"}</button>
        </form>
        <button type="button" onClick={() => { setAuthError(""); setMode("login"); }} className="mt-5 w-full text-center text-sm font-semibold text-slate-500 hover:text-slate-900">Back to sign in</button>
      </AuthShell>
    );
  }

  if (mode === "reset") {
    return (
      <AuthShell>
        <NovatechLogo />
        <div className="mx-auto mt-8 grid size-14 place-items-center rounded-2xl bg-teal-50 text-teal-700"><LockKeyhole className="size-6" /></div>
        <h1 className="mt-6 text-center font-heading text-3xl font-bold tracking-tight">Choose a new password</h1>
        <p className="mt-3 text-center text-sm leading-6 text-slate-500">Use at least 8 characters, then you’ll go straight back to your workshop.</p>
        <form onSubmit={handleResetPassword} className="mt-7 space-y-4">
          <FieldLabel label="New password"><PasswordField value={newPassword} onChange={setNewPassword} show={showPassword} onToggle={() => setShowPassword((value) => !value)} autoComplete="new-password" /></FieldLabel>
          <button type="submit" disabled={loading} className="group flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50">{loading ? "Updating password…" : "Update password"}<ArrowRight className="size-4" /></button>
        </form>
      </AuthShell>
    );
  }

  const signup = mode === "signup";

  return (
    <main className="min-h-screen bg-[#f5f7f6] text-slate-950">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(45,212,191,0.18),transparent_30%),radial-gradient(circle_at_90%_75%,rgba(20,184,166,0.12),transparent_34%)]" />
          <div className="relative">
            <NovatechLogo dark />
            <div className="mt-20 max-w-2xl"><p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-300">The calmer repair desk</p><h2 className="mt-5 font-heading text-5xl font-bold leading-[1.02] tracking-[-0.04em] xl:text-6xl">Run the shop without the notebook-and-WhatsApp chaos.</h2><p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">Keep customers, devices, repairs, engineers, stock and payments connected from intake to pickup.</p></div>
          </div>
          <div className="relative grid max-w-xl gap-3 sm:grid-cols-2"><Benefit text="Track every repair" /><Benefit text="Know every part" /><Benefit text="See what customers owe" /><Benefit text="Keep engineers accountable" /></div>
        </section>

        <section className="flex items-center px-5 py-8 sm:px-8 lg:px-14 xl:px-20">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8"><div className="mb-8 lg:hidden"><NovatechLogo /></div><p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">{signup ? "Create your workspace" : "Welcome back"}</p><h1 className="mt-2 font-heading text-4xl font-bold tracking-tight">{signup ? "Start with NOVATECH." : "Sign in to your workshop."}</h1><p className="mt-3 text-sm leading-6 text-slate-500">{signup ? "Create your account, then set up the business workspace." : "Everything you need to run the repair desk is here."}</p></div>
            {authError && <ErrorMessage>{authError}</ErrorMessage>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <FieldLabel label="Email"><div className="relative"><Mail className="icon" /><input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="control pl-11" /></div></FieldLabel>
              <FieldLabel label="Password">
                <PasswordField value={password} onChange={setPassword} show={showPassword} onToggle={() => setShowPassword((value) => !value)} autoComplete={signup ? "new-password" : "current-password"} />
                {signup && <p className="mt-1.5 text-xs text-slate-400">At least 8 characters.</p>}
              </FieldLabel>
              {!signup && <div className="flex justify-end"><button type="button" onClick={() => setMode("forgot")} className="text-xs font-semibold text-teal-700 hover:text-teal-800">Forgot password?</button></div>}
              <button type="submit" disabled={loading} className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50">{loading ? "Please wait…" : signup ? "Create account" : "Sign in"}<ArrowRight className="size-4 transition group-hover:translate-x-0.5" /></button>
            </form>

            <div className="mt-7 flex items-center gap-3 text-[11px] font-medium text-slate-400"><div className="h-px flex-1 bg-slate-200" />SECURE WORKSPACE<div className="h-px flex-1 bg-slate-200" /></div>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500"><ShieldCheck className="size-4 text-teal-700" />Your workspace is protected by your account permissions.</div>
            <button type="button" onClick={() => { setAuthError(""); setMode(signup ? "login" : "signup"); }} className="mt-7 w-full text-center text-sm font-semibold text-teal-700 hover:text-teal-800">{signup ? "Already have an account? Sign in" : "New to NOVATECH? Create an account"}</button>
            {signup && <p className="mt-5 text-center text-xs leading-5 text-slate-400">You’ll verify your email before entering the workshop.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f5f7f6] px-5 py-6 text-slate-950 sm:px-8">
      <div className="mx-auto flex min-h-[92vh] max-w-md items-center justify-center">
        <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_24px_70px_-35px_rgba(15,23,42,0.25)] sm:p-10">{children}</div>
      </div>
    </main>
  );
}

function ErrorMessage({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-xs leading-5 text-red-700">{children}</p>;
}

function PasswordField({ value, onChange, show, onToggle, autoComplete }: { value: string; onChange: (value: string) => void; show: boolean; onToggle: () => void; autoComplete: string }) {
  return (
    <div className="relative">
      <LockKeyhole className="icon" />
      <input type={show ? "text" : "password"} autoComplete={autoComplete} placeholder="Your password" value={value} onChange={(e) => onChange(e.target.value)} className="control pl-11 pr-11" />
      <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
    </div>
  );
}

function Benefit({ text }: { text: string }) {
  return <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300"><span className="grid size-7 place-items-center rounded-full bg-teal-400/10 text-teal-300"><Check className="size-4" /></span>{text}</div>;
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-slate-800">{label}{children}</label>;
}
