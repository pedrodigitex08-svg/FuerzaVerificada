import { Company, PartnerAcademy, SecurityStudyStatus } from "@/types/database";

export interface DemoSecurityOrder {
  id: string;
  candidate_name: string;
  national_id: string;
  candidate_phone: string;
  candidate_address: string;
  company_name: string;
  company_phone: string;
  job_title: string;
  status: SecurityStudyStatus;
  scheduled_date: string;
  final_concept: string;
  report_pdf_url: string | null;
  include_polygraph: boolean;
  include_home_visit: boolean;
  include_background_study: boolean;
  resume_pdf_url: string | null;
  course_diploma_url: string | null;
  created_at: string;
}

export const INITIAL_DEMO_COMPANIES: Company[] = [
  {
    id: "comp-1",
    owner_id: "usr-comp-1",
    company_name: "Seguridad Atlas de Colombia",
    nit: "860.024.112-9",
    supervigilancia_license: "Licencia SV-00492 de 2018",
    city: "Bogotá D.C.",
    address: "Calle 100 # 19-61, Edificio Atlas",
    contact_person: "Dra. Claudia Santamaría",
    contact_phone: "3154829100",
    logo_url: null,
    is_verified_company: true,
    plan_name: "pack_corporativo_vip",
    credits_security_studies: 12,
    created_at: "2026-01-15T08:00:00Z",
  },
  {
    id: "comp-2",
    owner_id: "usr-comp-2",
    company_name: "G4S Seguridad Integral",
    nit: "800.198.341-3",
    supervigilancia_license: "Licencia SV-01288 de 2020",
    city: "Bogotá D.C.",
    address: "Carrera 45 # 108-27",
    contact_person: "Cap. (R) Jorge Hernán Gómez",
    contact_phone: "3109281744",
    logo_url: null,
    is_verified_company: true,
    plan_name: "pack_operativo",
    credits_security_studies: 4,
    created_at: "2026-02-01T10:30:00Z",
  },
  {
    id: "comp-3",
    owner_id: "usr-comp-3",
    company_name: "Omnitempus Seguridad VIP",
    nit: "900.512.879-1",
    supervigilancia_license: "Licencia SV-00911 de 2021",
    city: "Medellín",
    address: "Cra 43A # 1 Sur-188, El Poblado",
    contact_person: "Dr. Andrés Felipe Londoño",
    contact_phone: "3187263541",
    logo_url: null,
    is_verified_company: true,
    plan_name: "pack_corporativo_vip",
    credits_security_studies: 8,
    created_at: "2026-02-14T09:15:00Z",
  },
  {
    id: "comp-4",
    owner_id: "usr-comp-4",
    company_name: "Vigilancia San Martín Ltda.",
    nit: "830.091.223-7",
    supervigilancia_license: "Licencia SV-00341 de 2017",
    city: "Cali",
    address: "Av. Roosevelt # 34-12",
    contact_person: "Sra. Esperanza Marín",
    contact_phone: "3128901234",
    logo_url: null,
    is_verified_company: false,
    plan_name: "basico",
    credits_security_studies: 0,
    created_at: "2026-03-01T14:20:00Z",
  },
  {
    id: "comp-5",
    owner_id: "usr-comp-5",
    company_name: "Custodiar Protección Privada",
    nit: "901.321.455-0",
    supervigilancia_license: "Licencia SV-00782 de 2022",
    city: "Barranquilla",
    address: "Cra 53 # 79-122",
    contact_person: "Ing. Roberto Consuegra",
    contact_phone: "3004567890",
    logo_url: null,
    is_verified_company: true,
    plan_name: "pack_operativo",
    credits_security_studies: 2,
    created_at: "2026-03-10T11:00:00Z",
  },
];

export const INITIAL_DEMO_ACADEMIES: PartnerAcademy[] = [
  {
    id: "acad-1",
    name: "Academia Nacional de Seguridad (ANS)",
    city: "Bogotá D.C.",
    whatsapp_number: "3158901234",
    discount_text: "15% Descuento Convenio FuerzaVerificada",
    referral_code: "FUERZA2026",
    is_active: true,
  },
  {
    id: "acad-2",
    name: "Instituto de Capacitación Táctica Andina",
    city: "Medellín",
    whatsapp_number: "3119876543",
    discount_text: "20% en Reentrenamiento Vigilancia & Escoltas",
    referral_code: "FUERZAMED26",
    is_active: true,
  },
  {
    id: "acad-3",
    name: "Centro de Formación en Seguridad del Valle (CENFOR)",
    city: "Cali",
    whatsapp_number: "3176543210",
    discount_text: "15% Descuento en Curso Básico y Reentrenamiento",
    referral_code: "FUERZACALI",
    is_active: true,
  },
  {
    id: "acad-4",
    name: "Escuela de Seguridad del Caribe (PROSEG)",
    city: "Barranquilla",
    whatsapp_number: "3007654321",
    discount_text: "Bono de $40.000 COP en tu matrícula",
    referral_code: "FUERZABQ",
    is_active: true,
  },
  {
    id: "acad-5",
    name: "Academia de Vigilancia Santander (AVISAN)",
    city: "Bucaramanga",
    whatsapp_number: "3165432198",
    discount_text: "15% Descuento Especial Gremial",
    referral_code: "FUERZABUC",
    is_active: true,
  },
];

export const INITIAL_DEMO_ORDERS: DemoSecurityOrder[] = [
  {
    id: "ord-101",
    candidate_name: "Carlos Eduardo Moreno R.",
    national_id: "1020304050",
    candidate_phone: "3104567890",
    candidate_address: "Cra 78B # 45-20 Sur, Barrio Kennedy, Bogotá D.C.",
    company_name: "Seguridad Atlas de Colombia",
    company_phone: "3154829100",
    job_title: "Vigilante Fijo - Centro Empresarial Calle 100",
    status: "aprobado",
    scheduled_date: "Poligrafía realizada el 21 Oct 2026 • 09:00 AM",
    final_concept:
      "Aprobado sin riesgo para servicio armado. Sin antecedentes penales, judiciales ni medidas de convivencia vigentes. Poligrafía sin indicadores de engaño en hurto o infiltración criminal. Visita domiciliaria y entorno social favorable.",
    report_pdf_url: "https://demo.fuerzaverificada.com/informes/inf-carlos-moreno.pdf",
    include_polygraph: true,
    include_home_visit: true,
    include_background_study: true,
    resume_pdf_url: "https://demo.fuerzaverificada.com/hv-carlos.pdf",
    course_diploma_url: "https://demo.fuerzaverificada.com/diploma-carlos.pdf",
    created_at: "2026-10-20T10:15:00Z",
  },
  {
    id: "ord-102",
    candidate_name: "Mauricio Restrepo Valencia",
    national_id: "80123992",
    candidate_phone: "3127894561",
    candidate_address: "Calle 140 # 19-35, Apto 402, Cedritos, Bogotá D.C.",
    company_name: "G4S Seguridad Integral",
    company_phone: "3109281744",
    job_title: "Supervisor Motorizado Nocturno",
    status: "en_proceso",
    scheduled_date: "Poligrafía finalizada. Visita domiciliaria agendada para hoy a las 3:30 PM",
    final_concept:
      "Polígrafo sin anomalías relevantes. En verificación de vecindad y validación de autenticidad de credencial ante SuperVigilancia.",
    report_pdf_url: null,
    include_polygraph: true,
    include_home_visit: true,
    include_background_study: true,
    resume_pdf_url: "https://demo.fuerzaverificada.com/hv-mauricio.pdf",
    course_diploma_url: "https://demo.fuerzaverificada.com/diploma-mauricio.pdf",
    created_at: "2026-10-22T08:30:00Z",
  },
  {
    id: "ord-103",
    candidate_name: "Julián David Cárdenas",
    national_id: "1018273645",
    candidate_phone: "3189901234",
    candidate_address: "Carrera 68D # 22-10, Fontibón, Bogotá D.C.",
    company_name: "Omnitempus Seguridad VIP",
    company_phone: "3187263541",
    job_title: "Escolta VIP Diplomático",
    status: "rechazado_riesgo",
    scheduled_date: "Completado el 18 Oct 2026",
    final_concept:
      "Concepto NO favorable por inconsistencias significativas en examen de poligrafía referente a fuga de información corporativa y proceso judicial activo no declarado en declaraciones juramentadas.",
    report_pdf_url: "https://demo.fuerzaverificada.com/informes/inf-julian-cardenas.pdf",
    include_polygraph: true,
    include_home_visit: true,
    include_background_study: true,
    resume_pdf_url: "https://demo.fuerzaverificada.com/hv-julian.pdf",
    course_diploma_url: "https://demo.fuerzaverificada.com/diploma-julian.pdf",
    created_at: "2026-10-17T14:40:00Z",
  },
  {
    id: "ord-104",
    candidate_name: "Andrés Felipe Gómez Ortiz",
    national_id: "1032489110",
    candidate_phone: "3148902341",
    candidate_address: "Calle 53 Sur # 24C-12, Tunjuelito, Bogotá D.C.",
    company_name: "Seguridad Atlas de Colombia",
    company_phone: "3154829100",
    job_title: "Vigilante Móvil - Zona Norte",
    status: "agendado",
    scheduled_date: "Cita Polígrafo: Mañana 24 Oct 2026 a las 08:30 AM (Sede Central)",
    final_concept: "Citación formal enviada al candidato por WhatsApp. Pendiente aplicación de prueba poligráfica.",
    report_pdf_url: null,
    include_polygraph: true,
    include_home_visit: true,
    include_background_study: true,
    resume_pdf_url: "https://demo.fuerzaverificada.com/hv-andres.pdf",
    course_diploma_url: "https://demo.fuerzaverificada.com/diploma-andres.pdf",
    created_at: "2026-10-23T09:10:00Z",
  },
  {
    id: "ord-105",
    candidate_name: "Jhon Alexander Benítez",
    national_id: "79654123",
    candidate_phone: "3167789012",
    candidate_address: "Transversal 85G # 74-12, Engativá, Bogotá D.C.",
    company_name: "G4S Seguridad Integral",
    company_phone: "3109281744",
    job_title: "Operador de Medios Tecnológicos",
    status: "solicitado",
    scheduled_date: "Pendiente de asignación de fecha y analista",
    final_concept: "Orden radicada por el cliente. En fase de contacto y recolección de documentos domiciliarios.",
    report_pdf_url: null,
    include_polygraph: true,
    include_home_visit: true,
    include_background_study: true,
    resume_pdf_url: "https://demo.fuerzaverificada.com/hv-jhon.pdf",
    course_diploma_url: "https://demo.fuerzaverificada.com/diploma-jhon.pdf",
    created_at: "2026-10-23T11:45:00Z",
  },
];

/**
 * Initializes or resets full Colombian demo dataset in localStorage
 */
export function initializeSeedData(forceReset: boolean = false): {
  companies: Company[];
  orders: DemoSecurityOrder[];
  academies: PartnerAcademy[];
} {
  if (typeof window === "undefined") {
    return {
      companies: INITIAL_DEMO_COMPANIES,
      orders: INITIAL_DEMO_ORDERS,
      academies: INITIAL_DEMO_ACADEMIES,
    };
  }

  // Check or set companies
  const savedCompanies = localStorage.getItem("fv_companies");
  let companies: Company[] = INITIAL_DEMO_COMPANIES;
  if (!savedCompanies || forceReset) {
    localStorage.setItem("fv_companies", JSON.stringify(INITIAL_DEMO_COMPANIES));
  } else {
    try {
      companies = JSON.parse(savedCompanies);
    } catch {
      companies = INITIAL_DEMO_COMPANIES;
    }
  }

  // Check or set security orders
  const savedOrders = localStorage.getItem("fv_security_orders");
  let orders: DemoSecurityOrder[] = INITIAL_DEMO_ORDERS;
  if (!savedOrders || forceReset) {
    localStorage.setItem("fv_security_orders", JSON.stringify(INITIAL_DEMO_ORDERS));
  } else {
    try {
      orders = JSON.parse(savedOrders);
    } catch {
      orders = INITIAL_DEMO_ORDERS;
    }
  }

  // Check or set academies
  const savedAcademies = localStorage.getItem("fv_partner_academies");
  let academies: PartnerAcademy[] = INITIAL_DEMO_ACADEMIES;
  if (!savedAcademies || forceReset) {
    localStorage.setItem("fv_partner_academies", JSON.stringify(INITIAL_DEMO_ACADEMIES));
  } else {
    try {
      academies = JSON.parse(savedAcademies);
    } catch {
      academies = INITIAL_DEMO_ACADEMIES;
    }
  }

  // Sync demo company credits
  if (forceReset || localStorage.getItem("fv_company_credits") === null) {
    localStorage.setItem("fv_company_credits", "5");
  }

  return { companies, orders, academies };
}
