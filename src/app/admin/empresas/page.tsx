"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Shield,
  CheckCircle2,
  XCircle,
  Plus,
  Coins,
  Sparkles,
  ExternalLink,
  Search,
  BadgeCheck,
  AlertCircle,
  Check,
  X,
  CreditCard,
  Phone,
  MapPin,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Company } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

export default function AdminEmpresasPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompanyForRecharge, setSelectedCompanyForRecharge] = useState<Company | null>(null);
  const [selectedCompanyForDetails, setSelectedCompanyForDetails] = useState<Company | null>(null);
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Recharge Modal State
  const [selectedPlan, setSelectedPlan] = useState<string>("pack_operativo");
  const [creditAmount, setCreditAmount] = useState<number>(5);
  const [isProcessing, setIsProcessing] = useState(false);

  // New Company Form State
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyNit, setNewCompanyNit] = useState("");
  const [newCompanyLicense, setNewCompanyLicense] = useState("");
  const [newCompanyCity, setNewCompanyCity] = useState("Bogotá D.C.");
  const [newCompanyContact, setNewCompanyContact] = useState("");
  const [newCompanyPhone, setNewCompanyPhone] = useState("");
  const [newCompanyInitialCredits, setNewCompanyInitialCredits] = useState(5);

  useEffect(() => {
    async function loadCompanies() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("companies")
          .select("*")
          .order("created_at", { ascending: false });

        // También verificar perfiles en public.profiles con role = 'company' que aún no tengan fila en public.companies
        const { data: companyProfiles } = await supabase
          .from("profiles")
          .select("*")
          .eq("role", "company");

        const currentCompanies: Company[] = Array.isArray(data) ? [...(data as Company[])] : [];

        if (companyProfiles && companyProfiles.length > 0) {
          for (const prof of companyProfiles) {
            const alreadyInCompanies = currentCompanies.some((c) => c.owner_id === prof.id);
            if (!alreadyInCompanies) {
              // Intentar insertar registro faltante en public.companies
              const { data: insertedComp } = await supabase
                .from("companies")
                .insert({
                  owner_id: prof.id,
                  company_name: prof.full_name || "Empresa Registrada",
                  nit: `NIT-${prof.id.slice(0, 8)}`,
                  city: "Bogotá D.C.",
                  contact_person: prof.full_name || "Contacto Principal",
                  contact_phone: prof.phone_whatsapp || "3000000000",
                  is_verified_company: false,
                  plan_name: "basico",
                  credits_security_studies: 10,
                })
                .select("*")
                .maybeSingle();

              if (insertedComp) {
                currentCompanies.unshift(insertedComp as Company);
              } else {
                currentCompanies.unshift({
                  id: prof.id,
                  owner_id: prof.id,
                  company_name: prof.full_name || "Empresa Registrada",
                  nit: `NIT-${prof.id.slice(0, 8)}`,
                  supervigilancia_license: null,
                  city: "Bogotá D.C.",
                  address: null,
                  contact_person: prof.full_name || "Contacto Principal",
                  contact_phone: prof.phone_whatsapp || "",
                  logo_url: null,
                  is_verified_company: false,
                  plan_name: "basico",
                  credits_security_studies: 0,
                  created_at: prof.created_at || new Date().toISOString(),
                });
              }
            }
          }
        }

        setCompanies(currentCompanies);
        return;
      } catch {
        setCompanies([]);
      }
    }

    loadCompanies();
  }, []);

  // Update companies state
  const syncCompanies = (updated: Company[]) => {
    setCompanies(updated);
  };

  // Toggle Verification Switch
  const handleToggleVerification = async (companyId: string) => {
    let nextStatusForDb = false;
    const updated = companies.map((c) => {
      if (c.id === companyId) {
        const nextStatus = !c.is_verified_company;
        nextStatusForDb = nextStatus;
        setNotification(
          nextStatus
            ? `Empresa "${c.company_name}" verificada ante SuperVigilancia (Sello Dorado Activo).`
            : `Sello de verificación removido para "${c.company_name}".`
        );
        return { ...c, is_verified_company: nextStatus };
      }
      return c;
    });
    syncCompanies(updated);

    try {
      const supabase = createClient();
      await supabase
        .from("companies")
        .update({ is_verified_company: nextStatusForDb })
        .eq("id", companyId);
    } catch {}

    setTimeout(() => setNotification(null), 3500);
  };

  // Handle Recharge Confirmation
  const handleConfirmRecharge = async () => {
    if (!selectedCompanyForRecharge) return;
    setIsProcessing(true);

    const targetCompany = selectedCompanyForRecharge;
    const nextCredits = (targetCompany.credits_security_studies || 0) + creditAmount;

    try {
      const supabase = createClient();
      await supabase
        .from("companies")
        .update({
          plan_name: selectedPlan,
          credits_security_studies: nextCredits,
        })
        .eq("id", targetCompany.id);
    } catch {}

    const updated = companies.map((c) => {
      if (c.id === targetCompany.id) {
        return {
          ...c,
          plan_name: selectedPlan,
          credits_security_studies: nextCredits,
        };
      }
      return c;
    });

    syncCompanies(updated);

    setNotification(
      `¡Se acreditaron +${creditAmount} créditos B2B a "${targetCompany.company_name}" bajo el plan ${selectedPlan.toUpperCase()}!`
    );
    setIsProcessing(false);
    setSelectedCompanyForRecharge(null);
    setTimeout(() => setNotification(null), 4000);
  };

  // Handle Create Company
  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName || !newCompanyNit) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const newComp: Company = {
      id: `comp-${Date.now()}`,
      owner_id: user?.id || `usr-comp-${Date.now()}`,
      company_name: newCompanyName,
      nit: newCompanyNit,
      supervigilancia_license: newCompanyLicense || "En proceso de validación",
      city: newCompanyCity,
      address: null,
      contact_person: newCompanyContact || "Gerencia de Selección",
      contact_phone: newCompanyPhone || "3000000000",
      logo_url: null,
      is_verified_company: true,
      plan_name: "pack_operativo",
      credits_security_studies: newCompanyInitialCredits,
      created_at: new Date().toISOString(),
    };

    try {
      if (user?.id) {
        const { data: inserted } = await supabase
          .from("companies")
          .insert({
            owner_id: user.id,
            company_name: newComp.company_name,
            nit: newComp.nit,
            supervigilancia_license: newComp.supervigilancia_license,
            city: newComp.city,
            contact_person: newComp.contact_person,
            contact_phone: newComp.contact_phone,
            is_verified_company: true,
            plan_name: "pack_operativo",
            credits_security_studies: newCompanyInitialCredits,
          })
          .select("*")
          .maybeSingle();

        if (inserted) {
          newComp.id = inserted.id;
        }
      }
    } catch {}

    const updated = [newComp, ...companies];
    syncCompanies(updated);

    setIsAddCompanyOpen(false);
    setNewCompanyName("");
    setNewCompanyNit("");
    setNewCompanyLicense("");
    setNotification(`Empresa "${newComp.company_name}" registrada con éxito.`);
    setTimeout(() => setNotification(null), 3500);
  };

  const filteredCompanies = companies.filter(
    (c) =>
      c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.nit.includes(searchTerm) ||
      c.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="p-3.5 rounded-lg bg-slate-900 text-white text-xs font-medium flex items-center justify-between border border-slate-800 shadow-card animate-in fade-in">
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
          <h1 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            Empresas Clientes & Recarga de Créditos B2B
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            Validación de personería jurídica ante SuperVigilancia, activación del Sello Verificado y asignación de saldos de poligrafía.
          </p>
        </div>

        <button
          onClick={() => setIsAddCompanyOpen(true)}
          className="h-9 px-4 rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.99]"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          <span>Registrar Empresa Cliente</span>
        </button>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full max-w-md">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
            strokeWidth={2}
          />
          <input
            type="text"
            placeholder="Buscar por Razón Social, NIT o Ciudad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-3 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#005DA4]/20 focus:border-[#005DA4] transition-colors"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium tabular-nums">
          Mostrando <strong className="text-slate-800 font-semibold">{filteredCompanies.length}</strong> de{" "}
          {companies.length} empresas registradas
        </div>
      </div>

      {/* COMPANIES TABLE */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/90 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Empresa / Razón Social</th>
                <th className="py-3 px-4">NIT & Licencia SuperVigilancia</th>
                <th className="py-3 px-4">Ciudad Principal</th>
                <th className="py-3 px-4">Sello Verificado</th>
                <th className="py-3 px-4">Plan Actual</th>
                <th className="py-3 px-4 text-center">Créditos Disponibles</th>
                <th className="py-3 px-4 text-right">Acción B2B</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No se encontraron empresas con ese criterio de búsqueda.
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((comp) => (
                  <tr key={comp.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Company Name */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <span>{comp.company_name}</span>
                        {comp.is_verified_company && (
                          <span
                            title="Empresa Verificada SuperVigilancia"
                            className="inline-flex items-center text-emerald-600"
                          >
                            <Shield className="w-3.5 h-3.5" strokeWidth={2} />
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 tabular-nums">
                        Contacto: {comp.contact_person} ({comp.contact_phone})
                      </div>
                    </td>

                    {/* NIT & License */}
                    <td className="py-3 px-4">
                      <div className="font-mono text-xs font-semibold text-slate-800 tabular-nums">
                        {comp.nit}
                      </div>
                      <div className="text-[10px] text-slate-500 tabular-nums">
                        {comp.supervigilancia_license || "Sin licencia cargada"}
                      </div>
                    </td>

                    {/* City */}
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {comp.city}
                    </td>

                    {/* Control 1: Verification Switch */}
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleVerification(comp.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
                          comp.is_verified_company
                            ? "bg-emerald-50/80 text-emerald-700 border-emerald-200/70 hover:bg-emerald-100/80"
                            : "bg-slate-100 text-slate-500 border-slate-200/80 hover:bg-slate-200"
                        }`}
                        title="Clic para cambiar estado de verificación oficial"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            comp.is_verified_company ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                        <span>{comp.is_verified_company ? "Verificada" : "Sin Validar"}</span>
                      </button>
                    </td>

                    {/* Plan Name */}
                    <td className="py-3 px-4">
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200/80">
                        {comp.plan_name.replace("_", " ")}
                      </span>
                    </td>

                    {/* Credits Counter */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center font-mono font-semibold text-xs px-2.5 py-1 rounded-md tabular-nums ${
                          comp.credits_security_studies > 0
                            ? "bg-emerald-50/80 text-emerald-700 border border-emerald-200/60"
                            : "bg-rose-50/80 text-rose-700 border border-rose-200/60"
                        }`}
                      >
                        {comp.credits_security_studies} Créditos
                      </span>
                    </td>

                    {/* Control 2: Recharge Button */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedCompanyForRecharge(comp);
                          setSelectedPlan(comp.plan_name);
                          setCreditAmount(5);
                        }}
                        className="btn-primary text-xs h-8 px-3 inline-flex items-center gap-1.5 font-medium"
                      >
                        <Coins className="w-3.5 h-3.5" strokeWidth={1.75} />
                        <span>Recargar Paquete</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECHARGE CREDITS MODAL */}
      {selectedCompanyForRecharge && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl w-full max-w-md shadow-xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-200/80">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#EAF3FA] border border-[#005DA4]/20 flex items-center justify-center text-[#0B3B70]">
                  <Coins className="w-5 h-5 text-[#005DA4]" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Recarga de Paquete B2B
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedCompanyForRecharge.company_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCompanyForRecharge(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Balance */}
            <div className="p-3.5 rounded-xl bg-[#F2F5F8] border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Saldo actual de la empresa:</span>
              <span className="font-mono font-bold text-[#0B3B70] tabular-nums">
                {selectedCompanyForRecharge.credits_security_studies} Créditos
              </span>
            </div>

            {/* Plan Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Plan Comercial Facturado
              </label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-full h-10 text-xs px-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#005DA4]/20 focus:border-[#005DA4] font-medium"
              >
                <option value="pack_operativo">Paquete Contratación Segura x5 ($850.000 COP)</option>
                <option value="pack_corporativo_vip">Paquete Blindaje Total x15 ($2.250.000 COP)</option>
                <option value="pack_personalizado">Paquete Personalizado a Medida</option>
                <option value="basico">Plan Cazatalentos Básico ($0 COP)</option>
              </select>
            </div>

            {/* Credits Amount Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Créditos a Sumar (Estudio + Visita + Polígrafo)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 30].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCreditAmount(num)}
                    className={`py-2 text-xs font-bold rounded-xl border tabular-nums transition-colors ${
                      creditAmount === num
                        ? "bg-[#0B3B70] border-[#0B3B70] text-white shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    +{num}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">
                O ingresa un número personalizado de créditos:
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={creditAmount}
                onChange={(e) => setCreditAmount(parseInt(e.target.value, 10) || 1)}
                className="w-full h-10 text-xs font-mono font-bold px-3.5 rounded-xl border border-slate-300 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#005DA4]/20 focus:border-[#005DA4]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSelectedCompanyForRecharge(null)}
                className="w-1/3 h-10 text-xs rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition-all active:scale-[0.99]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isProcessing || creditAmount <= 0}
                onClick={handleConfirmRecharge}
                className="w-2/3 h-10 text-xs font-semibold rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white tabular-nums shadow-sm transition-all active:scale-[0.99]"
              >
                {isProcessing ? "Acreditando..." : `Confirmar +${creditAmount} Créditos`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD COMPANY MODAL */}
      {isAddCompanyOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateCompany}
            className="bg-white border border-slate-200/90 rounded-2xl w-full max-w-lg shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between pb-3 border-b border-slate-200/80">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#EAF3FA] border border-[#005DA4]/20 text-[#0B3B70] flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[#005DA4]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                    Registrar Nueva Empresa de Seguridad
                  </h3>
                  <p className="text-xs text-slate-500">
                    Apertura de cuenta corporativa en FuerzaVerificada
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCompanyOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="font-medium text-slate-700 block mb-1">
                  Razón Social / Nombre Comercial *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Seguridad Nacional Proteger Ltda."
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-md border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  NIT (Con dígito de verificación) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="860.123.456-7"
                  value={newCompanyNit}
                  onChange={(e) => setNewCompanyNit(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-md border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Ciudad Principal
                </label>
                <select
                  value={newCompanyCity}
                  onChange={(e) => setNewCompanyCity(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-medium"
                >
                  <option value="Bogotá D.C.">Bogotá D.C.</option>
                  <option value="Medellín">Medellín</option>
                  <option value="Cali">Cali</option>
                  <option value="Barranquilla">Barranquilla</option>
                  <option value="Bucaramanga">Bucaramanga</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="font-medium text-slate-700 block mb-1">
                  Resolución / Licencia SuperVigilancia
                </label>
                <input
                  type="text"
                  placeholder="Ej. Licencia SV-01452 de 2023"
                  value={newCompanyLicense}
                  onChange={(e) => setNewCompanyLicense(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-md border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 tabular-nums"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Persona de Contacto (RRHH / Operaciones)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Dra. Natalia Gómez"
                  value={newCompanyContact}
                  onChange={(e) => setNewCompanyContact(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-md border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Teléfono / WhatsApp Corporativo
                </label>
                <input
                  type="text"
                  placeholder="3150000000"
                  value={newCompanyPhone}
                  onChange={(e) => setNewCompanyPhone(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-md border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Créditos Iniciales de Poligrafía/Visita
                </label>
                <input
                  type="number"
                  min="0"
                  value={newCompanyInitialCredits}
                  onChange={(e) => setNewCompanyInitialCredits(parseInt(e.target.value, 10) || 0)}
                  className="w-full h-10 px-3.5 rounded-md border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-mono font-semibold tabular-nums"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => setIsAddCompanyOpen(false)}
                className="btn-secondary w-1/3 h-10 text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary w-2/3 h-10 text-xs font-medium"
              >
                Crear y Activar Empresa
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
