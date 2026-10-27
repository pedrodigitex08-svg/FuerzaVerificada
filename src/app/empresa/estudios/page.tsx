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
          let { data: comp } = await supabase
            .from("companies")
            .select("id, credits_security_studies")
            .eq("owner_id", user.id)
            .maybeSingle();

          // Auto-provisionar registro en public.companies si falta
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
              .select("id, credits_security_studies")
              .maybeSingle();

            if (createdComp) comp = createdComp;
          }

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

        // 1. Intentar consulta relacional con profiles
        let rawOrders: any[] = [];
        const { data, error } = await supabase
          .from("security_study_orders")
          .select("*, profiles(*)")
          .eq("company_id", currentCompanyId)
          .order("created_at", { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          rawOrders = data;
        } else {
          // 2. Respaldo anti-join resiliente: consulta directa sin JOIN
          const { data: directOrders } = await supabase
            .from("security_study_orders")
            .select("*")
            .eq("company_id", currentCompanyId)
            .order("created_at", { ascending: false });

          if (Array.isArray(directOrders)) {
            rawOrders = directOrders;
          }
        }

        if (rawOrders.length > 0) {
          const candIds = rawOrders.map((s: any) => s.candidate_id).filter(Boolean);
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

          const { data: profs } =
            candIds.length > 0
              ? await supabase
                  .from("profiles")
                  .select("id, full_name, phone_whatsapp")
                  .in("id", candIds)
              : { data: [] as any[] };
          const profMap = new Map((profs || []).map((p: any) => [p.id, p]));

          setOrders(
            rawOrders.map((s: any) => {
              const cpNat = natMap.get(s.candidate_id);
              const p = profMap.get(s.candidate_id);

              let candName = s.profiles?.full_name || p?.full_name;
              let candNatId = cpNat;

              if (!candName && typeof s.final_concept === "string") {
                const nameMatch = s.final_concept.match(/para\s+([^(\n]+?)\s*\(/i);
                if (nameMatch && nameMatch[1]) candName = nameMatch[1].trim();
              }
              if (!candNatId && typeof s.final_concept === "string") {
                const idMatch = s.final_concept.match(/C\.C\.\s*([^,\n]+)/i);
                if (idMatch && idMatch[1]) candNatId = idMatch[1].trim();
              }

              return {
                id: s.id,
                candidate_name: candName || "Aspirante en Evaluación",
                national_id: candNatId || "En verificación",
                job_title: s.study_type
                  ? s.study_type.replace(/_/g, " ").toUpperCase()
                  : "Estudio Solicitado",
                status: s.status as SecurityStudyStatus,
                scheduled_date: s.scheduled_date || "En programación",
                final_concept: s.final_concept || "En proceso de validación",
                report_pdf_url: s.report_pdf_url,
                created_at: new Date(s.created_at).toLocaleDateString("es-CO"),
              };
            })
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
      let activeCompanyId = companyId;
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!activeCompanyId && user) {
        let { data: comp } = await supabase
          .from("companies")
          .select("id, credits_security_studies")
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
            .select("id, credits_security_studies")
            .maybeSingle();

          if (createdComp) comp = createdComp;
        }

        if (comp?.id) {
          activeCompanyId = comp.id;
          setCompanyId(comp.id);
        }
      }

      // Resolver candidate_id si existe en candidate_profiles
      let resolvedCandId: string | null = null;
      const { data: candMatch } = await supabase
        .from("candidate_profiles")
        .select("user_id")
        .eq("national_id", formNationalId.trim())
        .maybeSingle();

      if (candMatch?.user_id) {
        resolvedCandId = candMatch.user_id;
      } else if (user?.id) {
        resolvedCandId = user.id;
      }

      let updatedCredits = credits;
      if (activeCompanyId && credits > 0) {
        updatedCredits = credits - 1;
        await supabase
          .from("companies")
          .update({ credits_security_studies: updatedCredits })
          .eq("id", activeCompanyId);
        setCredits(updatedCredits);
      }

      const isPolygraph =
        formStudyType.includes("poligrafo") || formStudyType.includes("combo");
      const isHomeVisit =
        formStudyType.includes("visita") || formStudyType.includes("combo");

      const newPayload = {
        company_id: activeCompanyId,
        candidate_id: resolvedCandId,
        study_type: formStudyType,
        include_polygraph: isPolygraph,
        include_home_visit: isHomeVisit,
        include_background_study: true,
        status: "solicitado" as SecurityStudyStatus,
        scheduled_date: "En programación pericial",
        final_concept: `Solicitud pericial de ${formStudyType.replace(/_/g, " ").toUpperCase()} para ${formCandName.trim()} (C.C. ${formNationalId.trim()}, Tel: ${formPhone.trim() || "N/A"}, Ciudad: ${formCity}). Obs: ${formNotes.trim() || "Sin observaciones adicionales."}`,
        report_pdf_url: null,
      };

      const { data: insertedOrder, error: insertErr } = await supabase
        .from("security_study_orders")
        .insert(newPayload)
        .select("*")
        .maybeSingle();

      if (insertErr) {
        console.error("Error creating security order:", insertErr);
      }

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
        <div className="p-4 rounded-2xl bg-[#0B3B70] text-white text-xs font-semibold flex items-center justify-between shadow-md border border-slate-700 animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" strokeWidth={2.5} />
            <span>{successToast}</span>
          </div>
        </div>
      )}

      {/* Header Estilo Computrabajo Empresas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Centro de Estudios de Seguridad & Poligrafía
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#005DA4] bg-[#EAF3FA] px-2.5 py-0.5 rounded-full border border-[#D5E6F5]">
              <Shield className="w-3 h-3 text-[#005DA4]" />
              Confiabilidad B2B
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Bandeja de dictámenes periciales: antecedentes judiciales, visitas domiciliarias y reportes de polígrafo.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white text-xs h-10 px-5 font-semibold flex items-center gap-2 transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4 text-white" strokeWidth={2} />
            <span>Solicitar Estudio / Polígrafo</span>
          </button>

          <Link
            href="/precios-empresas"
            className="rounded-full bg-[#EAF3FA] hover:bg-[#D5E6F5] text-[#0B3B70] border border-[#D5E6F5] text-xs h-10 px-4 font-semibold flex items-center gap-1.5 tabular-nums transition-colors shadow-2xs"
          >
            <Shield className="w-3.5 h-3.5 text-[#005DA4]" strokeWidth={2} />
            <span>Recargar Créditos ({credits} disp.)</span>
          </Link>
        </div>
      </div>

      {/* KPI BENTO STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-[#005DA4] transition-all">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Total Evaluados</span>
          <span className="text-2xl font-bold tracking-tight font-mono text-slate-900 tabular-nums mt-1 block">{orders.length}</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-[#005DA4] transition-all">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">En Proceso / Agendados</span>
          <span className="text-2xl font-bold tracking-tight font-mono text-amber-600 tabular-nums mt-1 block">
            {orders.filter((o) => o.status === "en_proceso" || o.status === "agendado" || o.status === "solicitado").length}
          </span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-[#005DA4] transition-all">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Aprobados Sin Riesgo</span>
          <span className="text-2xl font-bold tracking-tight font-mono text-emerald-700 tabular-nums mt-1 block">
            {orders.filter((o) => o.status === "aprobado").length}
          </span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-[#005DA4] transition-all">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Riesgo Detectado</span>
          <span className="text-2xl font-bold tracking-tight font-mono text-rose-600 tabular-nums mt-1 block">
            {orders.filter((o) => o.status === "rechazado_riesgo").length}
          </span>
        </div>
      </div>

      {/* FILTER & SEARCH EN PÍLDORA */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" strokeWidth={2} />
          <input
            type="text"
            placeholder="Buscar por aspirante o cédula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 bg-white border border-slate-300 rounded-full pl-11 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 shadow-2xs transition-all"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto w-full sm:w-auto scrollbar-none">
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
              className={`h-10 px-4 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                selectedFilter === f.key
                  ? "bg-[#0B3B70] text-white border-[#0B3B70] shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:border-[#005DA4] hover:bg-[#EAF3FA]/30"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ORDERS LIST OR CLEAN EMPTY STATE */}
      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-2xs">
          <div className="w-8 h-8 border-2 border-[#0B3B70] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-600">Cargando estudios periciales...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-2xs">
          <Shield className="w-10 h-10 mx-auto mb-3 text-slate-300" strokeWidth={1.5} />
          <h3 className="text-base font-bold tracking-tight text-slate-900">
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
                className="rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white text-xs h-9 px-5 font-semibold inline-flex items-center gap-2 shadow-xs transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5 text-white" />
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
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4 hover:border-[#005DA4] transition-all"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-base font-bold tracking-tight text-slate-900">
                      {order.candidate_name}
                    </h3>
                    <span className="text-xs font-mono text-slate-500 tabular-nums">
                      C.C. {order.national_id}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        order.status === "aprobado"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : order.status === "rechazado_riesgo"
                          ? "bg-rose-50 text-rose-800 border-rose-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full inline-block mr-1.5 ${
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
                  <div className="text-xs text-slate-500 mt-1 tabular-nums">
                    Vacante: <strong className="text-slate-800 font-semibold">{order.job_title}</strong> • Solicitud: {order.created_at}
                  </div>
                </div>

                {order.report_pdf_url && (
                  <button
                    type="button"
                    onClick={() => openSecureDocument(order.report_pdf_url)}
                    className="rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs h-9 px-4 font-semibold self-start sm:self-auto inline-flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2} />
                    Descargar Dictamen (PDF)
                  </button>
                )}
              </div>

              {/* Final Concept Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                  Dictamen Técnico del Analista:
                </span>
                <p className="text-slate-700 leading-relaxed font-medium">
                  {order.final_concept}
                </p>
                <div className="text-[11px] text-slate-500 pt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{order.scheduled_date}</span>
                </div>
              </div>

              {/* Checklist of sub-services completed */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-100 text-slate-600 font-semibold">
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl p-7 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EAF3FA] border border-[#D5E6F5] text-[#0B3B70] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#005DA4]" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight text-slate-900">
                    Solicitar Estudio de Seguridad & Poligrafía
                  </h3>
                  <p className="text-xs text-slate-500 tabular-nums">
                    {credits > 0
                      ? `Créditos disponibles: ${credits} estudio(s)`
                      : "Sin créditos disponibles • Se registrará en estado solicitado"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nombre Completo del Evaluado *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Carlos Andrés Gómez"
                    value={formCandName}
                    onChange={(e) => setFormCandName(e.target.value)}
                    className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Cédula de Ciudadanía *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. 1020304050"
                      value={formNationalId}
                      onChange={(e) => setFormNationalId(e.target.value)}
                      className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 font-mono tabular-nums transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Teléfono / WhatsApp
                    </label>
                    <input
                      type="tel"
                      placeholder="Ej. 3101234567"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 font-mono tabular-nums transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Tipo de Servicio
                    </label>
                    <select
                      value={formStudyType}
                      onChange={(e) => setFormStudyType(e.target.value)}
                      className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all cursor-pointer"
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Ciudad de Evaluación
                    </label>
                    <input
                      type="text"
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Observaciones o Puesto a Asignar
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej. Vacante de guarda con moto en Suba. Urgente para asignación de puesto."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all"
                  />
                </div>
              </div>

              {credits <= 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                  <span>Tu cuenta no tiene créditos prepagados activos.</span>
                  <Link
                    href="/precios-empresas"
                    className="font-bold underline text-amber-800 hover:text-amber-900 ml-2"
                  >
                    Ver Paquetes B2B
                  </Link>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs h-10 px-5 font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingOrder}
                  className="rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white text-xs h-10 px-6 font-semibold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submittingOrder ? (
                    <span>Registrando orden...</span>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 text-[#FFE066]" />
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
