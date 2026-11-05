/**
 * Catálogo Oficial de los 13 Perfiles Especializados en Seguridad Privada
 * Retrocompatible con los antiguos valores de enum (`vigilante_fijo`, `escolta_vip`, etc.).
 */

export type OfficialSecurityIconName =
  | "Shield"
  | "ShieldCheck"
  | "UserCheck"
  | "Monitor"
  | "Crown"
  | "Dog"
  | "Headset"
  | "Building2"
  | "FileSearch"
  | "Search"
  | "UserCog"
  | "Users"
  | "Briefcase";

export type DbSecurityRoleEnum =
  | "Guarda de seguridad"
  | "Supervisor de seguridad"
  | "Escolta"
  | "Operador de medios tecnológicos"
  | "Coordinador de seguridad"
  | "Guía canino"
  | "Recepcionista"
  | "Conserje"
  | "Analista de seguridad"
  | "Investigador"
  | "Asesor de seguridad"
  | "Consultor de seguridad"
  | "Personal administrativo"
  | "vigilante_fijo"
  | "vigilante_movil"
  | "escolta_vip"
  | "escolta_mercancia"
  | "supervisor_motorizado"
  | "supervisor_zona"
  | "operador_medios_tecnologicos"
  | "manejador_canino"
  | string;

export interface OfficialSecurityProfile {
  id: string;
  slug: string;
  value: string;
  label: string;
  icon: OfficialSecurityIconName;
  aliases: string[];
}

export interface SecurityRoleOption {
  value: string;
  label: string;
  id?: string;
  slug?: string;
  icon?: OfficialSecurityIconName;
  aliases?: string[];
}

export const OFFICIAL_SECURITY_PROFILES: OfficialSecurityProfile[] = [
  {
    id: "guarda_de_seguridad",
    slug: "guarda_de_seguridad",
    value: "Guarda de seguridad",
    label: "Guarda de seguridad",
    icon: "Shield",
    aliases: [
      "guarda de seguridad",
      "guarda_de_seguridad",
      "vigilante_fijo",
      "vigilante_movil",
      "vigilante fijo",
      "vigilante movil",
      "vigilante móvil",
      "vigilante",
      "guarda",
    ],
  },
  {
    id: "supervisor_de_seguridad",
    slug: "supervisor_de_seguridad",
    value: "Supervisor de seguridad",
    label: "Supervisor de seguridad",
    icon: "ShieldCheck",
    aliases: [
      "supervisor de seguridad",
      "supervisor_de_seguridad",
      "supervisor_motorizado",
      "supervisor_zona",
      "supervisor motorizado",
      "supervisor de zona",
      "supervisor de puesto",
      "supervisor",
      "inspector de seguridad",
    ],
  },
  {
    id: "escolta",
    slug: "escolta",
    value: "Escolta",
    label: "Escolta",
    icon: "UserCheck",
    aliases: [
      "escolta",
      "escolta_vip",
      "escolta_mercancia",
      "escolta vip",
      "escolta mercancia",
      "escolta mercancía",
      "escolta motorizado",
      "escolta profesional",
    ],
  },
  {
    id: "operador_de_medios_tecnologicos",
    slug: "operador_de_medios_tecnologicos",
    value: "Operador de medios tecnológicos",
    label: "Operador de medios tecnológicos",
    icon: "Monitor",
    aliases: [
      "operador de medios tecnologicos",
      "operador de medios tecnológicos",
      "operador_de_medios_tecnologicos",
      "operador_medios_tecnologicos",
      "operador medios tecnologicos",
      "operador medios tecnológicos",
      "operador cctv",
      "cctv",
      "operador de medios",
      "monitoreo",
    ],
  },
  {
    id: "coordinador_de_seguridad",
    slug: "coordinador_de_seguridad",
    value: "Coordinador de seguridad",
    label: "Coordinador de seguridad",
    icon: "Crown",
    aliases: [
      "coordinador de seguridad",
      "coordinador_de_seguridad",
      "coordinador operativo",
      "jefe de operaciones",
      "director de operaciones",
      "coordinador",
    ],
  },
  {
    id: "guia_canino",
    slug: "guia_canino",
    value: "Guía canino",
    label: "Guía canino",
    icon: "Dog",
    aliases: [
      "guia canino",
      "guía canino",
      "guia_canino",
      "manejador_canino",
      "manejador canino",
      "guarda canino",
      "guarda canino (guia)",
      "guarda canino (guía)",
      "binomio canino",
      "canino",
    ],
  },
  {
    id: "recepcionista",
    slug: "recepcionista",
    value: "Recepcionista",
    label: "Recepcionista",
    icon: "Headset",
    aliases: [
      "recepcionista",
      "recepcionista corporativo",
      "recepcionista de seguridad",
      "recepcion",
    ],
  },
  {
    id: "conserje",
    slug: "conserje",
    value: "Conserje",
    label: "Conserje",
    icon: "Building2",
    aliases: [
      "conserje",
      "portero conserje",
      "conserjeria",
      "todero",
    ],
  },
  {
    id: "analista_de_seguridad",
    slug: "analista_de_seguridad",
    value: "Analista de seguridad",
    label: "Analista de seguridad",
    icon: "FileSearch",
    aliases: [
      "analista de seguridad",
      "analista_de_seguridad",
      "analista de riesgos",
      "analista",
    ],
  },
  {
    id: "investigador",
    slug: "investigador",
    value: "Investigador",
    label: "Investigador",
    icon: "Search",
    aliases: [
      "investigador",
      "investigador judicial",
      "investigador de seguridad",
      "poligrafista",
      "visitador domiciliario",
    ],
  },
  {
    id: "asesor_de_seguridad",
    slug: "asesor_de_seguridad",
    value: "Asesor de seguridad",
    label: "Asesor de seguridad",
    icon: "UserCog",
    aliases: [
      "asesor de seguridad",
      "asesor_de_seguridad",
      "asesor comercial de seguridad",
      "asesor",
    ],
  },
  {
    id: "consultor_de_seguridad",
    slug: "consultor_de_seguridad",
    value: "Consultor de seguridad",
    label: "Consultor de seguridad",
    icon: "Users",
    aliases: [
      "consultor de seguridad",
      "consultor_de_seguridad",
      "consultor en seguridad",
      "consultor",
    ],
  },
  {
    id: "personal_administrativo",
    slug: "personal_administrativo",
    value: "Personal administrativo",
    label: "Personal administrativo",
    icon: "Briefcase",
    aliases: [
      "personal administrativo",
      "personal_administrativo",
      "auxiliar administrativo",
      "programador de turnos",
      "talento humano",
      "administrativo",
    ],
  },
];

export const SECURITY_ROLE_OPTIONS: SecurityRoleOption[] =
  OFFICIAL_SECURITY_PROFILES.map((p) => ({
    value: p.label,
    label: p.label,
    id: p.id,
    slug: p.slug,
    icon: p.icon,
    aliases: p.aliases,
  }));

function cleanRoleStr(input?: string | null): string {
  if (!input || typeof input !== "string") return "";
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Normaliza cualquier texto de interfaz, slug o valor histórico de BD (`vigilante_fijo`, `escolta_vip`, etc.)
 * a uno de los 13 Perfiles Oficiales de Seguridad Privada.
 */
export function normalizeSecurityRole(inputRole?: string | null): string {
  const clean = cleanRoleStr(inputRole);
  if (!clean) {
    return "Guarda de seguridad";
  }

  // 1. Búsqueda exacta por id, slug, label o alias
  for (const profile of OFFICIAL_SECURITY_PROFILES) {
    if (
      clean === cleanRoleStr(profile.id) ||
      clean === cleanRoleStr(profile.slug) ||
      clean === cleanRoleStr(profile.label) ||
      profile.aliases.some((alias) => clean === cleanRoleStr(alias))
    ) {
      return profile.label;
    }
  }

  // 2. Búsqueda heurística por inclusión de palabras clave (orden específico a general)
  if (clean.includes("canino")) return "Guía canino";
  if (clean.includes("medios") || clean.includes("cctv") || clean.includes("monitoreo") || clean.includes("operador")) {
    return "Operador de medios tecnológicos";
  }
  if (clean.includes("coordinador") || clean.includes("director de operaciones") || clean.includes("jefe de operaciones")) {
    return "Coordinador de seguridad";
  }
  if (clean.includes("supervisor") || clean.includes("inspector")) {
    return "Supervisor de seguridad";
  }
  if (clean.includes("escolta")) {
    return "Escolta";
  }
  if (clean.includes("recepcion")) {
    return "Recepcionista";
  }
  if (clean.includes("conserj") || clean.includes("todero")) {
    return "Conserje";
  }
  if (clean.includes("analista")) {
    return "Analista de seguridad";
  }
  if (clean.includes("investigador") || clean.includes("poligraf") || clean.includes("visitador")) {
    return "Investigador";
  }
  if (clean.includes("asesor")) {
    return "Asesor de seguridad";
  }
  if (clean.includes("consultor")) {
    return "Consultor de seguridad";
  }
  if (clean.includes("administrativ") || clean.includes("talento humano") || clean.includes("programador")) {
    return "Personal administrativo";
  }
  if (clean.includes("vigilante") || clean.includes("guarda")) {
    return "Guarda de seguridad";
  }

  return "Guarda de seguridad";
}

/**
 * Devuelve la etiqueta legible de cualquiera de los 13 perfiles oficiales o roles previos.
 */
export function formatSecurityRoleLabel(role?: string | null): string {
  if (!role) return "Guarda de seguridad";
  return normalizeSecurityRole(role);
}

/**
 * Evalúa de forma retrocompatible si una vacante (`role_required` + `title`) o un candidato
 * pertenece a un perfil oficial seleccionado.
 */
export function matchesOfficialSecurityProfile(
  selectedProfileOrCategory: string,
  roleValue?: string | null,
  titleValue?: string | null
): boolean {
  const cleanSelected = cleanRoleStr(selectedProfileOrCategory);
  if (!cleanSelected || cleanSelected === "todas" || cleanSelected === "todos") {
    return true;
  }

  const targetCanonical = normalizeSecurityRole(selectedProfileOrCategory);
  const roleCanonical = roleValue ? normalizeSecurityRole(roleValue) : "";

  if (roleValue && roleCanonical === targetCanonical) {
    return true;
  }

  const profileObj = OFFICIAL_SECURITY_PROFILES.find(
    (p) => p.label === targetCanonical
  );
  if (!profileObj) return false;

  const combinedText = `${cleanRoleStr(roleValue)} ${cleanRoleStr(titleValue)}`.trim();
  if (!combinedText) return false;

  return profileObj.aliases.some((alias) => {
    const cleanAlias = cleanRoleStr(alias);
    return cleanAlias.length >= 4 && combinedText.includes(cleanAlias);
  });
}
