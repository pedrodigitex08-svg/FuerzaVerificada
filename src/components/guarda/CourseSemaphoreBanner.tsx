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
      <div className="p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-200/70 shadow-subtle flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-white border border-emerald-200/80 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle className="w-4 h-4 text-emerald-600" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-white text-emerald-800 border border-emerald-200/70 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Credencial Vigente
              </span>
              <span className="text-xs font-semibold text-emerald-800 tabular-nums font-mono">
                {daysRemaining} días restantes
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 mt-0.5 font-normal">
              Vence: <span className="font-semibold tabular-nums">{formattedExpiration}</span> • Habilitado para contratación y porte
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (semaphore === "PROXIMO_A_VENCER") {
    return (
      <div className="p-3.5 rounded-lg bg-amber-50/60 border border-amber-200/80 shadow-subtle space-y-2.5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-md bg-amber-100/80 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="badge-amber text-[10px] py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Próximo a Vencer
              </span>
              <span className="text-xs font-semibold text-amber-900 tabular-nums font-mono">
                {daysRemaining} días restantes
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Las empresas solicitan credencial con al menos 30 días de margen antes de vencer.
            </p>
          </div>
        </div>

        <div>
          <a
            href={renewalWhatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-9 bg-slate-900 hover:bg-slate-800 text-white font-medium px-3 rounded-md text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.75} />
            <span>Renovar con 15% Descuento (Academia Aliada)</span>
          </a>
        </div>
      </div>
    );
  }

  // VENCIDO / SIN_CURSO
  return (
    <div className="p-3.5 rounded-lg bg-rose-50/70 border border-rose-200/80 shadow-subtle space-y-2.5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-md bg-rose-100/80 border border-rose-200 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
          <XCircle className="w-4 h-4" strokeWidth={1.75} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="badge-rose text-[10px] py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
              Curso Vencido / Sin Soporte
            </span>
            <span className="text-xs font-semibold text-rose-900 tabular-nums font-mono">
              0 días activos
            </span>
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5">
            Por normatividad de SuperVigilancia no es posible postularte a vacantes armadas.
          </p>
        </div>
      </div>

      <div>
        <a
          href={renewalWhatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-9 bg-rose-600 hover:bg-rose-700 text-white font-medium px-3 rounded-md text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
        >
          <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>Cotizar Curso Urgente con Academia Aliada</span>
        </a>
      </div>
    </div>
  );
}
