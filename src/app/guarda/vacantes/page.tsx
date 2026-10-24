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
} from "lucide-react";
import { ReliefToggle } from "@/components/guarda/ReliefToggle";
import { CityAutocompleteInput } from "@/components/ui/CityAutocompleteInput";
import { calculateMatchScore } from "@/lib/utils/matchCalculator";
import { JobPost, CourseSemaphore } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/useAuth";

const INITIAL_JOBS: (JobPost & { company_name: string; is_verified_company: boolean })[] = [
  {
    id: "job-1",
    company_id: "comp-1",
    company_name: "Seguridad Andina Ltda.",
    is_verified_company: true,
    title: "Vigilante Fijo - Centro Empresarial Calle 100",
    role_required: "Vigilante Fijo",
    city: "Bogotá D.C.",
    zone_neighborhood: "Chicó / Calle 100",
    shift: "2x2x2 (2 Día, 2 Noche, 2 Descanso)",
    salary_monthly: 1950000,
    includes_surcharges: true,
    requires_active_course: true,
    requires_motorcycle: false,
    min_motorcycle_cc: null,
    requires_military_booklet: true,
    min_experience_years: 1,
    is_strict_filter: false,
    is_urgent_relief: true,
    description:
      "Requerimos vigilante con excelente presentación para control de accesos peatonales y recepción corporativa. Indispensable curso de vigilancia al día y situación militar definida.",
    interview_address: "Cra 15 # 98-42, Oficina 301, Bogotá",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "job-2",
    company_id: "comp-2",
    company_name: "G4S Colombia Seguridad",
    is_verified_company: true,
    title: "Supervisor Motorizado - Zona Industrial",
    role_required: "Supervisor Motorizado",
    city: "Bogotá D.C.",
    zone_neighborhood: "Fontibón / Álamos",
    shift: "4x2 Rotativo",
    salary_monthly: 2450000,
    includes_surcharges: true,
    requires_active_course: true,
    requires_motorcycle: true,
    min_motorcycle_cc: 150,
    requires_military_booklet: true,
    min_experience_years: 2,
    is_strict_filter: true,
    is_urgent_relief: false,
    description:
      "Rondas perimetrales y supervisión de 8 puestos fijos industriales. Se requiere motocicleta propia modelo 2021 en adelante con cilindraje mínimo de 150cc y documentación al día.",
    interview_address: "Calle 26 # 69D-91, Torre B, Fontibón",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "job-3",
    company_id: "comp-3",
    company_name: "Vigilancia San Jorge",
    is_verified_company: false,
    title: "Escolta VIP para Esquema Ejecutivo",
    role_required: "Escolta VIP",
    city: "Bogotá D.C.",
    zone_neighborhood: "Usaquén / Rosales",
    shift: "6x1 Diurno",
    salary_monthly: 3200000,
    includes_surcharges: true,
    requires_active_course: true,
    requires_motorcycle: false,
    min_motorcycle_cc: null,
    requires_military_booklet: true,
    min_experience_years: 3,
    is_strict_filter: false,
    is_urgent_relief: true,
    description:
      "Protección a directivo corporativo y acompañamiento en desplazamientos urbanos. Se evalúa porte de armas, manejo defensivo y aprobación de poligrafía preempleo.",
    interview_address: "Av. Carrera 7 # 127-48, Bogotá",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "job-4",
    company_id: "comp-4",
    company_name: "Seguridad Omega",
    is_verified_company: true,
    title: "Operador de Medios Tecnológicos (CCTV)",
    role_required: "Operador Medios Tecnológicos",
    city: "Bogotá D.C.",
    zone_neighborhood: "Salitre / Teusaquillo",
    shift: "2x2x2",
    salary_monthly: 2100000,
    includes_surcharges: true,
    requires_active_course: true,
    requires_motorcycle: false,
    min_motorcycle_cc: null,
    requires_military_booklet: false,
    min_experience_years: 1,
    is_strict_filter: false,
    is_urgent_relief: false,
    description:
      "Monitoreo de cámaras de seguridad y alarmas en central operativa. Manejo de sistemas Milestone y reporte de novedades en tiempo real.",
    interview_address: "Av. El Dorado # 68C-61, Bogotá",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "job-5",
    company_id: "comp-5",
    company_name: "Seguridad Antioquia Ltda.",
    is_verified_company: true,
    title: "Vigilante Fijo - Sector Comercial El Poblado",
    role_required: "Vigilante Fijo",
    city: "Medellín",
    zone_neighborhood: "El Poblado / Provenza",
    shift: "2x2x2",
    salary_monthly: 2150000,
    includes_surcharges: true,
    requires_active_course: true,
    requires_motorcycle: false,
    min_motorcycle_cc: null,
    requires_military_booklet: false,
    min_experience_years: 1,
    is_strict_filter: false,
    is_urgent_relief: true,
    description:
      "Control de accesos y vigilancia perimetral en centro empresarial y comercial. Contratación inmediata con prestaciones de ley y recargos.",
    interview_address: "Cra. 43A # 1-50, Medellín",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "job-6",
    company_id: "comp-6",
    company_name: "Vigilancia del Valle S.A.",
    is_verified_company: true,
    title: "Supervisor Motorizado - Corredor Industrial",
    role_required: "Supervisor Motorizado",
    city: "Cali",
    zone_neighborhood: "Yumbo / Acopi",
    shift: "4x2",
    salary_monthly: 2650000,
    includes_surcharges: true,
    requires_active_course: true,
    requires_motorcycle: true,
    min_motorcycle_cc: 150,
    requires_military_booklet: true,
    min_experience_years: 2,
    is_strict_filter: false,
    is_urgent_relief: false,
    description:
      "Ronda y supervisión de puestos de vigilancia en zona industrial. Indispensable moto propia con papeles al día (SOAT y Tecnomecánica).",
    interview_address: "Calle 15 Norte # 6N-34, Cali",
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

function VacantesContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { role, isAuthenticated } = useAuth();

  const [jobs, setJobs] = useState(INITIAL_JOBS);
  const [selectedJobId, setSelectedJobId] = useState<string>("job-1");
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
  }, []);

  const handleApply = async (job: (typeof INITIAL_JOBS)[0]) => {
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
        {/* Card 1: SuperVigilancia Credential Status (4 cols) */}
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

        {/* Card 2: Relief Availability Toggle (4 cols) */}
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

        {/* Card 3: Quick Metrics & Filters (4 cols) */}
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
        {selectedJob && (
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
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500 font-medium">
                    Postulaciones inhabilitadas para cuentas de Empresa de Seguridad.
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
                        Ya te has postulado a esta vacante
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
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500 font-medium">
                Inhabilitado para cuentas de Empresa
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
                {isSelectedApplied ? "Ya postulado" : "Postularme en 1 Clic"}
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
