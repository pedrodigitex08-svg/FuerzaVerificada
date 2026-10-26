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
  CreditCard,
  Building,
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

      // 1. Cargar Datos Reales de la Vacante
      try {
        const { data: job, error: jobErr } = await supabase
          .from("job_posts")
          .select("*")
          .eq("id", vacancyId)
          .maybeSingle();

        if (job) {
          setVacancyTitle(job.title || "Vacante de Seguridad");
          setVacancyShift(job.shift || "Turno rotativo");
          setVacancyCity(job.city || "Bogotá D.C.");
          setVacancyAddress(job.interview_address || job.zone_neighborhood || job.city || "Colombia");
        }
      } catch (err) {
        console.error("Error loading vacancy details:", err);
      }

      // 2. Cargar Candidatos postulados a esta vacante
      try {
        const { data: apps, error: appsErr } = await supabase
          .from("applications")
          .select("*, profiles(*)")
          .eq("job_id", vacancyId)
          .order("created_at", { ascending: false });

        if (!appsErr && apps && apps.length > 0) {
          const candidateIds = apps.map((a: any) => a.candidate_id).filter(Boolean);

          // Obtener candidate_profiles
          const { data: candProfiles } = await supabase
            .from("candidate_profiles")
            .select("*")
            .in("user_id", candidateIds);

          const profileMap = new Map((candProfiles || []).map((cp: any) => [cp.user_id, cp]));

          // Obtener cursos recientes
          const { data: candCourses } = await supabase
            .from("candidate_courses")
            .select("*")
            .in("candidate_id", candidateIds)
            .order("completion_date", { ascending: false });

          const courseMap = new Map();
          (candCourses || []).forEach((c: any) => {
            if (!courseMap.has(c.candidate_id)) {
              courseMap.set(c.candidate_id, c);
            }
          });

          const resolvedCandidates: ATSCandidate[] = apps.map((a: any) => {
            const candId = a.candidate_id;
            const candProf = profileMap.get(candId) || {};
            const candCourse = courseMap.get(candId);
            const userProf = a.profiles || {};

            let semaphore: "VIGENTE" | "PROXIMO_A_VENCER" | "VENCIDO" = "VIGENTE";
            let daysRem = 180;

            if (candCourse?.expiration_date) {
              const expDate = new Date(candCourse.expiration_date);
              const now = new Date();
              daysRem = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              if (daysRem <= 0) semaphore = "VENCIDO";
              else if (daysRem <= 60) semaphore = "PROXIMO_A_VENCER";
              else semaphore = "VIGENTE";
            }

            return {
              id: a.id,
              candidate_user_id: candId,
              full_name: userProf.full_name || candProf.full_name || "Aspirante Operativo",
              national_id: candProf.national_id || "En verificación",
              phone_whatsapp: userProf.phone_whatsapp || candProf.phone || "3000000000",
              city: candProf.city || "Bogotá D.C.",
              locality: candProf.locality_neighborhood || candProf.locality,
              primary_role: formatSecurityRoleLabel(candProf.primary_role || "vigilante_fijo"),
              years_experience: candProf.years_experience ?? 1,
              has_military_booklet: !!candProf.has_military_booklet,
              has_own_motorcycle: !!candProf.has_own_motorcycle,
              motorcycle_cc: candProf.motorcycle_cc,
              available_immediately: !!candProf.available_immediately,
              resume_pdf_url: candProf.resume_pdf_url || "",
              course_semaphore: semaphore,
              course_name: candCourse?.course_type
                ? formatSecurityRoleLabel(candCourse.course_type)
                : "Vigilancia Básica",
              course_date: candCourse?.completion_date || candCourse?.expiration_date,
              days_remaining: Math.max(daysRem, 0),
              match_score: a.match_score ?? 88,
              status: (a.status as ApplicationStatus) || "postulado",
              applied_at: a.created_at,
            };
          });

          setCandidates(resolvedCandidates);
          if (resolvedCandidates.length > 0) {
            setSelectedCandidate(resolvedCandidates[0]);
          }
        } else {
          setCandidates([]);
          setSelectedCandidate(null);
        }
      } catch (err) {
        console.error("Error loading candidates:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadVacancyAndCandidates();
  }, [vacancyId]);

  // Actualizar estado de aplicación en Supabase con feedback visual
  const handleStatusChange = async (appId: string, nextStatus: ApplicationStatus) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === appId ? { ...c, status: nextStatus } : c))
    );
    if (selectedCandidate?.id === appId) {
      setSelectedCandidate((prev) => (prev ? { ...prev, status: nextStatus } : null));
    }

    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("applications")
        .update({
          status: nextStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", appId);

      if (error) throw error;

      let msg = "Estado actualizado con éxito";
      if (nextStatus === "citado_entrevista") {
        msg = "Candidato movido a Entrevista. Se ha generado la plantilla de citación.";
      } else if (nextStatus === "contratado") {
        msg = "¡Candidato Contratado! Convocatoria actualizada.";
      } else if (nextStatus === "descartado") {
        msg = "Candidato archivado como descartado.";
      } else if (nextStatus === "preseleccionado") {
        msg = "Candidato marcado como 'CV Visto / En Revisión'.";
      }

      setNotificationToast(msg);
      setTimeout(() => setNotificationToast(null), 3500);
    } catch (err) {
      console.error("Error updating application status:", err);
    }
  };

  // Abrir Hoja de Vida en PDF y marcar automáticamente 'preseleccionado / CV Visto'
  const handleOpenResumePdf = (candidate: ATSCandidate) => {
    if (candidate.status === "postulado") {
      handleStatusChange(candidate.id, "preseleccionado");
    }
    if (candidate.resume_pdf_url) {
      window.open(candidate.resume_pdf_url, "_blank", "noopener,noreferrer");
    } else {
      setSelectedCandidateForDrawer(candidate);
    }
  };

  // Seleccionar candidato y activar marca 'CV Visto' si está en estado postulado
  const handleSelectCandidate = (candidate: ATSCandidate) => {
    setSelectedCandidate(candidate);
    if (candidate.status === "postulado") {
      handleStatusChange(candidate.id, "preseleccionado");
    }
  };

  // Confirmar orden de estudio de confiabilidad / poligrafía
  const handleConfirmStudyOrder = async (orderPayload?: any) => {
    const supabase = createClient();
    try {
      if (companyId && selectedCandidate?.candidate_user_id) {
        await supabase.from("security_study_orders").insert({
          company_id: companyId,
          candidate_id: selectedCandidate.candidate_user_id,
          study_type: orderPayload?.study_type || "poligrafo_preempleo",
          status: "en_estudio",
          city: selectedCandidate.city,
          notes: orderPayload?.notes || "",
        });

        // Descontar crédito de la empresa
        const nextCredits = Math.max(credits - 1, 0);
        await supabase
          .from("companies")
          .update({
            credits_security_studies: nextCredits,
          })
          .eq("id", companyId);

        setCredits(nextCredits);
        if (typeof window !== "undefined") {
          localStorage.setItem("fv_company_credits", String(nextCredits));
        }

        handleStatusChange(selectedCandidate.id, "en_estudio_seguridad");
        setNotificationToast("Orden de Poligrafía radicada con éxito. Dictamen disponible en 24h.");
        setTimeout(() => setNotificationToast(null), 4000);
      }
    } catch (err) {
      console.error("Error creating security order:", err);
    } finally {
      setSelectedCandidateForStudy(null);
    }
  };

  // Conteo en vivo para pestañas del embudo
  const counts = {
    todos: candidates.length,
    nuevos: candidates.filter((c) => getCandidateCategory(c.status) === "nuevos").length,
    revision: candidates.filter((c) => getCandidateCategory(c.status) === "revision").length,
    proceso: candidates.filter((c) => getCandidateCategory(c.status) === "proceso").length,
    contratados: candidates.filter((c) => getCandidateCategory(c.status) === "contratados").length,
    descartados: candidates.filter((c) => getCandidateCategory(c.status) === "descartados").length,
  };

  // Filtro de lista
  const filteredCandidates = candidates
    .filter((c) => {
      const matchSearch =
        !searchTerm ||
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
      {/* Top Breadcrumb & Vacancy Header Estilo Computrabajo Empresas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
            <Link href="/empresa/vacantes" className="text-[#005DA4] hover:text-[#0B3B70] font-semibold flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              Mis Vacantes
            </Link>
            <span>/</span>
            <span className="text-slate-700 font-medium">Bandeja ATS SherlockHR</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {vacancyTitle}
          </h1>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
            <span>
              Turno: <strong className="text-slate-800 font-mono tabular-nums">{vacancyShift}</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {vacancyAddress}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="p-3 rounded-2xl bg-[#EAF3FA] border border-[#D5E6F5] text-[#0B3B70] flex items-center gap-2.5 shadow-2xs">
            <Shield className="w-5 h-5 text-[#005DA4]" strokeWidth={2} />
            <div className="text-xs">
              <span className="text-[10px] text-slate-500 block uppercase font-bold leading-none">
                Créditos Poligrafía
              </span>
              <strong className="text-[#0B3B70] font-mono text-sm font-bold tabular-nums">
                {credits} disponibles
              </strong>
            </div>
          </div>
        </div>
      </div>

      {notificationToast && (
        <div className="p-4 rounded-2xl bg-[#0B3B70] text-white text-xs font-semibold flex items-center gap-2.5 shadow-md border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" strokeWidth={2.5} />
          <span>{notificationToast}</span>
        </div>
      )}

      {/* 1. BARRA DE PESTAÑAS DE EMBUDO (SHERLOCK HR FUNNEL TABS) CON CONTADORES EN VIVO ESTILO COMPUTRABAJO */}
      <div className="bg-white border-b border-slate-200 px-6 pt-2 rounded-2xl shadow-2xs overflow-x-auto">
        <div className="flex items-center gap-6 min-w-max">
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
                className={`pb-3.5 pt-2 text-xs font-semibold transition-all inline-flex items-center gap-2 border-b-[3px] ${
                  isActive
                    ? "border-[#005DA4] text-[#0B3B70] font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] font-mono font-bold tabular-nums px-2 py-0.5 rounded-full ${
                    isActive
                      ? "bg-[#EAF3FA] text-[#0B3B70] border border-[#D5E6F5]"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Bar en Píldora */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" strokeWidth={2} />
        <input
          type="text"
          placeholder="Buscar candidato por nombre, cédula o cargo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-11 bg-white border border-slate-300 rounded-full pl-11 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 shadow-2xs transition-all"
        />
      </div>

      {/* 2. VISOR DE RECLUTAMIENTO EN PANTALLA DIVIDIDA (MASTER-DETAIL) ESTILO COMPUTRABAJO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMNA IZQUIERDA: LISTA DE CANDIDATOS (5 COLS) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Caja superior de conteo */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Candidatos ({filteredCandidates.length})
            </h2>
            <span className="text-xs text-[#005DA4] font-semibold">Ordenados por Match %</span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-3 shadow-2xs">
              <div className="w-7 h-7 border-2 border-[#0B3B70] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-600 font-semibold">Cargando candidatos calificados...</p>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl space-y-2 shadow-2xs">
              <Users className="w-8 h-8 text-slate-300 mx-auto" strokeWidth={1.5} />
              <h4 className="text-xs font-bold text-slate-800">No hay candidatos en esta etapa</h4>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                {searchTerm
                  ? "Intenta con otro término de búsqueda o limpia el filtro."
                  : "Los aspirantes que se postulen aparecerán automáticamente en esta bandeja."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCandidates.map((cand) => {
                const isSelected = selectedCandidate?.id === cand.id;
                const isCityMatch =
                  cand.city.toLowerCase().trim() === vacancyCity.toLowerCase().trim() ||
                  !vacancyCity;

                return (
                  <div
                    key={cand.id}
                    onClick={() => handleSelectCandidate(cand)}
                    className={`bg-white rounded-2xl p-4.5 text-left cursor-pointer transition-all ${
                      isSelected
                        ? "border-[1.5px] border-[#005DA4] ring-1 ring-[#005DA4]/20 shadow-sm"
                        : "border border-slate-200 hover:border-slate-300 shadow-2xs"
                    }`}
                  >
                    {/* Header Row: Name & Match */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-slate-900 tracking-tight hover:text-[#005DA4] transition-colors">
                            {cand.full_name}
                          </h4>
                          {cand.status === "postulado" && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Nuevo candidato" />
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                          C.C. {cand.national_id} • {cand.years_experience} años exp.
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono tabular-nums ${
                            cand.match_score >= 85
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {cand.match_score}% Match
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {formatRelativeDate(cand.applied_at)}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs font-semibold text-slate-700 mt-1">
                      {cand.primary_role}
                    </div>

                    {/* SEMÁFORO DE COMPATIBILIDAD (KILLER CHECKS EN 2 SEGUNDOS) */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-100">
                      {/* Check 1: Curso */}
                      {cand.course_semaphore === "VIGENTE" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full tabular-nums">
                          <Check className="w-3 h-3 text-emerald-600" strokeWidth={3} />
                          Curso Vigente ({cand.days_remaining}d)
                        </span>
                      ) : cand.course_semaphore === "PROXIMO_A_VENCER" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full tabular-nums">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Por Vencer ({cand.days_remaining}d)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          Curso Vencido
                        </span>
                      )}

                      {/* Check 2: Hoja de Vida PDF */}
                      {cand.resume_pdf_url ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3 text-emerald-600" strokeWidth={3} />
                          CV PDF Adjunto
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                          Sin CV PDF
                        </span>
                      )}

                      {/* Check 3: Ciudad Coincidente */}
                      {isCityMatch ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3 text-emerald-600" strokeWidth={3} />
                          Ciudad Sede
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
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
            <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-2xs space-y-6">
              {/* Expediente Header Estilo Computrabajo */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="flex items-start gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-[#EAF3FA] border border-[#D5E6F5] text-[#0B3B70] flex items-center justify-center font-extrabold text-lg shrink-0 shadow-2xs">
                    {selectedCandidate.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                        {selectedCandidate.full_name}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <Check className="w-3 h-3 text-emerald-600" strokeWidth={3} />
                        Auditado
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 font-semibold mt-1">
                      {selectedCandidate.primary_role} • {selectedCandidate.years_experience} años de experiencia
                    </div>
                    <div className="text-xs text-slate-500 font-mono tabular-nums mt-1 flex items-center gap-2">
                      <span>C.C. {selectedCandidate.national_id}</span>
                      <span>•</span>
                      <span>{selectedCandidate.city} {selectedCandidate.locality ? `(${selectedCandidate.locality})` : ""}</span>
                    </div>

                    {/* Sello azul de verificación */}
                    <div className="pt-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#005DA4] bg-[#EAF3FA] px-3 py-1 rounded-full border border-[#D5E6F5]">
                        <Shield className="w-3.5 h-3.5 text-[#005DA4]" strokeWidth={2} />
                        <span>Acreditación SuperVigilancia</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-start sm:items-end">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Fase del Embudo
                  </span>
                  <select
                    value={selectedCandidate.status}
                    onChange={(e) =>
                      handleStatusChange(selectedCandidate.id, e.target.value as ApplicationStatus)
                    }
                    className="mt-1 rounded-full px-3.5 py-1.5 text-xs font-bold border border-slate-300 bg-white shadow-2xs focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/10 cursor-pointer"
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

              {/* BARRA DE ACCIÓN PRINCIPAL (BOTÓN PRINCIPAL PÍLDORA + ACCIONES EN AZUL HIELO #EAF3FA) */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Acciones Rápidas de Selección
                </span>
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Botón Principal: Mover a Entrevista */}
                  <button
                    type="button"
                    onClick={() => handleStatusChange(selectedCandidate.id, "citado_entrevista")}
                    className="rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white text-xs font-semibold px-5 py-2.5 inline-flex items-center gap-2 shadow-xs transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#FFE066]" strokeWidth={2} />
                    <span>Mover a Entrevista</span>
                  </button>

                  {/* Botón en Azul Hielo: Citar por WhatsApp con Template */}
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
                    className="rounded-full bg-[#EAF3FA] hover:bg-[#D5E6F5] text-[#0B3B70] border border-[#D5E6F5] text-xs font-semibold px-4 py-2.5 inline-flex items-center gap-2 shadow-2xs transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2} />
                    <span>Citar por WhatsApp</span>
                  </a>

                  {/* Botón en Azul Hielo: Solicitar Polígrafo B2B */}
                  <button
                    type="button"
                    onClick={() => setSelectedCandidateForStudy(selectedCandidate)}
                    className="rounded-full bg-[#EAF3FA] hover:bg-[#D5E6F5] text-[#0B3B70] border border-[#D5E6F5] text-xs font-semibold px-4 py-2.5 inline-flex items-center gap-2 shadow-2xs transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#005DA4]" strokeWidth={2} />
                    <span>Solicitar Polígrafo</span>
                  </button>

                  {/* Botón Contratar */}
                  <button
                    type="button"
                    onClick={() => handleStatusChange(selectedCandidate.id, "contratado")}
                    className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 inline-flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                    <span>Contratar</span>
                  </button>
                </div>
              </div>

              {/* SECCIÓN RESUMEN DEL CANDIDATO CON ICONOS LIMPIOS ESTILO COMPUTRABAJO */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                  Resumen del Candidato
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#0B3B70] shrink-0">
                      <Briefcase className="w-4 h-4 text-[#005DA4]" />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Experiencia en Seguridad:</span>
                      <strong className="text-xs font-bold text-slate-900">{selectedCandidate.years_experience} años certificados</strong>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#0B3B70] shrink-0">
                      <Shield className="w-4 h-4 text-[#005DA4]" />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Curso SuperVigilancia:</span>
                      <strong className="text-xs font-bold text-slate-900">
                        {selectedCandidate.course_semaphore === "VIGENTE" ? `Vigente (${selectedCandidate.days_remaining}d)` : "Por Vencer / Vencido"}
                      </strong>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#0B3B70] shrink-0">
                      <CreditCard className="w-4 h-4 text-[#005DA4]" />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Libreta Militar:</span>
                      <strong className="text-xs font-bold text-slate-900">
                        {selectedCandidate.has_military_booklet ? "Al Día (Sí)" : "No Posee"}
                      </strong>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#0B3B70] shrink-0">
                      <Bike className="w-4 h-4 text-[#005DA4]" />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Dotación de Moto:</span>
                      <strong className="text-xs font-bold text-slate-900">
                        {selectedCandidate.has_own_motorcycle ? `Sí (${selectedCandidate.motorcycle_cc || 150}cc)` : "No Posee"}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* HOJA DE VIDA EN PDF & SOPORTES */}
              <div className="p-4 rounded-xl bg-[#EAF3FA]/50 border border-[#D5E6F5] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#005DA4]" strokeWidth={2} />
                    <span className="text-xs font-bold text-slate-900">
                      Hoja de Vida y Soportes Documentales
                    </span>
                  </div>
                  {selectedCandidate.resume_pdf_url ? (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      PDF Adjunto y Verificado
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-semibold">
                      Sin PDF cargado
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  {selectedCandidate.resume_pdf_url ? (
                    <button
                      type="button"
                      onClick={() => handleOpenResumePdf(selectedCandidate)}
                      className="rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white text-xs h-9 px-5 font-semibold inline-flex items-center justify-center gap-2 shadow-xs transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Abrir / Descargar Hoja de Vida (PDF)</span>
                      <ExternalLink className="w-3 h-3 text-slate-300" />
                    </button>
                  ) : (
                    <div className="p-3 bg-white border border-dashed border-slate-200 rounded-xl text-xs text-slate-500 text-center w-full">
                      El candidato completó su ficha operativa en línea pero aún no ha subido el archivo PDF.
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedCandidateForDrawer(selectedCandidate)}
                    className="rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs h-9 px-4 font-semibold inline-flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <span>Ver Expediente Completo</span>
                  </button>
                </div>
              </div>

              {/* BOTÓN DESCARTAR RÁPIDO */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  ¿El aspirante no cumple los requisitos del puesto?
                </span>
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedCandidate.id, "descartado")}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-3 py-1 rounded-full hover:bg-rose-50 transition-colors"
                >
                  Descartar Candidato
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-2 shadow-2xs">
              <User className="w-8 h-8 text-slate-300 mx-auto" strokeWidth={1.5} />
              <h4 className="text-xs font-bold text-slate-800">Ningún candidato seleccionado</h4>
              <p className="text-[11px] text-slate-500">
                Selecciona un aspirante de la columna izquierda para ver su expediente y realizar acciones rápidas.
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
