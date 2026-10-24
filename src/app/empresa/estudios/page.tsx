"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  FileCheck,
  Download,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  ExternalLink,
  MessageCircle,
  Building2,
} from "lucide-react";
import { SecurityStudyStatus } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { openSecureDocument } from "@/lib/utils/storageSecurity";

interface SecurityOrder {
  id: string;
  candidate_name: string;
  national_id: string;
  job_title: string;
  status: SecurityStudyStatus;
  scheduled_date: string;
  final_concept: string;
  report_pdf_url: string | null;
  created_at: string;
}

export default function EmpresaEstudiosPage() {
  const [orders, setOrders] = useState<SecurityOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("todos");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSecurityOrders() {
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

        let sQuery = supabase
          .from("security_study_orders")
          .select("*, profiles(*)")
          .order("created_at", { ascending: false });

        if (currentCompanyId) {
          sQuery = sQuery.eq("company_id", currentCompanyId);
        }

        const { data, error } = await sQuery;

        if (!error && data && data.length > 0) {
          const candIds = data.map((s: any) => s.candidate_id).filter(Boolean);
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

          setOrders(
            data.map((s: any) => ({
              id: s.id,
              candidate_name: s.profiles?.full_name || "Aspirante",
              national_id: natMap.get(s.candidate_id) || "En verificación",
              job_title: s.study_type
                ? s.study_type.replace(/_/g, " ").toUpperCase()
                : "Estudio Solicitado",
              status: s.status as SecurityStudyStatus,
              scheduled_date: s.scheduled_date || "En programación",
              final_concept: s.final_concept || "En proceso de validación",
              report_pdf_url: s.report_pdf_url,
              created_at: new Date(s.created_at).toLocaleDateString("es-CO"),
            }))
          );
        } else if (typeof window !== "undefined") {
          const stored = localStorage.getItem("fv_security_orders");
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setOrders(parsed);
              } else {
                setOrders([]);
              }
            } catch {
              setOrders([]);
            }
          } else {
            setOrders([]);
          }
        }
      } catch (err) {
        console.error("Error loading security study orders:", err);
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadSecurityOrders();
  }, []);

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.national_id.includes(searchTerm) ||
      o.job_title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = selectedFilter === "todos" || o.status === selectedFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Centro de Estudios de Seguridad & Poligrafía
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            Bandeja de dictámenes periciales: antecedentes judiciales, visitas domiciliarias y reportes de polígrafo.
          </p>
        </div>

        <Link
          href="/precios-empresas"
          className="btn-amber text-xs py-2 px-3.5 font-bold"
        >
          <Shield className="w-3.5 h-3.5" strokeWidth={2} />
          Recargar Créditos de Poligrafía
        </Link>
      </div>

      {/* KPI BENTO STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-subtle">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Evaluados</span>
          <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">{orders.length}</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-subtle">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">En Proceso / Agendados</span>
          <span className="text-2xl font-bold font-mono text-amber-600 tabular-nums">
            {orders.filter((o) => o.status === "en_proceso" || o.status === "agendado" || o.status === "solicitado").length}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-subtle">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Aprobados Sin Riesgo</span>
          <span className="text-2xl font-bold font-mono text-emerald-600 tabular-nums">
            {orders.filter((o) => o.status === "aprobado").length}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-subtle">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Riesgo Detectado</span>
          <span className="text-2xl font-bold font-mono text-rose-600 tabular-nums">
            {orders.filter((o) => o.status === "rechazado_riesgo").length}
          </span>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" strokeWidth={1.75} />
          <input
            type="text"
            placeholder="Buscar por aspirante o cédula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400 shadow-subtle"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { key: "todos", label: "Todos" },
            { key: "aprobado", label: "Aprobados" },
            { key: "en_proceso", label: "En Proceso" },
            { key: "rechazado_riesgo", label: "Riesgo Detectado" },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setSelectedFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition-all ${
                selectedFilter === f.key
                  ? "bg-slate-900 text-white border-slate-900 font-semibold shadow-subtle"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ORDERS LIST OR CLEAN EMPTY STATE */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center shadow-subtle">
          <Shield className="w-12 h-12 mx-auto mb-3 text-slate-300" strokeWidth={1.5} />
          <h3 className="text-base font-bold text-slate-800">
            {searchTerm || selectedFilter !== "todos"
              ? "No se encontraron evaluaciones con ese criterio"
              : "Aún no tienes evaluaciones de confiabilidad registradas"}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {searchTerm || selectedFilter !== "todos"
              ? "Intenta con otro número de documento o cambia el filtro de estado."
              : "Solicita estudios de seguridad, antecedentes periciales o pruebas de poligrafía para tus aspirantes desde la bandeja ATS de tus vacantes."}
          </p>
          {!searchTerm && selectedFilter === "todos" && (
            <div className="mt-4">
              <Link
                href="/empresa/vacantes"
                className="btn-primary text-xs py-2 px-4 inline-flex"
              >
                Ir a Mis Vacantes
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-subtle space-y-4 hover:border-slate-300 transition-all"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold text-slate-900">
                      {order.candidate_name}
                    </h3>
                    <span className="text-xs font-mono text-slate-400">
                      C.C. {order.national_id}
                    </span>
                    <span
                      className={`badge-${
                        order.status === "aprobado"
                          ? "emerald"
                          : order.status === "rechazado_riesgo"
                          ? "rose"
                          : "amber"
                      } text-[11px]`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          order.status === "aprobado"
                            ? "bg-emerald-500"
                            : order.status === "rechazado_riesgo"
                            ? "bg-rose-500"
                            : "bg-amber-500"
                        }`}
                      />
                      {order.status === "aprobado"
                        ? "Aprobado Sin Riesgo"
                        : order.status === "rechazado_riesgo"
                        ? "Riesgo Detectado"
                        : "En Proceso Pericial"}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Vacante: <strong>{order.job_title}</strong> • Solicitud: {order.created_at}
                  </div>
                </div>

                {order.report_pdf_url && (
                  <button
                    type="button"
                    onClick={() => openSecureDocument(order.report_pdf_url)}
                    className="btn-secondary text-xs py-2 px-3.5 font-semibold text-amber-800 hover:text-amber-900 self-start sm:self-auto"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.75} />
                    Descargar Informe Confidencial (PDF)
                  </button>
                )}
              </div>

              {/* Final Concept Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                  Dictamen Técnico del Analista:
                </span>
                <p className="text-slate-700 leading-relaxed font-normal">
                  {order.final_concept}
                </p>
                <div className="text-[11px] text-slate-500 pt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{order.scheduled_date}</span>
                </div>
              </div>

              {/* Checklist of sub-services completed */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-100 text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Antecedentes & SuperVigilancia</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Visita Domiciliaria con Fotos</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Examen Poligráfico APA</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
