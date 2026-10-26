"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Briefcase,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
  MessageCircle,
  AlertCircle,
  FileCheck,
  Check,
  Building2,
  Eye,
  CheckCircle,
} from "lucide-react";
import { ApplicationStatus } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

interface SavedApp {
  id: string;
  job_id: string;
  job_title: string;
  company_name: string;
  shift: string;
  salary_monthly: number;
  interview_address?: string;
  match_score: number;
  status: ApplicationStatus | string;
  created_at: string;
}

// 4 ETAPAS ESTILO COMPUTRABAJO
const STAGES = [
  {
    stage: 1,
    title: "Postulado",
    subtitle: "CV enviado a la empresa",
    desc: "Tu hoja de vida fue enviada exitosamente y está en cola de revisión por el equipo de recursos humanos.",
  },
  {
    stage: 2,
    title: "CV Visto por la empresa",
    subtitle: "Perfil consultado",
    desc: "El reclutador ha abierto y evaluado tu perfil operativo y soportes de SuperVigilancia.",
  },
  {
    stage: 3,
    title: "En proceso / Pruebas",
    subtitle: "Entrevista o estudio",
    desc: "Fuiste seleccionado para pruebas técnicas, citación presencial o estudio de seguridad / poligrafía.",
  },
  {
    stage: 4,
    title: "Finalista / Contratado",
    subtitle: "Vinculación laboral",
    desc: "¡Proceso culminado exitosamente! Asignación de puesto formalizada con todas las prestaciones de ley.",
  },
];

function getStageInfo(status: string) {
  const st = (status || "").toLowerCase().trim();
  const isRejected = ["descartado", "rejected", "finalizado"].includes(st);

  let currentStageIndex = 0; // 0 = Postulado, 1 = CV Visto, 2 = En proceso / Pruebas, 3 = Finalista / Contratado

  if (isRejected) {
    currentStageIndex = 3;
  } else if (["contratado", "hired", "accepted"].includes(st)) {
    currentStageIndex = 3;
  } else if (
    [
      "citado_entrevista",
      "en_estudio_seguridad",
      "interview",
      "in_process",
      "pruebas",
      "estudio",
    ].includes(st)
  ) {
    currentStageIndex = 2;
  } else if (
    ["preseleccionado", "viewed", "reviewing", "en_revision", "leido"].includes(st)
  ) {
    currentStageIndex = 1;
  } else {
    currentStageIndex = 0;
  }

  return {
    currentStageIndex,
    isRejected,
  };
}

function formatRelativeDate(isoDate?: string): string {
  if (!isoDate) return "Recientemente";
  const date = new Date(isoDate);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Postulado hoy";
  if (diffDays === 1) return "Postulado ayer";
  if (diffDays < 7) return `Postulado hace ${diffDays} días`;
  if (diffDays < 30) return `Postulado hace ${Math.floor(diffDays / 7)} sem`;
  return `Postulado el ${date.toLocaleDateString("es-CO", { day: "numeric", month: "short" })}`;
}

export default function PostulacionesPage() {
  const [applications, setApplications] = useState<SavedApp[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadApplications() {
      setIsLoading(true);
      const supabase = createClient();

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          let { data, error } = await supabase
            .from("applications")
            .select("*, job_posts(*, companies(*))")
            .eq("candidate_id", user.id)
            .order("created_at", { ascending: false });

          if (error || !data || data.length === 0) {
            const fallback = await supabase
              .from("applications")
              .select("*, jobs(*, companies(*))")
              .eq("candidate_id", user.id)
              .order("created_at", { ascending: false });
            if (!fallback.error && fallback.data && fallback.data.length > 0) {
              data = fallback.data;
              error = null;
            }
          }

          if (!error && data && data.length > 0) {
            setApplications(
              data.map((app: any) => {
                const jobObj = app.job_posts || app.jobs;
                return {
                  id: app.id,
                  job_id: app.job_id,
                  job_title: jobObj?.title || "Vacante de Seguridad",
                  company_name:
                    jobObj?.companies?.company_name ||
                    jobObj?.companies?.commercial_name ||
                    "Empresa de Seguridad",
                  shift: jobObj?.shift || "Turno rotativo",
                  salary_monthly: Number(jobObj?.salary_monthly) || 0,
                  interview_address:
                    jobObj?.zone_neighborhood || jobObj?.city || "Oficina principal",
                  match_score: app.match_score ?? app.compatibility_score ?? 90,
                  status: app.status as ApplicationStatus,
                  created_at: app.created_at,
                };
              })
            );
            setIsLoading(false);
            return;
          }
        }

        setApplications([]);
      } catch (err) {
        console.error("Error loading candidate applications:", err);
        setApplications([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadApplications();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
            Seguimiento de Mis Postulaciones
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            Rastreador en tiempo real del estado de tus procesos de selección con empresas de vigilancia y seguridad privada.
          </p>
        </div>

        <Link href="/guarda/vacantes" className="btn-secondary text-xs h-9 px-3.5 inline-flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
          <span>Explorar Más Vacantes</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="p-12 text-center bg-white border border-slate-200/90 rounded-lg space-y-3 shadow-subtle">
          <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Cargando tus postulaciones registradas...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200/90 rounded-lg space-y-3 shadow-subtle">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto" strokeWidth={1.5} />
          <h4 className="text-sm font-semibold text-slate-900 tracking-tight">
            Aún no tienes postulaciones activas
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Explora las vacantes de seguridad disponibles en Bogotá y a nivel nacional con salario certificado y turno garantizado.
          </p>
          <Link href="/guarda/vacantes" className="btn-emerald inline-flex text-xs h-9 px-4 font-medium">
            Ver Vacantes Disponibles
            <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const { currentStageIndex, isRejected } = getStageInfo(app.status);

            return (
              <div
                key={app.id}
                className="bg-white border border-slate-200/90 rounded-lg p-5 space-y-5 shadow-subtle hover:border-slate-300 transition-colors"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
                        {app.company_name}
                      </span>
                      <span className="badge-emerald text-[10px] py-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Empresa Verificada
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        • {formatRelativeDate(app.created_at)}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 tracking-tight mt-1">
                      {app.job_title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                        Salario mensual
                      </span>
                      <span className="text-sm font-semibold font-mono text-slate-900 tabular-nums">
                        ${app.salary_monthly ? app.salary_monthly.toLocaleString("es-CO") : "0"} COP
                      </span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-slate-900 bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-md tabular-nums">
                      {app.match_score}% Match
                    </span>
                  </div>
                </div>

                {/* CITACIÓN PRESENCIAL CALLOUT */}
                {app.status === "citado_entrevista" && (
                  <div className="p-4 rounded-lg bg-amber-50/70 border border-amber-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
                        <Calendar className="w-4 h-4 text-amber-700" strokeWidth={1.75} />
                        <span>Citación a Entrevista Presencial Programada</span>
                      </div>
                      <span className="text-[11px] font-medium text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                        Acción Requerida
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" strokeWidth={1.75} />
                      <span>{app.interview_address || "Sede principal de la empresa"}</span>
                    </div>

                    <p className="text-[11px] text-slate-600">
                      Documentos obligatorios para la entrevista: Cédula original, Hoja de vida minerva o impresa y Certificado del Curso de Vigilancia vigente.
                    </p>

                    <div className="pt-1">
                      <a
                        href={`https://wa.me/573104508920?text=Hola,%20confirmo%20mi%20asistencia%20a%20la%20entrevista%20para%20la%20vacante%20de%20${encodeURIComponent(
                          app.job_title
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-emerald inline-flex text-xs h-9 px-3.5 font-medium"
                      >
                        <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.75} />
                        Confirmar Asistencia vía WhatsApp
                      </a>
                    </div>
                  </div>
                )}

                {/* AVISO ESTUDIO DE SEGURIDAD EN CURSO */}
                {app.status === "en_estudio_seguridad" && (
                  <div className="p-4 rounded-lg bg-slate-900 text-white space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                        <Shield className="w-4 h-4" strokeWidth={1.75} />
                        <span>Estudio de Seguridad y Poligrafía en Proceso</span>
                      </div>
                      <span className="badge-amber text-[10px] py-0.5">
                        En curso
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-normal">
                      La empresa ha ordenado la verificación de antecedentes, visita domiciliaria y prueba de poligrafía preempleo a través del protocolo certificado de FuerzaVerificada.
                    </p>
                  </div>
                )}

                {/* RASTREADOR VISUAL EN 4 ETAPAS (Estilo Computrabajo) */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Progreso de la Postulación ({currentStageIndex + 1} de 4)
                    </span>
                    {isRejected ? (
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md">
                        Proceso Finalizado
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {STAGES[currentStageIndex].title}
                      </span>
                    )}
                  </div>

                  {/* Connected visual stepper with horizontal bar */}
                  <div className="relative">
                    {/* Track line (hidden on mobile, visible from sm) */}
                    <div className="hidden sm:block absolute top-4 left-8 right-8 h-0.5 bg-slate-200 -z-0" />
                    {/* Active line */}
                    <div
                      className={`hidden sm:block absolute top-4 left-8 h-0.5 transition-all duration-500 -z-0 ${
                        isRejected ? "bg-slate-400" : "bg-emerald-600"
                      }`}
                      style={{
                        width: `${(currentStageIndex / 3) * 100}%`,
                        maxWidth: "calc(100% - 4rem)",
                      }}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 relative z-10">
                      {STAGES.map((st, idx) => {
                        const isPast = idx < currentStageIndex;
                        const isCurrent = idx === currentStageIndex;

                        let circleStyle = "bg-white border-2 border-slate-300 text-slate-400";
                        let cardStyle = "bg-slate-50/70 border-slate-200/80 text-slate-500";

                        if (isCurrent) {
                          if (isRejected && idx === 3) {
                            circleStyle = "bg-slate-700 border-2 border-slate-700 text-white shadow-xs";
                            cardStyle = "bg-slate-100 border-slate-300 text-slate-800 shadow-xs";
                          } else {
                            circleStyle = "bg-slate-900 border-2 border-slate-900 text-white shadow-xs ring-4 ring-slate-100";
                            cardStyle = "bg-slate-900 text-white border-slate-900 shadow-xs";
                          }
                        } else if (isPast) {
                          circleStyle = "bg-emerald-600 border-2 border-emerald-600 text-white";
                          cardStyle = "bg-emerald-50/70 border-emerald-200 text-emerald-950";
                        }

                        const stageTitle = idx === 3 && isRejected ? "Proceso Finalizado" : st.title;
                        const stageSub = idx === 3 && isRejected ? "Perfil en base de datos" : st.subtitle;

                        return (
                          <div
                            key={st.stage}
                            className={`p-3 rounded-lg border transition-all ${cardStyle}`}
                          >
                            <div className="flex items-center gap-2 mb-1.5">
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${circleStyle}`}
                              >
                                {isPast ? (
                                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                ) : (
                                  <span>{st.stage}</span>
                                )}
                              </div>
                              {isCurrent && !isRejected && (
                                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                              )}
                            </div>

                            <div className="font-semibold text-xs leading-snug">
                              {stageTitle}
                            </div>
                            <div
                              className={`text-[11px] leading-tight mt-0.5 ${
                                isCurrent && !isRejected ? "text-slate-300" : "text-slate-500"
                              }`}
                            >
                              {stageSub}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Stage Explanatory Box */}
                  <div
                    className={`mt-3 p-3 rounded-md text-xs border ${
                      isRejected
                        ? "bg-slate-50 border-slate-200/80 text-slate-600"
                        : currentStageIndex === 3
                        ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                        : "bg-slate-50 border-slate-200/80 text-slate-700"
                    }`}
                  >
                    <span className="font-semibold text-slate-900 block mb-0.5">
                      {isRejected
                        ? "Nota sobre este proceso:"
                        : `Estado actual: ${STAGES[currentStageIndex].title}`}
                    </span>
                    <p className="leading-relaxed">
                      {isRejected
                        ? "La vacante ha sido cubierta o el proceso se encuentra cerrado. Tu perfil operativo y soportes siguen activos en FuerzaVerificada para postularte a nuevas ofertas."
                        : STAGES[currentStageIndex].desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BANNER ACADEMIAS ALIADAS */}
      <div className="p-4 rounded-lg bg-white border border-slate-200/90 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-amber-50 border border-amber-200/80 text-amber-700 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-900 tracking-tight">
              ¿Tu curso de SuperVigilancia está próximo a vencer?
            </h4>
            <p className="text-[11px] text-slate-500">
              Consulta nuestra Red de Academias Aliadas con hasta 15% de descuento por convenio institucional.
            </p>
          </div>
        </div>
        <Link
          href="/guarda/documentos#academias"
          className="btn-secondary text-xs h-9 px-3.5 font-medium text-slate-700 hover:text-slate-900 shrink-0 self-start sm:self-auto"
        >
          <span>Ver Academias Aliadas</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
