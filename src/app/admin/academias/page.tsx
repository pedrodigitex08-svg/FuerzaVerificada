"use client";

import { useState, useEffect } from "react";
import {
  GraduationCap,
  Plus,
  Search,
  MessageCircle,
  ExternalLink,
  CheckCircle2,
  XCircle,
  MapPin,
  Sparkles,
  Edit2,
  Trash2,
  Phone,
  Tag,
  Check,
  X,
  TrendingUp,
} from "lucide-react";
import { PartnerAcademy } from "@/types/database";
import { INITIAL_DEMO_ACADEMIES, initializeSeedData } from "@/lib/utils/seedData";
import { generateAcademyRenewalLink } from "@/lib/utils/whatsappTemplates";
import { createClient } from "@/lib/supabase/client";

export default function AdminAcademiasPage() {
  const [academies, setAcademies] = useState<PartnerAcademy[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAcademy, setEditingAcademy] = useState<PartnerAcademy | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [city, setCity] = useState("Bogotá D.C.");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [discountText, setDiscountText] = useState("15% Descuento Convenio FuerzaVerificada");
  const [referralCode, setReferralCode] = useState("FUERZA2026");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    async function loadAcademies() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("partner_academies")
          .select("*")
          .order("name", { ascending: true });

        if (!error && data && data.length > 0) {
          setAcademies(data as PartnerAcademy[]);
          return;
        }
      } catch {}

      const { academies: seededAcademies } = initializeSeedData(false);
      setAcademies(seededAcademies);
    }

    loadAcademies();
  }, []);

  const syncAcademies = (updated: PartnerAcademy[]) => {
    setAcademies(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("fv_partner_academies", JSON.stringify(updated));
    }
  };

  const handleOpenCreate = () => {
    setEditingAcademy(null);
    setName("");
    setCity("Bogotá D.C.");
    setWhatsappNumber("");
    setDiscountText("15% Descuento Convenio FuerzaVerificada");
    setReferralCode("FUERZA2026");
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acad: PartnerAcademy) => {
    setEditingAcademy(acad);
    setName(acad.name);
    setCity(acad.city);
    setWhatsappNumber(acad.whatsapp_number);
    setDiscountText(acad.discount_text);
    setReferralCode(acad.referral_code);
    setIsActive(acad.is_active);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (acadId: string) => {
    let nextActiveForDb = false;
    const updated = academies.map((a) => {
      if (a.id === acadId) {
        const next = !a.is_active;
        nextActiveForDb = next;
        setNotification(
          next
            ? `Convenio con "${a.name}" activado. Los guardas en ${a.city} serán redirigidos a su WhatsApp.`
            : `Convenio con "${a.name}" pausado temporalmente.`
        );
        return { ...a, is_active: next };
      }
      return a;
    });
    syncAcademies(updated);

    try {
      const supabase = createClient();
      await supabase
        .from("partner_academies")
        .update({ is_active: nextActiveForDb })
        .eq("id", acadId);
    } catch {}

    setTimeout(() => setNotification(null), 3500);
  };

  const handleSaveAcademy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !whatsappNumber) return;

    const supabase = createClient();

    if (editingAcademy) {
      const updated = academies.map((a) =>
        a.id === editingAcademy.id
          ? {
              ...a,
              name,
              city,
              whatsapp_number: whatsappNumber,
              discount_text: discountText,
              referral_code: referralCode,
              is_active: isActive,
            }
          : a
      );
      syncAcademies(updated);

      try {
        await supabase
          .from("partner_academies")
          .update({
            name,
            city,
            whatsapp_number: whatsappNumber,
            discount_text: discountText,
            referral_code: referralCode,
            is_active: isActive,
          })
          .eq("id", editingAcademy.id);
      } catch {}

      setNotification(`Academia "${name}" actualizada correctamente.`);
    } else {
      const newAcad: PartnerAcademy = {
        id: `acad-${Date.now()}`,
        name,
        city,
        whatsapp_number: whatsappNumber,
        discount_text: discountText,
        referral_code: referralCode,
        is_active: isActive,
      };

      try {
        const { data: inserted } = await supabase
          .from("partner_academies")
          .insert({
            name,
            city,
            whatsapp_number: whatsappNumber,
            discount_text: discountText,
            referral_code: referralCode,
            is_active: isActive,
          })
          .select("*")
          .maybeSingle();

        if (inserted) {
          newAcad.id = inserted.id;
        }
      } catch {}

      const updated = [newAcad, ...academies];
      syncAcademies(updated);
      setNotification(`Nueva academia "${name}" registrada en el convenio.`);
    }

    setIsModalOpen(false);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleDeleteAcademy = async (acadId: string, acadName: string) => {
    if (!confirm(`¿Eliminar la academia "${acadName}" del listado de convenios?`)) return;
    const updated = academies.filter((a) => a.id !== acadId);
    syncAcademies(updated);

    try {
      const supabase = createClient();
      await supabase.from("partner_academies").delete().eq("id", acadId);
    } catch {}

    setNotification(`Academia "${acadName}" eliminada del sistema.`);
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredAcademies = academies.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.referral_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            Red de Academias de Vigilancia Aliadas
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            Centros de capacitación autorizados por SuperVigilancia donde el Semáforo del Curso redirige a guardas con curso vencido o próximo a vencer.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          <span>Añadir Academia Aliada</span>
        </button>
      </div>

      {/* KPI BENTO GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Convenios Activos</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            {academies.filter((a) => a.is_active).length}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Recibiendo alumnos hoy</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Ciudades Con Cobertura</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <MapPin className="w-4 h-4" strokeWidth={1.75} />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-600 tabular-nums">
            {new Set(academies.map((a) => a.city)).size} Ciudades
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Red nacional autorizada</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Descuento Promedio</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Tag className="w-4 h-4" strokeWidth={1.75} />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 tabular-nums">
            15% - 20%
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Ahorro para el guarda</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Leads Derivados</span>
            <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <TrendingUp className="w-4 h-4" strokeWidth={1.75} />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            0
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Desde el Semáforo este mes</p>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full max-w-md">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
            strokeWidth={1.75}
          />
          <input
            type="text"
            placeholder="Buscar por Nombre de academia, Ciudad o Código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Mostrando <strong className="text-slate-800">{filteredAcademies.length}</strong> de{" "}
          {academies.length} convenios
        </div>
      </div>

      {/* ACADEMIES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAcademies.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            No se encontraron academias aliadas con ese criterio.
          </div>
        ) : (
          filteredAcademies.map((acad) => {
            const testWhatsAppLink = generateAcademyRenewalLink({
              academyPhone: acad.whatsapp_number,
              academyName: acad.name,
              candidateName: "Guarda Candidato (Prueba)",
              city: acad.city,
              referralCode: acad.referral_code,
              discountText: acad.discount_text,
            });

            return (
              <div
                key={acad.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-subtle flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors"
              >
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                        <GraduationCap className="w-4 h-4" strokeWidth={1.75} />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 leading-tight">
                          {acad.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {acad.city}
                        </p>
                      </div>
                    </div>

                    {/* Active toggle badge */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(acad.id)}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border flex items-center gap-1 transition-all ${
                        acad.is_active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                      title="Clic para pausar o reactivar convenio"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          acad.is_active ? "bg-emerald-500" : "bg-slate-400"
                        }`}
                      />
                      <span>{acad.is_active ? "Activo" : "Pausado"}</span>
                    </button>
                  </div>

                  {/* Benefit / Discount Box */}
                  <div className="mt-3.5 p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 text-xs">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800">
                      <Tag className="w-3 h-3 text-amber-600" />
                      <span>Beneficio para Guardas:</span>
                    </div>
                    <p className="text-slate-800 font-medium mt-0.5">{acad.discount_text}</p>
                    <div className="mt-1.5 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Código Promocional:</span>
                      <span className="font-mono font-bold text-amber-900 px-1.5 py-0.5 rounded bg-amber-100">
                        {acad.referral_code}
                      </span>
                    </div>
                  </div>

                  {/* WhatsApp contact */}
                  <div className="mt-3 text-xs text-slate-600 flex items-center justify-between">
                    <span className="text-slate-400">Recepción de Leads:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      +57 {acad.whatsapp_number}
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <a
                    href={testWhatsAppLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary text-[11px] py-1.5 px-2.5 flex-1 inline-flex items-center justify-center gap-1.5 text-emerald-800 hover:bg-emerald-50 border-emerald-200"
                    title="Probar mensaje que recibiría la academia por WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.75} />
                    <span>Probar Link WA</span>
                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                  </a>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(acad)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                      title="Editar academia"
                    >
                      <Edit2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAcademy(acad.id, acad.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Eliminar convenio"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveAcademy}
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-elevated p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingAcademy ? "Editar Convenio con Academia" : "Registrar Nueva Academia Aliada"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Redirección de reentrenamiento y cursos de seguridad
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Nombre de la Academia / Centro de Capacitación *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Escuela de Vigilancia Cóndor Andino"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Ciudad de Operación
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="Bogotá D.C.">Bogotá D.C.</option>
                    <option value="Medellín">Medellín</option>
                    <option value="Cali">Cali</option>
                    <option value="Barranquilla">Barranquilla</option>
                    <option value="Bucaramanga">Bucaramanga</option>
                    <option value="Cartagena">Cartagena</option>
                    <option value="Pereira">Pereira</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    WhatsApp para Recepción de Leads *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="3150000000"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Texto del Beneficio / Descuento para el Guarda
                </label>
                <input
                  type="text"
                  placeholder="Ej. 15% Descuento Convenio FuerzaVerificada"
                  value={discountText}
                  onChange={(e) => setDiscountText(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Código de Convenio / Referido
                  </label>
                  <input
                    type="text"
                    placeholder="FUERZA2026"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                    />
                    <span className="font-semibold text-slate-800">Convenio Activo Inmediato</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn-secondary w-1/3 text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary w-2/3 text-xs font-bold"
              >
                {editingAcademy ? "Actualizar Convenio" : "Registrar Academia"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
