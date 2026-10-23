"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Zap,
  Shield,
  MapPin,
  Phone,
  Bike,
  FileText,
  MessageCircle,
  Search,
  CheckCircle2,
  Filter,
  User,
  Clock,
  ArrowRight,
} from "lucide-react";
import { ResumeDrawerModal } from "@/components/empresa/ResumeDrawerModal";
import { SecurityRoleType } from "@/types/database";

interface AvailableGuard {
  id: string;
  full_name: string;
  national_id: string;
  phone_whatsapp: string;
  city: string;
  locality: string;
  primary_role: SecurityRoleType;
  years_experience: number;
  has_military_booklet: boolean;
  has_own_motorcycle: boolean;
  motorcycle_cc?: number | null;
  days_remaining: number;
  resume_pdf_url: string;
  available_immediately: boolean;
}

const DEMO_AVAILABLE_GUARDS: AvailableGuard[] = [
  {
    id: "rel-1",
    full_name: "Carlos Eduardo Moreno R.",
    national_id: "1020304050",
    phone_whatsapp: "3109876543",
    city: "Bogotá D.C.",
    locality: "Suba",
    primary_role: "Vigilante Fijo",
    years_experience: 4,
    has_military_booklet: true,
    has_own_motorcycle: true,
    motorcycle_cc: 150,
    days_remaining: 184,
    resume_pdf_url: "https://demo.fuerzaverificada.com/hv-carlos.pdf",
    available_immediately: true,
  },
  {
    id: "rel-2",
    full_name: "Néstor Fabián Pinzón",
    national_id: "79882341",
    phone_whatsapp: "3118899001",
    city: "Bogotá D.C.",
    locality: "Fontibón",
    primary_role: "Supervisor Motorizado",
    years_experience: 5,
    has_military_booklet: true,
    has_own_motorcycle: true,
    motorcycle_cc: 180,
    days_remaining: 240,
    resume_pdf_url: "https://demo.fuerzaverificada.com/hv-nestor.pdf",
    available_immediately: true,
  },
  {
    id: "rel-3",
    full_name: "Andrés Felipe Quintero",
    national_id: "1019283746",
    phone_whatsapp: "3156677889",
    city: "Bogotá D.C.",
    locality: "Kennedy",
    primary_role: "Vigilante Móvil",
    years_experience: 2,
    has_military_booklet: true,
    has_own_motorcycle: false,
    motorcycle_cc: null,
    days_remaining: 310,
    resume_pdf_url: "https://demo.fuerzaverificada.com/hv-andres.pdf",
    available_immediately: true,
  },
  {
    id: "rel-4",
    full_name: "Jhon Alexander Castro",
    national_id: "1032890123",
    phone_whatsapp: "3201122334",
    city: "Bogotá D.C.",
    locality: "Engativá",
    primary_role: "Vigilante Fijo",
    years_experience: 3,
    has_military_booklet: true,
    has_own_motorcycle: false,
    motorcycle_cc: null,
    days_remaining: 95,
    resume_pdf_url: "https://demo.fuerzaverificada.com/hv-jhon.pdf",
    available_immediately: true,
  },
];

export default function RadarRelevosPage() {
  const [guards] = useState<AvailableGuard[]>(DEMO_AVAILABLE_GUARDS);
  const [selectedCandidate, setSelectedCandidate] = useState<AvailableGuard | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("Todos");
  const [onlyMotorcycle, setOnlyMotorcycle] = useState(false);

  const filtered = guards.filter((g) => {
    const matchSearch =
      g.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.locality.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = selectedRole === "Todos" || g.primary_role === selectedRole;
    const matchMoto = !onlyMotorcycle || g.has_own_motorcycle;
    return matchSearch && matchRole && matchMoto;
  });

  return (
    <div className="space-y-6">
      {/* Header with Radar Pulse Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Radar Operativo en Tiempo Real
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Guardas Disponibles para Relevos de Emergencia
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            Personal con credencial SuperVigilancia vigente activo para cubrir incapacidades y turnos hoy mismo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="badge-emerald text-xs py-1 px-3">
            <Zap className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
            {filtered.length} guardas listos en Bogotá
          </span>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" strokeWidth={1.75} />
          <input
            type="text"
            placeholder="Buscar por barrio o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400 shadow-subtle"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {["Todos", "Vigilante Fijo", "Supervisor Motorizado"].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setSelectedRole(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition-all ${
                selectedRole === role
                  ? "bg-slate-900 text-white border-slate-900 font-semibold shadow-subtle"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {role}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setOnlyMotorcycle(!onlyMotorcycle)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border flex items-center gap-1.5 transition-all ${
              onlyMotorcycle
                ? "bg-[#0F172A] text-white border-[#0F172A] shadow-sm"
                : "bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F8FAFC]"
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            Solo con Moto
          </button>
        </div>
      </div>

      {/* GUARDS CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((guard) => {
          const directWhatsappLink = `https://wa.me/57${guard.phone_whatsapp}?text=Hola%20${encodeURIComponent(
            guard.full_name
          )},%20te%20escribimos%20de%20Seguridad%20Andina%20Ltda.%20a%20través%20de%20FuerzaVerificada.%20Vimos%20que%20estás%20disponible%20para%20turno%20de%20relevo%20hoy.%20¿Tienes%20disponibilidad%20inmediata?`;

          return (
            <div
              key={guard.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-subtle hover:border-slate-300 transition-all space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-sm shrink-0">
                    {guard.full_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {guard.full_name}
                    </h3>
                    <div className="text-xs font-semibold text-amber-700 font-mono mt-0.5">
                      {guard.primary_role}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      C.C. {guard.national_id}
                    </div>
                  </div>
                </div>

                <span className="badge-emerald text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Listo para Turno
                </span>
              </div>

              {/* Attributes line */}
              <div className="grid grid-cols-3 gap-2 text-xs py-2 border-t border-b border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Ubicación</span>
                  <span className="font-semibold text-slate-800">{guard.locality}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Credencial</span>
                  <span className="font-bold text-emerald-700 font-mono tabular-nums">{guard.days_remaining}d vigentes</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Vehículo</span>
                  <span className="font-semibold text-slate-800">
                    {guard.has_own_motorcycle ? `Moto ${guard.motorcycle_cc || 150}cc` : "Sin moto"}
                  </span>
                </div>
              </div>

              {/* Action Buttons: 10-second contact */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedCandidate(guard)}
                  className="btn-secondary text-xs py-2 px-3 font-semibold w-1/2"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-600" strokeWidth={1.75} />
                  Ver Hoja de Vida
                </button>
                <a
                  href={directWhatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-emerald text-xs py-2 px-3 font-semibold w-1/2"
                >
                  <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.75} />
                  WhatsApp Inmediato
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* DRAWER MODAL */}
      <ResumeDrawerModal
        isOpen={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        candidate={selectedCandidate}
      />
    </div>
  );
}
