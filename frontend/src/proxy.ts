import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Next.js 16 Proxy (formerly middleware) for refreshing Supabase Auth cookies
 * and guarding /portal routes on the server when Supabase is configured.
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const isDevFixtures =
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_DATA_SOURCE === "fixtures";

  if (!supabaseUrl || !supabaseKey || isDevFixtures) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLoginRoute = pathname.startsWith("/portal/login");
  const isProtectedPortal = pathname.startsWith("/portal") && !isLoginRoute;

  if (isProtectedPortal && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/portal/login";
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginRoute && user) {
    const portalUrl = request.nextUrl.clone();
    portalUrl.pathname = "/portal";
    return NextResponse.redirect(portalUrl);
  }

  return response;
}

export const config = {
  matcher: ["/portal/:path*"],
};
