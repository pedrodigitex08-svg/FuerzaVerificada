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
} from "lucide-react";
import { SecurityRoleType } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

const ROLES: SecurityRoleType[] = [
  "Vigilante Fijo",
  "Vigilante Móvil",
  "Escolta VIP",
  "Escolta Mercancía",
  "Supervisor Motorizado",
  "Operador Medios Tecnológicos",
  "Manejador Canino",
];

const SHIFTS = [
  "2x2x2 (2 Día, 2 Noche, 2 Descanso)",
  "4x2 Rotativo",
  "5x2 Diurno",
  "6x1 Diurno",
  "12x12 Rotativo",
];

export default function NuevaVacantePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const [companyName, setCompanyName] = useState("Empresa de Seguridad");

  // Form Fields
  const [title, setTitle] = useState("");
  const [roleRequired, setRoleRequired] = useState<SecurityRoleType>("Vigilante Fijo");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        // Auto-create company record if company user does not have one yet
        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name, phone_whatsapp")
          .eq("id", userId)
          .maybeSingle();

        const meta = authData.user?.user_metadata || {};
        const cleanCompName = companyName || meta.company_name || prof?.full_name || authData.user?.email?.split("@")[0] || "Empresa de Seguridad";
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

      const payload = {
        company_id: resolvedCompanyId,
        title: title.trim() || `${roleRequired} - ${city}`,
        role_required: roleRequired,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Publicador Táctico de Vacantes
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            Configure requerimientos técnicos y filtros excluyentes para recibir candidatos calificados.
          </p>
        </div>

        <Link href="/empresa/vacantes" className="btn-secondary text-xs">
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
          Volver a Mis Vacantes
        </Link>
      </div>

      {successToast && (
        <div className="p-3.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold flex items-center gap-2 shadow-subtle">
          <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
          ¡Vacante publicada con éxito! Redirigiendo a tu bandeja de gestión...
        </div>
      )}

      {/* 2-COLUMN WORKSPACE: FORM (7 cols) + LIVE CARD PREVIEW (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: STRUCTURED FORM */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-subtle space-y-6">
          
          {/* Section 1: General Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Datos Principales del Puesto
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Título Público de la Vacante
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Vigilante Fijo - Centro Empresarial Calle 100"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Cargo Operativo Requerido:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setRoleRequired(role)}
                    className={`p-2 rounded-lg text-xs font-medium border text-left transition-all ${
                      roleRequired === role
                        ? "bg-slate-900 text-white border-slate-900 font-semibold"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Ciudad Sede
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                >
                  <option value="Bogotá D.C.">Bogotá D.C.</option>
                  <option value="Medellín">Medellín</option>
                  <option value="Cali">Cali</option>
                  <option value="Barranquilla">Barranquilla</option>
                  <option value="Bucaramanga">Bucaramanga</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Zona / Barrio / Localidad
                </label>
                <input
                  type="text"
                  required
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  placeholder="Ej: Chicó Norte, Fontibón"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Esquema de Turno Operativo
              </label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400 font-mono"
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
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Salario Mensual Básico (COP)
                </label>
                <input
                  type="number"
                  step={50000}
                  value={salaryMonthly}
                  onChange={(e) => setSalaryMonthly(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono font-bold tabular-nums focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-800 block">Recargos de Ley</span>
                  <span className="text-[10px] text-slate-400">+ Nocturnos / Dominicales</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIncludesSurcharges(!includesSurcharges)}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center ${
                    includesSurcharges ? "bg-emerald-600 justify-end" : "bg-slate-300 justify-start"
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-subtle" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Dirección Sede para Citación a Entrevista
              </label>
              <input
                type="text"
                required
                value={interviewAddress}
                onChange={(e) => setInterviewAddress(e.target.value)}
                placeholder="Ej: Cra 15 # 98-42, Oficina 301, Bogotá"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Descripción del Servicio y Funciones
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>

          {/* Section 2: Exclusions & Filters */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Filtros Técnicos Excluyentes
            </h3>

            <div className="space-y-2.5">
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <strong className="text-xs text-slate-900 block font-semibold">
                    Curso SuperVigilancia Vigente Obligatorio (&gt;30 días)
                  </strong>
                  <span className="text-[11px] text-slate-500">
                    Descarta automáticamente hojas de vida con curso vencido
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setRequiresCourse(!requiresCourse)}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center ${
                    requiresCourse ? "bg-emerald-600 justify-end" : "bg-slate-300 justify-start"
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-subtle" />
                </button>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <strong className="text-xs text-slate-900 block font-semibold">
                    Libreta Militar al Día Requerida
                  </strong>
                  <span className="text-[11px] text-slate-500">
                    Indispensable para armamento y puestos de alto riesgo
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setRequiresMilitaryBooklet(!requiresMilitaryBooklet)}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center ${
                    requiresMilitaryBooklet ? "bg-emerald-600 justify-end" : "bg-slate-300 justify-start"
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-subtle" />
                </button>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <strong className="text-xs text-slate-900 block font-semibold">
                      Requiere Motocicleta Propia
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Excluyente para Supervisores y Rondines
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRequiresMotorcycle(!requiresMotorcycle)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center ${
                      requiresMotorcycle ? "bg-amber-500 justify-end" : "bg-slate-300 justify-start"
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-subtle" />
                  </button>
                </div>

                {requiresMotorcycle && (
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-600">Cilindraje Mínimo Requerido:</span>
                    <select
                      value={minMotorcycleCc}
                      onChange={(e) => setMinMotorcycleCc(Number(e.target.value))}
                      className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 font-mono"
                    >
                      <option value={125}>≥ 125 cc</option>
                      <option value={150}>≥ 150 cc</option>
                      <option value={180}>≥ 180 cc</option>
                      <option value={200}>≥ 200 cc</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Urgent relief flag */}
              <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 flex items-center justify-between">
                <div>
                  <strong className="text-xs text-amber-900 block font-bold">
                    Marcar como &quot;Relevo Urgente&quot;
                  </strong>
                  <span className="text-[11px] text-amber-700">
                    Aparece con distintivo de prioridad y alerta a guardas con disponibilidad hoy
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUrgentRelief(!isUrgentRelief)}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center ${
                    isUrgentRelief ? "bg-amber-500 justify-end" : "bg-slate-300 justify-start"
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-subtle" />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-xs font-semibold py-3"
            >
              {loading ? (
                "Publicando oferta..."
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" strokeWidth={2} />
                  Publicar Vacante Inmediatamente
                </>
              )}
            </button>
          </div>
        </form>

        {/* RIGHT COLUMN: LIVE OFFER PREVIEW (5 cols - Sticky) */}
        <div className="lg:col-span-5 sticky top-24 space-y-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
            Vista Previa en Vivo (Como la verá el Guarda)
          </span>

          <div className="bg-white border border-slate-900 rounded-2xl p-5 space-y-4 shadow-card">
            {isUrgentRelief && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 w-fit">
                <Zap className="w-3 h-3 fill-amber-500 text-amber-500" />
                Relevo Urgente • Prioridad Operativa
              </div>
            )}

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium">{companyName}</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                  <Shield className="w-2.5 h-2.5 fill-amber-500/30" />
                  Auditada
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                {title || `${roleRequired} - ${city}`}
              </h3>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Salario mensual</span>
                <div className="text-lg font-bold font-mono tabular-nums">
                  ${salaryMonthly.toLocaleString("es-CO")} COP
                </div>
                {includesSurcharges && (
                  <span className="text-[10px] text-emerald-400">+ Recargos de ley</span>
                )}
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase">Turno</span>
                <span className="text-xs font-bold text-amber-400 font-mono">{shift}</span>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{city} • {zone}</span>
              </div>
              {requiresMotorcycle && (
                <div className="flex items-center gap-1.5 text-amber-700 font-medium">
                  <Bike className="w-3.5 h-3.5" />
                  <span>Requiere Moto Propia (≥{minMotorcycleCc}cc)</span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
              {description}
            </p>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
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
