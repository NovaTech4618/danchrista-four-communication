import { createBrowserClient } from "@supabase/ssr";
import type { Session } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// Keep the existing singleton export so current Client Components do not need
// an auth-wide rewrite. @supabase/ssr makes this browser client cookie-backed
// instead of localStorage-backed and uses PKCE for auth flows.
export const supabase = createBrowserClient(supabaseUrl, supabasePublishableKey);

// getSession() can briefly return null while the browser client restores the
// cookie-backed session after navigation or a hard refresh. Wait briefly for
// the auth event before treating the user as signed out.
export async function getCurrentSession(): Promise<Session | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) return session;

  return new Promise<Session | null>((resolve) => {
    let settled = false;
    let subscription: { unsubscribe: () => void } | null = null;

    const finish = (nextSession: Session | null) => {
      if (settled) return;
      settled = true;
      subscription?.unsubscribe();
      resolve(nextSession);
    };

    const authState = supabase.auth.onAuthStateChange((_event, newSession) => {
      finish(newSession);
    });
    subscription = authState.data.subscription;

    setTimeout(() => finish(null), 3000);
  });
}
