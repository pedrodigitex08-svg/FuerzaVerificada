"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  FileCheck2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  Calendar,
  Building2,
  User,
  ExternalLink,
  Download,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { DemoSecurityOrder, initializeSeedData } from "@/lib/utils/seedData";
import { SecurityStudyStatus } from "@/types/database";
import { AdminStudyDrawerModal } from "@/components/admin/AdminStudyDrawerModal";

export default function AdminEstudiosPage() {
  const [orders, setOrders] = useState<DemoSecurityOrder[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrderForDrawer, setSelectedOrderForDrawer] = useState<DemoSecurityOrder | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Initialize data from seed or localStorage
  useEffect(() => {
    const { orders: seededOrders } = initializeSeedData(false);
    setOrders(seededOrders);
  }, []);

  // Save updated order
  const handleSaveOrder = (updated: DemoSecurityOrder) => {
    const updatedList = orders.map((o) => (o.id === updated.id ? updated : o));
    setOrders(updatedList);
    if (typeof window !== "undefined") {
      localStorage.setItem("fv_security_orders", JSON.stringify(updatedList));
    }
    setNotification(`¡Orden #${updated.id} actualizada! El dictamen ya está disponible para ${updated.company_name}.`);
    setTimeout(() => setNotification(null), 4000);
  };

  // KPI calculations
  const totalOrders = orders.length;
  const pendingScheduling = orders.filter((o) => o.status === "solicitado").length;
  const inEvaluation = orders.filter((o) => o.status === "agendado" || o.status === "en_proceso").length;
  const completedApproved = orders.filter((o) => o.status === "aprobado").length;
  const completedRejected = orders.filter((o) => o.status === "rechazado_riesgo").length;

  // Filtered list
  const filteredOrders = orders.filter((order) => {
    const matchesFilter = selectedFilter === "todos" || order.status === selectedFilter;
    const matchesSearch =
      order.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.national_id.includes(searchTerm) ||
      order.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.job_title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: SecurityStudyStatus) => {
    switch (status) {
      case "solicitado":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Solicitado
          </span>
        );
      case "agendado":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Agendado
          </span>
        );
      case "en_proceso":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            En Proceso
          </span>
        );
      case "aprobado":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Aprobado Sin Riesgo
          </span>
        );
      case "rechazado_riesgo":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Riesgo Identificado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center justify-between border border-slate-800 shadow-elevated animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white text-xs ml-4"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Bandeja Operativa: Estudios de Seguridad, Visita y Poligrafía
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            Gestión centralizada de investigaciones de antecedentes, verificación domiciliaria y emisión de dictámenes periciales de poligrafía.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const { orders: reloaded } = initializeSeedData(true);
              setOrders(reloaded);
              setNotification("Datos de órdenes restaurados a valores de fábrica.");
            }}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            title="Recargar órdenes"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
            <span>Sincronizar</span>
          </button>
        </div>
      </div>

      {/* KPI BENTO GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Órdenes</span>
            <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <FileCheck2 className="w-4 h-4" strokeWidth={1.75} />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            {totalOrders}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Radicadas por empresas</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Por Agendar</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Clock className="w-4 h-4" strokeWidth={1.75} />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-600 tabular-nums">
            {pendingScheduling}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Requieren cita inmediata</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">En Evaluación</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Shield className="w-4 h-4" strokeWidth={1.75} />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 tabular-nums">
            {inEvaluation}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">En polígrafo o visita</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Dictámenes Listos</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 tabular-nums">
            {completedApproved}{" "}
            <span className="text-xs font-normal text-rose-500">({completedRejected} no aptos)</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Informes emitidos</p>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
              strokeWidth={1.75}
            />
            <input
              type="text"
              placeholder="Buscar por candidato, cédula, empresa o cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
            />
          </div>

          {/* Status Filter Chips */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            {[
              { id: "todos", label: "Todos", count: totalOrders },
              { id: "solicitado", label: "Solicitados", count: pendingScheduling },
              { id: "agendado", label: "Agendados", count: orders.filter((o) => o.status === "agendado").length },
              { id: "en_proceso", label: "En Proceso", count: orders.filter((o) => o.status === "en_proceso").length },
              { id: "aprobado", label: "Aprobados", count: completedApproved },
              { id: "rechazado_riesgo", label: "Con Riesgo", count: completedRejected },
            ].map((chip) => {
              const active = selectedFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => setSelectedFilter(chip.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    active
                      ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span>{chip.label}</span>
                  <span
                    className={`ml-1.5 text-[10px] tabular-nums font-mono px-1.5 py-0.2 rounded ${
                      active ? "bg-slate-800 text-amber-300" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {chip.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* HIGH DENSITY ORDERS TABLE */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Candidato / Documento</th>
                <th className="py-3 px-4">Empresa Solicitante</th>
                <th className="py-3 px-4">Alcance</th>
                <th className="py-3 px-4">Estado del Estudio</th>
                <th className="py-3 px-4">Cita / Avance</th>
                <th className="py-3 px-4">Informe PDF</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No se encontraron órdenes para este filtro o criterio de búsqueda.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrderForDrawer(order)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Candidate */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {order.candidate_name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        CC. {order.national_id} • {order.job_title}
                      </div>
                    </td>

                    {/* Company */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {order.company_name}
                      </div>
                    </td>

                    {/* Scope */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          Antecedentes
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          Visita
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200/60">
                          Polígrafo
                        </span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>

                    {/* Scheduled Date / Progress */}
                    <td className="py-3 px-4 text-slate-600 max-w-xs">
                      <div className="truncate text-xs font-medium">
                        {order.scheduled_date || "Por agendar"}
                      </div>
                    </td>

                    {/* PDF Report */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {order.report_pdf_url ? (
                        <a
                          href={order.report_pdf_url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Descargar PDF</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-normal">
                          Pendiente
                        </span>
                      )}
                    </td>

                    {/* Action Button */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrderForDrawer(order);
                        }}
                        className="btn-secondary text-[11px] py-1 px-3 group-hover:border-slate-400"
                      >
                        Gestionar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DRAWER MODAL FOR MANAGING AND QUALIFYING STUDY */}
      <AdminStudyDrawerModal
        order={selectedOrderForDrawer}
        onClose={() => setSelectedOrderForDrawer(null)}
        onSaveOrder={handleSaveOrder}
      />
    </div>
  );
}
