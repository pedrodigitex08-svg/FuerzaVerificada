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
  PlusCircle,
} from "lucide-react";
import { useEffect } from "react";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { CityAutocompleteInput } from "@/components/ui/CityAutocompleteInput";
import { useAuth } from "@/lib/supabase/useAuth";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  const router = useRouter();
  const { role, isAuthenticated, fullName } = useAuth();
  const [roleSearch, setRoleSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [warningToast, setWarningToast] = useState<string | null>(null);
  const [featuredJobs, setFeaturedJobs] = useState<any[]>([]);

  const isCompanyOrAdmin = role === "company" || role === "admin";

  useEffect(() => {
    async function loadFeaturedJobs() {
      try {
        const supabase = createClient();
        let { data, error } = await supabase
          .from("job_posts")
          .select("*, companies(company_name, is_verified_company)")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(3);

        if (error || !data || data.length === 0) {
          const fallback = await supabase
            .from("jobs")
            .select("*, companies(company_name, is_verified_company)")
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(3);
          if (!fallback.error && fallback.data && fallback.data.length > 0) {
            data = fallback.data;
            error = null;
          }
        }

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

      setFeaturedJobs([]);
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
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* Toast Warning */}
      {warningToast && (
        <div className="fixed top-20 right-4 z-50 max-w-md bg-amber-50/95 border border-amber-200/80 text-amber-900 px-4 py-3 rounded-lg shadow-[0_4px_12px_rgba(15,23,42,0.08)] flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs font-medium leading-relaxed">
            {warningToast}
          </div>
        </div>
      )}

      {/* 1. NAVBAR STICKY */}
      <Navbar />

      {/* 2. HERO SECTION + BUSCADOR PRINCIPAL */}
      <section className="bg-white pt-10 pb-12 border-b border-slate-200/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          {/* Top Subtle Executive Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100/80 border border-slate-200/90 text-xs font-medium text-slate-700">
            <Shield className="w-3.5 h-3.5 text-slate-600" strokeWidth={1.75} />
            <span>Bolsa de Empleo y Validación Especializada en Seguridad Privada</span>
          </div>

          {/* Main Title */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-slate-900 max-w-3xl mx-auto leading-tight">
            Reclutamiento y empleo especializado con{" "}
            <span className="text-[#0F172A] underline decoration-emerald-500/70 decoration-2 underline-offset-4">
              verificación real
            </span>
            .
          </h1>

          {/* Subtitle */}
          <p className="text-sm text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Conectamos a todo el talento operativo y profesional del sector seguridad con las empresas líderes en Colombia, integrando validación de antecedentes, visita domiciliaria y poligrafía en un solo lugar.
          </p>

          {/* HERO SEARCH BAR */}
          <div className="pt-2 max-w-3xl mx-auto">
            <div className="bg-white p-1.5 rounded-lg shadow-[0_1px_3px_rgba(15,23,42,0.06)] border border-slate-200/90 flex flex-col md:flex-row items-center divide-y md:divide-y-0 md:divide-x divide-slate-200/90 gap-1.5 md:gap-0">
              {/* Input 1: Cargo */}
              <div className="flex-1 w-full px-3.5 py-1.5 text-left">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-0.5">
                  Cargo / Especialidad
                </label>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={1.5} />
                  <input
                    type="text"
                    value={roleSearch}
                    onChange={(e) => setRoleSearch(e.target.value)}
                    placeholder="Vigilante Fijo, Escolta VIP, Supervisor..."
                    className="w-full text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent h-6"
                  />
                </div>
              </div>

              {/* Input 2: Ubicación con Autocompletado Predictivo */}
              <div className="flex-1 w-full px-3.5 py-1.5 text-left relative">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-0.5">
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
                  className="w-full md:w-auto h-10 bg-[#0F172A] hover:bg-slate-800 text-white rounded-md px-5 text-xs font-medium transition-colors flex items-center justify-center gap-2 shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
                >
                  <Search className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>Buscar Vacantes</span>
                </Link>
              </div>
            </div>

            {/* Quick Filter Tags / Executive Shortcuts */}
            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2 text-xs">
              {role === "company" ? (
                <>
                  <span className="text-[11px] text-slate-500 font-medium">Accesos rápidos de Empresa:</span>
                  <Link
                    href="/empresa/vacantes/nueva"
                    className="px-2.5 py-1 rounded-md bg-[#0F172A] hover:bg-slate-800 text-white font-medium text-[11px] flex items-center gap-1.5 transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Publicar Vacante</span>
                  </Link>
                  <Link
                    href="/empresa/vacantes"
                    className="px-2.5 py-1 rounded-md bg-slate-100/80 hover:bg-slate-200/70 text-slate-700 border border-slate-200/80 font-medium text-[11px] transition-colors"
                  >
                    Mis Vacantes & ATS
                  </Link>
                  <Link
                    href="/empresa/relevos"
                    className="px-2.5 py-1 rounded-md bg-emerald-50/80 text-emerald-700 border border-emerald-200/60 hover:bg-emerald-100/70 font-medium text-[11px] flex items-center gap-1.5 transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <span>Radar de Relevos Hoy</span>
                  </Link>
                  <Link
                    href="/empresa/estudios"
                    className="px-2.5 py-1 rounded-md bg-slate-100/80 hover:bg-slate-200/70 text-slate-700 border border-slate-200/80 font-medium text-[11px] flex items-center gap-1 transition-colors"
                  >
                    <Lock className="w-3 h-3 text-emerald-600" />
                    <span>Estudios & Poligrafía</span>
                  </Link>
                  <Link
                    href="/precios-empresas"
                    className="px-2.5 py-1 rounded-md bg-slate-100/80 hover:bg-slate-200/70 text-slate-700 border border-slate-200/80 font-medium text-[11px] transition-colors"
                  >
                    Planes Empresas
                  </Link>
                </>
              ) : (
                <>
                  <span className="text-[11px] text-slate-500 font-medium">Búsquedas frecuentes:</span>
                  <Link
                    href="/guarda/vacantes"
                    className="px-2.5 py-1 rounded-md bg-slate-100/80 hover:bg-slate-200/70 text-slate-700 border border-slate-200/80 font-medium text-[11px] transition-colors"
                  >
                    Turno 2x2x2
                  </Link>
                  <Link
                    href="/guarda/vacantes"
                    className="px-2.5 py-1 rounded-md bg-slate-100/80 hover:bg-slate-200/70 text-slate-700 border border-slate-200/80 font-medium text-[11px] transition-colors"
                  >
                    Escolta VIP Bilingüe
                  </Link>
                  <Link
                    href="/guarda/vacantes"
                    className="px-2.5 py-1 rounded-md bg-slate-100/80 hover:bg-slate-200/70 text-slate-700 border border-slate-200/80 font-medium text-[11px] transition-colors"
                  >
                    Operador Medios Tecnológicos
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. WORKSPACE PRINCIPAL (GRID 12 COLUMNAS) */}
      <section className="bg-[#F8FAFC] py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* COLUMNA IZQUIERDA (lg:col-span-7) - JOB CARDS */}
            <div className="lg:col-span-7 space-y-3.5">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-slate-900">
                    Vacantes Destacadas con Verificación
                  </h2>
                  <p className="text-xs text-slate-500">
                    Ofertas activas de empresas de seguridad autorizadas por SuperVigilancia
                  </p>
                </div>
                <Link
                  href="/guarda/vacantes"
                  className="text-xs font-medium text-slate-700 hover:text-slate-950 flex items-center gap-1 tabular-nums"
                >
                  <span>Ver todas ({featuredJobs.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                </Link>
              </div>

              {/* Job Cards Feed */}
              {featuredJobs.length === 0 ? (
                <div className="bg-white border border-slate-200/90 rounded-lg p-10 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-2.5">
                  <div className="w-9 h-9 rounded-md bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-500 mx-auto">
                    <Briefcase className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Aún no hay vacantes publicadas
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Las ofertas laborales de las empresas de seguridad autorizadas aparecerán aquí en tiempo real tan pronto sean publicadas.
                  </p>
                  <div className="pt-1">
                    <Link
                      href="/guarda/vacantes"
                      className="inline-flex items-center gap-1 text-xs text-slate-900 font-medium hover:underline"
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
                    className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-lg p-5 transition-colors shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-3.5"
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md bg-slate-100 border border-slate-200/90 flex items-center justify-center font-semibold text-slate-800 text-xs">
                          {job.companyInitials}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium text-xs text-slate-600">
                              {job.company}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50/80 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                              <CheckCircle className="w-3 h-3 text-emerald-600" strokeWidth={1.5} />
                              Empresa Verificada
                            </span>
                          </div>
                          <h3 className="text-sm font-semibold tracking-tight text-slate-900 mt-0.5">
                            {job.title}
                          </h3>
                        </div>
                      </div>

                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-emerald-50/80 text-emerald-700 border border-emerald-200/60 tabular-nums shrink-0">
                        {job.compatibility} Compatible
                      </span>
                    </div>

                    {/* 3 Tags Row */}
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      <span className="bg-slate-100/80 text-slate-700 border border-slate-200/80 rounded-md px-2.5 py-1 text-xs font-medium flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.5} />
                        {job.role}
                      </span>
                      <span className="bg-slate-100/80 text-slate-700 border border-slate-200/80 rounded-md px-2.5 py-1 text-xs font-medium flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.5} />
                        {job.location}
                      </span>
                      <span className="bg-slate-100/80 text-slate-900 border border-slate-200/80 rounded-md px-2.5 py-1 text-xs font-semibold tabular-nums">
                        {job.salary} • {job.shift}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {job.description}
                    </p>

                    {/* Card Footer with Intercepted Application Button */}
                    <div className="pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                        <Lock className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.5} />
                        <span>Estudios y Poligrafía 100% asumidos por la empresa</span>
                      </div>

                      {role === "company" ? (
                        <Link
                          href="/empresa/vacantes/nueva"
                          className="w-full sm:w-auto h-9 bg-[#0F172A] hover:bg-slate-800 text-white rounded-md px-3.5 text-xs font-medium transition-colors text-center shadow-[0_1px_2px_rgba(15,23,42,0.05)] inline-flex items-center justify-center gap-1.5"
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Publicar Oferta Similar</span>
                        </Link>
                      ) : role === "admin" ? (
                        <Link
                          href="/admin/estudios"
                          className="w-full sm:w-auto h-9 bg-[#0F172A] hover:bg-slate-800 text-white rounded-md px-3.5 text-xs font-medium transition-colors text-center shadow-[0_1px_2px_rgba(15,23,42,0.05)] inline-flex items-center justify-center"
                        >
                          Gestionar en Admin
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleApplyClick(job.id)}
                          className="w-full sm:w-auto h-9 bg-[#0F172A] hover:bg-slate-800 text-white rounded-md px-4 text-xs font-medium transition-colors text-center shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
                        >
                          Postularme en 1 clic
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* COLUMNA DERECHA (lg:col-span-5) - ACCESO POR ROL O VISTA PREVIA VISITANTE */}
            <div className="lg:col-span-5 space-y-3.5">
              {isAuthenticated && role === "company" ? (
                /* 1. VISTA EXCLUSIVA EMPRESA DE SEGURIDAD */
                <>
                  <div className="pb-1">
                    <h2 className="text-base font-semibold tracking-tight text-slate-900">
                      Operación de Empresa de Seguridad
                    </h2>
                    <p className="text-xs text-slate-500">
                      Herramientas corporativas para reclutamiento y estudios de confiabilidad
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sticky top-24 space-y-4">
                    <div className="flex items-start gap-3.5 pb-3.5 border-b border-slate-200/80">
                      <div className="w-10 h-10 rounded-md bg-amber-50/80 border border-amber-200/70 flex items-center justify-center text-amber-700 shrink-0">
                        <Building2 className="w-5 h-5" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50/80 border border-amber-200/70 px-2 py-0.5 rounded-md">
                          Sesión Corporativa
                        </span>
                        <h3 className="font-semibold text-sm text-slate-900 mt-1 truncate">
                          {fullName ? fullName : "Portal de Empresa"}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Empresa de Seguridad Privada
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      Gestiona la contratación de personal operativo con estudios de confiabilidad, antecedentes y polígrafo integrados.
                    </p>

                    <div className="space-y-2 pt-1">
                      <Link
                        href="/empresa/dashboard"
                        className="w-full h-10 bg-[#0F172A] hover:bg-slate-800 text-white rounded-md px-3.5 font-medium text-xs flex items-center justify-between transition-colors shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-amber-400" />
                          <span>Ir a mi Panel de Empresa</span>
                        </div>
                        <ArrowRight className="w-4 h-4" />
                      </Link>

                      <Link
                        href="/empresa/vacantes/nueva"
                        className="w-full h-10 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-md px-3.5 font-semibold text-xs flex items-center justify-between transition-colors shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
                      >
                        <div className="flex items-center gap-2">
                          <PlusCircle className="w-4 h-4 text-slate-950" />
                          <span>Publicar Vacante</span>
                        </div>
                        <ArrowRight className="w-4 h-4" />
                      </Link>

                      <Link
                        href="/empresa/relevos"
                        className="w-full h-10 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 rounded-md px-3.5 font-medium text-xs flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Search className="w-4 h-4 text-slate-500" />
                          <span>Buscar Personal Verificado</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </Link>
                    </div>
                  </div>
                </>
              ) : isAuthenticated && role === "candidate" ? (
                /* 2. VISTA EXCLUSIVA PERSONAL OPERATIVO (CANDIDATE) */
                <>
                  <div className="pb-1">
                    <h2 className="text-base font-semibold tracking-tight text-slate-900">
                      Mi Expediente Operativo
                    </h2>
                    <p className="text-xs text-slate-500">
                      Gestiona tu perfil, credenciales y postulaciones en tiempo real
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sticky top-24 space-y-4">
                    <div className="flex items-start gap-3.5 pb-3.5 border-b border-slate-200/80">
                      <div className="w-10 h-10 rounded-md bg-emerald-50/80 border border-emerald-200/60 flex items-center justify-center text-emerald-700 shrink-0">
                        <Shield className="w-5 h-5 text-emerald-600" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50/80 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Personal Operativo
                        </span>
                        <h3 className="font-semibold text-sm text-slate-900 mt-1 truncate">
                          {fullName ? fullName : "Mi Perfil de Candidato"}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Vigilancia & Seguridad Privada
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      Tu perfil auditado te permite postularte en 1 clic a empresas de seguridad verificadas sin intermediarios ni cobros.
                    </p>

                    <div className="space-y-2 pt-1">
                      <Link
                        href="/guarda/perfil"
                        className="w-full h-10 bg-[#0F172A] hover:bg-slate-800 text-white rounded-md px-3.5 font-medium text-xs flex items-center justify-between transition-colors shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-400" />
                          <span>Ir a Mi Hoja de Vida / Mi Perfil Operativo</span>
                        </div>
                        <ArrowRight className="w-4 h-4" />
                      </Link>

                      <Link
                        href="/guarda/vacantes"
                        className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md px-3.5 font-medium text-xs flex items-center justify-between transition-colors shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
                      >
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          <span>Ver Vacantes Disponibles</span>
                        </div>
                        <ArrowRight className="w-4 h-4" />
                      </Link>

                      <Link
                        href="/guarda/documentos"
                        className="w-full h-10 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 rounded-md px-3.5 font-medium text-xs flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <BadgeCheck className="w-4 h-4 text-slate-500" />
                          <span>Mis Cursos y Documentos</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </Link>
                    </div>
                  </div>
                </>
              ) : isAuthenticated && role === "admin" ? (
                /* 3. VISTA EXCLUSIVA SUPERADMIN */
                <>
                  <div className="pb-1">
                    <h2 className="text-base font-semibold tracking-tight text-slate-900">
                      Gobierno de Plataforma SuperAdmin
                    </h2>
                    <p className="text-xs text-slate-500">
                      Control centralizado de empresas, estudios y academias
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sticky top-24 space-y-4">
                    <div className="flex items-start gap-3.5 pb-3.5 border-b border-slate-200/80">
                      <div className="w-10 h-10 rounded-md bg-[#0F172A] flex items-center justify-center text-amber-400 shrink-0">
                        <Shield className="w-5 h-5" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-800 bg-slate-100 border border-slate-200/90 px-2 py-0.5 rounded-md">
                          SuperAdministrador
                        </span>
                        <h3 className="font-semibold text-sm text-slate-900 mt-1 truncate">
                          Panel SuperAdmin
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          FuerzaVerificada Central
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      Supervisa la aprobación de empresas de seguridad, asignación de estudios de confiabilidad y acuerdos con academias.
                    </p>

                    <div className="space-y-2 pt-1">
                      <Link
                        href="/admin/estudios"
                        className="w-full h-10 bg-[#0F172A] hover:bg-slate-800 text-white rounded-md px-3.5 font-medium text-xs flex items-center justify-between transition-colors shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
                      >
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-amber-400" />
                          <span>Ir al Panel de SuperAdmin</span>
                        </div>
                        <ArrowRight className="w-4 h-4" />
                      </Link>

                      <Link
                        href="/admin/empresas"
                        className="w-full h-10 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 rounded-md px-3.5 font-medium text-xs flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-500" />
                          <span>Gestión de Empresas B2B</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </Link>
                    </div>
                  </div>
                </>
              ) : (
                /* 4. ÚNICO CASO: VISITANTE SIN SESIÓN INICIADA (VISTA PREVIA ILUSTRATIVA) */
                <>
                  <div className="pb-1">
                    <h2 className="text-base font-semibold tracking-tight text-slate-900">
                      Expediente de Confiabilidad Verificado
                    </h2>
                    <p className="text-xs text-slate-500">
                      Así visualizan los directores de operaciones y analistas de seguridad el perfil del candidato
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sticky top-24 space-y-4">
                    {/* Header with Photo & Verification */}
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-md bg-slate-100 border border-slate-200/90 flex items-center justify-center font-semibold text-sm text-slate-800 shrink-0">
                        FV
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-semibold text-sm text-slate-900 truncate">
                            Aspirante Verificado (Vista Previa)
                          </h3>
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={1.5} />
                        </div>
                        <p className="text-xs font-medium text-slate-700">
                          Personal Operativo & Seguridad Integral
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                          6 años de experiencia • Bogotá D.C.
                        </p>
                      </div>
                    </div>

                    {/* Banner Verde Sobrio */}
                    <div className="bg-emerald-50/80 border border-emerald-200/60 rounded-md p-3 flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-600" />
                          <span>PERFIL VERIFICADO • CURSO VIGENTE</span>
                        </div>
                        <div className="text-[11px] text-emerald-700 mt-0.5 tabular-nums">
                          Credencial SuperVigilancia al día (184 días restantes)
                        </div>
                      </div>
                      <span className="bg-white text-emerald-700 border border-emerald-200/60 px-2.5 py-0.5 rounded-md font-medium text-[11px] shrink-0">
                        Antecedentes OK
                      </span>
                    </div>

                    {/* Bloque Certificaciones */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Certificaciones y Permisos Validados
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="bg-slate-100/80 text-slate-700 border border-slate-200/80 rounded-md px-2.5 py-1 text-xs font-medium tabular-nums">
                          Reentrenamiento Vigilancia 2026
                        </span>
                        <span className="bg-slate-100/80 text-slate-700 border border-slate-200/80 rounded-md px-2.5 py-1 text-xs font-medium">
                          Manejo Armas Cortas (Indumil)
                        </span>
                        <span className="bg-slate-100/80 text-slate-700 border border-slate-200/80 rounded-md px-2.5 py-1 text-xs font-medium">
                          Libreta Militar 1ra Clase
                        </span>
                        <span className="bg-slate-100/80 text-slate-700 border border-slate-200/80 rounded-md px-2.5 py-1 text-xs font-medium tabular-nums">
                          Moto Propia 150cc
                        </span>
                      </div>
                    </div>

                    {/* Bloque Verificación Avanzada (Paquete Empresa) */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Verificación Integral de Confiabilidad
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-slate-50/80 border border-slate-200/90 rounded-md p-2 text-center">
                          <span className="text-[10px] text-slate-500 block">Estudio Seg.</span>
                          <span className="text-xs font-semibold text-emerald-700 block mt-0.5">Aprobado</span>
                        </div>
                        <div className="bg-slate-50/80 border border-slate-200/90 rounded-md p-2 text-center">
                          <span className="text-[10px] text-slate-500 block">Visita Domicil.</span>
                          <span className="text-xs font-semibold text-emerald-700 block mt-0.5">Realizada</span>
                        </div>
                        <div className="bg-slate-50/80 border border-slate-200/90 rounded-md p-2 text-center">
                          <span className="text-[10px] text-slate-500 block">Poligrafía</span>
                          <span className="text-xs font-semibold text-emerald-700 block mt-0.5">Sin Novedad</span>
                        </div>
                      </div>
                    </div>

                    {/* Botón Inferior: Redirección limpia a /login */}
                    <div className="pt-1">
                      <Link
                        href="/login"
                        className="w-full h-10 bg-[#0F172A] hover:bg-slate-800 text-white rounded-md px-4 font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-[0_1px_2px_rgba(15,23,42,0.05)] text-center"
                      >
                        <Shield className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
                        <span>Crear mi Hoja de Vida / Ingresar</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECCIÓN DE LAS 3 PROMESAS TÁCTICAS */}
      <section className="bg-white py-14 border-t border-slate-200/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
              Diseñado para resolver el dolor operativo del gremio
            </h2>
            <p className="text-xs text-slate-500">
              Tres garantías reales para empresas de vigilancia y personal operativo en Colombia
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-lg bg-[#F8FAFC] border border-slate-200/90 space-y-2.5">
              <div className="w-8 h-8 rounded-md bg-[#0F172A] text-white flex items-center justify-center font-mono font-semibold text-xs tabular-nums">
                01
              </div>
              <h3 className="font-semibold text-sm text-slate-900 tracking-tight">
                Garantía Cero Cobros al Personal Operativo
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Postulación 100% gratuita. Todo el personal operativo y profesionales en seguridad privada ven el salario real, turno (2x2x2, 4x2) y ubicación antes de aplicar, sin intermediarios ni cobros ilícitos.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-[#F8FAFC] border border-slate-200/90 space-y-2.5">
              <div className="w-8 h-8 rounded-md bg-[#0F172A] text-white flex items-center justify-center font-mono font-semibold text-xs tabular-nums">
                02
              </div>
              <h3 className="font-semibold text-sm text-slate-900 tracking-tight">
                Semáforo del Curso & Radar de Relevos
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cálculo en vivo de vigencia ante SuperVigilancia y buscador de profesionales en seguridad disponibles para cubrir incapacidades y turnos urgentes de última hora.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-[#F8FAFC] border border-slate-200/90 space-y-2.5">
              <div className="w-8 h-8 rounded-md bg-[#0F172A] text-white flex items-center justify-center font-mono font-semibold text-xs tabular-nums">
                03
              </div>
              <h3 className="font-semibold text-sm text-slate-900 tracking-tight">
                Contratación Blindada Todo en Uno
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
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
