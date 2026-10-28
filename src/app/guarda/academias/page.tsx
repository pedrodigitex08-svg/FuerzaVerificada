"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Shield,
  MapPin,
  MessageCircle,
  Search,
  CheckCircle2,
  Copy,
  Check,
  BookOpen,
  Sparkles,
  Phone,
  Building,
  ArrowRight,
  Award,
  HelpCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/useAuth";
import { generateAcademyRenewalLink } from "@/lib/utils/whatsappTemplates";
import { PartnerAcademy } from "@/types/database";

const FALLBACK_ACADEMIES: Partial<PartnerAcademy>[] = [
  {
    id: "acad-bog-1",
    name: "Academia Superior de Seguridad - Ases",
    city: "Bogotá D.C.",
    whatsapp_number: "573133778276",
    referral_code: "FUERZA2026",
    discount_text: "15% OFF en Reentrenamiento",
    is_active: true,
  },
  {
    id: "acad-med-1",
    name: "Instituto de Capacitación en Seguridad Antioquia (Inces)",
    city: "Medellín",
    whatsapp_number: "573158901234",
    referral_code: "FUERZA2026",
    discount_text: "15% OFF en Cursos y Especializaciones",
    is_active: true,
  },
  {
    id: "acad-cali-1",
    name: "Escuela de Seguridad del Valle - Escoval",
    city: "Cali",
    whatsapp_number: "573114567890",
    referral_code: "FUERZA2026",
    discount_text: "15% OFF Reentrenamiento y CCTV",
    is_active: true,
  },
  {
    id: "acad-baq-1",
    name: "Centro de Entrenamiento en Vigilancia del Caribe",
    city: "Barranquilla",
    whatsapp_number: "573009876543",
    referral_code: "FUERZA2026",
    discount_text: "15% OFF en Todos los Ciclos",
    is_active: true,
  },
  {
    id: "acad-buc-1",
    name: "Academia Santandereana de Seguridad Privada",
    city: "Bucaramanga",
    whatsapp_number: "573176543210",
    referral_code: "FUERZA2026",
    discount_text: "15% OFF Convenio FuerzaVerificada",
    is_active: true,
  },
];

const POPULAR_CITIES = [
  "Todas",
  "Bogotá D.C.",
  "Medellín",
  "Cali",
  "Barranquilla",
  "Bucaramanga",
];

export default function AcademiasPage() {
  const { fullName } = useAuth();
  const [academies, setAcademies] = useState<PartnerAcademy[]>([]);
  const [loading, setLoading] = useState(true);
  const [candidateName, setCandidateName] = useState(fullName || "");
  const [candidateCity, setCandidateCity] = useState("Bogotá D.C.");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("Todas");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      try {
        setLoading(true);
        // 1. Fetch partner academies from Supabase
        const { data: dbAcademies, error } = await supabase
          .from("partner_academies")
          .select("*")
          .eq("is_active", true)
          .order("name", { ascending: true });

        if (dbAcademies && dbAcademies.length > 0) {
          setAcademies(dbAcademies as PartnerAcademy[]);
        } else {
          setAcademies(FALLBACK_ACADEMIES as PartnerAcademy[]);
        }

        // 2. Fetch candidate profile for customized WhatsApp link
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .maybeSingle();

          if (profile?.full_name) {
            setCandidateName(profile.full_name);
          } else if (user.user_metadata?.full_name) {
            setCandidateName(user.user_metadata.full_name);
          }

          const { data: cand } = await supabase
            .from("candidate_profiles")
            .select("city")
            .eq("user_id", user.id)
            .maybeSingle();

          if (cand?.city) {
            setCandidateCity(cand.city);
          }
        }
      } catch (err) {
        console.error("Error loading partner academies:", err);
        setAcademies(FALLBACK_ACADEMIES as PartnerAcademy[]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [fullName]);

  // Handle copy referral code
  const handleCopyCode = (code: string, id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  // Filter academies based on search and selected city
  const filteredAcademies = academies.filter((acad) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      acad.name.toLowerCase().includes(q) ||
      (acad.city && acad.city.toLowerCase().includes(q)) ||
      (acad.referral_code && acad.referral_code.toLowerCase().includes(q));

    const matchesCity =
      selectedCity === "Todas" ||
      (acad.city && acad.city.toLowerCase() === selectedCity.toLowerCase());

    return matchesSearch && matchesCity;
  });

  return (
    <div className="space-y-6">
      {/* 1. CABECERA PRINCIPAL CON AUTORIDAD INSTITUCIONAL */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF3FA] border border-[#D5E6F5] text-[#0B3B70] text-xs font-semibold">
              <Shield className="w-3.5 h-3.5 text-[#005DA4]" strokeWidth={2} />
              <span>Superintendencia de Vigilancia y Seguridad Privada</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Red de Academias Aliadas • Convenios de Descuento
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Capacítate o renueva tu curso con escuelas avaladas oficialmente por la SuperVigilancia en Colombia.
              Accede a un <strong className="text-[#0B3B70]">15% de descuento exclusivo</strong> para miembros de FuerzaVerificada en cursos de Vigilancia, Escolta, Medios Tecnológicos y Supervisor.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2">
            <Link
              href="/guarda/documentos"
              className="rounded-full bg-[#F2F5F8] hover:bg-slate-200/80 text-slate-700 text-xs px-4 py-2.5 font-semibold inline-flex items-center justify-center gap-2 transition-colors border border-slate-200"
            >
              <Award className="w-3.5 h-3.5 text-[#0B3B70]" />
              <span>Mi Credencial & Vigencias</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. BARRA DE BÚSQUEDA Y FILTRO DE CIUDADES ESTILO COMPUTRABAJO */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Input de búsqueda por nombre */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar academia por nombre o palabra clave..."
              className="w-full bg-[#F2F5F8] border border-slate-200 rounded-full pl-10 pr-4 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all"
            />
          </div>

          {/* Contador de resultados */}
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap px-1">
            {filteredAcademies.length} academia{filteredAcademies.length !== 1 ? "s" : ""} disponible{filteredAcademies.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Chips de Ciudades Rápidas */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
          <span className="text-xs font-semibold text-slate-500 shrink-0">Ciudad:</span>
          {POPULAR_CITIES.map((city) => {
            const isSelected = selectedCity === city;
            return (
              <button
                key={city}
                type="button"
                onClick={() => setSelectedCity(city)}
                className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? "bg-[#0B3B70] text-white shadow-2xs"
                    : "bg-[#F2F5F8] text-slate-600 hover:bg-slate-200 border border-slate-200/80"
                }`}
              >
                {city}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. GRILLA DE TARJETAS DE ACADEMIAS CON BOTÓN DIRECTO DE WHATSAPP */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 animate-pulse"
            >
              <div className="h-4 bg-slate-200 rounded-sm w-3/4" />
              <div className="h-3 bg-slate-200 rounded-sm w-1/2" />
              <div className="h-8 bg-slate-100 rounded-lg" />
              <div className="h-10 bg-slate-200 rounded-full" />
            </div>
          ))}
        </div>
      ) : filteredAcademies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAcademies.map((acad) => {
            const referralCode = acad.referral_code || "FUERZA2026";
            const discountLabel = acad.discount_text || "15% Descuento Convenio";
            const waLink = generateAcademyRenewalLink({
              academyPhone: acad.whatsapp_number || "573133778276",
              academyName: acad.name,
              candidateName: candidateName || "Personal Operativo",
              city: acad.city || candidateCity || "Colombia",
              referralCode: referralCode,
              discountText: discountLabel,
            });

            const isCopied = copiedId === acad.id;

            return (
              <div
                key={acad.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-[#005DA4] p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4 group"
              >
                {/* Cabecera de la Tarjeta */}
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-9 h-9 rounded-xl bg-[#EAF3FA] text-[#0B3B70] flex items-center justify-center shrink-0 border border-[#D5E6F5]">
                      <GraduationCap className="w-5 h-5 text-[#005DA4]" strokeWidth={2} />
                    </div>
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                      {discountLabel}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0B3B70] transition-colors leading-snug">
                      {acad.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{acad.city || "Sede Nacional"}</span>
                    </div>
                  </div>

                  {/* Insignia SuperVigilancia */}
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50/70 border border-emerald-200/60 px-2.5 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Resolución SuperVigilancia Vigente</span>
                  </div>

                  {/* Cursos Autorizados */}
                  <div className="text-[11px] text-slate-500 space-y-1 pt-1">
                    <span className="font-semibold text-slate-700 block">Cursos con descuento:</span>
                    <div className="flex flex-wrap gap-1">
                      {["Vigilancia", "Escolta", "CCTV", "Supervisor"].map((c) => (
                        <span
                          key={c}
                          className="bg-[#F2F5F8] text-slate-700 border border-slate-200/70 rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Zona de Código de Convenio y CTA de WhatsApp */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  {/* Caja de Código Copiable */}
                  <div className="flex items-center justify-between bg-[#F2F5F8] border border-slate-200 rounded-xl px-3 py-1.5">
                    <div className="text-[11px]">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                        Código Convenio
                      </span>
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        {referralCode}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(referralCode, acad.id)}
                      className="text-xs font-semibold text-[#005DA4] hover:text-[#0B3B70] inline-flex items-center gap-1 cursor-pointer p-1"
                      title="Copiar código de convenio"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 text-[11px]">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Copiar</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Botón WhatsApp CTA */}
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 shrink-0" strokeWidth={2} />
                    <span>Contactar y Aplicar Descuento</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 shadow-2xs">
          <Building className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">
            No se encontraron academias para &ldquo;{searchTerm || selectedCity}&rdquo;
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Prueba cambiando la ciudad o borrando el término de búsqueda para ver todas las escuelas de seguridad disponibles a nivel nacional.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setSelectedCity("Todas");
            }}
            className="rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white text-xs px-5 py-2 font-semibold transition-colors cursor-pointer"
          >
            Ver todas las academias
          </button>
        </div>
      )}

      {/* 4. GUÍA NORMATIVA DE RENOVACIÓN DE CURSOS (SUPERVIGILANCIA) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-5 h-5 text-[#0B3B70]" strokeWidth={2} />
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Normativa y Preguntas Frecuentes sobre la Renovación de Cursos
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-[#F2F5F8] border border-slate-200/80 space-y-1.5">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#005DA4]" />
              ¿Cada cuánto se renueva el curso?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Según el Decreto 356 de 1994 y directivas de la SuperVigilancia, los cursos de reentrenamiento tienen una vigencia de <strong>1 año calendario</strong>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F2F5F8] border border-slate-200/80 space-y-1.5">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#005DA4]" />
              ¿Cómo obtengo el 15% de descuento?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Haz clic en <strong>&ldquo;Contactar y Aplicar Descuento&rdquo;</strong> o presenta tu código <strong>FUERZA2026</strong> por WhatsApp al momento de solicitar matrícula.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F2F5F8] border border-slate-200/80 space-y-1.5">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#005DA4]" />
              ¿Es obligatorio para ser contratado?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sí. Las empresas de seguridad privada en Colombia no pueden vincular personal operativo con cursos vencidos o sin registrar en la plataforma SuperVigilancia.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
