"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  CheckCircle,
  MapPin,
  Lock,
  ArrowRight,
  Search,
  Sparkles,
  FileText,
  BadgeCheck,
  Building2,
  Clock,
  ExternalLink,
  ChevronRight,
  Filter,
  AlertCircle,
  Briefcase,
} from "lucide-react";
import { useEffect } from "react";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { CityAutocompleteInput } from "@/components/ui/CityAutocompleteInput";
import { useAuth } from "@/lib/supabase/useAuth";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  const router = useRouter();
  const { role, isAuthenticated } = useAuth();
  const [roleSearch, setRoleSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [warningToast, setWarningToast] = useState<string | null>(null);
  const [featuredJobs, setFeaturedJobs] = useState<any[]>([]);

  const isCompanyOrAdmin = role === "company" || role === "admin";

  useEffect(() => {
    async function loadFeaturedJobs() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("jobs")
          .select("*, companies(company_name, is_verified_company)")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(3);

        if (!error && data && data.length > 0) {
          const mapped = data.map((j: any) => ({
            id: j.id,
            company: j.companies?.company_name || "Empresa de Seguridad",
            companyInitials: (j.companies?.company_name || "ES").slice(0, 2).toUpperCase(),
            title: j.title,
            role: j.role_required,
            location: `${j.city}${j.zone_neighborhood ? ` • ${j.zone_neighborhood}` : ""}`,
            salary: `$${Number(j.salary_monthly).toLocaleString("es-CO")} COP`,
            shift: j.shift,
            compatibility: "95%",
            description: j.description,
          }));
          setFeaturedJobs(mapped);
          return;
        }
      } catch {}

      if (typeof window !== "undefined") {
        const local = localStorage.getItem("fv_company_jobs");
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setFeaturedJobs(
                parsed.slice(0, 3).map((j: any) => ({
                  id: j.id,
                  company: j.company_name || "Empresa de Seguridad",
                  companyInitials: (j.company_name || "ES").slice(0, 2).toUpperCase(),
                  title: j.title,
                  role: j.role_required,
                  location: `${j.city}${j.zone_neighborhood ? ` • ${j.zone_neighborhood}` : ""}`,
                  salary: `$${Number(j.salary_monthly).toLocaleString("es-CO")} COP`,
                  shift: j.shift,
                  compatibility: "95%",
                  description: j.description,
                }))
              );
            }
          } catch {}
        }
      }
    }

    loadFeaturedJobs();
  }, []);

  // Intercept application for unauthenticated users or company accounts
  const handleApplyClick = (jobId: string) => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent("/guarda/vacantes")}`);
      return;
    }

    if (role === "company") {
      setWarningToast(
        "Tu sesión actual es de Empresa de Seguridad. Las postulaciones a vacantes son exclusivas para Personal Operativo."
      );
      setTimeout(() => setWarningToast(null), 4500);
      return;
    }

    router.push(`/guarda/vacantes?apply=${jobId}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#1E293B]">
      {/* Toast Warning */}
      {warningToast && (
        <div className="fixed top-20 right-4 z-50 max-w-md bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl shadow-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs font-semibold leading-relaxed">
            {warningToast}
          </div>
        </div>
      )}

      {/* 1. NAVBAR STICKY */}
      <Navbar />

      {/* 2. HERO SECTION + BUSCADOR PRINCIPAL */}
      <section className="bg-white pt-12 pb-14 border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Top Subtle Executive Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs">
            <Shield className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
            <span>Bolsa de Empleo y Validación Especializada en Seguridad Privada</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#1E293B] max-w-4xl mx-auto leading-[1.18]">
            Reclutamiento y empleo especializado con{" "}
            <span className="text-[#1E3A8A]">verificación real</span>.
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-[#64748B] max-w-2xl mx-auto font-normal leading-relaxed">
            Conectamos a todo el talento operativo y profesional del sector seguridad con las empresas líderes en Colombia, integrando validación de antecedentes, visita domiciliaria y poligrafía en un solo lugar.
          </p>

          {/* HERO SEARCH BAR */}
          <div className="pt-2 max-w-3xl mx-auto">
            <div className="bg-white p-2 rounded-xl shadow-lg border border-[#E2E8F0] flex flex-col md:flex-row items-center divide-y md:divide-y-0 md:divide-x divide-[#E2E8F0] gap-2 md:gap-0">
              {/* Input 1: Cargo */}
              <div className="flex-1 w-full px-3 py-1.5 text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block mb-0.5">
                  Cargo / Especialidad
                </label>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#64748B] shrink-0" strokeWidth={1.5} />
                  <input
                    type="text"
                    value={roleSearch}
                    onChange={(e) => setRoleSearch(e.target.value)}
                    placeholder="Vigilante Fijo, Escolta VIP, Supervisor..."
                    className="w-full text-xs font-semibold text-[#1E293B] placeholder-[#94A3B8] focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Input 2: Ubicación con Autocompletado Predictivo */}
              <div className="flex-1 w-full px-3 py-1.5 text-left relative">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block mb-0.5">
                  Ubicación / Zona
                </label>
                <CityAutocompleteInput
                  value={locationSearch}
                  onChange={setLocationSearch}
                  placeholder="Bogotá D.C., Medellín, Cali..."
                />
              </div>

              {/* Action Button */}
              <div className="w-full md:w-auto p-1">
                <Link
                  href={`/guarda/vacantes?${new URLSearchParams({
                    ...(roleSearch ? { role: roleSearch } : {}),
                    ...(locationSearch ? { location: locationSearch } : {}),
                  }).toString()}`}
                  className="w-full md:w-auto bg-[#0F172A] hover:bg-[#1E3A8A] text-white rounded-xl py-3 px-6 text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
                >
                  <Search className="w-4 h-4" strokeWidth={1.5} />
                  <span>Buscar Vacantes</span>
                </Link>
              </div>
            </div>

            {/* Quick Filter Tags */}
            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-[11px] text-[#64748B] font-medium">Búsquedas frecuentes:</span>
              <Link
                href="/guarda/vacantes"
                className="px-2.5 py-1 rounded-lg bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#1E293B] font-medium text-[11px] transition-colors"
              >
                Turno 2x2x2
              </Link>
              <Link
                href="/guarda/vacantes"
                className="px-2.5 py-1 rounded-lg bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#1E293B] font-medium text-[11px] transition-colors"
              >
                Escolta VIP Bilingüe
              </Link>
              <Link
                href="/guarda/vacantes"
                className="px-2.5 py-1 rounded-lg bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#1E293B] font-medium text-[11px] transition-colors"
              >
                Operador Medios Tecnológicos
              </Link>
              {isCompanyOrAdmin && (
                <Link
                  href="/empresa/relevos"
                  className="px-2.5 py-1 rounded-lg bg-[#ECFDF5] text-[#065F46] border border-[#10B981]/30 hover:bg-[#D1FAE5] font-semibold text-[11px] flex items-center gap-1.5 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  <span>Relevos Disponibles Hoy</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. WORKSPACE PRINCIPAL (GRID 12 COLUMNAS) */}
      <section className="bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* COLUMNA IZQUIERDA (lg:col-span-7) - JOB CARDS */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <h2 className="text-base font-bold text-[#1E293B]">
                    Vacantes Destacadas con Verificación
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    Ofertas activas de empresas de seguridad autorizadas por SuperVigilancia
                  </p>
                </div>
                <Link
                  href="/guarda/vacantes"
                  className="text-xs font-semibold text-[#1E3A8A] hover:underline flex items-center gap-1"
                >
                  <span>Ver todas ({featuredJobs.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                </Link>
              </div>

              {/* Job Cards Feed */}
              {featuredJobs.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-10 text-center shadow-xs space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 mx-auto">
                    <Briefcase className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-sm font-bold text-[#1E293B]">
                    Aún no hay vacantes publicadas
                  </h3>
                  <p className="text-xs text-[#64748B] max-w-md mx-auto leading-relaxed">
                    Las ofertas laborales de las empresas de seguridad autorizadas aparecerán aquí en tiempo real tan pronto sean publicadas.
                  </p>
                  <div className="pt-1">
                    <Link
                      href="/guarda/vacantes"
                      className="inline-flex items-center gap-1.5 text-xs text-[#1E3A8A] font-semibold hover:underline"
                    >
                      <span>Ir al buscador general de vacantes</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                featuredJobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white border border-slate-200 rounded-xl p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md space-y-4"
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] border border-[#E2E8F0] flex items-center justify-center font-bold text-[#1E293B] text-xs">
                          {job.companyInitials}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs text-[#1E293B]">
                              {job.company}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#065F46] bg-[#ECFDF5] border border-[#10B981]/30 px-1.5 py-0.2 rounded">
                              <CheckCircle className="w-3 h-3 text-[#10B981]" strokeWidth={1.5} />
                              Empresa Verificada
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-[#1E293B] mt-0.5">
                            {job.title}
                          </h3>
                        </div>
                      </div>

                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-[#ECFDF5] text-[#065F46] border border-[#10B981]/30 tabular-nums">
                        {job.compatibility} Compatible
                      </span>
                    </div>

                    {/* 3 Tags Row */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="bg-[#F3F4F6] text-[#1E293B] rounded-lg px-3 py-1 text-xs font-medium flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-[#64748B]" strokeWidth={1.5} />
                        {job.role}
                      </span>
                      <span className="bg-[#F3F4F6] text-[#1E293B] rounded-lg px-3 py-1 text-xs font-medium flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#64748B]" strokeWidth={1.5} />
                        {job.location}
                      </span>
                      <span className="bg-[#F3F4F6] text-[#1E293B] rounded-lg px-3 py-1 text-xs font-bold tabular-nums">
                        {job.salary} • {job.shift}
                      </span>
                    </div>

                    <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">
                      {job.description}
                    </p>

                    {/* Card Footer with Intercepted Application Button */}
                    <div className="pt-3 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5 text-xs text-[#065F46] font-medium">
                        <Lock className="w-3.5 h-3.5 text-[#10B981]" strokeWidth={1.5} />
                        <span>Estudios y Poligrafía 100% asumidos por la empresa</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApplyClick(job.id)}
                        className="w-full sm:w-auto bg-[#0F172A] hover:bg-[#1E3A8A] text-white rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 text-center shadow-xs"
                      >
                        Postularme en 1 clic
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* COLUMNA DERECHA (lg:col-span-5) - CANDIDATE CREDENTIAL CARD */}
            <div className="lg:col-span-5 space-y-4">
              <div className="pb-1">
                <h2 className="text-base font-bold text-[#1E293B]">
                  Expediente de Confiabilidad Verificado
                </h2>
                <p className="text-xs text-[#64748B]">
                  Así visualizan los directores de operaciones y analistas de seguridad el perfil del candidato
                </p>
              </div>

              {/* Exact Candidate Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm sticky top-24 space-y-5">
                {/* Header with Photo & Verification */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-[#F3F4F6] border border-[#E2E8F0] flex items-center justify-center font-bold text-base text-[#1E293B] shrink-0">
                    FV
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm text-[#1E293B] truncate">
                        Aspirante Verificado (Ejemplo)
                      </h3>
                      <CheckCircle className="w-4 h-4 text-[#10B981] shrink-0" strokeWidth={1.5} />
                    </div>
                    <p className="text-xs font-semibold text-[#1E3A8A]">
                      Personal Operativo & Seguridad Integral
                    </p>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      6 años de experiencia • Bogotá D.C.
                    </p>
                  </div>
                </div>

                {/* Banner Verde Prominente */}
                <div className="bg-[#ECFDF5] border border-[#10B981]/30 rounded-xl p-3.5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#065F46] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                      <span>PERFIL VERIFICADO • CURSO VIGENTE</span>
                    </div>
                    <div className="text-[11px] text-[#047857] mt-0.5">
                      Credencial SuperVigilancia al día (184 días restantes)
                    </div>
                  </div>
                  <span className="bg-white text-[#065F46] border border-[#10B981]/30 px-2.5 py-1 rounded-md font-bold text-[11px] shadow-sm">
                    Antecedentes OK
                  </span>
                </div>

                {/* Bloque Certificaciones */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                    Certificaciones y Permisos Validados
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="bg-[#F3F4F6] text-[#1E293B] rounded-lg px-3 py-1.5 text-xs font-medium">
                      Reentrenamiento Vigilancia 2026
                    </span>
                    <span className="bg-[#F3F4F6] text-[#1E293B] rounded-lg px-3 py-1.5 text-xs font-medium">
                      Manejo Armas Cortas (Indumil)
                    </span>
                    <span className="bg-[#F3F4F6] text-[#1E293B] rounded-lg px-3 py-1.5 text-xs font-medium">
                      Libreta Militar 1ra Clase
                    </span>
                    <span className="bg-[#F3F4F6] text-[#1E293B] rounded-lg px-3 py-1.5 text-xs font-medium">
                      Moto Propia 150cc
                    </span>
                  </div>
                </div>

                {/* Bloque Verificación Avanzada (Paquete Empresa) */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                    Verificación Integral de Confiabilidad
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-center">
                      <span className="text-[10px] text-[#64748B] block">Estudio Seg.</span>
                      <span className="text-xs font-bold text-[#10B981] block mt-0.5">Aprobado</span>
                    </div>
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-center">
                      <span className="text-[10px] text-[#64748B] block">Visita Domicil.</span>
                      <span className="text-xs font-bold text-[#10B981] block mt-0.5">Realizada</span>
                    </div>
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-center">
                      <span className="text-[10px] text-[#64748B] block">Poligrafía</span>
                      <span className="text-xs font-bold text-[#10B981] block mt-0.5">Sin Novedad</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons: Demonstrative visual indicators */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                  <div className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] rounded-xl py-2.5 px-3 font-semibold text-xs flex items-center justify-center gap-1.5 select-none">
                    <FileText className="w-3.5 h-3.5 text-[#64748B]" strokeWidth={1.5} />
                    <span>Hoja de Vida (Auditada)</span>
                  </div>

                  <Link
                    href="/precios-empresas"
                    className="flex-1 bg-[#0F172A] hover:bg-[#1E3A8A] text-white rounded-xl py-2.5 px-3 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm text-center"
                  >
                    <Shield className="w-3.5 h-3.5 text-[#10B981]" strokeWidth={1.5} />
                    <span>Planes para Empresas</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECCIÓN DE LAS 3 PROMESAS TÁCTICAS */}
      <section className="bg-white py-16 border-t border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl font-bold text-[#1E293B]">
              Diseñado para resolver el dolor operativo del gremio
            </h2>
            <p className="text-xs text-[#64748B]">
              Tres garantías reales para empresas de vigilancia y personal operativo en Colombia
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
              <div className="w-9 h-9 rounded-xl bg-[#0F172A] text-white flex items-center justify-center font-bold text-xs">
                01
              </div>
              <h3 className="font-bold text-sm text-[#1E293B]">
                Garantía Cero Cobros al Personal Operativo
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Postulación 100% gratuita. Todo el personal operativo y profesionales en seguridad privada ven el salario real, turno (2x2x2, 4x2) y ubicación antes de aplicar, sin intermediarios ni cobros ilícitos.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
              <div className="w-9 h-9 rounded-xl bg-[#0F172A] text-white flex items-center justify-center font-bold text-xs">
                02
              </div>
              <h3 className="font-bold text-sm text-[#1E293B]">
                Semáforo del Curso & Radar de Relevos
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Cálculo en vivo de vigencia ante SuperVigilancia y buscador de profesionales en seguridad disponibles para cubrir incapacidades y turnos urgentes de última hora.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
              <div className="w-9 h-9 rounded-xl bg-[#0F172A] text-white flex items-center justify-center font-bold text-xs">
                03
              </div>
              <h3 className="font-bold text-sm text-[#1E293B]">
                Contratación Blindada Todo en Uno
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                El gran diferenciador B2B: las empresas de seguridad publican vacantes y gestionan Estudio de Seguridad + Visita Domiciliaria + Poligrafía en 1 clic desde el mismo ATS.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <Footer />
    </div>
  );
}
