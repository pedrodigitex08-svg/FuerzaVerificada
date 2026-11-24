"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Users,
  Search,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ExternalLink,
  FileText,
  CreditCard,
  Award,
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  GraduationCap,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Scale,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatSecurityRoleLabel } from "@/lib/utils/roleNormalizer";
import { openSecureDocument } from "@/lib/utils/storageSecurity";
import { findDepartmentByCity } from "@/lib/constants/colombiaSecurityCatalog";

type VerificationStatusKey = "pendiente" | "aprobado" | "rechazado";
type TabFilterKey = "pendiente" | "aprobado" | "rechazado" | "todos";

interface SecurityCourseEntry {
  id?: string;
  courseName: string;
  academyName: string;
  completionDate?: string;
  hasSimetric: boolean;
  simetricNumber?: string;
}

interface DiplomaEntry {
  id?: string;
  name: string;
  url: string;
}

interface CandidateAuditRecord {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  avatar_url: string | null;
  created_at: string | null;
  national_id: string;
  department: string;
  city: string;
  locality: string;
  primary_role: string;
  selected_roles: string[];
  years_experience: number;
  education_level: string;
  has_military_booklet: boolean;
  has_simetric_course: boolean;
  simetric_course_number: string;
  security_courses: SecurityCourseEntry[];
  has_legacy_courses: boolean;
  // Bóveda documental
  document_cedula_url: string | null;
  document_cv_url: string | null;
  document_libreta_url: string | null;
  diplomas: DiplomaEntry[];
  // Estado de verificación
  is_verified: boolean;
  verification_status: VerificationStatusKey;
  verification_notes: string | null;
  verified_at: string | null;
  verified_by: string | null;
}

const OFFICIAL_BACKGROUND_PORTALS = [
  {
    name: "Policía Nacional",
    url: "https://antecedentes.policia.gov.co:7005/WebJudicial/",
  },
  {
    name: "Procuraduría",
    url: "https://www.procuraduria.gov.co/Pages/Consulta-de-Antecedentes.aspx",
  },
  {
    name: "Contraloría",
    url: "https://www.contraloria.gov.co/web/guest/persona-natural",
  },
  {
    name: "RNMC (Medidas Correctivas)",
    url: "https://srvcnpc.policia.gov.co/PSC/frm_cnp_consulta.aspx",
  },
  {
    name: "SuperVigilancia / SIMETRIC",
    url: "https://www.supervigilancia.gov.co/",
  },
];

const QUICK_REJECTION_REASONS = [
  "Cédula ilegible o incompleta, por favor volver a subir",
  "Falta certificado de curso de seguridad SIMETRIC vigente",
  "No supera validación de antecedentes oficiales",
  "Hoja de vida incompleta o sin soportes legibles",
];

function cleanColombianPhone(rawPhone?: string | null): string {
  const digits = String(rawPhone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("57") && digits.length > 10) return digits.slice(2);
  return digits;
}

function formatDateEs(isoDate?: string | null): string {
  if (!isoDate) return "Sin fecha";
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function normalizeStr(val?: string | null): string {
  if (!val) return "";
  return val
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export default function AdminVerificacionPage() {
  const [candidates, setCandidates] = useState<CandidateAuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabFilterKey>("pendiente");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);

  // Toast de feedback
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Modal de rechazo / solicitud de corrección
  const [rejectModalCandidate, setRejectModalCandidate] =
    useState<CandidateAuditRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  }, []);

  const loadCandidates = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentAdminId(user.id);
      }

      // 1. Consultar public.candidate_profiles
      const { data: candRows, error: candErr } = await supabase
        .from("candidate_profiles")
        .select("*")
        .order("updated_at", { ascending: false });

      if (candErr) {
        throw new Error(
          `No se pudo leer public.candidate_profiles: ${candErr.message}`
        );
      }

      const rawCands = Array.isArray(candRows) ? candRows : [];
      if (rawCands.length === 0) {
        setCandidates([]);
        setIsLoading(false);
        return;
      }

      const userIds = rawCands
        .map((c: any) => c.user_id)
        .filter((id: unknown): id is string => typeof id === "string" && id.length > 0);

      // 2. Cruzar con public.profiles
      const { data: profRows } =
        userIds.length > 0
          ? await supabase
              .from("profiles")
              .select("*")
              .in("id", userIds)
          : { data: [] as any[] };
      const profMap = new Map((profRows || []).map((p: any) => [p.id, p]));

      // 3. Cruzar con public.candidate_courses
      const { data: courseRows } =
        userIds.length > 0
          ? await supabase
              .from("candidate_courses")
              .select("*")
              .in("candidate_id", userIds)
              .order("completion_date", { ascending: false })
          : { data: [] as any[] };
      const coursesByUser = new Map<string, any[]>();
      (courseRows || []).forEach((cs: any) => {
        const list = coursesByUser.get(cs.candidate_id) || [];
        list.push(cs);
        coursesByUser.set(cs.candidate_id, list);
      });

      // 4. Respaldo de soportes en public.candidate_documents
      const { data: docRows } =
        userIds.length > 0
          ? await supabase
              .from("candidate_documents")
              .select("*")
              .in("candidate_id", userIds)
          : { data: [] as any[] };
      const docsByUser = new Map<string, any[]>();
      (docRows || []).forEach((d: any) => {
        const list = docsByUser.get(d.candidate_id) || [];
        list.push(d);
        docsByUser.set(d.candidate_id, list);
      });

      const mapped: CandidateAuditRecord[] = rawCands.map((cp: any) => {
        const uid = cp.user_id;
        const prof = profMap.get(uid) || {};
        const legacyCourses = coursesByUser.get(uid) || [];
        const legacyDocs = docsByUser.get(uid) || [];

        const legacyCv = legacyDocs.find((d: any) =>
          ["hoja_de_vida_pdf", "hoja_de_vida", "resume"].includes(
            String(d.doc_type || d.document_type || "").toLowerCase()
          )
        );
        const legacyCedula = legacyDocs.find((d: any) =>
          ["cedula_ciudadania", "cedula"].includes(
            String(d.doc_type || d.document_type || "").toLowerCase()
          )
        );
        const legacyLibreta = legacyDocs.find((d: any) =>
          ["libreta_militar", "libreta"].includes(
            String(d.doc_type || d.document_type || "").toLowerCase()
          )
        );
        const legacyDiplomas = legacyDocs.filter((d: any) =>
          ["diploma_curso", "diploma", "curso"].includes(
            String(d.doc_type || d.document_type || "").toLowerCase()
          )
        );

        // Diplomas consolidados
        const diplomas: DiplomaEntry[] = [];
        if (Array.isArray(cp.document_diplomas_list) && cp.document_diplomas_list.length > 0) {
          cp.document_diplomas_list.forEach((d: any, idx: number) => {
            if (d?.url) {
              diplomas.push({
                id: d.id || `dip_${idx}`,
                name: d.name || `Diploma / Certificado #${idx + 1}`,
                url: d.url,
              });
            }
          });
        } else if (cp.document_diplomas_url) {
          diplomas.push({
            id: "dip_main",
            name: "Diploma / Certificado Principal",
            url: cp.document_diplomas_url,
          });
        } else {
          legacyDiplomas.forEach((d: any, idx: number) => {
            if (d?.file_url) {
              diplomas.push({
                id: d.id || `legacy_dip_${idx}`,
                name: d.file_name || `Diploma #${idx + 1}`,
                url: d.file_url,
              });
            }
          });
        }

        // Cursos de seguridad consolidados
        const securityCourses: SecurityCourseEntry[] = [];
        if (Array.isArray(cp.security_courses) && cp.security_courses.length > 0) {
          cp.security_courses.forEach((sc: any, idx: number) => {
            securityCourses.push({
              id: sc.id || `sc_${idx}`,
              courseName:
                sc.courseName || sc.course_name || sc.name || "Curso de Seguridad",
              academyName:
                sc.academyName || sc.academy_name || sc.academy || "Academia acreditada",
              completionDate: sc.completionDate || sc.completion_date || "",
              hasSimetric: Boolean(
                sc.hasSimetricCourse ?? sc.has_simetric_course ?? sc.has_simetric ?? false
              ),
              simetricNumber:
                sc.simetricCourseNumber || sc.simetric_course_number || "",
            });
          });
        } else if (legacyCourses.length > 0) {
          legacyCourses.forEach((lc: any, idx: number) => {
            securityCourses.push({
              id: lc.id || `lc_${idx}`,
              courseName: lc.course_name || "Curso de Vigilancia",
              academyName: lc.academy_name || "Academia SuperVigilancia",
              completionDate: lc.completion_date || "",
              hasSimetric: Boolean(lc.nro_credencial_supervigilancia),
              simetricNumber: lc.nro_credencial_supervigilancia || "",
            });
          });
        }

        // Roles / especialidades
        const selectedRoles: string[] =
          Array.isArray(cp.selected_roles) && cp.selected_roles.length > 0
            ? cp.selected_roles
                .filter((r: unknown): r is string => typeof r === "string")
                .map((r: string) => formatSecurityRoleLabel(r))
            : cp.primary_role
            ? [formatSecurityRoleLabel(cp.primary_role)]
            : ["Guarda de seguridad"];

        // Normalización de estado de verificación
        let resolvedStatus: VerificationStatusKey = "pendiente";
        if (
          cp.verification_status === "aprobado" ||
          (cp.is_verified === true && cp.verification_status !== "rechazado")
        ) {
          resolvedStatus = "aprobado";
        } else if (cp.verification_status === "rechazado") {
          resolvedStatus = "rechazado";
        } else {
          resolvedStatus = "pendiente";
        }

        const candCity = cp.city || "Bogotá D.C.";
        const candDept = cp.department || findDepartmentByCity(candCity);

        return {
          user_id: uid,
          full_name:
            prof.full_name || cp.full_name || "Aspirante sin nombre",
          email: prof.email || cp.email || "Sin correo registrado",
          phone: prof.phone_whatsapp || prof.phone || cp.phone || "",
          avatar_url: prof.avatar_url || cp.avatar_url || null,
          created_at: prof.created_at || cp.created_at || cp.updated_at || null,
          national_id: cp.national_id || "Sin cédula",
          department: candDept,
          city: candCity,
          locality: cp.locality_neighborhood || cp.locality || "",
          primary_role: formatSecurityRoleLabel(
            cp.primary_role || selectedRoles[0] || "Guarda de seguridad"
          ),
          selected_roles: Array.from(new Set(selectedRoles)).slice(0, 5),
          years_experience: Number(cp.years_experience ?? 0),
          education_level: cp.education_level || "Sin registrar",
          has_military_booklet: Boolean(cp.has_military_booklet),
          has_simetric_course: Boolean(
            cp.has_simetric_course ||
              securityCourses.some((sc) => sc.hasSimetric)
          ),
          simetric_course_number:
            cp.simetric_course_number ||
            securityCourses.find((sc) => sc.simetricNumber)?.simetricNumber ||
            "",
          security_courses: securityCourses,
          has_legacy_courses: legacyCourses.length > 0,
          document_cedula_url:
            cp.document_cedula_url || legacyCedula?.file_url || null,
          document_cv_url:
            cp.document_cv_url ||
            cp.resume_pdf_url ||
            legacyCv?.file_url ||
            null,
          document_libreta_url:
            cp.document_libreta_url || legacyLibreta?.file_url || null,
          diplomas,
          is_verified: resolvedStatus === "aprobado",
          verification_status: resolvedStatus,
          verification_notes: cp.verification_notes || null,
          verified_at: cp.verified_at || null,
          verified_by: cp.verified_by || null,
        };
      });

      setCandidates(mapped);
    } catch (err: any) {
      console.error("Error cargando Centro de Verificación:", err);
      showToast(
        "error",
        err?.message || "Error al cargar los candidatos desde Supabase."
      );
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  // Copiar cédula en 1 clic
  const handleCopyNationalId = async (cand: CandidateAuditRecord) => {
    if (!cand.national_id) return;
    try {
      await navigator.clipboard.writeText(cand.national_id);
      setCopiedUserId(cand.user_id);
      setTimeout(() => setCopiedUserId(null), 2000);
    } catch {}
  };

  // Aprobar candidato en 1 clic
  const handleApproveCandidate = async (cand: CandidateAuditRecord) => {
    setProcessingUserId(cand.user_id);
    const supabase = createClient();
    const nowIso = new Date().toISOString();

    try {
      const { error: updateErr } = await supabase
        .from("candidate_profiles")
        .update({
          is_verified: true,
          verification_status: "aprobado",
          verification_notes: null,
          verified_at: nowIso,
          verified_by: currentAdminId,
          updated_at: nowIso,
        } as any)
        .eq("user_id", cand.user_id);

      if (updateErr) {
        throw new Error(updateErr.message);
      }

      // Sincronizar candidate_courses si el candidato tiene registros
      if (cand.has_legacy_courses) {
        await supabase
          .from("candidate_courses")
          .update({ is_verified_by_admin: true })
          .eq("candidate_id", cand.user_id);
      }

      setCandidates((prev) =>
        prev.map((c) =>
          c.user_id === cand.user_id
            ? {
                ...c,
                is_verified: true,
                verification_status: "aprobado",
                verification_notes: null,
                verified_at: nowIso,
                verified_by: currentAdminId,
              }
            : c
        )
      );

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("fv_verificacion_updated"));
      }
      showToast(
        "success",
        `Candidato ${cand.full_name} APROBADO y verificado exitosamente.`
      );
    } catch (err: any) {
      console.error("Error aprobando candidato:", err);
      showToast(
        "error",
        `Error al aprobar a ${cand.full_name}: ${
          err?.message || "Verifica permisos RLS en public.candidate_profiles."
        }`
      );
    } finally {
      setProcessingUserId(null);
    }
  };

  // Confirmar rechazo / solicitud de corrección
  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalCandidate) return;

    const cleanReason = rejectionReason.trim();
    if (!cleanReason) {
      setRejectionError(
        "Debes escribir un motivo obligatorio para rechazar o pedir corrección."
      );
      return;
    }

    const cand = rejectModalCandidate;
    setProcessingUserId(cand.user_id);
    setRejectionError(null);
    const supabase = createClient();
    const nowIso = new Date().toISOString();

    try {
      const { error: updateErr } = await supabase
        .from("candidate_profiles")
        .update({
          is_verified: false,
          verification_status: "rechazado",
          verification_notes: cleanReason,
          verified_at: null,
          verified_by: currentAdminId,
          updated_at: nowIso,
        } as any)
        .eq("user_id", cand.user_id);

      if (updateErr) {
        throw new Error(updateErr.message);
      }

      if (cand.has_legacy_courses) {
        await supabase
          .from("candidate_courses")
          .update({ is_verified_by_admin: false })
          .eq("candidate_id", cand.user_id);
      }

      setCandidates((prev) =>
        prev.map((c) =>
          c.user_id === cand.user_id
            ? {
                ...c,
                is_verified: false,
                verification_status: "rechazado",
                verification_notes: cleanReason,
                verified_at: null,
                verified_by: currentAdminId,
              }
            : c
        )
      );

      setRejectModalCandidate(null);
      setRejectionReason("");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("fv_verificacion_updated"));
      }
      showToast(
        "success",
        `Candidato ${cand.full_name} marcado como Rechazado / Con Novedad.`
      );
    } catch (err: any) {
      console.error("Error rechazando candidato:", err);
      showToast(
        "error",
        `Error al rechazar a ${cand.full_name}: ${
          err?.message || "Verifica permisos RLS en public.candidate_profiles."
        }`
      );
    } finally {
      setProcessingUserId(null);
    }
  };

  // Volver candidato a estado pendiente para reevaluación
  const handleResetToPending = async (cand: CandidateAuditRecord) => {
    setProcessingUserId(cand.user_id);
    const supabase = createClient();
    const nowIso = new Date().toISOString();

    try {
      const { error: updateErr } = await supabase
        .from("candidate_profiles")
        .update({
          is_verified: false,
          verification_status: "pendiente",
          verification_notes: null,
          verified_at: null,
          verified_by: currentAdminId,
          updated_at: nowIso,
        } as any)
        .eq("user_id", cand.user_id);

      if (updateErr) {
        throw new Error(updateErr.message);
      }

      if (cand.has_legacy_courses) {
        await supabase
          .from("candidate_courses")
          .update({ is_verified_by_admin: false })
          .eq("candidate_id", cand.user_id);
      }

      setCandidates((prev) =>
        prev.map((c) =>
          c.user_id === cand.user_id
            ? {
                ...c,
                is_verified: false,
                verification_status: "pendiente",
                verification_notes: null,
                verified_at: null,
                verified_by: currentAdminId,
              }
            : c
        )
      );

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("fv_verificacion_updated"));
      }
      showToast(
        "success",
        `Candidato ${cand.full_name} devuelto a estado Pendiente para reevaluación.`
      );
    } catch (err: any) {
      console.error("Error devolviendo a pendiente:", err);
      showToast(
        "error",
        `Error al actualizar estado: ${err?.message || "Error en Supabase"}`
      );
    } finally {
      setProcessingUserId(null);
    }
  };

  // KPIs en tiempo real
  const kpis = useMemo(() => {
    const total = candidates.length;
    const pendientes = candidates.filter(
      (c) => c.verification_status === "pendiente"
    ).length;
    const aprobados = candidates.filter(
      (c) => c.verification_status === "aprobado"
    ).length;
    const rechazados = candidates.filter(
      (c) => c.verification_status === "rechazado"
    ).length;
    return { total, pendientes, aprobados, rechazados };
  }, [candidates]);

  // Filtrado por pestaña y buscador en tiempo real
  const filteredCandidates = useMemo(() => {
    const q = normalizeStr(searchTerm);
    return candidates.filter((cand) => {
      if (activeTab !== "todos" && cand.verification_status !== activeTab) {
        return false;
      }
      if (q) {
        const haystack = normalizeStr(
          `${cand.full_name} ${cand.national_id} ${cand.email} ${cand.city} ${cand.department} ${cand.primary_role}`
        );
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [candidates, activeTab, searchTerm]);

  return (
    <div className="space-y-6 pb-12">
      {/* Cabecera Principal */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Centro de Verificación de Antecedentes
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#005DA4] bg-[#EAF3FA] border border-[#D5E6F5] px-2.5 py-0.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              Auditoría SuperAdmin
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Audita soportes documentales, verifica antecedentes en portales oficiales de Colombia y otorga o revoca el sello de candidato verificado.
          </p>
        </div>

        <button
          type="button"
          onClick={loadCandidates}
          disabled={isLoading}
          className="rounded-full bg-[#EAF3FA] hover:bg-[#D5E6F5] text-[#0B3B70] border border-[#D5E6F5] text-xs h-10 px-5 font-semibold inline-flex items-center gap-2 transition-colors shadow-2xs self-start sm:self-center cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Actualizar bandeja</span>
        </button>
      </div>

      {/* Toast de confirmación o error */}
      {toast && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 shadow-md border ${
            toast.type === "success"
              ? "bg-[#0B3B70] text-white border-slate-700"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-[11px] underline shrink-0 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* TARJETAS KPI SUPERIORES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab("todos")}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex items-center justify-between text-left hover:border-slate-300 transition-all cursor-pointer"
        >
          <div>
            <span className="text-xs font-semibold text-slate-500 block">
              Total Inscritos
            </span>
            <span className="text-2xl font-bold font-mono text-[#0B3B70] tabular-nums mt-1 block">
              {kpis.total}
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#EAF3FA] border border-[#D5E6F5] flex items-center justify-center text-[#005DA4]">
            <Users className="w-5 h-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pendiente")}
          className="bg-amber-50/75 rounded-2xl border-2 border-amber-300 p-5 shadow-2xs flex items-center justify-between text-left hover:border-amber-400 transition-all cursor-pointer"
        >
          <div>
            <span className="text-xs font-bold text-amber-900 block">
              Pendientes por Verificar
            </span>
            <span className="text-2xl font-bold font-mono text-amber-800 tabular-nums mt-1 block">
              {kpis.pendientes}
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
            <Clock className="w-5 h-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("aprobado")}
          className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-2xs flex items-center justify-between text-left hover:border-emerald-300 transition-all cursor-pointer"
        >
          <div>
            <span className="text-xs font-semibold text-emerald-800 block">
              Aprobados
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-700 tabular-nums mt-1 block">
              {kpis.aprobados}
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("rechazado")}
          className="bg-white rounded-2xl border border-rose-200 p-5 shadow-2xs flex items-center justify-between text-left hover:border-rose-300 transition-all cursor-pointer"
        >
          <div>
            <span className="text-xs font-semibold text-rose-800 block">
              Rechazados / Con Novedad
            </span>
            <span className="text-2xl font-bold font-mono text-rose-700 tabular-nums mt-1 block">
              {kpis.rechazados}
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </button>
      </div>

      {/* PESTAÑAS DE FILTRO + BUSCADOR EN TIEMPO REAL */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          {(
            [
              {
                key: "pendiente",
                label: "Pendientes",
                count: kpis.pendientes,
                activeCls: "bg-amber-600 text-white border-amber-600",
              },
              {
                key: "aprobado",
                label: "Aprobados",
                count: kpis.aprobados,
                activeCls: "bg-emerald-600 text-white border-emerald-600",
              },
              {
                key: "rechazado",
                label: "Rechazados",
                count: kpis.rechazados,
                activeCls: "bg-rose-600 text-white border-rose-600",
              },
              {
                key: "todos",
                label: "Todos",
                count: kpis.total,
                activeCls: "bg-[#0B3B70] text-white border-[#0B3B70]",
              },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-full text-xs font-bold border inline-flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? `${tab.activeCls} shadow-xs`
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-80 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, cédula, correo o ciudad..."
            className="w-full h-10 bg-slate-50 border border-slate-200 rounded-full pl-10 pr-8 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* BANDEJA DE TARJETAS DE AUDITORÍA */}
      {isLoading ? (
        <div className="p-14 text-center bg-white border border-slate-200 rounded-2xl space-y-3 shadow-2xs">
          <div className="w-8 h-8 border-2 border-[#0B3B70] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">
            Cargando expedientes de candidatos desde Supabase...
          </p>
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="p-14 text-center bg-white border border-slate-200 rounded-2xl space-y-2.5 shadow-2xs">
          <ShieldCheck
            className="w-10 h-10 text-slate-300 mx-auto"
            strokeWidth={1.5}
          />
          <h3 className="text-sm font-bold text-slate-800">
            No hay candidatos en esta vista
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm
              ? "Prueba limpiando el término de búsqueda o cambiando de pestaña."
              : activeTab === "pendiente"
              ? "¡Excelente! Todos los candidatos inscritos ya han sido auditados."
              : "Aún no hay registros en esta categoría."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCandidates.map((cand) => {
            const cleanPhone = cleanColombianPhone(cand.phone);
            const waUrl = cleanPhone
              ? `https://wa.me/57${cleanPhone}?text=${encodeURIComponent(
                  `Hola ${cand.full_name}, te escribimos del equipo de verificación de FuerzaVerificada respecto a la validación de tu perfil y soportes documentales.`
                )}`
              : null;
            const isBusy = processingUserId === cand.user_id;
            const isCopied = copiedUserId === cand.user_id;

            return (
              <article
                key={cand.user_id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden"
              >
                {/* Fila Superior: Identidad + Cédula con Copiar 1 Clic + Estado */}
                <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col xl:flex-row xl:items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#0B3B70] text-white flex items-center justify-center font-extrabold text-lg shrink-0 shadow-xs">
                      {cand.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900">
                          {cand.full_name}
                        </h2>

                        {cand.verification_status === "aprobado" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Aprobado
                          </span>
                        ) : cand.verification_status === "rechazado" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            Rechazado / Con Novedad
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Pendiente por Verificar
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {cand.email}
                        </span>
                        <span className="inline-flex items-center gap-1.5 font-mono">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{cand.phone || "Sin teléfono"}</span>
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-sans font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full transition-colors"
                            >
                              <MessageCircle className="w-3 h-3" />
                              WhatsApp
                            </a>
                          )}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {cand.city}
                          {cand.department && cand.department !== cand.city
                            ? `, ${cand.department}`
                            : ""}
                        </span>
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Registro: {formatDateEs(cand.created_at)}
                        </span>
                      </div>

                      {/* Especialidades + Nivel Educativo */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                        {cand.selected_roles.map((r) => (
                          <span
                            key={r}
                            className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAF3FA] text-[#0B3B70] border border-[#D5E6F5]"
                          >
                            {r}
                          </span>
                        ))}
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          <GraduationCap className="w-3 h-3 text-slate-500" />
                          {cand.education_level}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Caja destacada de CÉDULA con botón Copiar en 1 clic */}
                  <div className="flex items-center justify-between xl:justify-end gap-3 p-3.5 rounded-2xl bg-slate-900 text-white shrink-0">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block leading-none">
                        Documento de Identidad
                      </span>
                      <span className="text-base font-extrabold font-mono tracking-wide text-[#FFE066] mt-1 block">
                        C.C. {cand.national_id}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyNationalId(cand)}
                      className={`h-9 px-3.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                        isCopied
                          ? "bg-emerald-500 text-white"
                          : "bg-white/15 hover:bg-white/25 text-white border border-white/20"
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" strokeWidth={3} />
                          <span>¡Copiada!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Cédula</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Cuerpo de Auditoría: Soportes + Cursos SIMETRIC + Portales Oficiales */}
                <div className="p-5 sm:p-6 space-y-5 bg-slate-50/40">
                  {/* Motivo de rechazo si aplica */}
                  {cand.verification_status === "rechazado" &&
                    cand.verification_notes && (
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block text-rose-900">
                            Motivo de rechazo / novedad registrada:
                          </strong>
                          <p className="mt-0.5">{cand.verification_notes}</p>
                        </div>
                      </div>
                    )}

                  {/* Fecha de aprobación si aplica */}
                  {cand.verification_status === "aprobado" &&
                    cand.verified_at && (
                      <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          Verificado oficialmente el{" "}
                          <strong>{formatDateEs(cand.verified_at)}</strong>.
                        </span>
                      </div>
                    )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Bóveda de Soportes Documentales */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                        Bóveda de Soportes Documentales
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Cédula */}
                        {cand.document_cedula_url ? (
                          <button
                            type="button"
                            onClick={() =>
                              openSecureDocument(cand.document_cedula_url)
                            }
                            className="px-3 py-2 rounded-xl bg-[#EAF3FA] hover:bg-[#D5E6F5] text-[#0B3B70] border border-[#D5E6F5] text-xs font-semibold flex items-center justify-between gap-2 transition-colors cursor-pointer"
                          >
                            <span className="inline-flex items-center gap-1.5 truncate">
                              <CreditCard className="w-3.5 h-3.5 shrink-0" />
                              <span>Cédula</span>
                            </span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          </button>
                        ) : (
                          <div className="px-3 py-2 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-[11px] text-slate-400 flex items-center justify-between">
                            <span>Cédula</span>
                            <span className="font-semibold text-amber-600">
                              Faltante
                            </span>
                          </div>
                        )}

                        {/* Hoja de Vida */}
                        {cand.document_cv_url ? (
                          <button
                            type="button"
                            onClick={() =>
                              openSecureDocument(cand.document_cv_url)
                            }
                            className="px-3 py-2 rounded-xl bg-[#EAF3FA] hover:bg-[#D5E6F5] text-[#0B3B70] border border-[#D5E6F5] text-xs font-semibold flex items-center justify-between gap-2 transition-colors cursor-pointer"
                          >
                            <span className="inline-flex items-center gap-1.5 truncate">
                              <FileText className="w-3.5 h-3.5 shrink-0" />
                              <span>Hoja de Vida</span>
                            </span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          </button>
                        ) : (
                          <div className="px-3 py-2 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-[11px] text-slate-400 flex items-center justify-between">
                            <span>Hoja de Vida</span>
                            <span className="font-semibold text-amber-600">
                              Faltante
                            </span>
                          </div>
                        )}

                        {/* Libreta Militar */}
                        {cand.document_libreta_url ? (
                          <button
                            type="button"
                            onClick={() =>
                              openSecureDocument(cand.document_libreta_url)
                            }
                            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold flex items-center justify-between gap-2 transition-colors cursor-pointer"
                          >
                            <span className="inline-flex items-center gap-1.5 truncate">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Libreta Militar</span>
                            </span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          </button>
                        ) : (
                          <div className="px-3 py-2 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-[11px] text-slate-400 flex items-center justify-between">
                            <span>Libreta Militar</span>
                            <span>
                              {cand.has_military_booklet
                                ? "Sin archivo"
                                : "No aplica"}
                            </span>
                          </div>
                        )}

                        {/* Diplomas */}
                        {cand.diplomas.length > 0 ? (
                          cand.diplomas.map((dip, idx) => (
                            <button
                              key={dip.id || `dip_${idx}`}
                              type="button"
                              onClick={() => openSecureDocument(dip.url)}
                              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold flex items-center justify-between gap-2 transition-colors cursor-pointer text-left"
                            >
                              <span className="inline-flex items-center gap-1.5 min-w-0">
                                <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span className="truncate">{dip.name}</span>
                              </span>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-[11px] text-slate-400 flex items-center justify-between">
                            <span>Diplomas / Cursos</span>
                            <span className="font-semibold text-amber-600">
                              Faltante
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cursos SIMETRIC registrados */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Cursos y Certificación SIMETRIC
                        </span>
                        {cand.has_simetric_course && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            SIMETRIC Reportado
                          </span>
                        )}
                      </div>

                      {cand.security_courses.length > 0 ? (
                        <div className="space-y-2">
                          {cand.security_courses.map((sc, idx) => (
                            <div
                              key={sc.id || `c_${idx}`}
                              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 truncate">
                                  {sc.courseName}
                                </div>
                                <div className="text-[11px] text-slate-500 truncate">
                                  {sc.academyName}
                                  {sc.completionDate
                                    ? ` • ${formatDateEs(sc.completionDate)}`
                                    : ""}
                                </div>
                              </div>
                              {sc.hasSimetric && (
                                <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                                  {sc.simetricNumber
                                    ? `SIMETRIC #${sc.simetricNumber}`
                                    : "SIMETRIC ✓"}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : cand.simetric_course_number ? (
                        <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 font-semibold">
                          Registro SIMETRIC:{" "}
                          <span className="font-mono">
                            {cand.simetric_course_number}
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">
                          Sin cursos de seguridad registrados en el perfil.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Barra de Consulta Oficial de Antecedentes (5 Portales) */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <Scale className="w-3.5 h-3.5 text-[#005DA4]" />
                      <span>
                        Consulta Oficial de Antecedentes (Abre en nueva pestaña)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {OFFICIAL_BACKGROUND_PORTALS.map((portal) => (
                        <a
                          key={portal.name}
                          href={portal.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 rounded-full bg-slate-50 hover:bg-[#EAF3FA] text-slate-700 hover:text-[#0B3B70] border border-slate-200 hover:border-[#005DA4]/40 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                        >
                          <span>{portal.name}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Barra de Acciones de Decisión en 1 Clic */}
                  <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-slate-200/80">
                    {cand.verification_status !== "pendiente" && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleResetToPending(cand)}
                        className="h-10 px-4 rounded-full bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer mr-auto"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>↩ Volver a Pendiente</span>
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => {
                        setRejectModalCandidate(cand);
                        setRejectionReason(cand.verification_notes || "");
                        setRejectionError(null);
                      }}
                      className="h-10 px-5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>✕ Rechazar / Pedir Corrección</span>
                    </button>

                    <button
                      type="button"
                      disabled={isBusy || cand.verification_status === "aprobado"}
                      onClick={() => handleApproveCandidate(cand)}
                      className="h-10 px-6 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isBusy ? (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span>✓ Aprobar Candidato</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* MODAL RÁPIDO PARA RECHAZAR / PEDIR CORRECCIÓN */}
      {rejectModalCandidate && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Motivo de rechazo o corrección"
        >
          <div
            className="fixed inset-0"
            onClick={() => !processingUserId && setRejectModalCandidate(null)}
          />
          <form
            onSubmit={handleConfirmReject}
            className="relative z-10 w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Rechazar / Pedir Corrección
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Candidato: <strong>{rejectModalCandidate.full_name}</strong>{" "}
                  (C.C. {rejectModalCandidate.national_id})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRejectModalCandidate(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {rejectionError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                {rejectionError}
              </div>
            )}

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Motivos frecuentes (1 clic):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_REJECTION_REASONS.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => {
                      setRejectionReason(reason);
                      setRejectionError(null);
                    }}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer text-left"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Motivo obligatorio *
              </label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  setRejectionError(null);
                }}
                placeholder="Ej: Cédula ilegible, por favor volver a subir con mejor iluminación..."
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectModalCandidate(null)}
                className="h-9 px-4 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={Boolean(processingUserId)}
                className="h-9 px-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs disabled:opacity-60 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Confirmar Rechazo</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
