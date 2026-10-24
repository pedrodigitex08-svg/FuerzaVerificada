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
} from "lucide-react";
import { ReliefToggle } from "@/components/guarda/ReliefToggle";
import { CityAutocompleteInput } from "@/components/ui/CityAutocompleteInput";
import { calculateMatchScore } from "@/lib/utils/matchCalculator";
import { JobPost, CourseSemaphore } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/useAuth";

export type JobPostWithCompany = JobPost & {
  company_name: string;
  is_verified_company: boolean;
};

const INITIAL_JOBS: JobPostWithCompany[] = [];

function VacantesContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { role, isAuthenticated } = useAuth();

  const [jobs, setJobs] = useState<JobPostWithCompany[]>(INITIAL_JOBS);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [appliedJobIds, setAppliedJobIds] = useState<Record<string, boolean>>({});
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [selectedShiftFilter, setSelectedShiftFilter] = useState("Todos");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("Todos");

  // Read URL search params on mount
  useEffect(() => {
    const locParam = searchParams.get("location");
    if (locParam) setLocationFilter(locParam);

    const roleParam = searchParams.get("role");
    if (roleParam) setSearchTerm(roleParam);

    const applyParam = searchParams.get("apply");
    if (applyParam) setSelectedJobId(applyParam);
  }, [searchParams]);

  // Load real vacancies from Supabase / localStorage
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
        }
      } catch {}

      // Fallback to local jobs created during session
      if (typeof window !== "undefined") {
        const local = localStorage.getItem("fv_company_jobs");
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setJobs(parsed);
              setSelectedJobId(parsed[0].id);
            }
          } catch {}
        }
      }
    }

    fetchRealJobs();
  }, [supabase]);

  // Candidate Profile State
  const [candidateProfile, setCandidateProfile] = useState({
    city: "Bogotá D.C.",
    primary_role: "Vigilante Fijo",
    years_experience: 3,
    has_military_booklet: true,
    has_own_motorcycle: true,
    motorcycle_cc: 150,
    available_immediately: true,
    course_semaphore: "VIGENTE" as CourseSemaphore,
    daysRemaining: 184,
  });

  // Mobile detail drawer toggle
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedProfile = localStorage.getItem("fv_candidate_profile");
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          setCandidateProfile((prev) => ({ ...prev, ...parsed }));
        } catch {}
      }

      const savedApps = localStorage.getItem("fv_applied_jobs");
      if (savedApps) {
        try {
          setAppliedJobIds(JSON.parse(savedApps));
        } catch {}
      }
    }

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
    // 1. Bloqueo de Acciones sin Sesión: Intercepta y redirige a /login
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent("/guarda/vacantes")}`);
      return;
    }

    // 2. Exclusividad para Rol Candidato / Personal Operativo
    if (role === "company") {
      alert(
        "Tu cuenta actual es de Empresa de Seguridad. Las postulaciones a vacantes son exclusivas para el Personal Operativo."
      );
      return;
    }

    const match = calculateMatchScore(job, candidateProfile);

    const updated = { ...appliedJobIds, [job.id]: true };
    setAppliedJobIds(updated);

    if (typeof window !== "undefined") {
      localStorage.setItem("fv_applied_jobs", JSON.stringify(updated));

      const existingAppsStr = localStorage.getItem("fv_applications_list") || "[]";
      try {
        const apps = JSON.parse(existingAppsStr);
        apps.unshift({
          id: `app-${Date.now()}`,
          job_id: job.id,
          job_title: job.title,
          company_name: job.company_name,
          shift: job.shift,
          salary_monthly: job.salary_monthly,
          interview_address: job.interview_address,
          match_score: match.score,
          status: "postulado",
          created_at: new Date().toISOString(),
        });
        localStorage.setItem("fv_applications_list", JSON.stringify(apps));
      } catch {}
    }

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

    setSuccessToast(`Postulación completada para: ${job.title}`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (j.zone_neighborhood || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLocation =
      !locationFilter.trim() ||
      j.city.toLowerCase().includes(locationFilter.toLowerCase().trim()) ||
      (j.zone_neighborhood || "").toLowerCase().includes(locationFilter.toLowerCase().trim());

    const matchesRole =
      selectedRoleFilter === "Todos" || j.role_required === selectedRoleFilter;

    const matchesShift =
      selectedShiftFilter === "Todos" || j.shift.includes(selectedShiftFilter);

    return matchesSearch && matchesLocation && matchesRole && matchesShift;
  });

  const selectedJob =
    jobs.find((j) => j.id === selectedJobId) || filteredJobs[0] || jobs[0];
  const selectedMatch = selectedJob
    ? calculateMatchScore(selectedJob, candidateProfile)
    : null;
  const isSelectedApplied = selectedJob ? !!appliedJobIds[selectedJob.id] : false;

  return (
    <div className="space-y-6">
      {/* 1. TOP EXECUTIVE CONTROL BAR (BENTO GRID - 3 CARDS) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {role === "company" ? (
          <>
            {/* Empresa Card 1: ATS & Vacantes */}
            <div className="md:col-span-4 bg-white border border-slate-200/80 rounded-xl p-4 shadow-subtle flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Panel ATS Corporativo
                </span>
                <span className="badge-emerald text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  Cuenta B2B
                </span>
              </div>

              <div className="py-2 space-y-1">
                <span className="text-base font-bold text-slate-900 block">
                  Gestión de Candidatos & Vacantes
                </span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Publica nuevas ofertas o revisa hojas de vida postuladas en tiempo real.
                </p>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                <Link
                  href="/empresa/vacantes/nueva"
                  className="text-xs text-[#0F172A] hover:text-[#1E3A8A] font-bold flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Publicar Vacante</span>
                </Link>
                <Link
                  href="/empresa/vacantes"
                  className="text-[#1E3A8A] hover:underline font-semibold text-[11px]"
                >
                  Ir al ATS →
                </Link>
              </div>
            </div>

            {/* Empresa Card 2: Radar de Relevos */}
            <div className="md:col-span-4 bg-white border border-slate-200/80 rounded-xl p-4 shadow-subtle flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Radar de Personal Operativo
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <Zap className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                  Relevos Urgentes
                </span>
              </div>

              <div className="py-2 space-y-1">
                <span className="text-base font-bold text-slate-900 block">
                  Personal con Credencial Vigente
                </span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Encuentra guardas y escoltas verificados disponibles para contratación inmediata.
                </p>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                <span className="text-emerald-600 font-medium">Validación SuperVigilancia</span>
                <Link
                  href="/empresa/relevos"
                  className="text-amber-600 hover:text-amber-700 font-semibold text-[11px]"
                >
                  Ver Radar →
                </Link>
              </div>
            </div>

            {/* Empresa Card 3: Estudios & Poligrafía */}
            <div className="md:col-span-4 bg-white border border-slate-200/80 rounded-xl p-4 shadow-subtle flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Blindaje & Confiabilidad
                </span>
                <span className="text-xs font-semibold text-slate-600 tabular-nums">
                  Dictamen 24-48h
                </span>
              </div>

              <div className="py-2 space-y-1">
                <span className="text-base font-bold text-slate-900 block">
                  Poligrafía & Visita Domiciliaria
                </span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Estudios de seguridad integrales con informe pericial auditado bajo Ley 1581.
                </p>
              </div>

              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href="/precios-empresas"
                  className="text-xs text-[#64748B] hover:text-[#0F172A] font-semibold"
                >
                  Ver Planes B2B
                </Link>
                <Link
                  href="/empresa/estudios"
                  className="text-[#10B981] hover:text-[#059669] font-bold text-[11px]"
                >
                  Solicitar Estudios →
                </Link>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Candidate Card 1: SuperVigilancia Credential Status (4 cols) */}
            <div className="md:col-span-4 bg-white border border-slate-200/80 rounded-xl p-4 shadow-subtle flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Credencial SuperVigilancia
                </span>
                <span className="badge-emerald text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Vigente
                </span>
              </div>

              <div className="py-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-bold text-slate-900 tabular-nums">
                    {candidateProfile.daysRemaining || 184} días
                  </span>
                  <span className="text-xs text-slate-400 font-medium">de 365 días</span>
                </div>
                {/* Fine hairline progress bar */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(((candidateProfile.daysRemaining || 184) / 365) * 100)
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                <span>Apto para contratación</span>
                <Link
                  href="/guarda/documentos"
                  className="text-amber-600 hover:text-amber-700 font-semibold text-[11px]"
                >
                  Ver Credencial →
                </Link>
              </div>
            </div>

            {/* Candidate Card 2: Relief Availability Toggle (4 cols) */}
            <div className="md:col-span-4">
              <ReliefToggle
                initialValue={candidateProfile.available_immediately}
                onToggle={(val) => {
                  setCandidateProfile((prev) => ({ ...prev, available_immediately: val }));
                  if (typeof window !== "undefined") {
                    const p = { ...candidateProfile, available_immediately: val };
                    localStorage.setItem("fv_candidate_profile", JSON.stringify(p));
                  }
                }}
              />
            </div>

            {/* Candidate Card 3: Quick Metrics & Filters (4 cols) */}
            <div className="md:col-span-4 bg-white border border-slate-200/80 rounded-xl p-4 shadow-subtle flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Filtro Rápido de Turno
                </span>
                <span className="text-xs font-semibold text-slate-600 tabular-nums">
                  {filteredJobs.length} vacantes
                </span>
              </div>

              <div className="flex gap-1.5 pt-2">
                {["Todos", "2x2x2", "4x2", "6x1"].map((shift) => (
                  <button
                    key={shift}
                    type="button"
                    onClick={() => setSelectedShiftFilter(shift)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                      selectedShiftFilter === shift
                        ? "bg-slate-900 text-white border-slate-900 shadow-subtle"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {shift}
                  </button>
                ))}
              </div>

              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
                <span>Sede: {candidateProfile.city}</span>
                <span className="text-emerald-600 font-medium">Garantía Cero Cobros</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* FEEDBACK TOAST */}
      {successToast && (
        <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center justify-between shadow-elevated border border-slate-700 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" strokeWidth={2} />
            <span>{successToast}</span>
          </div>
          <Link
            href="/guarda/postulaciones"
            className="text-amber-400 hover:underline font-semibold"
          >
            Ver en Mis Postulaciones →
          </Link>
        </div>
      )}

      {/* 2. SEARCH BAR, PREDICTIVE LOCATION & ROLE CHIPS */}
      <div className="space-y-2.5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
          {/* Input 1: Cargo o Empresa */}
          <div className="relative md:col-span-7">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" strokeWidth={1.75} />
            <input
              type="text"
              placeholder="Buscar por cargo, empresa o función..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200/90 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 shadow-subtle min-h-[44px]"
            />
          </div>

          {/* Input 2: Ubicación con Autocompletado Predictivo */}
          <div className="relative md:col-span-5 bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-subtle flex items-center min-h-[44px]">
            <CityAutocompleteInput
              value={locationFilter}
              onChange={setLocationFilter}
              placeholder="Filtrar por ciudad (Bogotá, Medellín...)"
            />
          </div>
        </div>

        {/* Quick Role & Location Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Especialidad:
            </span>
            {["Todos", "Vigilante Fijo", "Supervisor Motorizado", "Escolta VIP", "Operador Medios Tecnológicos"].map(
              (role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRoleFilter(role)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all ${
                    selectedRoleFilter === role
                      ? "bg-[#0F172A] text-white border-[#0F172A] shadow-sm"
                      : "bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F8FAFC]"
                  }`}
                >
                  {role}
                </button>
              )
            )}
          </div>

          {locationFilter && (
            <button
              type="button"
              onClick={() => setLocationFilter("")}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
            >
              <MapPin className="w-3 h-3 text-slate-500" strokeWidth={2} />
              <span>Ciudad: {locationFilter}</span>
              <X className="w-3 h-3 text-slate-400 hover:text-rose-600" strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* 3. MASTER-DETAIL 2-COLUMN DESKTOP WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: COMPACT VACANCY CARDS LIST (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {filteredJobs.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-xl space-y-2">
              <Briefcase className="w-8 h-8 text-slate-400 mx-auto" strokeWidth={1.5} />
              <p className="text-xs text-slate-600 font-medium">
                No se encontraron vacantes con los filtros seleccionados.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedRoleFilter("Todos");
                  setSelectedShiftFilter("Todos");
                }}
                className="text-xs text-amber-600 font-semibold hover:underline"
              >
                Restablecer filtros
              </button>
            </div>
          ) : (
            filteredJobs.map((job) => {
              const match = calculateMatchScore(job, candidateProfile);
              const isSelected = selectedJob?.id === job.id;
              const isApplied = !!appliedJobIds[job.id];

              return (
                <div
                  key={job.id}
                  onClick={() => {
                    setSelectedJobId(job.id);
                    setMobileDetailOpen(true);
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? "bg-white border-slate-900 ring-1 ring-slate-900 shadow-card"
                      : "bg-white border-slate-200/80 hover:border-slate-300 shadow-subtle"
                  }`}
                >
                  {/* Urgent indicator */}
                  {job.is_urgent_relief && (
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-600 mb-1.5">
                      <Zap className="w-3 h-3 fill-amber-500" strokeWidth={1.5} />
                      <span>Relevo Urgente • Prioridad Operativa</span>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-500 font-medium">
                          {job.company_name}
                        </span>
                        {job.is_verified_company && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#065F46] bg-[#ECFDF5] px-1.5 py-0.5 rounded border border-[#10B981]/30">
                            <Shield className="w-2.5 h-2.5 text-[#10B981]" strokeWidth={1.5} />
                            Empresa Verificada
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-[#1E293B] leading-snug mt-0.5">
                        {job.title}
                      </h3>
                    </div>

                    {/* Match Score */}
                    <div className="shrink-0 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold font-mono tabular-nums ${
                          match.score >= 80
                            ? "bg-[#ECFDF5] text-[#065F46] border border-[#10B981]/30"
                            : "bg-[#F3F4F6] text-[#1E293B] border border-[#E2E8F0]"
                        }`}
                      >
                        {match.score}% Compatible
                      </span>
                    </div>
                  </div>

                  {/* Financial & Shift metrics */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900 font-mono tabular-nums">
                      ${job.salary_monthly.toLocaleString("es-CO")}{" "}
                      <span className="text-[10px] text-slate-400 font-normal">COP</span>
                    </span>
                    <span className="text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60 font-mono text-[11px]">
                      {job.shift}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" strokeWidth={1.75} />
                      {job.zone_neighborhood}
                    </span>
                    {isApplied && (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" strokeWidth={2.5} />
                        Postulado
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT COLUMN: RICH DETAIL VIEW (7 cols - Sticky on Desktop) */}
        {selectedJob ? (
          <div className="hidden lg:block lg:col-span-7 sticky top-24">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-card space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">
                      {selectedJob.company_name}
                    </span>
                    {selectedJob.is_verified_company && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/80">
                        <Shield className="w-3 h-3 fill-amber-500/20" strokeWidth={1.75} />
                        Empresa Verificada SuperVigilancia
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
                    {selectedJob.title}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                      {selectedJob.city} • {selectedJob.zone_neighborhood}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                      Turno {selectedJob.shift}
                    </span>
                  </div>
                </div>

                {/* Match Score Display */}
                {selectedMatch && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center shrink-0">
                    <div className="text-xl font-extrabold text-slate-900 font-mono tabular-nums leading-none">
                      {selectedMatch.score}%
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-1 block">
                      Compatibilidad
                    </span>
                  </div>
                )}
              </div>

              {/* Salary Hero Box */}
              <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block">
                    Salario Mensual Certificado
                  </span>
                  <div className="text-2xl font-black font-mono tabular-nums text-white mt-0.5">
                    ${selectedJob.salary_monthly.toLocaleString("es-CO")}{" "}
                    <span className="text-xs font-normal text-slate-400">COP</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-medium">
                    + Recargos nocturnos, dominicales y prestaciones de ley
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Modalidad</span>
                  <span className="text-xs font-bold text-amber-400 font-mono">
                    {selectedJob.shift}
                  </span>
                </div>
              </div>

              {/* Requirement Checklist Evaluation */}
              {selectedMatch && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Evaluación de Requisitos en Tu Perfil:
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg border border-slate-200/80 bg-slate-50 flex items-center justify-between">
                      <span className="text-slate-600">Cargo ({selectedJob.role_required}):</span>
                      {selectedMatch.breakdown.roleMatch ? (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> Coincide
                        </span>
                      ) : (
                        <span className="text-amber-600 font-semibold">Difiere</span>
                      )}
                    </div>

                    <div className="p-2.5 rounded-lg border border-slate-200/80 bg-slate-50 flex items-center justify-between">
                      <span className="text-slate-600">Credencial Curso:</span>
                      {selectedMatch.breakdown.courseValid ? (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> Vigente
                        </span>
                      ) : (
                        <span className="text-rose-600 font-semibold">Vencido</span>
                      )}
                    </div>

                    <div className="p-2.5 rounded-lg border border-slate-200/80 bg-slate-50 flex items-center justify-between">
                      <span className="text-slate-600">Ciudad de Residencia:</span>
                      {selectedMatch.breakdown.cityMatch ? (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> Sede Local
                        </span>
                      ) : (
                        <span className="text-rose-600 font-semibold">Otra ciudad</span>
                      )}
                    </div>

                    <div className="p-2.5 rounded-lg border border-slate-200/80 bg-slate-50 flex items-center justify-between">
                      <span className="text-slate-600">Libreta Militar:</span>
                      {candidateProfile.has_military_booklet ? (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> Al día
                        </span>
                      ) : (
                        <span className="text-slate-400">No registrada</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Descripción Operativa del Puesto:
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  {selectedJob.description}
                </p>
              </div>

              {/* Interview Address info */}
              {selectedJob.interview_address && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" strokeWidth={1.75} />
                  <div>
                    <span className="font-semibold text-slate-800">Sede de Citación / Entrevista:</span>
                    <p className="text-slate-500 mt-0.5">{selectedJob.interview_address}</p>
                  </div>
                </div>
              )}

              {/* Institutional guarantee banner */}
              <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/80 flex items-center justify-between text-xs text-amber-900">
                <span className="flex items-center gap-1.5 font-medium">
                  <Shield className="w-4 h-4 text-amber-600" strokeWidth={1.75} />
                  Garantía Cero Cobros: Proceso 100% Gratuito y Auditado
                </span>
                <span className="text-[11px] text-amber-700 font-semibold">Ley 1581</span>
              </div>

              {/* Application Action Button */}
              <div className="pt-2">
                {role === "company" ? (
                  <div className="space-y-2.5">
                    <Link
                      href="/empresa/vacantes/nueva"
                      className="w-full bg-[#0F172A] hover:bg-[#1E3A8A] text-white rounded-xl py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <PlusCircle className="w-4 h-4 text-[#10B981]" />
                      <span>Publicar Vacante Similar para tu Empresa</span>
                    </Link>
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-[11px] text-[#64748B]">
                      Estás en modo Empresa. Las postulaciones de empleo son exclusivas para candidatos.
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isSelectedApplied}
                    onClick={() => handleApply(selectedJob)}
                    className={`btn-primary w-full py-3.5 text-xs font-semibold ${
                      isSelectedApplied ? "bg-slate-100 text-emerald-700 border border-emerald-300 hover:bg-slate-100" : ""
                    }`}
                  >
                    {isSelectedApplied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" strokeWidth={2} />
                        Ya estás postulado
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-white text-white" strokeWidth={1.5} />
                        Postularme en 1 Clic con mi Hoja de Vida
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex lg:col-span-7 flex-col items-center justify-center p-12 bg-white border border-slate-200/90 rounded-2xl shadow-subtle text-center text-slate-400 space-y-2 min-h-[360px]">
            <Briefcase className="w-8 h-8 text-slate-300 mx-auto" strokeWidth={1.5} />
            <p className="text-xs text-slate-500 font-medium">
              No hay vacantes activas para previsualizar en este momento.
            </p>
          </div>
        )}
      </div>

      {/* MOBILE DETAIL MODAL / DRAWER (only active when clicked on mobile) */}
      {mobileDetailOpen && selectedJob && (
        <div className="fixed inset-0 z-50 lg:hidden bg-slate-950/70 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-white rounded-t-2xl p-6 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-500">{selectedJob.company_name}</span>
              <button
                type="button"
                onClick={() => setMobileDetailOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-lg font-bold text-slate-900">{selectedJob.title}</h3>

            <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400">Salario mensual</span>
                <div className="text-lg font-bold font-mono">
                  ${selectedJob.salary_monthly.toLocaleString("es-CO")} COP
                </div>
              </div>
              <span className="text-xs text-amber-400 font-mono font-bold">{selectedJob.shift}</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              {selectedJob.description}
            </p>

            {role === "company" ? (
              <div className="space-y-2">
                <Link
                  href="/empresa/vacantes/nueva"
                  onClick={() => setMobileDetailOpen(false)}
                  className="w-full bg-[#0F172A] hover:bg-[#1E3A8A] text-white rounded-xl py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all text-center"
                >
                  <PlusCircle className="w-4 h-4 text-[#10B981]" />
                  <span>Publicar Vacante para tu Empresa</span>
                </Link>
                <p className="text-[11px] text-center text-slate-500">
                  Modo Empresa • Postulaciones exclusivas para candidatos
                </p>
              </div>
            ) : (
              <button
                type="button"
                disabled={isSelectedApplied}
                onClick={() => {
                  handleApply(selectedJob);
                  setMobileDetailOpen(false);
                }}
                className="btn-primary w-full py-3 text-xs"
              >
                {isSelectedApplied ? "Ya estás postulado" : "Postularme en 1 Clic"}
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
