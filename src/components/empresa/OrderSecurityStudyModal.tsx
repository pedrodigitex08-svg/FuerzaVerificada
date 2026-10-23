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
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-elevated p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
              <Shield className="w-5 h-5 fill-amber-500/10" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
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
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Candidate Summary Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
              Candidato a Evaluar
            </span>
            <strong className="text-slate-900 text-sm font-bold block mt-0.5">
              {candidateName}
            </strong>
            <span className="text-slate-500 text-[11px]">
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
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
            Servicios Incluidos en Esta Orden (1 Crédito):
          </span>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
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
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Incluido
              </span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
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
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Incluido
              </span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
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
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Incluido
              </span>
            </div>
          </div>
        </div>

        {/* Credits Balance Indicator */}
        <div className="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
              Balance de Créditos
            </span>
            <span className="text-slate-300">
              Disponibles: <strong className="text-amber-400 font-mono text-sm tabular-nums">{availableCredits}</strong>
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Costo de la Orden</span>
            <span className="font-bold font-mono text-emerald-400 text-sm">
              -1 Crédito
            </span>
          </div>
        </div>

        {/* Warning if 0 credits */}
        {availableCredits <= 0 && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F172A] hover:bg-[#1E3A8A] text-white text-xs font-bold transition-all shadow-sm"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#10B981]" strokeWidth={1.75} />
                <span>Recargar Paquete por WhatsApp</span>
              </a>
            </div>
          </div>
        )}

        {/* Success confirmation */}
        {confirmedSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-2">
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
            className="btn-secondary w-1/3 text-xs"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={loading || availableCredits <= 0 || confirmedSuccess}
            onClick={handleConfirm}
            className="w-2/3 bg-[#0F172A] hover:bg-[#1E3A8A] text-white rounded-xl py-2.5 px-4 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
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
