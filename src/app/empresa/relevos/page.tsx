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
import {
  normalizeSecurityRole,
  formatSecurityRoleLabel,
} from "@/lib/utils/roleNormalizer";
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
        let rawCandidates: any[] = [];
        const { data, error } = await supabase
          .from("candidate_profiles")
          .select("*, profiles(*)");

        if (!error && Array.isArray(data) && data.length > 0) {
          rawCandidates = data;
        } else {
          // Respaldo anti-join resiliente: consulta directa sin JOIN a profiles
          const { data: directCandidates } = await supabase
            .from("candidate_profiles")
            .select("*");
          if (Array.isArray(directCandidates)) {
            rawCandidates = directCandidates;
          }
        }

        if (rawCandidates.length > 0) {
          const userIds = rawCandidates.map((c: any) => c.user_id || c.id).filter(Boolean);

          const { data: rawProfiles } =
            userIds.length > 0
              ? await supabase
                  .from("profiles")
                  .select("id, full_name, phone_whatsapp, role")
                  .in("id", userIds)
              : { data: [] as any[] };
          const profMap = new Map((rawProfiles || []).map((p: any) => [p.id, p]));

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
            rawCandidates
              .filter((c: any) => {
                const p = profMap.get(c.user_id || c.id) || c.profiles;
                return p?.role === "candidate" || !p?.role;
              })
              .map((c: any) => {
                const uid = c.user_id || c.id;
                const p = profMap.get(uid) || c.profiles;
                const days = courseMap.has(uid) ? courseMap.get(uid) : 0;
                return {
                  id: uid,
                  full_name: p?.full_name || c.full_name || "Aspirante Operativo",
                  national_id: c.national_id || "En verificación",
                  phone_whatsapp: p?.phone_whatsapp || "",
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
    const matchRole =
      selectedRole === "Todos" ||
      normalizeSecurityRole(g.primary_role) === normalizeSecurityRole(selectedRole);
    const matchMoto = !onlyMotorcycle || g.has_own_motorcycle;
    const matchImmediate = !onlyImmediate || g.available_immediately;
    return matchSearch && matchRole && matchMoto && matchImmediate;
  });

  return (
    <div className="space-y-6">
      {/* Header Estilo Computrabajo Empresas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Directorio Verificado & Radar Operativo
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Directorio de Personal Verificado & Radar de Relevos
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Base de datos de guardas, escoltas y personal con credencial SuperVigilancia vigente y filtro para relevos de emergencia.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 tabular-nums flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
            {filtered.length} {filtered.length === 1 ? "candidato listo" : "candidatos listos"}
          </span>
        </div>
      </div>

      {/* FILTER BAR EN PÍLDORA */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" strokeWidth={2} />
          <input
            type="text"
            placeholder="Buscar por barrio o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 bg-white border border-slate-300 rounded-full pl-11 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 shadow-2xs transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto scrollbar-none">
          {["Todos", "Vigilante Fijo", "Supervisor Motorizado", "Escolta VIP"].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setSelectedRole(role)}
              className={`h-10 px-4 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                selectedRole === role
                  ? "bg-[#0B3B70] text-white border-[#0B3B70] shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:border-[#005DA4] hover:bg-[#EAF3FA]/30"
              }`}
            >
              {role}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setOnlyImmediate(!onlyImmediate)}
            className={`h-10 px-4 rounded-full text-xs font-semibold whitespace-nowrap border flex items-center gap-1.5 transition-all ${
              onlyImmediate
                ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:border-amber-400"
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${onlyImmediate ? "fill-white text-white" : "text-amber-500"}`} />
            Solo Relevos Urgentes
          </button>

          <button
            type="button"
            onClick={() => setOnlyMotorcycle(!onlyMotorcycle)}
            className={`h-10 px-4 rounded-full text-xs font-semibold whitespace-nowrap border flex items-center gap-1.5 transition-all ${
              onlyMotorcycle
                ? "bg-[#0B3B70] text-white border-[#0B3B70] shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:border-[#005DA4]"
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            Solo con Moto
          </button>
        </div>
      </div>

      {/* GUARDS CARDS GRID OR EMPTY STATE */}
      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-2xs">
          <div className="w-8 h-8 border-2 border-[#0B3B70] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-600">Cargando radar de personal disponible...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-2xs">
          <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" strokeWidth={1.5} />
          <h3 className="text-base font-bold tracking-tight text-slate-900">
            No se encontraron perfiles operativos con estos criterios
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
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs hover:border-[#005DA4] transition-all space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-[#EAF3FA] border border-[#D5E6F5] text-[#0B3B70] font-bold flex items-center justify-center text-sm shrink-0">
                      {guard.full_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold tracking-tight text-slate-900 leading-snug hover:text-[#005DA4] transition-colors">
                        {guard.full_name}
                      </h3>
                      <div className="text-xs font-semibold text-[#005DA4] mt-0.5">
                        {formatSecurityRoleLabel(guard.primary_role)}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                        C.C. {guard.national_id}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Listo para Turno
                  </span>
                </div>

                {/* Attributes line */}
                <div className="grid grid-cols-3 gap-2 text-xs py-3 border-t border-b border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Ubicación</span>
                    <span className="font-bold text-slate-800 truncate block">{guard.locality}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Credencial</span>
                    <span className="font-bold text-emerald-700 font-mono tabular-nums">
                      {guard.days_remaining > 0 ? `${guard.days_remaining}d vigentes` : "Por validar"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Vehículo</span>
                    <span className="font-bold text-slate-800 tabular-nums">
                      {guard.has_own_motorcycle ? `Moto ${guard.motorcycle_cc || 150}cc` : "Sin moto"}
                    </span>
                  </div>
                </div>

                {/* Action Buttons: 10-second contact */}
                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedCandidate(guard)}
                    className="rounded-full bg-[#EAF3FA] hover:bg-[#D5E6F5] text-[#0B3B70] border border-[#D5E6F5] text-xs h-9 px-4 font-semibold w-1/2 inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#005DA4]" strokeWidth={2} />
                    Ver Hoja de Vida
                  </button>
                  <a
                    href={directWhatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-4 font-semibold w-1/2 inline-flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-white" strokeWidth={2} />
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
