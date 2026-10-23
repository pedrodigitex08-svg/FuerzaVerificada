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
import { INITIAL_DEMO_COMPANIES, initializeSeedData } from "@/lib/utils/seedData";

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
    const { companies: seededCompanies } = initializeSeedData(false);
    setCompanies(seededCompanies);
  }, []);

  // Save to localStorage helper
  const syncCompanies = (updated: Company[]) => {
    setCompanies(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("fv_companies", JSON.stringify(updated));
    }
  };

  // Toggle Verification Switch
  const handleToggleVerification = (companyId: string) => {
    const updated = companies.map((c) => {
      if (c.id === companyId) {
        const nextStatus = !c.is_verified_company;
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
    setTimeout(() => setNotification(null), 3500);
  };

  // Handle Recharge Confirmation
  const handleConfirmRecharge = () => {
    if (!selectedCompanyForRecharge) return;
    setIsProcessing(true);

    setTimeout(() => {
      const updated = companies.map((c) => {
        if (c.id === selectedCompanyForRecharge.id) {
          const nextCredits = c.credits_security_studies + creditAmount;
          return {
            ...c,
            plan_name: selectedPlan,
            credits_security_studies: nextCredits,
          };
        }
        return c;
      });

      syncCompanies(updated);

      // Sync company credits in company session if it's the active demo
      if (typeof window !== "undefined") {
        const currentActiveCredits = parseInt(localStorage.getItem("fv_company_credits") || "5", 10);
        localStorage.setItem("fv_company_credits", (currentActiveCredits + creditAmount).toString());
      }

      setNotification(
        `¡Se acreditaron +${creditAmount} créditos B2B a "${selectedCompanyForRecharge.company_name}" bajo el plan ${selectedPlan.toUpperCase()}!`
      );
      setIsProcessing(false);
      setSelectedCompanyForRecharge(null);
      setTimeout(() => setNotification(null), 4000);
    }, 400);
  };

  // Handle Create Company
  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName || !newCompanyNit) return;

    const newComp: Company = {
      id: `comp-${Date.now()}`,
      owner_id: `usr-comp-${Date.now()}`,
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
            Empresas Clientes & Recarga de Créditos B2B
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            Validación de personería jurídica ante SuperVigilancia, activación del Sello Dorado y asignación de saldos de poligrafía.
          </p>
        </div>

        <button
          onClick={() => setIsAddCompanyOpen(true)}
          className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          <span>Registrar Empresa Cliente</span>
        </button>
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
            placeholder="Buscar por Razón Social, NIT o Ciudad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Mostrando <strong className="text-slate-800">{filteredCompanies.length}</strong> de{" "}
          {companies.length} empresas registradas
        </div>
      </div>

      {/* COMPANIES TABLE */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
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
                  <tr key={comp.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Company Name */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{comp.company_name}</span>
                        {comp.is_verified_company && (
                          <span
                            title="Empresa Verificada SuperVigilancia"
                            className="inline-flex items-center text-amber-500"
                          >
                            <Shield className="w-3.5 h-3.5 fill-amber-500/20" strokeWidth={2} />
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Contacto: {comp.contact_person} ({comp.contact_phone})
                      </div>
                    </td>

                    {/* NIT & License */}
                    <td className="py-3 px-4">
                      <div className="font-mono text-xs font-semibold text-slate-800">
                        {comp.nit}
                      </div>
                      <div className="text-[10px] text-slate-500">
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
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
                          comp.is_verified_company
                            ? "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
                            : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                        }`}
                        title="Clic para cambiar estado de verificación oficial"
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            comp.is_verified_company ? "bg-amber-500" : "bg-slate-400"
                          }`}
                        />
                        <span>{comp.is_verified_company ? "Verificada" : "Sin Validar"}</span>
                      </button>
                    </td>

                    {/* Plan Name */}
                    <td className="py-3 px-4">
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                        {comp.plan_name.replace("_", " ")}
                      </span>
                    </td>

                    {/* Credits Counter */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center font-mono font-bold text-xs px-2.5 py-1 rounded-lg tabular-nums ${
                          comp.credits_security_studies > 0
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
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
                        className="btn-amber text-xs py-1 px-3 inline-flex items-center gap-1.5 font-bold"
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
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-elevated p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                  <Coins className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Recarga de Paquete B2B
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedCompanyForRecharge.company_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCompanyForRecharge(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Balance */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Saldo actual de la empresa:</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                {selectedCompanyForRecharge.credits_security_studies} Créditos
              </span>
            </div>

            {/* Plan Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Plan Comercial Facturado
              </label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 font-semibold"
              >
                <option value="pack_operativo">Paquete Contratación Segura x5 ($850.000 COP)</option>
                <option value="pack_corporativo_vip">Paquete Blindaje Total x15 ($2.250.000 COP)</option>
                <option value="pack_personalizado">Paquete Personalizado a Medida</option>
                <option value="basico">Plan Cazatalentos Básico ($0 COP)</option>
              </select>
            </div>

            {/* Credits Amount Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Créditos a Sumar (Estudio + Visita + Polígrafo)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 30].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCreditAmount(num)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      creditAmount === num
                        ? "bg-slate-900 border-slate-900 text-white shadow-sm"
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
                className="w-full text-xs font-mono font-bold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSelectedCompanyForRecharge(null)}
                className="btn-secondary w-1/3 text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isProcessing || creditAmount <= 0}
                onClick={handleConfirmRecharge}
                className="btn-amber w-2/3 text-xs font-bold"
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
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-elevated p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
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
                <label className="font-semibold text-slate-700 block mb-1">
                  Razón Social / Nombre Comercial *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Seguridad Nacional Proteger Ltda."
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  NIT (Con dígito de verificación) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="860.123.456-7"
                  value={newCompanyNit}
                  onChange={(e) => setNewCompanyNit(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Ciudad Principal
                </label>
                <select
                  value={newCompanyCity}
                  onChange={(e) => setNewCompanyCity(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                >
                  <option value="Bogotá D.C.">Bogotá D.C.</option>
                  <option value="Medellín">Medellín</option>
                  <option value="Cali">Cali</option>
                  <option value="Barranquilla">Barranquilla</option>
                  <option value="Bucaramanga">Bucaramanga</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">
                  Resolución / Licencia SuperVigilancia
                </label>
                <input
                  type="text"
                  placeholder="Ej. Licencia SV-01452 de 2023"
                  value={newCompanyLicense}
                  onChange={(e) => setNewCompanyLicense(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Persona de Contacto (RRHH / Operaciones)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Dra. Natalia Gómez"
                  value={newCompanyContact}
                  onChange={(e) => setNewCompanyContact(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Teléfono / WhatsApp Corporativo
                </label>
                <input
                  type="text"
                  placeholder="3150000000"
                  value={newCompanyPhone}
                  onChange={(e) => setNewCompanyPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 tabular-nums"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Créditos Iniciales de Poligrafía/Visita
                </label>
                <input
                  type="number"
                  min="0"
                  value={newCompanyInitialCredits}
                  onChange={(e) => setNewCompanyInitialCredits(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => setIsAddCompanyOpen(false)}
                className="btn-secondary w-1/3 text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary w-2/3 text-xs font-bold"
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
