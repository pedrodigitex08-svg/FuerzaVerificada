"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Shield,
  FileCheck2,
  Building2,
  GraduationCap,
  LogOut,
  Menu,
  X,
  TrendingUp,
  Clock,
  BadgeCheck,
  Users,
  Search,
  Bell,
  Sparkles,
  ExternalLink,
  Lock,
  AlertCircle,
  Settings,
  Coins,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeStudiesCount, setActiveStudiesCount] = useState(0);
  const [companiesCount, setCompaniesCount] = useState(0);
  const [verifiedCompaniesCount, setVerifiedCompaniesCount] = useState(0);
  const [candidatesCount, setCandidatesCount] = useState(0);
  const [academiesCount, setAcademiesCount] = useState(0);
  const [adminName, setAdminName] = useState("SuperAdmin B2B");

  // Authentication & Route Protection States
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isDevOrDemo, setIsDevOrDemo] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function verifyAdminAuthorization() {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          if (isMounted) {
            setIsAuthorized(false);
            router.replace("/login?error=unauthorized_admin");
          }
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role, full_name")
          .eq("id", session.user.id)
          .single();

        if (error || !profile || profile.role !== "admin") {
          if (isMounted) {
            setIsAuthorized(false);
            if (profile?.role === "company") {
              router.replace("/empresa/dashboard");
            } else if (profile?.role === "candidate") {
              router.replace("/guarda/vacantes");
            } else {
              router.replace("/login?error=unauthorized_admin");
            }
          }
          return;
        }

        if (isMounted) {
          if (profile.full_name) setAdminName(profile.full_name);
          setIsAuthorized(true);
        }
      } catch {
        if (isMounted) {
          setIsAuthorized(false);
          router.replace("/login?error=unauthorized_admin");
        }
      }
    }

    verifyAdminAuthorization();

    // Sync metric counts from Supabase and local storage
    async function loadAdminCounts() {
      try {
        const supabase = createClient();
        const { count: studiesCount } = await supabase
          .from("security_study_orders")
          .select("*", { count: "exact", head: true });
        if (studiesCount !== null && studiesCount !== undefined) {
          setActiveStudiesCount(studiesCount);
        }

        const { count: compsCount } = await supabase
          .from("companies")
          .select("*", { count: "exact", head: true });
        if (compsCount !== null && compsCount !== undefined) {
          setCompaniesCount(compsCount);
        }

        const { count: verCompsCount } = await supabase
          .from("companies")
          .select("*", { count: "exact", head: true })
          .eq("is_verified_company", true);
        if (verCompsCount !== null && verCompsCount !== undefined) {
          setVerifiedCompaniesCount(verCompsCount);
        }

        const { count: candsCount } = await supabase
          .from("candidate_profiles")
          .select("*", { count: "exact", head: true });
        if (candsCount !== null && candsCount !== undefined) {
          setCandidatesCount(candsCount);
        }

        const { count: acadsCount } = await supabase
          .from("partner_academies")
          .select("*", { count: "exact", head: true });
        if (acadsCount !== null && acadsCount !== undefined) {
          setAcademiesCount(acadsCount);
        }
      } catch {}
    }

    loadAdminCounts();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  const navigation = [
    {
      name: "Bandeja de Estudios & Poligrafía",
      href: "/admin/estudios",
      icon: FileCheck2,
      badge: activeStudiesCount.toString(),
    },
    {
      name: "Empresas & Recarga B2B",
      href: "/admin/empresas",
      icon: Building2,
      badge: companiesCount.toString(),
    },
    {
      name: "Red de Academias Aliadas",
      href: "/admin/academias",
      icon: GraduationCap,
      badge: academiesCount.toString(),
    },
    {
      name: "Planes & Tarifas B2B",
      href: "/admin/planes",
      icon: Coins,
      badge: "Precios",
    },
    {
      name: "Configuración Comercial",
      href: "/admin/configuracion",
      icon: Settings,
      badge: "WhatsApp",
    },
  ];

  // Render unauthorized fallback while redirecting
  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-[#F2F5F8] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200/90 p-6 rounded-2xl max-w-sm text-center space-y-3 shadow-sm">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">Acceso Restringido a SuperAdmin</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Esta sección requiere credenciales de Super Administrador con rol oficial en la base de datos. Redirigiendo...
          </p>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    const supabase = createClient();
    await Promise.race([
      supabase.auth.signOut().catch(() => {}),
      new Promise((res) => setTimeout(res, 800)),
    ]);
    localStorage.removeItem("fv_demo_role");
    localStorage.removeItem("fv_demo_user");
    sessionStorage.clear();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-[#F2F5F8] flex flex-col text-slate-900 font-sans antialiased">
      {/* TOP ADMINISTRATIVE NAVBAR (ESTILO COMPUTRABAJO B2B) */}
      <header className="bg-[#0B3B70] text-white sticky top-0 z-40 shadow-sm border-b border-[#082B54]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Left: Brand & Insignia */}
            <div className="flex items-center gap-3 shrink-0">
              <Link href="/admin/estudios" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#0B3B70] shadow-sm group-hover:scale-105 transition-transform">
                  <Shield className="w-5 h-5 text-[#0B3B70]" strokeWidth={2} />
                </div>
                <div>
                  <div className="text-base font-bold tracking-tight text-white flex items-center gap-1.5 leading-none">
                    Fuerza<span className="text-[#EAF3FA]">Verificada</span>
                  </div>
                  <div className="text-[10px] text-sky-200 font-semibold tracking-wider uppercase mt-0.5">
                    Mando Operativo B2B
                  </div>
                </div>
              </Link>

              <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#005DA4] text-[10px] font-bold text-[#EAF3FA] border border-sky-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SuperAdmin
              </span>
            </div>

            {/* Center: Desktop Navigation Pills */}
            <nav className="hidden lg:flex items-center gap-1.5 overflow-x-auto py-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold transition-all shrink-0 active:scale-[0.98] ${
                      isActive
                        ? "bg-[#005DA4] text-white shadow-sm ring-1 ring-white/20"
                        : "text-sky-100 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? "text-[#EAF3FA]" : "text-sky-200"
                      }`}
                      strokeWidth={isActive ? 2.2 : 1.75}
                    />
                    <span>{item.name}</span>
                    {item.badge && (
                      <span
                        className={`text-[10px] tabular-nums font-mono px-2 py-0.5 rounded-full font-bold ${
                          isActive
                            ? "bg-[#EAF3FA] text-[#0B3B70]"
                            : "bg-[#082B54] text-sky-200"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right: Actions, Vista Empresa & User Profile */}
            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                href="/empresa/dashboard"
                target="_blank"
                className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition-colors active:scale-[0.99]"
                title="Abrir panel corporativo en nueva pestaña"
              >
                <span>Vista Empresa</span>
                <ExternalLink className="w-3.5 h-3.5 text-sky-200" strokeWidth={2} />
              </Link>

              {/* User Pill */}
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-white/15">
                <div className="w-8 h-8 rounded-full bg-[#005DA4] border border-white/30 flex items-center justify-center text-xs font-bold text-white shadow-xs">
                  {adminName
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase() || "SA"}
                </div>
                <div className="hidden xl:block text-left">
                  <p className="text-xs font-bold text-white leading-tight max-w-[120px] truncate">
                    {adminName}
                  </p>
                  <p className="text-[10px] text-sky-200 leading-tight">Dirección General</p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleSignOut}
                title="Cerrar sesión de SuperAdmin"
                className="p-2 rounded-full hover:bg-white/15 text-sky-200 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" strokeWidth={2} />
              </button>

              {/* Mobile Hamburger Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-full hover:bg-white/15 text-white"
                aria-label="Abrir menú"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE DRAWER */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#082B54] border-t border-sky-900/60 p-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between p-3 rounded-xl text-xs font-semibold ${
                      isActive
                        ? "bg-[#005DA4] text-white"
                        : "text-sky-100 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-sky-200" strokeWidth={2} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] bg-[#EAF3FA] text-[#0B3B70] px-2 py-0.5 rounded-full font-mono font-bold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <Link
                href="/empresa/dashboard"
                target="_blank"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center gap-1.5 text-xs text-sky-200 font-semibold"
              >
                <span>Abrir Vista Empresa</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-xs text-rose-300 font-semibold flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Salir</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* SECONDARY LIVE KPI TICKER BAR */}
      <section className="bg-white border-b border-slate-200/90 shadow-xs hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="flex items-center justify-between gap-4 overflow-x-auto text-xs">
            <div className="flex items-center gap-2 shrink-0">
              <div className="p-1 rounded-lg bg-[#EAF3FA] border border-[#005DA4]/20 text-[#0B3B70]">
                <TrendingUp className="w-3.5 h-3.5" strokeWidth={2} />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block leading-none">
                  Empresas Registradas
                </span>
                <span className="text-xs font-bold text-slate-900 tabular-nums">
                  {companiesCount} Empresas{" "}
                  <span className="text-[10px] text-[#005DA4] font-semibold">(B2B)</span>
                </span>
              </div>
            </div>

            <div className="h-4 w-px bg-slate-200" />

            <div className="flex items-center gap-2 shrink-0">
              <div className="p-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700">
                <Clock className="w-3.5 h-3.5" strokeWidth={2} />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block leading-none">
                  Órdenes de Estudio
                </span>
                <span className="text-xs font-bold text-slate-900 tabular-nums">
                  {activeStudiesCount} Órdenes{" "}
                  <span className="text-[10px] text-amber-700 font-semibold">(Polígrafo/Visita)</span>
                </span>
              </div>
            </div>

            <div className="h-4 w-px bg-slate-200" />

            <div className="flex items-center gap-2 shrink-0">
              <div className="p-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                <BadgeCheck className="w-3.5 h-3.5" strokeWidth={2} />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block leading-none">
                  Empresas Verificadas
                </span>
                <span className="text-xs font-bold text-slate-900 tabular-nums">
                  {verifiedCompaniesCount} de {companiesCount}{" "}
                  <span className="text-[10px] text-slate-500 font-normal">(SuperVigilancia)</span>
                </span>
              </div>
            </div>

            <div className="h-4 w-px bg-slate-200" />

            <div className="flex items-center gap-2 shrink-0">
              <div className="p-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                <Users className="w-3.5 h-3.5" strokeWidth={2} />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block leading-none">
                  Perfiles Operativos
                </span>
                <span className="text-xs font-bold text-slate-900 tabular-nums">
                  {candidatesCount} <span className="text-[10px] text-slate-500 font-normal">Base Nacional</span>
                </span>
              </div>
            </div>

            <div className="h-4 w-px bg-slate-200" />

            <div className="flex items-center gap-2 shrink-0">
              <div className="p-1 rounded-lg bg-[#EAF3FA] border border-[#005DA4]/20 text-[#0B3B70]">
                <GraduationCap className="w-3.5 h-3.5" strokeWidth={2} />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block leading-none">
                  Academias Aliadas
                </span>
                <span className="text-xs font-bold text-slate-900 tabular-nums">
                  {academiesCount} Sedes Capacitación
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>
    </div>
  );
}
