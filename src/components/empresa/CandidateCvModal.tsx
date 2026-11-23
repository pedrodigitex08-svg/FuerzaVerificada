"use client";

import { useState, useEffect, useMemo } from "react";
import {
  X,
  MessageCircle,
  Printer,
  Copy,
  Check,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  Car,
  ShieldCheck,
  BadgeCheck,
  FileText,
  ExternalLink,
  Briefcase,
  GraduationCap,
  Award,
  Plane,
  Home,
  Banknote,
  HelpCircle,
  Calendar,
  Download,
  Shield,
} from "lucide-react";
import { ApplicationStatus } from "@/types/database";
import { MatchScoreBreakdown } from "@/lib/utils/matchScore";
import { formatSecurityRoleLabel } from "@/lib/utils/roleNormalizer";
import { openSecureDocument } from "@/lib/utils/storageSecurity";

export interface CandidateSecurityCourseItem {
  id?: string;
  courseName?: string;
  course_type?: string;
  name?: string;
  academyName?: string;
  academy?: string;
  institution?: string;
  completionDate?: string;
  completion_date?: string;
  hasSimetricCourse?: boolean;
  has_simetric?: boolean;
  simetricCourseNumber?: string;
  simetric_course_number?: string;
}

export interface CandidateWorkExperienceItem {
  id?: string;
  company?: string;
  role?: string;
  startDate?: string;
  start_date?: string;
  endDate?: string | null;
  end_date?: string | null;
  currentlyWorking?: boolean;
  current?: boolean;
  currently_working?: boolean;
  functions?: string;
  description?: string;
}

export interface CandidateDiplomaFileItem {
  id?: string;
  name?: string;
  url: string;
  uploaded_at?: string;
}

export interface CandidateCv360Data {
  id: string; // application id
  candidate_user_id?: string;
  full_name: string;
  email?: string;
  national_id: string;
  phone_whatsapp: string;
  avatar_url?: string | null;
  is_verified?: boolean;
  department?: string;
  city: string;
  locality?: string;
  primary_role: string;
  selected_roles?: string[];
  years_experience: number;
  // Formación académica
  education_level?: string;
  education_title?: string;
  education_institution?: string;
  education_currently_studying?: boolean;
  education_start_date?: string | null;
  education_end_date?: string | null;
  // Logística
  has_own_vehicle?: boolean;
  has_own_motorcycle?: boolean;
  vehicle_type?: string;
  motorcycle_cc?: number | null;
  driver_license_class?: string;
  has_driving_license?: boolean;
  has_military_booklet?: boolean;
  salary_expectation?: number | null;
  available_to_travel?: boolean | null;
  available_to_relocate?: boolean | null;
  available_immediately?: boolean;
  // Soportes documentales
  document_cv_url?: string | null;
  resume_pdf_url?: string | null;
  document_cedula_url?: string | null;
  document_libreta_url?: string | null;
  document_diplomas_url?: string | null;
  document_diplomas_list?: CandidateDiplomaFileItem[];
  // Cursos y SIMETRIC
  has_simetric_course?: boolean;
  simetric_course_number?: string | null;
  security_courses?: CandidateSecurityCourseItem[];
  course_name?: string;
  course_date?: string;
  // Experiencias laborales
  work_experiences?: CandidateWorkExperienceItem[];
  // Respuestas a preguntas de filtrado, adecuación y estado ATS
  screening_answers?: unknown;
  match_score: number;
  match_breakdown?: MatchScoreBreakdown;
  status: ApplicationStatus | string;
  applied_at?: string;
  bio_summary?: string | null;
}

interface CandidateCvModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: CandidateCv360Data | null;
  companyName: string;
  vacancyTitle: string;
  onStatusChange: (appId: string, nextStatus: ApplicationStatus) => void;
  onOpenStudyModal?: () => void;
}

const MONTHS_SHORT_ES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

function escapeHtml(raw?: string | null): string {
  if (!raw) return "";
  return String(raw)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function cleanColombianPhone(rawPhone?: string | null): string {
  const digits = String(rawPhone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("57") && digits.length > 10) {
    return digits.slice(2);
  }
  return digits;
}

function parseFlexibleDate(dateStr?: string | null): Date | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const clean = dateStr.trim().split("T")[0];
  if (!clean) return null;

  const ymMatch = clean.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/);
  if (ymMatch) {
    const year = parseInt(ymMatch[1], 10);
    const month = Math.max(1, Math.min(12, parseInt(ymMatch[2], 10))) - 1;
    const day = ymMatch[3] ? parseInt(ymMatch[3], 10) : 1;
    return new Date(year, month, day);
  }

  const parsed = new Date(clean);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatShortDateEs(dateStr?: string | null): string {
  if (!dateStr) return "";
  const d = parseFlexibleDate(dateStr);
  if (!d) return dateStr;
  return `${MONTHS_SHORT_ES[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Calcula automáticamente la duración legible entre fecha de inicio y fin (o Actualidad).
 * Ej: "2 años y 3 meses", "8 meses", "1 año", "1 mes".
 */
function calculateExperienceDuration(
  startStr?: string | null,
  endStr?: string | null,
  isCurrent?: boolean
): string {
  const start = parseFlexibleDate(startStr);
  if (!start) return "";

  const end = isCurrent || !endStr ? new Date() : parseFlexibleDate(endStr);
  if (!end) return "";

  let totalMonths =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());

  if (totalMonths < 1) totalMonths = 1;

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  const parts: string[] = [];
  if (years > 0) {
    parts.push(`${years} ${years === 1 ? "año" : "años"}`);
  }
  if (months > 0) {
    parts.push(`${months} ${months === 1 ? "mes" : "meses"}`);
  }

  return parts.join(" y ");
}

interface NormalizedScreeningAnswer {
  question: string;
  answer: string;
  idealAnswer?: string;
}

function normalizeScreeningAnswers(raw: unknown): NormalizedScreeningAnswer[] {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw
      .map((item: any, idx: number) => {
        if (!item) return null;
        if (typeof item === "string") {
          return { question: `Pregunta #${idx + 1}`, answer: item };
        }
        const q = item.question || item.label || `Pregunta #${idx + 1}`;
        const a = item.answer ?? item.response ?? item.value ?? "";
        if (!String(a).trim()) return null;
        return {
          question: String(q),
          answer: String(a),
          idealAnswer: item.ideal_answer ? String(item.ideal_answer) : undefined,
        };
      })
      .filter(Boolean) as NormalizedScreeningAnswer[];
  }

  if (typeof raw === "object") {
    return Object.entries(raw as Record<string, unknown>)
      .map(([k, v]) => {
        if (v === null || v === undefined || String(v).trim() === "") {
          return null;
        }
        return {
          question: k,
          answer: typeof v === "boolean" ? (v ? "Sí" : "No") : String(v),
        };
      })
      .filter(Boolean) as NormalizedScreeningAnswer[];
  }

  return [];
}

function getMatchScorePillClass(score: number): string {
  if (score >= 75) {
    return "bg-emerald-50 text-emerald-800 border-emerald-200";
  }
  if (score >= 50) {
    return "bg-[#EAF3FA] text-[#005DA4] border-[#D5E6F5]";
  }
  return "bg-amber-50 text-amber-800 border-amber-200";
}

export function CandidateCvModal({
  isOpen,
  onClose,
  candidate,
  companyName,
  vacancyTitle,
  onStatusChange,
  onOpenStudyModal,
}: CandidateCvModalProps) {
  const [copiedId, setCopiedId] = useState(false);

  // Cerrar con tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const screeningAnswers = useMemo(
    () => normalizeScreeningAnswers(candidate?.screening_answers),
    [candidate?.screening_answers]
  );

  const normalizedRoles = useMemo(() => {
    if (!candidate) return [];
    const list =
      Array.isArray(candidate.selected_roles) &&
      candidate.selected_roles.length > 0
        ? candidate.selected_roles
        : candidate.primary_role
        ? [candidate.primary_role]
        : [];
    return Array.from(
      new Set(list.filter(Boolean).map((r) => formatSecurityRoleLabel(r)))
    ).slice(0, 5);
  }, [candidate]);

  const diplomasList = useMemo(() => {
    if (!candidate) return [];
    const arr = Array.isArray(candidate.document_diplomas_list)
      ? candidate.document_diplomas_list.filter((d) => d && d.url)
      : [];
    if (arr.length > 0) return arr;
    if (candidate.document_diplomas_url) {
      return [
        {
          id: "legacy_diploma",
          name: "Diploma / Certificado de Seguridad",
          url: candidate.document_diplomas_url,
        },
      ];
    }
    return [];
  }, [candidate]);

  const coursesList = useMemo(() => {
    if (!candidate) return [];
    const raw = Array.isArray(candidate.security_courses)
      ? candidate.security_courses
      : [];
    if (raw.length > 0) {
      return raw.map((c, idx) => ({
        id: c.id || `course_${idx}`,
        courseName:
          c.courseName ||
          c.course_type ||
          c.name ||
          "Curso de Seguridad Privada",
        academyName:
          c.academyName || c.academy || c.institution || "Academia acreditada",
        completionDate: c.completionDate || c.completion_date || "",
        hasSimetric: Boolean(
          c.hasSimetricCourse ||
            c.has_simetric ||
            c.simetricCourseNumber ||
            c.simetric_course_number
        ),
        simetricNumber:
          c.simetricCourseNumber || c.simetric_course_number || "",
      }));
    }

    if (
      candidate.has_simetric_course ||
      candidate.simetric_course_number ||
      candidate.course_name
    ) {
      return [
        {
          id: "fallback_course",
          courseName: candidate.course_name || "Curso de Seguridad Privada",
          academyName: "Academia acreditada SuperVigilancia",
          completionDate: candidate.course_date || "",
          hasSimetric: Boolean(
            candidate.has_simetric_course || candidate.simetric_course_number
          ),
          simetricNumber: candidate.simetric_course_number || "",
        },
      ];
    }
    return [];
  }, [candidate]);

  if (!isOpen || !candidate) return null;

  const cvUrl = candidate.document_cv_url || candidate.resume_pdf_url || null;
  const cleanPhone = cleanColombianPhone(candidate.phone_whatsapp);
  const whatsappHref = cleanPhone
    ? `https://wa.me/57${cleanPhone}?text=${encodeURIComponent(
        `Hola ${candidate.full_name}, te escribimos de ${
          companyName || "nuestra empresa de seguridad"
        } respecto a tu postulación a la vacante ${
          vacancyTitle || "de seguridad privada"
        } en FuerzaVerificada. Nos gustaría conversar contigo sobre el proceso de selección.`
      )}`
    : null;

  const handleCopyNationalId = async () => {
    if (!candidate.national_id) return;
    try {
      await navigator.clipboard.writeText(candidate.national_id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {}
  };

  // Exportación / Impresión limpia a PDF nativa sin librerías externas
  const handlePrintPdf = () => {
    if (typeof window === "undefined") return;
    const printWin = window.open("", "_blank", "width=940,height=1050");
    if (!printWin) {
      alert(
        "Por favor permite las ventanas emergentes en tu navegador para generar la Hoja de Vida en PDF."
      );
      return;
    }

    const workExps = Array.isArray(candidate.work_experiences)
      ? candidate.work_experiences
      : [];

    const rolesHtml = normalizedRoles
      .map((r) => `<span class="pill">${escapeHtml(r)}</span>`)
      .join("");

    const screeningHtml =
      screeningAnswers.length > 0
        ? `
      <div class="section">
        <h2>Respuestas a Preguntas de Filtrado</h2>
        <div class="box">
          ${screeningAnswers
            .map(
              (sa) => `
            <div class="qa-item">
              <div class="qa-q">${escapeHtml(sa.question)}</div>
              <div class="qa-a">Respuesta: <strong>${escapeHtml(sa.answer)}</strong></div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>`
        : "";

    const experiencesHtml =
      workExps.length > 0
        ? workExps
            .map((exp) => {
              const startStr = exp.startDate || exp.start_date || "";
              const endStr = exp.endDate || exp.end_date || "";
              const isCurr = Boolean(
                exp.currentlyWorking || exp.current || exp.currently_working
              );
              const duration = calculateExperienceDuration(
                startStr,
                endStr,
                isCurr
              );
              const dateRange = startStr
                ? `${formatShortDateEs(startStr)} — ${
                    isCurr ? "Actualidad" : formatShortDateEs(endStr) || "Finalizado"
                  }`
                : isCurr
                ? "Actualidad"
                : "";
              const funcs = (exp.functions || exp.description || "").slice(0, 500);
              return `
                <div class="entry">
                  <div class="entry-header">
                    <div>
                      <div class="entry-title">${escapeHtml(exp.company || "Empresa")}</div>
                      ${exp.role ? `<div class="entry-sub">${escapeHtml(exp.role)}</div>` : ""}
                    </div>
                    <div class="entry-meta">
                      ${dateRange ? `<span>${escapeHtml(dateRange)}</span>` : ""}
                      ${duration ? `<span class="duration-badge">${escapeHtml(duration)}</span>` : ""}
                    </div>
                  </div>
                  ${funcs ? `<p class="entry-desc">${escapeHtml(funcs)}</p>` : ""}
                </div>
              `;
            })
            .join("")
        : `<p class="muted">Experiencia operativa reportada: ${candidate.years_experience} años.</p>`;

    const eduPeriod = candidate.education_start_date
      ? `${formatShortDateEs(candidate.education_start_date)} — ${
          candidate.education_currently_studying
            ? "Cursando actualmente"
            : formatShortDateEs(candidate.education_end_date) || "Finalizado"
        }`
      : candidate.education_currently_studying
      ? "Cursando actualmente"
      : "";

    const educationHtml =
      candidate.education_level ||
      candidate.education_title ||
      candidate.education_institution
        ? `
      <div class="entry">
        <div class="entry-header">
          <div>
            <div class="entry-title">${escapeHtml(
              candidate.education_title || candidate.education_level || "Formación Académica"
            )}</div>
            <div class="entry-sub">${escapeHtml(
              [candidate.education_level, candidate.education_institution]
                .filter(Boolean)
                .join(" • ")
            )}</div>
          </div>
          ${eduPeriod ? `<div class="entry-meta"><span>${escapeHtml(eduPeriod)}</span></div>` : ""}
        </div>
      </div>`
        : `<p class="muted">Sin formación académica detallada.</p>`;

    const coursesHtml =
      coursesList.length > 0
        ? coursesList
            .map(
              (c) => `
          <div class="entry">
            <div class="entry-header">
              <div>
                <div class="entry-title">${escapeHtml(c.courseName)}</div>
                <div class="entry-sub">${escapeHtml(c.academyName)}</div>
              </div>
              <div class="entry-meta">
                ${c.completionDate ? `<span>${escapeHtml(formatShortDateEs(c.completionDate))}</span>` : ""}
                ${
                  c.hasSimetric
                    ? `<span class="simetric-badge">SIMETRIC${
                        c.simetricNumber ? ` #${escapeHtml(c.simetricNumber)}` : " Vigente"
                      }</span>`
                    : ""
                }
              </div>
            </div>
          </div>
        `
            )
            .join("")
        : `<p class="muted">Sin cursos registrados.</p>`;

    const vehicleLabel = candidate.has_own_vehicle
      ? candidate.vehicle_type ||
        (candidate.has_own_motorcycle
          ? `Motocicleta (${candidate.motorcycle_cc || 150}cc)`
          : "Sí posee")
      : "No posee";

    const htmlDoc = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Hoja de Vida - ${escapeHtml(candidate.full_name)} | FuerzaVerificada</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 24px;
      background: #fff;
      font-size: 12px;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .toolbar {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-bottom: 16px;
    }
    .btn-print {
      background: #0B3B70;
      color: #fff;
      border: none;
      border-radius: 999px;
      padding: 8px 18px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .header {
      background: #0B3B70;
      color: #fff;
      padding: 20px 24px;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      margin-bottom: 18px;
    }
    .brand { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #93c5fd; font-weight: 700; }
    .cand-name { font-size: 22px; font-weight: 800; margin: 4px 0 2px; }
    .cand-role { font-size: 13px; color: #e2e8f0; }
    .score-box {
      background: rgba(255,255,255,0.14);
      border: 1px solid rgba(255,255,255,0.28);
      border-radius: 10px;
      padding: 10px 14px;
      text-align: center;
      min-width: 110px;
    }
    .score-val { font-size: 20px; font-weight: 800; color: #FFE066; }
    .score-lbl { font-size: 10px; text-transform: uppercase; color: #e2e8f0; }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 16px;
      margin-bottom: 18px;
    }
    .meta-item label { display: block; font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; }
    .meta-item span { font-size: 12px; font-weight: 600; color: #0f172a; }
    .section { margin-bottom: 16px; page-break-inside: avoid; }
    .section h2 {
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #0B3B70;
      border-bottom: 2px solid #EAF3FA;
      padding-bottom: 4px;
      margin: 0 0 10px;
    }
    .pills { display: flex; flex-wrap: wrap; gap: 6px; }
    .pill {
      background: #EAF3FA;
      color: #0B3B70;
      border: 1px solid #D5E6F5;
      border-radius: 999px;
      padding: 3px 10px;
      font-size: 11px;
      font-weight: 600;
    }
    .entry {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 8px;
      page-break-inside: avoid;
    }
    .entry-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
    .entry-title { font-size: 13px; font-weight: 700; color: #0f172a; }
    .entry-sub { font-size: 11px; color: #475569; margin-top: 2px; }
    .entry-meta { text-align: right; font-size: 11px; color: #64748b; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
    .duration-badge {
      background: #EAF3FA;
      color: #005DA4;
      border-radius: 999px;
      padding: 2px 8px;
      font-size: 10px;
      font-weight: 700;
    }
    .simetric-badge {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      border-radius: 999px;
      padding: 2px 8px;
      font-size: 10px;
      font-weight: 700;
    }
    .entry-desc { margin: 8px 0 0; font-size: 11.5px; color: #334155; white-space: pre-line; }
    .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; }
    .qa-item { margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px dashed #e2e8f0; }
    .qa-item:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
    .qa-q { font-size: 11px; color: #475569; font-weight: 600; }
    .qa-a { font-size: 12px; color: #0f172a; margin-top: 2px; }
    .muted { color: #64748b; font-style: italic; margin: 0; }
    .footer {
      margin-top: 22px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      font-size: 10px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { padding: 0; }
      .toolbar { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button class="btn-print" onclick="window.print()">Imprimir / Guardar como PDF</button>
  </div>

  <div class="header">
    <div>
      <div class="brand">FuerzaVerificada • Expediente Operativo 360°</div>
      <div class="cand-name">${escapeHtml(candidate.full_name)}</div>
      <div class="cand-role">${escapeHtml(candidate.primary_role)} • Postulado a: ${escapeHtml(vacancyTitle)}</div>
    </div>
    <div class="score-box">
      <div class="score-val">${candidate.match_score}%</div>
      <div class="score-lbl">Adecuación</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-item"><label>Cédula</label><span>C.C. ${escapeHtml(candidate.national_id)}</span></div>
    <div class="meta-item"><label>Teléfono / WhatsApp</label><span>${escapeHtml(candidate.phone_whatsapp)}</span></div>
    <div class="meta-item"><label>Correo Electrónico</label><span>${escapeHtml(candidate.email || "No registrado")}</span></div>
    <div class="meta-item"><label>Ubicación</label><span>${escapeHtml(
      [candidate.city, candidate.department].filter(Boolean).join(", ")
    )}</span></div>
    <div class="meta-item"><label>Vehículo y Licencia</label><span>${escapeHtml(vehicleLabel)}${
      candidate.driver_license_class ? ` • Lic. ${escapeHtml(candidate.driver_license_class)}` : ""
    }</span></div>
    <div class="meta-item"><label>Libreta Militar / Exp.</label><span>${
      candidate.has_military_booklet ? "Al día" : "No registra"
    } • ${candidate.years_experience} años</span></div>
  </div>

  <div class="section">
    <h2>Especialidades en Seguridad Privada</h2>
    <div class="pills">${rolesHtml}</div>
  </div>

  ${screeningHtml}

  <div class="section">
    <h2>Experiencia Laboral</h2>
    ${experiencesHtml}
  </div>

  <div class="section">
    <h2>Formación Académica</h2>
    ${educationHtml}
  </div>

  <div class="section">
    <h2>Cursos y Certificaciones (SIMETRIC / SuperVigilancia)</h2>
    ${coursesHtml}
  </div>

  <div class="footer">
    <span>Generado por FuerzaVerificada para ${escapeHtml(companyName)}</span>
    <span>Fecha de descarga: ${new Date().toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}</span>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.focus(); window.print(); }, 250);
    };
  </script>
</body>
</html>`;

    printWin.document.open();
    printWin.document.write(htmlDoc);
    printWin.document.close();
  };

  const workExperiences = Array.isArray(candidate.work_experiences)
    ? candidate.work_experiences
    : [];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 lg:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Hoja de Vida 360 de ${candidate.full_name}`}
    >
      {/* Overlay click to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Amplio Modal 360° de 2 Columnas */}
      <div className="relative z-10 w-full max-w-6xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Top Bar Fija del Modal */}
        <div className="px-5 py-3.5 bg-[#0B3B70] text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Shield className="w-4 h-4 text-[#FFE066] shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200 truncate">
              Visor 360° de Hoja de Vida — {vacancyTitle}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
            title="Cerrar visor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido Principal en 2 Columnas */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12">
          {/* =============================================================== */}
          {/* COLUMNA IZQUIERDA: CONTACTO, LOGÍSTICA Y BÓVEDA DOCUMENTAL      */}
          {/* =============================================================== */}
          <aside className="lg:col-span-4 bg-slate-50/90 border-b lg:border-b-0 lg:border-r border-slate-200 p-5 sm:p-6 space-y-5">
            {/* Identidad + Verificación + % Adecuación */}
            <div className="flex items-start gap-3.5">
              {candidate.avatar_url ? (
                <img
                  src={candidate.avatar_url}
                  alt={candidate.full_name}
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-[#0B3B70] text-white flex items-center justify-center font-extrabold text-xl shrink-0 shadow-xs">
                  {candidate.full_name.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="min-w-0">
                <h2 className="text-lg font-bold text-slate-900 leading-tight">
                  {candidate.full_name}
                </h2>
                <p className="text-xs font-semibold text-slate-600 mt-0.5">
                  {candidate.primary_role}
                </p>

                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {candidate.is_verified !== false && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#005DA4] bg-[#EAF3FA] border border-[#D5E6F5] px-2 py-0.5 rounded-full">
                      <BadgeCheck className="w-3 h-3" />
                      Perfil Verificado
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-full border ${getMatchScorePillClass(
                      candidate.match_score
                    )}`}
                  >
                    {candidate.match_score}% Adecuación
                  </span>
                </div>
              </div>
            </div>

            {/* Desglose breve de adecuación */}
            {candidate.match_breakdown && (
              <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Desglose de compatibilidad
                </span>
                <div className="grid grid-cols-5 gap-1 text-center text-[10px]">
                  <div className="bg-slate-50 rounded-md p-1.5">
                    <span className="text-slate-500 block">Perfil</span>
                    <strong className="font-mono text-slate-900">
                      {candidate.match_breakdown.roleMatch}/30
                    </strong>
                  </div>
                  <div className="bg-slate-50 rounded-md p-1.5">
                    <span className="text-slate-500 block">Ubic.</span>
                    <strong className="font-mono text-slate-900">
                      {candidate.match_breakdown.locationMatch}/20
                    </strong>
                  </div>
                  <div className="bg-slate-50 rounded-md p-1.5">
                    <span className="text-slate-500 block">Curso</span>
                    <strong className="font-mono text-slate-900">
                      {candidate.match_breakdown.simetricMatch}/20
                    </strong>
                  </div>
                  <div className="bg-slate-50 rounded-md p-1.5">
                    <span className="text-slate-500 block">Exp.</span>
                    <strong className="font-mono text-slate-900">
                      {candidate.match_breakdown.experienceMatch}/15
                    </strong>
                  </div>
                  <div className="bg-slate-50 rounded-md p-1.5">
                    <span className="text-slate-500 block">Est.</span>
                    <strong className="font-mono text-slate-900">
                      {candidate.match_breakdown.educationVehicleMatch}/15
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Contacto y Botón Directo de WhatsApp */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Datos de Contacto
              </span>

              <div className="space-y-2 text-xs">
                {/* Cédula con botón copiar 1 clic */}
                <div className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/80">
                  <div className="flex items-center gap-2 min-w-0">
                    <CreditCard className="w-3.5 h-3.5 text-[#005DA4] shrink-0" />
                    <span className="font-mono font-semibold text-slate-800 truncate">
                      C.C. {candidate.national_id}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyNationalId}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#005DA4] hover:text-[#0B3B70] bg-white border border-slate-200 px-2 py-1 rounded-lg transition-colors shrink-0 cursor-pointer"
                    title="Copiar número de cédula"
                  >
                    {copiedId ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Teléfono */}
                <div className="flex items-center gap-2 px-1 text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono font-semibold">
                    {candidate.phone_whatsapp || "No registrado"}
                  </span>
                </div>

                {/* Correo electrónico */}
                <div className="flex items-center gap-2 px-1 text-slate-700">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate font-medium">
                    {candidate.email || "Correo gestionado por plataforma"}
                  </span>
                </div>
              </div>

              {/* Botón Verde Destacado Enviar WhatsApp */}
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <MessageCircle className="w-4 h-4" strokeWidth={2.2} />
                  <span>Enviar WhatsApp</span>
                  <ExternalLink className="w-3 h-3 opacity-80" />
                </a>
              )}
            </div>

            {/* Datos Clave de Logística */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Logística y Movilidad
              </span>

              <div className="space-y-2 text-xs text-slate-700">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#005DA4] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">
                      Ubicación
                    </span>
                    <strong className="font-semibold text-slate-900">
                      {candidate.city}
                      {candidate.department &&
                      candidate.department !== candidate.city
                        ? `, ${candidate.department}`
                        : ""}
                      {candidate.locality ? ` • ${candidate.locality}` : ""}
                    </strong>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Car className="w-3.5 h-3.5 text-[#005DA4] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">
                      Vehículo propio y licencia
                    </span>
                    <strong className="font-semibold text-slate-900">
                      {candidate.has_own_vehicle
                        ? candidate.vehicle_type ||
                          (candidate.has_own_motorcycle
                            ? `Motocicleta (${candidate.motorcycle_cc || 150}cc)`
                            : "Sí posee")
                        : "Sin vehículo propio"}
                      {" • "}
                      {candidate.has_driving_license
                        ? `Licencia ${candidate.driver_license_class || "Vigente"}`
                        : "Sin licencia"}
                    </strong>
                  </div>
                </div>

                {candidate.salary_expectation ? (
                  <div className="flex items-start gap-2">
                    <Banknote className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">
                        Aspiración salarial
                      </span>
                      <strong className="font-mono font-semibold text-slate-900">
                        ${candidate.salary_expectation.toLocaleString("es-CO")}{" "}
                        COP
                      </strong>
                    </div>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center gap-1.5 text-[11px]">
                    <Plane className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>
                      Viajar:{" "}
                      <strong>
                        {candidate.available_to_travel === true
                          ? "Sí"
                          : candidate.available_to_travel === false
                          ? "No"
                          : "A convenir"}
                      </strong>
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center gap-1.5 text-[11px]">
                    <Home className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>
                      Traslado:{" "}
                      <strong>
                        {candidate.available_to_relocate === true
                          ? "Sí"
                          : candidate.available_to_relocate === false
                          ? "No"
                          : "A convenir"}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bóveda de Soportes Descargables */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Bóveda de Soportes Documentales
                </span>
                <FileText className="w-3.5 h-3.5 text-[#005DA4]" />
              </div>

              <div className="space-y-2">
                {cvUrl ? (
                  <button
                    type="button"
                    onClick={() => openSecureDocument(cvUrl)}
                    className="w-full px-3 py-2 rounded-xl bg-[#EAF3FA] hover:bg-[#D5E6F5] text-[#0B3B70] border border-[#D5E6F5] text-xs font-semibold flex items-center justify-between gap-2 transition-colors cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-2 truncate">
                      <Download className="w-3.5 h-3.5 shrink-0" />
                      <span>Hoja de Vida (PDF)</span>
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </button>
                ) : (
                  <div className="px-3 py-2 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-[11px] text-slate-400">
                    Hoja de Vida (PDF): sin archivo adjunto
                  </div>
                )}

                {candidate.document_cedula_url ? (
                  <button
                    type="button"
                    onClick={() =>
                      openSecureDocument(candidate.document_cedula_url)
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold flex items-center justify-between gap-2 transition-colors cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-2 truncate">
                      <CreditCard className="w-3.5 h-3.5 text-[#005DA4] shrink-0" />
                      <span>Cédula de Ciudadanía</span>
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>
                ) : (
                  <div className="px-3 py-2 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-[11px] text-slate-400">
                    Cédula de Ciudadanía: pendiente de carga
                  </div>
                )}

                {candidate.document_libreta_url && (
                  <button
                    type="button"
                    onClick={() =>
                      openSecureDocument(candidate.document_libreta_url)
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold flex items-center justify-between gap-2 transition-colors cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-2 truncate">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Libreta Militar</span>
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>
                )}

                {diplomasList.length > 0 && (
                  <div className="pt-1 space-y-1.5">
                    <span className="text-[10px] font-semibold text-slate-500 block">
                      Diplomas y Certificados ({diplomasList.length}):
                    </span>
                    {diplomasList.map((dip, idx) => (
                      <button
                        key={dip.id || `dip_${idx}`}
                        type="button"
                        onClick={() => openSecureDocument(dip.url)}
                        className="w-full px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-medium flex items-center justify-between gap-2 transition-colors cursor-pointer text-left"
                      >
                        <span className="inline-flex items-center gap-2 min-w-0">
                          <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="truncate">
                            {dip.name || `Diploma #${idx + 1}`}
                          </span>
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* =============================================================== */}
          {/* COLUMNA DERECHA: ACCIONES ATS + HOJA DE VIDA ESTRUCTURADA       */}
          {/* =============================================================== */}
          <main className="lg:col-span-8 bg-white p-5 sm:p-7 space-y-6">
            {/* Barra Superior de Acciones ATS + Botón Imprimir/Descargar PDF */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
                  Fase de Embudo:
                </label>
                <select
                  value={candidate.status}
                  onChange={(e) =>
                    onStatusChange(
                      candidate.id,
                      e.target.value as ApplicationStatus
                    )
                  }
                  className="h-9 rounded-full px-4 text-xs font-bold border border-slate-300 bg-white text-slate-900 shadow-2xs focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 cursor-pointer"
                >
                  <option value="postulado">Postulado</option>
                  <option value="preseleccionado">En Revisión</option>
                  <option value="citado_entrevista">Citado a Entrevista</option>
                  <option value="en_estudio_seguridad">
                    Poligrafía / Estudio
                  </option>
                  <option value="examenes_medicos">Exámenes Médicos</option>
                  <option value="contratado">Contratado</option>
                  <option value="descartado">Descartado</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {onOpenStudyModal && (
                  <button
                    type="button"
                    onClick={onOpenStudyModal}
                    className="h-9 px-3.5 rounded-full bg-white hover:bg-[#EAF3FA] text-[#0B3B70] border border-[#D5E6F5] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#005DA4]" />
                    <span>Poligrafía</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handlePrintPdf}
                  className="h-9 px-4 rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#FFE066]" />
                  <span>Descargar / Imprimir HV en PDF</span>
                </button>
              </div>
            </div>

            {/* 1. Respuestas a Preguntas de Filtrado */}
            {screeningAnswers.length > 0 && (
              <section className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
                  <HelpCircle className="w-4 h-4 text-amber-700" />
                  <span>
                    Respuestas a Preguntas de Filtrado (
                    {screeningAnswers.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {screeningAnswers.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white border border-amber-200/80 space-y-1"
                    >
                      <p className="text-xs font-semibold text-slate-700">
                        {idx + 1}. {item.question}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#0B3B70]">
                          R/: {item.answer}
                        </span>
                        {item.idealAnswer && (
                          <span className="text-[10px] font-semibold text-slate-500">
                            Ideal: {item.idealAnswer}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 2. Especialidades en Seguridad Privada */}
            <section className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#005DA4]" />
                <span>Especialidades en Seguridad Privada</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {normalizedRoles.map((role) => (
                  <span
                    key={role}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-[#EAF3FA] text-[#0B3B70] border border-[#D5E6F5]"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </section>

            {/* 3. Experiencia Laboral con Duración Automática */}
            <section className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-[#005DA4]" />
                  <span>Experiencia Laboral</span>
                </h3>
                <span className="text-[11px] font-mono font-semibold text-slate-500">
                  {candidate.years_experience} años reportados
                </span>
              </div>

              {workExperiences.length > 0 ? (
                <div className="space-y-3">
                  {workExperiences.map((exp, idx) => {
                    const startStr = exp.startDate || exp.start_date || "";
                    const endStr = exp.endDate || exp.end_date || "";
                    const isCurr = Boolean(
                      exp.currentlyWorking ||
                        exp.current ||
                        exp.currently_working
                    );
                    const duration = calculateExperienceDuration(
                      startStr,
                      endStr,
                      isCurr
                    );
                    const funcs = (
                      exp.functions ||
                      exp.description ||
                      ""
                    ).slice(0, 500);

                    return (
                      <div
                        key={exp.id || `exp_${idx}`}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">
                              {exp.company || "Empresa de Seguridad"}
                            </h4>
                            {exp.role && (
                              <p className="text-xs font-semibold text-[#005DA4]">
                                {exp.role}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                            {(startStr || isCurr) && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                {startStr ? formatShortDateEs(startStr) : "Inicio"}{" "}
                                —{" "}
                                {isCurr
                                  ? "Actualidad"
                                  : formatShortDateEs(endStr) || "Finalizado"}
                              </span>
                            )}
                            {duration && (
                              <span className="text-[11px] font-bold text-[#005DA4] bg-[#EAF3FA] border border-[#D5E6F5] px-2.5 py-0.5 rounded-full">
                                {duration}
                              </span>
                            )}
                          </div>
                        </div>

                        {funcs && (
                          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                            {funcs}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                  El candidato reporta{" "}
                  <strong>{candidate.years_experience} años</strong> de
                  experiencia general en seguridad privada (sin detalle de
                  empresas registradas en la lista dinámica).
                </div>
              )}
            </section>

            {/* 4. Formación Académica */}
            <section className="space-y-3 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-[#005DA4]" />
                <span>Formación Académica</span>
              </h3>

              {candidate.education_level ||
              candidate.education_title ||
              candidate.education_institution ? (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-slate-900">
                      {candidate.education_title ||
                        candidate.education_level ||
                        "Estudios registrados"}
                    </h4>
                    {candidate.education_level && (
                      <p className="text-xs font-semibold text-[#005DA4]">
                        {candidate.education_level}
                      </p>
                    )}
                    {candidate.education_institution && (
                      <p className="text-xs text-slate-600">
                        {candidate.education_institution}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0">
                    {candidate.education_currently_studying ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        Cursando actualmente
                      </span>
                    ) : candidate.education_start_date ||
                      candidate.education_end_date ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
                        {formatShortDateEs(candidate.education_start_date) ||
                          "Inicio"}{" "}
                        —{" "}
                        {formatShortDateEs(candidate.education_end_date) ||
                          "Finalizado"}
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                  No se ha registrado formación académica detallada aún.
                </div>
              )}
            </section>

            {/* 5. Cursos y Certificaciones (SIMETRIC) */}
            <section className="space-y-3 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#005DA4]" />
                <span>Cursos y Certificaciones (SIMETRIC / SuperVigilancia)</span>
              </h3>

              {coursesList.length > 0 ? (
                <div className="space-y-2.5">
                  {coursesList.map((course) => (
                    <div
                      key={course.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {course.courseName}
                        </h4>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {course.academyName}
                          {course.completionDate
                            ? ` • ${formatShortDateEs(course.completionDate)}`
                            : ""}
                        </p>
                      </div>

                      {course.hasSimetric ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full self-start sm:self-center shrink-0">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>
                            SIMETRIC
                            {course.simetricNumber
                              ? ` • Reg. ${course.simetricNumber}`
                              : " Verificado"}
                          </span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full self-start sm:self-center">
                          Sin registro SIMETRIC
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                  Sin cursos de vigilancia ni certificaciones SIMETRIC
                  registradas.
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
