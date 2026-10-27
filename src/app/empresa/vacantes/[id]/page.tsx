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
  BadgeCheck,
  MoreVertical,
  ChevronDown,
  ShieldAlert,
  X,
} from "lucide-react";
import { ResumeDrawerModal } from "@/components/empresa/ResumeDrawerModal";
import { OrderSecurityStudyModal } from "@/components/empresa/OrderSecurityStudyModal";
import { ApplicationStatus, SecurityRoleType, SecurityStudyStatus } from "@/types/database";
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

  // Filtros rápidos tipo píldora (SherlockHR Style)
  const [compatibilityFilter, setCompatibilityFilter] = useState("todos");
  const [courseFilter, setCourseFilter] = useState("todos");
  const [pdfFilter, setPdfFilter] = useState("todos");
  const [cityFilter, setCityFilter] = useState("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest(".filter-dropdown-container")) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          let { data: comp } = await supabase
            .from("companies")
            .select("id, company_name, credits_security_studies")
            .eq("owner_id", user.id)
            .maybeSingle();

          if (!comp) {
            const compName =
              user.user_metadata?.company_name ||
              user.user_metadata?.full_name ||
              "Empresa de Seguridad";

            const { data: createdComp } = await supabase
              .from("companies")
              .insert({
                owner_id: user.id,
                company_name: compName,
                nit: user.user_metadata?.nit || `NIT-${user.id.slice(0, 8)}`,
                contact_person: user.user_metadata?.full_name || "Contacto Empresa",
                contact_phone: user.user_metadata?.phone || "3000000000",
                city: "Bogotá D.C.",
                is_verified_company: false,
                plan_name: "basico",
                credits_security_studies: 10,
              })
              .select("id, company_name, credits_security_studies")
              .maybeSingle();

            if (createdComp) comp = createdComp;
          }

          if (comp) {
            setCompanyId(comp.id);
            if (comp.company_name) setCompanyName(comp.company_name);
            setCredits(Number(comp.credits_security_studies ?? 0));
          }
        }
      } catch {}

      // 1. Cargar Datos Reales de la Vacante
      try {
        const { data: job } = await supabase
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
        let rawApps: any[] = [];
        const { data: apps, error: appsErr } = await supabase
          .from("applications")
          .select("*, profiles(*)")
          .eq("job_id", vacancyId)
          .order("created_at", { ascending: false });

        if (!appsErr && Array.isArray(apps) && apps.length > 0) {
          rawApps = apps;
        } else {
          // Respaldo anti-join: consulta directa sin JOIN a profiles
          const { data: directApps } = await supabase
            .from("applications")
            .select("*")
            .eq("job_id", vacancyId)
            .order("created_at", { ascending: false });
          if (Array.isArray(directApps)) {
            rawApps = directApps;
          }
        }

        if (rawApps.length > 0) {
          const candidateIds = rawApps.map((a: any) => a.candidate_id).filter(Boolean);

          // Obtener profiles de los candidatos
          const { data: userProfiles } =
            candidateIds.length > 0
              ? await supabase
                  .from("profiles")
                  .select("id, full_name, phone_whatsapp")
                  .in("id", candidateIds)
              : { data: [] as any[] };
          const userProfMap = new Map((userProfiles || []).map((p: any) => [p.id, p]));

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

          const resolvedCandidates: ATSCandidate[] = rawApps.map((a: any) => {
            const candId = a.candidate_id;
            const candProf = profileMap.get(candId) || {};
            const candCourse = courseMap.get(candId);
            const userProf = a.profiles || userProfMap.get(candId) || {};

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
      let activeCompanyId = companyId;

      // Si no tenemos companyId en estado, resolverlo o auto-provisionarlo
      if (!activeCompanyId) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          let { data: comp } = await supabase
            .from("companies")
            .select("id, credits_security_studies")
            .eq("owner_id", user.id)
            .maybeSingle();

          if (!comp) {
            const compName =
              companyName ||
              user.user_metadata?.company_name ||
              user.user_metadata?.full_name ||
              "Empresa de Seguridad";

            const { data: createdComp } = await supabase
              .from("companies")
              .insert({
                owner_id: user.id,
                company_name: compName,
                nit: user.user_metadata?.nit || `NIT-${user.id.slice(0, 8)}`,
                contact_person: user.user_metadata?.full_name || "Contacto Empresa",
                contact_phone: user.user_metadata?.phone || "3000000000",
                city: vacancyCity || "Bogotá D.C.",
                is_verified_company: false,
                plan_name: "basico",
                credits_security_studies: 10,
              })
              .select("id, credits_security_studies")
              .maybeSingle();

            if (createdComp) comp = createdComp;
          }

          if (comp) {
            activeCompanyId = comp.id;
            setCompanyId(comp.id);
          }
        }
      }

      if (activeCompanyId && selectedCandidate?.candidate_user_id) {
        const studyType = orderPayload?.study_type || "poligrafo_preempleo";
        const isPolygraph =
          studyType.includes("poligrafo") || studyType.includes("combo");
        const isHomeVisit =
          studyType.includes("visita") || studyType.includes("combo");

        const orderData = {
          company_id: activeCompanyId,
          candidate_id: selectedCandidate.candidate_user_id,
          application_id: selectedCandidate.id,
          study_type: studyType,
          include_polygraph: isPolygraph,
          include_home_visit: isHomeVisit,
          include_background_study: true,
          status: "solicitado" as SecurityStudyStatus,
          scheduled_date: "En programación pericial",
          final_concept: `Solicitud pericial de ${studyType.replace(/_/g, " ").toUpperCase()} para ${selectedCandidate.full_name} (C.C. ${selectedCandidate.national_id}, Tel: ${selectedCandidate.phone_whatsapp}, Ciudad: ${selectedCandidate.city}). Obs: ${orderPayload?.notes || "Radicado desde ATS de vacante."}`,
          report_pdf_url: null,
        };

        const { error: insertOrderErr } = await supabase
          .from("security_study_orders")
          .insert(orderData);

        if (insertOrderErr) {
          console.error("Error inserting security_study_orders:", insertOrderErr);
        }

        // Descontar crédito de la empresa
        const nextCredits = Math.max(credits - 1, 0);
        await supabase
          .from("companies")
          .update({
            credits_security_studies: nextCredits,
          })
          .eq("id", activeCompanyId);

        setCredits(nextCredits);
        if (typeof window !== "undefined") {
          localStorage.setItem("fv_company_credits", String(nextCredits));
        }

        handleStatusChange(selectedCandidate.id, "en_estudio_seguridad");
        setNotificationToast("Orden de Poligrafía radicada con éxito en bandeja Admin. Dictamen disponible en 24h.");
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

  // Filtro de lista combinado (Pestaña + Búsqueda + Filtros Píldora)
  const filteredCandidates = candidates
    .filter((c) => {
      const matchSearch =
        !searchTerm ||
        c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.national_id.includes(searchTerm) ||
        c.primary_role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.city.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;
      if (activeTab !== "todos" && getCandidateCategory(c.status) !== activeTab) {
        return false;
      }

      if (compatibilityFilter === "90" && c.match_score < 90) return false;
      if (compatibilityFilter === "80" && c.match_score < 80) return false;

      if (courseFilter === "vigente" && c.course_semaphore !== "VIGENTE") return false;
      if (courseFilter === "proximo" && c.course_semaphore !== "PROXIMO_A_VENCER") return false;
      if (courseFilter === "vencido" && c.course_semaphore !== "VENCIDO") return false;

      if (pdfFilter === "con_pdf" && !c.resume_pdf_url) return false;
      if (pdfFilter === "sin_pdf" && c.resume_pdf_url) return false;

      if (cityFilter && !c.city.toLowerCase().includes(cityFilter.toLowerCase())) {
        return false;
      }

      return true;
    })
    .sort((a, b) => b.match_score - a.match_score);

  const hasActiveFilters = Boolean(
    searchTerm ||
    compatibilityFilter !== "todos" ||
    courseFilter !== "todos" ||
    pdfFilter !== "todos" ||
    cityFilter
  );

  const resetFilters = () => {
    setSearchTerm("");
    setCompatibilityFilter("todos");
    setCourseFilter("todos");
    setPdfFilter("todos");
    setCityFilter("");
    setOpenDropdown(null);
  };

  return (
    <div className="space-y-5">
      {/* Top Breadcrumb & Vacancy Header Estilo Computrabajo Empresas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
            <Link
              href="/empresa/vacantes"
              className="text-[#005DA4] hover:text-[#0B3B70] font-semibold flex items-center gap-1 transition-colors"
            >
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

      {/* 1. BARRA DE PESTAÑAS DE EMBUDO (SHERLOCK HR FUNNEL TABS) CON CONTADORES EN VIVO */}
      <div className="bg-white border-b border-slate-200/90 px-6 pt-2 rounded-2xl shadow-2xs overflow-x-auto">
        <div className="flex items-center gap-6 min-w-max">
          {[
            { key: "todos" as FunnelTabKey, label: "Todos", count: counts.todos },
            { key: "nuevos" as FunnelTabKey, label: "Nuevos / Sin leer", count: counts.nuevos },
            { key: "revision" as FunnelTabKey, label: "CV Visto / En revisión", count: counts.revision },
            { key: "proceso" as FunnelTabKey, label: "Entrevista / Polígrafo", count: counts.proceso },
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
                    ? "border-[#0B3B70] text-[#0B3B70] font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] font-mono font-bold tabular-nums px-2.5 py-0.5 rounded-full ${
                    isActive
                      ? "bg-[#EAF3FA] text-[#005DA4] border border-[#D5E6F5]"
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

      {/* 2. FILA DE FILTROS RÁPIDOS TIPO PÍLDORA (⌄) SOBRE FONDO #F2F5F8 */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
        {/* Buscador Integrado en Píldora */}
        <div className="relative w-72 shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" strokeWidth={2} />
          <input
            type="text"
            placeholder="Buscar por nombre, cédula o cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 bg-white border border-slate-300 rounded-full pl-9 pr-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 shadow-2xs transition-all"
          />
        </div>

        {/* Filtro 1: Compatibilidad */}
        <div className="relative filter-dropdown-container shrink-0">
          <button
            type="button"
            onClick={() => setOpenDropdown(openDropdown === "compat" ? null : "compat")}
            className={`border rounded-full px-4 py-1.5 text-xs font-medium flex items-center gap-1.5 shadow-2xs transition-all whitespace-nowrap cursor-pointer ${
              compatibilityFilter !== "todos"
                ? "border-[#005DA4] text-[#005DA4] font-bold bg-[#EAF3FA]"
                : "border-slate-200/90 text-slate-700 bg-white hover:border-[#005DA4]"
            }`}
          >
            <span>
              {compatibilityFilter === "90"
                ? "Compatibilidad: ≥ 90%"
                : compatibilityFilter === "80"
                ? "Compatibilidad: ≥ 80%"
                : "Compatibilidad"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          {openDropdown === "compat" && (
            <div className="absolute left-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-30 space-y-1">
              {[
                { id: "todos", label: "Todas las compatibilidades" },
                { id: "90", label: "Alta compatibilidad (≥ 90%)" },
                { id: "80", label: "Buena compatibilidad (≥ 80%)" },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCompatibilityFilter(c.id);
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    compatibilityFilter === c.id
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

        {/* Filtro 2: Curso SuperVigilancia */}
        <div className="relative filter-dropdown-container shrink-0">
          <button
            type="button"
            onClick={() => setOpenDropdown(openDropdown === "course" ? null : "course")}
            className={`border rounded-full px-4 py-1.5 text-xs font-medium flex items-center gap-1.5 shadow-2xs transition-all whitespace-nowrap cursor-pointer ${
              courseFilter !== "todos"
                ? "border-[#005DA4] text-[#005DA4] font-bold bg-[#EAF3FA]"
                : "border-slate-200/90 text-slate-700 bg-white hover:border-[#005DA4]"
            }`}
          >
            <span>
              {courseFilter === "vigente"
                ? "Curso: Vigente"
                : courseFilter === "proximo"
                ? "Curso: Por Vencer"
                : courseFilter === "vencido"
                ? "Curso: Vencido"
                : "Curso SuperVigilancia"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          {openDropdown === "course" && (
            <div className="absolute left-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-30 space-y-1">
              {[
                { id: "todos", label: "Todos los estados" },
                { id: "vigente", label: "Solo Curso Vigente (✅)" },
                { id: "proximo", label: "Próximo a Vencer (⚠️)" },
                { id: "vencido", label: "Curso Vencido (❌)" },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCourseFilter(c.id);
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    courseFilter === c.id
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

        {/* Filtro 3: Con Hoja de Vida PDF */}
        <div className="relative filter-dropdown-container shrink-0">
          <button
            type="button"
            onClick={() => setOpenDropdown(openDropdown === "pdf" ? null : "pdf")}
            className={`border rounded-full px-4 py-1.5 text-xs font-medium flex items-center gap-1.5 shadow-2xs transition-all whitespace-nowrap cursor-pointer ${
              pdfFilter !== "todos"
                ? "border-[#005DA4] text-[#005DA4] font-bold bg-[#EAF3FA]"
                : "border-slate-200/90 text-slate-700 bg-white hover:border-[#005DA4]"
            }`}
          >
            <span>
              {pdfFilter === "con_pdf"
                ? "Con HV PDF: Sí"
                : pdfFilter === "sin_pdf"
                ? "Con HV PDF: Sin PDF"
                : "Con Hoja de Vida PDF"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          {openDropdown === "pdf" && (
            <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-30 space-y-1">
              {[
                { id: "todos", label: "Todos los candidatos" },
                { id: "con_pdf", label: "Solo con HV PDF cargada" },
                { id: "sin_pdf", label: "Sin archivo PDF" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setPdfFilter(p.id);
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    pdfFilter === p.id
                      ? "bg-[#EAF3FA] text-[#0B3B70] font-bold"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filtro 4: Ciudad */}
        <div className="relative filter-dropdown-container shrink-0">
          <button
            type="button"
            onClick={() => setOpenDropdown(openDropdown === "city" ? null : "city")}
            className={`border rounded-full px-4 py-1.5 text-xs font-medium flex items-center gap-1.5 shadow-2xs transition-all whitespace-nowrap cursor-pointer ${
              cityFilter
                ? "border-[#005DA4] text-[#005DA4] font-bold bg-[#EAF3FA]"
                : "border-slate-200/90 text-slate-700 bg-white hover:border-[#005DA4]"
            }`}
          >
            <span>{cityFilter ? `Ciudad: ${cityFilter}` : "Ciudad"}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          {openDropdown === "city" && (
            <div className="absolute left-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-30 space-y-1">
              {[
                { id: "", label: "Todas las ciudades" },
                { id: "Bogotá", label: "Bogotá D.C." },
                { id: "Medellín", label: "Medellín" },
                { id: "Cali", label: "Cali" },
                { id: "Barranquilla", label: "Barranquilla" },
                { id: "Santa Marta", label: "Santa Marta" },
                { id: "Bucaramanga", label: "Bucaramanga" },
              ].map((ct) => (
                <button
                  key={ct.id}
                  type="button"
                  onClick={() => {
                    setCityFilter(ct.id);
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    cityFilter === ct.id
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
            onClick={resetFilters}
            className="bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-full px-3 py-1.5 text-xs font-semibold flex items-center gap-1 shadow-2xs whitespace-nowrap transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            <span>Limpiar filtros</span>
          </button>
        )}
      </div>

      {/* 3. VISOR DE RECLUTAMIENTO EN PANTALLA DIVIDIDA (MASTER-DETAIL SHERLOCK HR) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMNA IZQUIERDA: LISTA DE CANDIDATOS (5 COLS) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Caja superior de conteo */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              {filteredCandidates.length} {filteredCandidates.length === 1 ? "Candidato" : "Candidatos"} en esta etapa
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
                {searchTerm || hasActiveFilters
                  ? "Intenta con otro término o limpia los filtros activos."
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
                const isNew = cand.status === "postulado";

                return (
                  <div
                    key={cand.id}
                    onClick={() => handleSelectCandidate(cand)}
                    className={`bg-white rounded-2xl p-5 text-left cursor-pointer transition-all relative ${
                      isSelected
                        ? "border-[1.5px] border-[#005DA4] ring-1 ring-[#005DA4]/15 shadow-sm"
                        : "border border-slate-200 hover:border-slate-300 shadow-2xs"
                    }`}
                  >
                    {/* Botón de tres puntos a la derecha */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectCandidate(cand);
                      }}
                      className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1"
                      title="Opciones del candidato"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Fila 1: Nombre + Match */}
                    <div className="flex items-start justify-between gap-2 pr-6">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-base font-bold text-slate-900 tracking-tight hover:text-[#005DA4] transition-colors">
                            {cand.full_name}
                          </h4>
                        </div>
                        <div className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                          C.C. {cand.national_id} • {cand.years_experience} años exp.
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-mono tabular-nums ${
                            cand.match_score >= 85
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {cand.match_score}% Match
                        </span>
                      </div>
                    </div>

                    {/* Fila 2: Especialidad + Sello BadgeCheck */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold mt-2">
                      <span>{cand.primary_role}</span>
                      <BadgeCheck className="w-4 h-4 text-[#005DA4] shrink-0" strokeWidth={2.5} />
                      <span className="text-[11px] font-semibold text-[#005DA4]">Expediente Verificado</span>
                    </div>

                    {/* Fila 3: Ciudad */}
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{cand.city} {cand.locality ? `• ${cand.locality}` : ""}</span>
                    </div>

                    {/* Fila 4: SEMÁFORO DE COMPATIBILIDAD */}
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
                          HV PDF
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                          Sin PDF
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

                    {/* Fila 5: Pie con Fecha a la izquierda y Estado a la derecha */}
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1 font-normal text-slate-400">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Postulado {formatRelativeDate(cand.applied_at)}</span>
                      </span>

                      {isNew ? (
                        <span className="bg-rose-50 text-rose-600 border border-rose-200 rounded-full px-2.5 py-0.5 text-[10px] font-bold animate-pulse">
                          Nuevo
                        </span>
                      ) : (
                        <span className="border border-slate-300 rounded-full px-2.5 py-0.5 text-[10px] text-slate-500 font-semibold">
                          CV Visto
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: EXPEDIENTE Y ACCIONES 1 CLIC (7 COLS - STICKY TOP-20) */}
        <div className="lg:col-span-7 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto space-y-4">
          {selectedCandidate ? (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-7 shadow-2xs space-y-6">
              {/* Expediente Header Estilo Computrabajo */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#EAF3FA] border border-[#D5E6F5] text-[#0B3B70] flex items-center justify-center font-extrabold text-xl shrink-0 shadow-2xs">
                    {selectedCandidate.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                        {selectedCandidate.full_name}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <Check className="w-3 h-3 text-emerald-600" strokeWidth={3} />
                        Auditado
                      </span>
                    </div>
                    <div className="text-sm text-slate-700 font-bold mt-1">
                      {selectedCandidate.primary_role} • {selectedCandidate.years_experience} años de experiencia
                    </div>
                    <div className="text-xs text-slate-500 font-mono tabular-nums mt-1 flex items-center gap-2">
                      <span>C.C. {selectedCandidate.national_id}</span>
                      <span>•</span>
                      <span>{selectedCandidate.city} {selectedCandidate.locality ? `(${selectedCandidate.locality})` : ""}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-700">{selectedCandidate.phone_whatsapp}</span>
                    </div>

                    {/* Sello azul de verificación */}
                    <div className="pt-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#005DA4] bg-[#EAF3FA] px-3 py-1 rounded-full border border-[#D5E6F5]">
                        <BadgeCheck className="w-4 h-4 text-[#005DA4]" strokeWidth={2.5} />
                        <span>Expediente Verificado • SuperVigilancia</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-start sm:items-end shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Fase del Embudo
                  </span>
                  <select
                    value={selectedCandidate.status}
                    onChange={(e) =>
                      handleStatusChange(selectedCandidate.id, e.target.value as ApplicationStatus)
                    }
                    className="mt-1 rounded-full px-4 py-1.5 text-xs font-bold border border-slate-300 bg-white shadow-2xs focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/10 cursor-pointer"
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

              {/* BARRA DE ACCIÓN PRINCIPAL DEL RECLUTADOR (BOTÓN PÍLDORA #0B3B70 + BOTONES AZUL HIELO #EAF3FA) */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Acciones Rápidas del Reclutador
                </span>
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Botón Principal: Citar a Entrevista */}
                  <button
                    type="button"
                    onClick={() => handleStatusChange(selectedCandidate.id, "citado_entrevista")}
                    className="rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white text-sm font-semibold px-7 py-2.5 inline-flex items-center gap-2 shadow-xs transition-colors"
                  >
                    <Calendar className="w-4 h-4 text-[#FFE066]" strokeWidth={2} />
                    <span>Citar a Entrevista</span>
                  </button>

                  {/* Botón en Azul Hielo: Citar por WhatsApp */}
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
                    <span>WhatsApp</span>
                  </a>

                  {/* Botón en Azul Hielo: Solicitar Polígrafo B2B */}
                  <button
                    type="button"
                    onClick={() => setSelectedCandidateForStudy(selectedCandidate)}
                    className="rounded-full bg-[#EAF3FA] hover:bg-[#D5E6F5] text-[#0B3B70] border border-[#D5E6F5] text-xs font-semibold px-4 py-2.5 inline-flex items-center gap-2 shadow-2xs transition-colors"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-[#005DA4]" strokeWidth={2} />
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

                  {/* Botón Descartar */}
                  <button
                    type="button"
                    onClick={() => handleStatusChange(selectedCandidate.id, "descartado")}
                    className="rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold px-3.5 py-2.5 inline-flex items-center gap-1 shadow-2xs transition-colors"
                    title="Descartar candidato"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Descartar</span>
                  </button>
                </div>
              </div>

              {/* LÍNEA DIVISORIA */}
              <div className="border-t border-slate-200 my-6" />

              {/* SECCIÓN RESUMEN OPERATIVO CON ICONOS LIMPIOS ESTILO COMPUTRABAJO */}
              <div className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">Resumen Operativo</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-700">
                  {/* Item 1: Experiencia */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[#0B3B70] shrink-0">
                      <Briefcase className="w-4 h-4 text-[#005DA4]" />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Experiencia en Seguridad:</span>
                      <strong className="text-xs font-bold text-slate-900">{selectedCandidate.years_experience} años certificados</strong>
                    </div>
                  </div>

                  {/* Item 2: Curso SuperVigilancia */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[#0B3B70] shrink-0">
                      <ShieldCheck className="w-4 h-4 text-[#005DA4]" />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Curso SuperVigilancia:</span>
                      <strong className="text-xs font-bold text-slate-900">
                        {selectedCandidate.course_semaphore === "VIGENTE"
                          ? `Vigente (${selectedCandidate.days_remaining}d)`
                          : "Por Vencer / Vencido"}
                      </strong>
                    </div>
                  </div>

                  {/* Item 3: Libreta Militar */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[#0B3B70] shrink-0">
                      <CreditCard className="w-4 h-4 text-[#005DA4]" />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Libreta Militar:</span>
                      <strong className="text-xs font-bold text-slate-900">
                        {selectedCandidate.has_military_booklet ? "Al Día (Sí)" : "No Posee"}
                      </strong>
                    </div>
                  </div>

                  {/* Item 4: Dotación de Moto */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[#0B3B70] shrink-0">
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
              <div className="p-4 rounded-2xl bg-[#EAF3FA]/50 border border-[#D5E6F5] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#005DA4]" strokeWidth={2} />
                    <span className="text-xs font-bold text-slate-900">
                      Hoja de Vida y Soportes Documentales
                    </span>
                  </div>
                  {selectedCandidate.resume_pdf_url ? (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
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
