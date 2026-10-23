/**
 * Cleans phone number and formats it with Colombian country code 57.
 */
export function formatColombiaPhone(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("57") && cleaned.length >= 12) {
    return cleaned;
  }
  if (cleaned.length === 10) {
    return `57${cleaned}`;
  }
  return cleaned;
}

export interface InterviewCitationParams {
  phone: string;
  candidateName: string;
  companyName: string;
  jobTitle: string;
  shift?: string;
  interviewAddress?: string | null;
  interviewDateText?: string;
}

/**
 * Generates 1-click WhatsApp citation link for recruiting managers to contact candidates.
 */
export function generateInterviewCitationLink(params: InterviewCitationParams): string {
  const phone = formatColombiaPhone(params.phone);
  const text = `Hola *${params.candidateName.trim()}*, te escribimos de *${params.companyName.trim()}* a través de *FuerzaVerificada*. 

Hemos revisado tu perfil y quedamos muy interesados en tu postulación para la vacante de *${params.jobTitle.trim()}*${params.shift ? ` (Turno ${params.shift})` : ""}.

Nos gustaría citarte a entrevista presencial:
📍 *Lugar:* ${params.interviewAddress ? params.interviewAddress.trim() : "Nuestra sede principal"}
📅 *Fecha/Hora:* ${params.interviewDateText ? params.interviewDateText.trim() : "Por favor indícanos tu disponibilidad para hoy o mañana"}
📄 *Documentos requeridos:* Cédula original, Hoja de vida y Diploma/Credencial de Curso de Vigilancia vigente.

Por favor confírmanos si puedes asistir. ¡Te esperamos!`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export interface AcademyRenewalParams {
  academyPhone: string;
  academyName: string;
  candidateName: string;
  city: string;
  courseName?: string;
  referralCode?: string;
  discountText?: string;
}

/**
 * Generates WhatsApp link for candidates to renew expired/expiring security courses with partner academies.
 */
export function generateAcademyRenewalLink(params: AcademyRenewalParams): string {
  const phone = formatColombiaPhone(params.academyPhone);
  const text = `Hola *${params.academyName.trim()}*, me comunico desde la plataforma *FuerzaVerificada*. 

Mi nombre es *${params.candidateName.trim()}* en la ciudad de *${params.city.trim()}*. 
Necesito realizar/renovar mi curso de *${params.courseName || "Reentrenamiento / Vigilancia"}*.

Tengo el código de descuento por convenio: *${params.referralCode || "FUERZA2026"}*${
    params.discountText ? ` (${params.discountText})` : ""
  }. ¿Me podrían indicar fechas de inicio, horarios y precios? Gracias.`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export const DEFAULT_WHATSAPP_SALES_NUMBER = "573104508920";

/**
 * Returns current corporate sales WhatsApp number from client cache or default fallback.
 */
export function getStoredWhatsAppSalesNumber(): string {
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem("fv_whatsapp_sales_number");
    if (cached && cached.trim()) {
      return formatColombiaPhone(cached.trim());
    }
  }
  return DEFAULT_WHATSAPP_SALES_NUMBER;
}

/**
 * Persists the corporate sales WhatsApp number in client cache.
 */
export function setStoredWhatsAppSalesNumber(phone: string): void {
  if (typeof window !== "undefined") {
    const clean = formatColombiaPhone(phone);
    localStorage.setItem("fv_whatsapp_sales_number", clean);
  }
}

export interface PackageRechargeParams {
  supportPhone?: string;
  companyName: string;
  nit?: string;
  packageType?: string;
}

/**
 * Generates WhatsApp link for security companies to request or recharge B2B security study & polygraph packages.
 */
export function generatePackageRechargeLink(params: PackageRechargeParams): string {
  const dynamicSalesPhone = getStoredWhatsAppSalesNumber();
  const phone = formatColombiaPhone(params.supportPhone || dynamicSalesPhone);
  const text = `Hola equipo de *FuerzaVerificada*, me comunico de la empresa *${params.companyName.trim()}*${
    params.nit ? ` (NIT: ${params.nit})` : ""
  }.

Deseamos recargar/adquirir un paquete corporativo de *Estudios de Seguridad, Visitas Domiciliarias y Poligrafía* para nuestros procesos de selección${
    params.packageType ? ` (Interesados en: ${params.packageType})` : ""
  }. 

¿Nos pueden compartir la cotización y activación de créditos inmediata?`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export interface CandidatePolygraphCitationParams {
  candidatePhone: string;
  candidateName: string;
  companyName: string;
  scheduledDateText: string;
  appointmentType?: string;
  locationAddress?: string;
}

/**
 * Generates WhatsApp citation link for candidates regarding their polygraph or home visit evaluation.
 */
export function generateCandidatePolygraphCitationLink(
  params: CandidatePolygraphCitationParams
): string {
  const phone = formatColombiaPhone(params.candidatePhone);
  const type = params.appointmentType || "Examen de Poligrafía y Estudio de Seguridad";
  const location = params.locationAddress || "Laboratorio Central de Poligrafía FuerzaVerificada";

  const text = `Hola *${params.candidateName.trim()}*, te contactamos del Departamento de Seguridad y Poligrafía de *FuerzaVerificada*.

Has sido programado para tu *${type}* dentro del proceso de selección con *${params.companyName.trim()}*.

📅 *Fecha y Hora:* ${params.scheduledDateText.trim()}
📍 *Lugar / Modalidad:* ${location.trim()}
📋 *Requisitos:*
1. Cédula de ciudadanía física original.
2. Presentarse con 15 minutos de anticipación.
3. Dormir mínimo 6 horas y evitar consumir energizantes o medicamentos sedantes.

Por favor confírmanos recibido y asistencia respondiendo a este mensaje.`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export interface CompanyReportDeliveryParams {
  companyPhone: string;
  companyName: string;
  candidateName: string;
  candidateNationalId: string;
  status: "aprobado" | "rechazado_riesgo" | string;
  finalConceptSummary?: string;
}

/**
 * Generates WhatsApp notification link for enterprise clients informing that the candidate's security report is ready.
 */
export function generateCompanyReportDeliveryLink(
  params: CompanyReportDeliveryParams
): string {
  const phone = formatColombiaPhone(params.companyPhone);
  const statusLabel =
    params.status === "aprobado"
      ? "APROBADO SIN RIESGO (Favorable)"
      : "NO FAVORABLE (Riesgo Identificado)";

  const text = `Estimado equipo de Selección de *${params.companyName.trim()}*,

Les notificamos que el proceso de *Estudio de Seguridad, Visita Domiciliaria y Poligrafía* para el candidato *${params.candidateName.trim()}* (CC. ${params.candidateNationalId}) ha culminado.

🛡️ *Concepto Final:* *${statusLabel}*
${params.finalConceptSummary ? `📝 *Observación:* ${params.finalConceptSummary}\n` : ""}
Pueden consultar el dictamen y descargar el informe confidencial en PDF ingresando a su panel corporativo en *FuerzaVerificada* (/empresa/estudios).`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
