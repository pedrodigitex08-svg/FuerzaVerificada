"use client";

import { useMemo } from "react";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  MessageCircle,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { CourseSemaphore } from "@/types/database";
import { generateAcademyRenewalLink } from "@/lib/utils/whatsappTemplates";

interface CourseSemaphoreBannerProps {
  completionDate?: string | null;
  expirationDate?: string | null;
  candidateName?: string;
  city?: string;
  courseName?: string;
  onRenewClick?: () => void;
  compact?: boolean;
}

export function CourseSemaphoreBanner({
  completionDate,
  expirationDate,
  candidateName = "Personal Operativo",
  city = "Bogotá D.C.",
  courseName = "Reentrenamiento en Vigilancia",
  compact = false,
}: CourseSemaphoreBannerProps) {
  const { semaphore, daysRemaining, formattedExpiration } = useMemo(() => {
    if (!expirationDate && !completionDate) {
      return {
        semaphore: "SIN_CURSO" as CourseSemaphore,
        daysRemaining: 0,
        formattedExpiration: "Sin fecha registrada",
      };
    }

    let expDateObj: Date;
    if (expirationDate) {
      expDateObj = new Date(expirationDate);
    } else {
      const compDateObj = new Date(completionDate!);
      expDateObj = new Date(compDateObj.getTime() + 365 * 24 * 60 * 60 * 1000);
    }

    const today = new Date();
    const diffTime = expDateObj.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let sem: CourseSemaphore = "SIN_CURSO";
    if (diffDays > 30) {
      sem = "VIGENTE";
    } else if (diffDays > 0) {
      sem = "PROXIMO_A_VENCER";
    } else {
      sem = "VENCIDO";
    }

    return {
      semaphore: sem,
      daysRemaining: diffDays,
      formattedExpiration: expDateObj.toLocaleDateString("es-CO", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    };
  }, [completionDate, expirationDate]);

  const renewalWhatsappLink = generateAcademyRenewalLink({
    academyPhone: "573158901234",
    academyName: "Academia Nacional de Seguridad (Aliada)",
    candidateName,
    city,
    courseName,
    referralCode: "FUERZA2026",
    discountText: "15% de descuento por convenio FuerzaVerificada",
  });

  if (semaphore === "VIGENTE") {
    return (
      <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#10B981]/30 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-[#10B981]/40 text-[#10B981] flex items-center justify-center shrink-0 shadow-sm">
            <CheckCircle className="w-5 h-5 text-[#10B981]" strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-white text-[#065F46] border border-[#10B981]/30 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                Credencial Vigente
              </span>
              <span className="text-xs font-bold text-[#065F46] tabular-nums font-mono">
                {daysRemaining} días restantes
              </span>
            </div>
            <p className="text-[11px] text-[#047857] mt-0.5 font-medium">
              Vence: <span className="font-bold">{formattedExpiration}</span> • Habilitado para contratación y porte
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (semaphore === "PROXIMO_A_VENCER") {
    return (
      <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 shadow-sm space-y-2.5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="badge-amber text-[10px] py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Próximo a Vencer
              </span>
              <span className="text-xs font-bold text-amber-900 tabular-nums font-mono">
                {daysRemaining} días restantes
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Las empresas solicitan credencial con al menos 30 días de margen antes de vencer.
            </p>
          </div>
        </div>

        <div>
          <a
            href={renewalWhatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#0F172A] hover:bg-[#1E3A8A] text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.5} />
            <span>Renovar con 15% Descuento (Academia Aliada)</span>
          </a>
        </div>
      </div>
    );
  }

  // VENCIDO / SIN_CURSO
  return (
    <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 shadow-sm space-y-2.5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-rose-100 border border-rose-300 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
          <XCircle className="w-4 h-4" strokeWidth={1.5} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="badge-rose text-[10px] py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
              Curso Vencido / Sin Soporte
            </span>
            <span className="text-xs font-bold text-rose-900 tabular-nums font-mono">
              0 días activos
            </span>
          </div>
          <p className="text-[11px] text-[#64748B] mt-0.5">
            Por normatividad de SuperVigilancia no es posible postularte a vacantes armadas.
          </p>
        </div>
      </div>

      <div>
        <a
          href={renewalWhatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
        >
          <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>Cotizar Curso Urgente con Academia Aliada</span>
        </a>
      </div>
    </div>
  );
}
