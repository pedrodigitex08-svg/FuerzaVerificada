"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  BadgeCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { ApplicationStatus } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

interface SavedApp {
  id: string;
  job_id: string;
  job_title: string;
  company_name: string;
  company_phone?: string;
  shift: string;
  salary_monthly: number;
  interview_address?: string;
  match_score: number;
  status: ApplicationStatus | string;
  created_at: string;
  updated_at?: string;
}

// 5 ETAPAS ESTILO COMPUTRABAJO
const STAGES = [
  {
    stage: 1,
    title: "1. Postulado",
    subtitle: "CV enviado a la empresa",
    desc: "Tu hoja de vida fue enviada exitosamente y está en cola de revisión por el equipo de recursos humanos.",
  },
  {
    stage: 2,
    title: "2. CV en Revisión",
    subtitle: "Perfil consultado",
    desc: "El reclutador ha abierto y evaluado tu perfil operativo y soportes de SuperVigilancia.",
  },
  {
    stage: 3,
    title: "3. Poligrafía / Estudio",
    subtitle: "Entrevista o estudio",
    desc: "Fuiste seleccionado para pruebas técnicas, citación presencial o estudio de seguridad / poligrafía.",
  },
  {
    stage: 4,
    title: "4. Exámenes Médicos",
    subtitle: "Evaluación ocupacional",
    desc: "Has sido programado para valoración médica ocupacional de ingreso y aptitud psicofísica.",
  },
  {
    stage: 5,
    title: "5. Resultado Final",
    subtitle: "Vinculación laboral",
    desc: "¡Proceso culminado exitosamente! Asignación de puesto formalizada con todas las prestaciones de ley.",
  },
];

function getStageInfo(status: string) {
  const st = (status || "").toLowerCase().trim();
  const isRejected = ["descartado", "rechazado", "rejected", "finalizado"].includes(st);

  let currentStageIndex = 0; // 0 = Postulado, 1 = Revisión, 2 = Poligrafía / Estudio, 3 = Exámenes Médicos, 4 = Resultado Final

  if (isRejected) {
    currentStageIndex = 4;
  } else if (["finalista", "contratado", "seleccionado", "hired", "accepted"].includes(st)) {
    currentStageIndex = 4;
  } else if (["examenes_medicos"].includes(st)) {
    currentStageIndex = 3;
  } else if (
    [
      "poligrafo",
      "estudio_seguridad",
      "en_estudio_seguridad",
      "entrevista",
      "citado_entrevista",
      "interview",
      "in_process",
      "pruebas",
      "estudio",
    ].includes(st)
  ) {
    currentStageIndex = 2;
  } else if (
    ["en_revision", "revisado", "preseleccionado", "viewed", "reviewing", "leido"].includes(st)
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

function getStatusPillMeta(status: string): {
  label: string;
  className: string;
  dotColor: string;
} {
  const st = (status || "").toLowerCase().trim();
  if (["contratado", "seleccionado", "hired", "accepted"].includes(st)) {
    return {
      label: "Contratado / Seleccionado",
      className: "bg-emerald-50 text-emerald-800 border-emerald-200",
      dotColor: "bg-emerald-500",
    };
  }
  if (st === "finalista") {
    return {
      label: "Finalista",
      className: "bg-emerald-50 text-emerald-800 border-emerald-200",
      dotColor: "bg-emerald-500",
    };
  }
  if (["descartado", "rechazado", "rejected", "finalizado"].includes(st)) {
    return {
      label: "Proceso Finalizado",
      className: "bg-slate-200 text-slate-600 border-slate-300",
      dotColor: "bg-slate-400",
    };
  }
  if (st === "examenes_medicos") {
    return {
      label: "Exámenes Médicos",
      className: "bg-purple-50 text-purple-800 border-purple-200",
      dotColor: "bg-purple-500",
    };
  }
  if (["poligrafo", "estudio_seguridad", "en_estudio_seguridad", "estudio", "pruebas"].includes(st)) {
    return {
      label: "En Poligrafía / Estudio",
      className: "bg-indigo-50 text-indigo-800 border-indigo-200",
      dotColor: "bg-indigo-500",
    };
  }
  if (["entrevista", "citado_entrevista", "interview", "in_process"].includes(st)) {
    return {
      label: "Citado a Entrevista",
      className: "bg-amber-50 text-amber-800 border-amber-200",
      dotColor: "bg-amber-500",
    };
  }
  if (["en_revision", "revisado", "preseleccionado", "viewed", "reviewing", "leido"].includes(st)) {
    return {
      label: "CV en Revisión",
      className: "bg-[#EAF3FA] text-[#0B3B70] border-[#D5E6F5]",
      dotColor: "bg-[#005DA4]",
    };
  }
  return {
    label: "Postulado",
    className: "bg-slate-50 text-slate-700 border-slate-200",
    dotColor: "bg-[#005DA4]",
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

function formatStatusToastLabel(status: string): string {
  const st = (status || "").toLowerCase().trim();
  if (st === "preseleccionado") return "En Revisión / CV Visto por la empresa";
  if (st === "citado_entrevista") return "Citado a Entrevista Presencial";
  if (st === "en_estudio_seguridad") return "En Estudio de Seguridad & Poligrafía";
  if (st === "examenes_medicos") return "Exámenes Médicos Ocupacionales";
  if (st === "contratado") return "¡Contratado!";
  if (st === "descartado") return "Proceso Finalizado";
  return "Postulado (En cola de revisión)";
}

export default function PostulacionesPage() {
  const [applications, setApplications] = useState<SavedApp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [realtimeToast, setRealtimeToast] = useState<string | null>(null);
  const prevStatusMapRef = useRef<Map<string, string>>(new Map());
  const hasLoadedOnceRef = useRef(false);

  const applyResolvedApplications = useCallback((nextApps: SavedApp[]) => {
    if (hasLoadedOnceRef.current) {
      for (const app of nextApps) {
        const prevStatus = prevStatusMapRef.current.get(app.id);
        if (prevStatus && prevStatus !== app.status) {
          setRealtimeToast(
            `Actualización en tiempo real: "${app.job_title}" (${app.company_name}) cambió a ${formatStatusToastLabel(
              String(app.status)
            )}.`
          );
          setTimeout(() => setRealtimeToast(null), 6000);
          break;
        }
      }
    }

    const nextMap = new Map<string, string>();
    nextApps.forEach((a) => nextMap.set(a.id, String(a.status)));
    prevStatusMapRef.current = nextMap;
    hasLoadedOnceRef.current = true;
    setApplications(nextApps);
  }, []);

  const loadApplications = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) setIsLoading(true);
      const supabase = createClient();

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // 1. Obtener tanto user.id como el posible id de public.candidate_profiles
          const { data: candProf } = await supabase
            .from("candidate_profiles")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

          const candidateIds = Array.from(
            new Set(
              [user.id, (candProf as any)?.id, candProf?.user_id].filter(
                Boolean
              ) as string[]
            )
          );

          // 2. Lectura resiliente anti-fallos de Join:
          // Primero consultar directamente public.applications (select("*")) buscando por ambos IDs (.in / .or)
          let { data: directApps, error: directErr } = await supabase
            .from("applications")
            .select("*")
            .in("candidate_id", candidateIds)
            .order("created_at", { ascending: false });

          if ((directErr || !directApps || directApps.length === 0) && candidateIds.length > 0) {
            const orFilter = candidateIds
              .map((id) => `candidate_id.eq.${id}`)
              .join(",");
            const { data: orApps, error: orErr } = await supabase
              .from("applications")
              .select("*")
              .or(orFilter)
              .order("created_at", { ascending: false });

            if (!orErr && orApps && orApps.length > 0) {
              directApps = orApps;
              directErr = null;
            }
          }

          if (directApps && directApps.length > 0) {
            const jobIds = Array.from(
              new Set(
                directApps
                  .map((d: any) => d.job_id || d.job_post_id)
                  .filter(Boolean) as string[]
              )
            );

            // 3. Resolver los datos de las vacantes en public.job_posts (con respaldo a public.jobs) por sus IDs
            let rawJobs: any[] = [];
            if (jobIds.length > 0) {
              const { data: rawJobsPrimary } = await supabase
                .from("job_posts")
                .select("*")
                .in("id", jobIds);

              if (rawJobsPrimary && rawJobsPrimary.length > 0) {
                rawJobs = rawJobsPrimary;
              } else {
                const { data: rawJobsFallback } = await supabase
                  .from("jobs")
                  .select("*")
                  .in("id", jobIds);
                if (rawJobsFallback) {
                  rawJobs = rawJobsFallback;
                }
              }
            }

            const jobMap = new Map((rawJobs || []).map((j: any) => [j.id, j]));
            const compIds = Array.from(
              new Set(
                (rawJobs || [])
                  .map((j: any) => j.company_id)
                  .filter(Boolean) as string[]
              )
            );

            // 4. Resolver los datos de las empresas en public.companies por sus IDs
            let rawComps: any[] = [];
            if (compIds.length > 0) {
              const { data: compsData } = await supabase
                .from("companies")
                .select("*")
                .in("id", compIds);
              if (compsData) {
                rawComps = compsData;
              }
            }
            const compMap = new Map((rawComps || []).map((c: any) => [c.id, c]));

            applyResolvedApplications(
              directApps.map((app: any) => {
                const jId = app.job_id || app.job_post_id;
                const job = jId ? jobMap.get(jId) : null;
                const comp = job?.company_id ? compMap.get(job.company_id) : null;
                const rawPhone =
                  comp?.contact_phone ||
                  comp?.phone ||
                  "3133778276";
                return {
                  id: app.id,
                  job_id: jId || "",
                  job_title: job?.title || "Vacante de Seguridad",
                  company_name:
                    comp?.company_name ||
                    comp?.commercial_name ||
                    "Empresa de Seguridad",
                  company_phone: String(rawPhone).replace(/\D/g, "") || "3133778276",
                  shift: job?.shift || "Turno rotativo",
                  salary_monthly: Number(job?.salary_monthly) || 0,
                  interview_address:
                    job?.interview_address ||
                    job?.zone_neighborhood ||
                    job?.city ||
                    "Oficina principal",
                  match_score: app.match_score ?? app.compatibility_score ?? 90,
                  status: (app.status as ApplicationStatus) || "postulado",
                  created_at: app.created_at,
                  updated_at: app.updated_at,
                };
              })
            );
            if (showSpinner) setIsLoading(false);
            return;
          }
        }

        applyResolvedApplications([]);
      } catch (err) {
        console.error("Error loading candidate applications:", err);
      } finally {
        if (showSpinner) setIsLoading(false);
      }
    },
    [applyResolvedApplications]
  );

  useEffect(() => {
    loadApplications(true);

    const supabase = createClient();
    let activeChannel: ReturnType<typeof supabase.channel> | null = null;

    // 1. Suscripción WebSocket en tiempo real (Supabase Realtime postgres_changes)
    async function setupRealtime() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: candProf } = await supabase
        .from("candidate_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      const candidateIdsSet = new Set(
        [user.id, (candProf as any)?.id, candProf?.user_id].filter(
          Boolean
        ) as string[]
      );

      activeChannel = supabase
        .channel(`candidate-apps-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "applications",
          },
          (payload) => {
            const row = (payload.new || payload.old) as any;
            if (row?.candidate_id && !candidateIdsSet.has(row.candidate_id)) {
              return;
            }
            if (payload.eventType === "UPDATE" && payload.new) {
              const updated = payload.new as any;
              setApplications((prev) =>
                prev.map((app) =>
                  app.id === updated.id
                    ? {
                        ...app,
                        status: updated.status as ApplicationStatus,
                        updated_at: updated.updated_at,
                      }
                    : app
                )
              );
            }
            loadApplications(false);
          }
        )
        .subscribe();
    }

    setupRealtime();

    // 2. Respaldo en vivo por foco/visibilidad y sincronización silenciosa cada 5s
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        loadApplications(false);
      }
    };

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadApplications(false);
      }
    }, 5000);

    return () => {
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      clearInterval(intervalId);
      if (activeChannel) {
        supabase.removeChannel(activeChannel);
      }
    };
  }, [loadApplications]);

  // Contadores Superiores Sincronizados en Tiempo Real
  const totalCount = applications.length;
  const revisionCount = applications.filter((a) => {
    const { currentStageIndex, isRejected } = getStageInfo(a.status);
    return !isRejected && currentStageIndex === 1;
  }).length;
  const evaluacionCount = applications.filter((a) => {
    const { currentStageIndex, isRejected } = getStageInfo(a.status);
    return !isRejected && currentStageIndex === 2;
  }).length;
  const examenesCount = applications.filter((a) => {
    const { currentStageIndex, isRejected } = getStageInfo(a.status);
    return !isRejected && currentStageIndex === 3;
  }).length;
  const contratadoCount = applications.filter((a) => {
    const { currentStageIndex, isRejected } = getStageInfo(a.status);
    return !isRejected && currentStageIndex === 4;
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Seguimiento de Mis Postulaciones
            </h1>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              En vivo
            </span>
          </div>
          <p className="text-xs text-slate-500 font-normal mt-1">
            Rastreador en tiempo real del estado de tus procesos de selección con empresas de vigilancia y seguridad privada.
          </p>
        </div>

        <Link
          href="/guarda/vacantes"
          className="rounded-full bg-[#EAF3FA] hover:bg-[#d8e8f6] text-[#0B3B70] border border-[#D5E6F5] text-xs h-10 px-5 font-semibold inline-flex items-center gap-2 transition-colors self-start sm:self-auto shadow-2xs"
        >
          <Briefcase className="w-3.5 h-3.5 text-[#005DA4]" strokeWidth={2} />
          <span>Explorar Más Vacantes</span>
        </Link>
      </div>

      {/* CONTADORES SUPERIORES SINCRONIZADOS (ESTILO COMPUTRABAJO) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">
              Total Postulaciones
            </span>
            <span className="text-xl font-bold font-mono text-[#0B3B70] tabular-nums">
              {totalCount}
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#EAF3FA] border border-[#D5E6F5] flex items-center justify-center text-[#005DA4]">
            <Briefcase className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">
              CV en Revisión
            </span>
            <span className="text-xl font-bold font-mono text-[#005DA4] tabular-nums">
              {revisionCount}
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#EAF3FA] border border-[#D5E6F5] flex items-center justify-center text-[#005DA4]">
            <Eye className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">
              Poligrafía / Estudio
            </span>
            <span className="text-xl font-bold font-mono text-amber-700 tabular-nums">
              {evaluacionCount}
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <Shield className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">
              Exámenes Médicos
            </span>
            <span className="text-xl font-bold font-mono text-purple-700 tabular-nums">
              {examenesCount}
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
            <Stethoscope className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">
              Seleccionado / Finalista
            </span>
            <span className="text-xl font-bold font-mono text-emerald-700 tabular-nums">
              {contratadoCount}
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <CheckCircle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {realtimeToast && (
        <div className="p-4 rounded-2xl bg-[#0B3B70] text-white text-xs font-semibold flex items-center justify-between gap-3 shadow-md border border-slate-700">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-[#FFE066] shrink-0" strokeWidth={2.2} />
            <span>{realtimeToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setRealtimeToast(null)}
            className="text-[11px] text-slate-200 hover:text-white underline shrink-0"
          >
            Cerrar
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-3 shadow-2xs">
          <div className="w-6 h-6 border-2 border-[#0B3B70] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Cargando tus postulaciones registradas...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-3 shadow-2xs">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto" strokeWidth={1.5} />
          <h4 className="text-sm font-bold text-slate-900 tracking-tight">
            Aún no tienes postulaciones activas
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Explora las vacantes de seguridad disponibles en Bogotá y a nivel nacional con salario certificado y turno garantizado.
          </p>
          <Link
            href="/guarda/vacantes"
            className="rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white inline-flex text-xs h-10 px-6 font-semibold items-center gap-2 shadow-xs transition-colors"
          >
            Ver Vacantes Disponibles
            <ArrowRight className="w-4 h-4" strokeWidth={2} />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const { currentStageIndex, isRejected } = getStageInfo(app.status);
            const statusPill = getStatusPillMeta(app.status);

            return (
              <div
                key={app.id}
                className={`rounded-2xl p-6 space-y-5 transition-all ${
                  isRejected
                    ? "bg-slate-100/60 opacity-60 grayscale border border-slate-200/80"
                    : "bg-white border border-slate-200 shadow-2xs hover:border-slate-300"
                }`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
                        {app.company_name}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#005DA4] bg-[#EAF3FA] px-2.5 py-0.5 rounded-full border border-[#D5E6F5]">
                        <BadgeCheck className="w-3.5 h-3.5 text-[#005DA4]" />
                        Empresa Verificada
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusPill.className}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusPill.dotColor}`} />
                        {statusPill.label}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        • {formatRelativeDate(app.created_at)}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 tracking-tight mt-1.5">
                      {app.job_title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                        Salario mensual
                      </span>
                      <span className="text-sm font-bold font-mono text-slate-900 tabular-nums">
                        ${app.salary_monthly ? app.salary_monthly.toLocaleString("es-CO") : "0"} COP
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#0B3B70] bg-[#EAF3FA] border border-[#D5E6F5] px-3 py-1 rounded-full tabular-nums">
                      {app.match_score}% Match
                    </span>
                  </div>
                </div>

                {/* CITACIÓN PRESENCIAL CALLOUT */}
                {app.status === "citado_entrevista" && (
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
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
                        href={`https://wa.me/${
                          (app.company_phone || "3133778276").startsWith("57")
                            ? app.company_phone || "573133778276"
                            : `57${app.company_phone || "3133778276"}`
                        }?text=Hola,%20confirmo%20mi%20asistencia%20a%20la%20entrevista%20para%20la%20vacante%20de%20${encodeURIComponent(
                          app.job_title
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-4 font-semibold inline-flex items-center gap-2 shadow-xs transition-colors"
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
                      <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                        <Shield className="w-4 h-4" strokeWidth={1.75} />
                        <span>Estudio de Seguridad y Poligrafía en Proceso</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2.5 py-0.5 rounded-full">
                        En curso
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-normal">
                      La empresa ha ordenado la verificación de antecedentes, visita domiciliaria y prueba de poligrafía preempleo a través del protocolo certificado de FuerzaVerificada.
                    </p>
                  </div>
                )}

                {/* AVISO CONTRATACIÓN EXITOSA */}
                {app.status === "contratado" && (
                  <div className="p-4 rounded-xl bg-emerald-50/90 border border-emerald-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" strokeWidth={2.2} />
                        <span>¡Felicitaciones! Has sido seleccionado y contratado</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                        Contratado
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      El equipo de selección de <strong>{app.company_name}</strong> ha formalizado tu admisión para el cargo de <strong>{app.job_title}</strong>.
                    </p>
                  </div>
                )}

                {/* AVISO EXÁMENES MÉDICOS */}
                {app.status === "examenes_medicos" && (
                  <div className="p-4 rounded-xl bg-purple-50/80 border border-purple-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
                        <Stethoscope className="w-4 h-4 text-purple-700" strokeWidth={2} />
                        <span>Convocado a Exámenes Médicos Ocupacionales</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 bg-purple-100 border border-purple-300 px-2.5 py-0.5 rounded-full">
                        En Proceso Médico
                      </span>
                    </div>
                    <p className="text-xs text-purple-900 leading-relaxed font-normal">
                      Has superado los filtros anteriores y has sido agendado para tus valoraciones médicas ocupacionales y pruebas de aptitud psicofísica. Mantente atento a las indicaciones de la empresa sobre ayuno, lugar y horario.
                    </p>
                  </div>
                )}

                {/* RASTREADOR VISUAL EN 5 ETAPAS (Estilo Computrabajo) */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Progreso de la Postulación ({currentStageIndex + 1} de 5)
                    </span>
                    {isRejected ? (
                      <span className="text-xs font-medium text-slate-600 bg-slate-200 border border-slate-300 px-2.5 py-0.5 rounded-full">
                        Proceso Finalizado
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-[#005DA4] bg-[#EAF3FA] border border-[#D5E6F5] px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#005DA4] animate-pulse" />
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
                        isRejected ? "bg-slate-400" : "bg-[#005DA4]"
                      }`}
                      style={{
                        width: `${(currentStageIndex / 4) * 100}%`,
                        maxWidth: "calc(100% - 4rem)",
                      }}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 relative z-10">
                      {STAGES.map((st, idx) => {
                        const isPast = idx < currentStageIndex;
                        const isCurrent = idx === currentStageIndex;

                        let circleStyle = "bg-white border-2 border-slate-300 text-slate-400";
                        let cardStyle = "bg-slate-50/70 border-slate-200 text-slate-500";

                        if (isRejected) {
                          if (idx === 4) {
                            circleStyle = "bg-slate-400 border-2 border-slate-400 text-white";
                            cardStyle = "bg-slate-200/70 border-slate-300 text-slate-600";
                          } else {
                            circleStyle = "bg-slate-100 border-2 border-slate-200 text-slate-400";
                            cardStyle = "bg-slate-50/50 border-slate-200 text-slate-400";
                          }
                        } else if (isCurrent) {
                          circleStyle = "bg-[#0B3B70] border-2 border-[#0B3B70] text-white shadow-xs ring-4 ring-[#EAF3FA]";
                          cardStyle = "bg-[#0B3B70] text-white border-[#0B3B70] shadow-xs";
                        } else if (isPast) {
                          circleStyle = "bg-emerald-600 border-2 border-emerald-600 text-white";
                          cardStyle = "bg-emerald-50/70 border-emerald-200 text-emerald-950";
                        }

                        const stageTitle = idx === 4 && isRejected ? "Proceso Finalizado" : st.title;
                        const stageSub = idx === 4 && isRejected ? "Perfil en base de datos" : st.subtitle;

                        return (
                          <div
                            key={st.stage}
                            className={`p-3 rounded-xl border transition-all ${cardStyle}`}
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
                    className={`mt-3 p-3.5 rounded-xl text-xs border ${
                      isRejected
                        ? "bg-slate-100/80 border-slate-200 text-slate-600"
                        : currentStageIndex === 4
                        ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                        : currentStageIndex === 3
                        ? "bg-purple-50/80 border-purple-200 text-purple-900"
                        : "bg-[#EAF3FA] border-[#D5E6F5] text-[#0B3B70]"
                    }`}
                  >
                    <span className="font-bold block mb-0.5">
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
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 tracking-tight">
              ¿Tu curso de SuperVigilancia está próximo a vencer?
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Consulta nuestra Red de Academias Aliadas con hasta 15% de descuento por convenio institucional.
            </p>
          </div>
        </div>

        <Link
          href="/guarda/documentos"
          className="rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white text-xs h-10 px-5 font-semibold inline-flex items-center gap-2 shrink-0 transition-colors shadow-xs"
        >
          <span>Ver Academias con Descuento</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
