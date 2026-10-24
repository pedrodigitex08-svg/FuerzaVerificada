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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
  status: string;
  date: string;
}

export default function EmpresaVacantesListPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [vacancies, setVacancies] = useState<VacancyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadVacancies() {
      setIsLoading(true);
      const supabase = createClient();

      try {
        const { data, error } = await supabase
          .from("jobs")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          setVacancies(
            data.map((j) => ({
              id: j.id,
              title: j.title,
              role: j.role_required || "Seguridad",
              shift: j.shift || "Turno rotativo",
              salary: j.salary_monthly || 0,
              zone: j.zone_neighborhood || j.city || "Colombia",
              applicants_count: 0,
              avg_match: 90,
              is_urgent: !!j.is_urgent_relief,
              status: j.is_active ? "Activa" : "Pausada",
              date: new Date(j.created_at).toLocaleDateString("es-CO"),
            }))
          );
        } else if (typeof window !== "undefined") {
          const localJobs = localStorage.getItem("fv_company_jobs");
          if (localJobs) {
            try {
              const parsed = JSON.parse(localJobs);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setVacancies(
                  parsed.map((j: any) => ({
                    id: j.id,
                    title: j.title,
                    role: j.role_required || "Seguridad",
                    shift: j.shift || "Turno rotativo",
                    salary: j.salary_monthly || 0,
                    zone: j.zone_neighborhood || j.city || "Colombia",
                    applicants_count: 0,
                    avg_match: 90,
                    is_urgent: !!j.is_urgent_relief,
                    status: "Activa",
                    date: "Reciente",
                  }))
                );
              }
            } catch {}
          }
        }
      } catch (err) {
        console.error("Error loading jobs:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadVacancies();
  }, []);

  const filtered = vacancies.filter(
    (v) =>
      v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Mis Vacantes Publicadas & Bandejas ATS
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            Administre ofertas laborales, revise postulados calificados y solicite poligrafía en 1 clic.
          </p>
        </div>

        <Link
          href="/empresa/vacantes/nueva"
          className="btn-primary text-xs py-2 px-3.5 font-semibold"
        >
          <PlusCircle className="w-3.5 h-3.5 text-amber-400" strokeWidth={2} />
          Publicar Nueva Vacante
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" strokeWidth={1.75} />
        <input
          type="text"
          placeholder="Buscar vacante por cargo o título..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400 shadow-subtle"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-5 font-semibold">Puesto / Vacante</th>
                <th className="py-3 px-3 font-semibold">Esquema</th>
                <th className="py-3 px-3 font-semibold">Salario</th>
                <th className="py-3 px-3 font-semibold">Postulados</th>
                <th className="py-3 px-3 font-semibold">Compatibilidad</th>
                <th className="py-3 px-3 font-semibold">Estado</th>
                <th className="py-3 px-5 text-right font-semibold">Gestión ATS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Briefcase className="w-10 h-10 mx-auto mb-3 text-slate-300" strokeWidth={1.5} />
                    <p className="text-sm font-semibold text-slate-700">
                      {searchTerm ? "No se encontraron vacantes con ese criterio" : "Aún no tienes vacantes publicadas"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      {searchTerm
                        ? "Intenta con otro término de búsqueda o limpia el filtro."
                        : "Crea tu primera oferta laboral corporativa para recibir aspirantes con verificación."}
                    </p>
                    {!searchTerm && (
                      <div className="mt-4">
                        <Link
                          href="/empresa/vacantes/nueva"
                          className="btn-primary text-xs py-2 px-4 inline-flex"
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-amber-400 mr-1.5" />
                          Publicar Primera Vacante
                        </Link>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((vac) => (
                  <tr key={vac.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{vac.title}</span>
                        {vac.is_urgent && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            <Zap className="w-2.5 h-2.5 fill-amber-500" />
                            Relevo Urgente
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {vac.zone} • Publicada el {vac.date}
                      </div>
                    </td>
                    <td className="py-4 px-3 font-mono text-slate-700 font-medium">
                      {vac.shift}
                    </td>
                    <td className="py-4 px-3 font-mono font-bold text-slate-900 tabular-nums">
                      ${vac.salary ? vac.salary.toLocaleString("es-CO") : "0"} COP
                    </td>
                    <td className="py-4 px-3">
                      <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {vac.applicants_count} postulados
                      </span>
                    </td>
                    <td className="py-4 px-3">
                      <span className="badge-emerald text-[11px] font-mono tabular-nums">
                        {vac.avg_match}% Match
                      </span>
                    </td>
                    <td className="py-4 px-3">
                      <span className="badge-emerald text-[10px] py-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {vac.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <Link
                        href={`/empresa/vacantes/${vac.id}`}
                        className="btn-primary text-xs py-1.5 px-3 font-semibold inline-flex"
                      >
                        Bandeja ATS ({vac.applicants_count})
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
