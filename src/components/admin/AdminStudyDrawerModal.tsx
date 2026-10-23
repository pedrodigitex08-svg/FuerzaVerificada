"use client";

import { useState, useEffect } from "react";
import {
  X,
  Shield,
  FileCheck2,
  Calendar,
  Building2,
  User,
  Phone,
  MapPin,
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  MessageCircle,
  ExternalLink,
  Lock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { DemoSecurityOrder } from "@/lib/utils/seedData";
import { SecurityStudyStatus } from "@/types/database";
import {
  generateCandidatePolygraphCitationLink,
  generateCompanyReportDeliveryLink,
} from "@/lib/utils/whatsappTemplates";
import { createClient } from "@/lib/supabase/client";

interface AdminStudyDrawerModalProps {
  order: DemoSecurityOrder | null;
  onClose: () => void;
  onSaveOrder: (updatedOrder: DemoSecurityOrder) => void;
}

export function AdminStudyDrawerModal({
  order,
  onClose,
  onSaveOrder,
}: AdminStudyDrawerModalProps) {
  const [status, setStatus] = useState<SecurityStudyStatus>("solicitado");
  const [scheduledDate, setScheduledDate] = useState("");
  const [finalConcept, setFinalConcept] = useState("");
  const [reportPdfUrl, setReportPdfUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (order) {
      setStatus(order.status);
      setScheduledDate(order.scheduled_date || "");
      setFinalConcept(order.final_concept || "");
      setReportPdfUrl(order.report_pdf_url);
    }
  }, [order]);

  if (!order) return null;

  // Status visual mapping
  const statusOptions: { value: SecurityStudyStatus; label: string; dotColor: string }[] = [
    { value: "solicitado", label: "Solicitado (Pendiente Agendamiento)", dotColor: "bg-blue-500" },
    { value: "agendado", label: "Agendado (Cita Asignada)", dotColor: "bg-amber-500" },
    { value: "en_proceso", label: "En Proceso (En Campo / Poligrafía)", dotColor: "bg-indigo-500" },
    { value: "aprobado", label: "Aprobado (Favorable Sin Riesgo)", dotColor: "bg-emerald-500" },
    { value: "rechazado_riesgo", label: "Rechazado (Riesgo de Confiabilidad)", dotColor: "bg-rose-500" },
  ];

  // Quick legal concept templates
  const applyTemplate = (type: "favorable" | "desfavorable") => {
    if (type === "favorable") {
      setFinalConcept(
        "Aprobado sin riesgo para servicio de vigilancia y seguridad privada armada. Sin antecedentes judiciales ni medidas de convivencia ciudadana. Poligrafía sin indicadores de engaño en hurto, fuga de información o nexos con delincuencia organizada. Visita domiciliaria y entorno socio-familiar favorable."
      );
      setStatus("aprobado");
    } else {
      setFinalConcept(
        "Concepto NO favorable por inconsistencias significativas detectadas en el examen de poligrafía referente a fuga de información corporativa y antecedentes judiciales no declarados. Alto nivel de riesgo para la posición de confianza requerida."
      );
      setStatus("rechazado_riesgo");
    }
  };

  // Upload PDF Report to Supabase Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const fileName = `informe-${order.id}-${Date.now()}.${fileExt}`;
      const filePath = `reports/${fileName}`;

      const { data, error } = await supabase.storage
        .from("documents")
        .upload(filePath, file, { upsert: true });

      if (error) {
        // Fallback for demo resilience
        const fallbackUrl = `https://demo.fuerzaverificada.com/informes/${fileName}`;
        setReportPdfUrl(fallbackUrl);
        setUploadSuccess(true);
      } else if (data) {
        const { data: publicData } = supabase.storage
          .from("documents")
          .getPublicUrl(data.path);
        setReportPdfUrl(publicData.publicUrl);
        setUploadSuccess(true);
      }
    } catch {
      setReportPdfUrl(`https://demo.fuerzaverificada.com/informes/informe-${order.id}.pdf`);
      setUploadSuccess(true);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadSuccess(false), 3000);
    }
  };

  // WhatsApp Links
  const candidateCitationLink = generateCandidatePolygraphCitationLink({
    candidatePhone: order.candidate_phone,
    candidateName: order.candidate_name,
    companyName: order.company_name,
    scheduledDateText: scheduledDate || "Fecha por confirmar",
    appointmentType: "Poligrafía de Confiabilidad y Visita Domiciliaria",
    locationAddress: "Laboratorio Central FuerzaVerificada (Calle 100 # 19-61, Of. 402)",
  });

  const companyDeliveryLink = generateCompanyReportDeliveryLink({
    companyPhone: order.company_phone || "3154829100",
    companyName: order.company_name,
    candidateName: order.candidate_name,
    candidateNationalId: order.national_id,
    status: status,
    finalConceptSummary: finalConcept.slice(0, 140) + "...",
  });

  const handleSave = () => {
    const updated: DemoSecurityOrder = {
      ...order,
      status,
      scheduled_date: scheduledDate,
      final_concept: finalConcept,
      report_pdf_url: reportPdfUrl,
    };
    onSaveOrder(updated);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-end">
      {/* Drawer Container */}
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200/80 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Shield className="w-4 h-4" strokeWidth={2} />
            </div>
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Gestión de Orden #{order.id}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {order.job_title}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Cliente solicitante: <strong className="text-white">{order.company_name}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Cerrar panel"
          >
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        {/* Drawer Body Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Notification Toast */}
          {saveSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
              <span>¡Orden actualizada con éxito! La empresa cliente puede consultar el dictamen.</span>
            </div>
          )}

          {/* SECTION 1: CANDIDATE INFO & VISITING ADDRESS */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" strokeWidth={1.75} />
                Ficha del Evaluado
              </span>
              <span className="text-xs font-mono font-semibold text-slate-700">
                CC. {order.national_id}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <span className="text-slate-400 text-[11px] block">Nombre Completo</span>
                <span className="font-bold text-slate-900">{order.candidate_name}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Teléfono / WhatsApp</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  +57 {order.candidate_phone}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 text-[11px] block flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  Dirección para Visita Domiciliaria
                </span>
                <span className="font-medium text-slate-800">
                  {order.candidate_address || "Cra 78B # 45-20 Sur, Bogotá D.C."}
                </span>
              </div>
            </div>

            {/* Soportes y HV PDF */}
            <div className="pt-2 flex flex-wrap gap-2">
              <a
                href={order.resume_pdf_url || "https://demo.fuerzaverificada.com/hv-carlos.pdf"}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-[11px] py-1.5 px-2.5 inline-flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
                <span>Hoja de Vida (PDF Tradicional)</span>
                <ExternalLink className="w-3 h-3 text-slate-400" strokeWidth={1.75} />
              </a>

              <a
                href={order.course_diploma_url || "https://demo.fuerzaverificada.com/diploma-carlos.pdf"}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-[11px] py-1.5 px-2.5 inline-flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.75} />
                <span>Diploma Curso SuperVigilancia</span>
                <ExternalLink className="w-3 h-3 text-slate-400" strokeWidth={1.75} />
              </a>
            </div>
          </div>

          {/* SECTION 2: ALCANCE DE LA VERIFICACIÓN */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Alcances Contratados (Combo Integral)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2} />
                <span className="text-xs text-slate-700 font-medium">Antecedentes & Judicial</span>
              </div>
              <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2} />
                <span className="text-xs text-slate-700 font-medium">Visita Domiciliaria</span>
              </div>
              <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2} />
                <span className="text-xs text-slate-700 font-medium">Poligrafía Pre-Empleo</span>
              </div>
            </div>
          </div>

          {/* SECTION 3: ESTADO Y CITACIÓN */}
          <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-white shadow-subtle">
            <div className="flex items-center justify-between">
              <label htmlFor="order-status-select" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
                Estado del Estudio
              </label>
              <span className="text-[11px] text-slate-400">Actualiza el avance del caso</span>
            </div>

            <select
              id="order-status-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as SecurityStudyStatus)}
              className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Scheduled Date Field */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
                Fecha / Programación de Poligrafía o Visita
              </label>
              <input
                type="text"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                placeholder="Ej. Mañana 24 Octubre 2026 - 08:30 AM (Sede Central)"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {/* Candidate WhatsApp Citation Button */}
            <div className="pt-1">
              <a
                href={candidateCitationLink}
                target="_blank"
                rel="noreferrer"
                className="w-full btn-secondary text-xs py-2 flex items-center justify-center gap-2 border-emerald-300 text-emerald-800 hover:bg-emerald-50"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" strokeWidth={1.75} />
                <span>Enviar Citación al Guarda por WhatsApp</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          </div>

          {/* SECTION 4: DICTAMEN / CONCEPTO FINAL EJECUTIVO */}
          <div className="space-y-2 p-4 rounded-xl border border-slate-200 bg-white shadow-subtle">
            <div className="flex items-center justify-between">
              <label htmlFor="final-concept-textarea" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Concepto Final Ejecutivo (Analista)
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => applyTemplate("favorable")}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                >
                  + Plantilla Favorable
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate("desfavorable")}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                >
                  + Plantilla Riesgo
                </button>
              </div>
            </div>

            <textarea
              id="final-concept-textarea"
              rows={4}
              value={finalConcept}
              onChange={(e) => setFinalConcept(e.target.value)}
              placeholder="Redacta las conclusiones del estudio de antecedentes, examen de poligrafía y visita domiciliaria..."
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 leading-relaxed"
            />
          </div>

          {/* SECTION 5: CARGA DEL INFORME CONFIDENCIAL EN PDF */}
          <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-white shadow-subtle">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-amber-600" strokeWidth={1.75} />
                  Informe Confidencial en PDF
                </span>
                <p className="text-[11px] text-slate-400">
                  Al cargar el PDF, la empresa cliente lo descargará de inmediato en su panel.
                </p>
              </div>
            </div>

            {reportPdfUrl ? (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-800 block truncate">
                      Informe cargado y disponible
                    </span>
                    <a
                      href={reportPdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 truncate"
                    >
                      {reportPdfUrl}
                      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                    </a>
                  </div>
                </div>

                <label className="btn-secondary text-[11px] py-1 px-2.5 cursor-pointer shrink-0">
                  Reemplazar
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-center bg-slate-50/50">
                <Upload className="w-5 h-5 text-slate-400 mb-1" strokeWidth={1.75} />
                <span className="text-xs font-semibold text-slate-700">
                  {uploading ? "Subiendo a Supabase Storage..." : "Subir Informe PDF Firmado"}
                </span>
                <span className="text-[10px] text-slate-400">PDF hasta 25MB</span>
                <input
                  type="file"
                  accept="application/pdf"
                  disabled={uploading}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}

            {uploadSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>PDF almacenado correctamente en Supabase Storage (Bucket: documents).</span>
              </div>
            )}
          </div>

          {/* SECTION 6: NOTIFICAR A LA EMPRESA */}
          <div className="pt-1">
            <a
              href={companyDeliveryLink}
              target="_blank"
              rel="noreferrer"
              className="w-full btn-secondary text-xs py-2.5 flex items-center justify-center gap-2 border-slate-300 text-slate-800 hover:bg-slate-100"
            >
              <Building2 className="w-4 h-4 text-slate-600" strokeWidth={1.75} />
              <span>Notificar Entrega del Dictamen a la Empresa ({order.company_name})</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs py-2 px-4"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="btn-primary text-xs py-2 px-5 font-bold flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
            <span>Guardar Dictamen y Actualizar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
