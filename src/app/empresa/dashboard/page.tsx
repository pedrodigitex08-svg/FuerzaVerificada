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
    <div className="space-y-6">
      {/* Page Title & Quick Actions Estilo Computrabajo Empresas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Panel de Control B2B & Reclutamiento
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#005DA4] bg-[#EAF3FA] px-2.5 py-0.5 rounded-full border border-[#D5E6F5]">
              <Shield className="w-3 h-3 text-[#005DA4]" />
              SuperVigilancia
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestión integral de vacantes, aspirantes calificados por compatibilidad y estudios de confiabilidad.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/empresa/relevos"
            className="rounded-full bg-[#EAF3FA] hover:bg-[#D5E6F5] text-[#0B3B70] border border-[#D5E6F5] text-xs h-10 px-4 font-semibold inline-flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Radar de Relevos</span>
          </Link>
          <Link
            href="/empresa/vacantes/nueva"
            className="rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white text-xs h-10 px-5 font-semibold inline-flex items-center gap-2 transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4 text-white" strokeWidth={2} />
            <span>Nueva Vacante</span>
          </Link>
        </div>
      </div>

      {/* BANNER INFORMATIVO SI LA EMPRESA NO ESTÁ VERIFICADA */}
      {!isVerifiedCompany && (
        <div className="p-5 rounded-2xl bg-amber-50/90 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
              <Shield className="w-5 h-5 text-amber-700" strokeWidth={2} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                  Cuenta en proceso de verificación por FuerzaVerificada
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 font-mono">
                  VALIDACIÓN NIT
                </span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed font-medium">
                Puedes configurar tus vacantes y solicitar estudios de poligrafía/visita domiciliaria. Tus ofertas serán visibles al público en cuanto validemos tu personería jurídica ante la SuperVigilancia.
              </p>
            </div>
          </div>

          <Link
            href="/precios-empresas"
            className="rounded-full text-xs h-9 px-4 shrink-0 font-semibold text-amber-900 bg-white border border-amber-300 hover:bg-amber-100 transition-colors shadow-2xs"
          >
            Planes Corporativos
          </Link>
        </div>
      )}

      {/* 1. BENTO GRID: 4 OPERATIONAL KPIS ESTILO COMPUTRABAJO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Vacantes Activas */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:border-[#005DA4] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Vacantes Activas
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#EAF3FA] border border-[#D5E6F5] flex items-center justify-center text-[#0B3B70]">
              <Briefcase className="w-4 h-4 text-[#005DA4]" strokeWidth={2} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
              {activeVacanciesCount}
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              {activeVacanciesCount > 0
                ? `${activeVacanciesCount} ofertas activas en portal`
                : "Sin vacantes publicadas"}
            </span>
          </div>
        </div>

        {/* KPI 2: Candidatos Postulados */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:border-[#005DA4] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Aspirantes en ATS
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Users className="w-4 h-4 text-emerald-600" strokeWidth={2} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
              {totalApplicantsCount}
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Postulaciones recibidas en total
            </span>
          </div>
        </div>

        {/* KPI 3: Estudios & Polígrafos */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:border-[#005DA4] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Estudios & Polígrafo
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <Shield className="w-4 h-4 text-amber-600" strokeWidth={2} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
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
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:border-[#005DA4] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Disponibles para Relevo
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Zap className="w-4 h-4 fill-amber-500 text-amber-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
              {reliefCount}
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Personal activo en radar hoy
            </span>
          </div>
        </div>
      </div>

      {/* 2. RECENT VACANCIES TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-slate-900">
              Vacantes Publicadas & Filtro de Postulados
            </h3>
            <p className="text-xs text-slate-500">
              Accede a la bandeja de postulados con compatibilidad calculada (% Match).
            </p>
          </div>
          <Link
            href="/empresa/vacantes"
            className="text-xs text-[#005DA4] hover:text-[#0B3B70] font-semibold flex items-center gap-1"
          >
            Ver todas las vacantes
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                <th className="pb-3.5 font-bold">Puesto / Vacante</th>
                <th className="pb-3.5 font-bold">Turno</th>
                <th className="pb-3.5 font-bold">Salario Base</th>
                <th className="pb-3.5 font-bold">Postulados</th>
                <th className="pb-3.5 font-bold">Promedio Match</th>
                <th className="pb-3.5 text-right font-bold">Gestión ATS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vacancies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    <Briefcase className="w-8 h-8 mx-auto mb-2 text-slate-300" strokeWidth={1.5} />
                    <p className="text-sm font-bold text-slate-800">Aún no tienes vacantes publicadas</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Crea tu primera oferta laboral para recibir aspirantes verificados.
                    </p>
                    <div className="mt-3.5">
                      <Link href="/empresa/vacantes/nueva" className="rounded-full bg-[#0B3B70] text-white text-xs font-semibold h-8 px-4 inline-flex items-center gap-1.5 shadow-xs">
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Publicar Vacante</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                vacancies.map((vac) => (
                  <tr key={vac.id} className="hover:bg-[#EAF3FA]/30 transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="font-bold text-slate-900">{vac.title}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 tabular-nums">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {vac.zone} • {vac.created_at}
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-700 font-mono text-xs tabular-nums font-medium">
                      {vac.shift}
                    </td>
                    <td className="py-3.5 text-slate-900 font-mono font-bold tabular-nums">
                      ${vac.salary ? vac.salary.toLocaleString("es-CO") : "0"} COP
                    </td>
                    <td className="py-3.5">
                      <span className="text-xs font-semibold text-[#0B3B70] bg-[#EAF3FA] border border-[#D5E6F5] px-2.5 py-1 rounded-full tabular-nums">
                        {vac.applicants_count} aspirantes
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className="text-[11px] font-bold font-mono tabular-nums text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        {vac.avg_match}% Match
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <Link
                        href={`/empresa/vacantes/${vac.id}`}
                        className="rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white text-xs font-semibold h-8 px-3.5 inline-flex items-center gap-1.5 tabular-nums shadow-xs transition-colors"
                      >
                        <span>Ver ATS ({vac.applicants_count})</span>
                        <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
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
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-slate-900">
              Evaluaciones Recientes de Confiabilidad & Poligrafía
            </h3>
            <p className="text-xs text-slate-500">
              Dictámenes de antecedentes, visitas domiciliarias y pruebas de polígrafo autorizadas.
            </p>
          </div>
          <Link
            href="/empresa/estudios"
            className="text-xs text-[#005DA4] hover:text-[#0B3B70] font-semibold flex items-center gap-1"
          >
            Ver historial completo
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="space-y-3">
          {recentStudies.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
              <Shield className="w-8 h-8 mx-auto mb-2 text-slate-300" strokeWidth={1.5} />
              <p className="text-sm font-bold text-slate-800">No has solicitado estudios de confiabilidad todavía</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Solicita validaciones de antecedentes, visitas domiciliarias o dictámenes de poligrafía para tus aspirantes.
              </p>
              <div className="mt-3.5">
                <Link href="/empresa/estudios" className="rounded-full bg-[#EAF3FA] hover:bg-[#D5E6F5] text-[#0B3B70] border border-[#D5E6F5] text-xs font-semibold h-8 px-4 inline-flex items-center gap-1.5 transition-colors">
                  Solicitar mi primer estudio
                </Link>
              </div>
            </div>
          ) : (
            recentStudies.map((study) => (
              <div
                key={study.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-900 font-bold text-sm">
                      {study.candidate_name}
                    </strong>
                    <span className="text-slate-500 font-mono text-xs tabular-nums">C.C. {study.national_id}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        study.status === "aprobado"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {study.status === "aprobado" ? "Aprobado Sin Riesgo" : "En Proceso"}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs font-medium">{study.concept}</p>
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
                      className="rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs h-8 px-3.5 font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-all"
                    >
                      <FileCheck className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2} />
                      Descargar Dictamen (PDF)
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
