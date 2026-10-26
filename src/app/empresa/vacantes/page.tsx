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
          const { data: comp } = await supabase
            .from("companies")
            .select("id")
            .eq("owner_id", user.id)
            .maybeSingle();
          if (comp?.id) currentCompanyId = comp.id;
        }

        if (!currentCompanyId) {
          setVacancies([]);
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("job_posts")
          .select("*, applications(count)")
          .eq("company_id", currentCompanyId)
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          setVacancies(
            data.map((j: any) => {
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            Mis Vacantes Publicadas & Bandejas ATS
          </h1>
          <p className="text-xs text-slate-600 font-normal">
            Administre ofertas laborales, pause o reactive convocatorias y revise candidatos calificados en tiempo real.
          </p>
        </div>

        <Link
          href="/empresa/vacantes/nueva"
          className="btn-primary text-xs h-9 px-3.5 font-medium inline-flex items-center gap-1.5"
        >
          <PlusCircle className="w-3.5 h-3.5 text-slate-300" strokeWidth={1.75} />
          <span>Publicar Nueva Vacante</span>
        </Link>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-md bg-slate-900 text-white text-xs font-medium flex items-center gap-2 border border-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.08)]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" strokeWidth={2} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* KPI METRICS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-lg p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
            Total Vacantes
          </span>
          <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {vacancies.length}
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-lg p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
            Vacantes Activas
          </span>
          <span className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
            {activeVacancies}
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-lg p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
            Aspirantes Postulados
          </span>
          <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {totalApplicants}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" strokeWidth={1.75} />
        <input
          type="text"
          placeholder="Buscar vacante por cargo o título..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-10 bg-white border border-slate-200/90 rounded-md pl-10 pr-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/90 rounded-lg shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-5 font-medium">Puesto / Vacante</th>
                <th className="py-3 px-3 font-medium">Esquema</th>
                <th className="py-3 px-3 font-medium">Salario</th>
                <th className="py-3 px-3 font-medium">Postulados</th>
                <th className="py-3 px-3 font-medium">Estado</th>
                <th className="py-3 px-5 text-right font-medium">Gestión ATS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Cargando tus vacantes empresariales...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Briefcase className="w-9 h-9 mx-auto mb-3 text-slate-300" strokeWidth={1.5} />
                    <p className="text-sm font-semibold text-slate-700">
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
                          className="btn-primary text-xs h-9 px-4 inline-flex items-center gap-1.5"
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-slate-300" />
                          <span>Publicar mi primera vacante</span>
                        </Link>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((vac) => (
                  <tr key={vac.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/empresa/vacantes/${vac.id}`}
                          className="font-semibold text-slate-900 hover:text-slate-700 transition-colors"
                        >
                          {vac.title}
                        </Link>
                        {vac.is_urgent && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-800 bg-amber-50/80 px-1.5 py-0.5 rounded-md border border-amber-200/70">
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
                    <td className="py-4 px-3 font-mono text-slate-700 text-xs tabular-nums">
                      {vac.shift}
                    </td>
                    <td className="py-4 px-3 font-mono font-semibold text-slate-900 tabular-nums">
                      ${vac.salary ? vac.salary.toLocaleString("es-CO") : "0"} COP
                    </td>
                    <td className="py-4 px-3">
                      <Link
                        href={`/empresa/vacantes/${vac.id}`}
                        className="inline-flex items-center gap-1.5 font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 px-2.5 py-1 rounded-md tabular-nums transition-colors"
                      >
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <strong className="text-slate-900">{vac.applicants_count}</strong> postulados
                      </Link>
                    </td>
                    <td className="py-4 px-3">
                      <button
                        type="button"
                        onClick={() => toggleVacancyStatus(vac.id, vac.isActive)}
                        disabled={statusUpdatingId === vac.id}
                        title={vac.isActive ? "Clic para pausar convocatoria" : "Clic para reactivar convocatoria"}
                        className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md border transition-all ${
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
                        className="btn-primary text-xs h-8 px-3 font-medium inline-flex items-center gap-1.5 tabular-nums"
                      >
                        <span>Gestionar ATS</span>
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
    </div>
  );
}
