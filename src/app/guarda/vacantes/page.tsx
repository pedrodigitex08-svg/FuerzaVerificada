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
  Search,
  Filter,
  Check,
  Building2,
  Calendar,
  FileCheck,
  ChevronRight,
  X,
  ArrowRight,
  Heart,
  Share2,
  EyeOff,
  MoreVertical,
  ChevronDown,
  Building,
} from "lucide-react";
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

function formatRelativeDate(dateString?: string): string {
  if (!dateString) return "Publicada recientemente";
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) {
    return "Hace unos minutos";
  } else if (diffHours < 24) {
    return `Hace ${diffHours} horas`;
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
  const [savedJobIds, setSavedJobIds] = useState<Record<string, boolean>>({});
  const [hiddenJobIds, setHiddenJobIds] = useState<Record<string, boolean>>({});
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Computrabajo-style search inputs
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  // Dropdown filter states
  const [sortBy, setSortBy] = useState<"recientes" | "salario">("recientes");
  const [categoryFilter, setCategoryFilter] = useState<string>("todas");
  const [contractFilter, setContractFilter] = useState<string>("todos");
  const [experienceFilter, setExperienceFilter] = useState<string>("todos");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Read URL search params on mount
  useEffect(() => {
    const locParam = searchParams.get("location") || searchParams.get("city");
    if (locParam) setLocationFilter(locParam);

    const roleParam = searchParams.get("role") || searchParams.get("search");
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
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent("/vacantes")}`);
      return;
    }

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

  const handleToggleSave = (jobId: string) => {
    setSavedJobIds((prev) => {
      const nextState = !prev[jobId];
      setSuccessToast(nextState ? "Oferta guardada en tus favoritos" : "Oferta removida de tus favoritos");
      setTimeout(() => setSuccessToast(null), 3000);
      return { ...prev, [jobId]: nextState };
    });
  };

  const handleHideJob = (jobId: string) => {
    setHiddenJobIds((prev) => ({ ...prev, [jobId]: true }));
    setSuccessToast("Oferta ocultada de tus resultados");
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleShare = (job: JobPostWithCompany) => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      setSuccessToast("Enlace de la oferta copiado al portapapeles");
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  // Computrabajo-style filtering
  const filteredJobs = jobs
    .filter((j) => {
      if (hiddenJobIds[j.id]) return false;

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

      let matchesCategory = true;
      if (categoryFilter !== "todas") {
        const norm = normalizeSecurityRole(j.role_required);
        const titleL = j.title.toLowerCase();
        if (categoryFilter === "vigilante") {
          matchesCategory = norm === "vigilante_fijo" || titleL.includes("vigilante");
        } else if (categoryFilter === "escolta") {
          matchesCategory = norm.includes("escolta") || titleL.includes("escolta");
        } else if (categoryFilter === "cctv") {
          matchesCategory = norm.includes("medios") || titleL.includes("cctv") || titleL.includes("operador");
        } else if (categoryFilter === "supervisor") {
          matchesCategory = norm.includes("supervisor") || titleL.includes("supervisor");
        }
      }

      return matchesSearch && matchesLocation && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "salario") {
        return (b.salary_monthly || 0) - (a.salary_monthly || 0);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const selectedJob =
    jobs.find((j) => j.id === selectedJobId) || filteredJobs[0] || jobs[0];
  const selectedMatch = selectedJob
    ? calculateMatchScore(selectedJob, candidateProfile)
    : null;
  const isSelectedApplied = selectedJob ? !!appliedJobIds[selectedJob.id] : false;
  const isSelectedSaved = selectedJob ? !!savedJobIds[selectedJob.id] : false;

  return (
    <div className="min-h-screen bg-[#F2F5F8] text-[#313944] pb-16">
      {/* 1. CABECERA BLANCA CON PÍLDORA DE BÚSQUEDA INTEGRADA */}
      <div className="bg-white border-b border-[#E1E4E9] py-5 px-4 sm:px-6 lg:px-8 shadow-[0_1px_3px_rgba(11,59,112,0.04)]">
        <div className="max-w-7xl mx-auto space-y-4">
          <form
            onSubmit={(e) => e.preventDefault()}
            className="rounded-full border border-slate-300 bg-white shadow-xs p-1.5 flex flex-col md:flex-row items-center gap-2 max-w-4xl mx-auto transition-all focus-within:border-[#005DA4] focus-within:ring-2 focus-within:ring-[#005DA4]/10"
          >
            {/* Campo 1: Cargo o categoría */}
            <div className="flex-1 w-full px-4 py-1.5 flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-slate-400 shrink-0" strokeWidth={2} />
              <div className="w-full">
                <input
                  type="text"
                  placeholder="Cargo o categoría (Ej. Vigilante, Escolta, CCTV)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
                />
              </div>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="text-slate-400 hover:text-slate-600 p-1"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Divisor vertical */}
            <div className="hidden md:block w-px h-8 bg-slate-200" />

            {/* Campo 2: Ciudad / Lugar */}
            <div className="flex-1 w-full px-4 py-1.5 flex items-center gap-3 relative">
              <MapPin className="w-5 h-5 text-slate-400 shrink-0" strokeWidth={2} />
              <div className="w-full">
                <input
                  type="text"
                  placeholder="Lugar (Bogotá, Medellín, Cali)..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
                />
              </div>
              {locationFilter && (
                <button
                  type="button"
                  onClick={() => setLocationFilter("")}
                  className="text-slate-400 hover:text-slate-600 p-1"
                  aria-label="Limpiar lugar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Botón Circular Azul Marino a la derecha (#0B3B70) */}
            <button
              type="submit"
              className="w-10 h-10 rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white flex items-center justify-center shrink-0 shadow-xs transition-colors"
              title="Buscar empleos"
            >
              <Search className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </form>

          {/* FILA DE FILTROS TIPO PÍLDORA CON FLECHA (⌄) SOBRE FONDO BLANCO */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-5xl mx-auto scrollbar-none">
            {/* Filtro Ordenar */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === "sort" ? null : "sort")}
                className={`bg-white border rounded-full px-4 py-1.5 text-xs sm:text-sm flex items-center gap-1.5 shadow-2xs transition-all whitespace-nowrap ${
                  sortBy === "salario"
                    ? "border-[#005DA4] text-[#005DA4] font-bold bg-[#EAF3FA]"
                    : "border-slate-200 text-slate-700 hover:border-[#005DA4]"
                }`}
              >
                <span>Ordenar: {sortBy === "salario" ? "Mayor salario" : "Más recientes"}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {openDropdown === "sort" && (
                <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-30 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy("recientes");
                      setOpenDropdown(null);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-[#EAF3FA] hover:text-[#0B3B70]"
                  >
                    Más recientes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy("salario");
                      setOpenDropdown(null);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-[#EAF3FA] hover:text-[#0B3B70]"
                  >
                    Mayor salario
                  </button>
                </div>
              )}
            </div>

            {/* Filtro Categoría / Cargo */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === "cat" ? null : "cat")}
                className={`bg-white border rounded-full px-4 py-1.5 text-xs sm:text-sm flex items-center gap-1.5 shadow-2xs transition-all whitespace-nowrap ${
                  categoryFilter !== "todas"
                    ? "border-[#005DA4] text-[#005DA4] font-bold bg-[#EAF3FA]"
                    : "border-slate-200 text-slate-700 hover:border-[#005DA4]"
                }`}
              >
                <span>Categoría / Cargo</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {openDropdown === "cat" && (
                <div className="absolute left-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-30 space-y-1">
                  {[
                    { id: "todas", label: "Todas las categorías" },
                    { id: "vigilante", label: "Vigilante Fijo / Móvil" },
                    { id: "escolta", label: "Escolta Profesional" },
                    { id: "cctv", label: "Operador CCTV / Medios" },
                    { id: "supervisor", label: "Supervisor de Zona" },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setCategoryFilter(c.id);
                        setOpenDropdown(null);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-[#EAF3FA] hover:text-[#0B3B70]"
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filtro Lugar de trabajo */}
            <button
              type="button"
              onClick={() => {
                setLocationFilter(locationFilter ? "" : "Bogotá D.C.");
              }}
              className={`bg-white border rounded-full px-4 py-1.5 text-xs sm:text-sm flex items-center gap-1.5 shadow-2xs transition-all whitespace-nowrap ${
                locationFilter
                  ? "border-[#005DA4] text-[#005DA4] font-bold bg-[#EAF3FA]"
                  : "border-slate-200 text-slate-700 hover:border-[#005DA4]"
              }`}
            >
              <span>Lugar: {locationFilter || "Todo el país"}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {/* Píldoras adicionales Computrabajo style */}
            <span className="bg-white border border-slate-200 rounded-full px-4 py-1.5 text-xs sm:text-sm text-slate-700 flex items-center gap-1.5 shadow-2xs hover:border-[#005DA4] cursor-pointer whitespace-nowrap">
              <span>Experiencia</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </span>

            <span className="bg-white border border-slate-200 rounded-full px-4 py-1.5 text-xs sm:text-sm text-slate-700 flex items-center gap-1.5 shadow-2xs hover:border-[#005DA4] cursor-pointer whitespace-nowrap">
              <span>Salario</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </span>

            <span className="bg-white border border-slate-200 rounded-full px-4 py-1.5 text-xs sm:text-sm text-slate-700 flex items-center gap-1.5 shadow-2xs hover:border-[#005DA4] cursor-pointer whitespace-nowrap">
              <span>Jornada</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </span>

            <span className="bg-white border border-slate-200 rounded-full px-4 py-1.5 text-xs sm:text-sm text-slate-700 flex items-center gap-1.5 shadow-2xs hover:border-[#005DA4] cursor-pointer whitespace-nowrap">
              <span>Contrato</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </span>
          </div>
        </div>
      </div>

      {/* FEEDBACK TOAST */}
      {successToast && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="p-3.5 rounded-2xl bg-[#0B3B70] text-white text-xs font-semibold flex items-center justify-between shadow-lg border border-slate-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" strokeWidth={2} />
              <span>{successToast}</span>
            </div>
            <Link
              href="/guarda/postulaciones"
              className="text-[#FFE066] hover:underline font-bold"
            >
              Ver en Mis Postulaciones →
            </Link>
          </div>
        </div>
      )}

      {/* 2. LAYOUT MASTER-DETAIL DE 2 COLUMNAS (lg:grid-cols-12) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* COLUMNA IZQUIERDA: CONTADOR + LISTA DE OFERTAS (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-3">
            {/* CAJA SUPERIOR DE CONTEO ESTILO COMPUTRABAJO */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                {filteredJobs.length} Ofertas de empleo en {locationFilter || "Colombia"}
              </h2>
              <span className="text-xs text-slate-400 font-medium">Página 1 de 1</span>
            </div>

            {/* Listado de Ofertas */}
            {filteredJobs.length === 0 ? (
              <div className="p-10 text-center bg-white border border-slate-200 rounded-2xl space-y-3 shadow-2xs">
                <Briefcase className="w-10 h-10 text-slate-300 mx-auto" strokeWidth={1.5} />
                <h3 className="text-sm font-bold text-slate-800">
                  No se encontraron ofertas con estos filtros
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Prueba restableciendo los filtros o buscando por otra ciudad de Colombia.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setLocationFilter("");
                    setCategoryFilter("todas");
                  }}
                  className="rounded-full bg-[#0B3B70] text-white text-xs font-semibold px-4 py-2"
                >
                  Ver todas las ofertas
                </button>
              </div>
            ) : (
              filteredJobs.map((job) => {
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
                    className={`bg-white rounded-2xl p-5 relative cursor-pointer transition-all ${
                      isSelected
                        ? "border-[1.5px] border-[#005DA4] shadow-sm ring-1 ring-[#005DA4]/20"
                        : "border border-slate-200 hover:border-slate-300 shadow-2xs"
                    }`}
                  >
                    {/* Botón de tres puntos verticales arriba a la derecha */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSave(job.id);
                      }}
                      className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1"
                      title="Guardar o ver opciones"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Título en negrita */}
                    <h3 className="text-lg font-bold text-slate-900 leading-snug pr-6 hover:text-[#005DA4] transition-colors">
                      {job.title}
                    </h3>

                    {/* Fila Empresa + Calificación + Check azul de verificación */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium mt-1 flex-wrap">
                      <span className="text-amber-500 font-bold">4,8 ★</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#005DA4] shrink-0" strokeWidth={2.5} />
                      <span className="text-[#005DA4] font-semibold">{job.company_name}</span>
                    </div>

                    {/* Ciudad / Departamento */}
                    <div className="text-sm text-slate-600 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{job.city} {job.zone_neighborhood ? `• ${job.zone_neighborhood}` : ""}</span>
                    </div>

                    {/* Modalidad y Salario */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-slate-600 font-medium flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        Presencial - Puesto operativo
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-900 font-bold font-mono tabular-nums">
                        ${job.salary_monthly.toLocaleString("es-CO")} (Mensual)
                      </span>
                    </div>

                    {/* Pie de tarjeta: Hace X días a la izquierda + Píldora Vista a la derecha */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1 font-normal">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{relativeDate}</span>
                      </span>

                      {isApplied ? (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full px-3 py-0.5 text-xs font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" strokeWidth={3} />
                          Postulado
                        </span>
                      ) : (
                        <span className="border border-slate-300 rounded-full px-3 py-0.5 text-xs text-slate-500 font-medium">
                          Vista
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 3. COLUMNA DERECHA: PANEL DE DETALLE DE LA OFERTA SELECCIONADA (lg:col-span-7) */}
          {selectedJob ? (
            <div className="hidden lg:block lg:col-span-7 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
              <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-2xs space-y-6">
                
                {/* CABECERA DEL DETALLE ESTILO COMPUTRABAJO */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                      {selectedJob.title}
                    </h1>
                    <div className="text-sm font-semibold text-slate-700">
                      {selectedJob.city}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-600 pt-1 flex-wrap">
                      <span className="text-amber-500 font-bold">4,8 ★</span>
                      <span className="text-[#005DA4] font-semibold text-sm hover:underline cursor-pointer">
                        {selectedJob.company_name}
                      </span>
                      <span>•</span>
                      <span className="text-slate-500">
                        {selectedJob.zone_neighborhood || selectedJob.city}
                      </span>
                    </div>

                    {/* Sello azul de verificación */}
                    <div className="pt-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#005DA4] bg-[#EAF3FA] px-3 py-1 rounded-full border border-[#D5E6F5]">
                        <Shield className="w-3.5 h-3.5 text-[#005DA4]" strokeWidth={2} />
                        <span>Empresa verificada</span>
                      </span>
                    </div>
                  </div>

                  {/* Logo o insignia corporativa a la derecha superior */}
                  <div className="w-14 h-14 rounded-2xl bg-[#EAF3FA] border border-[#D5E6F5] text-[#0B3B70] flex items-center justify-center font-extrabold text-lg shrink-0 shadow-2xs">
                    {(selectedJob.company_name || "ES").slice(0, 2).toUpperCase()}
                  </div>
                </div>

                {/* BARRA DE ACCIÓN PRINCIPAL: BOTÓN APLICAR + 4 BOTONES CIRCULARES AZUL HIELO */}
                <div className="flex items-center gap-3 pt-2">
                  {/* Botón Aplicar */}
                  <button
                    type="button"
                    disabled={isSelectedApplied}
                    onClick={() => handleApply(selectedJob)}
                    className={`font-semibold rounded-full px-9 py-2.5 text-sm transition-all shadow-xs ${
                      isSelectedApplied
                        ? "bg-[#EAF3FA] text-[#0B3B70] border border-[#D5E6F5] cursor-default font-bold"
                        : "bg-[#0B3B70] hover:bg-[#082B54] text-white"
                    }`}
                  >
                    {isSelectedApplied ? "Ya estás postulado" : "Aplicar"}
                  </button>

                  {/* 4 Botones Circulares Azul Hielo (#EAF3FA) */}
                  <div className="flex items-center gap-2">
                    {/* Botón 1: Guardar */}
                    <button
                      type="button"
                      onClick={() => handleToggleSave(selectedJob.id)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-2xs ${
                        isSelectedSaved
                          ? "bg-rose-50 text-rose-600 border border-rose-200"
                          : "bg-[#EAF3FA] text-[#0B3B70] hover:bg-[#d8e8f6]"
                      }`}
                      title={isSelectedSaved ? "Quitar de guardados" : "Guardar oferta"}
                    >
                      <Heart className={`w-4 h-4 ${isSelectedSaved ? "fill-rose-600" : ""}`} strokeWidth={2} />
                    </button>

                    {/* Botón 2: Compartir */}
                    <button
                      type="button"
                      onClick={() => handleShare(selectedJob)}
                      className="w-10 h-10 rounded-full bg-[#EAF3FA] text-[#0B3B70] hover:bg-[#d8e8f6] flex items-center justify-center transition-colors shadow-2xs"
                      title="Compartir oferta"
                    >
                      <Share2 className="w-4 h-4" strokeWidth={2} />
                    </button>

                    {/* Botón 3: Ocultar */}
                    <button
                      type="button"
                      onClick={() => handleHideJob(selectedJob.id)}
                      className="w-10 h-10 rounded-full bg-[#EAF3FA] text-[#0B3B70] hover:bg-[#d8e8f6] flex items-center justify-center transition-colors shadow-2xs"
                      title="Ocultar oferta"
                    >
                      <EyeOff className="w-4 h-4" strokeWidth={2} />
                    </button>

                    {/* Botón 4: Más opciones */}
                    <button
                      type="button"
                      onClick={() => handleToggleSave(selectedJob.id)}
                      className="w-10 h-10 rounded-full bg-[#EAF3FA] text-[#0B3B70] hover:bg-[#d8e8f6] flex items-center justify-center transition-colors shadow-2xs"
                      title="Más opciones"
                    >
                      <MoreVertical className="w-4 h-4" strokeWidth={2} />
                    </button>
                  </div>
                </div>

                {/* Línea divisoria */}
                <div className="border-t border-slate-200 my-6" />

                {/* SECCIÓN RESUMEN CON ICONOS */}
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-slate-900">Resumen</h3>
                  <div className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900">Tipo de contrato: </span>
                        <span>Contrato a término fijo / Obra o labor con todas las prestaciones</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900">Jornada / Turno: </span>
                        <span className="font-mono tabular-nums">{selectedJob.shift || "Turno rotativo de ley"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900">Modalidad: </span>
                        <span>Presencial - Puesto operativo de seguridad privada</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900">Salario mensual: </span>
                        <span className="font-mono font-bold text-[#0B3B70] tabular-nums">
                          ${selectedJob.salary_monthly.toLocaleString("es-CO")} COP
                        </span>
                        {selectedJob.includes_surcharges && (
                          <span className="text-xs text-emerald-700 font-medium block">
                            + Recargos nocturnos, festivos y prestaciones de ley
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECCIÓN DESCRIPCIÓN DE LA OFERTA Y REQUERIMIENTOS */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h3 className="text-base font-bold text-slate-900">
                    Descripción de la oferta
                  </h3>
                  <p className="text-xs sm:text-sm text-[#4B5968] leading-relaxed whitespace-pre-line">
                    {selectedJob.description}
                  </p>
                </div>

                {/* Requisitos y Evaluación Técnica */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h3 className="text-base font-bold text-slate-900">
                    Requerimientos del puesto
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-[#F2F5F8] border border-slate-200/80 flex items-center justify-between">
                      <span className="text-slate-600">Curso de Seguridad:</span>
                      <strong className="text-slate-900 font-bold">Vigente SuperVigilancia</strong>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F2F5F8] border border-slate-200/80 flex items-center justify-between">
                      <span className="text-slate-600">Experiencia Mínima:</span>
                      <strong className="text-slate-900 font-bold">{selectedJob.min_experience_years || 1} año(s)</strong>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F2F5F8] border border-slate-200/80 flex items-center justify-between">
                      <span className="text-slate-600">Libreta Militar:</span>
                      <strong className="text-slate-900 font-bold">
                        {selectedJob.requires_military_booklet ? "Requerida" : "Opcional"}
                      </strong>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F2F5F8] border border-slate-200/80 flex items-center justify-between">
                      <span className="text-slate-600">Moto Propia:</span>
                      <strong className="text-slate-900 font-bold">
                        {selectedJob.requires_motorcycle ? `Sí (≥${selectedJob.min_motorcycle_cc || 150}cc)` : "No requerida"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Sede para entrevistas si aplica */}
                {selectedJob.interview_address && (
                  <div className="p-3.5 rounded-xl bg-[#EAF3FA] border border-[#D5E6F5] text-xs text-slate-700 flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#005DA4] shrink-0 mt-0.5" strokeWidth={2} />
                    <div>
                      <strong className="block text-[#0B3B70] font-bold">Sede para entrevistas presenciales:</strong>
                      <p className="text-slate-600 mt-0.5">{selectedJob.interview_address}</p>
                    </div>
                  </div>
                )}

                {/* Sello de Garantía Cero Cobros */}
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                  <span className="flex items-center gap-2 font-semibold">
                    <Shield className="w-4 h-4 text-emerald-600" strokeWidth={2} />
                    Garantía Cero Cobros: Ninguna empresa de seguridad puede cobrarte por exámenes ni vinculación.
                  </span>
                  <span className="text-[11px] text-emerald-700 font-bold">Ley 1581</span>
                </div>

                {/* Botón inferior Aplicar repetido */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isSelectedApplied}
                    onClick={() => handleApply(selectedJob)}
                    className={`w-full rounded-full py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                      isSelectedApplied
                        ? "bg-[#EAF3FA] text-[#0B3B70] border border-[#D5E6F5] cursor-default"
                        : "bg-[#0B3B70] hover:bg-[#082B54] text-white"
                    }`}
                  >
                    {isSelectedApplied ? "Ya estás postulado a esta vacante" : "Aplicar ahora a esta oferta"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden lg:flex lg:col-span-7 flex-col items-center justify-center p-12 bg-white border border-slate-200 rounded-2xl text-center text-slate-400 min-h-[360px]">
              <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-sm font-semibold text-slate-600">
                Selecciona una oferta de la lista para ver su detalle completo.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. MODAL / DRAWER EN MÓVIL CON BARRA FIJA (STICKY BOTTOM CTA) */}
      {mobileDetailOpen && selectedJob && (
        <div className="fixed inset-0 z-50 lg:hidden bg-slate-950/70 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-150">
          <div className="bg-white rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto space-y-4 pb-24">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-[#005DA4]">{selectedJob.company_name}</span>
              <button
                type="button"
                onClick={() => setMobileDetailOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
                aria-label="Cerrar detalle"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-snug">
              {selectedJob.title}
            </h3>

            <div className="p-3.5 bg-[#EAF3FA] text-[#0B3B70] rounded-2xl flex items-center justify-between border border-[#D5E6F5]">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Salario mensual</span>
                <div className="text-lg font-bold font-mono tabular-nums">
                  ${selectedJob.salary_monthly.toLocaleString("es-CO")} COP
                </div>
              </div>
              <span className="text-xs text-[#005DA4] font-mono font-bold tabular-nums">
                {selectedJob.shift}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{selectedJob.city} {selectedJob.zone_neighborhood ? `• ${selectedJob.zone_neighborhood}` : ""}</span>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Descripción de la oferta:
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {selectedJob.description}
              </p>
            </div>

            {selectedJob.interview_address && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <strong className="block text-slate-900">Sede para entrevistas:</strong>
                <p className="text-slate-600 mt-0.5">{selectedJob.interview_address}</p>
              </div>
            )}
          </div>

          {/* BARRA FIJA EN MÓVIL (STICKY BOTTOM CTA) */}
          <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 p-3 z-40 shadow-xl flex items-center justify-between gap-3">
            <div className="truncate">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block truncate">
                {selectedJob.company_name}
              </span>
              <span className="text-xs font-bold text-[#0B3B70] font-mono tabular-nums">
                ${selectedJob.salary_monthly.toLocaleString("es-CO")} COP
              </span>
            </div>

            <button
              type="button"
              disabled={isSelectedApplied}
              onClick={() => {
                handleApply(selectedJob);
                setMobileDetailOpen(false);
              }}
              className={`rounded-full px-6 py-2.5 text-xs font-bold transition-all shadow-md ${
                isSelectedApplied
                  ? "bg-[#EAF3FA] text-[#0B3B70] border border-[#D5E6F5]"
                  : "bg-[#0B3B70] text-white hover:bg-[#082B54]"
              }`}
            >
              {isSelectedApplied ? "Ya postulado" : "Aplicar"}
            </button>
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
        <div className="p-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-[#0B3B70] border-t-transparent rounded-full animate-spin" />
          <span>Cargando ofertas de seguridad...</span>
        </div>
      }
    >
      <VacantesContent />
    </Suspense>
  );
}
