"use client";

import { useState, useEffect, useMemo } from "react";
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
  Download,
  Calendar,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Users,
  Check,
  Bike,
  User,
  Briefcase,
  CreditCard,
  BadgeCheck,
  ShieldAlert,
  Stethoscope,
  X,
  ArrowUpDown,
  GraduationCap,
  Car,
  Eye,
  EyeOff,
  SlidersHorizontal,
} from "lucide-react";
import { ResumeDrawerModal } from "@/components/empresa/ResumeDrawerModal";
import { OrderSecurityStudyModal } from "@/components/empresa/OrderSecurityStudyModal";
import {
  CandidateCvModal,
  CandidateSecurityCourseItem,
  CandidateWorkExperienceItem,
  CandidateDiplomaFileItem,
} from "@/components/empresa/CandidateCvModal";
import {
  ApplicationStatus,
  SecurityRoleType,
  SecurityStudyStatus,
  JobPost,
} from "@/types/database";
import { generateInterviewCitationLink } from "@/lib/utils/whatsappTemplates";
import { createClient } from "@/lib/supabase/client";
import { formatSecurityRoleLabel } from "@/lib/utils/roleNormalizer";
import { formatShiftLabel } from "@/lib/utils/shiftNormalizer";
import {
  calculateCandidateMatchScore,
  MatchScoreBreakdown,
} from "@/lib/utils/matchScore";
import {
  EDUCATION_LEVELS,
  findDepartmentByCity,
} from "@/lib/constants/colombiaSecurityCatalog";

interface ATSCandidate {
  id: string;
  candidate_user_id?: string;
  full_name: string;
  email?: string;
  national_id: string;
  phone_whatsapp: string;
  avatar_url?: string | null;
  is_verified?: boolean;
  department: string;
  city: string;
  locality?: string;
  primary_role: SecurityRoleType | string;
  selected_roles: string[];
  years_experience: number;
  education_level: string;
  education_title?: string;
  education_institution?: string;
  education_currently_studying?: boolean;
  education_start_date?: string | null;
  education_end_date?: string | null;
  has_military_booklet: boolean;
  has_own_motorcycle: boolean;
  has_own_vehicle: boolean;
  vehicle_type?: string;
  driver_license_class?: string;
  has_driving_license: boolean;
  motorcycle_cc?: number | null;
  salary_expectation?: number | null;
  available_to_travel?: boolean | null;
  available_to_relocate?: boolean | null;
  available_immediately: boolean;
  resume_pdf_url: string;
  document_cv_url?: string | null;
  document_cedula_url?: string | null;
  document_libreta_url?: string | null;
  document_diplomas_url?: string | null;
  document_diplomas_list?: CandidateDiplomaFileItem[];
  has_simetric_course: boolean;
  simetric_course_number?: string | null;
  security_courses: CandidateSecurityCourseItem[];
  course_semaphore: "VIGENTE" | "PROXIMO_A_VENCER" | "VENCIDO";
  course_name?: string;
  course_date?: string;
  days_remaining: number;
  match_score: number;
  match_breakdown: MatchScoreBreakdown;
  status: ApplicationStatus | string;
  is_read: boolean;
  applied_at?: string;
  screening_answers?: unknown;
  bio_summary?: string | null;
  work_history?: { company: string; role: string; dates: string }[];
  work_experiences?: CandidateWorkExperienceItem[];
  work_experiences_raw?: CandidateWorkExperienceItem[];
}

type FunnelTabKey =
  | "todos"
  | "nuevos"
  | "revision"
  | "proceso"
  | "examenes"
  | "contratados"
  | "descartados";

type ReadFilterKey = "todos" | "no_leidos" | "leidos";
type SortModeKey = "match_desc" | "match_asc" | "recent";

function getCandidateCategory(status: string): FunnelTabKey {
  const st = (status || "").toLowerCase().trim();
  if (["contratado", "hired", "accepted"].includes(st)) return "contratados";
  if (["descartado", "rejected", "finalizado"].includes(st)) return "descartados";
  if (["examenes_medicos", "medicos", "examenes"].includes(st)) return "examenes";
  if (
    [
      "citado_entrevista",
      "en_estudio_seguridad",
      "interview",
      "in_process",
      "pruebas",
      "estudio",
      "poligrafo",
    ].includes(st)
  )
    return "proceso";
  if (
    ["preseleccionado", "viewed", "reviewing", "en_revision", "leido"].includes(
      st
    )
  )
    return "revision";
  return "nuevos";
}

function formatRelativeDate(isoDate?: string): string {
  if (!isoDate) return "Recientemente";
  const date = new Date(isoDate);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays <= 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return date.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

function getMatchBadgeClasses(score: number): string {
  if (score >= 75) {
    return "bg-emerald-50 text-emerald-800 border border-emerald-200";
  }
  if (score >= 50) {
    return "bg-[#EAF3FA] text-[#005DA4] border border-[#D5E6F5]";
  }
  return "bg-amber-50 text-amber-800 border border-amber-200";
}

function normalizeSearchStr(val?: string | null): string {
  if (!val) return "";
  return val
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export default function ATSVacantePage() {
  const params = useParams();
  const vacancyId = params?.id as string;

  const [candidates, setCandidates] = useState<ATSCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] =
    useState<ATSCandidate | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>(
    "Empresa de Seguridad"
  );
  const [vacancyTitle, setVacancyTitle] = useState<string>(
    "Vacante de Seguridad"
  );
  const [vacancyShift, setVacancyShift] = useState<string>("Turno rotativo");
  const [vacancyCity, setVacancyCity] = useState<string>("Bogotá D.C.");
  const [vacancyAddress, setVacancyAddress] = useState<string>("Colombia");
  const [selectedCandidateForDrawer, setSelectedCandidateForDrawer] =
    useState<ATSCandidate | null>(null);
  const [cvModalCandidateId, setCvModalCandidateId] = useState<string | null>(
    null
  );
  const [selectedCandidateForStudy, setSelectedCandidateForStudy] =
    useState<ATSCandidate | null>(null);
  const [credits, setCredits] = useState(0);
  const [activeTab, setActiveTab] = useState<FunnelTabKey>("todos");
  const [notificationToast, setNotificationToast] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  // =========================================================================
  // FILTROS DE BARRA LATERAL (FASE 2) + ORDENAMIENTO POR % ADECUACIÓN
  // =========================================================================
  const [searchTerm, setSearchTerm] = useState("");
  const [readFilter, setReadFilter] = useState<ReadFilterKey>("todos");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [educationFilter, setEducationFilter] = useState("");
  const [onlySimetric, setOnlySimetric] = useState(false);
  const [onlyVehicle, setOnlyVehicle] = useState(false);
  const [onlyLicense, setOnlyLicense] = useState(false);
  const [sortMode, setSortMode] = useState<SortModeKey>("match_desc");

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
                contact_person:
                  user.user_metadata?.full_name || "Contacto Empresa",
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
      let loadedJob: Partial<JobPost> | null = null;
      try {
        const { data: job } = await supabase
          .from("job_posts")
          .select("*")
          .eq("id", vacancyId)
          .maybeSingle();

        if (job) {
          loadedJob = job;
          setVacancyTitle(job.title || "Vacante de Seguridad");
          setVacancyShift(formatShiftLabel(job.shift));
          setVacancyCity(job.city || "Bogotá D.C.");
          setVacancyAddress(
            job.interview_address ||
              job.postal_code_zone ||
              job.zone_neighborhood ||
              job.city ||
              "Colombia"
          );
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
          const candidateIds = rawApps
            .map((a: any) => a.candidate_id)
            .filter(Boolean);

          // Obtener profiles de los candidatos
          const { data: userProfiles } =
            candidateIds.length > 0
              ? await supabase
                  .from("profiles")
                  .select("id, full_name, phone_whatsapp, email")
                  .in("id", candidateIds)
              : { data: [] as any[] };
          const userProfMap = new Map(
            (userProfiles || []).map((p: any) => [p.id, p])
          );

          // Obtener candidate_profiles
          const { data: candProfiles } = await supabase
            .from("candidate_profiles")
            .select("*")
            .in("user_id", candidateIds);

          const profileMap = new Map(
            (candProfiles || []).map((cp: any) => [cp.user_id, cp])
          );

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

            let semaphore: "VIGENTE" | "PROXIMO_A_VENCER" | "VENCIDO" =
              "VIGENTE";
            let daysRem = 180;

            if (candCourse?.expiration_date) {
              const expDate = new Date(candCourse.expiration_date);
              const now = new Date();
              daysRem = Math.ceil(
                (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              );
              if (daysRem <= 0) semaphore = "VENCIDO";
              else if (daysRem <= 60) semaphore = "PROXIMO_A_VENCER";
              else semaphore = "VIGENTE";
            }

            const candCity = candProf.city || "Bogotá D.C.";
            const candDepartment =
              candProf.department || findDepartmentByCity(candCity);

            const selectedRoles: string[] = Array.isArray(
              candProf.selected_roles
            )
              ? candProf.selected_roles.filter(
                  (r: unknown) => typeof r === "string"
                )
              : [];

            const securityCourses: ATSCandidate["security_courses"] =
              Array.isArray(candProf.security_courses)
                ? candProf.security_courses
                : [];

            const workExperiencesRaw: NonNullable<
              ATSCandidate["work_experiences_raw"]
            > = Array.isArray(candProf.work_experiences)
              ? candProf.work_experiences
              : Array.isArray(candProf.work_experience_json)
              ? candProf.work_experience_json
              : [];

            const hasSimetricCourse = Boolean(
              candProf.has_simetric_course === true ||
                securityCourses.some(
                  (sc: any) => sc?.has_simetric || sc?.simetric_course_number
                ) ||
                securityCourses.length > 0 ||
                Boolean(candCourse && semaphore !== "VENCIDO")
            );

            const hasOwnVehicle = Boolean(
              candProf.has_own_vehicle ||
                candProf.has_own_motorcycle ||
                (candProf.vehicle_type &&
                  String(candProf.vehicle_type).toLowerCase() !== "ninguno")
            );

            const driverLicenseClass =
              candProf.driver_license_class || candProf.license_category || "";
            const hasDrivingLicense = Boolean(
              driverLicenseClass || candProf.has_driving_license
            );

            const educationLevel = candProf.education_level || "";

            const matchResult = calculateCandidateMatchScore(loadedJob, {
              primary_role: candProf.primary_role,
              selected_roles: selectedRoles,
              city: candCity,
              department: candDepartment,
              years_experience: candProf.years_experience,
              work_experiences: workExperiencesRaw,
              has_simetric_course: hasSimetricCourse,
              security_courses: securityCourses,
              course_semaphore: semaphore,
              education_level: educationLevel,
              has_own_vehicle: hasOwnVehicle,
              has_own_motorcycle: candProf.has_own_motorcycle,
              vehicle_type: candProf.vehicle_type,
              driver_license_class: driverLicenseClass,
              has_driving_license: hasDrivingLicense,
            });

            const isReadResolved =
              typeof a.is_read === "boolean"
                ? a.is_read
                : !["postulado", "aplicado", "pendiente"].includes(
                    String(a.status || "").toLowerCase()
                  );

            const formattedWorkHistory = workExperiencesRaw.map((w: any) => ({
              company: w.company || "Empresa de Seguridad",
              role: w.role || formatSecurityRoleLabel(candProf.primary_role),
              dates: w.current
                ? `${w.startDate || ""} - Actual`
                : `${w.startDate || ""} - ${w.endDate || ""}`,
            }));

            return {
              id: a.id,
              candidate_user_id: candId,
              full_name:
                userProf.full_name ||
                candProf.full_name ||
                "Aspirante Operativo",
              email: userProf.email || candProf.email || "",
              national_id: candProf.national_id || "En verificación",
              phone_whatsapp:
                userProf.phone_whatsapp || candProf.phone || "3000000000",
              avatar_url: candProf.avatar_url || userProf.avatar_url || null,
              is_verified:
                typeof candProf.is_verified === "boolean"
                  ? candProf.is_verified
                  : true,
              department: candDepartment,
              city: candCity,
              locality: candProf.locality_neighborhood || candProf.locality,
              primary_role: formatSecurityRoleLabel(
                candProf.primary_role || "vigilante_fijo"
              ),
              selected_roles: selectedRoles,
              years_experience: candProf.years_experience ?? 1,
              education_level: educationLevel,
              education_title: candProf.education_title || "",
              education_institution: candProf.education_institution || "",
              education_currently_studying: Boolean(
                candProf.education_currently_studying
              ),
              education_start_date: candProf.education_start_date || null,
              education_end_date: candProf.education_end_date || null,
              has_military_booklet: !!candProf.has_military_booklet,
              has_own_motorcycle: !!candProf.has_own_motorcycle,
              has_own_vehicle: hasOwnVehicle,
              vehicle_type: candProf.vehicle_type || "",
              driver_license_class: driverLicenseClass,
              has_driving_license: hasDrivingLicense,
              motorcycle_cc: candProf.motorcycle_cc,
              salary_expectation:
                candProf.salary_expectation ??
                candProf.expected_salary ??
                null,
              available_to_travel:
                candProf.available_to_travel ??
                candProf.willing_to_travel ??
                null,
              available_to_relocate:
                candProf.available_to_relocate ??
                candProf.willing_to_relocate ??
                null,
              available_immediately: !!candProf.available_immediately,
              resume_pdf_url:
                candProf.document_cv_url || candProf.resume_pdf_url || "",
              document_cv_url:
                candProf.document_cv_url || candProf.resume_pdf_url || null,
              document_cedula_url: candProf.document_cedula_url || null,
              document_libreta_url: candProf.document_libreta_url || null,
              document_diplomas_url: candProf.document_diplomas_url || null,
              document_diplomas_list: Array.isArray(
                candProf.document_diplomas_list
              )
                ? candProf.document_diplomas_list
                : [],
              has_simetric_course: hasSimetricCourse,
              simetric_course_number: candProf.simetric_course_number || null,
              security_courses: securityCourses,
              course_semaphore: semaphore,
              course_name: candCourse?.course_type
                ? formatSecurityRoleLabel(candCourse.course_type)
                : securityCourses[0]?.courseName ||
                  securityCourses[0]?.course_type ||
                  securityCourses[0]?.name ||
                  "Vigilancia Básica",
              course_date:
                candCourse?.completion_date ||
                candCourse?.expiration_date ||
                securityCourses[0]?.completionDate ||
                securityCourses[0]?.completion_date,
              days_remaining: Math.max(daysRem, 0),
              match_score: matchResult.score,
              match_breakdown: matchResult.breakdown,
              status: (a.status as ApplicationStatus) || "postulado",
              is_read: isReadResolved,
              applied_at: a.created_at,
              screening_answers: a.screening_answers ?? null,
              bio_summary: candProf.bio_summary || null,
              work_history:
                formattedWorkHistory.length > 0
                  ? formattedWorkHistory
                  : undefined,
              work_experiences: workExperiencesRaw,
              work_experiences_raw: workExperiencesRaw,
            };
          });

          setCandidates(resolvedCandidates);
          if (resolvedCandidates.length > 0) {
            // Seleccionar el de mayor adecuación por defecto sin marcarlo leído automáticamente
            const best = [...resolvedCandidates].sort(
              (a, b) => b.match_score - a.match_score
            )[0];
            setSelectedCandidate(best);
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

    const supabase = createClient();
    const channel = supabase
      .channel(`ats-vacancy-${vacancyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "applications",
          filter: `job_id=eq.${vacancyId}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE" && payload.new) {
            const updated = payload.new as any;
            setCandidates((prev) =>
              prev.map((c) =>
                c.id === updated.id
                  ? {
                      ...c,
                      status: (updated.status as ApplicationStatus) || c.status,
                      is_read:
                        typeof updated.is_read === "boolean"
                          ? updated.is_read
                          : c.is_read,
                    }
                  : c
              )
            );
            setSelectedCandidate((prev) =>
              prev && prev.id === updated.id
                ? {
                    ...prev,
                    status: (updated.status as ApplicationStatus) || prev.status,
                    is_read:
                      typeof updated.is_read === "boolean"
                        ? updated.is_read
                        : prev.is_read,
                  }
                : prev
            );
          } else if (payload.eventType === "INSERT") {
            loadVacancyAndCandidates();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vacancyId]);

  // Actualizar estado de aplicación en Supabase (EMBUDO DE 5 ETAPAS INTACTO)
  const handleStatusChange = async (
    appId: string,
    nextStatus: ApplicationStatus
  ) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === appId ? { ...c, status: nextStatus, is_read: true } : c
      )
    );
    if (selectedCandidate?.id === appId) {
      setSelectedCandidate((prev) =>
        prev ? { ...prev, status: nextStatus, is_read: true } : null
      );
    }

    const supabase = createClient();
    try {
      let { error } = await supabase
        .from("applications")
        .update({
          status: nextStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", appId);

      // Respaldo por si la columna updated_at no existiera en algún entorno
      if (error) {
        const fallbackUpdate = await supabase
          .from("applications")
          .update({
            status: nextStatus,
          })
          .eq("id", appId);
        error = fallbackUpdate.error;
      }

      if (error) throw error;

      let msg =
        "Estado actualizado y sincronizado en tiempo real con el candidato.";
      if (nextStatus === "citado_entrevista") {
        msg =
          "Candidato movido a 'Citado a Entrevista'. El aspirante ya ve la citación en Mis Aplicaciones.";
      } else if (nextStatus === "en_estudio_seguridad") {
        msg =
          "Candidato movido a 'En Estudio & Polígrafo'. Estado sincronizado con el aspirante.";
      } else if (nextStatus === "examenes_medicos") {
        msg =
          "Candidato avanzado a 'Exámenes Médicos'. Estado sincronizado con el aspirante.";
      } else if (nextStatus === "contratado") {
        msg =
          "¡Candidato Contratado! Notificación reflejada en el panel del aspirante.";
      } else if (nextStatus === "descartado") {
        msg =
          "Candidato archivado como 'Descartado'. Estado actualizado en Mis Aplicaciones.";
      } else if (nextStatus === "preseleccionado") {
        msg =
          "Candidato marcado como 'CV Visto / En Revisión' (sincronizado con el aspirante).";
      } else if (nextStatus === "postulado") {
        msg = "Candidato devuelto a 'Postulado (Sin revisar)'.";
      }

      setNotificationToast(msg);
      setTimeout(() => setNotificationToast(null), 4000);
    } catch (err: any) {
      console.error("Error updating application status:", err);
      setNotificationToast(
        `No se pudo guardar el cambio en Supabase: ${
          err?.message || "Verifica permisos RLS en public.applications"
        }`
      );
      setTimeout(() => setNotificationToast(null), 5000);
    }
  };

  // Marcar como leído de forma silenciosa en Supabase (`is_read: true`)
  const markCandidateAsReadSilently = async (candidate: ATSCandidate) => {
    if (candidate.is_read) return;

    setCandidates((prev) =>
      prev.map((c) => (c.id === candidate.id ? { ...c, is_read: true } : c))
    );
    setSelectedCandidate((prev) =>
      prev && prev.id === candidate.id ? { ...prev, is_read: true } : prev
    );

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("applications")
        .update({ is_read: true } as any)
        .eq("id", candidate.id);

      if (error) {
        console.warn("Aviso al actualizar is_read silenciosamente:", error.message);
      }
    } catch (err) {
      console.warn("Excepción al actualizar is_read:", err);
    }
  };

  // Seleccionar candidato para ver su perfil -> marca is_read: true en segundo plano y abre Visor 360°
  const handleSelectCandidate = (candidate: ATSCandidate) => {
    setSelectedCandidate({ ...candidate, is_read: true });
    setCvModalCandidateId(candidate.id);
    if (!candidate.is_read) {
      void markCandidateAsReadSilently(candidate);
    }
  };

  const cvModalCandidate = useMemo(
    () =>
      cvModalCandidateId
        ? candidates.find((c) => c.id === cvModalCandidateId) || null
        : null,
    [candidates, cvModalCandidateId]
  );

  // Abrir Hoja de Vida en PDF y marcar leído
  const handleOpenResumePdf = (candidate: ATSCandidate) => {
    if (!candidate.is_read) {
      void markCandidateAsReadSilently(candidate);
    }
    if (candidate.resume_pdf_url) {
      window.open(candidate.resume_pdf_url, "_blank", "noopener,noreferrer");
    } else {
      setSelectedCandidateForDrawer(candidate);
    }
  };

  // Confirmar orden de estudio de confiabilidad / poligrafía
  const handleConfirmStudyOrder = async (orderPayload?: any) => {
    const supabase = createClient();
    try {
      if (credits <= 0) {
        setNotificationToast(
          "No tienes créditos disponibles. Debes recargar créditos para solicitar estudios de seguridad."
        );
        setTimeout(() => setNotificationToast(null), 4500);
        return;
      }

      let activeCompanyId = companyId;

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
            const { data: prof } = await supabase
              .from("profiles")
              .select("full_name, phone_whatsapp")
              .eq("id", user.id)
              .maybeSingle();

            const compName =
              companyName ||
              user.user_metadata?.company_name ||
              prof?.full_name ||
              user.user_metadata?.full_name ||
              "Empresa de Seguridad";

            const { data: createdComp } = await supabase
              .from("companies")
              .insert({
                owner_id: user.id,
                company_name: compName,
                nit: user.user_metadata?.nit || `NIT-${user.id.slice(0, 8)}`,
                contact_person:
                  prof?.full_name ||
                  user.user_metadata?.full_name ||
                  "Contacto Empresa",
                contact_phone:
                  prof?.phone_whatsapp ||
                  user.user_metadata?.phone ||
                  "3000000000",
                city: vacancyCity || "Bogotá D.C.",
                is_verified_company: false,
                plan_name: "basico",
                credits_security_studies: 0,
              })
              .select("id, credits_security_studies")
              .maybeSingle();

            if (createdComp) comp = createdComp;
          }

          if (comp) {
            activeCompanyId = comp.id;
            setCompanyId(comp.id);
            setCredits(Number(comp.credits_security_studies ?? 0));
          }
        }
      }

      if (credits <= 0) return;

      if (activeCompanyId && selectedCandidate?.candidate_user_id) {
        const studyType = orderPayload?.study_type || "poligrafo_preempleo";
        const isPolygraph =
          studyType.includes("poligrafo") || studyType.includes("combo");
        const isHomeVisit =
          studyType.includes("visita") || studyType.includes("combo");

        let serviceTitle = "COMBO INTEGRAL (POLÍGRAFO + VISITA)";
        if (isPolygraph && isHomeVisit) {
          serviceTitle = "COMBO INTEGRAL (POLÍGRAFO + VISITA)";
        } else if (isPolygraph) {
          serviceTitle = "POLIGRAFÍA PREEMPLEO";
        } else if (isHomeVisit) {
          serviceTitle = "VISITA DOMICILIARIA CON FOTOS";
        }

        const candidateSummary = `Solicitud pericial de ${serviceTitle} para ${selectedCandidate.full_name} (C.C. ${selectedCandidate.national_id}, Tel: ${selectedCandidate.phone_whatsapp}, Ciudad: ${selectedCandidate.city}). Obs: ${orderPayload?.notes || "Radicado desde ATS de vacante."}`;

        const orderData: any = {
          company_id: activeCompanyId,
          candidate_id: selectedCandidate.candidate_user_id,
          application_id: selectedCandidate.id,
          include_polygraph: isPolygraph,
          include_home_visit: isHomeVisit,
          include_background_study: true,
          status: "solicitado" as SecurityStudyStatus,
          scheduled_date: null,
          final_concept: candidateSummary,
          report_pdf_url: null,
        };

        const { data: insertedOrder, error: insertOrderErr } = await supabase
          .from("security_study_orders")
          .insert(orderData)
          .select("*")
          .maybeSingle();

        if (insertOrderErr || !insertedOrder) {
          console.error(
            "Error inserting security_study_orders:",
            insertOrderErr
          );
          setNotificationToast(
            `Error al radicar orden en Supabase: ${
              insertOrderErr?.message || "Error al insertar registro"
            }`
          );
          setTimeout(() => setNotificationToast(null), 5000);
          return;
        }

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
        setNotificationToast(
          "¡Orden de Poligrafía radicada con éxito en Supabase y visible en bandeja Admin!"
        );
        setTimeout(() => setNotificationToast(null), 4000);
      }
    } catch (err) {
      console.error("Error creating security order:", err);
    } finally {
      setSelectedCandidateForStudy(null);
    }
  };

  // Opciones dinámicas de Departamento y Ciudad extraídas de los postulados presentes
  const availableDepartments = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => {
      if (c.department) set.add(c.department);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [candidates]);

  const availableCities = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => {
      if (departmentFilter && c.department !== departmentFilter) return;
      if (c.city) set.add(c.city);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [candidates, departmentFilter]);

  // Conteo en vivo para pestañas del embudo (5 etapas intactas)
  const counts = useMemo(
    () => ({
      todos: candidates.length,
      nuevos: candidates.filter(
        (c) => getCandidateCategory(c.status) === "nuevos"
      ).length,
      revision: candidates.filter(
        (c) => getCandidateCategory(c.status) === "revision"
      ).length,
      proceso: candidates.filter(
        (c) => getCandidateCategory(c.status) === "proceso"
      ).length,
      examenes: candidates.filter(
        (c) => getCandidateCategory(c.status) === "examenes"
      ).length,
      contratados: candidates.filter(
        (c) => getCandidateCategory(c.status) === "contratados"
      ).length,
      descartados: candidates.filter(
        (c) => getCandidateCategory(c.status) === "descartados"
      ).length,
      unread: candidates.filter((c) => !c.is_read).length,
      read: candidates.filter((c) => c.is_read).length,
    }),
    [candidates]
  );

  // Filtrado completo de barra lateral + Pestaña + Ordenamiento por % Adecuación / Recientes
  const filteredCandidates = useMemo(() => {
    const q = normalizeSearchStr(searchTerm);

    return candidates
      .filter((c) => {
        // 1. Pestaña del embudo
        if (
          activeTab !== "todos" &&
          getCandidateCategory(c.status) !== activeTab
        ) {
          return false;
        }

        // 2. Palabra clave (nombre, cédula, roles, cursos y experiencias)
        if (q) {
          const coursesText = (c.security_courses || [])
            .map(
              (sc) =>
                `${sc.course_type || ""} ${sc.name || ""} ${sc.academy || ""} ${sc.institution || ""}`
            )
            .join(" ");
          const expText = (c.work_experiences_raw || [])
            .map(
              (w) =>
                `${w.company || ""} ${w.role || ""} ${w.description || ""}`
            )
            .join(" ");
          const haystack = normalizeSearchStr(
            `${c.full_name} ${c.national_id} ${c.primary_role} ${c.selected_roles.join(" ")} ${c.course_name || ""} ${coursesText} ${expText} ${c.education_level} ${c.city} ${c.department}`
          );
          if (!haystack.includes(q)) return false;
        }

        // 3. Estado de lectura
        if (readFilter === "no_leidos" && c.is_read) return false;
        if (readFilter === "leidos" && !c.is_read) return false;

        // 4. Departamento y Ciudad
        if (departmentFilter && c.department !== departmentFilter) return false;
        if (cityFilter && c.city !== cityFilter) return false;

        // 5. Nivel de estudios
        if (
          educationFilter &&
          normalizeSearchStr(c.education_level) !==
            normalizeSearchStr(educationFilter)
        ) {
          return false;
        }

        // 6. Checkboxes rápidos de seguridad privada
        if (onlySimetric && !c.has_simetric_course) return false;
        if (onlyVehicle && !c.has_own_vehicle) return false;
        if (onlyLicense && !c.has_driving_license) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortMode === "match_desc") {
          return b.match_score - a.match_score;
        }
        if (sortMode === "match_asc") {
          return a.match_score - b.match_score;
        }
        // Más recientes
        const timeB = b.applied_at ? new Date(b.applied_at).getTime() : 0;
        const timeA = a.applied_at ? new Date(a.applied_at).getTime() : 0;
        return timeB - timeA;
      });
  }, [
    candidates,
    activeTab,
    searchTerm,
    readFilter,
    departmentFilter,
    cityFilter,
    educationFilter,
    onlySimetric,
    onlyVehicle,
    onlyLicense,
    sortMode,
  ]);

  // Chips activos removibles
  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; onRemove: () => void }> =
      [];
    if (searchTerm.trim()) {
      chips.push({
        key: "search",
        label: `Búsqueda: "${searchTerm.trim()}"`,
        onRemove: () => setSearchTerm(""),
      });
    }
    if (readFilter !== "todos") {
      chips.push({
        key: "read",
        label: `Lectura: ${readFilter === "no_leidos" ? "No leídos" : "Leídos"}`,
        onRemove: () => setReadFilter("todos"),
      });
    }
    if (departmentFilter) {
      chips.push({
        key: "dept",
        label: `Depto: ${departmentFilter}`,
        onRemove: () => {
          setDepartmentFilter("");
          setCityFilter("");
        },
      });
    }
    if (cityFilter) {
      chips.push({
        key: "city",
        label: `Ciudad: ${cityFilter}`,
        onRemove: () => setCityFilter(""),
      });
    }
    if (educationFilter) {
      chips.push({
        key: "edu",
        label: `Estudios: ${educationFilter}`,
        onRemove: () => setEducationFilter(""),
      });
    }
    if (onlySimetric) {
      chips.push({
        key: "simetric",
        label: "Solo Curso SIMETRIC",
        onRemove: () => setOnlySimetric(false),
      });
    }
    if (onlyVehicle) {
      chips.push({
        key: "vehicle",
        label: "Vehículo propio",
        onRemove: () => setOnlyVehicle(false),
      });
    }
    if (onlyLicense) {
      chips.push({
        key: "license",
        label: "Con Licencia",
        onRemove: () => setOnlyLicense(false),
      });
    }
    return chips;
  }, [
    searchTerm,
    readFilter,
    departmentFilter,
    cityFilter,
    educationFilter,
    onlySimetric,
    onlyVehicle,
    onlyLicense,
  ]);

  const hasActiveFilters = activeFilterChips.length > 0;

  const resetFilters = () => {
    setSearchTerm("");
    setReadFilter("todos");
    setDepartmentFilter("");
    setCityFilter("");
    setEducationFilter("");
    setOnlySimetric(false);
    setOnlyVehicle(false);
    setOnlyLicense(false);
  };

  const toggleMatchSort = () => {
    setSortMode((prev) => (prev === "match_desc" ? "match_asc" : "match_desc"));
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
            <span className="text-slate-700 font-medium">
              Bandeja ATS SherlockHR
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {vacancyTitle}
          </h1>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
            <span>
              Turno:{" "}
              <strong className="text-slate-800 font-mono tabular-nums">
                {vacancyShift}
              </strong>
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
          <CheckCircle2
            className="w-4 h-4 text-emerald-400 shrink-0"
            strokeWidth={2.5}
          />
          <span>{notificationToast}</span>
        </div>
      )}

      {/* 1. BARRA DE PESTAÑAS DE EMBUDO DE 5 ETAPAS (SHERLOCK HR FUNNEL TABS) */}
      <div className="bg-white border-b border-slate-200/90 px-6 pt-2 rounded-2xl shadow-2xs overflow-x-auto">
        <div className="flex items-center gap-6 min-w-max">
          {[
            {
              key: "todos" as FunnelTabKey,
              label: "Todos",
              count: counts.todos,
            },
            {
              key: "nuevos" as FunnelTabKey,
              label: "Nuevos / Sin leer",
              count: counts.nuevos,
            },
            {
              key: "revision" as FunnelTabKey,
              label: "CV Visto / En revisión",
              count: counts.revision,
            },
            {
              key: "proceso" as FunnelTabKey,
              label: "Entrevista / Polígrafo",
              count: counts.proceso,
            },
            {
              key: "examenes" as FunnelTabKey,
              label: "Exámenes Médicos",
              count: counts.examenes,
            },
            {
              key: "contratados" as FunnelTabKey,
              label: "Contratados",
              count: counts.contratados,
            },
            {
              key: "descartados" as FunnelTabKey,
              label: "Descartados",
              count: counts.descartados,
            },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`pb-3.5 pt-2 text-xs font-semibold transition-all inline-flex items-center gap-2 border-b-[3px] cursor-pointer ${
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

      {/* 2. LAYOUT DE 2 ZONAS: SIDEBAR IZQUIERDO DE FILTROS + ZONA DERECHA DE POSTULADOS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* =============================================================== */}
        {/* ZONA IZQUIERDA: SIDEBAR DE FILTROS DE CANDIDATOS (3 COLS)       */}
        {/* =============================================================== */}
        <aside className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-5 lg:sticky lg:top-20">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#005DA4]" />
              <h2 className="text-sm font-bold text-slate-900">
                Filtros de candidatos
              </h2>
            </div>
            {hasActiveFilters && (
              <span className="text-[10px] font-bold bg-[#EAF3FA] text-[#005DA4] px-2 py-0.5 rounded-full">
                {activeFilterChips.length}
              </span>
            )}
          </div>

          {/* 1. Palabra clave */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Palabra clave
            </label>
            <div className="relative">
              <Search
                className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3"
                strokeWidth={2}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nombre, cédula, curso, rol..."
                className="w-full h-9 bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-7 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 2. Estado de lectura */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Estado de lectura
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: "todos", label: "Todos", count: counts.todos },
                  { id: "no_leidos", label: "No leídos", count: counts.unread },
                  { id: "leidos", label: "Leídos", count: counts.read },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setReadFilter(opt.id)}
                  className={`px-2 py-1.5 rounded-xl text-[11px] font-semibold border text-center transition-all cursor-pointer ${
                    readFilter === opt.id
                      ? "bg-[#0B3B70] text-white border-[#0B3B70] shadow-2xs"
                      : "bg-white text-slate-600 border-slate-200 hover:border-[#005DA4]"
                  }`}
                >
                  <span className="block leading-tight">{opt.label}</span>
                  <span
                    className={`text-[10px] font-mono ${
                      readFilter === opt.id
                        ? "text-white/80"
                        : "text-slate-400"
                    }`}
                  >
                    ({opt.count})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Departamento y Ciudad (dinámicos de postulados) */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Departamento
              </label>
              <select
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setCityFilter("");
                }}
                className="w-full h-9 bg-white border border-slate-200 rounded-xl px-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#005DA4] cursor-pointer"
              >
                <option value="">Todos los departamentos</option>
                {availableDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Ciudad
              </label>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full h-9 bg-white border border-slate-200 rounded-xl px-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#005DA4] cursor-pointer"
              >
                <option value="">Todas las ciudades</option>
                {availableCities.map((ct) => (
                  <option key={ct} value={ct}>
                    {ct}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Nivel de estudios (9 niveles oficiales) */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Nivel de estudios
            </label>
            <select
              value={educationFilter}
              onChange={(e) => setEducationFilter(e.target.value)}
              className="w-full h-9 bg-white border border-slate-200 rounded-xl px-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#005DA4] cursor-pointer"
            >
              <option value="">Todos los niveles</option>
              {EDUCATION_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Checkboxes rápidos de seguridad privada */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Acreditación y logística
            </span>

            <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer hover:text-[#0B3B70]">
              <input
                type="checkbox"
                checked={onlySimetric}
                onChange={(e) => setOnlySimetric(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#0B3B70] focus:ring-[#005DA4]"
              />
              <span>Solo con Curso SIMETRIC</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer hover:text-[#0B3B70]">
              <input
                type="checkbox"
                checked={onlyVehicle}
                onChange={(e) => setOnlyVehicle(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#0B3B70] focus:ring-[#005DA4]"
              />
              <span>Solo con Vehículo propio</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer hover:text-[#0B3B70]">
              <input
                type="checkbox"
                checked={onlyLicense}
                onChange={(e) => setOnlyLicense(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#0B3B70] focus:ring-[#005DA4]"
              />
              <span>Solo con Licencia de conducción</span>
            </label>
          </div>

          {/* 6. Botón Limpiar filtros */}
          <button
            type="button"
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 text-slate-600 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Limpiar filtros</span>
          </button>
        </aside>

        {/* =============================================================== */}
        {/* ZONA DERECHA: BARRA DE CHIPS + LISTADO + EXPEDIENTE (9 COLS)    */}
        {/* =============================================================== */}
        <div className="lg:col-span-9 space-y-4">
          {/* Barra superior: Contador dinámico + Ordenamiento + Chips activos */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#005DA4]" />
                <h2 className="text-sm font-bold text-slate-900">
                  Mostrando{" "}
                  <span className="font-mono text-[#005DA4]">
                    {filteredCandidates.length}
                  </span>{" "}
                  de{" "}
                  <span className="font-mono">{candidates.length}</span>{" "}
                  postulados
                </h2>
              </div>

              {/* Controles clicables de ordenamiento */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={toggleMatchSort}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                    sortMode === "match_desc" || sortMode === "match_asc"
                      ? "bg-[#0B3B70] text-white border-[#0B3B70] shadow-2xs"
                      : "bg-white text-slate-700 border-slate-200 hover:border-[#005DA4]"
                  }`}
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>
                    % Adecuación:{" "}
                    {sortMode === "match_asc"
                      ? "Menor a mayor"
                      : "Mayor a menor"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSortMode("recent")}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                    sortMode === "recent"
                      ? "bg-[#0B3B70] text-white border-[#0B3B70] shadow-2xs"
                      : "bg-white text-slate-700 border-slate-200 hover:border-[#005DA4]"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Más recientes</span>
                </button>
              </div>
            </div>

            {/* Chips de filtros activos con botón ✕ */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 inline-flex items-center gap-1">
                  <Filter className="w-3 h-3" />
                  Activos:
                </span>
                {activeFilterChips.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={chip.onRemove}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EAF3FA] text-[#0B3B70] border border-[#D5E6F5] hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    <span>{chip.label}</span>
                    <X className="w-3 h-3" />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[11px] font-bold text-rose-600 hover:underline ml-1 cursor-pointer"
                >
                  Limpiar todo
                </button>
              </div>
            )}
          </div>

          {/* VISOR MASTER-DETAIL: LISTA DE POSTULADOS (5 COLS) + EXPEDIENTE (7 COLS) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            {/* COLUMNA DE TARJETAS DE POSTULADOS */}
            <div className="xl:col-span-5 space-y-3">
              {isLoading ? (
                <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-3 shadow-2xs">
                  <div className="w-7 h-7 border-2 border-[#0B3B70] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-600 font-semibold">
                    Calculando % de adecuación y cargando postulados...
                  </p>
                </div>
              ) : filteredCandidates.length === 0 ? (
                <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl space-y-2 shadow-2xs">
                  <Users
                    className="w-8 h-8 text-slate-300 mx-auto"
                    strokeWidth={1.5}
                  />
                  <h4 className="text-xs font-bold text-slate-800">
                    No hay candidatos con estos filtros
                  </h4>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    {hasActiveFilters
                      ? "Prueba ajustando o limpiando los filtros laterales."
                      : "Los aspirantes que se postulen aparecerán automáticamente aquí."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredCandidates.map((cand) => {
                    const isSelected = selectedCandidate?.id === cand.id;
                    const isUnread = !cand.is_read;

                    return (
                      <div
                        key={cand.id}
                        onClick={() => handleSelectCandidate(cand)}
                        className={`rounded-2xl p-4 text-left cursor-pointer transition-all relative ${
                          isSelected
                            ? "bg-white border-[1.5px] border-[#005DA4] ring-1 ring-[#005DA4]/15 shadow-sm"
                            : isUnread
                            ? "bg-white border border-slate-200 hover:border-[#005DA4]/60 shadow-2xs"
                            : "bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-slate-300"
                        }`}
                      >
                        {/* Fila 1: Indicador No leído + Nombre + Insignia % Adecuación */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              {isUnread && (
                                <span
                                  className="w-2.5 h-2.5 rounded-full bg-[#005DA4] shrink-0"
                                  title="No leído"
                                />
                              )}
                              <h4
                                className={`text-sm tracking-tight truncate transition-colors ${
                                  isUnread
                                    ? "font-bold text-slate-950"
                                    : "font-semibold text-slate-700"
                                }`}
                              >
                                {cand.full_name}
                              </h4>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                              C.C. {cand.national_id} • {cand.years_experience}{" "}
                              años exp.
                            </div>
                          </div>

                          {/* Insignia visual % de Adecuación */}
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-mono tabular-nums shrink-0 ${getMatchBadgeClasses(
                              cand.match_score
                            )}`}
                            title="Porcentaje de adecuación al perfil de la vacante"
                          >
                            {cand.match_score}%
                          </span>
                        </div>

                        {/* Fila 2: Especialidad + Ubicación */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold mt-2">
                          <span className="truncate">{cand.primary_role}</span>
                          <BadgeCheck
                            className="w-3.5 h-3.5 text-[#005DA4] shrink-0"
                            strokeWidth={2.5}
                          />
                        </div>

                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {cand.city}
                            {cand.department && cand.department !== cand.city
                              ? `, ${cand.department}`
                              : ""}
                          </span>
                        </div>

                        {/* Fila 3: Píldoras clave (SIMETRIC, Estudios, Vehículo/Licencia) */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100">
                          {cand.has_simetric_course ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <Check className="w-2.5 h-2.5" strokeWidth={3} />
                              SIMETRIC
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                              Sin SIMETRIC
                            </span>
                          )}

                          {cand.has_own_vehicle && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#0B3B70] bg-[#EAF3FA] border border-[#D5E6F5] px-2 py-0.5 rounded-full">
                              Vehículo
                            </span>
                          )}

                          {cand.has_driving_license && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                              Lic. {cand.driver_license_class || "Sí"}
                            </span>
                          )}

                          {cand.resume_pdf_url && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              HV PDF
                            </span>
                          )}
                        </div>

                        {/* Fila 4: Pie con Fecha, Estado lectura y Etapa ATS */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{formatRelativeDate(cand.applied_at)}</span>
                            <span className="text-slate-300">•</span>
                            <span
                              className={`inline-flex items-center gap-1 font-medium ${
                                isUnread ? "text-[#005DA4]" : "text-slate-400"
                              }`}
                            >
                              {isUnread ? (
                                <>
                                  <EyeOff className="w-3 h-3" /> No leído
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3 h-3" /> Leído
                                </>
                              )}
                            </span>
                          </span>

                          {cand.status === "citado_entrevista" ? (
                            <span className="bg-amber-50 text-amber-800 border border-amber-200 rounded-full px-2 py-0.5 text-[10px] font-bold">
                              Entrevista
                            </span>
                          ) : cand.status === "en_estudio_seguridad" ? (
                            <span className="bg-[#EAF3FA] text-[#0B3B70] border border-[#D5E6F5] rounded-full px-2 py-0.5 text-[10px] font-bold">
                              Estudio & Polígrafo
                            </span>
                          ) : cand.status === "examenes_medicos" ? (
                            <span className="bg-purple-50 text-purple-800 border border-purple-200 rounded-full px-2 py-0.5 text-[10px] font-bold">
                              Exámenes Médicos
                            </span>
                          ) : cand.status === "contratado" ? (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full px-2 py-0.5 text-[10px] font-bold">
                              Contratado
                            </span>
                          ) : cand.status === "descartado" ? (
                            <span className="bg-slate-100 text-slate-500 border border-slate-200 rounded-full px-2 py-0.5 text-[10px] font-semibold">
                              Descartado
                            </span>
                          ) : cand.status === "preseleccionado" ? (
                            <span className="border border-slate-300 rounded-full px-2 py-0.5 text-[10px] text-slate-600 font-semibold">
                              En Revisión
                            </span>
                          ) : (
                            <span className="bg-rose-50 text-rose-600 border border-rose-200 rounded-full px-2 py-0.5 text-[10px] font-bold">
                              Postulado
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* COLUMNA DERECHA: EXPEDIENTE DEL CANDIDATO Y EMBUDO ATS (7 COLS) */}
            <div className="xl:col-span-7 xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto space-y-4">
              {selectedCandidate ? (
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-5">
                  {/* Expediente Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-[#EAF3FA] border border-[#D5E6F5] text-[#0B3B70] flex items-center justify-center font-extrabold text-lg shrink-0 shadow-2xs">
                        {selectedCandidate.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                            {selectedCandidate.full_name}
                          </h3>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-mono tabular-nums ${getMatchBadgeClasses(
                              selectedCandidate.match_score
                            )}`}
                          >
                            {selectedCandidate.match_score}% Adecuación
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm text-slate-700 font-bold mt-1">
                          {selectedCandidate.primary_role} •{" "}
                          {selectedCandidate.years_experience} años de
                          experiencia
                        </div>
                        <div className="text-xs text-slate-500 font-mono tabular-nums mt-1 flex flex-wrap items-center gap-2">
                          <span>C.C. {selectedCandidate.national_id}</span>
                          <span>•</span>
                          <span>
                            {selectedCandidate.city}
                            {selectedCandidate.department &&
                            selectedCandidate.department !==
                              selectedCandidate.city
                              ? `, ${selectedCandidate.department}`
                              : ""}
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-slate-700">
                            {selectedCandidate.phone_whatsapp}
                          </span>
                        </div>

                        <div className="pt-2 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#005DA4] bg-[#EAF3FA] px-2.5 py-0.5 rounded-full border border-[#D5E6F5]">
                            <BadgeCheck
                              className="w-3.5 h-3.5 text-[#005DA4]"
                              strokeWidth={2.5}
                            />
                            <span>Expediente Verificado • SuperVigilancia</span>
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                            <Eye className="w-3 h-3" />
                            {selectedCandidate.is_read ? "Leído" : "Sin leer"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* SELECTOR DE FASE DEL EMBUDO (5 ETAPAS INTACTAS) */}
                    <div className="flex flex-col items-start sm:items-end shrink-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Fase del Embudo
                      </span>
                      <select
                        value={selectedCandidate.status}
                        onChange={(e) =>
                          handleStatusChange(
                            selectedCandidate.id,
                            e.target.value as ApplicationStatus
                          )
                        }
                        className="mt-1 rounded-full px-4 py-1.5 text-xs font-bold border border-slate-300 bg-white shadow-2xs focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/10 cursor-pointer"
                      >
                        <option value="postulado">
                          Postulado (Sin revisar)
                        </option>
                        <option value="preseleccionado">
                          En Revisión / CV Visto
                        </option>
                        <option value="citado_entrevista">
                          Citado a Entrevista
                        </option>
                        <option value="en_estudio_seguridad">
                          En Estudio & Polígrafo
                        </option>
                        <option value="examenes_medicos">
                          Exámenes Médicos
                        </option>
                        <option value="contratado">Contratado</option>
                        <option value="descartado">Descartado</option>
                      </select>
                    </div>
                  </div>

                  {/* DESGLOSE DE % DE ADECUACIÓN (MOTOR FASE 2) */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">
                        Desglose de Adecuación al Cargo
                      </span>
                      <span className="font-mono font-bold text-[#0B3B70]">
                        {selectedCandidate.match_score} / 100 pts
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                      <div className="bg-white rounded-lg border border-slate-200 p-2 text-center">
                        <span className="text-slate-500 block">Perfil</span>
                        <strong className="font-mono text-slate-900">
                          {selectedCandidate.match_breakdown.roleMatch}/30
                        </strong>
                      </div>
                      <div className="bg-white rounded-lg border border-slate-200 p-2 text-center">
                        <span className="text-slate-500 block">Ubicación</span>
                        <strong className="font-mono text-slate-900">
                          {selectedCandidate.match_breakdown.locationMatch}/20
                        </strong>
                      </div>
                      <div className="bg-white rounded-lg border border-slate-200 p-2 text-center">
                        <span className="text-slate-500 block">SIMETRIC</span>
                        <strong className="font-mono text-slate-900">
                          {selectedCandidate.match_breakdown.simetricMatch}/20
                        </strong>
                      </div>
                      <div className="bg-white rounded-lg border border-slate-200 p-2 text-center">
                        <span className="text-slate-500 block">
                          Experiencia
                        </span>
                        <strong className="font-mono text-slate-900">
                          {selectedCandidate.match_breakdown.experienceMatch}/15
                        </strong>
                      </div>
                      <div className="bg-white rounded-lg border border-slate-200 p-2 text-center col-span-2 sm:col-span-1">
                        <span className="text-slate-500 block">
                          Est./Logíst.
                        </span>
                        <strong className="font-mono text-slate-900">
                          {
                            selectedCandidate.match_breakdown
                              .educationVehicleMatch
                          }
                          /15
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* BARRA DE ACCIONES RÁPIDAS DEL RECLUTADOR (INTACTA) */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Acciones Rápidas del Reclutador
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleStatusChange(
                            selectedCandidate.id,
                            "citado_entrevista"
                          )
                        }
                        className="rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white text-xs font-semibold px-5 py-2.5 inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                      >
                        <Calendar
                          className="w-3.5 h-3.5 text-[#FFE066]"
                          strokeWidth={2}
                        />
                        <span>Citar a Entrevista</span>
                      </button>

                      <a
                        href={generateInterviewCitationLink({
                          phone: selectedCandidate.phone_whatsapp,
                          candidateName: selectedCandidate.full_name,
                          companyName:
                            companyName || "Nuestra Empresa de Seguridad",
                          jobTitle: vacancyTitle,
                          shift: vacancyShift,
                          interviewAddress: vacancyAddress,
                          interviewDateText: "Mañana a las 8:30 AM",
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          handleStatusChange(
                            selectedCandidate.id,
                            "citado_entrevista"
                          )
                        }
                        className="rounded-full bg-[#EAF3FA] hover:bg-[#D5E6F5] text-[#0B3B70] border border-[#D5E6F5] text-xs font-semibold px-4 py-2.5 inline-flex items-center gap-1.5 shadow-2xs transition-colors"
                      >
                        <MessageCircle
                          className="w-3.5 h-3.5 text-emerald-600"
                          strokeWidth={2}
                        />
                        <span>WhatsApp</span>
                      </a>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedCandidateForStudy(selectedCandidate)
                        }
                        className="rounded-full bg-[#EAF3FA] hover:bg-[#D5E6F5] text-[#0B3B70] border border-[#D5E6F5] text-xs font-semibold px-4 py-2.5 inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <ShieldAlert
                          className="w-3.5 h-3.5 text-[#005DA4]"
                          strokeWidth={2}
                        />
                        <span>Solicitar Polígrafo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleStatusChange(
                            selectedCandidate.id,
                            "examenes_medicos"
                          )
                        }
                        className="rounded-full bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-semibold px-4 py-2.5 inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Stethoscope
                          className="w-3.5 h-3.5 text-purple-600"
                          strokeWidth={2}
                        />
                        <span>Exámenes Médicos</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleStatusChange(selectedCandidate.id, "contratado")
                        }
                        className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <CheckCircle2
                          className="w-3.5 h-3.5"
                          strokeWidth={2.5}
                        />
                        <span>Contratar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleStatusChange(selectedCandidate.id, "descartado")
                        }
                        className="rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold px-3.5 py-2.5 inline-flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                        title="Descartar candidato"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Descartar</span>
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-slate-200" />

                  {/* RESUMEN OPERATIVO */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-900">
                      Resumen Operativo
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                      <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[#0B3B70] shrink-0">
                          <Briefcase className="w-4 h-4 text-[#005DA4]" />
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500 block">
                            Experiencia en Seguridad:
                          </span>
                          <strong className="text-xs font-bold text-slate-900">
                            {selectedCandidate.years_experience} años
                            certificados
                          </strong>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[#0B3B70] shrink-0">
                          <ShieldCheck className="w-4 h-4 text-[#005DA4]" />
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500 block">
                            Curso SIMETRIC / SuperVigilancia:
                          </span>
                          <strong className="text-xs font-bold text-slate-900">
                            {selectedCandidate.has_simetric_course
                              ? "Acreditado / Vigente"
                              : "Sin registro SIMETRIC"}
                          </strong>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[#0B3B70] shrink-0">
                          <GraduationCap className="w-4 h-4 text-[#005DA4]" />
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500 block">
                            Nivel de Estudios:
                          </span>
                          <strong className="text-xs font-bold text-slate-900">
                            {selectedCandidate.education_level ||
                              "No especificado"}
                          </strong>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[#0B3B70] shrink-0">
                          <Car className="w-4 h-4 text-[#005DA4]" />
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500 block">
                            Vehículo y Licencia:
                          </span>
                          <strong className="text-xs font-bold text-slate-900">
                            {selectedCandidate.has_own_vehicle
                              ? selectedCandidate.vehicle_type || "Sí posee"
                              : "Sin vehículo"}{" "}
                            •{" "}
                            {selectedCandidate.has_driving_license
                              ? `Lic. ${selectedCandidate.driver_license_class || "Vigente"}`
                              : "Sin licencia"}
                          </strong>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[#0B3B70] shrink-0">
                          <CreditCard className="w-4 h-4 text-[#005DA4]" />
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500 block">
                            Libreta Militar:
                          </span>
                          <strong className="text-xs font-bold text-slate-900">
                            {selectedCandidate.has_military_booklet
                              ? "Al Día (Sí)"
                              : "No Posee"}
                          </strong>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[#0B3B70] shrink-0">
                          <Bike className="w-4 h-4 text-[#005DA4]" />
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500 block">
                            Dotación de Moto:
                          </span>
                          <strong className="text-xs font-bold text-slate-900">
                            {selectedCandidate.has_own_motorcycle
                              ? `Sí (${selectedCandidate.motorcycle_cc || 150}cc)`
                              : "No Posee"}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* HOJA DE VIDA EN PDF & SOPORTES */}
                  <div className="p-4 rounded-2xl bg-[#EAF3FA]/50 border border-[#D5E6F5] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText
                          className="w-4 h-4 text-[#005DA4]"
                          strokeWidth={2}
                        />
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
                          className="rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white text-xs h-9 px-5 font-semibold inline-flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Abrir / Descargar Hoja de Vida (PDF)</span>
                          <ExternalLink className="w-3 h-3 text-slate-300" />
                        </button>
                      ) : (
                        <div className="p-3 bg-white border border-dashed border-slate-200 rounded-xl text-xs text-slate-500 text-center w-full">
                          El candidato completó su ficha operativa en línea pero
                          aún no ha subido el archivo PDF.
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          setCvModalCandidateId(selectedCandidate.id)
                        }
                        className="rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs h-9 px-4 font-semibold inline-flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <span>Abrir Visor 360° de Hoja de Vida</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-2 shadow-2xs">
                  <User
                    className="w-8 h-8 text-slate-300 mx-auto"
                    strokeWidth={1.5}
                  />
                  <h4 className="text-xs font-bold text-slate-800">
                    Ningún candidato seleccionado
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Selecciona un aspirante del listado para ver su expediente y
                    desglose de adecuación.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* VISOR 360° DE HOJA DE VIDA PARA EMPRESAS (FASE 3) */}
      <CandidateCvModal
        isOpen={!!cvModalCandidate}
        onClose={() => setCvModalCandidateId(null)}
        candidate={cvModalCandidate}
        companyName={companyName}
        vacancyTitle={vacancyTitle}
        onStatusChange={handleStatusChange}
        onOpenStudyModal={() => {
          if (cvModalCandidate) {
            setSelectedCandidateForStudy(cvModalCandidate);
          }
          setCvModalCandidateId(null);
        }}
      />

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
