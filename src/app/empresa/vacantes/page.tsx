"use client";

import { useState } from "react";
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

const DEMO_VACANCIES = [
  {
    id: "job-1",
    title: "Vigilante Fijo - Centro Empresarial Calle 100",
    role: "Vigilante Fijo",
    shift: "2x2x2",
    salary: 1950000,
    zone: "Chicó / Calle 100",
    applicants_count: 8,
    avg_match: 92,
    is_urgent: true,
    status: "Activa",
    date: "21 Oct 2026",
  },
  {
    id: "job-2",
    title: "Supervisor Motorizado - Zona Industrial",
    role: "Supervisor Motorizado",
    shift: "4x2",
    salary: 2450000,
    zone: "Fontibón",
    applicants_count: 5,
    avg_match: 88,
    is_urgent: false,
    status: "Activa",
    date: "19 Oct 2026",
  },
  {
    id: "job-3",
    title: "Escolta VIP para Esquema Ejecutivo",
    role: "Escolta VIP",
    shift: "6x1",
    salary: 3200000,
    zone: "Usaquén",
    applicants_count: 6,
    avg_match: 86,
    is_urgent: true,
    status: "Activa",
    date: "17 Oct 2026",
  },
];

export default function EmpresaVacantesListPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = DEMO_VACANCIES.filter(
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
              {filtered.map((vac) => (
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
                    ${vac.salary.toLocaleString("es-CO")} COP
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
