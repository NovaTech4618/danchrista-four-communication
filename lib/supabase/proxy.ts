import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = [
  "/dashboard",
  "/activity",
  "/alerts",
  "/assistant",
  "/audit",
  "/customer-requests",
  "/customers",
  "/devices",
  "/engineer-workflow",
  "/engineers",
  "/finance",
  "/help",
  "/inventory",
  "/invoices",
  "/outstanding",
  "/parts-credit",
  "/repairs",
  "/reports",
  "/sales",
  "/search",
  "/settings",
  "/staff",
  "/suppliers",
  "/technical-services",
  "/technician-ledger",
  "/tickets",
  "/whatsapp",
] as const;

function isProtectedRoute(pathname: string) {
  return protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });

          Object.entries(headers).forEach(([key, value]) => {
            supabaseResponse.headers.set(key, value);
          });
        },
      },
    },
  );

  // getClaims validates the JWT and also gives Supabase an opportunity to
  // refresh an expired session. The refreshed cookies are carried forward in
  // supabaseResponse and returned unchanged below.
  const { data: claimsData } = await supabase.auth.getClaims();
  const hasUser = Boolean(claimsData?.claims?.sub);
  const pathname = request.nextUrl.pathname;

  if (!hasUser && isProtectedRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
