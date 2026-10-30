/**
 * Normalizador y formateador de esquemas de turno de seguridad privada.
 * Alineado de forma 100% estricta con el enum PostgreSQL `public.shift_type` en Supabase.
 *
 * Valores aceptados por PostgreSQL:
 * '2x2x2', '4x2', '5x2', '6x1', '12x12'
 */

export type DbShiftTypeEnum = "2x2x2" | "4x2" | "5x2" | "6x1" | "12x12";

export interface ShiftOption {
  value: DbShiftTypeEnum;
  label: string;
  shortLabel: string;
  description: string;
}

export const SHIFT_OPTIONS: ShiftOption[] = [
  {
    value: "2x2x2",
    label: "2x2x2 (2 Día, 2 Noche, 2 Descanso)",
    shortLabel: "2x2x2",
    description: "Esquema estándar rotativo: 2 días diurnos, 2 días nocturnos y 2 descansos.",
  },
  {
    value: "4x2",
    label: "4x2 Rotativo (4 Turnos x 2 Descansos)",
    shortLabel: "4x2",
    description: "4 jornadas operativas consecutivas seguidas de 2 días completos de descanso.",
  },
  {
    value: "5x2",
    label: "5x2 Diurno (Lunes a Viernes)",
    shortLabel: "5x2",
    description: "Jornada administrativa o corporativa diurna de lunes a viernes.",
  },
  {
    value: "6x1",
    label: "6x1 Diurno (Lunes a Sábado)",
    shortLabel: "6x1",
    description: "Turno diurno de 6 días operativos semanales con 1 día de descanso.",
  },
  {
    value: "12x12",
    label: "12x12 Rotativo (12 Horas)",
    shortLabel: "12x12",
    description: "Jornada de 12 horas operativas rotativas día y noche.",
  },
];

const SHIFT_MAP: Record<string, DbShiftTypeEnum> = {
  // Enums directos canónicos
  "2x2x2": "2x2x2",
  "4x2": "4x2",
  "5x2": "5x2",
  "6x1": "6x1",
  "12x12": "12x12",

  // Variantes con texto
  "2x2x2 (2 día, 2 noche, 2 descanso)": "2x2x2",
  "2x2x2 (2 dia, 2 noche, 2 descanso)": "2x2x2",
  "2x2x2 rotativo": "2x2x2",
  "2x2": "2x2x2",

  "4x2 rotativo": "4x2",
  "4x2 rotativo (4 turnos x 2 descansos)": "4x2",
  "4x2 diurno": "4x2",

  "5x2 diurno": "5x2",
  "5x2 diurno (lunes a viernes)": "5x2",
  "5x2 rotativo": "5x2",

  "6x1 diurno": "6x1",
  "6x1 diurno (lunes a sábado)": "6x1",
  "6x1 diurno (lunes a sabado)": "6x1",
  "6x1 rotativo": "6x1",

  "12x12 rotativo": "12x12",
  "12x12 rotativo (12 horas)": "12x12",
  "12x12 diurno": "12x12",
  "12x24": "12x12",
  "12x36": "12x12",
};

const SHIFT_LABELS: Record<DbShiftTypeEnum, string> = {
  "2x2x2": "2x2x2 (2 Día, 2 Noche, 2 Descanso)",
  "4x2": "4x2 Rotativo",
  "5x2": "5x2 Diurno",
  "6x1": "6x1 Diurno",
  "12x12": "12x12 Rotativo",
};

/**
 * Normaliza cualquier variante de texto al enum exacto permitido por PostgreSQL (`public.shift_type`).
 */
export function normalizeShift(input?: string | null): DbShiftTypeEnum {
  if (!input || typeof input !== "string") {
    return "2x2x2";
  }

  const clean = input.trim().toLowerCase();
  if (SHIFT_MAP[clean]) {
    return SHIFT_MAP[clean];
  }

  if (clean.includes("2x2")) return "2x2x2";
  if (clean.includes("4x2")) return "4x2";
  if (clean.includes("5x2")) return "5x2";
  if (clean.includes("6x1")) return "6x1";
  if (clean.includes("12x12") || clean.includes("12 horas") || clean.includes("12h")) return "12x12";

  return "2x2x2";
}

/**
 * Formatea un valor de turno a una etiqueta legible y elegante para la UI.
 */
export function formatShiftLabel(shift?: string | null): string {
  if (!shift) return "2x2x2 (2 Día, 2 Noche, 2 Descanso)";
  const normalized = normalizeShift(shift);
  return SHIFT_LABELS[normalized] || shift;
}
