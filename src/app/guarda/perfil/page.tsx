"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  Shield,
  CreditCard,
  Phone,
  MapPin,
  Briefcase,
  FileText,
  FileCheck,
  CheckCircle2,
  Bike,
  LogOut,
  Save,
  Check,
  BadgeCheck,
} from "lucide-react";
import { CourseSemaphoreBanner } from "@/components/guarda/CourseSemaphoreBanner";
import { SecurityRoleType } from "@/types/database";

const SECURITY_ROLES: SecurityRoleType[] = [
  "Vigilante Fijo",
  "Vigilante Móvil",
  "Escolta VIP",
  "Escolta Mercancía",
  "Supervisor Motorizado",
  "Operador Medios Tecnológicos",
  "Manejador Canino",
];

export default function PerfilGuardaPage() {
  const [nationalId, setNationalId] = useState("1020304050");
  const [fullName, setFullName] = useState("Carlos Eduardo Moreno R.");
  const [phone, setPhone] = useState("3109876543");
  const [city, setCity] = useState("Bogotá D.C.");
  const [locality, setLocality] = useState("Suba");
  const [primaryRole, setPrimaryRole] = useState<SecurityRoleType>("Vigilante Fijo");
  const [yearsExperience, setYearsExperience] = useState(3);
  const [hasMilitaryBooklet, setHasMilitaryBooklet] = useState(true);
  const [hasMotorcycle, setHasMotorcycle] = useState(true);
  const [motorcycleCc, setMotorcycleCc] = useState(150);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fv_candidate_profile");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.full_name) setFullName(parsed.full_name);
          if (parsed.national_id) setNationalId(parsed.national_id);
          if (parsed.city) setCity(parsed.city);
          if (parsed.locality) setLocality(parsed.locality);
          if (parsed.primary_role) setPrimaryRole(parsed.primary_role);
          if (parsed.years_experience !== undefined) setYearsExperience(parsed.years_experience);
          if (parsed.has_military_booklet !== undefined) setHasMilitaryBooklet(parsed.has_military_booklet);
          if (parsed.has_own_motorcycle !== undefined) setHasMotorcycle(parsed.has_own_motorcycle);
          if (parsed.motorcycle_cc) setMotorcycleCc(parsed.motorcycle_cc);
        } catch {}
      }
    }
  }, []);

  const handleSave = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "fv_candidate_profile",
        JSON.stringify({
          full_name: fullName,
          national_id: nationalId,
          city,
          locality,
          primary_role: primaryRole,
          years_experience: yearsExperience,
          has_military_booklet: hasMilitaryBooklet,
          has_own_motorcycle: hasMotorcycle,
          motorcycle_cc: motorcycleCc,
        })
      );
    }
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Mi Perfil & Hoja de Vida Profesional
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            Actualice su información operativa, preferencias de turno y documentos adjuntos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedNotice && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> Cambios guardados
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="btn-primary text-xs py-2 px-4 font-semibold"
          >
            <Save className="w-3.5 h-3.5" strokeWidth={1.75} />
            Guardar Cambios
          </button>
        </div>
      </div>

      {/* 2-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: EDITABLE DETAILS (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section 1: Contact */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-subtle space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Datos de Identificación y Contacto
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Cédula
                  </label>
                  <input
                    type="text"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Ciudad
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                  >
                    <option value="Bogotá D.C.">Bogotá D.C.</option>
                    <option value="Medellín">Medellín</option>
                    <option value="Cali">Cali</option>
                    <option value="Barranquilla">Barranquilla</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Barrio / Localidad
                  </label>
                  <input
                    type="text"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Role & Experience */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-subtle space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Cargo y Dotación Operativa
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  Especialidad Principal:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SECURITY_ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setPrimaryRole(role)}
                      className={`p-2 rounded-lg text-xs font-medium border text-left transition-all ${
                        primaryRole === role
                          ? "bg-slate-900 text-white border-slate-900 font-semibold"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">Libreta Militar</span>
                  <button
                    type="button"
                    onClick={() => setHasMilitaryBooklet(!hasMilitaryBooklet)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center ${
                      hasMilitaryBooklet ? "bg-emerald-600 justify-end" : "bg-slate-300 justify-start"
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-subtle" />
                  </button>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">Moto Propia</span>
                  <button
                    type="button"
                    onClick={() => setHasMotorcycle(!hasMotorcycle)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center ${
                      hasMotorcycle ? "bg-amber-500 justify-end" : "bg-slate-300 justify-start"
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-subtle" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Document Repository */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-subtle space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Archivos y Documentos Almacenados
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-slate-600" strokeWidth={1.75} />
                  <div>
                    <strong className="text-slate-900 block">Hoja_de_Vida_CarlosMoreno.pdf</strong>
                    <span className="text-[10px] text-slate-400">Documento activo en postulaciones</span>
                  </div>
                </div>
                <span className="badge-emerald text-[10px]">Cargado</span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileCheck className="w-4 h-4 text-emerald-600" strokeWidth={1.75} />
                  <div>
                    <strong className="text-slate-900 block">Diploma_Curso_Vigilancia.pdf</strong>
                    <span className="text-[10px] text-slate-400">Certificación Academia Nacional</span>
                  </div>
                </div>
                <span className="badge-emerald text-[10px]">Cargado</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/guarda/onboarding"
                className="text-xs text-amber-600 font-semibold hover:underline"
              >
                + Modificar archivos en el Onboarding completo
              </Link>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: LIVE CREDENTIAL & COURSE WIDGET (5 cols - Sticky) */}
        <div className="lg:col-span-5 sticky top-24 space-y-6">
          
          {/* SEMAPHORE CARD */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Estado de Credencial SuperVigilancia
            </span>
            <CourseSemaphoreBanner
              completionDate="2026-04-15"
              candidateName={fullName}
              city={city}
            />
          </div>

          {/* DIGITAL CARD */}
          <div className="rounded-2xl bg-slate-900 text-white p-6 shadow-elevated border border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400 fill-amber-500/20" strokeWidth={1.75} />
                <span className="text-xs font-bold text-white">
                  Fuerza<span className="text-amber-400">Verificada</span>
                </span>
              </div>
              <span className="badge-emerald text-[9px] py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Auditado
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400 text-base">
                {fullName.charAt(0)}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{fullName}</h4>
                <div className="text-xs text-amber-400 font-mono mt-0.5">{primaryRole}</div>
                <div className="text-[11px] text-slate-400">C.C. {nationalId} • {city}</div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Años de exp: <strong className="text-white">{yearsExperience}</strong></span>
              <span>Libreta: <strong className="text-white">{hasMilitaryBooklet ? "Sí" : "No"}</strong></span>
              <span>Moto: <strong className="text-white">{hasMotorcycle ? `${motorcycleCc}cc` : "No"}</strong></span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
