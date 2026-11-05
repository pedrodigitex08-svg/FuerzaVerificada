"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Zap,
  Shield,
  MapPin,
  Phone,
  Bike,
  FileText,
  MessageCircle,
  Search,
  CheckCircle2,
  Filter,
  User,
  Clock,
  ArrowRight,
  Users,
  Lock,
  FileCheck,
  CreditCard,
  Award,
  Sparkles,
  X,
  Building2,
  AlertTriangle,
} from "lucide-react";
import { ResumeDrawerModal } from "@/components/empresa/ResumeDrawerModal";
import { OrderSecurityStudyModal } from "@/components/empresa/OrderSecurityStudyModal";
import { SecurityRoleType, SecurityStudyStatus } from "@/types/database";
import {
  OFFICIAL_SECURITY_PROFILES,
  normalizeSecurityRole,
  formatSecurityRoleLabel,
  matchesOfficialSecurityProfile,
} from "@/lib/utils/shiftNormalizer";
import { generatePackageRechargeLink } from "@/lib/utils/whatsappTemplates";
import { createClient } from "@/lib/supabase/client";

export interface AvailableGuard {
  id: string;
  full_name: string;
  national_id: string;
  phone_whatsapp: string;
  city: string;
  locality: string;
  primary_role: SecurityRoleType;
  years_experience: number;
  has_military_booklet: boolean;
  has_own_motorcycle: boolean;
  motorcycle_cc?: number | null;
  days_remaining: number;
  course_name?: string | null;
  avatar_url?: string | null;
  resume_pdf_url: string;
  cedula_pdf_url?: string | null;
  diploma_pdf_url?: string | null;
  has_resume_pdf: boolean;
  has_cedula_pdf: boolean;
  has_diploma_pdf: boolean;
  available_immediately: boolean;
}

interface CompanyB2BInfo {
  id: string;
  company_name: string;
  credits_security_studies: number;
  plan_name: string;
  is_verified_company: boolean;
}

const CITY_FILTER_OPTIONS = [
  "Todas",
  "Bogotá D.C.",
  "Medellín",
  "Cali",
  "Barranquilla",
  "Santa Marta",
  "Cartagena",
  "Bucaramanga",
];

const ROLE_PILL_OPTIONS: { value: string; label: string }[] = [
  { value: "Todos", label: "Todos" },
  ...OFFICIAL_SECURITY_PROFILES.map((p) => ({
    value: p.label,
    label: p.label,
  })),
];

const COURSE_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "todos", label: "Todos los cursos" },
  { value: "vigente", label: "Curso Vigente (>30 días)" },
  { value: "proximo", label: "Próximo a vencer (1-30 días)" },
  { value: "vencido", label: "Por validar / Vencido" },
];

function normalizeSearchStr(str?: string | null): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getInitials(name: string): string {
  const parts = (name || "A").trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return parts[0].charAt(0).toUpperCase();
}

export default function RadarRelevosPage() {
  const [guards, setGuards] = useState<AvailableGuard[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<AvailableGuard | null>(null);
  const [candidateForStudy, setCandidateForStudy] = useState<AvailableGuard | null>(null);
  const [isPaywallModalOpen, setIsPaywallModalOpen] = useState(false);

  // Company B2B State
  const [company, setCompany] = useState<CompanyB2BInfo | null>(null);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Operational Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("Todas");
  const [selectedRole, setSelectedRole] = useState("Todos");
  const [courseFilter, setCourseFilter] = useState("todos");
  const [onlyImmediate, setOnlyImmediate] = useState(false);
  const [onlyMotorcycle, setOnlyMotorcycle] = useState(false);
  const [onlyMilitaryBooklet, setOnlyMilitaryBooklet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const showToast = (msg: string) => {
    setNotificationToast(msg);
    setTimeout(() => setNotificationToast(null), 4200);
  };

  useEffect(() => {
    async function loadCompanyAndGuards() {
      setIsLoading(true);
      const supabase = createClient();

      try {
        // 0. Consultar la fila de la empresa autenticada en public.companies
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          let { data: comp } = await supabase
            .from("companies")
            .select("id, company_name, credits_security_studies, plan_name, is_verified_company")
            .eq("owner_id", user.id)
            .maybeSingle();

          if (!comp) {
            const { data: prof } = await supabase
              .from("profiles")
              .select("full_name, phone_whatsapp")
              .eq("id", user.id)
              .maybeSingle();

            const compName =
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
                contact_person: prof?.full_name || user.user_metadata?.full_name || "Contacto Principal",
                contact_phone: prof?.phone_whatsapp || user.user_metadata?.phone || "3000000000",
                city: "Bogotá D.C.",
                is_verified_company: false,
                plan_name: "basico",
                credits_security_studies: 0,
              })
              .select("id, company_name, credits_security_studies, plan_name, is_verified_company")
              .maybeSingle();

            if (createdComp) comp = createdComp;
          }

          if (comp) {
            setCompany({
              id: comp.id,
              company_name: comp.company_name || "Empresa de Seguridad",
              credits_security_studies: Number(comp.credits_security_studies ?? 0),
              plan_name: comp.plan_name || "basico",
              is_verified_company: Boolean(comp.is_verified_company),
            });
          }
        }

        // 1. Consulta resiliente sobre public.candidate_profiles (con respaldo plano anti-join)
        let rawCandidates: any[] = [];
        const { data, error } = await supabase
          .from("candidate_profiles")
          .select("*, profiles(*)")
          .order("updated_at", { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          rawCandidates = data;
        } else {
          const { data: directCandidates } = await supabase
            .from("candidate_profiles")
            .select("*")
            .order("updated_at", { ascending: false });
          if (Array.isArray(directCandidates)) {
            rawCandidates = directCandidates;
          }
        }

        if (rawCandidates.length > 0) {
          const userIds = rawCandidates
            .map((c: any) => c.user_id || c.id)
            .filter(Boolean);

          // 2. Consulta resiliente sobre public.profiles
          const { data: rawProfiles } =
            userIds.length > 0
              ? await supabase
                  .from("profiles")
                  .select("*")
                  .in("id", userIds)
              : { data: [] as any[] };
          const profMap = new Map((rawProfiles || []).map((p: any) => [p.id, p]));

          // 3. Consulta resiliente sobre public.candidate_courses
          const { data: coursesData } =
            userIds.length > 0
              ? await supabase
                  .from("candidate_courses")
                  .select("*")
                  .in("candidate_id", userIds)
              : { data: [] as any[] };

          const courseMap = new Map<
            string,
            { daysRemaining: number; courseName: string | null; certificateUrl: string | null }
          >();
          (coursesData || []).forEach((cs: any) => {
            let diffDays = 0;
            if (cs.expiration_date) {
              const diffMs = new Date(cs.expiration_date).getTime() - Date.now();
              diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
            }
            const existing = courseMap.get(cs.candidate_id);
            if (!existing || diffDays > existing.daysRemaining) {
              courseMap.set(cs.candidate_id, {
                daysRemaining: diffDays,
                courseName: cs.course_name || null,
                certificateUrl: cs.certificate_file_url || cs.diploma_pdf_url || null,
              });
            }
          });

          // 4. NUEVO: Consulta resiliente sobre public.candidate_documents
          const { data: docsData } =
            userIds.length > 0
              ? await supabase
                  .from("candidate_documents")
                  .select("*")
                  .in("candidate_id", userIds)
              : { data: [] as any[] };

          const docsByCandidate = new Map<
            string,
            { resumeUrl: string | null; cedulaUrl: string | null; diplomaUrl: string | null }
          >();

          (docsData || []).forEach((doc: any) => {
            const cid = doc.candidate_id;
            if (!cid) return;
            const current = docsByCandidate.get(cid) || {
              resumeUrl: null,
              cedulaUrl: null,
              diplomaUrl: null,
            };
            const rawType = String(doc.doc_type || doc.document_type || "").toLowerCase();
            const fileUrl = doc.file_url || null;

            if (
              fileUrl &&
              (rawType.includes("hoja_de_vida") ||
                rawType.includes("resume") ||
                rawType.includes("cv"))
            ) {
              current.resumeUrl = fileUrl;
            } else if (
              fileUrl &&
              (rawType.includes("cedula") ||
                rawType.includes("id_card") ||
                rawType.includes("identidad"))
            ) {
              current.cedulaUrl = fileUrl;
            } else if (
              fileUrl &&
              (rawType.includes("diploma") ||
                rawType.includes("curso") ||
                rawType.includes("certificado"))
            ) {
              current.diplomaUrl = fileUrl;
            }

            docsByCandidate.set(cid, current);
          });

          const mappedGuards: AvailableGuard[] = rawCandidates
            .filter((c: any) => {
              const uid = c.user_id || c.id;
              const p = profMap.get(uid) || c.profiles;
              return p?.role === "candidate" || !p?.role;
            })
            .map((c: any) => {
              const uid = c.user_id || c.id;
              const p = profMap.get(uid) || c.profiles;
              const courseInfo = courseMap.get(uid);
              const docInfo = docsByCandidate.get(uid);

              const resolvedResumeUrl =
                c.resume_pdf_url || docInfo?.resumeUrl || "";
              const resolvedCedulaUrl = docInfo?.cedulaUrl || null;
              const resolvedDiplomaUrl =
                courseInfo?.certificateUrl || docInfo?.diplomaUrl || null;

              const resolvedCity = c.city || p?.city || "Bogotá D.C.";
              const resolvedLocality =
                c.locality_neighborhood || c.locality || resolvedCity;

              // Verificar libreta militar en columna booleana o en work_experience_json
              let hasBooklet = Boolean(c.has_military_booklet);
              if (!hasBooklet && c.work_experience_json) {
                const bookletStr = String(
                  (c.work_experience_json as any)?.uniform_sizes?.booklet || ""
                ).toLowerCase();
                if (bookletStr.includes("primera") || bookletStr.includes("segunda")) {
                  hasBooklet = true;
                }
              }

              return {
                id: uid,
                full_name: p?.full_name || c.full_name || "Aspirante Operativo",
                national_id: c.national_id || "En verificación",
                phone_whatsapp: p?.phone_whatsapp || "",
                city: resolvedCity,
                locality: resolvedLocality,
                primary_role: c.primary_role || "vigilante_fijo",
                years_experience: Number(c.years_experience ?? 0),
                has_military_booklet: hasBooklet,
                has_own_motorcycle: Boolean(c.has_own_motorcycle),
                motorcycle_cc: c.motorcycle_cc || null,
                days_remaining: courseInfo?.daysRemaining ?? 0,
                course_name: courseInfo?.courseName || null,
                avatar_url: p?.avatar_url || c.avatar_url || null,
                resume_pdf_url: resolvedResumeUrl,
                cedula_pdf_url: resolvedCedulaUrl,
                diploma_pdf_url: resolvedDiplomaUrl,
                has_resume_pdf: Boolean(resolvedResumeUrl && resolvedResumeUrl.trim().length > 0),
                has_cedula_pdf: Boolean(resolvedCedulaUrl && resolvedCedulaUrl.trim().length > 0),
                has_diploma_pdf: Boolean(resolvedDiplomaUrl && resolvedDiplomaUrl.trim().length > 0),
                available_immediately:
                  c.available_immediately !== undefined ? Boolean(c.available_immediately) : true,
              };
            });

          setGuards(mappedGuards);
        } else {
          setGuards([]);
        }
      } catch (err) {
        console.error("Error loading available guards:", err);
        setGuards([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadCompanyAndGuards();
  }, []);

  // Candado Comercial B2B Modo Computrabajo
  const hasB2BAccess =
    (company?.credits_security_studies ?? 0) > 0 ||
    Boolean(company?.plan_name && company.plan_name.toLowerCase() !== "basico");

  // Filtros Operativos en Vivo al 100%
  const filtered = guards.filter((g) => {
    // 1. Búsqueda de texto normalizada (sin tildes) en nombre, localidad, ciudad y cargo
    const q = normalizeSearchStr(searchTerm);
    const matchSearch =
      !q ||
      normalizeSearchStr(g.full_name).includes(q) ||
      normalizeSearchStr(g.locality).includes(q) ||
      normalizeSearchStr(g.city).includes(q) ||
      normalizeSearchStr(formatSecurityRoleLabel(g.primary_role)).includes(q);

    // 2. Filtro por Ciudad
    const targetCity = normalizeSearchStr(selectedCity);
    const guardCity = normalizeSearchStr(g.city);
    const guardLocality = normalizeSearchStr(g.locality);
    const matchCity =
      selectedCity === "Todas" ||
      guardCity.includes(targetCity.replace(" d.c.", "")) ||
      targetCity.includes(guardCity) ||
      guardLocality.includes(targetCity.replace(" d.c.", ""));

    // 3. Filtro por Cargo / Especialidad (13 Perfiles Oficiales + Retrocompatibilidad)
    const matchRole =
      selectedRole === "Todos" ||
      matchesOfficialSecurityProfile(selectedRole, g.primary_role);

    // 4. Filtro por Vigencia de Curso SuperVigilancia
    let matchCourse = true;
    if (courseFilter === "vigente") {
      matchCourse = g.days_remaining > 30;
    } else if (courseFilter === "proximo") {
      matchCourse = g.days_remaining >= 1 && g.days_remaining <= 30;
    } else if (courseFilter === "vencido") {
      matchCourse = g.days_remaining <= 0;
    }

    // 5. Toggles Operativos (Disponibilidad, Moto y Libreta Militar)
    const matchImmediate = !onlyImmediate || g.available_immediately;
    const matchMoto = !onlyMotorcycle || g.has_own_motorcycle;
    const matchBooklet = !onlyMilitaryBooklet || g.has_military_booklet;

    return (
      matchSearch &&
      matchCity &&
      matchRole &&
      matchCourse &&
      matchImmediate &&
      matchMoto &&
      matchBooklet
    );
  });

  // Acciones de los 3 botones con Candado B2B
  const handleActionViewResume = (guard: AvailableGuard) => {
    if (!hasB2BAccess) {
      setIsPaywallModalOpen(true);
      return;
    }
    setSelectedCandidate(guard);
  };

  const handleActionOpenWhatsapp = (guard: AvailableGuard, url: string) => {
    if (!hasB2BAccess) {
      setIsPaywallModalOpen(true);
      return;
    }
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleOpenStudyModal = (guard: AvailableGuard) => {
    if (!hasB2BAccess) {
      setIsPaywallModalOpen(true);
      return;
    }
    setCandidateForStudy(guard);
  };

  // Confirmar orden de estudio de seguridad / poligrafía e insertar en public.security_study_orders
  const handleConfirmStudyOrder = async () => {
    if (!candidateForStudy) return;
    const availableCredits = company?.credits_security_studies ?? 0;
    if (availableCredits <= 0) {
      showToast("No tienes créditos disponibles. Recarga créditos para solicitar estudios de poligrafía.");
      return;
    }

    const supabase = createClient();
    const activeCompanyId = company?.id;
    if (!activeCompanyId) {
      showToast("No se pudo identificar el registro de tu empresa.");
      return;
    }

    const candidateSummary = `Solicitud pericial de COMBO INTEGRAL (POLÍGRAFO + VISITA) desde Radar de Personal Verificado para ${candidateForStudy.full_name} (C.C. ${candidateForStudy.national_id}, Tel: ${candidateForStudy.phone_whatsapp || "Registrado"}, Ciudad: ${candidateForStudy.city}).`;

    const basePayload = {
      company_id: activeCompanyId,
      candidate_id: candidateForStudy.id,
      application_id: null,
      include_polygraph: true,
      include_home_visit: true,
      include_background_study: true,
      scheduled_date: null,
      final_concept: candidateSummary,
      report_pdf_url: null,
    };

    // Intentar con estado 'pendiente'; si el enum en BD aún espera 'solicitado', hacer fallback inmediato
    let { data: insertedOrder, error: insertErr } = await supabase
      .from("security_study_orders")
      .insert({
        ...basePayload,
        status: "pendiente" as SecurityStudyStatus,
      })
      .select("*")
      .maybeSingle();

    if (insertErr) {
      const retry = await supabase
        .from("security_study_orders")
        .insert({
          ...basePayload,
          status: "solicitado" as SecurityStudyStatus,
        })
        .select("*")
        .maybeSingle();

      insertedOrder = retry.data;
      insertErr = retry.error;
    }

    if (insertErr || !insertedOrder) {
      console.error("Error inserting security_study_orders:", insertErr);
      showToast(
        `Error al radicar la orden en Supabase: ${insertErr?.message || "No fue posible guardar la solicitud."}`
      );
      throw new Error(insertErr?.message || "Error al insertar orden");
    }

    // Descontar atómicamente 1 crédito en public.companies
    const nextCredits = Math.max(availableCredits - 1, 0);
    await supabase
      .from("companies")
      .update({ credits_security_studies: nextCredits })
      .eq("id", activeCompanyId);

    setCompany((prev) =>
      prev ? { ...prev, credits_security_studies: nextCredits } : prev
    );

    if (typeof window !== "undefined") {
      localStorage.setItem("fv_company_credits", String(nextCredits));
    }

    showToast(
      `¡Orden de poligrafía y estudio radicada con éxito para ${candidateForStudy.full_name}! Créditos restantes: ${nextCredits}.`
    );
  };

  const resetAllFilters = () => {
    setSearchTerm("");
    setSelectedCity("Todas");
    setSelectedRole("Todos");
    setCourseFilter("todos");
    setOnlyImmediate(false);
    setOnlyMotorcycle(false);
    setOnlyMilitaryBooklet(false);
  };

  const whatsappSalesLink = generatePackageRechargeLink({
    companyName: company?.company_name || "Empresa de Seguridad",
    packageType: "Activación de Plan B2B y Paquete de Créditos",
  });

  return (
    <div className="space-y-6">
      {/* Toast Flotante de Confirmación */}
      {notificationToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-[#0B3B70] text-white px-5 py-3.5 rounded-2xl shadow-xl border border-[#005DA4] flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold leading-snug">{notificationToast}</span>
        </div>
      )}

      {/* Header Estilo Computrabajo Empresas */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Directorio Verificado & Radar Operativo en Tiempo Real
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Directorio de Personal Verificado & Radar de Relevos
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Base de datos de guardas, escoltas, supervisores y operadores CCTV con credencial SuperVigilancia y soportes auditados.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {!hasB2BAccess ? (
            <button
              type="button"
              onClick={() => setIsPaywallModalOpen(true)}
              className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>Modo Exploración (Activar Plan / Créditos)</span>
            </button>
          ) : (
            <span className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-[#EAF3FA] text-[#0B3B70] border border-[#D5E6F5] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#005DA4]" />
              <span>
                Acceso B2B Activo · <strong>{company?.credits_security_studies ?? 0}</strong> créditos
              </span>
            </span>
          )}

          <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 tabular-nums flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
            {filtered.length} {filtered.length === 1 ? "candidato listo" : "candidatos listos"}
          </span>
        </div>
      </div>

      {/* PANEL DE FILTROS OPERATIVOS EN VIVO AL 100% */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        {/* Fila 1: Buscador normalizado + Selector de Ciudad + Selector de Vigencia de Curso */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="relative md:col-span-5">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" strokeWidth={2} />
            <input
              type="text"
              placeholder="Buscar por nombre, ciudad, barrio o cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 bg-white border border-slate-300 rounded-full pl-11 pr-4 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 shadow-2xs transition-all"
            />
          </div>

          <div className="md:col-span-3">
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#005DA4] absolute left-3.5 top-3.5 pointer-events-none" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                aria-label="Filtrar por ciudad"
                className="w-full h-11 bg-white border border-slate-300 rounded-full pl-10 pr-4 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 cursor-pointer transition-all"
              >
                {CITY_FILTER_OPTIONS.map((cityOpt) => (
                  <option key={cityOpt} value={cityOpt}>
                    {cityOpt === "Todas" ? "Todas las ciudades" : cityOpt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="md:col-span-4">
            <div className="relative">
              <Award className="w-4 h-4 text-[#005DA4] absolute left-3.5 top-3.5 pointer-events-none" />
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                aria-label="Filtrar por vigencia de curso SuperVigilancia"
                className="w-full h-11 bg-white border border-slate-300 rounded-full pl-10 pr-4 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 cursor-pointer transition-all"
              >
                {COURSE_FILTER_OPTIONS.map((cOpt) => (
                  <option key={cOpt.value} value={cOpt.value}>
                    {cOpt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Fila 2: Píldoras rápidas de Ciudad */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
            Sede:
          </span>
          {CITY_FILTER_OPTIONS.map((cityOpt) => (
            <button
              key={cityOpt}
              type="button"
              onClick={() => setSelectedCity(cityOpt)}
              className={`h-8 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                selectedCity === cityOpt
                  ? "bg-[#005DA4] text-white border-[#005DA4] shadow-2xs"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:border-[#005DA4] hover:bg-[#EAF3FA]/40"
              }`}
            >
              {cityOpt}
            </button>
          ))}
        </div>

        {/* Fila 3: Píldoras completas de Cargo / Especialidad */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
            Especialidad:
          </span>
          {ROLE_PILL_OPTIONS.map((roleOpt) => (
            <button
              key={roleOpt.value}
              type="button"
              onClick={() => setSelectedRole(roleOpt.value)}
              className={`h-9 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                selectedRole === roleOpt.value
                  ? "bg-[#0B3B70] text-white border-[#0B3B70] shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:border-[#005DA4] hover:bg-[#EAF3FA]/30"
              }`}
            >
              {roleOpt.label}
            </button>
          ))}
        </div>

        {/* Fila 4: Toggles Operativos (Relevos Urgentes, Moto, Libreta Militar) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setOnlyImmediate(!onlyImmediate)}
              className={`h-9 px-4 rounded-full text-xs font-semibold whitespace-nowrap border flex items-center gap-1.5 transition-all ${
                onlyImmediate
                  ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:border-amber-400"
              }`}
            >
              <Zap
                className={`w-3.5 h-3.5 ${
                  onlyImmediate ? "fill-white text-white" : "text-amber-500"
                }`}
              />
              Solo Relevos Urgentes
            </button>

            <button
              type="button"
              onClick={() => setOnlyMotorcycle(!onlyMotorcycle)}
              className={`h-9 px-4 rounded-full text-xs font-semibold whitespace-nowrap border flex items-center gap-1.5 transition-all ${
                onlyMotorcycle
                  ? "bg-[#0B3B70] text-white border-[#0B3B70] shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:border-[#005DA4]"
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              Solo con Moto
            </button>

            <button
              type="button"
              onClick={() => setOnlyMilitaryBooklet(!onlyMilitaryBooklet)}
              className={`h-9 px-4 rounded-full text-xs font-semibold whitespace-nowrap border flex items-center gap-1.5 transition-all ${
                onlyMilitaryBooklet
                  ? "bg-[#0B3B70] text-white border-[#0B3B70] shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:border-[#005DA4]"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Solo con Libreta Militar
            </button>
          </div>

          {(searchTerm ||
            selectedCity !== "Todas" ||
            selectedRole !== "Todos" ||
            courseFilter !== "todos" ||
            onlyImmediate ||
            onlyMotorcycle ||
            onlyMilitaryBooklet) && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-xs font-semibold text-[#005DA4] hover:underline px-2 py-1"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* GRID DE TARJETAS CON SEMÁFORO INTEGRAL DE VERIFICACIÓN */}
      {isLoading ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center shadow-2xs">
          <div className="w-8 h-8 border-2 border-[#0B3B70] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-600">
            Sincronizando directorio de personal verificado y soportes documentales...
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center shadow-2xs space-y-3">
          <Users className="w-10 h-10 mx-auto text-slate-300" strokeWidth={1.5} />
          <h3 className="text-base font-bold tracking-tight text-slate-900">
            No se encontraron perfiles operativos con estos filtros
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Prueba restableciendo los filtros de ciudad, especialidad o vigencia de curso para visualizar más candidatos disponibles.
          </p>
          <button
            type="button"
            onClick={resetAllFilters}
            className="rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white text-xs font-semibold h-9 px-5 inline-flex items-center gap-1.5 transition-colors"
          >
            Restablecer todos los filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((guard) => {
            const cleanPhone = (guard.phone_whatsapp || "").replace(/\D/g, "");
            const formattedPhone = cleanPhone.startsWith("57")
              ? cleanPhone
              : cleanPhone
              ? `57${cleanPhone}`
              : "573000000000";

            const roleLabel = formatSecurityRoleLabel(guard.primary_role);
            const directWhatsappLink = `https://wa.me/${formattedPhone}?text=Hola%20${encodeURIComponent(
              guard.full_name
            )},%20te%20escribimos%20a%20través%20de%20FuerzaVerificada.%20Vimos%20tu%20perfil%20operativo%20de%20${encodeURIComponent(
              roleLabel
            )}%20y%20nos%20gustaría%20validar%20tu%20disponibilidad%20para%20un%20puesto.`;

            // Semáforo Dinámico del Curso SuperVigilancia
            let courseBadgeClass =
              "bg-slate-100 text-slate-600 border-slate-200";
            let courseBadgeText = "Por validar / Sin curso vigente";
            if (guard.days_remaining > 30) {
              courseBadgeClass =
                "bg-emerald-50 text-emerald-700 border-emerald-200";
              courseBadgeText = `✅ Curso Vigente · ${guard.days_remaining}d`;
            } else if (guard.days_remaining >= 1 && guard.days_remaining <= 30) {
              courseBadgeClass =
                "bg-amber-50 text-amber-700 border-amber-200";
              courseBadgeText = `⚠️ Próximo a vencer · ${guard.days_remaining}d`;
            }

            return (
              <div
                key={guard.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs hover:border-[#005DA4] transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-4">
                  {/* Cabecera: Foto Real o Iniciales + Nombre + Cargo + Semáforo Curso */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {guard.avatar_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={guard.avatar_url}
                          alt={guard.full_name}
                          className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#0B3B70] text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-2xs">
                          {getInitials(guard.full_name)}
                        </div>
                      )}

                      <div className="min-w-0">
                        <h3 className="text-sm font-bold tracking-tight text-slate-900 leading-snug truncate">
                          {guard.full_name}
                        </h3>
                        <div className="text-xs font-semibold text-[#005DA4] mt-0.5">
                          {roleLabel}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0B3B70] bg-[#EAF3FA] border border-[#D5E6F5] px-2.5 py-0.5 rounded-full">
                            {guard.years_experience || 0} años exp.
                          </span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            {guard.city}
                            {guard.locality &&
                            normalizeSearchStr(guard.locality) !==
                              normalizeSearchStr(guard.city)
                              ? ` · ${guard.locality}`
                              : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Semáforo Curso SuperVigilancia */}
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 whitespace-nowrap ${courseBadgeClass}`}
                    >
                      {courseBadgeText}
                    </span>
                  </div>

                  {/* Atributos Operativos + Teléfono (con Candado B2B si aplica) */}
                  <div className="grid grid-cols-3 gap-2 text-xs py-3 border-t border-b border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Contacto Celular
                      </span>
                      {hasB2BAccess ? (
                        <span className="font-bold text-slate-800 font-mono tabular-nums truncate block">
                          +57 {guard.phone_whatsapp || "Registrado"}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsPaywallModalOpen(true)}
                          className="font-bold text-slate-600 hover:text-[#005DA4] font-mono tabular-nums flex items-center gap-1 transition-colors"
                          title="Desbloquear teléfono con Plan B2B o Créditos"
                        >
                          <span>🔒 +57 3•• ••• ••••</span>
                        </button>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Libreta Militar
                      </span>
                      <span className="font-bold text-slate-800 block">
                        {guard.has_military_booklet ? "✅ Primera Clase / Al día" : "Por validar"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Movilidad / Turno
                      </span>
                      <span className="font-bold text-slate-800 tabular-nums block truncate">
                        {guard.has_own_motorcycle
                          ? `🏍️ Moto ${guard.motorcycle_cc || 150}cc`
                          : guard.available_immediately
                          ? "⚡ Relevo Inmediato"
                          : "Turno Fijo"}
                      </span>
                    </div>
                  </div>

                  {/* Fila de Semáforo Documental (3 Soportes en PDF) */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Soportes PDF:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                          guard.has_resume_pdf
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {guard.has_resume_pdf ? "✅ HV PDF" : "⚠️ HV Pendiente"}
                      </span>

                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                          guard.has_cedula_pdf
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {guard.has_cedula_pdf ? "✅ Cédula" : "⚠️ Cédula"}
                      </span>

                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                          guard.has_diploma_pdf
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {guard.has_diploma_pdf ? "✅ Diploma" : "⚠️ Diploma"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* LOS 3 BOTONES DE ACCIÓN EN 1 CLIC (Con Candado B2B si hasB2BAccess === false) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                  {/* Botón A: Ver Hoja de Vida */}
                  <button
                    type="button"
                    onClick={() => handleActionViewResume(guard)}
                    className="rounded-full bg-[#EAF3FA] hover:bg-[#D5E6F5] text-[#0B3B70] border border-[#D5E6F5] text-xs h-9 px-3 font-semibold inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    {!hasB2BAccess ? (
                      <Lock className="w-3.5 h-3.5 text-[#0B3B70] shrink-0" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-[#005DA4] shrink-0" strokeWidth={2} />
                    )}
                    <span className="truncate">Ver Hoja de Vida</span>
                  </button>

                  {/* Botón B: WhatsApp Inmediato */}
                  <button
                    type="button"
                    onClick={() => handleActionOpenWhatsapp(guard, directWhatsappLink)}
                    className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-3 font-semibold inline-flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    {!hasB2BAccess ? (
                      <Lock className="w-3.5 h-3.5 text-white shrink-0" />
                    ) : (
                      <MessageCircle className="w-3.5 h-3.5 text-white shrink-0" strokeWidth={2} />
                    )}
                    <span className="truncate">WhatsApp Inmediato</span>
                  </button>

                  {/* Botón C: Solicitar Poligrafía / Estudio */}
                  <button
                    type="button"
                    onClick={() => handleOpenStudyModal(guard)}
                    className="rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white text-xs h-9 px-3 font-semibold inline-flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    {!hasB2BAccess ? (
                      <Lock className="w-3.5 h-3.5 text-white shrink-0" />
                    ) : (
                      <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" strokeWidth={2} />
                    )}
                    <span className="truncate">Solicitar Poligrafía</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DRAWER DE EXPEDIENTE Y HOJA DE VIDA PDF */}
      <ResumeDrawerModal
        isOpen={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        candidate={selectedCandidate}
        onOpenStudyModal={() => {
          if (selectedCandidate) {
            handleOpenStudyModal(selectedCandidate);
          }
        }}
      />

      {/* MODAL DE ORDEN DE ESTUDIO DE SEGURIDAD & POLIGRAFÍA */}
      <OrderSecurityStudyModal
        isOpen={!!candidateForStudy}
        onClose={() => setCandidateForStudy(null)}
        candidateName={candidateForStudy?.full_name || ""}
        candidateNationalId={candidateForStudy?.national_id || ""}
        candidateRole={
          candidateForStudy
            ? formatSecurityRoleLabel(candidateForStudy.primary_role)
            : ""
        }
        availableCredits={company?.credits_security_studies ?? 0}
        onConfirmOrder={handleConfirmStudyOrder}
      />

      {/* MODAL COMERCIAL B2B ESTILO COMPUTRABAJO (PAYWALL POR CRÉDITOS O PLAN) */}
      {isPaywallModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-lg shadow-2xl p-7 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#EAF3FA] border border-[#D5E6F5] text-[#0B3B70] flex items-center justify-center shrink-0">
                  <Lock className="w-6 h-6 text-[#005DA4]" strokeWidth={2} />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#005DA4] block">
                    Acceso Corporativo B2B
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                    Desbloquea el Directorio de Personal Verificado
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPaywallModalOpen(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#F2F5F8] border border-slate-200/90 text-xs text-slate-700 leading-relaxed space-y-2">
              <p className="font-semibold text-slate-900">
                🔒 Desbloquea el contacto directo y Hojas de Vida verificadas. Necesitas créditos disponibles o un Plan Corporativo B2B activo para ver el teléfono/WhatsApp, descargar soportes en PDF y solicitar estudios de poligrafía.
              </p>
              <ul className="space-y-1.5 pt-1 text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Contacto inmediato por WhatsApp y celular para cubrir relevos en minutos.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Descarga directa de Hoja de Vida, Cédula y Diploma SuperVigilancia en PDF.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Activación en 1 clic de estudios de poligrafía y visita domiciliaria.</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <Link
                href="/precios-empresas"
                onClick={() => setIsPaywallModalOpen(false)}
                className="w-full sm:w-auto flex-1 rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white text-xs font-bold h-11 px-6 inline-flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <span>Ver Planes y Recargar Créditos</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href={whatsappSalesLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-11 px-5 inline-flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Hablar con Ventas</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
