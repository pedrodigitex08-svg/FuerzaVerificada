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
            data.map((j: any) => ({
              id: j.id,
              title: j.title,
              role: formatSecurityRoleLabel(j.role_required),
              shift: j.shift || "Turno rotativo",
              salary: j.salary_monthly || 0,
              zone: j.zone_neighborhood || j.city || "Colombia",
              applicants_count: j.applications?.[0]?.count ?? 0,
              avg_match: 90,
              is_urgent: !!j.is_urgent_relief,
              status: j.is_active ? "Activa" : "Pausada",
              date: new Date(j.created_at).toLocaleDateString("es-CO"),
            }))
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

  const filtered = vacancies.filter(
    (v) =>
      v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            Mis Vacantes Publicadas & Bandejas ATS
          </h1>
          <p className="text-xs text-slate-600 font-normal">
            Administre ofertas laborales, revise postulados calificados y solicite poligrafía en 1 clic.
          </p>
        </div>

        <Link
          href="/empresa/vacantes/nueva"
          className="btn-primary text-xs h-9 px-3.5 font-medium"
        >
          <PlusCircle className="w-3.5 h-3.5 text-slate-300" strokeWidth={1.75} />
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
                <th className="py-3 px-3 font-medium">Compatibilidad</th>
                <th className="py-3 px-3 font-medium">Estado</th>
                <th className="py-3 px-5 text-right font-medium">Gestión ATS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
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
                          className="btn-primary text-xs h-9 px-4 inline-flex"
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-slate-300 mr-1.5" />
                          Publicar mi primera vacante
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
                        <span className="font-semibold text-slate-900">{vac.title}</span>
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
                      <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md tabular-nums">
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
                        className="btn-primary text-xs h-8 px-3 font-medium inline-flex tabular-nums"
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
