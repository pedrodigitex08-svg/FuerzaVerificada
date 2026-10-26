/**
 * Valores exactos y canónicos del enum PostgreSQL `public.security_role_type` en Supabase.
 */
export type DbSecurityRoleEnum =
  | "vigilante_fijo"
  | "vigilante_movil"
  | "escolta_vip"
  | "escolta_mercancia"
  | "supervisor_motorizado"
  | "supervisor_zona"
  | "operador_medios_tecnologicos"
  | "manejador_canino";

export interface SecurityRoleOption {
  value: DbSecurityRoleEnum;
  label: string;
}

export const SECURITY_ROLE_OPTIONS: SecurityRoleOption[] = [
  { value: "vigilante_fijo", label: "Vigilante Fijo" },
  { value: "vigilante_movil", label: "Vigilante Móvil" },
  { value: "escolta_vip", label: "Escolta VIP" },
  { value: "escolta_mercancia", label: "Escolta Mercancía" },
  { value: "supervisor_motorizado", label: "Supervisor Motorizado" },
  { value: "operador_medios_tecnologicos", label: "Operador de Medios Tecnológicos" },
  { value: "manejador_canino", label: "Manejador Canino" },
  { value: "supervisor_zona", label: "Supervisor de Zona" },
];

const EXACT_ROLE_MAP: Record<string, DbSecurityRoleEnum> = {
  // Valores snake_case canónicos del enum
  vigilante_fijo: "vigilante_fijo",
  vigilante_movil: "vigilante_movil",
  escolta_vip: "escolta_vip",
  escolta_mercancia: "escolta_mercancia",
  supervisor_motorizado: "supervisor_motorizado",
  supervisor_zona: "supervisor_zona",
  operador_medios_tecnologicos: "operador_medios_tecnologicos",
  manejador_canino: "manejador_canino",

  // Textos de interfaz (UI Labels y variantes)
  "vigilante fijo": "vigilante_fijo",
  vigilante: "vigilante_fijo",
  "vigilante móvil": "vigilante_movil",
  "vigilante movil": "vigilante_movil",
  "escolta vip": "escolta_vip",
  escolta: "escolta_vip",
  "escolta mercancía": "escolta_mercancia",
  "escolta mercancia": "escolta_mercancia",
  "escolta motorizado": "escolta_mercancia",
  "supervisor motorizado": "supervisor_motorizado",
  supervisor: "supervisor_motorizado",
  "supervisor de zona": "supervisor_zona",
  "supervisor de zona / inspector": "supervisor_zona",
  "inspector de seguridad": "supervisor_zona",
  "director de operaciones": "supervisor_zona",
  "operador medios tecnológicos": "operador_medios_tecnologicos",
  "operador medios tecnologicos": "operador_medios_tecnologicos",
  "operador de medios tecnológicos": "operador_medios_tecnologicos",
  "operador de medios tecnologicos": "operador_medios_tecnologicos",
  "operador de medios": "operador_medios_tecnologicos",
  "manejador canino": "manejador_canino",
  "guarda canino": "manejador_canino",
  "guarda canino (guía)": "manejador_canino",
  "guarda canino (guia)": "manejador_canino",
};

const ROLE_LABELS_BY_ENUM: Record<DbSecurityRoleEnum, string> = {
  vigilante_fijo: "Vigilante Fijo",
  vigilante_movil: "Vigilante Móvil",
  escolta_vip: "Escolta VIP",
  escolta_mercancia: "Escolta Mercancía",
  supervisor_motorizado: "Supervisor Motorizado",
  supervisor_zona: "Supervisor de Zona",
  operador_medios_tecnologicos: "Operador de Medios Tecnológicos",
  manejador_canino: "Manejador Canino",
};

/**
 * Normaliza cualquier texto de interfaz o variante de cargo al valor exacto
 * aceptado por el enum `security_role_type` en PostgreSQL / Supabase.
 */
export function normalizeSecurityRole(inputRole?: string | null): DbSecurityRoleEnum {
  if (!inputRole || typeof inputRole !== "string") {
    return "vigilante_fijo";
  }

  const clean = inputRole.trim().toLowerCase();
  if (EXACT_ROLE_MAP[clean]) {
    return EXACT_ROLE_MAP[clean];
  }

  if (clean.includes("movil") || clean.includes("móvil")) return "vigilante_movil";
  if (clean.includes("mercancia") || clean.includes("mercancía")) return "escolta_mercancia";
  if (clean.includes("escolta")) return "escolta_vip";
  if (clean.includes("supervisor") && (clean.includes("zona") || clean.includes("inspector"))) {
    return "supervisor_zona";
  }
  if (clean.includes("inspector")) return "supervisor_zona";
  if (clean.includes("supervisor")) return "supervisor_motorizado";
  if (clean.includes("medios") || clean.includes("operador")) return "operador_medios_tecnologicos";
  if (clean.includes("canino")) return "manejador_canino";

  return "vigilante_fijo";
}

/**
 * Devuelve la etiqueta legible para mostrar en la interfaz de usuario a partir de
 * cualquier valor del enum `security_role_type` o etiqueta previa.
 */
export function formatSecurityRoleLabel(role?: string | null): string {
  if (!role) return "Vigilante Fijo";
  const normalized = normalizeSecurityRole(role);
  return ROLE_LABELS_BY_ENUM[normalized] || "Vigilante Fijo";
}
