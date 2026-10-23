import { SubscriptionPlan } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

export const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    id: "pack_inicial",
    name: "Cazatalentos Inicial",
    price: 0,
    credits: 0,
    description: "Ideal para evaluar el flujo de candidatos y probar el Semáforo del Curso en 1 vacante puntual.",
    features: [
      "1 vacante activa simultánea",
      "Filtro inteligente de Curso SuperVigilancia",
      "Recepción de hojas de vida con Match %",
      "Sin créditos de Poligrafía incluidos",
      "Sin acceso al Radar de Relevos de Emergencia",
    ],
    badge: "Acceso Gratuito",
    is_active: true,
    sort_order: 1,
  },
  {
    id: "pack_operativo",
    name: "Pack Contratación Segura x5",
    price: 850000,
    credits: 5,
    description: "Para empresas que necesitan cubrir relevos urgentes y blindar ingresos con antecedentes, visita y poligrafía.",
    features: [
      "Vacantes ilimitadas activas en el mes",
      "5 Combos Completos (Antecedentes + Visita + Poligrafía)",
      "Acceso prioritario al Radar de Relevos de Emergencia",
      "Sello Dorado 'Empresa Verificada' en ofertas",
      "Descarga de Informes Confidenciales en PDF",
      "Soporte corporativo vía WhatsApp",
    ],
    badge: "Más Vendido",
    is_active: true,
    sort_order: 2,
  },
  {
    id: "pack_corporativo_vip",
    name: "Pack Operación Blindada x15",
    price: 2250000,
    credits: 15,
    description: "Diseñado para licitaciones, aperturas de nuevos servicios y empresas de vigilancia de escala nacional.",
    features: [
      "Vacantes ilimitadas con máxima prioridad",
      "15 Combos Completos (Antecedentes + Visita + Poligrafía)",
      "Entrega express de dictamen en 24 a 48 horas",
      "Analista de seguridad y poligrafista dedicado",
      "Acceso total ilimitado al Radar de Relevos 24/7",
      "Facturación electrónica corporativa inmediata",
    ],
    badge: "Corporativo VIP",
    is_active: true,
    sort_order: 3,
  },
];

/**
 * Returns cached plans from localStorage or defaults.
 */
export function getStoredPlans(): SubscriptionPlan[] {
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem("fv_subscription_plans");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {}
    }
  }
  return DEFAULT_PLANS;
}

/**
 * Saves plans list to localStorage cache.
 */
export function setStoredPlans(plans: SubscriptionPlan[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("fv_subscription_plans", JSON.stringify(plans));
  }
}

/**
 * Normalizes features from Supabase jsonb/string/array into string[].
 */
export function normalizeFeatures(features: any): string[] {
  if (!features) return [];
  if (Array.isArray(features)) return features.map((f) => String(f));
  if (typeof features === "string") {
    try {
      const parsed = JSON.parse(features);
      if (Array.isArray(parsed)) return parsed.map((f) => String(f));
    } catch {
      return features.split("\n").map((f) => f.trim()).filter(Boolean);
    }
  }
  return [];
}

/**
 * Fetches active subscription plans from Supabase, syncing with local cache.
 */
export async function fetchSubscriptionPlans(supabaseClient?: any): Promise<SubscriptionPlan[]> {
  try {
    const supabase = supabaseClient || createClient();
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .order("sort_order", { ascending: true });

    if (!error && data && data.length > 0) {
      const formatted: SubscriptionPlan[] = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        credits: Number(item.credits),
        description: item.description || "",
        features: normalizeFeatures(item.features),
        badge: item.badge || null,
        is_active: item.is_active ?? true,
        sort_order: item.sort_order ?? 0,
        updated_at: item.updated_at,
      }));

      setStoredPlans(formatted);
      return formatted;
    }
  } catch (err) {
    // fallback gracefully
  }

  return getStoredPlans();
}
