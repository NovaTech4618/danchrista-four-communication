"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header from "./Header";
import FloatingAssistant from "@/components/assistant/FloatingAssistant";
import { getCurrentSession, supabase } from "@/lib/supabase";
import { DEFAULT_ROLE_PATH, hasPermission, permissionForPath } from "@/lib/permissions";
import { staffService } from "@/services/staffService";
import { AmezingLogo } from "@/components/brand/AmezingLogo";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    let mounted = true;
    const checkWorkspaceAccess = async () => {
      setCheckingAuth(true);
      setCheckingAccess(true);
      const session = await getCurrentSession();
      if (!mounted) return;
      if (!session?.user) { router.replace("/login"); return; }
      setCheckingAuth(false);
      const requiredPermission = permissionForPath(pathname);
      if (!requiredPermission) { setCheckingAccess(false); return; }
      const roleResult = await staffService.getMyRole();
      if (!mounted) return;
      if (roleResult.error || !roleResult.data) { await supabase.auth.signOut(); router.replace("/login"); return; }
      if (!hasPermission(roleResult.data, requiredPermission)) { router.replace(DEFAULT_ROLE_PATH[roleResult.data]); return; }
      setCheckingAccess(false);
    };
    void checkWorkspaceAccess();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "SIGNED_OUT" || !session?.user) { router.replace("/login"); return; }
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") void checkWorkspaceAccess();
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, [pathname, router]);

  if (checkingAuth || checkingAccess) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--background)] px-6" aria-busy="true" aria-label="Loading workspace">
        <div className="flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-[0_24px_60px_rgba(18,59,52,0.10)]">
          <AmezingLogo />
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600"><span className="size-2 animate-pulse rounded-full bg-[var(--amezing-primary)]" aria-hidden="true" />Securing your workspace…</div>
          <p className="text-xs leading-5 text-slate-400">Checking your session and workspace access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />
      <main id="main-content" className="min-h-[calc(100vh-64px)] overflow-y-auto pb-24 lg:pb-0" tabIndex={-1}>
        <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">{children}</div>
      </main>
      <FloatingAssistant />
    </div>
  );
}
