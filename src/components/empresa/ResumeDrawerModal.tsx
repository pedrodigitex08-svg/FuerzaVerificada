"use client";

import {
  X,
  FileText,
  FileCheck,
  CreditCard,
  Download,
  ExternalLink,
  Shield,
  MapPin,
  Phone,
  Briefcase,
  Check,
  Calendar,
  Bike,
  Sparkles,
} from "lucide-react";
import { CandidateWithCourseStatusView, SecurityRoleType } from "@/types/database";

interface ResumeDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: {
    id: string;
    full_name: string;
    national_id: string;
    phone_whatsapp: string;
    city: string;
    locality?: string | null;
    primary_role: SecurityRoleType;
    years_experience: number;
    has_military_booklet: boolean;
    has_own_motorcycle: boolean;
    motorcycle_cc?: number | null;
    available_immediately: boolean;
    resume_pdf_url?: string | null;
    course_name?: string | null;
    completion_date?: string | null;
    expiration_date?: string | null;
    days_remaining?: number | null;
    match_score?: number;
    work_history?: { company: string; role: string; dates: string }[];
  } | null;
  onOpenStudyModal?: () => void;
}

export function ResumeDrawerModal({
  isOpen,
  onClose,
  candidate,
  onOpenStudyModal,
}: ResumeDrawerModalProps) {
  if (!isOpen || !candidate) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-end">
      {/* Background click to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Slide-over panel */}
      <div className="w-full max-w-xl bg-white h-full shadow-elevated border-l border-slate-200 overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-200">
        <div>
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Expediente del Aspirante
              </span>
              {candidate.match_score !== undefined && (
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  {candidate.match_score}% Match
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Candidate Identity Card */}
            <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="badge-emerald text-[10px] py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Credencial SuperVigilancia Vigente
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {candidate.days_remaining || 184} días restantes
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400 text-lg shrink-0">
                  {candidate.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    {candidate.full_name}
                  </h3>
                  <div className="text-xs font-semibold text-amber-400 font-mono mt-0.5">
                    {candidate.primary_role}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    C.C. {candidate.national_id} • {candidate.city} {candidate.locality ? `(${candidate.locality})` : ""}
                  </div>
                </div>
              </div>

              {/* Technical attributes */}
              <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-slate-800">
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">Experiencia</span>
                  <span className="font-bold text-white font-mono">{candidate.years_experience} años</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">Libreta Militar</span>
                  <span className="font-bold text-white">{candidate.has_military_booklet ? "Al día" : "No"}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">Moto Propia</span>
                  <span className="font-bold text-white">
                    {candidate.has_own_motorcycle ? `${candidate.motorcycle_cc || 150}cc` : "No"}
                  </span>
                </div>
              </div>
            </div>

            {/* DOWNLOAD RESUME / HOJA DE VIDA SECTION */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Documentos y Soportes Originales
              </h4>

              <div className="space-y-2 text-xs">
                {/* 1. PDF Resume */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                      <FileText className="w-5 h-5 text-amber-600" strokeWidth={1.75} />
                    </div>
                    <div>
                      <strong className="text-slate-900 block font-semibold">
                        Hoja de Vida Completa (PDF)
                      </strong>
                      <span className="text-[11px] text-slate-500">
                        Formato tradicional con referencias y datos personales
                      </span>
                    </div>
                  </div>
                  {candidate.resume_pdf_url ? (
                    <a
                      href={candidate.resume_pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-xs py-1.5 px-3 font-semibold"
                    >
                      <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
                      Ver PDF
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No adjuntado</span>
                  )}
                </div>

                {/* 2. Course Diploma */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-emerald-600">
                      <FileCheck className="w-5 h-5 text-emerald-600" strokeWidth={1.75} />
                    </div>
                    <div>
                      <strong className="text-slate-900 block font-semibold">
                        Certificado / Diploma de Curso de Vigilancia
                      </strong>
                      <span className="text-[11px] text-slate-500">
                        Expedido por Academia con aval MinDefensa
                      </span>
                    </div>
                  </div>
                  <span className="badge-emerald text-[11px] font-mono">
                    Registrado
                  </span>
                </div>

                {/* 3. Cédula */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                      <CreditCard className="w-5 h-5 text-slate-600" strokeWidth={1.75} />
                    </div>
                    <div>
                      <strong className="text-slate-900 block font-semibold">
                        Cédula de Ciudadanía (Cotejo de Identidad)
                      </strong>
                      <span className="text-[11px] text-slate-500">
                        Copia digital verificada
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Auditada
                  </span>
                </div>
              </div>
            </div>

            {/* Work History */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Historial de Experiencias Laborales
              </h4>

              <div className="space-y-2 text-xs">
                {candidate.work_history && candidate.work_history.length > 0 ? (
                  candidate.work_history.map((wh, i) => (
                    <div key={i} className="p-3 rounded-lg border border-slate-200 bg-white">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900 font-semibold">{wh.company}</strong>
                        <span className="text-[11px] text-slate-500 font-mono">{wh.dates}</span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{wh.role}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic py-2">
                    Sin registros adicionales de empresas anteriores.
                  </p>
                )}
              </div>
            </div>

            {/* Quick WhatsApp Contact Bar */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block">Celular del Guarda</span>
                <span className="text-xs font-bold text-slate-900 font-mono">
                  +57 {candidate.phone_whatsapp}
                </span>
              </div>
              <a
                href={`https://wa.me/57${candidate.phone_whatsapp.replace(/\D/g, "")}?text=Hola%20${encodeURIComponent(
                  candidate.full_name
                )},%20te%20escribimos%20de%20nuestra%20empresa%20de%20seguridad%20a%20través%20de%20FuerzaVerificada.`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-emerald text-xs py-2 px-3 font-semibold"
              >
                Abrir WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 sticky bottom-0 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary w-1/3 text-xs"
          >
            Cerrar Expediente
          </button>
          {onOpenStudyModal && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenStudyModal();
              }}
              className="btn-amber w-2/3 text-xs font-bold"
            >
              <Shield className="w-4 h-4" strokeWidth={2} />
              Solicitar Poligrafía & Visita
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
