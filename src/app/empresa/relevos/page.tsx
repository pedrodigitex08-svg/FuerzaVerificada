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
  const [onlyImmediate, setOnlyImmediate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAvailableGuards() {
      setIsLoading(true);
      const supabase = createClient();

      try {
        // 1. Try canonical SQL view v_candidates_with_course_status first
        const { data: viewData, error: viewError } = await supabase
          .from("v_candidates_with_course_status")
          .select("*");

        if (!viewError && viewData && viewData.length > 0) {
          setGuards(
            viewData.map((c: any) => ({
              id: c.user_id || c.id,
              full_name: c.full_name || "Aspirante",
              national_id: c.national_id || "En verificación",
              phone_whatsapp: c.phone_whatsapp || "",
              city: c.city || "Bogotá D.C.",
              locality: c.locality_neighborhood || c.locality || c.city || "Bogotá",
              primary_role: c.primary_role || "Vigilante Fijo",
              years_experience: c.years_experience || 0,
              has_military_booklet: !!c.has_military_booklet,
              has_own_motorcycle: !!c.has_own_motorcycle,
              motorcycle_cc: c.motorcycle_cc || null,
              days_remaining: c.days_remaining || 0,
              resume_pdf_url: c.resume_pdf_url || "",
              available_immediately: !!c.available_immediately,
            }))
          );
          return;
        }

        // 2. Fallback to candidate_profiles joined with profiles
        const { data, error } = await supabase
          .from("candidate_profiles")
          .select("*, profiles(*)");

        if (!error && data && data.length > 0) {
          const userIds = data.map((c: any) => c.user_id || c.id).filter(Boolean);
          const { data: coursesData } =
            userIds.length > 0
              ? await supabase
                  .from("candidate_courses")
                  .select("candidate_id, expiration_date")
                  .in("candidate_id", userIds)
              : { data: [] as any[] };

          const courseMap = new Map();
          (coursesData || []).forEach((cs: any) => {
            if (cs.expiration_date) {
              const diffMs = new Date(cs.expiration_date).getTime() - Date.now();
              const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
              courseMap.set(cs.candidate_id, diffDays);
            }
          });

          setGuards(
            data
              .filter((c: any) => c.profiles?.role === "candidate" || !c.profiles?.role)
              .map((c: any) => {
                const uid = c.user_id || c.id;
                const days = courseMap.has(uid) ? courseMap.get(uid) : 0;
                return {
                  id: uid,
                  full_name: c.profiles?.full_name || "Aspirante Operativo",
                  national_id: c.national_id || "En verificación",
                  phone_whatsapp: c.profiles?.phone_whatsapp || "",
                  city: c.city || "Bogotá D.C.",
                  locality: c.locality_neighborhood || c.locality || c.city || "Bogotá",
                  primary_role: c.primary_role || "Vigilante Fijo",
                  years_experience: c.years_experience || 0,
                  has_military_booklet: !!c.has_military_booklet,
                  has_own_motorcycle: !!c.has_own_motorcycle,
                  motorcycle_cc: c.motorcycle_cc || null,
                  days_remaining: days,
                  resume_pdf_url: c.resume_pdf_url || "",
                  available_immediately: !!c.available_immediately,
                };
              })
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
    const matchImmediate = !onlyImmediate || g.available_immediately;
    return matchSearch && matchRole && matchMoto && matchImmediate;
  });

  return (
    <div className="space-y-6">
      {/* Header with Radar Pulse Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Directorio Verificado & Radar Operativo
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Directorio de Personal Verificado & Radar de Relevos
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            Base de datos de guardas, escoltas y personal con credencial SuperVigilancia vigente y filtro para relevos de emergencia.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="badge-emerald text-xs py-1 px-3">
            <Zap className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
            {filtered.length} {filtered.length === 1 ? "candidato listo" : "candidatos listos"}
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
          {["Todos", "Vigilante Fijo", "Supervisor Motorizado", "Escolta VIP"].map((role) => (
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
            onClick={() => setOnlyImmediate(!onlyImmediate)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border flex items-center gap-1.5 transition-all ${
              onlyImmediate
                ? "bg-[#10B981] text-white border-[#10B981] shadow-sm"
                : "bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F8FAFC]"
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${onlyImmediate ? "fill-white text-white" : "text-amber-500"}`} />
            Solo Relevos Urgentes
          </button>

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
            No se encontraron perfiles operativos registrados con estos criterios
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {searchTerm || selectedRole !== "Todos" || onlyMotorcycle
              ? "Intenta modificando el filtro de búsqueda o el tipo de cargo seleccionado."
              : "Tan pronto como los guardas y escoltas se registren en la plataforma, aparecerán en este directorio para contacto en 1 clic."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((guard) => {
            const cleanPhone = (guard.phone_whatsapp || "").replace(/\D/g, "");
            const formattedPhone = cleanPhone.startsWith("57") ? cleanPhone : (cleanPhone ? `57${cleanPhone}` : "573000000000");
            const directWhatsappLink = `https://wa.me/${formattedPhone}?text=Hola%20${encodeURIComponent(
              guard.full_name
            )},%20te%20escribimos%20a%20través%20de%20FuerzaVerificada.%20Vimos%20tu%20perfil%20operativo%20de%20${encodeURIComponent(
              guard.primary_role
            )}%20y%20nos%20gustaría%20validar%20tu%20disponibilidad%20para%20un%20puesto.`;

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
                    <span className="font-bold text-emerald-700 font-mono tabular-nums">
                      {guard.days_remaining > 0 ? `${guard.days_remaining}d vigentes` : "Por validar"}
                    </span>
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
