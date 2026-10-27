"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { BottomNav } from "@/components/guarda/BottomNav";
import { Navbar } from "@/components/public/Navbar";
import { useAuth } from "@/lib/supabase/useAuth";

export default function GuardaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, isAuthenticated, isLoading } = useAuth();

  // Authorization Guard for internal candidate routes
  useEffect(() => {
    if (isLoading) return;

    const isPublicJobFeed = pathname === "/guarda/vacantes";

    // Non-public candidate routes require active authentication
    if (!isPublicJobFeed && !isAuthenticated) {
      router.push(`/login?error=unauthorized_candidate&redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Company accounts attempting to enter private candidate CV/Applications are redirected to ATS
    if (!isPublicJobFeed && role === "company") {
      router.replace("/empresa/dashboard");
      return;
    }

    if (!isPublicJobFeed && role === "admin") {
      router.replace("/admin/estudios");
      return;
    }
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
