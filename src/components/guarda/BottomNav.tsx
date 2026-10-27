"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  Send,
  FileCheck,
  User,
  LayoutDashboard,
  PlusCircle,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/supabase/useAuth";

export function BottomNav() {
  const pathname = usePathname();
  const { role } = useAuth();

  const isCompany = role === "company";

  const companyNavItems = [
    {
      label: "Panel",
      href: "/empresa/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Mis Vacantes",
      href: "/empresa/vacantes",
      icon: Briefcase,
    },
    {
      label: "Publicar",
      href: "/empresa/vacantes/nueva",
      icon: PlusCircle,
    },
    {
      label: "Relevos",
      href: "/empresa/relevos",
      icon: Zap,
    },
    {
      label: "Estudios",
      href: "/empresa/estudios",
      icon: FileCheck,
    },
  ];

  const candidateNavItems = [
    {
      label: "Vacantes",
      href: "/guarda/vacantes",
      icon: Briefcase,
    },
    {
      label: "Postulaciones",
      href: "/guarda/postulaciones",
      icon: Send,
    },
    {
      label: "Mi Curso",
      href: "/guarda/documentos",
      icon: FileCheck,
    },
    {
      label: "Mi Perfil",
      href: "/guarda/perfil",
      icon: User,
    },
  ];

  const navItems = isCompany ? companyNavItems : candidateNavItems;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E2E8F0] safe-area-bottom shadow-lg">
      <div
        className={`max-w-md mx-auto grid h-16 ${
          isCompany ? "grid-cols-5" : "grid-cols-4"
        }`}
      >
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/guarda/vacantes" && pathname.startsWith("/guarda/vacantes"));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors ${
                isActive
                  ? "text-[#0B3B70] font-bold"
                  : "text-[#64748B] hover:text-[#0B3B70] font-medium"
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2 : 1.5} />
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[#005DA4]" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-[64px] text-center">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
