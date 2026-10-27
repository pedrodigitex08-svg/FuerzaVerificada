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

        if (prof?.full_name) {
          setCompanyName(prof.full_name);
        }
      } catch (err) {
        console.error("Error loading company info:", err);
      }
    }

    loadCompanyInfo();
  }, [supabase]);

  // Aplicar plantilla rápida en 1 clic
  const handleApplyTemplate = (tmpl: (typeof QUICK_TEMPLATES)[0]) => {
    setActiveTemplateName(tmpl.name);
    setRoleRequired(tmpl.role);
    setTitle(tmpl.title);
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
      let resolvedCompanyId: string | null = null;
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        let { data: comp } = await supabase
          .from("companies")
          .select("id")
          .eq("owner_id", user.id)
          .maybeSingle();

        if (!comp) {
          const compName =
            companyName.trim() ||
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
              city: city || "Bogotá D.C.",
              is_verified_company: false,
              plan_name: "basico",
              credits_security_studies: 10,
            })
            .select("id")
            .maybeSingle();

          if (createdComp) comp = createdComp;
        }

        if (comp) resolvedCompanyId = comp.id;
      }

      const normalizedRoleRequired = normalizeSecurityRole(roleRequired);
      const roleLabel = formatSecurityRoleLabel(normalizedRoleRequired);

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
      {/* Page Header Estilo Computrabajo Empresas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Publicador Táctico de Vacantes
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#005DA4] bg-[#EAF3FA] px-2.5 py-0.5 rounded-full border border-[#D5E6F5]">
              <Sparkles className="w-3 h-3 text-[#005DA4]" />
              Formulario B2B
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configura requerimientos operativos y filtros excluyentes para recibir aspirantes verificados en minutos.
          </p>
        </div>

        <Link href="/empresa/vacantes" className="rounded-full bg-[#EAF3FA] hover:bg-[#D5E6F5] text-[#0B3B70] border border-[#D5E6F5] text-xs h-10 px-5 font-semibold inline-flex items-center gap-2 transition-colors shadow-2xs shrink-0">
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
          <span>Volver a Mis Vacantes</span>
        </Link>
      </div>

      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white text-xs font-semibold flex items-center gap-2.5 shadow-md">
          <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={2.5} />
          <span>¡Vacante publicada con éxito! Redirigiendo a tu bandeja ATS...</span>
        </div>
      )}

      {/* PLANTILLAS RÁPIDAS DEL SECTOR SEGURIDAD (1 CLIC) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-bold text-xs">
              ⚡
            </span>
            <span className="text-sm font-bold text-slate-900 tracking-tight">
              Plantillas Rápidas del Sector Seguridad (Publicación en 30 Segundos)
            </span>
          </div>
          <span className="text-xs text-slate-500">
            Haz clic en una plantilla para pre-llenar funciones, requisitos y turnos:
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_TEMPLATES.map((tmpl) => {
            const Icon = tmpl.icon;
            const isSelected = activeTemplateName === tmpl.name;

            return (
              <button
                key={tmpl.name}
                type="button"
                onClick={() => handleApplyTemplate(tmpl)}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? "bg-[#0B3B70] text-white border-[#0B3B70] shadow-xs"
                    : "bg-white border-slate-200 text-slate-700 hover:border-[#005DA4] hover:bg-[#EAF3FA]/30 shadow-2xs"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isSelected ? "bg-white/10 text-[#FFE066]" : "bg-[#EAF3FA] border border-[#D5E6F5] text-[#005DA4]"
                    }`}
                  >
                    <Icon className="w-4 h-4" strokeWidth={2} />
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-bold text-[#FFE066] uppercase tracking-wider">
                      Aplicada ✓
                    </span>
                  )}
                </div>

                <div className="font-bold text-xs leading-tight">
                  {tmpl.name}
                </div>
                <div
                  className={`text-[11px] font-mono tabular-nums mt-1 ${
                    isSelected ? "text-white/80" : "text-slate-500"
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
          className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-7 shadow-2xs space-y-6"
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
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
              Datos Principales del Puesto
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Título Público de la Vacante
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Vigilante Fijo - Centro Empresarial Calle 100"
                className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Cargo Operativo Requerido:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SECURITY_ROLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRoleRequired(opt.value)}
                    className={`p-2.5 rounded-xl text-xs font-semibold border text-left transition-all ${
                      normalizeSecurityRole(roleRequired) === opt.value
                        ? "bg-[#0B3B70] text-white border-[#0B3B70] shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:border-[#005DA4] hover:bg-[#EAF3FA]/30"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Ciudad Sede
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all cursor-pointer"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Zona / Barrio / Localidad
                </label>
                <input
                  type="text"
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  placeholder="Ej: Chapinero, Calle 100, Poblado"
                  className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Esquema / Turno
                </label>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all cursor-pointer"
                >
                  {SHIFTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Salario Mensual Ofrecido (COP)
                </label>
                <input
                  type="number"
                  step="50000"
                  min="1300000"
                  value={salaryMonthly}
                  onChange={(e) => setSalaryMonthly(parseInt(e.target.value, 10) || 0)}
                  className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-sm font-bold text-slate-900 font-mono tabular-nums focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Dirección para Entrevista Presencial (Opcional)
              </label>
              <input
                type="text"
                value={interviewAddress}
                onChange={(e) => setInterviewAddress(e.target.value)}
                placeholder="Ej: Carrera 7 # 71-21 Torre A Oficina 502"
                className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Descripción y Funciones Principales
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalla las funciones del puesto, consignas y protocolos de seguridad..."
                className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all"
              />
            </div>
          </div>

          {/* Section 2: Exclusions */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Requisitos y Filtros de Acreditación
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Curso SuperVigilancia Vigente</span>
                  <span className="text-[11px] text-slate-500">Excluir cursos vencidos</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRequiresCourse(!requiresCourse)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors flex items-center shrink-0 ${
                    requiresCourse ? "bg-[#005DA4] justify-end" : "bg-slate-300 justify-start"
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Libreta Militar al Día</span>
                  <span className="text-[11px] text-slate-500">Primera o segunda clase</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRequiresMilitaryBooklet(!requiresMilitaryBooklet)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors flex items-center shrink-0 ${
                    requiresMilitaryBooklet ? "bg-[#005DA4] justify-end" : "bg-slate-300 justify-start"
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Moto Propia Requerida</span>
                  <span className="text-[11px] text-slate-500">Para patrullas o escoltas</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRequiresMotorcycle(!requiresMotorcycle)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors flex items-center shrink-0 ${
                    requiresMotorcycle ? "bg-[#005DA4] justify-end" : "bg-slate-300 justify-start"
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Relevo Urgente</span>
                  <span className="text-[11px] text-slate-500">Destacar en radar de personal</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUrgentRelief(!isUrgentRelief)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors flex items-center shrink-0 ${
                    isUrgentRelief ? "bg-amber-500 justify-end" : "bg-slate-300 justify-start"
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white text-xs font-semibold h-11 px-8 inline-flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Publicando Vacante...
                </span>
              ) : (
                <>
                  <Check className="w-4 h-4" strokeWidth={2.5} />
                  <span>Publicar Vacante & Activar ATS</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* RIGHT COLUMN: LIVE CARD PREVIEW (5 cols) */}
        <div className="lg:col-span-5 sticky top-20 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Previsualización en el Portal
              </span>
              <span className="text-[10px] font-bold text-[#005DA4] bg-[#EAF3FA] px-2.5 py-0.5 rounded-full border border-[#D5E6F5]">
                Vista Previa
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border-[1.5px] border-[#005DA4] shadow-sm space-y-3">
              <h3 className="text-lg font-bold text-slate-900 leading-snug">
                {title || "Título de la vacante"}
              </h3>

              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                <span className="text-amber-500 font-bold">4,8 ★</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#005DA4] shrink-0" strokeWidth={2.5} />
                <span className="text-[#005DA4] font-semibold">{companyName}</span>
              </div>

              <div className="text-sm text-slate-600 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{city} {zone ? `• ${zone}` : ""}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-600 font-medium">{shift}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-900 font-bold font-mono tabular-nums">
                  ${salaryMonthly.toLocaleString("es-CO")} COP
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Publicada hace un momento</span>
                <span className="border border-slate-300 rounded-full px-3 py-0.5 text-slate-500 font-semibold">
                  Vista
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
