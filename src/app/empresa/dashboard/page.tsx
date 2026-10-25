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
import { createClient } from "@/lib/supabase/client";

export default function EmpresaDashboardPage() {
  const [credits, setCredits] = useState(0);
  const [isVerifiedCompany, setIsVerifiedCompany] = useState<boolean>(true);
  const [vacancies, setVacancies] = useState<any[]>([]);
  const [recentStudies, setRecentStudies] = useState<any[]>([]);
  const [activeVacanciesCount, setActiveVacanciesCount] = useState(0);
  const [totalApplicantsCount, setTotalApplicantsCount] = useState(0);
  const [totalStudiesCount, setTotalStudiesCount] = useState(0);
  const [reliefCount, setReliefCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();

    if (typeof window !== "undefined") {
      const savedCredits = localStorage.getItem("fv_company_credits");
      if (savedCredits !== null) setCredits(parseInt(savedCredits, 10) || 0);

      const savedVerified = localStorage.getItem("fv_company_verified");
      if (savedVerified !== null) {
        setIsVerifiedCompany(savedVerified === "true");
      }
    }

    async function loadDashboardData() {
      let currentCompanyId: string | null = null;

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: comp } = await supabase
            .from("companies")
            .select("*")
            .eq("owner_id", user.id)
            .maybeSingle();

          if (comp) {
            currentCompanyId = comp.id;
            setCredits(Number(comp.credits_security_studies ?? 0));
            setIsVerifiedCompany(Boolean(comp.is_verified_company));
          }
        }
      } catch {}

      // 0. Count available relief candidates (Operativos con disponibilidad inmediata)
      try {
        const { count: rCount } = await supabase
          .from("candidate_profiles")
          .select("*", { count: "exact", head: true })
          .eq("available_immediately", true);
        if (rCount !== null && rCount !== undefined) {
          setReliefCount(rCount);
        }
      } catch {}

      if (!currentCompanyId) {
        setVacancies([]);
        setRecentStudies([]);
        setActiveVacanciesCount(0);
        setTotalApplicantsCount(0);
        setTotalStudiesCount(0);
        return;
      }

      // 1. Métricas exactas en Supabase para la empresa autenticada
      try {
        // Vacantes Activas
        const { count: vCount } = await supabase
          .from("job_posts")
          .select("*", { count: "exact", head: true })
          .eq("company_id", currentCompanyId)
          .eq("is_active", true);
        setActiveVacanciesCount(vCount ?? 0);

        // Candidatos postulados a las vacantes de esta empresa
        const { data: compJobs } = await supabase
          .from("job_posts")
          .select("id")
          .eq("company_id", currentCompanyId);

        const jobIds = (compJobs || []).map((j: any) => j.id);
        if (jobIds.length > 0) {
          const { count: aCount } = await supabase
            .from("applications")
            .select("*", { count: "exact", head: true })
            .in("job_id", jobIds);
          setTotalApplicantsCount(aCount ?? 0);
        } else {
          setTotalApplicantsCount(0);
        }

        // Estudios de Seguridad solicitados por esta empresa
        const { count: sCount } = await supabase
          .from("security_study_orders")
          .select("*", { count: "exact", head: true })
          .eq("company_id", currentCompanyId);
        setTotalStudiesCount(sCount ?? 0);
      } catch {}

      // 2. Cargar las 5 vacantes más recientes de la empresa
      try {
        const { data: jobsData, error: jobsError } = await supabase
          .from("job_posts")
          .select("*, applications(count)")
          .eq("company_id", currentCompanyId)
          .order("created_at", { ascending: false })
          .limit(5);

        if (!jobsError && jobsData && jobsData.length > 0) {
          setVacancies(
            jobsData.map((j: any) => {
              const appCount = j.applications?.[0]?.count ?? 0;
              return {
                id: j.id,
                title: j.title,
                role_required: j.role_required,
                shift: j.shift,
                salary: j.salary_monthly,
                zone: j.zone_neighborhood || j.city,
                applicants_count: appCount,
                avg_match: 90,
                is_urgent: j.is_urgent_relief,
                created_at: new Date(j.created_at).toLocaleDateString("es-CO"),
              };
            })
          );
        } else {
          setVacancies([]);
        }
      } catch {
        setVacancies([]);
      }

      // 3. Cargar las 5 órdenes más recientes de la empresa
      try {
        const { data: studiesData, error: studiesError } = await supabase
          .from("security_study_orders")
          .select("*, profiles(*)")
          .eq("company_id", currentCompanyId)
          .order("created_at", { ascending: false })
          .limit(5);

        if (!studiesError && studiesData && studiesData.length > 0) {
          const candIds = studiesData.map((s: any) => s.candidate_id).filter(Boolean);
          const { data: candProfs } =
            candIds.length > 0
              ? await supabase
                  .from("candidate_profiles")
                  .select("user_id, national_id")
                  .in("user_id", candIds)
              : { data: [] as any[] };
          const natMap = new Map(
            (candProfs || []).map((cp: any) => [cp.user_id, cp.national_id])
          );

          setRecentStudies(
            studiesData.map((s: any) => ({
              id: s.id,
              candidate_name: s.profiles?.full_name || "Aspirante",
              national_id: natMap.get(s.candidate_id) || "En verificación",
              job_title: s.study_type
                ? s.study_type.replace(/_/g, " ").toUpperCase()
                : "Estudio Solicitado",
              status: s.status,
              concept: s.final_concept || "En proceso de validación",
              report_url: s.report_pdf_url,
              date: new Date(s.created_at).toLocaleDateString("es-CO"),
            }))
          );
        } else {
          setRecentStudies([]);
        }
      } catch {
        setRecentStudies([]);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            Resumen de Operaciones y Selección
          </h1>
          <p className="text-xs text-slate-600 font-normal">
            Panel de control B2B: vacantes activas, aspirantes evaluados y órdenes de confiabilidad.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/empresa/relevos"
            className="btn-secondary text-xs h-9 px-3.5 font-medium"
          >
            <Zap className="w-3.5 h-3.5 text-amber-600" strokeWidth={1.75} />
            Radar de Relevos Hoy
          </Link>
          <Link
            href="/empresa/vacantes/nueva"
            className="btn-primary text-xs h-9 px-3.5 font-medium"
          >
            <PlusCircle className="w-3.5 h-3.5 text-slate-300" strokeWidth={1.75} />
            Nueva Vacante
          </Link>
        </div>
      </div>

      {/* BANNER INFORMATIVO SI LA EMPRESA NO ESTÁ VERIFICADA */}
      {!isVerifiedCompany && (
        <div className="p-4 rounded-lg bg-amber-50/80 border border-amber-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-md bg-amber-100/80 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
              <Shield className="w-4 h-4 text-amber-700" strokeWidth={1.5} />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-amber-900 uppercase tracking-wide">
                  Cuenta en proceso de verificación por FuerzaVerificada
                </span>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-amber-200/70 text-amber-900 font-mono">
                  VALIDACIÓN NIT
                </span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed font-normal">
                Puedes configurar tus vacantes o solicitar tu paquete de Poligrafía/Visita, y tus ofertas serán visibles al público apenas validemos tu NIT con la Superintendencia de Vigilancia.
              </p>
            </div>
          </div>

          <Link
            href="/precios-empresas"
            className="btn-secondary text-[11px] h-8 px-3 shrink-0 font-medium text-amber-900 border-amber-300 hover:bg-amber-100"
          >
            Planes para Empresas
          </Link>
        </div>
      )}

      {/* 1. BENTO GRID: 4 OPERATIONAL KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Vacantes Activas */}
        <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Vacantes Activas
            </span>
            <div className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700">
              <Briefcase className="w-3.5 h-3.5" strokeWidth={1.75} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-semibold tracking-tight text-slate-900 font-mono tabular-nums">
              {activeVacanciesCount}
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              {activeVacanciesCount > 0
                ? `${activeVacanciesCount} ofertas activas en la plataforma`
                : "Sin vacantes publicadas"}
            </span>
          </div>
        </div>

        {/* KPI 2: Candidatos Postulados */}
        <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Aspirantes en ATS
            </span>
            <div className="w-7 h-7 rounded-md bg-emerald-50/80 border border-emerald-200/60 flex items-center justify-center text-emerald-700">
              <Users className="w-3.5 h-3.5" strokeWidth={1.75} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-semibold tracking-tight text-slate-900 font-mono tabular-nums">
              {totalApplicantsCount}
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Aspirantes postulados a tus procesos
            </span>
          </div>
        </div>

        {/* KPI 3: Estudios & Polígrafos */}
        <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Estudios & Polígrafo
            </span>
            <div className="w-7 h-7 rounded-md bg-amber-50/80 border border-amber-200/60 flex items-center justify-center text-amber-700">
              <Shield className="w-3.5 h-3.5" strokeWidth={1.75} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-semibold tracking-tight text-slate-900 font-mono tabular-nums">
              {totalStudiesCount}
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block tabular-nums">
              {totalStudiesCount > 0
                ? `${totalStudiesCount} órdenes (${credits} créditos disp.)`
                : `0 órdenes (${credits} créditos disp.)`}
            </span>
          </div>
        </div>

        {/* KPI 4: Guardas Disponibles Relevo */}
        <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Disponibles para Relevo
            </span>
            <div className="w-7 h-7 rounded-md bg-emerald-50/80 border border-emerald-200/60 flex items-center justify-center text-emerald-700">
              <Zap className="w-3.5 h-3.5" strokeWidth={1.75} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-semibold tracking-tight text-slate-900 font-mono tabular-nums">
              {reliefCount}
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Personal activo en radar hoy
            </span>
          </div>
        </div>
      </div>

      {/* 2. RECENT VACANCIES TABLE */}
      <div className="bg-white border border-slate-200/90 rounded-lg p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-slate-900">
              Vacantes Publicadas & Filtro de Postulados
            </h3>
            <p className="text-xs text-slate-500 font-normal">
              Acceda a la bandeja de postulados ordenados por compatibilidad (% Match).
            </p>
          </div>
          <Link
            href="/empresa/vacantes"
            className="text-xs text-slate-700 hover:text-slate-900 font-medium flex items-center gap-1"
          >
            Ver todas las vacantes
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                <th className="pb-3 font-medium">Puesto / Vacante</th>
                <th className="pb-3 font-medium">Turno</th>
                <th className="pb-3 font-medium">Salario Base</th>
                <th className="pb-3 font-medium">Postulados</th>
                <th className="pb-3 font-medium">Promedio Match</th>
                <th className="pb-3 text-right font-medium">Gestión ATS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vacancies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <Briefcase className="w-7 h-7 mx-auto mb-2 text-slate-300" strokeWidth={1.5} />
                    <p className="text-sm font-medium text-slate-700">Aún no tienes vacantes publicadas</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Crea tu primera oferta laboral para empezar a recibir aspirantes calificados.
                    </p>
                    <div className="mt-3">
                      <Link href="/empresa/vacantes/nueva" className="btn-primary text-xs h-8 px-3 inline-flex">
                        Publicar Vacante
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                vacancies.map((vac) => (
                  <tr key={vac.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="font-semibold text-slate-900">{vac.title}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 tabular-nums">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {vac.zone} • {vac.created_at}
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-700 font-mono text-xs tabular-nums">
                      {vac.shift}
                    </td>
                    <td className="py-3.5 text-slate-900 font-mono font-semibold tabular-nums">
                      ${vac.salary ? vac.salary.toLocaleString("es-CO") : "0"} COP
                    </td>
                    <td className="py-3.5">
                      <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md tabular-nums">
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
                        className="btn-primary text-xs h-8 px-3 font-medium inline-flex tabular-nums"
                      >
                        Ver ATS ({vac.applicants_count})
                        <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. RECENT SECURITY STUDY ORDERS WIDGET */}
      <div className="bg-white border border-slate-200/90 rounded-lg p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-slate-900">
              Últimas Evaluaciones de Confiabilidad & Poligrafía
            </h3>
            <p className="text-xs text-slate-500 font-normal">
              Dictámenes de antecedentes, visitas domiciliarias y pruebas de polígrafo.
            </p>
          </div>
          <Link
            href="/empresa/estudios"
            className="text-xs text-slate-700 hover:text-slate-900 font-medium flex items-center gap-1"
          >
            Ver historial completo
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="space-y-3">
          {recentStudies.length === 0 ? (
            <div className="p-8 text-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50">
              <Shield className="w-7 h-7 mx-auto mb-2 text-slate-300" strokeWidth={1.5} />
              <p className="text-sm font-medium text-slate-700">No has solicitado estudios de confiabilidad ni pruebas de poligrafía todavía</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Solicita investigaciones de antecedentes, verificación de domicilio o dictámenes de poligrafía para tus aspirantes.
              </p>
              <div className="mt-3">
                <Link href="/empresa/estudios" className="btn-secondary text-xs h-8 px-3 inline-flex">
                  Solicitar mi primer estudio
                </Link>
              </div>
            </div>
          ) : (
            recentStudies.map((study) => (
              <div
                key={study.id}
                className="p-4 rounded-lg border border-slate-200/90 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-900 font-semibold text-sm">
                      {study.candidate_name}
                    </strong>
                    <span className="text-slate-500 font-mono text-xs tabular-nums">C.C. {study.national_id}</span>
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
                  <div className="text-[11px] text-slate-500 tabular-nums">
                    Vacante: {study.job_title} • Radicado el {study.date}
                  </div>
                </div>

                <div>
                  {study.report_url ? (
                    <a
                      href={study.report_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-xs h-8 px-3 font-medium text-slate-800 hover:text-slate-900"
                    >
                      <FileCheck className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.75} />
                      Descargar Dictamen Confidencial (PDF)
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500 italic">
                      Informe disponible en 24h
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
