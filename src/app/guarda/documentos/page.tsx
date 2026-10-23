"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileCheck,
  Shield,
  CreditCard,
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  MessageCircle,
  ExternalLink,
  Check,
  BadgeCheck,
} from "lucide-react";
import { CourseSemaphoreBanner } from "@/components/guarda/CourseSemaphoreBanner";
import { generateAcademyRenewalLink } from "@/lib/utils/whatsappTemplates";

export default function DocumentosPage() {
  const [courseCompletionDate, setCourseCompletionDate] = useState("2026-04-15");
  const [credencialSupervigilancia, setCredencialSupervigilancia] = useState("SV-89421");

  const renewalLink = generateAcademyRenewalLink({
    academyPhone: "573158901234",
    academyName: "Academia Nacional de Seguridad",
    candidateName: "Carlos Eduardo Moreno",
    city: "Bogotá D.C.",
    referralCode: "FUERZA2026",
    discountText: "15% Descuento Convenio FuerzaVerificada",
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Credencial SuperVigilancia & Bóveda Documental
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            Verificación institucional de vigencia del curso y repositorio de soportes para contratación.
          </p>
        </div>

        <Link href="/guarda/onboarding" className="btn-secondary text-xs">
          <Upload className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
          Actualizar Documentos
        </Link>
      </div>

      {/* SEMÁFORO DEL CURSO BANNER */}
      <CourseSemaphoreBanner
        completionDate={courseCompletionDate}
        candidateName="Carlos Eduardo Moreno"
        courseName="Reentrenamiento en Vigilancia"
      />

      {/* CREDENCIAL CORPORATE CARD */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-subtle space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
              <Shield className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Credencial de Identificación SuperVigilancia
              </h3>
              <p className="text-xs text-slate-500">
                Superintendencia de Vigilancia y Seguridad Privada • Ministerio de Defensa
              </p>
            </div>
          </div>
          <span className="badge-emerald text-[11px] py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Estado: Habilitado
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
              Número de Credencial
            </span>
            <span className="font-bold text-slate-900 font-mono text-sm tabular-nums mt-0.5 block">
              {credencialSupervigilancia}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
              Fecha de Realización
            </span>
            <span className="font-bold text-slate-900 font-mono text-sm tabular-nums mt-0.5 block">
              {courseCompletionDate}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
              Academia Emisora
            </span>
            <span className="font-semibold text-slate-800 text-xs mt-0.5 block truncate">
              Academia Nacional de Seguridad
            </span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            ¿Desea adelantar su renovación antes del vencimiento?
          </span>
          <a
            href={renewalLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-xs py-2 px-3.5 font-semibold text-amber-700 hover:text-amber-800"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.75} />
            Consultar Convenio con Academia Aliada (15% OFF)
          </a>
        </div>
      </div>

      {/* REPOSITORIO DE DOCUMENTOS */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-subtle space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Documentos Operativos Almacenados
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Doc 1 */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50 flex flex-col justify-between space-y-3">
            <div className="flex items-start justify-between">
              <FileText className="w-6 h-6 text-slate-700" strokeWidth={1.5} />
              <span className="badge-emerald text-[10px]">Cargado</span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Hoja de Vida en PDF</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Formato tradicional descargable</p>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">HV_CarlosMoreno.pdf</span>
          </div>

          {/* Doc 2 */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50 flex flex-col justify-between space-y-3">
            <div className="flex items-start justify-between">
              <FileCheck className="w-6 h-6 text-emerald-600" strokeWidth={1.5} />
              <span className="badge-emerald text-[10px]">Cargado</span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Diploma del Curso</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Certificado de Reentrenamiento</p>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Diploma_Vigilancia.pdf</span>
          </div>

          {/* Doc 3 */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50 flex flex-col justify-between space-y-3">
            <div className="flex items-start justify-between">
              <CreditCard className="w-6 h-6 text-slate-700" strokeWidth={1.5} />
              <span className="badge-emerald text-[10px]">Cargado</span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Cédula de Ciudadanía</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Documento de identidad nacional</p>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Cedula_1020304050.jpg</span>
          </div>
        </div>
      </div>
    </div>
  );
}
