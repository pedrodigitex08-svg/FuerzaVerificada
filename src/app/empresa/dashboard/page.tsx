"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Briefcase,
  Users,
  Shield,
  Zap,
  ArrowRight,
  PlusCircle,
  FileCheck,
  CheckCircle2,
  Clock,
  MapPin,
  ChevronRight,
  ExternalLink,
  Search,
} from "lucide-react";
import { JobPost, ApplicationStatus, SecurityStudyStatus } from "@/types/database";

export default function EmpresaDashboardPage() {
  const [credits, setCredits] = useState(5);
  const [isVerifiedCompany, setIsVerifiedCompany] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCredits = localStorage.getItem("fv_company_credits");
      if (savedCredits !== null) setCredits(parseInt(savedCredits, 10));

      const savedVerified = localStorage.getItem("fv_company_verified");
      if (savedVerified !== null) {
        setIsVerifiedCompany(savedVerified === "true");
      }
    }
  }, []);

  const demoVacancies = [
    {
      id: "job-1",
      title: "Vigilante Fijo - Centro Empresarial Calle 100",
      role_required: "Vigilante Fijo",
      shift: "2x2x2",
      salary: 1950000,
      zone: "Chicó / Calle 100",
      applicants_count: 8,
      avg_match: 92,
      is_urgent: true,
      created_at: "Hace 2 días",
    },
    {
      id: "job-2",
      title: "Supervisor Motorizado - Zona Industrial",
      role_required: "Supervisor Motorizado",
      shift: "4x2",
      salary: 2450000,
      zone: "Fontibón",
      applicants_count: 5,
      avg_match: 88,
      is_urgent: false,
      created_at: "Hace 4 días",
    },
    {
      id: "job-3",
      title: "Escolta VIP para Esquema Ejecutivo",
      role_required: "Escolta VIP",
      shift: "6x1",
      salary: 3200000,
      zone: "Usaquén",
      applicants_count: 6,
      avg_match: 86,
      is_urgent: true,
      created_at: "Hace 6 días",
    },
  ];

  const demoRecentStudies = [
    {
      id: "order-1",
      candidate_name: "Carlos Eduardo Moreno R.",
      national_id: "1020304050",
      job_title: "Vigilante Fijo - Calle 100",
      status: "aprobado" as SecurityStudyStatus,
      concept: "Aprobado sin riesgo para servicio armado",
      report_url: "https://demo.fuerzaverificada.com/informe-carlos.pdf",
      date: "22 Oct 2026",
    },
    {
      id: "order-2",
      candidate_name: "Mauricio Restrepo Valencia",
      national_id: "80123992",
      job_title: "Supervisor Motorizado",
      status: "en_proceso" as SecurityStudyStatus,
      concept: "Poligrafía completada, visita programada hoy 3:00 PM",
      report_url: null,
      date: "23 Oct 2026",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Resumen de Operaciones y Selección
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            Panel de control B2B: vacantes activas, aspirantes evaluados y órdenes de confiabilidad.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/empresa/relevos"
            className="btn-secondary text-xs py-2 px-3.5 font-semibold"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" strokeWidth={2} />
            Radar de Relevos Hoy
          </Link>
          <Link
            href="/empresa/vacantes/nueva"
            className="btn-primary text-xs py-2 px-3.5 font-semibold"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-400" strokeWidth={2} />
            Nueva Vacante
          </Link>
        </div>
      </div>

      {/* BANNER INFORMATIVO SI LA EMPRESA NO ESTÁ VERIFICADA */}
      {!isVerifiedCompany && (
        <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
              <Shield className="w-4 h-4 text-amber-700" strokeWidth={1.5} />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                  Cuenta en proceso de verificación por FuerzaVerificada
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-200/80 text-amber-900 font-mono">
                  VALIDACIÓN NIT
                </span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed font-normal">
                Puedes configurar tus vacantes o solicitar tu paquete de Poligrafía/Visita, y tus ofertas serán visibles al público apenas validemos tu NIT con la Superintendencia de Vigilancia.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsVerifiedCompany(true);
              if (typeof window !== "undefined") {
                localStorage.setItem("fv_company_verified", "true");
              }
            }}
            className="btn-secondary text-[11px] py-1.5 px-3 shrink-0 font-bold text-amber-900 border-amber-300 hover:bg-amber-100"
            title="Simular validación exitosa de NIT para pruebas"
          >
            Validar NIT (Demo)
          </button>
        </div>
      )}

      {/* 1. BENTO GRID: 4 OPERATIONAL KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Vacantes Activas */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Vacantes Activas
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <Briefcase className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              3
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              2 con relevo de urgencia activo
            </span>
          </div>
        </div>

        {/* KPI 2: Candidatos Postulados */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Aspirantes en ATS
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Users className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              19
            </div>
            <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">
              Promedio de compatibilidad: 89% Match
            </span>
          </div>
        </div>

        {/* KPI 3: Estudios & Polígrafos */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Estudios & Polígrafo
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Shield className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {credits}{" "}
              <span className="text-xs font-normal text-slate-400">créditos</span>
            </div>
            <span className="text-[11px] text-amber-700 font-medium mt-0.5 block">
              1 orden activa en laboratorio hoy
            </span>
          </div>
        </div>

        {/* KPI 4: Guardas Disponibles Relevo */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Disponibles para Relevo
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Zap className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              42
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Con curso vigente en Bogotá hoy
            </span>
          </div>
        </div>
      </div>

      {/* 2. RECENT VACANCIES TABLE */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Vacantes Publicadas & Filtro de Postulados
            </h3>
            <p className="text-xs text-slate-500 font-normal">
              Acceda a la bandeja de postulados ordenados por compatibilidad (% Match).
            </p>
          </div>
          <Link
            href="/empresa/vacantes"
            className="text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1"
          >
            Ver todas las vacantes
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="pb-3 font-semibold">Puesto / Vacante</th>
                <th className="pb-3 font-semibold">Turno</th>
                <th className="pb-3 font-semibold">Salario Base</th>
                <th className="pb-3 font-semibold">Postulados</th>
                <th className="pb-3 font-semibold">Promedio Match</th>
                <th className="pb-3 text-right font-semibold">Gestión ATS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {demoVacancies.map((vac) => (
                <tr key={vac.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 pr-4">
                    <div className="font-semibold text-slate-900">{vac.title}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {vac.zone} • {vac.created_at}
                    </div>
                  </td>
                  <td className="py-3.5 text-slate-700 font-mono font-medium">
                    {vac.shift}
                  </td>
                  <td className="py-3.5 text-slate-900 font-mono font-bold tabular-nums">
                    ${vac.salary.toLocaleString("es-CO")} COP
                  </td>
                  <td className="py-3.5">
                    <span className="text-xs font-semibold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">
                      {vac.applicants_count} guardas
                    </span>
                  </td>
                  <td className="py-3.5">
                    <span className="badge-emerald text-[11px] font-mono tabular-nums">
                      {vac.avg_match}% Match
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    <Link
                      href={`/empresa/vacantes/${vac.id}`}
                      className="btn-primary text-xs py-1.5 px-3 font-semibold inline-flex"
                    >
                      Ver ATS ({vac.applicants_count})
                      <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. RECENT SECURITY STUDY ORDERS WIDGET */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Últimas Evaluaciones de Confiabilidad & Poligrafía
            </h3>
            <p className="text-xs text-slate-500 font-normal">
              Dictámenes de antecedentes, visitas domiciliarias y pruebas de polígrafo.
            </p>
          </div>
          <Link
            href="/empresa/estudios"
            className="text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1"
          >
            Ver historial completo
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="space-y-3">
          {demoRecentStudies.map((study) => (
            <div
              key={study.id}
              className="p-4 rounded-xl border border-slate-200/80 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <strong className="text-slate-900 font-bold text-sm">
                    {study.candidate_name}
                  </strong>
                  <span className="text-slate-400">C.C. {study.national_id}</span>
                  <span
                    className={`badge-${
                      study.status === "aprobado" ? "emerald" : "amber"
                    } text-[10px] py-0.5`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        study.status === "aprobado" ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                    />
                    {study.status === "aprobado" ? "Aprobado Sin Riesgo" : "En Proceso"}
                  </span>
                </div>
                <p className="text-slate-600 text-xs">{study.concept}</p>
                <div className="text-[11px] text-slate-400">
                  Vacante: {study.job_title} • Radicado el {study.date}
                </div>
              </div>

              <div>
                {study.report_url ? (
                  <a
                    href={study.report_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-xs py-1.5 px-3 font-semibold text-amber-800 hover:text-amber-900"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.75} />
                    Descargar Dictamen Confidencial (PDF)
                  </a>
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    Informe disponible en 24h
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
