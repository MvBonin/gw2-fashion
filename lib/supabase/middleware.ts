import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";
import { shouldRedirectToWelcome } from "@/lib/utils/welcome";
import type { Database } from "@/types/database.types";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: { path?: string }) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: { path?: string }) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Base URL for redirects (production: NEXT_PUBLIC_SITE_URL, else request origin)
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    new URL(request.url).origin;

  // Check if user needs welcome
  const pathname = request.nextUrl.pathname;
  const isWelcomePage = pathname === "/welcome";
  const isAuthCallback = pathname === "/auth/callback";
  const isLoginPage = pathname === "/login";
  const isApiRoute = pathname.startsWith("/api");
  const isLegalPage = pathname === "/legal";

  // If user is authenticated, check welcome status
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    // If user tries to access welcome but has already completed it, redirect to home
    if (isWelcomePage && profile && !shouldRedirectToWelcome(profile)) {
      return NextResponse.redirect(new URL("/", baseUrl));
    }

    // If user hasn't completed welcome and is not on an allowed page, redirect to welcome
    // Legal is always reachable so users can read ToS/Privacy before accepting
    if (!isWelcomePage && !isAuthCallback && !isLoginPage && !isApiRoute && !isLegalPage) {
      if (shouldRedirectToWelcome(profile)) {
        return NextResponse.redirect(new URL("/welcome", baseUrl));
      }
    }
  }

  return response;
}
