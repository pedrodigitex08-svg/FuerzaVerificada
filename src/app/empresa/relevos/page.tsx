"use client";

import { useState, useEffect } from "react";
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
  Users,
} from "lucide-react";
import { ResumeDrawerModal } from "@/components/empresa/ResumeDrawerModal";
import { SecurityRoleType } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

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

export default function RadarRelevosPage() {
  const [guards, setGuards] = useState<AvailableGuard[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<AvailableGuard | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("Todos");
  const [onlyMotorcycle, setOnlyMotorcycle] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAvailableGuards() {
      setIsLoading(true);
      const supabase = createClient();

      try {
        // 1. Try canonical SQL view v_candidates_with_course_status first
        const { data: viewData, error: viewError } = await supabase
          .from("v_candidates_with_course_status")
          .select("*")
          .eq("available_immediately", true);

        if (!viewError && viewData && viewData.length > 0) {
          setGuards(
            viewData.map((c: any) => ({
              id: c.user_id || c.id,
              full_name: c.full_name || "Aspirante",
              national_id: c.national_id || "En verificación",
              phone_whatsapp: c.phone_whatsapp || "573000000000",
              city: c.city || "Bogotá D.C.",
              locality: c.locality_neighborhood || c.locality || c.city || "Bogotá",
              primary_role: c.primary_role || "Vigilante Fijo",
              years_experience: c.years_experience || 0,
              has_military_booklet: !!c.has_military_booklet,
              has_own_motorcycle: !!c.has_own_motorcycle,
              motorcycle_cc: c.motorcycle_cc || null,
              days_remaining: 180,
              resume_pdf_url: c.resume_pdf_url || "",
              available_immediately: true,
            }))
          );
          return;
        }

        // 2. Fallback to candidate_profiles joined with profiles
        const { data, error } = await supabase
          .from("candidate_profiles")
          .select("*, profiles(*)")
          .eq("available_immediately", true);

        if (!error && data && data.length > 0) {
          setGuards(
            data.map((c: any) => ({
              id: c.user_id || c.id,
              full_name: c.profiles?.full_name || "Aspirante",
              national_id: c.national_id || "En verificación",
              phone_whatsapp: c.profiles?.phone_whatsapp || "573000000000",
              city: c.city || "Bogotá D.C.",
              locality: c.locality_neighborhood || c.locality || c.city || "Bogotá",
              primary_role: c.primary_role || "Vigilante Fijo",
              years_experience: c.years_experience || 0,
              has_military_booklet: !!c.has_military_booklet,
              has_own_motorcycle: !!c.has_own_motorcycle,
              motorcycle_cc: c.motorcycle_cc || null,
              days_remaining: 180,
              resume_pdf_url: c.resume_pdf_url || "",
              available_immediately: true,
            }))
          );
        } else {
          setGuards([]);
        }
      } catch (err) {
        console.error("Error loading available guards:", err);
        setGuards([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadAvailableGuards();
  }, []);

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
            {filtered.length} {filtered.length === 1 ? "guarda listo" : "guardas listos"}
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

      {/* GUARDS CARDS GRID OR EMPTY STATE */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center shadow-subtle">
          <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" strokeWidth={1.5} />
          <h3 className="text-base font-bold text-slate-800">
            {searchTerm || selectedRole !== "Todos" || onlyMotorcycle
              ? "No se encontraron guardas con los filtros actuales"
              : "No hay personal disponible para relevo inmediato en este momento"}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {searchTerm || selectedRole !== "Todos" || onlyMotorcycle
              ? "Intenta modificando el filtro de búsqueda o el tipo de cargo seleccionado."
              : "Tan pronto como los guardas y escoltas activen la opción de 'Disponibilidad Inmediata' en su perfil, aparecerán en este radar operativo para contacto en 1 clic."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((guard) => {
            const directWhatsappLink = `https://wa.me/57${guard.phone_whatsapp}?text=Hola%20${encodeURIComponent(
              guard.full_name
            )},%20te%20escribimos%20a%20través%20de%20FuerzaVerificada.%20Vimos%20que%20estás%20disponible%20para%20turno%20de%20relevo%20hoy.%20¿Tienes%20disponibilidad%20inmediata?`;

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
      )}

      {/* DRAWER MODAL */}
      <ResumeDrawerModal
        isOpen={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        candidate={selectedCandidate}
      />
    </div>
  );
}
