"use client";

import { useState } from "react";
import {
  Shield,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck,
  Building2,
  Lock,
  ArrowRight,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import { generatePackageRechargeLink } from "@/lib/utils/whatsappTemplates";

interface OrderSecurityStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  candidateNationalId: string;
  candidateRole: string;
  availableCredits: number;
  onConfirmOrder: () => Promise<void>;
}

export function OrderSecurityStudyModal({
  isOpen,
  onClose,
  candidateName,
  candidateNationalId,
  candidateRole,
  availableCredits,
  onConfirmOrder,
}: OrderSecurityStudyModalProps) {
  const [loading, setLoading] = useState(false);
  const [includePolygraph, setIncludePolygraph] = useState(true);
  const [includeHomeVisit, setIncludeHomeVisit] = useState(true);
  const [includeBackground, setIncludeBackground] = useState(true);
  const [confirmedSuccess, setConfirmedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (availableCredits <= 0) return;
    setLoading(true);
    try {
      await onConfirmOrder();
      setConfirmedSuccess(true);
      setTimeout(() => {
        setConfirmedSuccess(false);
        onClose();
      }, 1600);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200/90 rounded-lg w-full max-w-lg shadow-[0_10px_25px_-5px_rgba(15,23,42,0.1)] p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200/90 text-slate-900 flex items-center justify-center">
              <Shield className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-slate-900">
                Solicitud de Estudio de Seguridad & Poligrafía
              </h3>
              <p className="text-[11px] text-slate-500">
                Activación en 1 Clic con Créditos Corporativos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Candidate Summary Card */}
        <div className="p-3.5 rounded-md bg-slate-50/80 border border-slate-200/90 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">
              Candidato a Evaluar
            </span>
            <strong className="text-slate-900 text-sm font-semibold block mt-0.5">
              {candidateName}
            </strong>
            <span className="text-slate-500 font-mono text-[11px] tabular-nums">
              C.C. {candidateNationalId} • {candidateRole}
            </span>
          </div>
          <div className="text-right">
            <span className="badge-emerald text-[10px] py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Preseleccionado
            </span>
          </div>
        </div>

        {/* Included Services Checklist */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
            Servicios Incluidos en Esta Orden (1 Crédito):
          </span>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-md border border-slate-200/90 bg-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-4 h-4 text-emerald-600" strokeWidth={1.75} />
                <div>
                  <span className="font-semibold text-slate-900 block">
                    1. Estudio de Antecedentes & Credencial
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Cotejo en Fiscalía, Policía, OFAC y autenticidad SuperVigilancia
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-200/60">
                Incluido
              </span>
            </div>

            <div className="p-3 rounded-md border border-slate-200/90 bg-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-emerald-600" strokeWidth={1.75} />
                <div>
                  <span className="font-semibold text-slate-900 block">
                    2. Visita Domiciliaria con Registro Fotográfico
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Verificación vecinal, familiar y concepto de riesgo en vivienda
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-200/60">
                Incluido
              </span>
            </div>

            <div className="p-3 rounded-md border border-slate-200/90 bg-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-emerald-600" strokeWidth={1.75} />
                <div>
                  <span className="font-semibold text-slate-900 block">
                    3. Examen de Poligrafía Preempleo (Cámara Silente)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Vínculos delictivos, hurtos y veracidad de antecedentes (Norma APA)
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-200/60">
                Incluido
              </span>
            </div>
          </div>
        </div>

        {/* Credits Balance Indicator */}
        <div className="p-3 rounded-md bg-slate-900 text-white flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
              Balance de Créditos
            </span>
            <span className="text-slate-300">
              Disponibles: <strong className="text-emerald-400 font-mono text-sm tabular-nums">{availableCredits}</strong>
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Costo de la Orden</span>
            <span className="font-semibold font-mono text-emerald-400 text-sm tabular-nums">
              -1 Crédito
            </span>
          </div>
        </div>

        {/* Warning if 0 credits */}
        {availableCredits <= 0 && (
          <div className="p-3.5 rounded-md bg-rose-50/80 border border-rose-200/80 text-xs text-rose-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" strokeWidth={1.75} />
            <div className="space-y-2">
              <p>
                <strong>Sin créditos disponibles.</strong> Adquiera o recargue su paquete corporativo para solicitar este estudio de seguridad.
              </p>
              <a
                href={generatePackageRechargeLink({
                  companyName: "Empresa con Créditos Agotados",
                  packageType: "Recarga de Paquete B2B desde ATS",
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-all shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.75} />
                <span>Recargar Paquete por WhatsApp</span>
              </a>
            </div>
          </div>
        )}

        {/* Success confirmation */}
        {confirmedSuccess && (
          <div className="p-3.5 rounded-md bg-emerald-600 text-white text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
            <span>¡Orden radicada con éxito! Estado cambiado a &quot;En Estudio de Seguridad&quot;.</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="btn-secondary w-1/3 text-xs h-10"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={loading || availableCredits <= 0 || confirmedSuccess}
            onClick={handleConfirm}
            className="w-2/3 h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-md px-4 text-xs font-medium transition-all shadow-[0_1px_2px_rgba(15,23,42,0.08)] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              "Radicando orden..."
            ) : confirmedSuccess ? (
              "Completado"
            ) : (
              <>
                Confirmar y Descontar 1 Crédito
                <ArrowRight className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
