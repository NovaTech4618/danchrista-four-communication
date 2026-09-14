"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from "./AppSidebar";
import Header from "./Header";
import FloatingAssistant from "@/components/assistant/FloatingAssistant";
import { getCurrentSession, supabase } from "@/lib/supabase";
import { DEFAULT_ROLE_PATH, hasPermission, permissionForPath } from "@/lib/permissions";
import { staffService } from "@/services/staffService";

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

      if (!session?.user) {
        router.replace("/login");
        return;
      }

      setCheckingAuth(false);

      const requiredPermission = permissionForPath(pathname);
      if (!requiredPermission) {
        setCheckingAccess(false);
        return;
      }

      const roleResult = await staffService.getMyRole();
      if (!mounted) return;

      if (roleResult.error || !roleResult.data) {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      if (!hasPermission(roleResult.data, requiredPermission)) {
        router.replace(DEFAULT_ROLE_PATH[roleResult.data]);
        return;
      }

      setCheckingAccess(false);
    };

    void checkWorkspaceAccess();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "SIGNED_OUT" || !session?.user) {
        router.replace("/login");
        return;
      }
      void checkWorkspaceAccess();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (checkingAuth || checkingAccess) {
    return (
      <div className="min-h-screen bg-[var(--background)]" aria-busy="true" aria-label="Loading workspace">
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-sm">
            <span className="size-2 animate-pulse rounded-full bg-[var(--novatech-primary)]" aria-hidden="true" />
            Checking your workspace…
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-h-screen bg-[var(--background)]">
        <Header />
        <main className="flex-1 overflow-y-auto" tabIndex={-1}>
          <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </SidebarInset>
      <FloatingAssistant />
    </SidebarProvider>
  );
}
