"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Shield,
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Bike,
  Sparkles,
  Search,
  Filter,
  Check,
  Building2,
  Calendar,
  FileCheck,
  ChevronRight,
  X,
  CreditCard,
  PlusCircle,
  ArrowRight,
} from "lucide-react";
import { ReliefToggle } from "@/components/guarda/ReliefToggle";
import { calculateMatchScore } from "@/lib/utils/matchCalculator";
import {
  normalizeSecurityRole,
  formatSecurityRoleLabel,
} from "@/lib/utils/roleNormalizer";
import { JobPost, CourseSemaphore } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/useAuth";

export type JobPostWithCompany = JobPost & {
  company_name: string;
  is_verified_company: boolean;
};

const INITIAL_JOBS: JobPostWithCompany[] = [];

const QUICK_FILTERS = [
  "Todas",
  "Vigilante Fijo",
  "Escolta",
  "Supervisor",
  "Operador CCTV",
  "Contratación Inmediata",
] as const;

type QuickFilterType = (typeof QUICK_FILTERS)[number];

function formatRelativeDate(dateString?: string): string {
  if (!dateString) return "Publicada recientemente";
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 24) {
    return "Publicada hoy";
  } else if (diffDays === 1) {
    return "Hace 1 día";
  } else if (diffDays < 7) {
    return `Hace ${diffDays} días`;
  } else if (diffDays < 14) {
    return "Hace 1 semana";
  } else if (diffDays < 30) {
    return `Hace ${Math.floor(diffDays / 7)} semanas`;
  } else {
    const months = Math.floor(diffDays / 30);
    return `Hace ${months} mes${months > 1 ? "es" : ""}`;
  }
}

function VacantesContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { role, isAuthenticated } = useAuth();

  const [jobs, setJobs] = useState<JobPostWithCompany[]>(INITIAL_JOBS);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [appliedJobIds, setAppliedJobIds] = useState<Record<string, boolean>>({});
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Computrabajo-style search inputs
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>("Todas");

  // Read URL search params on mount
  useEffect(() => {
    const locParam = searchParams.get("location");
    if (locParam) setLocationFilter(locParam);

    const roleParam = searchParams.get("role");
    if (roleParam) setSearchTerm(roleParam);

    const applyParam = searchParams.get("apply");
    if (applyParam) setSelectedJobId(applyParam);
  }, [searchParams]);

  // Load real vacancies from Supabase
  useEffect(() => {
    async function fetchRealJobs() {
      try {
        let { data, error } = await supabase
          .from("job_posts")
          .select("*, companies(company_name, is_verified_company)")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error || !data || data.length === 0) {
          const fallback = await supabase
            .from("jobs")
            .select("*, companies(company_name, is_verified_company)")
            .eq("is_active", true)
            .order("created_at", { ascending: false });
          if (!fallback.error && fallback.data && fallback.data.length > 0) {
            data = fallback.data;
            error = null;
          }
        }

        if (!error && data && data.length > 0) {
          const mapped: JobPostWithCompany[] = data.map((j: any) => ({
            ...j,
            company_name: j.companies?.company_name || "Empresa de Seguridad",
            is_verified_company: j.companies?.is_verified_company ?? true,
          }));
          setJobs(mapped);
          if (mapped.length > 0) {
            setSelectedJobId(mapped[0].id);
          }
          return;
        } else {
          setJobs([]);
        }
      } catch {
        setJobs([]);
      }
    }

    fetchRealJobs();
  }, [supabase]);

  // Candidate Profile State - Populated from Supabase
  const [candidateProfile, setCandidateProfile] = useState({
    city: "",
    primary_role: "",
    years_experience: 0,
    has_military_booklet: false,
    has_own_motorcycle: false,
    motorcycle_cc: 0,
    available_immediately: false,
    course_semaphore: "SIN_CURSO" as CourseSemaphore,
    daysRemaining: 0,
  });

  // Mobile detail drawer toggle
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  useEffect(() => {
    async function loadCandidateState() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Load candidate_profiles
        const { data: candProf } = await supabase
          .from("candidate_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        // 2. Load candidate_courses
        const { data: course } = await supabase
          .from("candidate_courses")
          .select("*")
          .eq("candidate_id", user.id)
          .order("completion_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (candProf || course) {
          let semaphore: CourseSemaphore = "SIN_CURSO";
          let daysRem = 0;

          if (course?.completion_date) {
            const expDate = new Date(course.completion_date);
            expDate.setFullYear(expDate.getFullYear() + 1);
            const diffDays = Math.ceil(
              (expDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );
            daysRem = diffDays;
            if (diffDays > 30) semaphore = "VIGENTE";
            else if (diffDays >= 0) semaphore = "PROXIMO_A_VENCER";
            else semaphore = "VENCIDO";
          }

          setCandidateProfile((prev) => ({
            ...prev,
            city: candProf?.city || prev.city,
            primary_role: candProf?.primary_role || prev.primary_role,
            years_experience:
              candProf?.years_experience !== undefined
                ? candProf.years_experience
                : prev.years_experience,
            has_military_booklet:
              candProf?.has_military_booklet ?? prev.has_military_booklet,
            has_own_motorcycle:
              candProf?.has_own_motorcycle ?? prev.has_own_motorcycle,
            motorcycle_cc: candProf?.motorcycle_cc || prev.motorcycle_cc,
            available_immediately:
              candProf?.available_immediately ?? prev.available_immediately,
            course_semaphore: course ? semaphore : prev.course_semaphore,
            daysRemaining: course ? daysRem : prev.daysRemaining,
          }));
        }

        // 3. Load existing applications to prevent duplicate submissions
        const { data: apps } = await supabase
          .from("applications")
          .select("job_id")
          .eq("candidate_id", user.id);

        if (apps && apps.length > 0) {
          const map: Record<string, boolean> = {};
          apps.forEach((a: any) => {
            if (a.job_id) map[a.job_id] = true;
          });
          setAppliedJobIds((prev) => ({ ...prev, ...map }));
        }
      } catch {}
    }

    loadCandidateState();
  }, [supabase]);

  const handleApply = async (job: JobPostWithCompany) => {
    // 1. Bloqueo de Acciones sin Sesión
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent("/guarda/vacantes")}`);
      return;
    }

    // 2. Exclusividad para Rol Candidato
    if (role === "company") {
      alert(
        "Tu cuenta actual es de Empresa de Seguridad. Las postulaciones a vacantes son exclusivas para el Personal Operativo."
      );
      return;
    }

    const match = calculateMatchScore(job, candidateProfile);

    const updated = { ...appliedJobIds, [job.id]: true };
    setAppliedJobIds(updated);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        await supabase.from("applications").insert({
          job_id: job.id,
          candidate_id: userData.user.id,
          match_score: match.score,
          status: "postulado",
        });
      }
    } catch {}

    setSuccessToast(`¡Postulación enviada exitosamente para: ${job.title}!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Computrabajo-style filtering
  const filteredJobs = jobs.filter((j) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      j.title.toLowerCase().includes(q) ||
      j.company_name.toLowerCase().includes(q) ||
      (j.zone_neighborhood || "").toLowerCase().includes(q) ||
      (j.description || "").toLowerCase().includes(q);

    const loc = locationFilter.toLowerCase().trim();
    const matchesLocation =
      !loc ||
      j.city.toLowerCase().includes(loc) ||
      (j.zone_neighborhood || "").toLowerCase().includes(loc);

    let matchesChip = true;
    const roleNormalized = normalizeSecurityRole(j.role_required);
    const titleLower = j.title.toLowerCase();

    if (quickFilter === "Vigilante Fijo") {
      matchesChip =
        roleNormalized === "vigilante_fijo" || titleLower.includes("vigilante");
    } else if (quickFilter === "Escolta") {
      matchesChip =
        roleNormalized === "escolta_vip" ||
        roleNormalized === "escolta_mercancia" ||
        titleLower.includes("escolta");
    } else if (quickFilter === "Supervisor") {
      matchesChip =
        roleNormalized === "supervisor_motorizado" ||
        roleNormalized === "supervisor_zona" ||
        titleLower.includes("supervisor");
    } else if (quickFilter === "Operador CCTV") {
      matchesChip =
        roleNormalized === "operador_medios_tecnologicos" ||
        titleLower.includes("cctv") ||
        titleLower.includes("operador") ||
        titleLower.includes("medios");
    } else if (quickFilter === "Contratación Inmediata") {
      matchesChip = Boolean(j.is_urgent_relief);
    }

    return matchesSearch && matchesLocation && matchesChip;
  });

  const selectedJob =
    jobs.find((j) => j.id === selectedJobId) || filteredJobs[0] || jobs[0];
  const selectedMatch = selectedJob
    ? calculateMatchScore(selectedJob, candidateProfile)
    : null;
  const isSelectedApplied = selectedJob ? !!appliedJobIds[selectedJob.id] : false;

  return (
    <div className="space-y-6">
      {/* 1. BUSCADOR SUPERIOR ESTILO COMPUTRABAJO */}
      <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Bolsa de Empleo en Seguridad Privada en Colombia
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Vacantes con salario certificado, dotación de ley y turnos regulados. Postúlate directamente con tu Hoja de Vida.
          </p>
        </div>

        {/* Buscador Unificado en un Solo Contenedor: [ Cargo ] + [ Ciudad ] + [ Botón Buscar ] */}
        <form
          onSubmit={(e) => e.preventDefault()}
          className="bg-slate-50/80 border border-slate-200/90 rounded-lg p-1.5 flex flex-col md:flex-row gap-1.5 md:items-center transition-all focus-within:border-slate-900 focus-within:bg-white"
        >
          {/* Campo 1: Cargo, especialidad o palabra clave */}
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5" strokeWidth={1.75} />
            <input
              type="text"
              placeholder="Cargo, especialidad o palabra clave (Ej. Vigilante, Escolta, Operador CCTV)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 bg-transparent pl-10 pr-8 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2 text-slate-400 hover:text-slate-600 p-1"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Divisor vertical técnico */}
          <div className="hidden md:block w-px h-7 bg-slate-200/90 shrink-0" />

          {/* Campo 2: Ciudad */}
          <div className="relative md:w-72 flex items-center">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5" strokeWidth={1.75} />
            <input
              type="text"
              placeholder="Ciudad (Ej. Bogotá, Medellín, Cali)..."
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full h-11 bg-transparent pl-10 pr-8 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
            />
            {locationFilter && (
              <button
                type="button"
                onClick={() => setLocationFilter("")}
                className="absolute right-2 text-slate-400 hover:text-slate-600 p-1"
                aria-label="Limpiar ciudad"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Botón Buscar */}
          <button
            type="submit"
            className="h-11 px-6 rounded-md bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shrink-0 shadow-sm"
          >
            <Search className="w-4 h-4" strokeWidth={2} />
            <span>Buscar</span>
          </button>
        </form>

        {/* 2. CHIPS DE FILTRO RÁPIDO EN 1 CLIC */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Filtro rápido:
            </span>
            {QUICK_FILTERS.map((pill) => {
              const isActive = quickFilter === pill;
              return (
                <button
                  key={pill}
                  type="button"
                  onClick={() => setQuickFilter(pill)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                    isActive
                      ? "bg-[#0F172A] text-white border-[#0F172A] shadow-xs"
                      : "bg-white text-slate-600 border-slate-200/90 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {pill === "Contratación Inmediata" ? (
                    <span className="flex items-center gap-1.5">
                      <Zap className={`w-3 h-3 ${isActive ? "text-amber-400 fill-amber-400" : "text-amber-600"}`} />
                      <span>{pill}</span>
                    </span>
                  ) : (
                    pill
                  )}
                </button>
              );
            })}
          </div>

          <div className="text-xs text-slate-500 font-medium tabular-nums">
            Mostrando <strong className="text-slate-900 font-semibold">{filteredJobs.length}</strong> {filteredJobs.length === 1 ? "vacante activa" : "vacantes activas"}
          </div>
        </div>
      </div>

      {/* FEEDBACK TOAST */}
      {successToast && (
        <div className="p-3.5 rounded-lg bg-[#0F172A] text-white text-xs font-medium flex items-center justify-between shadow-md border border-slate-800 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" strokeWidth={2} />
            <span>{successToast}</span>
          </div>
          <Link
            href="/guarda/postulaciones"
            className="text-emerald-400 hover:underline font-semibold"
          >
            Ver estado en Mis Postulaciones →
          </Link>
        </div>
      )}

      {/* 3. LAYOUT DE 2 COLUMNAS EN ESCRITORIO (MASTER-DETAIL) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMNA IZQUIERDA: LISTA DE TARJETAS ESCANEABLES (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-2.5">
          {filteredJobs.length === 0 ? (
            <div className="p-10 text-center bg-white border border-slate-200/90 rounded-lg space-y-3 shadow-subtle">
              <Briefcase className="w-9 h-9 text-slate-300 mx-auto" strokeWidth={1.5} />
              <h3 className="text-sm font-semibold text-slate-800">
                No encontramos vacantes con estos criterios
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Prueba ajustando el cargo o eliminando el filtro de ciudad para ver más opciones en Colombia.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setLocationFilter("");
                  setQuickFilter("Todas");
                }}
                className="btn-secondary text-xs h-8 px-3 inline-flex"
              >
                Restablecer todos los filtros
              </button>
            </div>
          ) : (
            filteredJobs.map((job) => {
              const match = calculateMatchScore(job, candidateProfile);
              const isSelected = selectedJob?.id === job.id;
              const isApplied = !!appliedJobIds[job.id];
              const relativeDate = formatRelativeDate(job.created_at);

              return (
                <div
                  key={job.id}
                  onClick={() => {
                    setSelectedJobId(job.id);
                    setMobileDetailOpen(true);
                  }}
                  className={`p-4 rounded-lg border transition-all cursor-pointer relative ${
                    isSelected
                      ? "bg-white border-slate-900 ring-1 ring-slate-900 shadow-sm"
                      : "bg-white border-slate-200/90 hover:border-slate-300 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                  }`}
                >
                  {/* Etiqueta superior de contratación urgente si aplica */}
                  {job.is_urgent_relief && (
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-800 bg-amber-50/90 border border-amber-200/70 px-2 py-0.5 rounded-md w-fit mb-2">
                      <Zap className="w-3 h-3 fill-amber-500 text-amber-600" />
                      <span>Contratación Inmediata</span>
                    </div>
                  )}

                  {/* Cabecera de la tarjeta: Título en negrita y Empresa */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-slate-900 tracking-tight leading-snug">
                        {job.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                        <span>{job.company_name}</span>
                        {job.is_verified_company && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/70">
                            <Shield className="w-2.5 h-2.5 text-emerald-600" strokeWidth={2} />
                            <span>Verificada</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Porcentaje de Match */}
                    <div className="shrink-0 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold font-mono tabular-nums ${
                          match.score >= 80
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200/70"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {match.score}% Match
                      </span>
                    </div>
                  </div>

                  {/* Píldoras grises con Salario, Ciudad y Turno */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="bg-slate-100/90 text-slate-800 font-semibold font-mono tabular-nums px-2 py-0.5 rounded-md border border-slate-200/70">
                      ${job.salary_monthly.toLocaleString("es-CO")} COP
                    </span>
                    <span className="bg-slate-50 text-slate-600 font-medium px-2 py-0.5 rounded-md border border-slate-200/60 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{job.city}</span>
                    </span>
                    <span className="bg-slate-50 text-slate-600 font-medium px-2 py-0.5 rounded-md border border-slate-200/60 font-mono tabular-nums">
                      {job.shift}
                    </span>
                  </div>

                  {/* Pie de tarjeta: Fecha relativa y Estado de postulación */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 tabular-nums">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{relativeDate}</span>
                    </span>

                    {isApplied ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-200/60">
                        <Check className="w-3 h-3" strokeWidth={2.5} />
                        Postulado
                      </span>
                    ) : (
                      <span className="text-slate-500 font-medium group-hover:text-slate-900 inline-flex items-center gap-0.5">
                        Ver detalle <ChevronRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* COLUMNA DERECHA: PANEL DE DETALLE FIJO (lg:col-span-7) */}
        {selectedJob ? (
          <div className="hidden lg:block lg:col-span-7 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1">
            <div className="bg-white border border-slate-200/90 rounded-lg p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-5">
              {/* Header con Título, Empresa y Botón de Postulación Rápida */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200/80">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600">
                      {selectedJob.company_name}
                    </span>
                    {selectedJob.is_verified_company && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70">
                        <Shield className="w-3 h-3 text-emerald-600" strokeWidth={2} />
                        SuperVigilancia Autorizada
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">
                    {selectedJob.title}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-slate-500 pt-0.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedJob.city} {selectedJob.zone_neighborhood ? `• ${selectedJob.zone_neighborhood}` : ""}</span>
                    </span>
                    <span>•</span>
                    <span className="font-mono tabular-nums">
                      Turno: {selectedJob.shift}
                    </span>
                    <span>•</span>
                    <span className="tabular-nums">
                      {formatRelativeDate(selectedJob.created_at)}
                    </span>
                  </div>
                </div>

                {/* Botón Superior de Acción Directa */}
                {role === "company" ? (
                  <Link
                    href="/empresa/vacantes/nueva"
                    className="btn-secondary text-xs h-9 px-3.5 shrink-0"
                  >
                    Publicar Vacante
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled={isSelectedApplied}
                    onClick={() => handleApply(selectedJob)}
                    className={`btn-primary text-xs h-9 px-4 font-semibold shrink-0 ${
                      isSelectedApplied
                        ? "bg-slate-100 text-emerald-800 border border-emerald-300 hover:bg-slate-100 cursor-default"
                        : "bg-[#0F172A] hover:bg-slate-800 text-white"
                    }`}
                  >
                    {isSelectedApplied ? (
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Ya Postulado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 fill-white" />
                        Postularme Ahora
                      </span>
                    )}
                  </button>
                )}
              </div>

              {/* Caja Destacada de Salario y Beneficios */}
              <div className="p-4 rounded-lg bg-[#0F172A] text-white flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">
                    Salario Básico Mensual
                  </span>
                  <div className="text-xl font-bold font-mono tabular-nums text-white mt-0.5">
                    ${selectedJob.salary_monthly.toLocaleString("es-CO")}{" "}
                    <span className="text-xs font-normal text-slate-400 font-sans">COP</span>
                  </div>
                  {selectedJob.includes_surcharges && (
                    <span className="text-[11px] text-emerald-400 font-medium">
                      + Recargos nocturnos, festivos y todas las prestaciones de ley
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Modalidad</span>
                  <span className="text-xs font-semibold text-amber-400 font-mono tabular-nums">
                    {selectedJob.shift}
                  </span>
                </div>
              </div>

              {/* Checklist de Compatibilidad con el Perfil */}
              {selectedMatch && (
                <div className="space-y-2.5 bg-slate-50/70 border border-slate-200/80 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Evaluación de Requisitos con tu Expediente:
                    </h4>
                    <span className="text-xs font-mono font-bold text-slate-900 tabular-nums">
                      {selectedMatch.score}% de Compatibilidad
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-md border border-slate-200/80 bg-white flex items-center justify-between">
                      <span className="text-slate-600">Cargo ({formatSecurityRoleLabel(selectedJob.role_required)}):</span>
                      {selectedMatch.breakdown.roleMatch ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> Cumples
                        </span>
                      ) : (
                        <span className="text-amber-700 font-medium">Diferente</span>
                      )}
                    </div>

                    <div className="p-2.5 rounded-md border border-slate-200/80 bg-white flex items-center justify-between">
                      <span className="text-slate-600">Curso SuperVigilancia:</span>
                      {selectedMatch.breakdown.courseValid ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> Al día
                        </span>
                      ) : (
                        <span className="text-rose-600 font-medium">Pendiente</span>
                      )}
                    </div>

                    <div className="p-2.5 rounded-md border border-slate-200/80 bg-white flex items-center justify-between">
                      <span className="text-slate-600">Ciudad de Residencia:</span>
                      {selectedMatch.breakdown.cityMatch ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> Misma sede
                        </span>
                      ) : (
                        <span className="text-rose-600 font-medium">Otra ciudad</span>
                      )}
                    </div>

                    <div className="p-2.5 rounded-md border border-slate-200/80 bg-white flex items-center justify-between">
                      <span className="text-slate-600">Libreta Militar:</span>
                      {candidateProfile.has_military_booklet ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> Sí
                        </span>
                      ) : (
                        <span className="text-slate-400">Sin registrar</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Descripción Operativa */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Funciones y Requisitos del Puesto:
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-line">
                  {selectedJob.description}
                </p>
              </div>

              {/* Dirección de Citación si existe */}
              {selectedJob.interview_address && (
                <div className="p-3 rounded-md bg-slate-50 border border-slate-200/80 text-xs text-slate-700 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" strokeWidth={1.75} />
                  <div>
                    <strong className="block text-slate-900 font-semibold">Sede Principal para Entrevistas:</strong>
                    <p className="text-slate-600 mt-0.5">{selectedJob.interview_address}</p>
                  </div>
                </div>
              )}

              {/* Sello de Garantía Cero Cobros */}
              <div className="p-3 rounded-md bg-emerald-50/60 border border-emerald-200/70 flex items-center justify-between text-xs text-emerald-900">
                <span className="flex items-center gap-1.5 font-medium">
                  <Shield className="w-4 h-4 text-emerald-600" strokeWidth={2} />
                  Garantía Cero Cobros: Ninguna empresa de seguridad puede cobrarte por exámenes ni vinculación.
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold">Ley 1581</span>
              </div>

              {/* Botón Principal Inferior de Postulación */}
              <div className="pt-2">
                {role === "company" ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-center text-xs text-slate-600">
                    Estás navegando en modo Empresa de Seguridad. Las postulaciones son exclusivas para aspirantes operativos.
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isSelectedApplied}
                    onClick={() => handleApply(selectedJob)}
                    className={`w-full h-11 rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm ${
                      isSelectedApplied
                        ? "bg-slate-100 text-emerald-800 border border-emerald-300 hover:bg-slate-100 cursor-default"
                        : "bg-[#0F172A] hover:bg-slate-800 text-white"
                    }`}
                  >
                    {isSelectedApplied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" strokeWidth={2} />
                        <span>Ya estás postulado a esta vacante</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-white text-white" strokeWidth={1.5} />
                        <span>Postularme en 1 Clic con mi Hoja de Vida</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex lg:col-span-7 flex-col items-center justify-center p-12 bg-white border border-slate-200/90 rounded-lg text-center text-slate-400 space-y-2 min-h-[360px]">
            <Briefcase className="w-8 h-8 text-slate-300 mx-auto" strokeWidth={1.5} />
            <p className="text-xs text-slate-500 font-medium">
              Selecciona una vacante de la lista para ver su detalle completo.
            </p>
          </div>
        )}
      </div>

      {/* 4. MODAL / DRAWER EN MÓVIL CON BARRA FIJA (STICKY BOTTOM CTA) */}
      {mobileDetailOpen && selectedJob && (
        <div className="fixed inset-0 z-50 lg:hidden bg-slate-950/70 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-150">
          <div className="bg-white rounded-t-xl p-5 max-h-[85vh] overflow-y-auto space-y-4 pb-24">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-600">{selectedJob.company_name}</span>
              <button
                type="button"
                onClick={() => setMobileDetailOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
                aria-label="Cerrar detalle"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
              {selectedJob.title}
            </h3>

            <div className="p-3.5 bg-[#0F172A] text-white rounded-lg flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Salario mensual</span>
                <div className="text-lg font-bold font-mono tabular-nums">
                  ${selectedJob.salary_monthly.toLocaleString("es-CO")} COP
                </div>
              </div>
              <span className="text-xs text-amber-400 font-mono font-semibold tabular-nums">
                {selectedJob.shift}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{selectedJob.city} {selectedJob.zone_neighborhood ? `• ${selectedJob.zone_neighborhood}` : ""}</span>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Descripción del puesto:
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {selectedJob.description}
              </p>
            </div>

            {selectedJob.interview_address && (
              <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <strong className="block text-slate-900">Sede para entrevistas:</strong>
                <p className="text-slate-600 mt-0.5">{selectedJob.interview_address}</p>
              </div>
            )}
          </div>

          {/* BARRA FIJA EN MÓVIL (STICKY BOTTOM CTA) */}
          <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200/90 p-3 z-40 shadow-[0_-4px_16px_rgba(15,23,42,0.08)] flex items-center justify-between gap-3">
            <div className="truncate">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block truncate">
                {selectedJob.company_name}
              </span>
              <span className="text-xs font-bold text-slate-900 font-mono tabular-nums">
                ${selectedJob.salary_monthly.toLocaleString("es-CO")} COP
              </span>
            </div>

            {role === "company" ? (
              <Link
                href="/empresa/vacantes/nueva"
                onClick={() => setMobileDetailOpen(false)}
                className="h-10 px-4 rounded-md bg-[#0F172A] text-white text-xs font-semibold flex items-center justify-center shrink-0"
              >
                Publicar Vacante
              </Link>
            ) : (
              <button
                type="button"
                disabled={isSelectedApplied}
                onClick={() => {
                  handleApply(selectedJob);
                  setMobileDetailOpen(false);
                }}
                className={`h-10 px-5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 transition-colors ${
                  isSelectedApplied
                    ? "bg-slate-100 text-emerald-800 border border-emerald-300"
                    : "bg-[#0F172A] hover:bg-slate-800 text-white"
                }`}
              >
                {isSelectedApplied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Ya Postulado</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-white" />
                    <span>Postularme Ahora</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function VacantesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-[#64748B] flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-[#0F172A] border-t-transparent rounded-full animate-spin" />
          <span>Cargando vacantes operativas...</span>
        </div>
      }
    >
      <VacantesContent />
    </Suspense>
  );
}
