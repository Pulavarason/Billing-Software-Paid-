import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup", "/auth"];
const ADMIN_PATH = "/admin";
const SUBSCRIBE_PATH = "/subscribe";

/** Routes that belong to the billing application itself and require an
 * active subscription (in addition to being logged in). */
function isProtectedAppRoute(pathname: string): boolean {
  if (pathname === "/") return true;
  return (
    pathname.startsWith("/products") ||
    pathname.startsWith("/bills") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/print")
  );
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Unauthenticated users trying to reach anything but the public pages
  // get sent to /login.
  if (!user && !PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Logged-in users shouldn't see the login/signup forms again.
  if (user && (pathname.startsWith("/login") || pathname.startsWith("/signup"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user && isProtectedAppRoute(pathname)) {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status, end_date")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const isActive =
      !!subscription &&
      subscription.status === "active" &&
      !!subscription.end_date &&
      new Date(subscription.end_date).getTime() > Date.now();

    if (!isActive) {
      const url = request.nextUrl.clone();
      url.pathname = SUBSCRIBE_PATH;
      return NextResponse.redirect(url);
    }
  }

  // /admin is gated on the admins table, not on having a paid subscription —
  // the software owner running the panel may not be a paying customer.
  if (user && pathname.startsWith(ADMIN_PATH)) {
    const { data: adminRow } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!adminRow) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // Once subscribed, bounce users away from the pricing page back into the app.
  if (user && pathname.startsWith(SUBSCRIBE_PATH)) {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status, end_date")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const isActive =
      !!subscription &&
      subscription.status === "active" &&
      !!subscription.end_date &&
      new Date(subscription.end_date).getTime() > Date.now();

    if (isActive && request.nextUrl.searchParams.get("renew") !== "1") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
