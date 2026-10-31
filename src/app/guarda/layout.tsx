"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { BottomNav } from "@/components/guarda/BottomNav";
import { Navbar } from "@/components/public/Navbar";
import { useAuth, ensureRoleProvisioning, UserRole } from "@/lib/supabase/useAuth";
import { createClient } from "@/lib/supabase/client";

export default function GuardaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, isAuthenticated, isLoading } = useAuth();

  // Authorization Guard & Automatic Role Sync from public.profiles
  useEffect(() => {
    let isMounted = true;

    async function verifyCandidateRoleAndRedirect() {
      const isPublicJobFeed = pathname === "/guarda/vacantes";
      const supabase = createClient();

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (!isLoading && !isPublicJobFeed && !isAuthenticated && isMounted) {
            router.push(
              `/login?error=unauthorized_candidate&redirect=${encodeURIComponent(pathname)}`
            );
          }
          return;
        }

        // Única Fuente de la Verdad: consultar directamente public.profiles
        let profile: any = null;
        const { data: primaryProfile, error: primaryErr } = await supabase
          .from("profiles")
          .select("role, full_name, avatar_url")
          .eq("id", user.id)
          .single();

        if (!primaryErr && primaryProfile) {
          profile = primaryProfile;
        } else {
          const { data: fallbackProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();
          profile = fallbackProfile;
        }

        const canonicalRole: UserRole =
          profile?.role === "company" ||
          profile?.role === "candidate" ||
          profile?.role === "admin"
            ? (profile.role as UserRole)
            : role;

        if (!isMounted) return;

        if (canonicalRole && typeof window !== "undefined") {
          localStorage.setItem("fv_demo_role", canonicalRole);
        }

        // Auto-aprovisionamiento transparente según el rol en public.profiles
        await ensureRoleProvisioning(
          supabase,
          user,
          canonicalRole,
          profile?.full_name,
          profile?.phone_whatsapp
        );

        // Redirección inteligente entre layouts cuando public.profiles.role cambia
        if (canonicalRole === "company") {
          router.replace("/empresa/dashboard");
          return;
        }

        if (canonicalRole === "admin") {
          router.replace("/admin/estudios");
          return;
        }
      } catch (err) {
        console.error("Error verifying candidate role:", err);
      }
    }

    verifyCandidateRoleAndRedirect();

    const handleFocus = () => verifyCandidateRoleAndRedirect();
    window.addEventListener("focus", handleFocus);
    return () => {
      isMounted = false;
      window.removeEventListener("focus", handleFocus);
    };
  }, [isAuthenticated, role, isLoading, pathname, router]);

  const isJobFeed = pathname === "/guarda/vacantes";

  return (
    <div className="min-h-screen bg-[#F2F5F8] text-[#1E293B] flex flex-col">
      {/* 1. Global Navbar Computrabajo Style */}
      <Navbar />

      {/* 2. Main Content Canvas */}
      <main
        className={`flex-1 w-full ${
          isJobFeed
            ? "pb-20 md:pb-8"
            : "max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8"
        }`}
      >
        {children}
      </main>

      {/* 3. Mobile Navigation Bottom Bar */}
      <BottomNav />
    </div>
  );
}
