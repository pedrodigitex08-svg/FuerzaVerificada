"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  FileCheck2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  Calendar,
  Building2,
  User,
  ExternalLink,
  Download,
  Plus,
  RefreshCw,
  Sparkles,
  BadgeCheck,
  FileText,
  Award,
  Check,
  X,
  Eye,
} from "lucide-react";
import { DemoSecurityOrder, initializeSeedData } from "@/lib/utils/seedData";
import { SecurityStudyStatus } from "@/types/database";
import { AdminStudyDrawerModal } from "@/components/admin/AdminStudyDrawerModal";
import { createClient } from "@/lib/supabase/client";
import { openSecureDocument } from "@/lib/utils/storageSecurity";

interface CandidateVerificationItem {
  user_id: string;
  full_name: string;
  national_id: string;
  phone_whatsapp: string;
  city: string;
  locality?: string;
  primary_role: string;
  years_experience: number;
  is_verified_by_admin: boolean;
  resume_url: string | null;
  diploma_url: string | null;
  cedula_url: string | null;
  judicial_url: string | null;
  medical_url: string | null;
  course_name: string | null;
  academy_name: string | null;
  credential_number: string | null;
}

export default function AdminEstudiosPage() {
  const [activeTab, setActiveTab] = useState<"ordenes" | "candidatos">("ordenes");
  const [orders, setOrders] = useState<DemoSecurityOrder[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrderForDrawer, setSelectedOrderForDrawer] = useState<DemoSecurityOrder | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Candidate validation state
  const [candidateList, setCandidateList] = useState<CandidateVerificationItem[]>([]);
  const [candidateFilter, setCandidateFilter] = useState<"todos" | "verificados" | "sin_validar">("todos");
  const [candidateSearchTerm, setCandidateSearchTerm] = useState("");
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);

  const loadCandidatesFromSupabase = async () => {
    setIsLoadingCandidates(true);
    const supabase = createClient();
    try {
      const { data: candData, error: candError } = await supabase
        .from("candidate_profiles")
        .select("*, profiles(*)")
        .order("updated_at", { ascending: false });

      let localVerifiedMap: Record<string, boolean> = {};
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("fv_verified_candidates");
          if (stored) localVerifiedMap = JSON.parse(stored);
        } catch {}
      }

      if (!candError && candData && candData.length > 0) {
        const userIds = candData.map((c: any) => c.user_id).filter(Boolean);

        const { data: docData } =
          userIds.length > 0
            ? await supabase
                .from("candidate_documents")
                .select("*")
                .in("candidate_id", userIds)
            : { data: [] as any[] };

        const { data: courseData } =
          userIds.length > 0
            ? await supabase
                .from("candidate_courses")
                .select("*")
                .in("candidate_id", userIds)
            : { data: [] as any[] };

        const mapped: CandidateVerificationItem[] = candData.map((c: any) => {
          const uDocs = (docData || []).filter((d: any) => d.candidate_id === c.user_id);
          const uCourses = (courseData || []).filter((cs: any) => cs.candidate_id === c.user_id);
          const latestCourse = uCourses[0] || null;

          const cedulaDoc = uDocs.find((d: any) =>
            ["cedula_ciudadania", "cedula"].includes(d.doc_type || d.document_type)
          );
          const resumeDoc = uDocs.find((d: any) =>
            ["hoja_de_vida_pdf", "hoja_de_vida", "resume"].includes(d.doc_type || d.document_type)
          );
          const diplomaDoc = uDocs.find((d: any) =>
            ["diploma_curso", "diploma", "curso"].includes(d.doc_type || d.document_type)
          );
          const judicialDoc = uDocs.find((d: any) =>
            ["certificado_judicial", "judicial", "antecedentes"].includes(d.doc_type || d.document_type)
          );
          const medicalDoc = uDocs.find((d: any) =>
            ["examen_medico", "medico"].includes(d.doc_type || d.document_type)
          );

          const hasDbVerification = Boolean(
            latestCourse?.is_verified_by_admin || c.is_verified || (c as any).is_verified_by_admin
          );
          const isVerified =
            localVerifiedMap[c.user_id] !== undefined
              ? localVerifiedMap[c.user_id]
              : hasDbVerification;

          return {
            user_id: c.user_id,
            full_name: c.profiles?.full_name || "Aspirante Operativo",
            national_id: c.national_id || "En validación",
            phone_whatsapp: c.profiles?.phone_whatsapp || "Sin registrar",
            city: c.city || "Bogotá D.C.",
            locality: c.locality_neighborhood || undefined,
            primary_role: c.primary_role || "Vigilante Fijo",
            years_experience: c.years_experience || 0,
            is_verified_by_admin: isVerified,
            resume_url: c.resume_pdf_url || resumeDoc?.file_url || null,
            diploma_url:
              latestCourse?.certificate_file_url ||
              latestCourse?.diploma_pdf_url ||
              diplomaDoc?.file_url ||
              null,
            cedula_url: cedulaDoc?.file_url || null,
            judicial_url: judicialDoc?.file_url || null,
            medical_url: medicalDoc?.file_url || null,
            course_name: latestCourse?.course_name || "Curso de Vigilancia Básica",
            academy_name: latestCourse?.academy_name || "Academia de Seguridad",
            credential_number:
              latestCourse?.nro_credencial_supervigilancia ||
              latestCourse?.credential_number ||
              null,
          };
        });

        setCandidateList(mapped);
        setIsLoadingCandidates(false);
        return;
      }
    } catch (err) {
      console.error("Error loading candidate verification in admin:", err);
    }

    // Fallback: check localStorage for any locally registered candidate profile
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("fv_candidate_profile");
        if (saved) {
          const parsed = JSON.parse(saved);
          const storedVer = localStorage.getItem("fv_verified_candidates");
          const map = storedVer ? JSON.parse(storedVer) : {};
          setCandidateList([
            {
              user_id: "local-user-1",
              full_name: parsed.full_name || "Candidato Registrado",
              national_id: parsed.national_id || "1020304050",
              phone_whatsapp: parsed.phone_whatsapp || "3100000000",
              city: parsed.city || "Bogotá D.C.",
              locality: parsed.locality || "Chapinero",
              primary_role: parsed.primary_role || "Vigilante Fijo",
              years_experience: parsed.years_experience || 2,
              is_verified_by_admin: map["local-user-1"] ?? false,
              resume_url: parsed.resume_pdf_url || null,
              diploma_url: parsed.diploma_pdf_url || null,
              cedula_url: parsed.cedula_pdf_url || null,
              judicial_url: null,
              medical_url: null,
              course_name: parsed.course_name || "Fundamentación Vigilancia",
              academy_name: parsed.academy_name || "Academia Nacional de Seguridad",
              credential_number: parsed.credencial_supervigilancia || "CR-99281",
            },
          ]);
          setIsLoadingCandidates(false);
          return;
        }
      } catch {}
    }

    setCandidateList([]);
    setIsLoadingCandidates(false);
  };

  const handleToggleCandidateVerification = async (cand: CandidateVerificationItem) => {
    const nextStatus = !cand.is_verified_by_admin;

    setCandidateList((prev) =>
      prev.map((c) =>
        c.user_id === cand.user_id ? { ...c, is_verified_by_admin: nextStatus } : c
      )
    );

    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("fv_verified_candidates");
        const map = stored ? JSON.parse(stored) : {};
        map[cand.user_id] = nextStatus;
        localStorage.setItem("fv_verified_candidates", JSON.stringify(map));
      } catch {}
    }

    try {
      const supabase = createClient();
      await supabase
        .from("candidate_courses")
        .update({ is_verified_by_admin: nextStatus })
        .eq("candidate_id", cand.user_id);

      await supabase
        .from("candidate_profiles")
        .update({ updated_at: new Date().toISOString() })
        .eq("user_id", cand.user_id);
    } catch (err) {
      console.error("Error saving verification in Supabase:", err);
    }

    setNotification(
      nextStatus
        ? `¡Sello de Perfil Verificado OTORGADO a ${cand.full_name}! Insignia oficial visible para empresas.`
        : `Sello de Verificación REVOCADO para ${cand.full_name}.`
    );
    setTimeout(() => setNotification(null), 4000);
  };

  const loadOrdersFromSupabase = async () => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("security_study_orders")
        .select("*, companies(*), profiles(*)")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const candIds = data.map((s: any) => s.candidate_id).filter(Boolean);
        const { data: candProfs } =
          candIds.length > 0
            ? await supabase
                .from("candidate_profiles")
                .select("user_id, national_id, city, locality_neighborhood, resume_pdf_url")
                .in("user_id", candIds)
            : { data: [] as any[] };
        const candMap = new Map(
          (candProfs || []).map((cp: any) => [cp.user_id, cp])
        );

        const mapped: DemoSecurityOrder[] = data.map((s: any) => {
          const cp = candMap.get(s.candidate_id);
          return {
            id: s.id,
            company_id: s.company_id,
            company_name: s.companies?.company_name || "Empresa Solicitante",
            company_phone: s.companies?.contact_phone || "3150000000",
            candidate_id: s.candidate_id,
            candidate_name: s.profiles?.full_name || "Aspirante",
            candidate_phone: s.profiles?.phone_whatsapp || "3000000000",
            candidate_address:
              cp?.locality_neighborhood && cp?.city
                ? `${cp.locality_neighborhood}, ${cp.city}`
                : cp?.city || "Por confirmar",
            national_id: cp?.national_id || "En verificación",
            job_title: s.study_type
              ? s.study_type.replace(/_/g, " ").toUpperCase()
              : "Estudio Integral",
            study_type: s.study_type || "combo_integral_poligrafo_visita",
            status: (s.status as SecurityStudyStatus) || "solicitado",
            scheduled_date: s.scheduled_date || "Por agendar",
            final_concept: s.final_concept || "",
            report_pdf_url: s.report_pdf_url || null,
            resume_pdf_url: cp?.resume_pdf_url || null,
            course_diploma_url: null,
            include_polygraph: true,
            include_home_visit: true,
            include_background_study: true,
            created_at: s.created_at,
          };
        });
        setOrders(mapped);
        return;
      }
    } catch {}

    const { orders: seededOrders } = initializeSeedData(false);
    setOrders(seededOrders);
  };

  useEffect(() => {
    loadOrdersFromSupabase();
    loadCandidatesFromSupabase();
  }, []);

  // Save updated order to Supabase & localStorage
  const handleSaveOrder = async (updated: DemoSecurityOrder) => {
    const updatedList = orders.map((o) => (o.id === updated.id ? updated : o));
    setOrders(updatedList);
    if (typeof window !== "undefined") {
      localStorage.setItem("fv_security_orders", JSON.stringify(updatedList));
    }

    try {
      const supabase = createClient();
      await supabase
        .from("security_study_orders")
        .update({
          status: updated.status,
          scheduled_date: updated.scheduled_date,
          final_concept: updated.final_concept,
          report_pdf_url: updated.report_pdf_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", updated.id);
    } catch {}

    setNotification(
      `¡Orden #${updated.id} actualizada en Supabase! El dictamen ya está disponible para ${updated.company_name}.`
    );
    setTimeout(() => setNotification(null), 4000);
  };

  // KPI calculations (Órdenes)
  const totalOrders = orders.length;
  const pendingScheduling = orders.filter((o) => o.status === "solicitado").length;
  const inEvaluation = orders.filter((o) => o.status === "agendado" || o.status === "en_proceso").length;
  const completedApproved = orders.filter((o) => o.status === "aprobado").length;
  const completedRejected = orders.filter((o) => o.status === "rechazado_riesgo").length;

  // Filtered orders list
  const filteredOrders = orders.filter((order) => {
    const matchesFilter = selectedFilter === "todos" || order.status === selectedFilter;
    const matchesSearch =
      order.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.national_id.includes(searchTerm) ||
      order.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.job_title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // KPI calculations (Candidatos)
  const totalCandidates = candidateList.length;
  const verifiedCandidates = candidateList.filter((c) => c.is_verified_by_admin).length;
  const unverifiedCandidates = candidateList.filter((c) => !c.is_verified_by_admin).length;
  const candidatesWithDocs = candidateList.filter(
    (c) => c.resume_url || c.diploma_url || c.cedula_url || c.judicial_url || c.medical_url
  ).length;

  // Filtered candidates list
  const filteredCandidates = candidateList.filter((cand) => {
    const matchesFilter =
      candidateFilter === "todos" ||
      (candidateFilter === "verificados" && cand.is_verified_by_admin) ||
      (candidateFilter === "sin_validar" && !cand.is_verified_by_admin);
    const matchesSearch =
      cand.full_name.toLowerCase().includes(candidateSearchTerm.toLowerCase()) ||
      cand.national_id.includes(candidateSearchTerm) ||
      cand.primary_role.toLowerCase().includes(candidateSearchTerm.toLowerCase()) ||
      cand.city.toLowerCase().includes(candidateSearchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: SecurityStudyStatus) => {
    switch (status) {
      case "solicitado":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Solicitado
          </span>
        );
      case "agendado":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Agendado
          </span>
        );
      case "en_proceso":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            En Proceso
          </span>
        );
      case "aprobado":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Aprobado Sin Riesgo
          </span>
        );
      case "rechazado_riesgo":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Riesgo Identificado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center justify-between border border-slate-800 shadow-elevated animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white text-xs ml-4"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Bandeja Operativa: Estudios de Seguridad y Validación de Personal
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            Gestión de investigaciones de antecedentes, poligrafía B2B y validación documental oficial para otorgar sello a guardas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              await Promise.all([loadOrdersFromSupabase(), loadCandidatesFromSupabase()]);
              setNotification("Bandeja operativa sincronizada con Supabase.");
              setTimeout(() => setNotification(null), 3000);
            }}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            title="Recargar órdenes y candidatos"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
            <span>Sincronizar</span>
          </button>
        </div>
      </div>

      {/* MODULE TABS: ESTUDIOS B2B vs VALIDACIÓN CANDIDATOS */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("ordenes")}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "ordenes"
              ? "border-amber-500 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Shield className="w-4 h-4 text-amber-500" strokeWidth={1.75} />
          <span>Órdenes de Poligrafía & Visitas</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {totalOrders}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("candidatos")}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "candidatos"
              ? "border-amber-500 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BadgeCheck className="w-4 h-4 text-emerald-600" strokeWidth={1.75} />
          <span>Validación de Candidatos & Documentos</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {totalCandidates}
          </span>
        </button>
      </div>

      {/* TAB 1: ÓRDENES DE ESTUDIOS DE SEGURIDAD */}
      {activeTab === "ordenes" && (
        <div className="space-y-6">
          {/* KPI BENTO GRID */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total Órdenes</span>
                <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
                  <FileCheck2 className="w-4 h-4" strokeWidth={1.75} />
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
                {totalOrders}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Radicadas por empresas</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Por Agendar</span>
                <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <Clock className="w-4 h-4" strokeWidth={1.75} />
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold text-blue-600 tabular-nums">
                {pendingScheduling}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Requieren cita inmediata</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">En Evaluación</span>
                <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                  <Shield className="w-4 h-4" strokeWidth={1.75} />
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold text-amber-600 tabular-nums">
                {inEvaluation}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">En polígrafo o visita</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Dictámenes Listos</span>
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold text-emerald-600 tabular-nums">
                {completedApproved}{" "}
                <span className="text-xs font-normal text-rose-500">({completedRejected} no aptos)</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Informes emitidos</p>
            </div>
          </div>

          {/* FILTER & SEARCH BAR */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                  strokeWidth={1.75}
                />
                <input
                  type="text"
                  placeholder="Buscar por candidato, cédula, empresa o cargo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                />
              </div>

              {/* Status Filter Chips */}
              <div className="flex flex-wrap gap-1.5 text-xs">
                {[
                  { id: "todos", label: "Todos", count: totalOrders },
                  { id: "solicitado", label: "Solicitados", count: pendingScheduling },
                  { id: "agendado", label: "Agendados", count: orders.filter((o) => o.status === "agendado").length },
                  { id: "en_proceso", label: "En Proceso", count: orders.filter((o) => o.status === "en_proceso").length },
                  { id: "aprobado", label: "Aprobados", count: completedApproved },
                  { id: "rechazado_riesgo", label: "Con Riesgo", count: completedRejected },
                ].map((chip) => {
                  const active = selectedFilter === chip.id;
                  return (
                    <button
                      key={chip.id}
                      onClick={() => setSelectedFilter(chip.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        active
                          ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span>{chip.label}</span>
                      <span
                        className={`ml-1.5 text-[10px] tabular-nums font-mono px-1.5 py-0.2 rounded ${
                          active ? "bg-slate-800 text-amber-300" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {chip.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* HIGH DENSITY ORDERS TABLE */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Candidato / Documento</th>
                    <th className="py-3 px-4">Empresa Solicitante</th>
                    <th className="py-3 px-4">Alcance</th>
                    <th className="py-3 px-4">Estado del Estudio</th>
                    <th className="py-3 px-4">Cita / Avance</th>
                    <th className="py-3 px-4">Informe PDF</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No se encontraron órdenes para este filtro o criterio de búsqueda.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrderForDrawer(order)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        {/* Candidate */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {order.candidate_name}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            CC. {order.national_id} • {order.job_title}
                          </div>
                        </td>

                        {/* Company */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {order.company_name}
                          </div>
                        </td>

                        {/* Scope */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                              Antecedentes
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                              Visita
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200/60">
                              Polígrafo
                            </span>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {getStatusBadge(order.status)}
                        </td>

                        {/* Scheduled Date / Progress */}
                        <td className="py-3 px-4 text-slate-600 max-w-xs">
                          <div className="truncate text-xs font-medium">
                            {order.scheduled_date || "Por agendar"}
                          </div>
                        </td>

                        {/* PDF Report */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {order.report_pdf_url ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openSecureDocument(order.report_pdf_url);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Descargar PDF</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-normal">
                              Pendiente
                            </span>
                          )}
                        </td>

                        {/* Action Button */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrderForDrawer(order);
                            }}
                            className="btn-secondary text-[11px] py-1 px-3 group-hover:border-slate-400"
                          >
                            Gestionar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VALIDACIÓN DE CANDIDATOS Y DOCUMENTOS */}
      {activeTab === "candidatos" && (
        <div className="space-y-6">
          {/* CANDIDATES KPI BENTO GRID */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total Candidatos</span>
                <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
                  <User className="w-4 h-4" strokeWidth={1.75} />
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
                {totalCandidates}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Registrados en la plataforma</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Perfiles Verificados</span>
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <BadgeCheck className="w-4 h-4" strokeWidth={1.75} />
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold text-emerald-600 tabular-nums">
                {verifiedCandidates}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Con sello oficial activo</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Sin Validar</span>
                <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                  <Clock className="w-4 h-4" strokeWidth={1.75} />
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold text-amber-600 tabular-nums">
                {unverifiedCandidates}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Pendientes de revisión</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Con Documentos</span>
                <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <FileText className="w-4 h-4" strokeWidth={1.75} />
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold text-blue-600 tabular-nums">
                {candidatesWithDocs}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Archivos adjuntos cargados</p>
            </div>
          </div>

          {/* CANDIDATES FILTER & SEARCH BAR */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                  strokeWidth={1.75}
                />
                <input
                  type="text"
                  placeholder="Buscar por nombre, cédula, cargo o ciudad..."
                  value={candidateSearchTerm}
                  onChange={(e) => setCandidateSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                />
              </div>

              {/* Status Filter Chips */}
              <div className="flex flex-wrap gap-1.5 text-xs">
                {[
                  { id: "todos", label: "Todos", count: totalCandidates },
                  { id: "verificados", label: "Verificados", count: verifiedCandidates },
                  { id: "sin_validar", label: "Sin Validar", count: unverifiedCandidates },
                ].map((chip) => {
                  const active = candidateFilter === chip.id;
                  return (
                    <button
                      key={chip.id}
                      onClick={() => setCandidateFilter(chip.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        active
                          ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span>{chip.label}</span>
                      <span
                        className={`ml-1.5 text-[10px] tabular-nums font-mono px-1.5 py-0.2 rounded ${
                          active ? "bg-slate-800 text-amber-300" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {chip.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CANDIDATES VERIFICATION TABLE */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Candidato / Identificación</th>
                    <th className="py-3 px-4">Curso de Seguridad</th>
                    <th className="py-3 px-4">Documentos Verificables</th>
                    <th className="py-3 px-4">Sello Oficial</th>
                    <th className="py-3 px-4 text-right">Acción de Validación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        {isLoadingCandidates
                          ? "Cargando postulantes y documentos desde Supabase..."
                          : "No se encontraron candidatos para este criterio de búsqueda."}
                      </td>
                    </tr>
                  ) : (
                    filteredCandidates.map((cand) => (
                      <tr
                        key={cand.user_id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* Candidate & ID */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{cand.full_name}</span>
                            {cand.is_verified_by_admin && (
                              <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            CC. {cand.national_id} • {cand.primary_role}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {cand.city} {cand.locality ? `(${cand.locality})` : ""} • Tel: {cand.phone_whatsapp}
                          </div>
                        </td>

                        {/* Course & Credential */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">
                            {cand.course_name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {cand.academy_name}
                          </div>
                          <div className="text-[10px] text-amber-700 font-mono mt-0.5">
                            Credencial: {cand.credential_number || "Por validar"}
                          </div>
                        </td>

                        {/* Verifiable Documents Links */}
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {cand.cedula_url ? (
                              <button
                                type="button"
                                onClick={() => openSecureDocument(cand.cedula_url)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200/60"
                                title="Ver documento de identidad"
                              >
                                <FileText className="w-3 h-3" />
                                <span>Cédula</span>
                              </button>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">
                                Sin Cédula
                              </span>
                            )}

                            {cand.resume_url ? (
                              <button
                                type="button"
                                onClick={() => openSecureDocument(cand.resume_url)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200/60"
                                title="Ver hoja de vida"
                              >
                                <Download className="w-3 h-3" />
                                <span>Hoja de Vida</span>
                              </button>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">
                                Sin HV
                              </span>
                            )}

                            {cand.diploma_url ? (
                              <button
                                type="button"
                                onClick={() => openSecureDocument(cand.diploma_url)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors border border-amber-200/60"
                                title="Ver diploma de curso"
                              >
                                <Award className="w-3 h-3" />
                                <span>Diploma</span>
                              </button>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">
                                Sin Diploma
                              </span>
                            )}

                            {cand.judicial_url && (
                              <button
                                type="button"
                                onClick={() => openSecureDocument(cand.judicial_url)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200/60"
                                title="Ver antecedentes judiciales"
                              >
                                <Shield className="w-3 h-3" />
                                <span>Judicial</span>
                              </button>
                            )}

                            {cand.medical_url && (
                              <button
                                type="button"
                                onClick={() => openSecureDocument(cand.medical_url)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors border border-rose-200/60"
                                title="Ver examen médico"
                              >
                                <FileCheck2 className="w-3 h-3" />
                                <span>Médico</span>
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Verification Status Badge */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {cand.is_verified_by_admin ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                              Perfil Verificado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              Sin Validar
                            </span>
                          )}
                        </td>

                        {/* Action Button */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {cand.is_verified_by_admin ? (
                            <button
                              type="button"
                              onClick={() => handleToggleCandidateVerification(cand)}
                              className="btn-secondary text-[11px] py-1 px-3 text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-colors inline-flex items-center gap-1"
                              title="Revocar sello de verificación"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Revocar Sello</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleCandidateVerification(cand)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] py-1 px-3 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1"
                              title="Validar antecedentes y otorgar sello oficial"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Otorgar Sello</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER MODAL FOR MANAGING AND QUALIFYING STUDY */}
      <AdminStudyDrawerModal
        order={selectedOrderForDrawer}
        onClose={() => setSelectedOrderForDrawer(null)}
        onSaveOrder={handleSaveOrder}
      />
    </div>
  );
}
