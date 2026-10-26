"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  CheckCircle,
  MapPin,
  Lock,
  ArrowRight,
  Search,
  Sparkles,
  FileText,
  BadgeCheck,
  Building2,
  Clock,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Briefcase,
  PlusCircle,
  QrCode,
  Smartphone,
  Radio,
  Bike,
  Check,
} from "lucide-react";
import Image from "next/image";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { CityAutocompleteInput } from "@/components/ui/CityAutocompleteInput";
import { useAuth } from "@/lib/supabase/useAuth";
import { createClient } from "@/lib/supabase/client";

const HERO_SCENES = [
  {
    id: "vigilante",
    image: "/images/hero/hero-vigilante.jpg",
    tag: "Vigilancia Corporativa",
    alt: "Guardas de seguridad privada en torniquetes de cristal en rascacielos empresarial de Bogotá",
  },
  {
    id: "cctv",
    image: "/images/hero/hero-cctv.jpg",
    tag: "Operación CCTV",
    alt: "Operador de medios tecnológicos monitoreando centro de control de cámaras de seguridad",
  },
  {
    id: "supervisor",
    image: "/images/hero/hero-supervisor.jpg",
    tag: "Supervisión Táctica",
    alt: "Supervisor de seguridad privada con radio y tablet inspeccionando puesto corporativo",
  },
  {
    id: "escolta",
    image: "/images/hero/hero-escolta.jpg",
    tag: "Protección & Escoltas",
    alt: "Escolta ejecutivo y motorizado junto a camioneta blindada frente a edificio financiero",
  },
];

export default function HomePage() {
  const router = useRouter();
  const { role, isAuthenticated, fullName } = useAuth();
  const [roleSearch, setRoleSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [warningToast, setWarningToast] = useState<string | null>(null);
  const [featuredJobs, setFeaturedJobs] = useState<any[]>([]);
  const [activeDirectoryTab, setActiveDirectoryTab] = useState<"localizacion" | "cargos">("localizacion");
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSceneIndex((prev) => (prev + 1) % HERO_SCENES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadFeaturedJobs() {
      try {
        const supabase = createClient();
        let { data, error } = await supabase
          .from("job_posts")
          .select("*, companies(company_name, is_verified_company)")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(3);

        if (error || !data || data.length === 0) {
          const fallback = await supabase
            .from("jobs")
            .select("*, companies(company_name, is_verified_company)")
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(3);
          if (!fallback.error && fallback.data && fallback.data.length > 0) {
            data = fallback.data;
            error = null;
          }
        }

        if (!error && data && data.length > 0) {
          const mapped = data.map((j: any) => ({
            id: j.id,
            company: j.companies?.company_name || "Empresa de Seguridad",
            companyInitials: (j.companies?.company_name || "ES").slice(0, 2).toUpperCase(),
            title: j.title,
            role: j.role_required,
            location: `${j.city}${j.zone_neighborhood ? ` • ${j.zone_neighborhood}` : ""}`,
            salary: `$${Number(j.salary_monthly).toLocaleString("es-CO")} COP`,
            shift: j.shift || "Turno rotativo",
            compatibility: "95%",
            description: j.description,
          }));
          setFeaturedJobs(mapped);
          return;
        }
      } catch {}

      setFeaturedJobs([]);
    }

    loadFeaturedJobs();
  }, []);

  const handleApplyClick = (jobId: string) => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent("/vacantes")}`);
      return;
    }

    if (role === "company") {
      setWarningToast(
        "Tu sesión actual es de Empresa de Seguridad. Las postulaciones a vacantes son exclusivas para Personal Operativo."
      );
      setTimeout(() => setWarningToast(null), 4500);
      return;
    }

    router.push(`/vacantes?apply=${jobId}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (roleSearch.trim()) query.set("search", roleSearch.trim());
    if (locationSearch.trim()) query.set("city", locationSearch.trim());
    router.push(`/vacantes?${query.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F2F5F8] text-[#313944] font-sans antialiased">
      {/* Toast Warning */}
      {warningToast && (
        <div className="fixed top-20 right-4 z-50 max-w-md bg-amber-50/95 border border-amber-200/80 text-amber-900 px-4 py-3 rounded-lg shadow-lg flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs font-medium leading-relaxed">
            {warningToast}
          </div>
        </div>
      )}

      {/* 1. NAVBAR GLOBAL COMPUTRAVAJO STYLE */}
      <Navbar />

      {/* 2. HERO CINEMÁTICO CON SECUENCIA CONTINUA, OVERLAY Y BUSCADOR EN PÍLDORA */}
      <section className="relative min-h-[580px] sm:min-h-[620px] text-white pt-14 pb-16 sm:pb-24 overflow-hidden flex items-center justify-center">
        {/* FONDO DINÁMICO MULTICAPA DETRÁS DEL CONTENIDO */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {HERO_SCENES.map((scene, idx) => {
            const isActive = idx === activeSceneIndex;
            return (
              <div
                key={scene.id}
                className={`absolute inset-0 w-full h-full hero-cinematic-slide ${
                  isActive ? "active" : "inactive"
                }`}
                aria-hidden={!isActive}
              >
                <Image
                  src={scene.image}
                  alt={scene.alt}
                  fill
                  priority={idx === 0}
                  sizes="100vw"
                  quality={85}
                  className="object-cover object-center w-full h-full"
                />
              </div>
            );
          })}

          {/* OVERLAY INSTITUCIONAL PARA CONTRASTE PERFECTO */}
          {/* 1. Gradiente vertical azul marino translúcido */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#072140]/80 via-[#0B3B70]/70 to-[#072140]/88" />

          {/* 2. Radial vignette suave para centrar la mirada en el buscador y titular */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(7,33,64,0.6)_100%)]" />

          {/* 3. Textura sutil de cuadrícula tecnológica */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#FFFFFF_1px,transparent_1px)] [background-size:24px_24px]" />
        </div>

        {/* CONTENIDO PRINCIPAL DEL HERO */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6 w-full">
          {/* Fila de Insignia Oficial + Especialidad en Escena */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
            {/* Badge superior pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#072140]/60 backdrop-blur-md border border-white/20 text-xs font-semibold text-white tracking-wide shadow-xs">
              <Shield className="w-4 h-4 text-emerald-400" strokeWidth={2} />
              <span>Portal Oficial de Empleo en Seguridad Privada • Colombia</span>
            </div>

            {/* Etiqueta dinámica de la especialidad activa */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-white shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFE066] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFE066]"></span>
              </span>
              <span className="text-slate-300 text-[11px]">Especialidad en escena:</span>
              <span className="text-[#FFE066] font-bold text-xs">{HERO_SCENES[activeSceneIndex].tag}</span>
            </div>
          </div>

          {/* Gran Título Hero */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight drop-shadow-sm">
            Encuentra tu próximo empleo en{" "}
            <span className="text-[#FFE066] drop-shadow-xs">seguridad privada</span>
          </h1>

          {/* Subtítulo */}
          <p className="text-sm sm:text-base text-slate-200 max-w-2xl mx-auto font-normal leading-relaxed drop-shadow-xs">
            Miles de vacantes verificadas para vigilantes, escoltas, supervisores y operadores de medios tecnológicos con salario legal y turno garantizado.
          </p>

          {/* BUSCADOR GIGANTE EN PÍLDORA BLANCA (ROUNDED-FULL) */}
          <div className="pt-2 max-w-4xl mx-auto">
            <form
              onSubmit={handleSearchSubmit}
              className="rounded-full bg-white p-2 sm:p-2.5 shadow-2xl flex flex-col md:flex-row items-center gap-2 border border-slate-100 text-slate-900 transition-all focus-within:ring-4 focus-within:ring-[#005DA4]/20"
            >
              {/* Campo 1: Cargo o Categoría */}
              <div className="flex-1 w-full px-4 py-2 flex items-center gap-3 text-left">
                <Briefcase className="w-5 h-5 text-slate-400 shrink-0" strokeWidth={2} />
                <div className="w-full">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
                    Cargo o Categoría
                  </label>
                  <input
                    type="text"
                    value={roleSearch}
                    onChange={(e) => setRoleSearch(e.target.value)}
                    placeholder="Vigilante 2x2x2, Escolta, Operador CCTV..."
                    className="w-full text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Divisor vertical */}
              <div className="hidden md:block w-px h-9 bg-slate-200" />

              {/* Campo 2: Lugar */}
              <div className="flex-1 w-full px-4 py-2 flex items-center gap-3 text-left relative">
                <MapPin className="w-5 h-5 text-slate-400 shrink-0" strokeWidth={2} />
                <div className="w-full">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
                    Lugar
                  </label>
                  <CityAutocompleteInput
                    value={locationSearch}
                    onChange={setLocationSearch}
                    placeholder="Bogotá D.C., Medellín, Cali..."
                  />
                </div>
              </div>

              {/* Botón Píldora Computrabajo #0B3B70 con Micro-interacción Emil Kowalski */}
              <button
                type="submit"
                className="hero-search-btn rounded-full bg-[#0B3B70] text-white font-bold px-8 py-3.5 text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shrink-0 w-full md:w-auto active:scale-[0.97] transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
              >
                <Search className="w-4 h-4" strokeWidth={2.5} />
                <span>Buscar empleos</span>
              </button>
            </form>

            {/* Accesos rápidos de búsqueda con Micro-interacciones Emil Kowalski */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-200">
              <span className="font-semibold text-slate-300">Búsquedas populares:</span>
              {[
                "Vigilante Fijo 2x2x2",
                "Escolta Motorizado",
                "Operador CCTV",
                "Supervisor de Puesto",
                "Bogotá D.C.",
              ].map((term) => (
                <Link
                  key={term}
                  href={`/vacantes?search=${encodeURIComponent(term)}`}
                  className="hero-chip rounded-full bg-white/10 backdrop-blur-xs border border-white/20 px-3 py-1 text-[11px] font-medium text-white shadow-2xs active:scale-[0.97] transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
                >
                  {term}
                </Link>
              ))}
            </div>

            {/* Indicador de escena en píldoras interactivas */}
            <div className="flex items-center justify-center gap-1.5 pt-4">
              {HERO_SCENES.map((scene, idx) => (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => setActiveSceneIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                    idx === activeSceneIndex
                      ? "w-7 bg-[#FFE066] shadow-xs"
                      : "w-2 bg-white/30 hover:bg-white/60"
                  }`}
                  aria-label={`Ver escena ${scene.tag}`}
                  title={scene.tag}
                />
              ))}
            </div>
          </div>
        </div>

        {/* CIERRE INFERIOR EN ARCO CURVO BLANCO EXACTO */}
        <div className="absolute bottom-0 inset-x-0 w-full overflow-hidden leading-none pointer-events-none z-20">
          <svg
            viewBox="0 0 1440 60"
            fill="none"
            preserveAspectRatio="none"
            className="w-full h-7 sm:h-12 block fill-[#F2F5F8]"
          >
            <path d="M0,0 C480,60 960,60 1440,0 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </section>

      {/* 3. WORKSPACE PRINCIPAL: VACANTES DESTACADAS (CON RETENCIÓN DE LOGICA DE ROL) */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* COLUMNA IZQUIERDA: FEED DE VACANTES DESTACADAS (7 COLS) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between pb-1">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-[#0B3B70]">
                  Ofertas de Empleo Destacadas
                </h2>
                <p className="text-xs text-[#627384]">
                  Empresas con acreditación de la Superintendencia de Vigilancia
                </p>
              </div>

              <Link
                href="/vacantes"
                className="rounded-full border border-slate-300 hover:border-[#0B3B70] text-xs font-bold text-[#0B3B70] px-3.5 py-1.5 transition-all bg-white shadow-2xs inline-flex items-center gap-1"
              >
                <span>Ver todas las vacantes</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {featuredJobs.length === 0 ? (
              <div className="bg-white border border-[#E1E4E9] rounded-2xl p-10 text-center shadow-xs space-y-3">
                <Briefcase className="w-10 h-10 text-slate-300 mx-auto" strokeWidth={1.5} />
                <h3 className="text-sm font-bold text-slate-800">
                  Explora las ofertas activas en el buscador
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Encuentra vacantes por especialidad, turno y ciudad en nuestro buscador interactivo.
                </p>
                <Link
                  href="/vacantes"
                  className="rounded-full bg-[#0B3B70] text-white text-xs font-bold px-5 py-2 inline-flex items-center gap-1.5 shadow-xs"
                >
                  Ir al Buscador de Vacantes
                </Link>
              </div>
            ) : (
              featuredJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white border border-[#E1E4E9] hover:border-[#0B3B70] rounded-2xl p-5 transition-all shadow-xs hover:shadow-md space-y-3 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#EAF3FA] border border-[#D5E6F5] flex items-center justify-center font-bold text-[#0B3B70] text-xs shrink-0">
                        {job.companyInitials}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-xs text-slate-700">
                            {job.company}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Verificada
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-[#005DA4] transition-colors mt-0.5">
                          {job.title}
                        </h3>
                      </div>
                    </div>

                    <span className="text-xs font-bold font-mono text-[#0B3B70] bg-[#EAF3FA] px-2.5 py-0.5 rounded-full border border-[#D5E6F5] tabular-nums shrink-0">
                      {job.compatibility} Match
                    </span>
                  </div>

                  {/* Pills de datos clave */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-[#F2F5F8] text-slate-700 px-3 py-1 font-medium flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-slate-500" />
                      {job.role}
                    </span>
                    <span className="rounded-full bg-[#F2F5F8] text-slate-700 px-3 py-1 font-medium flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {job.location}
                    </span>
                    <span className="rounded-full bg-[#F2F5F8] text-[#0B3B70] px-3 py-1 font-bold font-mono tabular-nums">
                      {job.salary} • {job.shift}
                    </span>
                  </div>

                  <p className="text-xs text-[#627384] line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2.5} />
                      Postulación 100% gratuita
                    </span>

                    <button
                      type="button"
                      onClick={() => handleApplyClick(job.id)}
                      className="rounded-full bg-[#0B3B70] hover:bg-[#082a52] text-white text-xs font-bold px-4 py-2 transition-all shadow-xs"
                    >
                      Postularme Ahora
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* COLUMNA DERECHA: AISLAMIENTO DE ROLES O VISTA PREVIA (5 COLS) */}
          <div className="lg:col-span-5 space-y-4">
            {isAuthenticated && role === "company" ? (
              /* PANEL EMPRESA */
              <div className="bg-white border border-[#E1E4E9] rounded-2xl p-6 shadow-xs sticky top-24 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-[#EAF3FA] text-[#0B3B70] flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                      Sesión de Empresa
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                      {fullName || "Portal Corporativo"}
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-[#627384] leading-relaxed">
                  Gestiona tus procesos de selección, revisa el semáforo de credenciales y solicita poligrafías en 1 clic.
                </p>

                <div className="space-y-2 pt-1">
                  <Link
                    href="/empresa/vacantes/nueva"
                    className="w-full rounded-full bg-[#0B3B70] hover:bg-[#082a52] text-white text-xs font-bold py-2.5 px-4 text-center block shadow-xs transition-all"
                  >
                    Publicar Nueva Vacante ⚡
                  </Link>
                  <Link
                    href="/empresa/vacantes"
                    className="w-full rounded-full border border-slate-300 text-slate-700 hover:border-[#0B3B70] hover:text-[#0B3B70] text-xs font-bold py-2.5 px-4 text-center block transition-all"
                  >
                    Bandeja ATS & Candidatos
                  </Link>
                  <Link
                    href="/empresa/relevos"
                    className="w-full rounded-full bg-[#EAF3FA] text-[#0B3B70] hover:bg-[#d5e6f5] text-xs font-bold py-2.5 px-4 text-center block transition-all"
                  >
                    Radar de Relevos Urgentes
                  </Link>
                </div>
              </div>
            ) : isAuthenticated && role === "candidate" ? (
              /* PANEL CANDIDATO */
              <div className="bg-white border border-[#E1E4E9] rounded-2xl p-6 shadow-xs sticky top-24 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <Shield className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Personal Operativo
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                      {fullName || "Mi Cuenta"}
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-[#627384] leading-relaxed">
                  Tu perfil auditado te da máxima prioridad de contacto ante empresas líderes de seguridad en Colombia.
                </p>

                <div className="space-y-2 pt-1">
                  <Link
                    href="/guarda/perfil"
                    className="w-full rounded-full bg-[#0B3B70] hover:bg-[#082a52] text-white text-xs font-bold py-2.5 px-4 text-center block shadow-xs transition-all"
                  >
                    Mi Hoja de Vida & Documentos
                  </Link>
                  <Link
                    href="/guarda/postulaciones"
                    className="w-full rounded-full border border-slate-300 text-slate-700 hover:border-[#0B3B70] hover:text-[#0B3B70] text-xs font-bold py-2.5 px-4 text-center block transition-all"
                  >
                    Seguimiento de Mis Postulaciones
                  </Link>
                </div>
              </div>
            ) : (
              /* VISITANTE SIN SESIÓN: EXPEDIENTE DEMOSTRATIVO SOBRIO */
              <div className="bg-white border border-[#E1E4E9] rounded-2xl p-6 shadow-xs sticky top-24 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-[#EAF3FA] text-[#0B3B70] flex items-center justify-center font-bold text-sm">
                    FV
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      Expediente Confiable
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                      Ficha de Confiabilidad Auditada
                    </h3>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#EAF3FA] border border-[#D5E6F5] text-xs text-[#0B3B70] font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Curso Vigente • Sin Antecedentes • Acreditado</span>
                </div>

                <p className="text-xs text-[#627384] leading-relaxed">
                  Las empresas líderes contratan personal verificado en FuerzaVerificada para garantizar cero riesgos y máxima confiabilidad en sus puestos.
                </p>

                <div className="pt-2">
                  <Link
                    href="/login"
                    className="w-full rounded-full bg-[#0B3B70] hover:bg-[#082a52] text-white text-xs font-bold py-2.5 px-4 text-center block shadow-xs transition-all"
                  >
                    Crear mi Hoja de Vida en 1 Clic
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. SECCIÓN EMPRESAS EN AZUL HIELO (#EAF3FA) CON 3 TARJETAS FLOTANTES Y FLECHAS CURVAS */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Botón superior centrado */}
        <div className="text-center mb-4">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border border-[#D5E6F5] text-xs font-bold text-[#0B3B70] shadow-2xs">
            ¿Quieres publicar ofertas de seguridad?
          </span>
        </div>

        {/* Contenedor Azul Hielo */}
        <div className="bg-[#EAF3FA] border border-[#D5E6F5] rounded-3xl p-8 sm:p-12 text-center space-y-8">
          <div className="max-w-3xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B3B70] tracking-tight">
              ¿Eres empresa? Recluta gratis al mejor talento hoy mismo
            </h2>
            <p className="text-xs sm:text-sm text-[#4B5968] leading-relaxed">
              Publica tus vacantes de vigilancia, valida credenciales SuperVigilancia al instante y ordena estudios de confiabilidad sin intermediarios.
            </p>
          </div>

          {/* 3 Tarjetas Flotantes conectadas por flechas curvas SVG */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative max-w-5xl mx-auto">
            {/* Tarjeta 1 (Morado #6E5DC6) */}
            <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 text-left space-y-3 relative">
              <div className="w-10 h-10 rounded-full bg-[#6E5DC6] text-white flex items-center justify-center font-extrabold text-sm shadow-xs">
                1
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                Publica en 30 segundos
              </h3>
              <p className="text-xs text-[#627384] leading-relaxed">
                Usa plantillas oficiales preconfiguradas para Vigilante 2x2x2, Escolta Motorizado o CCTV con funciones ya aprobadas.
              </p>

              {/* Flecha curva SVG hacia la tarjeta 2 */}
              <div className="hidden md:block absolute -right-5 top-1/2 -translate-y-1/2 z-20 pointer-events-none text-[#0B3B70]/40">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                </svg>
              </div>
            </div>

            {/* Tarjeta 2 (Verde Menta #4FB5A3) */}
            <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 text-left space-y-3 relative">
              <div className="w-10 h-10 rounded-full bg-[#4FB5A3] text-white flex items-center justify-center font-extrabold text-sm shadow-xs">
                2
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                Filtra por semáforo de idoneidad
              </h3>
              <p className="text-xs text-[#627384] leading-relaxed">
                Detecta en 2 segundos si el aspirante tiene Curso SuperVigilancia vigente, antecedentes limpios, libreta militar y moto propia.
              </p>

              {/* Flecha curva SVG hacia la tarjeta 3 */}
              <div className="hidden md:block absolute -right-5 top-1/2 -translate-y-1/2 z-20 pointer-events-none text-[#0B3B70]/40">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                </svg>
              </div>
            </div>

            {/* Tarjeta 3 (Azul #005DA4) */}
            <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 text-left space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#005DA4] text-white flex items-center justify-center font-extrabold text-sm shadow-xs">
                3
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                Cita en 1 clic y contrata
              </h3>
              <p className="text-xs text-[#627384] leading-relaxed">
                Cita a entrevista vía WhatsApp con un toque o solicita pruebas de poligrafía y visita domiciliaria con informe pericial garantizado.
              </p>
            </div>
          </div>

          {/* CTA Botón Grande */}
          <div className="pt-2">
            <Link
              href="/login?role=company"
              className="rounded-full bg-[#0B3B70] hover:bg-[#082a52] text-white font-bold px-8 py-3.5 text-xs sm:text-sm inline-flex items-center gap-2 shadow-md transition-all"
            >
              <span>Publicar Vacante Gratis Ahora</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. BANNER CON ETIQUETA AMARILLA "NUEVO" + 4 TARJETAS VERTICALES (3 EN #EAF3FA + 1 EN #005DA4 CON CELULAR Y QR) */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="space-y-2 mb-8">
          <div className="flex items-center gap-2">
            <span className="bg-[#FFE066] text-[#664D03] text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
              Nuevo
            </span>
            <span className="text-xs font-bold text-[#0B3B70] uppercase tracking-wider">
              Innovación para el Sector Seguridad
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#0B3B70] tracking-tight">
            Herramientas tácticas de contratación y confiabilidad
          </h2>
        </div>

        {/* Grid de 4 tarjetas verticales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Tarjeta 1: Semáforo de Cursos */}
          <div className="bg-[#EAF3FA] rounded-2xl p-6 border border-[#D5E6F5] flex flex-col justify-between hover:shadow-md transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#D5E6F5] text-[#0B3B70] flex items-center justify-center font-bold">
                <Shield className="w-5 h-5 text-[#005DA4]" />
              </div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                Semáforo de Cursos SuperVigilancia
              </h3>
              <p className="text-xs text-[#627384] leading-relaxed">
                Verificación matemática de días de vigencia ante las directrices de la Superintendencia para blindar la operación.
              </p>
            </div>
            <Link
              href="/guarda/documentos"
              className="text-xs font-bold text-[#0B3B70] mt-5 inline-flex items-center gap-1 hover:text-[#005DA4]"
            >
              <span>Consultar semáforo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Tarjeta 2: Relevos Urgentes 24/7 */}
          <div className="bg-[#EAF3FA] rounded-2xl p-6 border border-[#D5E6F5] flex flex-col justify-between hover:shadow-md transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#D5E6F5] text-[#0B3B70] flex items-center justify-center font-bold">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                Radar de Relevos Urgentes 24/7
              </h3>
              <p className="text-xs text-[#627384] leading-relaxed">
                Directorio en tiempo real de guardas y escoltas con disponibilidad hoy para cubrir incapacidades y ausencias críticas.
              </p>
            </div>
            <Link
              href="/empresa/relevos"
              className="text-xs font-bold text-[#0B3B70] mt-5 inline-flex items-center gap-1 hover:text-[#005DA4]"
            >
              <span>Ver radar activo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Tarjeta 3: Poligrafía & Visitas */}
          <div className="bg-[#EAF3FA] rounded-2xl p-6 border border-[#D5E6F5] flex flex-col justify-between hover:shadow-md transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#D5E6F5] text-[#0B3B70] flex items-center justify-center font-bold">
                <Lock className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                Laboratorio de Poligrafía & Visitas
              </h3>
              <p className="text-xs text-[#627384] leading-relaxed">
                Estudios de seguridad preempleo y de rutina con peritos certificados y entrega de informe pericial en 48 horas.
              </p>
            </div>
            <Link
              href="/empresa/estudios"
              className="text-xs font-bold text-[#0B3B70] mt-5 inline-flex items-center gap-1 hover:text-[#005DA4]"
            >
              <span>Ver paquetes B2B</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Tarjeta 4: App Móvil en Azul #005DA4 con Celular y QR */}
          <div className="bg-[#005DA4] text-white rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-lg">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#FFE066]" />
                <span className="text-[11px] font-bold text-[#FFE066] uppercase tracking-wider">
                  Acceso Móvil
                </span>
              </div>
              <h3 className="text-base font-bold leading-snug text-white">
                FuerzaVerificada en tu celular
              </h3>
              <p className="text-xs text-slate-200 leading-relaxed">
                Escanea el código para postularte y recibir citaciones por WhatsApp.
              </p>
            </div>

            {/* QR Box simulado */}
            <div className="bg-white p-2.5 rounded-xl w-24 h-24 mx-auto my-3 flex flex-col items-center justify-center text-slate-900 shadow-sm">
              <QrCode className="w-14 h-14 text-[#005DA4]" />
              <span className="text-[9px] font-mono font-bold text-[#005DA4]">ESCANEAR</span>
            </div>

            <Link
              href="/vacantes"
              className="rounded-full bg-white text-[#005DA4] hover:bg-slate-50 font-bold text-xs py-2 px-4 text-center transition-colors shadow-xs"
            >
              Escanear y Postularme
            </Link>
          </div>
        </div>
      </section>

      {/* 6. DIRECTORIO POR PESTAÑAS (LOCALIZACIÓN | CARGOS) CON ÁRBOL └ EN 4 COLUMNAS */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="bg-white border border-[#E1E4E9] rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E1E4E9]">
            <div>
              <h3 className="text-lg font-bold text-[#0B3B70]">
                Directorio de Empleos en Seguridad Privada
              </h3>
              <p className="text-xs text-[#627384]">
                Explora las convocatorias abiertas por ciudad o perfil especializado
              </p>
            </div>

            {/* Tabs de Selección */}
            <div className="inline-flex p-1 rounded-full bg-[#F2F5F8] border border-[#E1E4E9]">
              <button
                type="button"
                onClick={() => setActiveDirectoryTab("localizacion")}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                  activeDirectoryTab === "localizacion"
                    ? "bg-[#0B3B70] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Por Localización
              </button>
              <button
                type="button"
                onClick={() => setActiveDirectoryTab("cargos")}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                  activeDirectoryTab === "cargos"
                    ? "bg-[#0B3B70] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Por Cargo Profesional
              </button>
            </div>
          </div>

          {/* Contenido en 4 Columnas con árbol └ */}
          {activeDirectoryTab === "localizacion" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
              {/* Columna 1: Bogotá D.C. */}
              <div className="space-y-2">
                <Link href="/vacantes?city=Bogotá" className="font-bold text-slate-900 hover:text-[#005DA4] block">
                  Bogotá D.C.
                </Link>
                <div className="space-y-1 text-[#627384] pl-2 font-mono">
                  <Link href="/vacantes?city=Bogotá&search=Suba" className="block hover:text-[#005DA4]">
                    └ Vigilantes en Suba
                  </Link>
                  <Link href="/vacantes?city=Bogotá&search=Chapinero" className="block hover:text-[#005DA4]">
                    └ Vigilantes en Chapinero
                  </Link>
                  <Link href="/vacantes?city=Bogotá&search=Kennedy" className="block hover:text-[#005DA4]">
                    └ Vigilantes en Kennedy
                  </Link>
                  <Link href="/vacantes?city=Bogotá&search=Fontibón" className="block hover:text-[#005DA4]">
                    └ Vigilantes en Fontibón
                  </Link>
                  <Link href="/vacantes?city=Bogotá&search=Engativá" className="block hover:text-[#005DA4]">
                    └ Vigilantes en Engativá
                  </Link>
                </div>
              </div>

              {/* Columna 2: Medellín */}
              <div className="space-y-2">
                <Link href="/vacantes?city=Medellín" className="font-bold text-slate-900 hover:text-[#005DA4] block">
                  Medellín y Antioquia
                </Link>
                <div className="space-y-1 text-[#627384] pl-2 font-mono">
                  <Link href="/vacantes?city=Medellín&search=Poblado" className="block hover:text-[#005DA4]">
                    └ Escoltas en El Poblado
                  </Link>
                  <Link href="/vacantes?city=Medellín&search=Envigado" className="block hover:text-[#005DA4]">
                    └ Operadores CCTV en Envigado
                  </Link>
                  <Link href="/vacantes?city=Medellín&search=Bello" className="block hover:text-[#005DA4]">
                    └ Vigilantes en Bello
                  </Link>
                  <Link href="/vacantes?city=Medellín&search=Rionegro" className="block hover:text-[#005DA4]">
                    └ Supervisores en Rionegro
                  </Link>
                  <Link href="/vacantes?city=Medellín&search=Itagüí" className="block hover:text-[#005DA4]">
                    └ Seguridad en Itagüí
                  </Link>
                </div>
              </div>

              {/* Columna 3: Cali y Valle */}
              <div className="space-y-2">
                <Link href="/vacantes?city=Cali" className="font-bold text-slate-900 hover:text-[#005DA4] block">
                  Cali y Valle del Cauca
                </Link>
                <div className="space-y-1 text-[#627384] pl-2 font-mono">
                  <Link href="/vacantes?city=Cali&search=Norte" className="block hover:text-[#005DA4]">
                    └ Vigilantes Fijos en Cali
                  </Link>
                  <Link href="/vacantes?city=Cali&search=Yumbo" className="block hover:text-[#005DA4]">
                    └ Escoltas Industriales en Yumbo
                  </Link>
                  <Link href="/vacantes?city=Cali&search=Palmira" className="block hover:text-[#005DA4]">
                    └ Operadores en Palmira
                  </Link>
                  <Link href="/vacantes?city=Cali&search=Jamundí" className="block hover:text-[#005DA4]">
                    └ Seguridad en Jamundí
                  </Link>
                  <Link href="/vacantes?city=Cali&search=Buenaventura" className="block hover:text-[#005DA4]">
                    └ Custodia Portuaria Buenaventura
                  </Link>
                </div>
              </div>

              {/* Columna 4: Costa Caribe y Santanderes */}
              <div className="space-y-2">
                <Link href="/vacantes?city=Barranquilla" className="font-bold text-slate-900 hover:text-[#005DA4] block">
                  Caribe y Santanderes
                </Link>
                <div className="space-y-1 text-[#627384] pl-2 font-mono">
                  <Link href="/vacantes?city=Barranquilla" className="block hover:text-[#005DA4]">
                    └ Vigilantes en Barranquilla
                  </Link>
                  <Link href="/vacantes?city=Cartagena" className="block hover:text-[#005DA4]">
                    └ Escoltas en Cartagena
                  </Link>
                  <Link href="/vacantes?city=Bucaramanga" className="block hover:text-[#005DA4]">
                    └ Vigilantes en Bucaramanga
                  </Link>
                  <Link href="/vacantes?city=Santa Marta" className="block hover:text-[#005DA4]">
                    └ Supervisores en Santa Marta
                  </Link>
                  <Link href="/vacantes?city=Cúcuta" className="block hover:text-[#005DA4]">
                    └ Seguridad Fronteriza Cúcuta
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
              {/* Columna 1: Vigilantes */}
              <div className="space-y-2">
                <Link href="/vacantes?search=Vigilante" className="font-bold text-slate-900 hover:text-[#005DA4] block">
                  Vigilante de Seguridad
                </Link>
                <div className="space-y-1 text-[#627384] pl-2 font-mono">
                  <Link href="/vacantes?search=Vigilante Fijo" className="block hover:text-[#005DA4]">
                    └ Vigilante Fijo 2x2x2
                  </Link>
                  <Link href="/vacantes?search=Vigilante Movil" className="block hover:text-[#005DA4]">
                    └ Vigilante Móvil con Arma
                  </Link>
                  <Link href="/vacantes?search=Guarda Residencial" className="block hover:text-[#005DA4]">
                    └ Guarda Residencial
                  </Link>
                  <Link href="/vacantes?search=Guarda Comercial" className="block hover:text-[#005DA4]">
                    └ Seguridad Comercial y Retail
                  </Link>
                </div>
              </div>

              {/* Columna 2: Escoltas */}
              <div className="space-y-2">
                <Link href="/vacantes?search=Escolta" className="font-bold text-slate-900 hover:text-[#005DA4] block">
                  Escolta Profesional
                </Link>
                <div className="space-y-1 text-[#627384] pl-2 font-mono">
                  <Link href="/vacantes?search=Escolta Motorizado" className="block hover:text-[#005DA4]">
                    └ Escolta Motorizado
                  </Link>
                  <Link href="/vacantes?search=Escolta Vehicular" className="block hover:text-[#005DA4]">
                    └ Escolta Conductor Vehicular
                  </Link>
                  <Link href="/vacantes?search=Escolta Mercancias" className="block hover:text-[#005DA4]">
                    └ Custodia de Mercancías Críticas
                  </Link>
                  <Link href="/vacantes?search=Escolta VIP" className="block hover:text-[#005DA4]">
                    └ Protección Dignatarios VIP
                  </Link>
                </div>
              </div>

              {/* Columna 3: CCTV */}
              <div className="space-y-2">
                <Link href="/vacantes?search=CCTV" className="font-bold text-slate-900 hover:text-[#005DA4] block">
                  Medios Tecnológicos
                </Link>
                <div className="space-y-1 text-[#627384] pl-2 font-mono">
                  <Link href="/vacantes?search=Operador CCTV" className="block hover:text-[#005DA4]">
                    └ Operador de Centro de Control CCTV
                  </Link>
                  <Link href="/vacantes?search=Operador Alarmas" className="block hover:text-[#005DA4]">
                    └ Operador Central de Alarmas
                  </Link>
                  <Link href="/vacantes?search=Monitoreo GPS" className="block hover:text-[#005DA4]">
                    └ Rastreo y Monitoreo Satelital GPS
                  </Link>
                  <Link href="/vacantes?search=Seguridad Electronica" className="block hover:text-[#005DA4]">
                    └ Técnico en Seguridad Electrónica
                  </Link>
                </div>
              </div>

              {/* Columna 4: Supervisores */}
              <div className="space-y-2">
                <Link href="/vacantes?search=Supervisor" className="font-bold text-slate-900 hover:text-[#005DA4] block">
                  Mandos y Supervisión
                </Link>
                <div className="space-y-1 text-[#627384] pl-2 font-mono">
                  <Link href="/vacantes?search=Supervisor Puesto" className="block hover:text-[#005DA4]">
                    └ Supervisor de Puestos Asignados
                  </Link>
                  <Link href="/vacantes?search=Supervisor Motorizado" className="block hover:text-[#005DA4]">
                    └ Supervisor de Patrulla Motorizada
                  </Link>
                  <Link href="/vacantes?search=Coordinador Operaciones" className="block hover:text-[#005DA4]">
                    └ Coordinador de Operaciones
                  </Link>
                  <Link href="/vacantes?search=Director Seguridad" className="block hover:text-[#005DA4]">
                    └ Jefe de Seguridad y Riesgos
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 7. FOOTER GLOBAL */}
      <Footer />
    </div>
  );
}
