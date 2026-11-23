/**
 * Catálogo geográfico de Colombia (32 departamentos + Bogotá D.C.)
 * y catálogos normalizados del sector de Vigilancia y Seguridad Privada.
 */

export const COLOMBIA_DEPARTMENTS_CITIES: Record<string, string[]> = {
  "Bogotá D.C.": ["Bogotá D.C."],
  Amazonas: ["Leticia", "Puerto Nariño"],
  Antioquia: [
    "Medellín",
    "Bello",
    "Envigado",
    "Itagüí",
    "Rionegro",
    "Sabaneta",
    "Apartadó",
    "Turbo",
    "Caucasia",
    "La Estrella",
    "Copacabana",
    "Caldas",
    "Girardota",
    "Marinilla",
    "Guarne",
    "Puerto Berrío",
  ],
  Arauca: ["Arauca", "Saravena", "Tame", "Arauquita", "Fortul"],
  Atlántico: [
    "Barranquilla",
    "Soledad",
    "Malambo",
    "Puerto Colombia",
    "Sabanalarga",
    "Galapa",
    "Baranoa",
    "Sabanagrande",
  ],
  Bolívar: [
    "Cartagena",
    "Magangué",
    "Turbaco",
    "Arjona",
    "El Carmen de Bolívar",
    "Mompox",
    "Santa Rosa del Sur",
  ],
  Boyacá: [
    "Tunja",
    "Duitama",
    "Sogamoso",
    "Chiquinquirá",
    "Paipa",
    "Puerto Boyacá",
    "Villa de Leyva",
    "Nobsa",
    "Garagoa",
  ],
  Caldas: [
    "Manizales",
    "Villamaría",
    "La Dorada",
    "Chinchiná",
    "Riosucio",
    "Anserma",
    "Supía",
  ],
  Caquetá: [
    "Florencia",
    "San Vicente del Caguán",
    "Puerto Rico",
    "El Doncello",
    "Cartagena del Chairá",
  ],
  Casanare: [
    "Yopal",
    "Aguazul",
    "Villanueva",
    "Tauramena",
    "Paz de Ariporo",
    "Monterrey",
  ],
  Cauca: [
    "Popayán",
    "Santander de Quilichao",
    "Puerto Tejada",
    "Guachené",
    "Piendamó",
    "Patía (El Bordo)",
    "Miranda",
  ],
  Cesar: [
    "Valledupar",
    "Aguachica",
    "Agustín Codazzi",
    "La Jagua de Ibirico",
    "Bosconia",
    "Curumaní",
    "Chiriguaná",
  ],
  Chocó: ["Quibdó", "Istmina", "Condoto", "Tadó", "Bahía Solano", "Acandí"],
  Córdoba: [
    "Montería",
    "Lorica",
    "Sahagún",
    "Cereté",
    "Montelíbano",
    "Planeta Rica",
    "Tierralta",
    "Ciénaga de Oro",
  ],
  Cundinamarca: [
    "Soacha",
    "Chía",
    "Zipaquirá",
    "Facatativá",
    "Fusagasugá",
    "Mosquera",
    "Madrid",
    "Funza",
    "Cajicá",
    "Girardot",
    "Tocancipá",
    "Cota",
    "Sopó",
    "Tenjo",
    "Sibaté",
    "La Calera",
    "Villeta",
    "Ubaté",
    "Gachancipá",
  ],
  Guainía: ["Inírida"],
  Guaviare: ["San José del Guaviare", "Calamar", "El Retorno"],
  Huila: [
    "Neiva",
    "Pitalito",
    "Garzón",
    "La Plata",
    "Campoalegre",
    "Palermo",
    "Rivera",
  ],
  "La Guajira": [
    "Riohacha",
    "Maicao",
    "Uribia",
    "Fonseca",
    "San Juan del Cesar",
    "Albania",
    "Barrancas",
  ],
  Magdalena: [
    "Santa Marta",
    "Ciénaga",
    "Fundación",
    "El Banco",
    "Plato",
    "Zona Bananera",
    "Aracataca",
  ],
  Meta: [
    "Villavicencio",
    "Acacías",
    "Granada",
    "Puerto López",
    "Puerto Gaitán",
    "Restrepo",
    "Cumaral",
    "San Martín",
  ],
  Nariño: [
    "Pasto",
    "Ipiales",
    "Tumaco",
    "Túquerres",
    "La Unión",
    "Samaniego",
    "Sandoná",
  ],
  "Norte de Santander": [
    "Cúcuta",
    "Ocaña",
    "Villa del Rosario",
    "Los Patios",
    "Pamplona",
    "Tibú",
    "El Zulia",
  ],
  Putumayo: [
    "Mocoa",
    "Puerto Asís",
    "Orito",
    "Valle del Guamuez (La Hormiga)",
    "Villagarzón",
    "Sibundoy",
  ],
  Quindío: [
    "Armenia",
    "Calarcá",
    "La Tebaida",
    "Montenegro",
    "Quimbaya",
    "Circasia",
    "Filandia",
  ],
  Risaralda: [
    "Pereira",
    "Dosquebradas",
    "Santa Rosa de Cabal",
    "La Virginia",
    "Belén de Umbría",
    "Marsella",
  ],
  "San Andrés y Providencia": ["San Andrés", "Providencia"],
  Santander: [
    "Bucaramanga",
    "Floridablanca",
    "Girón",
    "Piedecuesta",
    "Barrancabermeja",
    "San Gil",
    "Socorro",
    "Barbosa",
    "Málaga",
    "Lebrija",
  ],
  Sucre: ["Sincelejo", "Corozal", "San Marcos", "Tolú", "Coveñas", "Sampués"],
  Tolima: [
    "Ibagué",
    "Espinal",
    "Melgar",
    "Honda",
    "Líbano",
    "Mariquita",
    "Chaparral",
    "Flandes",
  ],
  "Valle del Cauca": [
    "Cali",
    "Palmira",
    "Buenaventura",
    "Tuluá",
    "Buga (Guadalajara de Buga)",
    "Cartago",
    "Jamundí",
    "Yumbo",
    "Candelaria",
    "Florida",
    "Pradera",
    "Zarzal",
    "Sevilla",
  ],
  Vaupés: ["Mitú"],
  Vichada: ["Puerto Carreño", "La Primavera", "Cumaribo"],
};

export const COLOMBIA_DEPARTMENTS: string[] = Object.keys(
  COLOMBIA_DEPARTMENTS_CITIES
);

export const CONTRACT_TYPES = [
  "Contrato a término fijo",
  "Contrato a término indefinido",
  "Contrato de Obra o labor",
  "Contrato civil por prestación de servicios",
  "Contrato de aprendizaje",
  "Contrato ocasional de trabajo",
] as const;

export type ContractTypeOption = (typeof CONTRACT_TYPES)[number];

export const WORK_MODALITIES = [
  "Presencial",
  "Presencial y remoto",
  "Remoto",
] as const;

export type WorkModalityOption = (typeof WORK_MODALITIES)[number];

export const EDUCATION_LEVELS = [
  "Educación Básica primaria",
  "Educación Básica secundaria",
  "Bachillerato / Educación Media",
  "Universidad / Carrera técnica",
  "Universidad / Carrera tecnológica",
  "Universidad / Carrera profesional",
  "Postgrado / Especialización",
  "Postgrado / Maestría",
  "Postgrado / Doctorado",
] as const;

export type EducationLevelOption = (typeof EDUCATION_LEVELS)[number];

export const SECURITY_SKILLS_CATALOG: string[] = [
  "Control de accesos",
  "CCTV y monitoreo",
  "Manejo de armas",
  "Curso SIMETRIC vigente",
  "Minuta digital",
  "Poligrafía",
  "Seguridad física",
  "Escolta VIP",
  "Primeros auxilios",
  "Defensa personal",
  "Servicio al cliente",
  "Conducción defensiva",
  "Gestión de riesgos",
  "Normas BASC / ISO",
  "Supervisión operativa",
  "Ofimática / Excel",
  "Recepción y conmutador",
  "Turnos rotativos 2x2x2 / 12x12",
  "Investigación corporativa",
  "Manejo canino",
];

export const LANGUAGE_OPTIONS: string[] = [
  "Inglés",
  "Español",
  "Portugués",
  "Francés",
  "Alemán",
  "Italiano",
];

export const LANGUAGE_LEVELS = [
  "Básico",
  "Intermedio",
  "Avanzado",
  "Nativo",
] as const;

export type LanguageLevelOption = (typeof LANGUAGE_LEVELS)[number];

export const DRIVER_LICENSE_CLASSES: string[] = [
  "A1",
  "A2",
  "B1",
  "B2",
  "B3",
  "C1",
  "C2",
  "C3",
];

export interface ExperienceOption {
  value: number;
  label: string;
}

export const EXPERIENCE_OPTIONS: ExperienceOption[] = [
  { value: 0, label: "Sin experiencia" },
  { value: 0.5, label: "Menos de 1 año" },
  { value: 1, label: "1 año" },
  { value: 2, label: "2 años" },
  { value: 3, label: "3 años" },
  { value: 4, label: "4 años" },
  { value: 5, label: "5 años" },
  { value: 6, label: "6 años" },
  { value: 7, label: "7 años" },
  { value: 8, label: "8 años" },
  { value: 9, label: "9 años" },
  { value: 10, label: "10 años" },
  { value: 11, label: "11 años" },
  { value: 12, label: "12 años" },
  { value: 13, label: "13 años" },
  { value: 14, label: "14 años" },
  { value: 15, label: "15+ años" },
];

/**
 * Helper para resolver el departamento a partir de una ciudad conocida.
 */
export function findDepartmentByCity(city?: string | null): string {
  if (!city) return "Bogotá D.C.";
  const norm = city
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  for (const [dept, cities] of Object.entries(COLOMBIA_DEPARTMENTS_CITIES)) {
    for (const c of cities) {
      const cNorm = c
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
      if (cNorm === norm || cNorm.includes(norm) || norm.includes(cNorm)) {
        return dept;
      }
    }
  }
  return "Bogotá D.C.";
}
