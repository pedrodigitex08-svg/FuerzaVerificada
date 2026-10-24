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
  Sparkles,
  ArrowRight,
  MessageCircle,
  AlertCircle,
  FileCheck,
  Check,
  Building2,
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
  status: ApplicationStatus;
  created_at: string;
}

const STATUS_STEPS: { key: ApplicationStatus; label: string; description: string }[] = [
  {
    key: "postulado",
    label: "Postulado",
    description: "Hoja de vida enviada y en cola de revisión por el reclutador.",
  },
  {
    key: "preseleccionado",
    label: "Preseleccionado",
    description: "El reclutador evaluó su perfil y cumple con los requerimientos.",
  },
  {
    key: "citado_entrevista",
    label: "Citado a Entrevista",
    description: "Programado para evaluación presencial y verificación documental.",
  },
  {
    key: "en_estudio_seguridad",
    label: "En Estudio & Polígrafo",
    description: "En verificación de antecedentes, visita domiciliaria y prueba poligráfica.",
  },
  {
    key: "contratado",
    label: "Contratado",
    description: "Proceso completado. Asignación de puesto formalizada.",
  },
];

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

        // Local storage fallback for client test sessions
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("fv_applications_list");
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setApplications(parsed);
                setIsLoading(false);
                return;
              }
            } catch {}
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

  const getStatusIndex = (st: ApplicationStatus) => {
    return STATUS_STEPS.findIndex((s) => s.key === st);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Seguimiento de Mis Postulaciones
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            Monitoreo en tiempo real del estado de sus procesos de selección con empresas de vigilancia.
          </p>
        </div>

        <Link href="/guarda/vacantes" className="btn-secondary text-xs">
          <Briefcase className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
          Explorar Más Vacantes
        </Link>
      </div>

      {applications.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-3 shadow-subtle">
          <Briefcase className="w-10 h-10 text-slate-400 mx-auto" strokeWidth={1.5} />
          <h4 className="text-sm font-bold text-slate-900">Aún no tiene postulaciones activas</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Explore las vacantes disponibles con salario certificado y turno garantizado.
          </p>
          <Link href="/guarda/vacantes" className="btn-emerald inline-flex text-xs py-2.5 px-4 font-semibold">
            Ver Vacantes Ahora
            <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const currentStepIdx = getStatusIndex(app.status);

            return (
              <div
                key={app.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-5 shadow-subtle hover:border-slate-300 transition-all"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500">{app.company_name}</span>
                      <span className="badge-emerald text-[10px] py-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Empresa Verificada
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">
                      {app.job_title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                        Salario mensual
                      </span>
                      <span className="text-sm font-bold font-mono text-slate-900 tabular-nums">
                        ${app.salary_monthly ? app.salary_monthly.toLocaleString("es-CO") : "0"} COP
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg tabular-nums">
                      {app.match_score}% Match
                    </span>
                  </div>
                </div>

                {/* CITACIÓN PRESENCIAL CALLOUT */}
                {app.status === "citado_entrevista" && (
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                        <Calendar className="w-4 h-4 text-amber-700" strokeWidth={1.75} />
                        <span>Citación a Entrevista Presencial Programada</span>
                      </div>
                      <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                        Acción Requerida
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" strokeWidth={1.75} />
                      <span>{app.interview_address || "Sede principal de la empresa"}</span>
                    </div>

                    <p className="text-[11px] text-slate-500">
                      Documentos obligatorios: Cédula original, Hoja de vida impresa y Diploma/Credencial de Curso de Vigilancia vigente.
                    </p>

                    <div className="pt-1">
                      <a
                        href={`https://wa.me/573104508920?text=Hola,%20confirmo%20mi%20asistencia%20a%20la%20entrevista%20para%20la%20vacante%20de%20${encodeURIComponent(
                          app.job_title
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-emerald inline-flex text-xs py-2 px-3 font-semibold"
                      >
                        <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.75} />
                        Confirmar Asistencia vía WhatsApp
                      </a>
                    </div>
                  </div>
                )}

                {/* AVISO ESTUDIO DE SEGURIDAD EN CURSO */}
                {app.status === "en_estudio_seguridad" && (
                  <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                        <Shield className="w-4 h-4" strokeWidth={1.75} />
                        <span>Estudio de Seguridad y Poligrafía en Proceso</span>
                      </div>
                      <span className="badge-amber text-[10px] py-0.5">
                        En curso
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-normal">
                      La empresa ha ordenado la verificación de antecedentes, visita domiciliaria y prueba de poligrafía preempleo a través del laboratorio de FuerzaVerificada.
                    </p>
                  </div>
                )}

                {/* LINEAR HORIZONTAL STEPPER */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-3">
                    Progreso del Proceso de Selección:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                    {STATUS_STEPS.map((s, idx) => {
                      const isCompleted = idx <= currentStepIdx;
                      const isCurrent = idx === currentStepIdx;

                      return (
                        <div
                          key={s.key}
                          className={`p-2.5 rounded-xl border text-xs transition-all ${
                            isCurrent
                              ? "bg-slate-900 text-white border-slate-900 shadow-subtle font-semibold"
                              : isCompleted
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-slate-50 text-slate-400 border-slate-200/80"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-mono font-bold">
                              {isCompleted ? "✓" : `0${idx + 1}`}
                            </span>
                            {isCurrent && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            )}
                          </div>
                          <div className="font-bold leading-tight">{s.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
