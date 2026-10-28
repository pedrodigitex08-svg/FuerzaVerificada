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
  BadgeCheck,
  Banknote,
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

function normalizeFilterStr(str?: string | null): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
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

  // Dropdown filter states (Computrabajo style)
  const [sortBy, setSortBy] = useState<"recientes" | "salario">("recientes");
  const [dateFilter, setDateFilter] = useState<string>("todas");
  const [categoryFilter, setCategoryFilter] = useState<string>("todas");
  const [experienceFilter, setExperienceFilter] = useState<string>("todos");
  const [salaryFilter, setSalaryFilter] = useState<string>("todos");
  const [shiftFilter, setShiftFilter] = useState<string>("todos");
  const [contractFilter, setContractFilter] = useState<string>("todos");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest(".filter-dropdown-container")) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Read URL search params on mount & on searchParams change
  useEffect(() => {
    const locParam =
      searchParams.get("ciudad") ||
      searchParams.get("location") ||
      searchParams.get("city") ||
      "";
    setLocationFilter(locParam);

    const roleParam =
      searchParams.get("q") ||
      searchParams.get("search") ||
      searchParams.get("role") ||
      "";
    setSearchTerm(roleParam);

    const applyParam = searchParams.get("apply");
    if (applyParam) setSelectedJobId(applyParam);
  }, [searchParams]);

  // Load real vacancies from Supabase
  useEffect(() => {
    async function fetchRealJobs() {
      try {
        // 1. SELECT primario sobre public.job_posts filtrando estrictamente por is_active = true
        let { data, error } = await supabase
          .from("job_posts")
          .select("*, companies(company_name, is_verified_company)")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        // Respaldo resiliente: si el JOIN con companies falla en PostgREST (ej. sin relación en cache),
        // hacer SELECT plano directo sobre job_posts para asegurar que NUNCA se descarten las vacantes
        if (error || !data) {
          const direct = await supabase
            .from("job_posts")
            .select("*")
            .eq("is_active", true)
            .order("created_at", { ascending: false });

          if (!direct.error && direct.data) {
            data = direct.data;
            error = null;
          }
        }

        // Respaldo de compatibilidad histórica si la tabla de vacantes es 'jobs'
        if (error || !data || data.length === 0) {
          const fallback = await supabase
            .from("jobs")
            .select("*, companies(company_name, is_verified_company)")
            .eq("is_active", true)
            .order("created_at", { ascending: false });

          if (!fallback.error && fallback.data && fallback.data.length > 0) {
            data = fallback.data;
            error = null;
          } else {
            const fallbackDirect = await supabase
              .from("jobs")
              .select("*")
              .eq("is_active", true)
              .order("created_at", { ascending: false });
            if (!fallbackDirect.error && fallbackDirect.data) {
              data = fallbackDirect.data;
              error = null;
            }
          }
        }

        if (!error && data && data.length > 0) {
          // Resolver nombres de empresa de forma segura si no vinieron por join relacional
          const missingCompanyIds = Array.from(
            new Set(
              data
                .filter((j: any) => !j.companies?.company_name && j.company_id)
                .map((j: any) => j.company_id)
            )
          );

          let companyMap: Record<string, { company_name: string; is_verified_company: boolean }> = {};
          if (missingCompanyIds.length > 0) {
            try {
              const { data: compData } = await supabase
                .from("companies")
                .select("id, company_name, is_verified_company")
                .in("id", missingCompanyIds);

              if (compData) {
                compData.forEach((c: any) => {
                  companyMap[c.id] = {
                    company_name: c.company_name,
                    is_verified_company: c.is_verified_company ?? true,
                  };
                });
              }
            } catch {}
          }

          const mapped: JobPostWithCompany[] = data.map((j: any) => ({
            ...j,
            company_name:
              j.companies?.company_name ||
              companyMap[j.company_id]?.company_name ||
              "Empresa de Seguridad",
            is_verified_company:
              j.companies?.is_verified_company ??
              companyMap[j.company_id]?.is_verified_company ??
              true,
          }));

          setJobs(mapped);
          if (mapped.length > 0) {
            setSelectedJobId((prev) => prev || mapped[0].id);
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

      const q = normalizeFilterStr(searchTerm);
      const matchesSearch =
        !q ||
        normalizeFilterStr(j.title).includes(q) ||
        normalizeFilterStr(j.company_name).includes(q) ||
        normalizeFilterStr(j.role_required).includes(q) ||
        normalizeFilterStr(j.zone_neighborhood).includes(q) ||
        normalizeFilterStr(j.description).includes(q);

      const loc = normalizeFilterStr(locationFilter);
      const matchesLocation =
        !loc ||
        loc === "todo el pais" ||
        loc === "todas" ||
        normalizeFilterStr(j.city).includes(loc) ||
        normalizeFilterStr(j.zone_neighborhood).includes(loc);

      let matchesCategory = true;
      if (categoryFilter !== "todas") {
        const norm = normalizeSecurityRole(j.role_required);
        const titleL = normalizeFilterStr(j.title);
        if (categoryFilter === "vigilante") {
          matchesCategory = norm.includes("vigilante") || titleL.includes("vigilante") || titleL.includes("guarda");
        } else if (categoryFilter === "escolta") {
          matchesCategory = norm.includes("escolta") || titleL.includes("escolta");
        } else if (categoryFilter === "cctv") {
          matchesCategory = norm.includes("medios") || titleL.includes("cctv") || titleL.includes("operador") || titleL.includes("camaras");
        } else if (categoryFilter === "supervisor") {
          matchesCategory = norm.includes("supervisor") || titleL.includes("supervisor");
        }
      }

      let matchesDate = true;
      if (dateFilter !== "todas" && j.created_at) {
        const createdMs = new Date(j.created_at).getTime();
        const diffHours = (Date.now() - createdMs) / (1000 * 60 * 60);
        if (dateFilter === "hoy") matchesDate = diffHours <= 24;
        else if (dateFilter === "3dias") matchesDate = diffHours <= 72;
        else if (dateFilter === "semana") matchesDate = diffHours <= 168;
      }

      let matchesExp = true;
      if (experienceFilter !== "todos") {
        const exp = j.min_experience_years || 0;
        if (experienceFilter === "0") matchesExp = exp === 0;
        else if (experienceFilter === "1") matchesExp = exp <= 1;
        else if (experienceFilter === "2") matchesExp = exp >= 2;
      }

      let matchesSalary = true;
      if (salaryFilter !== "todos") {
        const sal = j.salary_monthly || 0;
        if (salaryFilter === "1600") matchesSalary = sal >= 1600000;
        else if (salaryFilter === "2000") matchesSalary = sal >= 2000000;
        else if (salaryFilter === "2500") matchesSalary = sal >= 2500000;
      }

      let matchesShift = true;
      if (shiftFilter !== "todos") {
        const s = normalizeFilterStr(j.shift);
        matchesShift = s.includes(normalizeFilterStr(shiftFilter));
      }

      let matchesContract = true;
      if (contractFilter !== "todos") {
        const desc = normalizeFilterStr(j.description);
        matchesContract = desc.includes(normalizeFilterStr(contractFilter));
      }

      return (
        matchesSearch &&
        matchesLocation &&
        matchesCategory &&
        matchesDate &&
        matchesExp &&
        matchesSalary &&
        matchesShift &&
        matchesContract
      );
    })
    .sort((a, b) => {
      if (sortBy === "salario") {
        return (b.salary_monthly || 0) - (a.salary_monthly || 0);
      }
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      return timeB - timeA;
    });

  const selectedJob =
    jobs.find((j) => j.id === selectedJobId) || filteredJobs[0] || jobs[0];
  const selectedMatch = selectedJob
    ? calculateMatchScore(selectedJob, candidateProfile)
    : null;
  const isSelectedApplied = selectedJob ? !!appliedJobIds[selectedJob.id] : false;
  const isSelectedSaved = selectedJob ? !!savedJobIds[selectedJob.id] : false;

  const hasActiveFilters = Boolean(
    searchTerm ||
    locationFilter ||
    categoryFilter !== "todas" ||
    dateFilter !== "todas" ||
    experienceFilter !== "todos" ||
    salaryFilter !== "todos" ||
    shiftFilter !== "todos" ||
    contractFilter !== "todos" ||
    sortBy !== "recientes"
  );

  const resetAllFilters = () => {
    setSearchTerm("");
    setLocationFilter("");
    setCategoryFilter("todas");
    setDateFilter("todas");
    setExperienceFilter("todos");
    setSalaryFilter("todos");
    setShiftFilter("todos");
    setContractFilter("todos");
    setSortBy("recientes");
    setOpenDropdown(null);
    router.push("/guarda/vacantes");
  };

  return (
    <div className="min-h-screen bg-[#F2F5F8] text-[#313944] pb-16">
      {/* 1. FILA SUPERIOR DE FILTROS DESPLEGABLES CON FLECHA (⌄) SOBRE FONDO #F2F5F8 */}
      <div className="w-full bg-[#F2F5F8] border-b border-slate-200/80 sticky top-0 md:top-[68px] z-20 backdrop-blur-md bg-[#F2F5F8]/95 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-2.5">
          {/* Barra de búsqueda móvil (visible en pantallas móviles < md donde NavbarSearchPill no está activa) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const p = new URLSearchParams();
              if (searchTerm.trim()) {
                p.set("q", searchTerm.trim());
                p.set("search", searchTerm.trim());
              }
              if (locationFilter.trim()) {
                p.set("ciudad", locationFilter.trim());
                p.set("location", locationFilter.trim());
              }
              const qs = p.toString();
              router.push(qs ? `/guarda/vacantes?${qs}` : "/guarda/vacantes");
            }}
            className="md:hidden flex items-center gap-1.5 bg-white border border-slate-300 rounded-full p-1 shadow-2xs"
          >
            <div className="flex items-center flex-1 min-w-0 px-2">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cargo (ej. Vigilante)"
                className="w-full bg-transparent border-none text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none px-1.5"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="text-slate-400 p-0.5 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <span className="h-4 w-px bg-slate-200 shrink-0" />
            <div className="flex items-center flex-1 min-w-0 px-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                placeholder="Lugar o Ciudad"
                className="w-full bg-transparent border-none text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none px-1.5"
              />
              {locationFilter && (
                <button
                  type="button"
                  onClick={() => setLocationFilter("")}
                  className="text-slate-400 p-0.5 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="w-7 h-7 rounded-full bg-[#0B3B70] text-white flex items-center justify-center shrink-0 shadow-xs cursor-pointer hover:bg-[#082B54]"
              title="Buscar empleos"
            >
              <Search className="w-3 h-3" strokeWidth={2.5} />
            </button>
          </form>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
            {/* 1. Filtro Ordenar */}
            <div className="relative filter-dropdown-container shrink-0">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === "sort" ? null : "sort")}
                className={`border rounded-full px-4 py-1.5 text-xs sm:text-sm flex items-center gap-1.5 shadow-2xs transition-all whitespace-nowrap cursor-pointer ${
                  sortBy === "salario"
                    ? "border-[#005DA4] text-[#005DA4] font-bold bg-[#EAF3FA]"
                    : "border-slate-200/90 text-slate-700 bg-white hover:border-[#005DA4]"
                }`}
              >
                <span>{sortBy === "salario" ? "Mayor salario" : "Más recientes"}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {openDropdown === "sort" && (
                <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-30 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy("recientes");
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors ${
                      sortBy === "recientes"
                        ? "bg-[#EAF3FA] text-[#0B3B70] font-bold"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    Más recientes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy("salario");
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors ${
                      sortBy === "salario"
                        ? "bg-[#EAF3FA] text-[#0B3B70] font-bold"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    Mayor salario
                  </button>
                </div>
              )}
            </div>

            {/* 2. Filtro Fecha */}
            <div className="relative filter-dropdown-container shrink-0">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === "date" ? null : "date")}
                className={`border rounded-full px-4 py-1.5 text-xs sm:text-sm flex items-center gap-1.5 shadow-2xs transition-all whitespace-nowrap cursor-pointer ${
                  dateFilter !== "todas"
                    ? "border-[#005DA4] text-[#005DA4] font-bold bg-[#EAF3FA]"
                    : "border-slate-200/90 text-slate-700 bg-white hover:border-[#005DA4]"
                }`}
              >
                <span>
                  {dateFilter === "hoy"
                    ? "Fecha: Hoy"
                    : dateFilter === "3dias"
                    ? "Fecha: Últimos 3 días"
                    : dateFilter === "semana"
                    ? "Fecha: Última semana"
                    : "Fecha"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {openDropdown === "date" && (
                <div className="absolute left-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-30 space-y-1">
                  {[
                    { id: "todas", label: "Cualquier fecha" },
                    { id: "hoy", label: "Publicadas hoy (24h)" },
                    { id: "3dias", label: "Últimos 3 días" },
                    { id: "semana", label: "Última semana" },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        setDateFilter(d.id);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        dateFilter === d.id
                          ? "bg-[#EAF3FA] text-[#0B3B70] font-bold"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Filtro Categoría / Cargo */}
            <div className="relative filter-dropdown-container shrink-0">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === "cat" ? null : "cat")}
                className={`border rounded-full px-4 py-1.5 text-xs sm:text-sm flex items-center gap-1.5 shadow-2xs transition-all whitespace-nowrap cursor-pointer ${
                  categoryFilter !== "todas"
                    ? "border-[#005DA4] text-[#005DA4] font-bold bg-[#EAF3FA]"
                    : "border-slate-200/90 text-slate-700 bg-white hover:border-[#005DA4]"
                }`}
              >
                <span>
                  {categoryFilter === "vigilante"
                    ? "Vigilante"
                    : categoryFilter === "escolta"
                    ? "Escolta"
                    : categoryFilter === "cctv"
                    ? "CCTV / Medios"
                    : categoryFilter === "supervisor"
                    ? "Supervisor"
                    : "Categoría / Cargo"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {openDropdown === "cat" && (
                <div className="absolute left-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-30 space-y-1">
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
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        categoryFilter === c.id
                          ? "bg-[#EAF3FA] text-[#0B3B70] font-bold"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Filtro Lugar de trabajo */}
            <div className="relative filter-dropdown-container shrink-0">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === "loc" ? null : "loc")}
                className={`border rounded-full px-4 py-1.5 text-xs sm:text-sm flex items-center gap-1.5 shadow-2xs transition-all whitespace-nowrap cursor-pointer ${
                  locationFilter && locationFilter !== "Todo el país"
                    ? "border-[#005DA4] text-[#005DA4] font-bold bg-[#EAF3FA]"
                    : "border-slate-200/90 text-slate-700 bg-white hover:border-[#005DA4]"
                }`}
              >
                <span>{locationFilter || "Lugar de trabajo"}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {openDropdown === "loc" && (
                <div className="absolute left-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-30 space-y-1">
                  {[
                    { id: "", label: "Todo el país (Colombia)" },
                    { id: "Bogotá", label: "Bogotá D.C." },
                    { id: "Medellín", label: "Medellín (Antioquia)" },
                    { id: "Cali", label: "Cali (Valle del Cauca)" },
                    { id: "Barranquilla", label: "Barranquilla (Atlántico)" },
                    { id: "Bucaramanga", label: "Bucaramanga (Santander)" },
                  ].map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => {
                        setLocationFilter(l.id);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        locationFilter === l.id || (!locationFilter && !l.id)
                          ? "bg-[#EAF3FA] text-[#0B3B70] font-bold"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Filtro Experiencia */}
            <div className="relative filter-dropdown-container shrink-0">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === "exp" ? null : "exp")}
                className={`border rounded-full px-4 py-1.5 text-xs sm:text-sm flex items-center gap-1.5 shadow-2xs transition-all whitespace-nowrap cursor-pointer ${
                  experienceFilter !== "todos"
                    ? "border-[#005DA4] text-[#005DA4] font-bold bg-[#EAF3FA]"
                    : "border-slate-200/90 text-slate-700 bg-white hover:border-[#005DA4]"
                }`}
              >
                <span>
                  {experienceFilter === "0"
                    ? "Sin experiencia"
                    : experienceFilter === "1"
                    ? "Hasta 1 año"
                    : experienceFilter === "2"
                    ? "2+ años"
                    : "Experiencia"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {openDropdown === "exp" && (
                <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-30 space-y-1">
                  {[
                    { id: "todos", label: "Cualquier experiencia" },
                    { id: "0", label: "Sin experiencia" },
                    { id: "1", label: "Hasta 1 año" },
                    { id: "2", label: "2 años o más" },
                  ].map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => {
                        setExperienceFilter(e.id);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        experienceFilter === e.id
                          ? "bg-[#EAF3FA] text-[#0B3B70] font-bold"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 6. Filtro Salario */}
            <div className="relative filter-dropdown-container shrink-0">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === "sal" ? null : "sal")}
                className={`border rounded-full px-4 py-1.5 text-xs sm:text-sm flex items-center gap-1.5 shadow-2xs transition-all whitespace-nowrap cursor-pointer ${
                  salaryFilter !== "todos"
                    ? "border-[#005DA4] text-[#005DA4] font-bold bg-[#EAF3FA]"
                    : "border-slate-200/90 text-slate-700 bg-white hover:border-[#005DA4]"
                }`}
              >
                <span>
                  {salaryFilter === "1600"
                    ? "Desde $1.6M"
                    : salaryFilter === "2000"
                    ? "Desde $2.0M"
                    : salaryFilter === "2500"
                    ? "Desde $2.5M"
                    : "Salario"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {openDropdown === "sal" && (
                <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-30 space-y-1">
                  {[
                    { id: "todos", label: "Cualquier salario" },
                    { id: "1600", label: "Desde $1.600.000" },
                    { id: "2000", label: "Desde $2.000.000" },
                    { id: "2500", label: "Desde $2.500.000" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSalaryFilter(s.id);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        salaryFilter === s.id
                          ? "bg-[#EAF3FA] text-[#0B3B70] font-bold"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 7. Filtro Jornada / Turno */}
            <div className="relative filter-dropdown-container shrink-0">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === "shift" ? null : "shift")}
                className={`border rounded-full px-4 py-1.5 text-xs sm:text-sm flex items-center gap-1.5 shadow-2xs transition-all whitespace-nowrap cursor-pointer ${
                  shiftFilter !== "todos"
                    ? "border-[#005DA4] text-[#005DA4] font-bold bg-[#EAF3FA]"
                    : "border-slate-200/90 text-slate-700 bg-white hover:border-[#005DA4]"
                }`}
              >
                <span>
                  {shiftFilter !== "todos" ? `Turno: ${shiftFilter}` : "Jornada / Turno"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {openDropdown === "shift" && (
                <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-30 space-y-1">
                  {[
                    { id: "todos", label: "Todos los turnos" },
                    { id: "2x2x2", label: "Turno 2x2x2" },
                    { id: "4x4x2", label: "Turno 4x4x2" },
                    { id: "diurno", label: "Turno Diurno" },
                    { id: "nocturno", label: "Turno Nocturno" },
                  ].map((sh) => (
                    <button
                      key={sh.id}
                      type="button"
                      onClick={() => {
                        setShiftFilter(sh.id);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        shiftFilter === sh.id
                          ? "bg-[#EAF3FA] text-[#0B3B70] font-bold"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      {sh.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 8. Filtro Contrato */}
            <div className="relative filter-dropdown-container shrink-0">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === "contract" ? null : "contract")}
                className={`border rounded-full px-4 py-1.5 text-xs sm:text-sm flex items-center gap-1.5 shadow-2xs transition-all whitespace-nowrap cursor-pointer ${
                  contractFilter !== "todos"
                    ? "border-[#005DA4] text-[#005DA4] font-bold bg-[#EAF3FA]"
                    : "border-slate-200/90 text-slate-700 bg-white hover:border-[#005DA4]"
                }`}
              >
                <span>
                  {contractFilter !== "todos" ? `Contrato: ${contractFilter}` : "Contrato"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {openDropdown === "contract" && (
                <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-30 space-y-1">
                  {[
                    { id: "todos", label: "Todos los contratos" },
                    { id: "fijo", label: "Término fijo" },
                    { id: "indefinido", label: "Término indefinido" },
                    { id: "obra", label: "Obra o labor" },
                  ].map((ct) => (
                    <button
                      key={ct.id}
                      type="button"
                      onClick={() => {
                        setContractFilter(ct.id);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        contractFilter === ct.id
                          ? "bg-[#EAF3FA] text-[#0B3B70] font-bold"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      {ct.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Botón Limpiar filtros cuando hay alguno activo */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-full px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1 shadow-2xs whitespace-nowrap transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                <span>Limpiar filtros</span>
              </button>
            )}
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
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium mt-1.5 flex-wrap">
                      <span className="text-amber-500 font-bold">4,8 ★</span>
                      <BadgeCheck className="w-4 h-4 text-[#005DA4] shrink-0" strokeWidth={2.5} />
                      <span className="text-[#005DA4] font-semibold">{job.company_name}</span>
                    </div>

                    {/* Ciudad / Departamento */}
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{job.city} {job.zone_neighborhood ? `• ${job.zone_neighborhood}` : ""}</span>
                    </div>

                    {/* Modalidad y Salario */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-slate-600 font-medium flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        Presencial · Turno operativo
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
                        <BadgeCheck className="w-4 h-4 text-[#005DA4]" strokeWidth={2.5} />
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
                      <Heart className={`w-4 h-4 ${isSelectedSaved ? "fill-rose-600 text-rose-600" : ""}`} strokeWidth={2} />
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
                        <Banknote className="w-4 h-4 text-slate-600" />
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
