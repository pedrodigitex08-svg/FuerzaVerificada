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
  PlusCircle,
  X,
  Sparkles,
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
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("todos");
  const [isLoading, setIsLoading] = useState(true);

  // Modal State for new study request
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formCandName, setFormCandName] = useState("");
  const [formNationalId, setFormNationalId] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formStudyType, setFormStudyType] = useState("combo_integral_poligrafo_visita");
  const [formCity, setFormCity] = useState("Bogotá D.C.");
  const [formNotes, setFormNotes] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

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
            .select("id, credits_security_studies")
            .eq("owner_id", user.id)
            .maybeSingle();
          if (comp?.id) {
            currentCompanyId = comp.id;
            setCompanyId(comp.id);
            setCredits(Number(comp.credits_security_studies ?? 0));
          }
        }

        if (!currentCompanyId) {
          setOrders([]);
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("security_study_orders")
          .select("*, profiles(*)")
          .eq("company_id", currentCompanyId)
          .order("created_at", { ascending: false });

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
        } else {
          setOrders([]);
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

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCandName.trim() || !formNationalId.trim()) return;

    setSubmittingOrder(true);
    const supabase = createClient();

    try {
      let updatedCredits = credits;
      if (companyId && credits > 0) {
        updatedCredits = credits - 1;
        await supabase
          .from("companies")
          .update({ credits_security_studies: updatedCredits })
          .eq("id", companyId);
        setCredits(updatedCredits);
      }

      const newPayload = {
        company_id: companyId,
        study_type: formStudyType,
        status: "solicitado" as SecurityStudyStatus,
        scheduled_date: "En programación pericial",
        final_concept: `Solicitud pericial de ${formStudyType.replace(/_/g, " ").toUpperCase()} para ${formCandName.trim()} (C.C. ${formNationalId.trim()}, Tel: ${formPhone.trim() || "N/A"}, Ciudad: ${formCity}). Obs: ${formNotes.trim() || "Sin observaciones adicionales."}`,
        report_pdf_url: null,
      };

      const { data: insertedOrder } = await supabase
        .from("security_study_orders")
        .insert(newPayload)
        .select("*")
        .maybeSingle();

      const newOrderItem: SecurityOrder = {
        id: insertedOrder?.id || `order-${Date.now()}`,
        candidate_name: formCandName.trim(),
        national_id: formNationalId.trim(),
        job_title: formStudyType.replace(/_/g, " ").toUpperCase(),
        status: "solicitado",
        scheduled_date: "En programación pericial",
        final_concept: `Solicitud pericial registrada. Obs: ${formNotes.trim() || "Sin observaciones."}`,
        report_pdf_url: null,
        created_at: new Date().toLocaleDateString("es-CO"),
      };

      setOrders((prev) => [newOrderItem, ...prev]);

      if (typeof window !== "undefined") {
        localStorage.setItem("fv_company_credits", updatedCredits.toString());
      }

      setIsModalOpen(false);
      setFormCandName("");
      setFormNationalId("");
      setFormPhone("");
      setFormNotes("");
      setSuccessToast(`Estudio solicitado con éxito para ${formCandName.trim()}`);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err) {
      console.error("Error creating security order:", err);
    } finally {
      setSubmittingOrder(false);
    }
  };

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
      {/* Toast Feedback */}
      {successToast && (
        <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center justify-between shadow-elevated border border-slate-700 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" strokeWidth={2} />
            <span>{successToast}</span>
          </div>
        </div>
      )}

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

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="btn-primary text-xs py-2 px-3.5 font-bold flex items-center gap-1.5 shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Solicitar Estudio / Polígrafo</span>
          </button>

          <Link
            href="/precios-empresas"
            className="btn-amber text-xs py-2 px-3.5 font-bold flex items-center gap-1.5"
          >
            <Shield className="w-3.5 h-3.5" strokeWidth={2} />
            <span>Recargar Créditos ({credits} disp.)</span>
          </Link>
        </div>
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
              : "No has solicitado estudios de confiabilidad ni pruebas de poligrafía todavía"}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {searchTerm || selectedFilter !== "todos"
              ? "Intenta con otro número de documento o cambia el filtro de estado."
              : "Solicita estudios de seguridad, antecedentes periciales o pruebas de poligrafía para tus aspirantes desde este panel o directamente desde la bandeja ATS de tus vacantes."}
          </p>
          {!searchTerm && selectedFilter === "todos" && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Solicitar mi primer estudio</span>
              </button>
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

      {/* MODAL SOLICITUD DE NUEVO ESTUDIO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-elevated p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                  <Shield className="w-5 h-5 fill-amber-500/10" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Solicitar Estudio de Seguridad & Poligrafía
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {credits > 0
                      ? `Créditos disponibles: ${credits} estudio(s)`
                      : "Sin créditos disponibles • Se registrará en estado solicitado"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre Completo del Evaluado *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Carlos Andrés Gómez"
                    value={formCandName}
                    onChange={(e) => setFormCandName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cédula de Ciudadanía *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. 1020304050"
                      value={formNationalId}
                      onChange={(e) => setFormNationalId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Teléfono / WhatsApp
                    </label>
                    <input
                      type="tel"
                      placeholder="Ej. 3101234567"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tipo de Servicio
                    </label>
                    <select
                      value={formStudyType}
                      onChange={(e) => setFormStudyType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                    >
                      <option value="combo_integral_poligrafo_visita">
                        Combo Integral (Polígrafo + Visita + Antecedentes)
                      </option>
                      <option value="poligrafia_preempleo">
                        Poligrafía Pre-empleo
                      </option>
                      <option value="visita_domiciliaria">
                        Visita Domiciliaria con Fotos
                      </option>
                      <option value="estudio_antecedentes">
                        Estudio de Seguridad y Antecedentes
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Ciudad de Evaluación
                    </label>
                    <input
                      type="text"
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Observaciones o Puesto a Asignar
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej. Vacante de guarda con moto en Suba. Urgente para asignación de puesto."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              {credits <= 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                  <span>Tu cuenta no tiene créditos prepagados activos.</span>
                  <Link
                    href="/precios-empresas"
                    className="font-bold underline text-amber-700 hover:text-amber-800 ml-2"
                  >
                    Ver Paquetes B2B
                  </Link>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary text-xs py-2 px-3.5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingOrder}
                  className="btn-primary text-xs py-2 px-4 font-bold flex items-center gap-1.5"
                >
                  {submittingOrder ? (
                    <span>Registrando orden...</span>
                  ) : (
                    <>
                      <Shield className="w-3.5 h-3.5" />
                      <span>Confirmar y Enviar Orden</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
