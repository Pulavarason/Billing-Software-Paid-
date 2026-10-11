import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup", "/auth"];
const ADMIN_PATH = "/admin";
const ACCESS_PATH = "/access";

/** Routes that require an authenticated account with admin-granted access. */
function isProtectedAppRoute(pathname: string): boolean {
  if (pathname === "/") return true;
  return (
    pathname.startsWith("/products") ||
    pathname.startsWith("/bills") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/print") ||
    pathname.startsWith("/dues") ||
    pathname.startsWith("/due-bills")
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
    const { data: adminRow } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
    const url = request.nextUrl.clone();
    url.pathname = adminRow ? "/admin" : "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Admins must be recognized before the paid-account gate. The dashboard
  // root is also a protected app route, so checking access first can send an
  // admin to /access before their /admin redirect has a chance to run.
  let isAdmin = false;
  if (user && (isProtectedAppRoute(pathname) || pathname.startsWith(ADMIN_PATH))) {
    const { data: adminRow } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    isAdmin = Boolean(adminRow);
  }

  if (user && isProtectedAppRoute(pathname) && !isAdmin) {
    const { data: access } = await supabase
      .from("user_access")
      .select("access_granted")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!access?.access_granted) {
      const url = request.nextUrl.clone();
      url.pathname = ACCESS_PATH;
      return NextResponse.redirect(url);
    }
  }

  // /admin is gated on the admins table, not on having a paid subscription —
  // the software owner running the panel may not be a paying customer.
  if (user && pathname.startsWith(ADMIN_PATH)) {
    if (!isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  if (user && pathname.startsWith(ACCESS_PATH)) {
    const { data: access } = await supabase
      .from("user_access")
      .select("access_granted")
      .eq("user_id", user.id)
      .maybeSingle();
    if (access?.access_granted) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
