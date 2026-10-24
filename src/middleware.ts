import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://lihghugfobzvglyrnxpp.supabase.co";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "sb_publishable_IKiRr--RHawb7ejqLSnTvQ_Jc2TbbO6";

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options?: CookieOptions }[]
      ) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin");
  const isEmpresaRoute = pathname.startsWith("/empresa");
  const isPrivateGuardaRoute =
    pathname.startsWith("/guarda") && pathname !== "/guarda/vacantes";
  const isPricingRoute = pathname.startsWith("/precios-empresas");

  // Only run auth/role verification when needed or to keep session fresh
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Unauthenticated visitor protection on private routes
  if (!user) {
    if (isAdminRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "unauthorized_admin");
      return NextResponse.redirect(url);
    }

    if (isEmpresaRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "unauthorized_company");
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    if (isPrivateGuardaRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "unauthorized_candidate");
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  }

  // 2. Role-based server-side isolation for authenticated users
  if (
    isAdminRoute ||
    isEmpresaRoute ||
    isPrivateGuardaRoute ||
    isPricingRoute
  ) {
    let activeRole: "candidate" | "company" | "admin" = "candidate";

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (
      profile?.role === "admin" ||
      profile?.role === "company" ||
      profile?.role === "candidate"
    ) {
      activeRole = profile.role;
    }

    // Fallback check in public.companies if not admin/company yet
    if (activeRole !== "admin" && activeRole !== "company") {
      const { data: companyRecord } = await supabase
        .from("companies")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (companyRecord) {
        activeRole = "company";
      }
    }

    // A. Candidate trying to access Company, Admin, or B2B Pricing routes
    if (activeRole === "candidate") {
      if (isEmpresaRoute || isAdminRoute || isPricingRoute) {
        const url = request.nextUrl.clone();
        url.pathname = "/guarda/vacantes";
        url.search = "";
        return NextResponse.redirect(url);
      }
    }

    // B. Company trying to access Admin or Private Candidate routes
    if (activeRole === "company") {
      if (isAdminRoute || isPrivateGuardaRoute) {
        const url = request.nextUrl.clone();
        url.pathname = "/empresa/dashboard";
        url.search = "";
        return NextResponse.redirect(url);
      }
    }

    // C. SuperAdmin trying to access Private Candidate routes
    if (activeRole === "admin") {
      if (isPrivateGuardaRoute) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin/estudios";
        url.search = "";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
