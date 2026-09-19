"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { DEFAULT_ROLE_PATH, hasPermission, permissionForPath } from "@/lib/permissions";
import { staffService } from "@/services/staffService";
import type { StaffRole } from "@/types/staff";

const PUBLIC_PATHS = new Set(["/", "/login"]);

export function RoleRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (PUBLIC_PATHS.has(pathname)) {
      setChecking(false);
      return;
    }

    const permission = permissionForPath(pathname);
    if (!permission) {
      setChecking(false);
      return;
    }

    let active = true;
    setChecking(true);

    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: role } = await staffService.getMyRole();
      if (!active) return;

      if (!role) {
        await supabase.auth.signOut();
        if (active) router.replace("/login");
        return;
      }

      if (!hasPermission(role, permission)) {
        router.replace(DEFAULT_ROLE_PATH[role]);
        return;
      }

      setChecking(false);
    })();

    return () => { active = false; };
  }, [pathname, router]);

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f5f7f6] px-6 text-center text-sm text-slate-500">
        Checking your Amezing Limited access…
      </div>
    );
  }

  return <>{children}</>;
}
