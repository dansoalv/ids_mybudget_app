import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database";

import { getSupabaseConfig, isSupabaseConfigured } from "./config";
import { safeDestination } from "../navigation";

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const { url, publishableKey } = getSupabaseConfig();
  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims?.sub);

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/auth");
  const isPublicRoute =
    isAuthRoute ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/offline") ||
    pathname.startsWith("/api/") ||
    pathname === "/manifest.webmanifest";

  if (!isAuthenticated && !isPublicRoute) {
    const urlToLogin = request.nextUrl.clone();
    urlToLogin.pathname = "/login";
    urlToLogin.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(urlToLogin);
  }

  if (isAuthenticated && pathname === "/login") {
    const destination = request.nextUrl.clone();
    const next = safeDestination(request.nextUrl.searchParams.get("next"));
    const [nextPathname = "/", nextSearch = ""] = next.split("?", 2);
    destination.pathname = nextPathname;
    destination.search = nextSearch ? `?${nextSearch}` : "";
    return NextResponse.redirect(destination);
  }

  return response;
}
