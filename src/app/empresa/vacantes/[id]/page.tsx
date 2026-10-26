"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Shield,
  FileText,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  Search,
  Filter,
  MapPin,
  Clock,
  Sparkles,
  Download,
  Calendar,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Users,
  Check,
  Bike,
  User,
  Phone,
  Briefcase,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { ResumeDrawerModal } from "@/components/empresa/ResumeDrawerModal";
import { OrderSecurityStudyModal } from "@/components/empresa/OrderSecurityStudyModal";
import { ApplicationStatus, SecurityRoleType } from "@/types/database";
import { generateInterviewCitationLink } from "@/lib/utils/whatsappTemplates";
import { createClient } from "@/lib/supabase/client";
import { formatSecurityRoleLabel } from "@/lib/utils/roleNormalizer";

interface ATSCandidate {
  id: string;
  candidate_user_id?: string;
  full_name: string;
  national_id: string;
  phone_whatsapp: string;
  city: string;
  locality?: string;
  primary_role: SecurityRoleType | string;
  years_experience: number;
  has_military_booklet: boolean;
  has_own_motorcycle: boolean;
  motorcycle_cc?: number | null;
  available_immediately: boolean;
  resume_pdf_url: string;
  course_semaphore: "VIGENTE" | "PROXIMO_A_VENCER" | "VENCIDO";
  course_name?: string;
  course_date?: string;
  days_remaining: number;
  match_score: number;
  status: ApplicationStatus | string;
  applied_at?: string;
  work_history?: { company: string; role: string; dates: string }[];
}

type FunnelTabKey =
  | "todos"
  | "nuevos"
  | "revision"
  | "proceso"
  | "contratados"
  | "descartados";

function getCandidateCategory(status: string): FunnelTabKey {
  const st = (status || "").toLowerCase().trim();
  if (["contratado", "hired", "accepted"].includes(st)) return "contratados";
  if (["descartado", "rejected", "finalizado"].includes(st)) return "descartados";
  if (
    [
      "citado_entrevista",
      "en_estudio_seguridad",
      "interview",
      "in_process",
      "pruebas",
      "estudio",
    ].includes(st)
  )
    return "proceso";
  if (
    ["preseleccionado", "viewed", "reviewing", "en_revision", "leido"].includes(st)
  )
    return "revision";
  return "nuevos";
}

function formatRelativeDate(isoDate?: string): string {
  if (!isoDate) return "Recientemente";
  const date = new Date(isoDate);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return date.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

export default function ATSVacantePage() {
  const params = useParams();
  const vacancyId = params?.id as string;

  const [candidates, setCandidates] = useState<ATSCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<ATSCandidate | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("Empresa de Seguridad");
  const [vacancyTitle, setVacancyTitle] = useState<string>("Vacante de Seguridad");
  const [vacancyShift, setVacancyShift] = useState<string>("Turno rotativo");
  const [vacancyCity, setVacancyCity] = useState<string>("Bogotá D.C.");
  const [vacancyAddress, setVacancyAddress] = useState<string>("Colombia");
  const [selectedCandidateForDrawer, setSelectedCandidateForDrawer] = useState<ATSCandidate | null>(null);
  const [selectedCandidateForStudy, setSelectedCandidateForStudy] = useState<ATSCandidate | null>(null);
  const [credits, setCredits] = useState(0);
  const [activeTab, setActiveTab] = useState<FunnelTabKey>("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [notificationToast, setNotificationToast] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCredits = localStorage.getItem("fv_company_credits");
      if (savedCredits !== null) setCredits(parseInt(savedCredits, 10) || 0);
    }

    async function loadVacancyAndCandidates() {
      setIsLoading(true);
      const supabase = createClient();

      // 0. Cargar Empresa y Créditos
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: comp } = await supabase
            .from("companies")
            .select("id, company_name, credits_security_studies")
            .eq("owner_id", user.id)
            .maybeSingle();
          if (comp) {
            setCompanyId(comp.id);
            if (comp.company_name) setCompanyName(comp.company_name);
            setCredits(Number(comp.credits_security_studies ?? 0));
          }
        }
      } catch {}

      // 1. Cargar Detalles de la Vacante
      let loadedCity = "Bogotá D.C.";
      try {
        const { data: jobData } = await supabase
          .from("job_posts")
          .select("*")
          .eq("id", vacancyId)
          .maybeSingle();

        if (jobData) {
          setVacancyTitle(jobData.title);
          setVacancyShift(jobData.shift || "Turno rotativo");
          if (jobData.city) {
            loadedCity = jobData.city;
            setVacancyCity(jobData.city);
          }
          setVacancyAddress(jobData.zone_neighborhood || jobData.city || "Colombia");
        }
      } catch (err) {
        console.error("Error fetching job details:", err);
      }

      // 2. Cargar Candidatos postulados y Cursos reales
      try {
        const { data: appsData, error: appsError } = await supabase
          .from("applications")
          .select("*, profiles(*), candidate_profiles(*)")
          .eq("job_id", vacancyId)
          .order("created_at", { ascending: false });

        if (!appsError && appsData && appsData.length > 0) {
          // Extraer IDs para consultar cursos en candidate_courses
          const candidateUserIds = appsData
            .map((a: any) => a.candidate_id)
            .filter(Boolean);

          let coursesByCandidate: Record<string, any> = {};
          if (candidateUserIds.length > 0) {
            try {
              const { data: coursesData } = await supabase
                .from("candidate_courses")
                .select("*")
                .in("candidate_id", candidateUserIds)
                .order("completion_date", { ascending: false });

              if (coursesData) {
                coursesData.forEach((c: any) => {
                  if (!coursesByCandidate[c.candidate_id]) {
                    coursesByCandidate[c.candidate_id] = c;
                  }
                });
              }
            } catch (cErr) {
              console.warn("Aviso al consultar cursos:", cErr);
            }
          }

          const loaded: ATSCandidate[] = appsData.map((a: any) => {
            const prof = a.profiles || {};
            const candProf = a.candidate_profiles || {};
            const courseObj = coursesByCandidate[a.candidate_id];

            let course_semaphore: "VIGENTE" | "PROXIMO_A_VENCER" | "VENCIDO" = "VIGENTE";
            let days_remaining = 180;
            let course_name = "Vigilancia Básica";
            let course_date = "";

            if (courseObj?.completion_date) {
              course_date = courseObj.completion_date;
              course_name = courseObj.course_name || "Curso de Seguridad";
              const compDate = new Date(courseObj.completion_date);
              const expDate = new Date(compDate.getTime() + 365 * 24 * 60 * 60 * 1000);
              const diff = Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              days_remaining = diff;
              if (diff <= 0) {
                course_semaphore = "VENCIDO";
              } else if (diff <= 45) {
                course_semaphore = "PROXIMO_A_VENCER";
              } else {
                course_semaphore = "VIGENTE";
              }
            }

            return {
              id: a.id,
              candidate_user_id: a.candidate_id,
              full_name: prof.full_name || "Aspirante Verificado",
              national_id: candProf.national_id || "En verificación",
              phone_whatsapp: prof.phone_whatsapp || "573000000000",
              city: candProf.city || "Bogotá D.C.",
              locality: candProf.locality_neighborhood || candProf.locality || "",
              primary_role: formatSecurityRoleLabel(candProf.primary_role || "vigilante_fijo"),
              years_experience: candProf.years_experience || 0,
              has_military_booklet: !!candProf.has_military_booklet,
              has_own_motorcycle: !!candProf.has_own_motorcycle,
              motorcycle_cc: candProf.motorcycle_cc || null,
              available_immediately: !!candProf.available_immediately,
              resume_pdf_url: candProf.resume_pdf_url || "",
              course_semaphore,
              course_name,
              course_date,
              days_remaining,
              match_score: a.match_score ?? a.compatibility_score ?? 85,
              status: a.status || "postulado",
              applied_at: a.created_at,
            };
          });

          setCandidates(loaded);
          if (loaded.length > 0) {
            setSelectedCandidate(loaded[0]);
          }
        } else {
          setCandidates([]);
        }
      } catch (err) {
        console.error("Error fetching applications:", err);
        setCandidates([]);
      } finally {
        setIsLoading(false);
      }
    }

    if (vacancyId) {
      loadVacancyAndCandidates();
    }
  }, [vacancyId]);

  // Cambiar estado en memoria y persistir en Supabase
  const handleStatusChange = async (candId: string, newStatus: ApplicationStatus | string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === candId ? { ...c, status: newStatus } : c))
    );

    if (selectedCandidate?.id === candId) {
      setSelectedCandidate((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      const supabase = createClient();
      await supabase
        .from("applications")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", candId);
    } catch (err) {
      console.error("Error updating application status in Supabase:", err);
    }
  };

  // AUTOMATIZACIÓN DE "CV VISTO": Al seleccionar un candidato nuevo, pasa automáticamente a 'preseleccionado'
  const handleSelectCandidate = (cand: ATSCandidate) => {
    setSelectedCandidate(cand);
    const rawStatus = (cand.status || "").toLowerCase().trim();
    if (["postulado", "pending", "applied"].includes(rawStatus)) {
      handleStatusChange(cand.id, "preseleccionado");
    }
  };

  // Abrir Hoja de Vida PDF directamente
  const handleOpenResumePdf = (cand: ATSCandidate) => {
    const rawStatus = (cand.status || "").toLowerCase().trim();
    if (["postulado", "pending", "applied"].includes(rawStatus)) {
      handleStatusChange(cand.id, "preseleccionado");
    }
    if (cand.resume_pdf_url) {
      window.open(cand.resume_pdf_url, "_blank");
    } else {
      setSelectedCandidateForDrawer(cand);
    }
  };

  // Solicitar orden de estudio y polígrafo (Deducción atómica de 1 crédito)
  const handleConfirmStudyOrder = async () => {
    if (!selectedCandidateForStudy || credits <= 0) return;

    let updatedCredits = credits - 1;
    setCredits(updatedCredits);

    try {
      const supabase = createClient();
      if (companyId && selectedCandidateForStudy.candidate_user_id) {
        const { data: rpcResult, error: rpcError } = await supabase.rpc(
          "request_security_study_order",
          {
            p_company_id: companyId,
            p_candidate_id: selectedCandidateForStudy.candidate_user_id,
            p_application_id: selectedCandidateForStudy.id,
            p_study_type: "combo_integral_poligrafo_visita",
          }
        );

        if (!rpcError && rpcResult && typeof rpcResult.remaining_credits === "number") {
          updatedCredits = rpcResult.remaining_credits;
          setCredits(updatedCredits);
        } else {
          await supabase
            .from("companies")
            .update({ credits_security_studies: updatedCredits })
            .eq("id", companyId);

          await supabase.from("security_study_orders").insert({
            company_id: companyId,
            candidate_id: selectedCandidateForStudy.candidate_user_id,
            application_id: selectedCandidateForStudy.id,
            study_type: "combo_integral_poligrafo_visita",
            status: "solicitado",
            scheduled_date: "Programando visita domiciliaria...",
            final_concept: "En verificación de antecedentes y prueba de poligrafía",
            report_pdf_url: null,
          });
        }
      } else if (companyId) {
        await supabase
          .from("companies")
          .update({ credits_security_studies: updatedCredits })
          .eq("id", companyId);
      }
    } catch {}

    if (typeof window !== "undefined") {
      localStorage.setItem("fv_company_credits", updatedCredits.toString());
    }

    handleStatusChange(selectedCandidateForStudy.id, "en_estudio_seguridad");

    setNotificationToast(
      `¡Orden de estudio y poligrafía radicada para ${selectedCandidateForStudy.full_name}! Se descontó 1 crédito de tu cuenta.`
    );
    setTimeout(() => setNotificationToast(null), 4000);
  };

  // Contadores dinámicos del embudo SherlockHR
  const counts = {
    todos: candidates.length,
    nuevos: candidates.filter((c) => getCandidateCategory(c.status) === "nuevos").length,
    revision: candidates.filter((c) => getCandidateCategory(c.status) === "revision").length,
    proceso: candidates.filter((c) => getCandidateCategory(c.status) === "proceso").length,
    contratados: candidates.filter((c) => getCandidateCategory(c.status) === "contratados").length,
    descartados: candidates.filter((c) => getCandidateCategory(c.status) === "descartados").length,
  };

  // Filtrado instantáneo en memoria
  const filteredCandidates = candidates
    .filter((c) => {
      const matchSearch =
        c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.national_id.includes(searchTerm) ||
        c.primary_role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.city.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;
      if (activeTab === "todos") return true;
      return getCandidateCategory(c.status) === activeTab;
    })
    .sort((a, b) => b.match_score - a.match_score);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Vacancy Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/empresa/vacantes" className="hover:text-slate-900 flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              Mis Vacantes
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-medium">Bandeja ATS SherlockHR</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            {vacancyTitle}
          </h1>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
            <span>
              Turno: <strong className="text-slate-700 font-mono tabular-nums">{vacancyShift}</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-500">
              <MapPin className="w-3.5 h-3.5" />
              {vacancyAddress}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-slate-900 text-white flex items-center gap-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.08)]">
            <Shield className="w-4 h-4 text-emerald-400" strokeWidth={1.75} />
            <div className="text-xs">
              <span className="text-[10px] text-slate-400 block uppercase leading-none">
                Créditos Poligrafía
              </span>
              <strong className="text-emerald-400 font-mono text-sm tabular-nums">
                {credits} disponibles
              </strong>
            </div>
          </div>
        </div>
      </div>

      {notificationToast && (
        <div className="p-3.5 rounded-md bg-slate-900 text-white text-xs font-medium flex items-center gap-2 shadow-[0_2px_6px_rgba(15,23,42,0.08)] border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" strokeWidth={2} />
          <span>{notificationToast}</span>
        </div>
      )}

      {/* 1. BARRA DE PESTAÑAS DE EMBUDO (SHERLOCK HR FUNNEL TABS) CON CONTADORES EN VIVO */}
      <div className="bg-white border border-slate-200/90 rounded-lg p-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {[
            { key: "todos" as FunnelTabKey, label: "Todos", count: counts.todos },
            { key: "nuevos" as FunnelTabKey, label: "Nuevos / Sin Revisar", count: counts.nuevos },
            { key: "revision" as FunnelTabKey, label: "En Revisión / CV Visto", count: counts.revision },
            { key: "proceso" as FunnelTabKey, label: "En Proceso / Entrevista", count: counts.proceso },
            { key: "contratados" as FunnelTabKey, label: "Contratados", count: counts.contratados },
            { key: "descartados" as FunnelTabKey, label: "Descartados", count: counts.descartados },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`h-9 px-3 rounded-md text-xs font-medium transition-all inline-flex items-center gap-2 ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] font-mono tabular-nums px-1.5 py-0.2 rounded-md ${
                    isActive
                      ? "bg-slate-800 text-emerald-400"
                      : "bg-slate-100 text-slate-600 border border-slate-200/70"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" strokeWidth={1.75} />
        <input
          type="text"
          placeholder="Buscar candidato por nombre, cédula o cargo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-10 bg-white border border-slate-200/90 rounded-md pl-10 pr-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors"
        />
      </div>

      {/* 2. VISOR DE RECLUTAMIENTO EN PANTALLA DIVIDIDA (MASTER-DETAIL) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMNA IZQUIERDA: LISTA DE CANDIDATOS (5 COLS) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Candidatos ({filteredCandidates.length})
            </span>
            <span className="text-[11px]">Ordenado por Compatibilidad %</span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center bg-white border border-slate-200/90 rounded-lg space-y-3 shadow-subtle">
              <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Cargando candidatos calificados...</p>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200/90 rounded-lg space-y-2 shadow-subtle">
              <Users className="w-8 h-8 text-slate-300 mx-auto" strokeWidth={1.5} />
              <h4 className="text-xs font-semibold text-slate-800">No hay candidatos en esta etapa</h4>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                {searchTerm
                  ? "Intenta con otro término de búsqueda o limpia el filtro."
                  : "Los candidatos que se postulen aparecerán automáticamente en esta bandeja."}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredCandidates.map((cand) => {
                const isSelected = selectedCandidate?.id === cand.id;
                const isCityMatch =
                  cand.city.toLowerCase().trim() === vacancyCity.toLowerCase().trim() ||
                  !vacancyCity;

                return (
                  <div
                    key={cand.id}
                    onClick={() => handleSelectCandidate(cand)}
                    className={`p-4 rounded-lg border text-left cursor-pointer transition-all ${
                      isSelected
                        ? "bg-slate-50/80 border-slate-900 ring-1 ring-slate-900 shadow-sm"
                        : "bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs"
                    }`}
                  >
                    {/* Header Row: Name & Match */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900 tracking-tight">
                            {cand.full_name}
                          </h4>
                          {cand.status === "postulado" && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Nuevo candidato" />
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                          C.C. {cand.national_id} • {cand.years_experience} años exp.
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold font-mono tabular-nums ${
                            cand.match_score >= 85
                              ? "bg-emerald-50/80 text-emerald-800 border border-emerald-200/70"
                              : "bg-amber-50/80 text-amber-800 border border-amber-200/70"
                          }`}
                        >
                          {cand.match_score}% Match
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {formatRelativeDate(cand.applied_at)}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs font-medium text-slate-700 mt-1">
                      {cand.primary_role}
                    </div>

                    {/* SEMÁFORO DE COMPATIBILIDAD (KILLER CHECKS EN 2 SEGUNDOS) */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100">
                      {/* Check 1: Curso */}
                      {cand.course_semaphore === "VIGENTE" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded-md tabular-nums">
                          <Check className="w-2.5 h-2.5" strokeWidth={3} />
                          Curso Vigente ({cand.days_remaining}d)
                        </span>
                      ) : cand.course_semaphore === "PROXIMO_A_VENCER" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md tabular-nums">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Por Vencer ({cand.days_remaining}d)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-md">
                          <XCircle className="w-2.5 h-2.5" />
                          Curso Vencido
                        </span>
                      )}

                      {/* Check 2: Hoja de Vida PDF */}
                      {cand.resume_pdf_url ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded-md">
                          <Check className="w-2.5 h-2.5" strokeWidth={3} />
                          CV PDF Adjunto
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">
                          Sin CV PDF
                        </span>
                      )}

                      {/* Check 3: Ciudad Coincidente */}
                      {isCityMatch ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded-md">
                          <Check className="w-2.5 h-2.5" strokeWidth={3} />
                          Ciudad Sede
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">
                          📍 {cand.city}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: EXPEDIENTE Y ACCIONES 1 CLIC (7 COLS - STICKY) */}
        <div className="lg:col-span-7 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto space-y-4">
          {selectedCandidate ? (
            <div className="bg-white border border-slate-200/90 rounded-lg p-6 shadow-subtle space-y-5">
              {/* Expediente Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-200/80">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-md bg-slate-900 border border-slate-800 text-white flex items-center justify-center font-bold text-base shrink-0">
                    {selectedCandidate.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 tracking-tight">
                        {selectedCandidate.full_name}
                      </h3>
                      <span className="badge-emerald text-[10px] py-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Auditado
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 font-medium mt-0.5">
                      {selectedCandidate.primary_role} • {selectedCandidate.years_experience} años de experiencia
                    </div>
                    <div className="text-xs text-slate-500 font-mono tabular-nums mt-0.5 flex items-center gap-2">
                      <span>C.C. {selectedCandidate.national_id}</span>
                      <span>•</span>
                      <span>{selectedCandidate.city} {selectedCandidate.locality ? `(${selectedCandidate.locality})` : ""}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-start sm:items-end">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    Estado Actual
                  </span>
                  <select
                    value={selectedCandidate.status}
                    onChange={(e) =>
                      handleStatusChange(selectedCandidate.id, e.target.value as ApplicationStatus)
                    }
                    className={`mt-1 rounded-md px-2.5 py-1 text-xs font-semibold border ${
                      selectedCandidate.status === "en_estudio_seguridad"
                        ? "bg-amber-50 border-amber-200 text-amber-900"
                        : selectedCandidate.status === "citado_entrevista"
                        ? "bg-slate-900 border-slate-900 text-white"
                        : selectedCandidate.status === "contratado"
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : selectedCandidate.status === "descartado"
                        ? "bg-slate-200 border-slate-300 text-slate-700"
                        : selectedCandidate.status === "preseleccionado"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-slate-100 border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="postulado">Postulado (Sin revisar)</option>
                    <option value="preseleccionado">En Revisión / CV Visto</option>
                    <option value="citado_entrevista">Citado a Entrevista</option>
                    <option value="en_estudio_seguridad">En Estudio & Polígrafo</option>
                    <option value="contratado">Contratado</option>
                    <option value="descartado">Descartado</option>
                  </select>
                </div>
              </div>

              {/* BARRA DE ACCIÓN RÁPIDA EN 1 CLIC */}
              <div className="space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Acciones Rápidas de Selección (1 Clic)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Botón 1: Mover a Entrevista */}
                  <button
                    type="button"
                    onClick={() => handleStatusChange(selectedCandidate.id, "citado_entrevista")}
                    className="p-2.5 rounded-md border text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white transition-colors text-center inline-flex items-center justify-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.75} />
                    <span>Mover a Entrevista</span>
                  </button>

                  {/* Botón 2: Citar por WhatsApp con Template */}
                  <a
                    href={generateInterviewCitationLink({
                      phone: selectedCandidate.phone_whatsapp,
                      candidateName: selectedCandidate.full_name,
                      companyName: companyName || "Nuestra Empresa de Seguridad",
                      jobTitle: vacancyTitle,
                      shift: vacancyShift,
                      interviewAddress: vacancyAddress,
                      interviewDateText: "Mañana a las 8:30 AM",
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleStatusChange(selectedCandidate.id, "citado_entrevista")}
                    className="p-2.5 rounded-md border border-emerald-300 text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors text-center inline-flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.75} />
                    <span>Citar por WhatsApp</span>
                  </a>

                  {/* Botón 3: Solicitar Polígrafo B2B */}
                  <button
                    type="button"
                    onClick={() => setSelectedCandidateForStudy(selectedCandidate)}
                    className="p-2.5 rounded-md border border-slate-300 text-xs font-medium bg-white hover:bg-slate-50 text-slate-900 transition-colors text-center inline-flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.75} />
                    <span>Solicitar Polígrafo</span>
                  </button>

                  {/* Botón 4: Contratar */}
                  <button
                    type="button"
                    onClick={() => handleStatusChange(selectedCandidate.id, "contratado")}
                    className="p-2.5 rounded-md border border-emerald-600 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors text-center inline-flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
                    <span>Contratar</span>
                  </button>
                </div>
              </div>

              {/* HOJA DE VIDA EN PDF & SOPORTES */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-700" strokeWidth={1.75} />
                    <span className="text-xs font-semibold text-slate-900">
                      Hoja de Vida y Soportes Documentales
                    </span>
                  </div>
                  {selectedCandidate.resume_pdf_url ? (
                    <span className="badge-emerald text-[10px] py-0.5">
                      PDF Adjunto y Verificado
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-medium">
                      Sin PDF cargado
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  {selectedCandidate.resume_pdf_url ? (
                    <button
                      type="button"
                      onClick={() => handleOpenResumePdf(selectedCandidate)}
                      className="btn-primary text-xs h-9 px-4 font-semibold inline-flex items-center justify-center gap-2"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Abrir / Descargar Hoja de Vida (PDF)</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </button>
                  ) : (
                    <div className="p-3 bg-white border border-dashed border-slate-200 rounded-md text-xs text-slate-500 text-center w-full">
                      El candidato completó su ficha operativa en línea pero aún no ha subido el archivo PDF.
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedCandidateForDrawer(selectedCandidate)}
                    className="btn-secondary text-xs h-9 px-3 font-medium inline-flex items-center justify-center gap-1.5"
                  >
                    <span>Ver Expediente Completo</span>
                  </button>
                </div>
              </div>

              {/* DETALLES DE CREDENCIAL SUPERVIGILANCIA */}
              <div className="space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Acreditación SuperVigilancia & Dotación
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-slate-200/80 bg-white space-y-1">
                    <span className="text-[11px] text-slate-500 block">Curso de Seguridad:</span>
                    <strong className="text-xs text-slate-900 block font-semibold">
                      {selectedCandidate.course_name || "Vigilancia Básica"}
                    </strong>
                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        {selectedCandidate.course_date ? `Fecha: ${selectedCandidate.course_date}` : "Sin fecha"}
                      </span>
                      {selectedCandidate.course_semaphore === "VIGENTE" ? (
                        <span className="badge-emerald text-[10px]">
                          Vigente ({selectedCandidate.days_remaining}d)
                        </span>
                      ) : (
                        <span className="badge-rose text-[10px]">
                          Vencido
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200/80 bg-white space-y-1">
                    <span className="text-[11px] text-slate-500 block">Condición Operativa:</span>
                    <div className="text-xs text-slate-900 space-y-0.5">
                      <div>
                        Libreta Militar:{" "}
                        <strong className="font-semibold">
                          {selectedCandidate.has_military_booklet ? "Al Día (Sí)" : "No"}
                        </strong>
                      </div>
                      <div>
                        Moto Propia:{" "}
                        <strong className="font-semibold">
                          {selectedCandidate.has_own_motorcycle
                            ? `Sí (${selectedCandidate.motorcycle_cc || 150}cc)`
                            : "No"}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTÓN DESCARTAR RÁPIDO */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  ¿El aspirante no cumple los requisitos del cliente?
                </span>
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedCandidate.id, "descartado")}
                  className="text-xs text-rose-600 hover:text-rose-800 font-medium px-2.5 py-1 rounded-md hover:bg-rose-50 transition-colors"
                >
                  Descartar Candidato
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white border border-slate-200/90 rounded-lg space-y-2 shadow-subtle">
              <User className="w-8 h-8 text-slate-300 mx-auto" strokeWidth={1.5} />
              <h4 className="text-xs font-semibold text-slate-800">Ningún candidato seleccionado</h4>
              <p className="text-[11px] text-slate-500">
                Selecciona un candidato de la columna izquierda para ver su expediente y realizar acciones rápidas.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* DRAWER MODAL FOR CANDIDATE RESUME */}
      <ResumeDrawerModal
        isOpen={!!selectedCandidateForDrawer}
        onClose={() => setSelectedCandidateForDrawer(null)}
        candidate={selectedCandidateForDrawer}
        onOpenStudyModal={() => {
          setSelectedCandidateForStudy(selectedCandidateForDrawer);
          setSelectedCandidateForDrawer(null);
        }}
      />

      {/* B2B MONETIZATION MODAL: ORDER SECURITY STUDY & POLYGRAPH */}
      <OrderSecurityStudyModal
        isOpen={!!selectedCandidateForStudy}
        onClose={() => setSelectedCandidateForStudy(null)}
        candidateName={selectedCandidateForStudy?.full_name || ""}
        candidateNationalId={selectedCandidateForStudy?.national_id || ""}
        candidateRole={selectedCandidateForStudy?.primary_role || ""}
        availableCredits={credits}
        onConfirmOrder={handleConfirmStudyOrder}
      />
    </div>
  );
}
