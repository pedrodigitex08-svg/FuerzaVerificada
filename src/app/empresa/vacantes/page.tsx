"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Briefcase,
  PlusCircle,
  MapPin,
  Clock,
  ArrowRight,
  Shield,
  Zap,
  Users,
  Search,
  PauseCircle,
  PlayCircle,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatSecurityRoleLabel } from "@/lib/utils/roleNormalizer";

interface VacancyItem {
  id: string;
  title: string;
  role: string;
  shift: string;
  salary: number;
  zone: string;
  applicants_count: number;
  avg_match: number;
  is_urgent: boolean;
  isActive: boolean;
  status: string;
  date: string;
}

export default function EmpresaVacantesListPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [vacancies, setVacancies] = useState<VacancyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadVacancies() {
      setIsLoading(true);
      const supabase = createClient();

      try {
        let currentCompanyId: string | null = null;
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          let { data: comp } = await supabase
            .from("companies")
            .select("id")
            .eq("owner_id", user.id)
            .maybeSingle();

          if (!comp) {
            const compName =
              user.user_metadata?.company_name ||
              user.user_metadata?.full_name ||
              "Empresa de Seguridad";

            const { data: createdComp } = await supabase
              .from("companies")
              .insert({
                owner_id: user.id,
                company_name: compName,
                nit: user.user_metadata?.nit || `NIT-${user.id.slice(0, 8)}`,
                contact_person: user.user_metadata?.full_name || "Contacto Empresa",
                contact_phone: user.user_metadata?.phone || "3000000000",
                city: "Bogotá D.C.",
                is_verified_company: false,
                plan_name: "basico",
                credits_security_studies: 10,
              })
              .select("id")
              .maybeSingle();

            if (createdComp) comp = createdComp;
          }

          if (comp?.id) currentCompanyId = comp.id;
        }

        if (!currentCompanyId) {
          setVacancies([]);
          setIsLoading(false);
          return;
        }

        let rawJobs: any[] = [];
        const { data, error } = await supabase
          .from("job_posts")
          .select("*, applications(count)")
          .eq("company_id", currentCompanyId)
          .order("created_at", { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          rawJobs = data;
        } else {
          // Respaldo anti-join: consulta directa sin JOIN
          const { data: directJobs } = await supabase
            .from("job_posts")
            .select("*")
            .eq("company_id", currentCompanyId)
            .order("created_at", { ascending: false });

          if (Array.isArray(directJobs) && directJobs.length > 0) {
            rawJobs = directJobs;
          } else {
            const { data: fallbackJobs } = await supabase
              .from("jobs")
              .select("*")
              .eq("company_id", currentCompanyId)
              .order("created_at", { ascending: false });
            if (Array.isArray(fallbackJobs)) {
              rawJobs = fallbackJobs;
            }
          }
        }

        if (rawJobs.length > 0) {
          setVacancies(
            rawJobs.map((j: any) => {
              const isActive = j.is_active !== false;
              return {
                id: j.id,
                title: j.title,
                role: formatSecurityRoleLabel(j.role_required),
                shift: j.shift || "Turno rotativo",
                salary: j.salary_monthly || 0,
                zone: j.zone_neighborhood || j.city || "Colombia",
                applicants_count: j.applications?.[0]?.count ?? 0,
                avg_match: 90,
                is_urgent: !!j.is_urgent_relief,
                isActive,
                status: isActive ? "Activa" : "Pausada",
                date: new Date(j.created_at).toLocaleDateString("es-CO"),
              };
            })
          );
        } else {
          setVacancies([]);
        }
      } catch (err) {
        console.error("Error loading jobs:", err);
        setVacancies([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadVacancies();
  }, []);

  const toggleVacancyStatus = async (id: string, currentIsActive: boolean) => {
    setStatusUpdatingId(id);
    const nextState = !currentIsActive;

    // Actualización optimista de interfaz
    setVacancies((prev) =>
      prev.map((v) =>
        v.id === id
          ? {
              ...v,
              isActive: nextState,
              status: nextState ? "Activa" : "Pausada",
            }
          : v
      )
    );

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("job_posts")
        .update({
          is_active: nextState,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        // Fallback a tabla jobs
        await supabase
          .from("jobs")
          .update({
            is_active: nextState,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);
      }

      setToastMessage(
        nextState
          ? "Vacante reactivada: Visible para postulaciones de aspirantes."
          : "Vacante pausada: Ya no recibirá nuevas postulaciones."
      );
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      console.error("Error alternando estado de vacante:", err);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const filtered = vacancies.filter(
    (v) =>
      v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalApplicants = vacancies.reduce((acc, v) => acc + v.applicants_count, 0);
  const activeVacancies = vacancies.filter((v) => v.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header Estilo Computrabajo Empresas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Mis Vacantes Publicadas & Bandejas ATS
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#005DA4] bg-[#EAF3FA] px-2.5 py-0.5 rounded-full border border-[#D5E6F5]">
              <Briefcase className="w-3 h-3 text-[#005DA4]" />
              ATS Corporativo
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Administra tus ofertas laborales, pausa o reactiva convocatorias y gestiona aspirantes calificados en tiempo real.
          </p>
        </div>

        <Link
          href="/empresa/vacantes/nueva"
          className="rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white text-xs h-10 px-5 font-semibold inline-flex items-center gap-2 transition-colors shadow-xs shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-white" strokeWidth={2} />
          <span>Publicar Nueva Vacante</span>
        </Link>
      </div>

      {toastMessage && (
        <div className="p-4 rounded-2xl bg-[#0B3B70] text-white text-xs font-semibold flex items-center gap-2.5 shadow-md border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" strokeWidth={2.5} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* KPI METRICS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:border-[#005DA4] transition-all">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Vacantes
          </span>
          <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {vacancies.length}
          </span>
          <span className="text-xs text-slate-500 mt-0.5 block">Historial registrado</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:border-[#005DA4] transition-all">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Vacantes Activas
          </span>
          <span className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
            {activeVacancies}
          </span>
          <span className="text-xs text-slate-500 mt-0.5 block">Visibles en portal</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:border-[#005DA4] transition-all">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Aspirantes Postulados
          </span>
          <span className="text-2xl font-bold font-mono text-[#0B3B70] tabular-nums">
            {totalApplicants}
          </span>
          <span className="text-xs text-slate-500 mt-0.5 block">Pendientes y evaluados</span>
        </div>
      </div>

      {/* Search Bar en Píldora */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" strokeWidth={2} />
        <input
          type="text"
          placeholder="Buscar vacante por cargo o título..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-11 bg-white border border-slate-300 rounded-full pl-11 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 shadow-2xs transition-all"
        />
      </div>

      {/* Table Estilo Computrabajo */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                <th className="py-3.5 px-5 font-bold">Puesto / Vacante</th>
                <th className="py-3.5 px-3 font-bold">Esquema</th>
                <th className="py-3.5 px-3 font-bold">Salario</th>
                <th className="py-3.5 px-3 font-bold">Postulados</th>
                <th className="py-3.5 px-3 font-bold">Estado</th>
                <th className="py-3.5 px-5 text-right font-bold">Gestión ATS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="w-7 h-7 border-2 border-[#0B3B70] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-600 font-semibold">Cargando tus vacantes empresariales...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Briefcase className="w-9 h-9 mx-auto mb-3 text-slate-300" strokeWidth={1.5} />
                    <p className="text-sm font-bold text-slate-800">
                      {searchTerm ? "No se encontraron vacantes con ese criterio" : "Aún no tienes vacantes publicadas"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      {searchTerm
                        ? "Intenta con otro término de búsqueda o limpia el filtro."
                        : "Crea tu primera oferta laboral corporativa para recibir aspirantes con verificación."}
                    </p>
                    {!searchTerm && (
                      <div className="mt-4">
                        <Link
                          href="/empresa/vacantes/nueva"
                          className="rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white text-xs h-9 px-5 font-semibold inline-flex items-center gap-2 shadow-xs transition-colors"
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-white" />
                          <span>Publicar mi primera vacante</span>
                        </Link>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((vac) => (
                  <tr key={vac.id} className="hover:bg-[#EAF3FA]/30 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/empresa/vacantes/${vac.id}`}
                          className="font-bold text-slate-900 hover:text-[#005DA4] transition-colors"
                        >
                          {vac.title}
                        </Link>
                        {vac.is_urgent && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <Zap className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
                            Relevo Urgente
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 tabular-nums">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {vac.zone} • Publicada el {vac.date}
                      </div>
                    </td>
                    <td className="py-4 px-3 font-mono text-slate-700 text-xs tabular-nums font-medium">
                      {vac.shift}
                    </td>
                    <td className="py-4 px-3 font-mono font-bold text-slate-900 tabular-nums">
                      ${vac.salary ? vac.salary.toLocaleString("es-CO") : "0"} COP
                    </td>
                    <td className="py-4 px-3">
                      <Link
                        href={`/empresa/vacantes/${vac.id}`}
                        className="inline-flex items-center gap-1.5 font-bold text-[#0B3B70] bg-[#EAF3FA] hover:bg-[#D5E6F5] border border-[#D5E6F5] px-3 py-1 rounded-full tabular-nums transition-colors"
                      >
                        <Users className="w-3.5 h-3.5 text-[#005DA4]" />
                        <span>{vac.applicants_count} postulados</span>
                      </Link>
                    </td>
                    <td className="py-4 px-3">
                      <button
                        type="button"
                        onClick={() => toggleVacancyStatus(vac.id, vac.isActive)}
                        disabled={statusUpdatingId === vac.id}
                        title={vac.isActive ? "Clic para pausar convocatoria" : "Clic para reactivar convocatoria"}
                        className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full border transition-all ${
                          vac.isActive
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
                        }`}
                      >
                        {vac.isActive ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Activa (Pausar)</span>
                          </>
                        ) : (
                          <>
                            <PauseCircle className="w-3 h-3 text-slate-500" />
                            <span>Pausada (Activar)</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <Link
                        href={`/empresa/vacantes/${vac.id}`}
                        className="rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white text-xs h-8 px-4 font-semibold inline-flex items-center gap-1.5 tabular-nums shadow-xs transition-colors"
                      >
                        <span>Gestionar ATS</span>
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
    </div>
  );
}
