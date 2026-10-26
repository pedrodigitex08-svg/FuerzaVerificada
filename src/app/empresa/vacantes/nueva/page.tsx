"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Shield,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Bike,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Building2,
  Check,
  Calendar,
  Radio,
  FileCheck,
} from "lucide-react";
import { SecurityRoleType } from "@/types/database";
import {
  SECURITY_ROLE_OPTIONS,
  normalizeSecurityRole,
  formatSecurityRoleLabel,
} from "@/lib/utils/roleNormalizer";
import { createClient } from "@/lib/supabase/client";

const SHIFTS = [
  "2x2x2 (2 Día, 2 Noche, 2 Descanso)",
  "4x2 Rotativo",
  "5x2 Diurno",
  "6x1 Diurno",
  "12x12 Rotativo",
];

// 4 PLANTILLAS RÁPIDAS DEL SECTOR SEGURIDAD
const QUICK_TEMPLATES = [
  {
    name: "Vigilante Fijo (2x2x2)",
    icon: Shield,
    role: "vigilante_fijo" as SecurityRoleType,
    title: "Vigilante Fijo - Control de Accesos 2x2x2",
    shift: "2x2x2 (2 Día, 2 Noche, 2 Descanso)",
    salary: 1950000,
    requiresCourse: true,
    requiresMilitaryBooklet: true,
    requiresMotorcycle: false,
    minExperienceYears: 1,
    description:
      "Control estricto de accesos peatonales y vehiculares, registro de visitantes y contratistas, rondas perimétricas de verificación física, custodia de activos y reporte oportuno en minuta electrónica según protocolos de la Superintendencia de Vigilancia y Seguridad Privada.",
  },
  {
    name: "Escolta Motorizado",
    icon: Bike,
    role: "escolta_motorizado" as SecurityRoleType,
    title: "Escolta Motorizado - Protección de Personas y Mercancías",
    shift: "12x12 Rotativo",
    salary: 2850000,
    requiresCourse: true,
    requiresMilitaryBooklet: true,
    requiresMotorcycle: true,
    minMotorcycleCc: 200,
    minExperienceYears: 2,
    description:
      "Custodia y protección armada en desplazamientos urbanos e intermunicipales, evaluación preventiva de rutas críticas, técnicas de manejo defensivo y evasivo en motocicleta de alto cilindraje y reacción inmediata ante contingencias de seguridad.",
  },
  {
    name: "Operador CCTV / Medios",
    icon: Radio,
    role: "operador_cctv" as SecurityRoleType,
    title: "Operador de Medios Tecnológicos - Centro de Control CCTV",
    shift: "2x2x2 (2 Día, 2 Noche, 2 Descanso)",
    salary: 2200000,
    requiresCourse: true,
    requiresMilitaryBooklet: false,
    requiresMotorcycle: false,
    minExperienceYears: 1,
    description:
      "Monitoreo constante de cámaras de seguridad y circuito cerrado de televisión (CCTV), control perimétrico digital, recepción y despacho de alarmas, coordinación radial con cuadrantes y personal operativo, y elaboración de bitácoras de incidencias.",
  },
  {
    name: "Supervisor de Patrulla / Zona",
    icon: Briefcase,
    role: "supervisor_puesto" as SecurityRoleType,
    title: "Supervisor de Puestos y Patrulla Operativa",
    shift: "4x2 Rotativo",
    salary: 2600000,
    requiresCourse: true,
    requiresMilitaryBooklet: true,
    requiresMotorcycle: true,
    minMotorcycleCc: 150,
    minExperienceYears: 3,
    description:
      "Supervisión táctica y disciplinaria de puestos asignados en la zona, revista de armamento y minutas de servicio, atención y relevo oportuno de contingencias, instrucción de consignas del cliente y control estricto de dotación reglamentaria.",
  },
];

export default function NuevaVacantePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const [companyName, setCompanyName] = useState("Empresa de Seguridad");
  const [honeypot, setHoneypot] = useState("");
  const [activeTemplateName, setActiveTemplateName] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [roleRequired, setRoleRequired] = useState<SecurityRoleType>("vigilante_fijo");
  const [city, setCity] = useState("Bogotá D.C.");
  const [zone, setZone] = useState("");
  const [shift, setShift] = useState(SHIFTS[0]);
  const [salaryMonthly, setSalaryMonthly] = useState(1950000);
  const [includesSurcharges, setIncludesSurcharges] = useState(true);
  const [description, setDescription] = useState("");
  const [interviewAddress, setInterviewAddress] = useState("");

  // Exclusions
  const [requiresCourse, setRequiresCourse] = useState(true);
  const [requiresMilitaryBooklet, setRequiresMilitaryBooklet] = useState(true);
  const [requiresMotorcycle, setRequiresMotorcycle] = useState(false);
  const [minMotorcycleCc, setMinMotorcycleCc] = useState(150);
  const [minExperienceYears, setMinExperienceYears] = useState(1);
  const [isStrictFilter, setIsStrictFilter] = useState(true);
  const [isUrgentRelief, setIsUrgentRelief] = useState(false);

  useEffect(() => {
    async function loadCompanyInfo() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: comp } = await supabase
          .from("companies")
          .select("company_name, city")
          .eq("owner_id", user.id)
          .maybeSingle();

        if (comp?.company_name) {
          setCompanyName(comp.company_name);
          if (comp.city) setCity(comp.city);
          return;
        }

        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();
        if (prof?.full_name) setCompanyName(prof.full_name);
      } catch {}
    }

    loadCompanyInfo();
  }, [supabase]);

  // Aplicar plantilla rápida en 1 clic
  const handleApplyTemplate = (tmpl: (typeof QUICK_TEMPLATES)[0]) => {
    setActiveTemplateName(tmpl.name);
    setTitle(tmpl.title);
    setRoleRequired(tmpl.role);
    setShift(tmpl.shift);
    setSalaryMonthly(tmpl.salary);
    setRequiresCourse(tmpl.requiresCourse);
    setRequiresMilitaryBooklet(tmpl.requiresMilitaryBooklet);
    setRequiresMotorcycle(tmpl.requiresMotorcycle);
    if (tmpl.minMotorcycleCc) setMinMotorcycleCc(tmpl.minMotorcycleCc);
    setMinExperienceYears(tmpl.minExperienceYears);
    setDescription(tmpl.description);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return;
    setLoading(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      if (!userId) {
        router.push("/login?error=unauthorized_company");
        return;
      }

      let resolvedCompanyId = userId;
      let resolvedCompanyName = companyName;
      let resolvedVerified = false;

      const { data: existingComp } = await supabase
        .from("companies")
        .select("id, company_name, is_verified_company")
        .eq("owner_id", userId)
        .maybeSingle();

      if (existingComp) {
        resolvedCompanyId = existingComp.id;
        resolvedCompanyName = existingComp.company_name || companyName;
        resolvedVerified = Boolean(existingComp.is_verified_company);
      } else {
        // Auto-crear registro de empresa si el usuario aún no lo tiene
        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name, phone_whatsapp")
          .eq("id", userId)
          .maybeSingle();

        const meta = authData.user?.user_metadata || {};
        const cleanCompName =
          companyName ||
          meta.company_name ||
          prof?.full_name ||
          authData.user?.email?.split("@")[0] ||
          "Empresa de Seguridad";
        const cleanNit = meta.nit || "";
        const cleanPhone = prof?.phone_whatsapp || meta.phone_whatsapp || "";

        const { data: createdComp } = await supabase
          .from("companies")
          .insert({
            owner_id: userId,
            company_name: cleanCompName,
            nit: cleanNit,
            city,
            contact_person: prof?.full_name || "Contacto Principal",
            contact_phone: cleanPhone,
            is_verified_company: false,
            plan_name: "basico",
            credits_security_studies: 0,
          })
          .select("id, company_name, is_verified_company")
          .maybeSingle();

        if (createdComp) {
          resolvedCompanyId = createdComp.id;
          resolvedCompanyName = createdComp.company_name;
          resolvedVerified = Boolean(createdComp.is_verified_company);
        }
      }

      const normalizedRoleRequired = normalizeSecurityRole(roleRequired);
      const roleLabel = formatSecurityRoleLabel(roleRequired);

      const payload = {
        company_id: resolvedCompanyId,
        title: title.trim() || `${roleLabel} - ${city}`,
        role_required: normalizedRoleRequired,
        city,
        zone_neighborhood: zone.trim() || "Zona Principal",
        shift,
        salary_monthly: salaryMonthly,
        includes_surcharges: includesSurcharges,
        requires_active_course: requiresCourse,
        requires_motorcycle: requiresMotorcycle,
        min_motorcycle_cc: requiresMotorcycle ? minMotorcycleCc : null,
        requires_military_booklet: requiresMilitaryBooklet,
        min_experience_years: minExperienceYears,
        is_strict_filter: isStrictFilter,
        is_urgent_relief: isUrgentRelief,
        description:
          description.trim() ||
          "Control de accesos, rondas preventivas y cumplimiento de protocolos de seguridad.",
        interview_address: interviewAddress.trim() || null,
        is_active: true,
      };

      const { data: insertedJob, error: jobPostErr } = await supabase
        .from("job_posts")
        .insert(payload)
        .select("*")
        .maybeSingle();

      if (jobPostErr) {
        await supabase.from("jobs").insert(payload);
      }

      setSuccessToast(true);
      setTimeout(() => {
        router.push("/empresa/vacantes");
      }, 1200);
    } catch {
      router.push("/empresa/vacantes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            Publicador Táctico de Vacantes
          </h1>
          <p className="text-xs text-slate-600 font-normal">
            Configure requerimientos operativos y filtros excluyentes para recibir candidatos idóneos en minutos.
          </p>
        </div>

        <Link href="/empresa/vacantes" className="btn-secondary text-xs h-9 px-3.5 inline-flex items-center gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>Volver a Mis Vacantes</span>
        </Link>
      </div>

      {successToast && (
        <div className="p-3.5 rounded-md bg-emerald-600 text-white text-xs font-medium flex items-center gap-2 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
          <span>¡Vacante publicada con éxito! Redirigiendo a tu bandeja ATS...</span>
        </div>
      )}

      {/* PLANTILLAS RÁPIDAS DEL SECTOR SEGURIDAD (1 CLIC) */}
      <div className="bg-white border border-slate-200/90 rounded-lg p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-bold text-xs">
              ⚡
            </span>
            <span className="text-xs font-semibold text-slate-900 tracking-tight">
              Plantillas Rápidas del Sector Seguridad (Publicación en 30 Segundos)
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Haz clic en una plantilla para pre-llenar funciones, requisitos y turnos oficiales:
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {QUICK_TEMPLATES.map((tmpl) => {
            const Icon = tmpl.icon;
            const isSelected = activeTemplateName === tmpl.name;

            return (
              <button
                key={tmpl.name}
                type="button"
                onClick={() => handleApplyTemplate(tmpl)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-slate-50/70 border-slate-200/90 text-slate-700 hover:border-slate-400 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center ${
                      isSelected ? "bg-slate-800 text-amber-400" : "bg-white border border-slate-200 text-slate-700"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                      Aplicada ✓
                    </span>
                  )}
                </div>

                <div className="font-semibold text-xs leading-tight">
                  {tmpl.name}
                </div>
                <div
                  className={`text-[11px] font-mono tabular-nums mt-0.5 ${
                    isSelected ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  ${(tmpl.salary / 1000000).toFixed(2)}M • {tmpl.shift.split(" ")[0]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2-COLUMN WORKSPACE: FORM (7 cols) + LIVE CARD PREVIEW (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: STRUCTURED FORM */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-white border border-slate-200/90 rounded-lg p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-6"
        >
          {/* Anti-Spam Honeypot */}
          <div className="hidden" aria-hidden="true" tabIndex={-1}>
            <input
              type="text"
              name="fv_field_check"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {/* Section 1: General Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Datos Principales del Puesto
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Título Público de la Vacante
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Vigilante Fijo - Centro Empresarial Calle 100"
                className="w-full h-10 bg-white border border-slate-200/90 rounded-md px-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Cargo Operativo Requerido:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SECURITY_ROLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRoleRequired(opt.value)}
                    className={`p-2 rounded-md text-xs font-medium border text-left transition-all ${
                      normalizeSecurityRole(roleRequired) === opt.value
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-slate-50/70 text-slate-700 border-slate-200/90 hover:bg-slate-100"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Ciudad Sede
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full h-10 bg-white border border-slate-200/90 rounded-md px-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
                >
                  <option value="Bogotá D.C.">Bogotá D.C.</option>
                  <option value="Medellín">Medellín</option>
                  <option value="Cali">Cali</option>
                  <option value="Barranquilla">Barranquilla</option>
                  <option value="Bucaramanga">Bucaramanga</option>
                  <option value="Cartagena">Cartagena</option>
                  <option value="Pereira">Pereira</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Zona / Barrio / Localidad
                </label>
                <input
                  type="text"
                  required
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  placeholder="Ej: Chicó Norte, Fontibón, Suba"
                  className="w-full h-10 bg-white border border-slate-200/90 rounded-md px-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Esquema de Turno Operativo
              </label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="w-full h-10 bg-white border border-slate-200/90 rounded-md px-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-mono tabular-nums transition-colors"
              >
                {SHIFTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Salary & Surcharges */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Salario Mensual Básico (COP)
                </label>
                <input
                  type="number"
                  step={50000}
                  value={salaryMonthly}
                  onChange={(e) => setSalaryMonthly(Number(e.target.value))}
                  className="w-full h-10 bg-white border border-slate-200/90 rounded-md px-3.5 text-sm text-slate-900 font-mono font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
                />
              </div>

              <div className="p-2.5 rounded-md border border-slate-200/90 bg-slate-50/70 flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-800 block">Recargos de Ley</span>
                  <span className="text-[10px] text-slate-500">+ Nocturnos / Dominicales</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIncludesSurcharges(!includesSurcharges)}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center ${
                    includesSurcharges ? "bg-emerald-600 justify-end" : "bg-slate-300 justify-start"
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Dirección Sede para Citación a Entrevista
              </label>
              <input
                type="text"
                required
                value={interviewAddress}
                onChange={(e) => setInterviewAddress(e.target.value)}
                placeholder="Ej: Cra 15 # 98-42, Oficina 301, Bogotá"
                className="w-full h-10 bg-white border border-slate-200/90 rounded-md px-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Descripción del Servicio y Funciones
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white border border-slate-200/90 rounded-md p-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
              />
            </div>
          </div>

          {/* Section 2: Exclusions & Filters */}
          <div className="space-y-4 pt-4 border-t border-slate-200/80">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Filtros Técnicos Excluyentes
            </h3>

            <div className="space-y-2.5">
              <div className="p-3 rounded-md border border-slate-200/90 bg-slate-50/70 flex items-center justify-between">
                <div>
                  <strong className="text-xs text-slate-900 block font-semibold">
                    Curso SuperVigilancia Vigente Obligatorio
                  </strong>
                  <span className="text-[11px] text-slate-500">
                    Descarta automáticamente hojas de vida sin credencial vigente
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setRequiresCourse(!requiresCourse)}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center ${
                    requiresCourse ? "bg-emerald-600 justify-end" : "bg-slate-300 justify-start"
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </button>
              </div>

              <div className="p-3 rounded-md border border-slate-200/90 bg-slate-50/70 flex items-center justify-between">
                <div>
                  <strong className="text-xs text-slate-900 block font-semibold">
                    Libreta Militar al Día Requerida
                  </strong>
                  <span className="text-[11px] text-slate-500">
                    Indispensable para puestos con armamento
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setRequiresMilitaryBooklet(!requiresMilitaryBooklet)}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center ${
                    requiresMilitaryBooklet ? "bg-emerald-600 justify-end" : "bg-slate-300 justify-start"
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </button>
              </div>

              <div className="p-3 rounded-md border border-slate-200/90 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <strong className="text-xs text-slate-900 block font-semibold">
                      Requiere Motocicleta Propia
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Excluyente para Escoltas y Supervisores de patrulla
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRequiresMotorcycle(!requiresMotorcycle)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center ${
                      requiresMotorcycle ? "bg-amber-500 justify-end" : "bg-slate-300 justify-start"
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>

                {requiresMotorcycle && (
                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                    <span className="text-slate-600">Cilindraje Mínimo Requerido:</span>
                    <select
                      value={minMotorcycleCc}
                      onChange={(e) => setMinMotorcycleCc(Number(e.target.value))}
                      className="h-8 bg-white border border-slate-200/90 rounded-md px-2.5 text-xs text-slate-900 font-mono tabular-nums"
                    >
                      <option value={125}>≥ 125 cc</option>
                      <option value={150}>≥ 150 cc</option>
                      <option value={180}>≥ 180 cc</option>
                      <option value={200}>≥ 200 cc</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Años mínimos */}
              <div className="p-3 rounded-md border border-slate-200/90 bg-slate-50/70 flex items-center justify-between">
                <div>
                  <strong className="text-xs text-slate-900 block font-semibold">
                    Experiencia Mínima en Seguridad
                  </strong>
                  <span className="text-[11px] text-slate-500">
                    Años de servicio comprobables en el sector
                  </span>
                </div>
                <select
                  value={minExperienceYears}
                  onChange={(e) => setMinExperienceYears(Number(e.target.value))}
                  className="h-8 bg-white border border-slate-200/90 rounded-md px-2.5 text-xs text-slate-900 font-mono tabular-nums"
                >
                  <option value={0}>Sin experiencia</option>
                  <option value={1}>1 año o más</option>
                  <option value={2}>2 años o más</option>
                  <option value={3}>3 años o más</option>
                  <option value={5}>5 años o más</option>
                </select>
              </div>

              {/* Relevo urgente */}
              <div className="p-3 rounded-md border border-amber-200/80 bg-amber-50/60 flex items-center justify-between">
                <div>
                  <strong className="text-xs text-amber-900 block font-semibold">
                    Marcar como &quot;Relevo Urgente&quot;
                  </strong>
                  <span className="text-[11px] text-amber-700">
                    Aparece con distintivo de prioridad y alerta a candidatos con disponibilidad inmediata
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUrgentRelief(!isUrgentRelief)}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center ${
                    isUrgentRelief ? "bg-amber-500 justify-end" : "bg-slate-300 justify-start"
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200/80">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-xs font-medium h-10 inline-flex items-center justify-center gap-2"
            >
              {loading ? (
                "Publicando oferta..."
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" strokeWidth={2} />
                  <span>Publicar Vacante Inmediatamente</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* RIGHT COLUMN: LIVE OFFER PREVIEW (5 cols - Sticky) */}
        <div className="lg:col-span-5 sticky top-24 space-y-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
            Vista Previa en Vivo (Como la verá el Candidato)
          </span>

          <div className="bg-white border border-slate-900 rounded-lg p-5 space-y-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
            {isUrgentRelief && (
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-amber-800 bg-amber-50/80 px-2 py-0.5 rounded-md border border-amber-200/70 w-fit">
                <Zap className="w-3 h-3 fill-amber-500 text-amber-600" />
                Relevo Urgente • Prioridad Operativa
              </div>
            )}

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium">{companyName}</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-800 bg-amber-50/80 px-1.5 py-0.5 rounded-md border border-amber-200/70">
                  <Shield className="w-2.5 h-2.5 fill-amber-500/30" />
                  Auditada
                </span>
              </div>
              <h3 className="text-base font-semibold tracking-tight text-slate-900 mt-0.5">
                {title || `${formatSecurityRoleLabel(roleRequired)} - ${city}`}
              </h3>
            </div>

            <div className="p-3 rounded-md bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Salario mensual</span>
                <div className="text-lg font-semibold font-mono tabular-nums">
                  ${salaryMonthly.toLocaleString("es-CO")} COP
                </div>
                {includesSurcharges && (
                  <span className="text-[10px] text-emerald-400">+ Recargos de ley</span>
                )}
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase">Turno</span>
                <span className="text-xs font-semibold text-amber-400 font-mono tabular-nums">
                  {shift}
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {city} • {zone || "Zona Principal"}
                </span>
              </div>
              {requiresMotorcycle && (
                <div className="flex items-center gap-1.5 text-amber-800 font-medium tabular-nums">
                  <Bike className="w-3.5 h-3.5" />
                  <span>Requiere Moto Propia (≥{minMotorcycleCc}cc)</span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
              {description}
            </p>

            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Garantía Cero Cobros
              </span>
              <span>100% Gratuito</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
