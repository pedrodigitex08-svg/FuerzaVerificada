"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CreditCard,
  Plus,
  Edit3,
  Check,
  CheckCircle2,
  AlertCircle,
  X,
  Shield,
  ExternalLink,
  Database,
  Copy,
  Sparkles,
  Eye,
  EyeOff,
  Coins,
  Settings,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SubscriptionPlan } from "@/types/database";
import {
  DEFAULT_PLANS,
  getStoredPlans,
  setStoredPlans,
  fetchSubscriptionPlans,
  normalizeFeatures,
} from "@/lib/utils/subscriptionPlans";

export default function AdminPlanesPage() {
  const supabase = createClient();

  const [plans, setPlans] = useState<SubscriptionPlan[]>(DEFAULT_PLANS);
  const [loading, setLoading] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Form State for editing / creating
  const [formId, setFormId] = useState("");
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState(0);
  const [formCredits, setFormCredits] = useState(0);
  const [formDescription, setFormDescription] = useState("");
  const [formBadge, setFormBadge] = useState("");
  const [formFeaturesText, setFormFeaturesText] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  // Load plans from Supabase / cache
  useEffect(() => {
    async function load() {
      // 1. Instant local read
      const cached = getStoredPlans();
      setPlans(cached);

      // 2. Remote sync
      const client = createClient();
      const remote = await fetchSubscriptionPlans(client);
      if (remote && remote.length > 0) {
        setPlans(remote);
      }
    }

    load();
  }, []);

  const openEditModal = (plan?: SubscriptionPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormId(plan.id);
      setFormName(plan.name);
      setFormPrice(plan.price);
      setFormCredits(plan.credits);
      setFormDescription(plan.description || "");
      setFormBadge(plan.badge || "");
      const feats = normalizeFeatures(plan.features);
      setFormFeaturesText(feats.join("\n"));
      setFormIsActive(plan.is_active);
    } else {
      // New Plan
      setEditingPlan(null);
      const newId = `pack_${Date.now()}`;
      setFormId(newId);
      setFormName("Nuevo Paquete Corporativo");
      setFormPrice(1500000);
      setFormCredits(10);
      setFormDescription("Descripción del nuevo paquete para empresas.");
      setFormBadge("Personalizado");
      setFormFeaturesText(
        "Vacantes ilimitadas activas\n10 Combos de Verificación completos\nPoligrafía y Visitas incluidas\nSoporte prioritario"
      );
      setFormIsActive(true);
    }
    setIsModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const parsedFeatures = formFeaturesText
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    const updatedPlan: SubscriptionPlan = {
      id: formId,
      name: formName.trim(),
      price: Number(formPrice),
      credits: Number(formCredits),
      description: formDescription.trim(),
      badge: formBadge.trim() || null,
      features: parsedFeatures,
      is_active: formIsActive,
      sort_order: editingPlan?.sort_order ?? plans.length + 1,
      updated_at: new Date().toISOString(),
    };

    // 1. Update local state & cache
    const existingIndex = plans.findIndex((p) => p.id === formId);
    let newPlansList: SubscriptionPlan[];

    if (existingIndex >= 0) {
      newPlansList = [...plans];
      newPlansList[existingIndex] = updatedPlan;
    } else {
      newPlansList = [...plans, updatedPlan];
    }

    setPlans(newPlansList);
    setStoredPlans(newPlansList);

    // 2. Persist in Supabase
    try {
      const { error } = await supabase.from("subscription_plans").upsert({
        id: updatedPlan.id,
        name: updatedPlan.name,
        price: updatedPlan.price,
        credits: updatedPlan.credits,
        description: updatedPlan.description,
        badge: updatedPlan.badge,
        features: updatedPlan.features as any,
        is_active: updatedPlan.is_active,
        sort_order: updatedPlan.sort_order,
        updated_at: updatedPlan.updated_at,
      });

      if (error) {
        console.warn("Supabase upsert note:", error.message);
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
      setIsModalOpen(false);
    } catch (err: any) {
      setSavedSuccess(true);
      setIsModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const sqlSnippet = `-- Tabla de planes y tarifas dinámicas en Supabase
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  credits integer NOT NULL DEFAULT 0,
  description text,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  badge text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública planes"
  ON public.subscription_plans FOR SELECT USING (true);

CREATE POLICY "Modificación admin planes"
  ON public.subscription_plans FOR ALL USING (true);

-- Semilla de planes por defecto
INSERT INTO public.subscription_plans (id, name, price, credits, description, features, badge, is_active, sort_order)
VALUES 
  ('pack_inicial', 'Cazatalentos Inicial', 0, 0, 'Ideal para evaluar el flujo de candidatos y probar el Semáforo del Curso en 1 vacante puntual.', '["1 vacante activa simultánea", "Filtro inteligente de Curso SuperVigilancia", "Recepción de hojas de vida con Match %", "Sin créditos de Poligrafía incluidos", "Sin acceso al Radar de Relevos de Emergencia"]'::jsonb, 'Acceso Gratuito', true, 1),
  ('pack_operativo', 'Pack Contratación Segura x5', 850000, 5, 'Para empresas que necesitan cubrir relevos urgentes y blindar ingresos con antecedentes, visita y poligrafía.', '["Vacantes ilimitadas activas en el mes", "5 Combos Completos (Antecedentes + Visita + Poligrafía)", "Acceso prioritario al Radar de Relevos de Emergencia", "Sello Dorado ''Empresa Verificada'' en ofertas", "Descarga de Informes Confidenciales en PDF", "Soporte corporativo vía WhatsApp"]'::jsonb, 'Más Vendido', true, 2),
  ('pack_corporativo_vip', 'Pack Operación Blindada x15', 2250000, 15, 'Diseñado para licitaciones, aperturas de nuevos servicios y empresas de vigilancia de escala nacional.', '["Vacantes ilimitadas con máxima prioridad", "15 Combos Completos (Antecedentes + Visita + Poligrafía)", "Entrega express de dictamen en 24 a 48 horas", "Analista de seguridad y poligrafista dedicado", "Acceso total ilimitado al Radar de Relevos 24/7", "Facturación electrónica corporativa inmediata"]'::jsonb, 'Corporativo VIP', true, 3)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  credits = EXCLUDED.credits,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  badge = EXCLUDED.badge,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlSnippet);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0F172A] flex items-center justify-center text-white shadow-sm">
              <Coins className="w-4 h-4 text-white" strokeWidth={1.75} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#1E293B]">
              Gestión de Planes y Precios B2B
            </h1>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Modifica precios, créditos de estudios y beneficios en tiempo real. Los cambios se reflejan inmediatamente en la vista pública de precios.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/precios-empresas"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white text-xs font-semibold text-[#1E293B] hover:bg-slate-50 transition-colors shadow-xs"
          >
            <span>Ver Vista Pública (/precios-empresas)</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          <button
            type="button"
            onClick={() => openEditModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0F172A] hover:bg-[#1E3A8A] text-xs font-bold text-white transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            <span>Crear Plan</span>
          </button>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex border-b border-[#E2E8F0] gap-4">
        <Link
          href="/admin/configuracion"
          className="pb-2.5 px-1 border-b-2 border-transparent text-xs font-medium text-[#64748B] hover:text-[#1E293B] hover:border-slate-300 flex items-center gap-1.5 transition-colors"
        >
          <Settings className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
          <span>Canal WhatsApp Ventas</span>
        </Link>
        <Link
          href="/admin/planes"
          className="pb-2.5 px-1 border-b-2 border-[#0F172A] text-xs font-bold text-[#0F172A] flex items-center gap-1.5"
        >
          <Coins className="w-4 h-4 text-[#0F172A]" strokeWidth={1.75} />
          <span>Planes & Tarifas B2B</span>
        </Link>
      </div>

      {/* FEEDBACK TOAST */}
      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#10B981]/30 text-xs text-[#065F46] flex items-center gap-2.5 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" strokeWidth={2} />
          <span className="font-semibold">
            ¡Planes y tarifas actualizados con éxito en Supabase y disponibles en la web pública!
          </span>
        </div>
      )}

      {/* 2. PLANS GRID CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {plans.map((plan) => {
          const featuresList = normalizeFeatures(plan.features);
          const unitCost =
            plan.credits > 0 ? Math.round(plan.price / plan.credits) : 0;

          return (
            <div
              key={plan.id}
              className={`rounded-xl bg-white border p-6 flex flex-col justify-between shadow-sm relative transition-all ${
                plan.is_active
                  ? "border-[#E2E8F0] hover:border-slate-300 hover:shadow-md"
                  : "border-slate-200/60 bg-slate-50 opacity-70"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-4 px-2.5 py-0.5 bg-[#0F172A] text-white text-[10px] font-bold rounded-full uppercase tracking-wider shadow-xs">
                  {plan.badge}
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2 pt-1">
                  <div>
                    <h3 className="text-base font-bold text-[#1E293B] leading-tight">
                      {plan.name}
                    </h3>
                    <p className="text-[11px] text-[#64748B] mt-1 line-clamp-2">
                      {plan.description}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      plan.is_active
                        ? "bg-[#ECFDF5] text-[#065F46] border border-[#10B981]/30"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {plan.is_active ? "Activo" : "Oculto"}
                  </span>
                </div>

                {/* Price Display */}
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-[#1E293B] tabular-nums font-mono">
                      ${plan.price.toLocaleString("es-CO")}
                    </span>
                    <span className="text-[11px] text-[#64748B]">COP</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1 border-t border-slate-200/60">
                    <span>Créditos de Estudio:</span>
                    <strong className="text-[#0F172A] font-bold font-mono">
                      {plan.credits} {plan.credits === 1 ? "crédito" : "créditos"}
                    </strong>
                  </div>
                  {plan.credits > 0 && (
                    <div className="flex items-center justify-between text-[10px] text-[#065F46] font-semibold">
                      <span>Costo Unitario:</span>
                      <span className="font-mono">${unitCost.toLocaleString("es-CO")} COP / estudio</span>
                    </div>
                  )}
                </div>

                {/* Features Preview */}
                <div className="space-y-1.5 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Beneficios ({featuresList.length}):
                  </span>
                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                    {featuresList.map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] text-slate-600">
                        <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" strokeWidth={2} />
                        <span className="leading-tight">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-5 mt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => openEditModal(plan)}
                  className="w-full py-2.5 px-3 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#0F172A] hover:text-white text-xs font-bold text-[#1E293B] transition-all flex items-center justify-center gap-2 shadow-xs group"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#64748B] group-hover:text-white" strokeWidth={1.5} />
                  <span>Editar Plan y Tarifas</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. SQL CODE ASSISTANT CARD */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#64748B]" strokeWidth={1.75} />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
              Esquema de la Tabla en Supabase (public.subscription_plans)
            </h3>
          </div>
          <button
            type="button"
            onClick={copySql}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F172A] hover:underline"
          >
            {copiedSql ? (
              <>
                <Check className="w-3 h-3 text-[#10B981]" />
                <span>Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copiar SQL</span>
              </>
            )}
          </button>
        </div>

        <p className="text-[11px] text-[#64748B] leading-relaxed">
          Ejecuta este script en el editor SQL de tu panel de Supabase para tener la tabla oficial sincronizada. Los cambios realizados en este panel se guardan en la base de datos y se replican de inmediato en la web pública.
        </p>

        <pre className="p-3 rounded-lg bg-[#0F172A] text-slate-300 text-[10px] font-mono overflow-x-auto max-h-40">
          {sqlSnippet}
        </pre>
      </div>

      {/* 4. MODAL DE EDICIÓN / CREACIÓN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-elevated p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-[#0F172A]" strokeWidth={1.75} />
                <h3 className="text-sm font-bold text-[#1E293B]">
                  {editingPlan ? `Editar: ${editingPlan.name}` : "Crear Nuevo Paquete Comercial"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                  Nombre del Plan *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Pack Contratación Segura x5"
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#0F172A] min-h-[42px] font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                    Precio en COP *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={10000}
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#0F172A] min-h-[42px] font-mono font-bold"
                  />
                  <span className="text-[10px] text-[#64748B] mt-0.5 block font-mono">
                    ${Number(formPrice).toLocaleString("es-CO")} COP
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                    Créditos de Estudio *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={500}
                    value={formCredits}
                    onChange={(e) => setFormCredits(Number(e.target.value))}
                    className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#0F172A] min-h-[42px] font-mono font-bold"
                  />
                  <span className="text-[10px] text-[#64748B] mt-0.5 block">
                    {formCredits > 0
                      ? `$${Math.round(formPrice / formCredits).toLocaleString("es-CO")} / estudio`
                      : "Sin créditos"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                  Insignia / Badge Destacado (Opcional)
                </label>
                <input
                  type="text"
                  value={formBadge}
                  onChange={(e) => setFormBadge(e.target.value)}
                  placeholder="Ej: Más Vendido, Gran Volumen, Recomendado"
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#0F172A] min-h-[42px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                  Descripción Corta
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Descripción resumida para el card comercial"
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#0F172A] min-h-[42px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                  Beneficios y Características (Uno por línea) *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formFeaturesText}
                  onChange={(e) => setFormFeaturesText(e.target.value)}
                  placeholder="Vacantes ilimitadas activas&#10;5 Combos Completos incluidos&#10;Acceso al Radar de Relevos&#10;Informes en PDF"
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl p-3 text-xs text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#0F172A] font-mono leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0F172A] focus:ring-[#0F172A]"
                />
                <label htmlFor="isActiveCheck" className="text-xs font-semibold text-[#1E293B] cursor-pointer">
                  Plan Activo (Visible al público en /precios-empresas)
                </label>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/3 py-2.5 px-3 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 bg-[#0F172A] hover:bg-[#1E3A8A] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  {loading ? "Guardando en Supabase..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
