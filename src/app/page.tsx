"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  CheckCircle,
  CheckCircle2,
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
  GraduationCap,
  Bell,
  UserCheck,
  Compass,
  Users,
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
  const [totalActiveJobs, setTotalActiveJobs] = useState<number>(0);
  const [activeDirectoryTab, setActiveDirectoryTab] = useState<"localizacion" | "cargos">("localizacion");
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);

  // Rotación suave de escenas panorámicas del Hero
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSceneIndex((prev) => (prev + 1) % HERO_SCENES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  // Carga de vacantes destacadas y conteo real desde Supabase
  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();

        // 1. Conteo total de vacantes activas
        const { count } = await supabase
          .from("job_posts")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true);

        if (count && count > 0) {
          setTotalActiveJobs(count);
        } else {
          // Intentar conteo en tabla fallback
          const fallbackCount = await supabase
            .from("jobs")
            .select("*", { count: "exact", head: true })
            .eq("is_active", true);
          if (fallbackCount.count) {
            setTotalActiveJobs(fallbackCount.count);
          }
        }

        // 2. Carga de vacantes destacadas recientes
        let { data, error } = await supabase
          .from("job_posts")
          .select("*, companies(company_name, is_verified_company)")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(3);

        if (error || !data) {
          const direct = await supabase
            .from("job_posts")
            .select("*")
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(3);
          if (!direct.error && direct.data) {
            data = direct.data;
            error = null;
          }
        }

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
          } else {
            const fallbackDirect = await supabase
              .from("jobs")
              .select("*")
              .eq("is_active", true)
              .order("created_at", { ascending: false })
              .limit(3);
            if (!fallbackDirect.error && fallbackDirect.data) {
              data = fallbackDirect.data;
              error = null;
            }
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
      } catch (err) {
        console.error("Error cargando vacantes en portada:", err);
      }
      setFeaturedJobs([]);
    }

    loadData();
  }, []);

  const handleApplyClick = (jobId: string) => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent("/vacantes")}`);
      return;
    }

    if (role === "company") {
      setWarningToast(
        "Tu sesión actual es de Empresa de Seguridad. Las postulaciones son exclusivas para Personal Operativo."
      );
      setTimeout(() => setWarningToast(null), 4500);
      return;
    }

    router.push(`/vacantes?apply=${jobId}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    const cargo = roleSearch.trim();
    const lugar = locationSearch.trim();

    if (cargo) {
      params.set("q", cargo);
      params.set("search", cargo);
    }
    if (lugar) {
      params.set("ciudad", lugar);
      params.set("location", lugar);
      params.set("city", lugar);
    }
    const qs = params.toString();
    router.push(qs ? `/vacantes?${qs}` : "/vacantes");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F2F5F8] text-[#313944] font-sans antialiased">
      {/* Toast Warning */}
      {warningToast && (
        <div className="fixed top-20 right-4 z-50 max-w-md bg-amber-50/95 border border-amber-200/80 text-amber-900 px-4 py-3 rounded-lg shadow-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs font-medium leading-relaxed">{warningToast}</div>
        </div>
      )}

      {/* NAVBAR GLOBAL ESTILO COMPUTRABAJO */}
      <Navbar />

      {/* ========================================================================= */}
      {/* BLOQUE 1: HERO CON IMAGEN CORPORATIVA, PÍLDORA GIGANTE Y CURVA EN ARCO    */}
      {/* ========================================================================= */}
      <section className="relative min-h-[580px] sm:min-h-[620px] text-white pt-16 pb-20 sm:pb-28 overflow-hidden flex items-center justify-center">
        {/* Fondo dinámico multicapa con fotografías panorámicas hiperrealistas */}
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

          {/* Superposición oscura corporativa (bg-slate-900/55 con gradientes para legibilidad) */}
          <div className="absolute inset-0 bg-slate-900/60" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#072140]/85 via-[#0B3B70]/65 to-[#072140]/90" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(7,33,64,0.65)_100%)]" />
        </div>

        {/* Contenido principal del Hero */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6 w-full">
          {/* Badge superior pill */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#072140]/70 backdrop-blur-md border border-white/20 text-xs font-semibold text-white tracking-wide shadow-xs">
              <Shield className="w-4 h-4 text-emerald-400" strokeWidth={2} />
              <span>Portal Oficial de Empleo en Seguridad Privada • Colombia</span>
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-white shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFE066] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFE066]" />
              </span>
              <span className="text-slate-300 text-[11px]">Especialidad:</span>
              <span className="text-[#FFE066] font-bold text-xs">{HERO_SCENES[activeSceneIndex].tag}</span>
            </div>
          </div>

          {/* Gran Título Hero Institucional de Autoridad */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight drop-shadow-md">
            El Portal de Empleo y Confiabilidad para la Seguridad Privada en Colombia
          </h1>

          {/* Subtítulo 100% Real (Cero cifras infladas) */}
          <p className="text-sm sm:text-base md:text-lg text-slate-100 max-w-3xl mx-auto font-normal leading-relaxed drop-shadow-xs">
            Conecta directamente con empresas de vigilancia autorizadas para cargos de Guarda, Escolta, Supervisor y Operador CCTV.
          </p>

          {/* BUSCADOR EN PÍLDORA BLANCA GIGANTE (ROUNDED-FULL) */}
          <div className="pt-2 max-w-4xl mx-auto w-full">
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white rounded-full p-2 sm:p-2.5 shadow-2xl flex flex-col md:flex-row items-center gap-2 border border-slate-100 text-slate-900 transition-all focus-within:ring-4 focus-within:ring-[#005DA4]/20"
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
                    placeholder="Cargo o categoría (Vigilante, Escolta, CCTV...)"
                    className="w-full text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Divisor vertical */}
              <div className="hidden md:block h-8 w-px bg-slate-200" />

              {/* Campo 2: Lugar o Ciudad */}
              <div className="flex-1 w-full px-4 py-2 flex items-center gap-3 text-left relative">
                <div className="w-full">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-tight mb-0.5">
                    Lugar o Ciudad
                  </label>
                  <CityAutocompleteInput
                    value={locationSearch}
                    onChange={setLocationSearch}
                    placeholder="Lugar o ciudad (Bogotá, Barranquilla...)"
                  />
                </div>
              </div>

              {/* Botón Píldora Azul Marino (#0B3B70) */}
              <button
                type="submit"
                className="rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white font-semibold px-8 py-3.5 text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shrink-0 w-full md:w-auto active:scale-[0.98] transition-all cursor-pointer"
              >
                <Search className="w-4 h-4" strokeWidth={2.5} />
                <span>Buscar empleos</span>
              </button>
            </form>

            {/* Accesos rápidos en píldoras */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-200">
              <span className="font-semibold text-slate-300">Búsquedas populares:</span>
              {[
                "Vigilante Fijo 2x2x2",
                "Escolta Motorizado",
                "Operador CCTV",
                "Supervisor de Puesto",
                "Bogotá D.C.",
                "Barranquilla",
              ].map((term) => (
                <Link
                  key={term}
                  href={`/vacantes?q=${encodeURIComponent(term)}&search=${encodeURIComponent(term)}`}
                  className="rounded-full bg-white/10 backdrop-blur-xs border border-white/20 px-3 py-1 text-[11px] font-medium text-white shadow-2xs hover:bg-white/20 transition-colors"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Curva inferior en arco suave hacia el fondo #F2F5F8 */}
        <div className="absolute bottom-0 inset-x-0 w-full overflow-hidden leading-none pointer-events-none z-20">
          <svg
            viewBox="0 0 1440 60"
            fill="none"
            preserveAspectRatio="none"
            className="w-full h-8 sm:h-14 block fill-[#F2F5F8]"
          >
            <path d="M0,0 C480,60 960,60 1440,0 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </section>

      {/* TEXTO INFORMATIVO JUSTO DEBAJO DE LA CURVA EN ARCO */}
      <div className="py-4 px-4 text-center">
        <p className="text-xs sm:text-sm font-medium text-[#627384]">
          Convocatorias verificadas con respaldo normativo y validación SuperVigilancia
        </p>
      </div>

      {/* VACANTES DESTACADAS RECIENTES (CONSULTA REAL DE SUPABASE) */}
      {featuredJobs.length > 0 && (
        <section className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#0B3B70]">
                Ofertas de Empleo Destacadas
              </h2>
              <p className="text-xs text-[#627384]">
                Empresas con acreditación de la Superintendencia de Vigilancia
              </p>
            </div>

            <Link
              href="/vacantes"
              className="rounded-full border border-slate-300 hover:border-[#0B3B70] text-xs font-bold text-[#0B3B70] px-4 py-2 transition-all bg-white shadow-2xs inline-flex items-center gap-1.5"
            >
              <span>Ver todas las ofertas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featuredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white border border-[#E1E4E9] hover:border-[#0B3B70] rounded-2xl p-5 transition-all shadow-xs hover:shadow-md flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      Verificada
                    </span>
                    <span className="text-[11px] font-bold font-mono text-[#0B3B70] bg-[#EAF3FA] px-2 py-0.5 rounded-full border border-[#D5E6F5] tabular-nums">
                      {job.compatibility} Match
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-[#005DA4] transition-colors line-clamp-1">
                    {job.title}
                  </h3>

                  <p className="text-xs font-semibold text-slate-600">
                    {job.company} • <span className="font-normal text-slate-500">{job.location}</span>
                  </p>

                  <p className="text-xs text-[#627384] line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0B3B70] tabular-nums">
                    {job.salary}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleApplyClick(job.id)}
                    className="rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white text-xs font-bold px-3.5 py-1.5 transition-all shadow-xs"
                  >
                    Postularme
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* BLOQUE 2: SECCIÓN EMPRESAS EN AZUL HIELO (#EAF3FA) CON 3 TARJETAS FLOTANTES */}
      {/* Y 2 FLECHAS CURVAS SVG CONECTANDO LOS PASOS 1, 2 Y 3                      */}
      {/* ========================================================================= */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Botón píldora contorneado centrado arriba */}
        <div className="text-center mb-6">
          <Link
            href="/precios-empresas"
            className="rounded-full border border-[#0B3B70] text-[#0B3B70] px-8 py-2.5 text-sm font-semibold hover:bg-[#EAF3FA] transition-all inline-flex items-center gap-2 shadow-2xs bg-white"
          >
            <span>¿Quieres publicar?</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Contenedor Azul Hielo (#EAF3FA) */}
        <div className="bg-[#EAF3FA] rounded-3xl pt-10 pb-16 px-6 sm:px-10 max-w-5xl mx-auto text-center space-y-10 border border-[#D5E6F5]">
          <div className="max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B3B70] tracking-tight">
              ¿Eres empresa?{" "}
              <strong className="font-extrabold text-[#0B3B70]">Recluta gratis al mejor talento verificado</strong>{" "}
              hoy mismo
            </h2>
            <p className="text-xs sm:text-sm text-[#4B5968] leading-relaxed">
              Publica convocatorias operativas, audita licencias SuperVigilancia y acelera tus contrataciones.
            </p>
          </div>

          {/* 3 Tarjetas Blancas Flotantes unidas por 2 Flechas Curvas SVG */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative text-left">
            {/* PASO 1 (Morado #6E5DC6) */}
            <div className="bg-white rounded-2xl p-6 shadow-[0_10px_25px_rgba(11,59,112,0.08)] border border-slate-100 space-y-3 relative flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-full bg-[#6E5DC6] text-white flex items-center justify-center font-extrabold text-sm shadow-xs">
                  1
                </div>
                <span className="text-[10px] font-bold text-[#6E5DC6] uppercase tracking-wider block">
                  PUBLICA GRATIS
                </span>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <strong className="font-bold text-slate-900">Crea tu cuenta</strong>, publica tus vacantes operativas y llega a personal de seguridad en todo el país.
                </p>
              </div>

              {/* Flecha Curva SVG 1 (Arriba, de Tarjeta 1 hacia Tarjeta 2) */}
              <div className="hidden md:block absolute -right-6 top-8 z-20 pointer-events-none text-[#0B3B70]">
                <svg className="w-12 h-8" viewBox="0 0 100 40" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 30 Q 50 5 90 20" />
                  <path d="M80 15 L 90 20 L 85 30" />
                </svg>
              </div>
            </div>

            {/* PASO 2 (Verde Menta #4FB5A3) */}
            <div className="bg-white rounded-2xl p-6 shadow-[0_10px_25px_rgba(11,59,112,0.08)] border border-slate-100 space-y-3 relative flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-full bg-[#4FB5A3] text-white flex items-center justify-center font-extrabold text-sm shadow-xs">
                  2
                </div>
                <span className="text-[10px] font-bold text-[#4FB5A3] uppercase tracking-wider block">
                  SELECCIONA
                </span>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <strong className="font-bold text-slate-900">Accede a perfiles</strong> y filtra según curso SuperVigilancia vigente, libreta militar y moto.
                </p>
              </div>

              {/* Flecha Curva SVG 2 (Abajo, de Tarjeta 2 hacia Tarjeta 3) */}
              <div className="hidden md:block absolute -right-6 bottom-8 z-20 pointer-events-none text-[#0B3B70]">
                <svg className="w-12 h-8" viewBox="0 0 100 40" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 10 Q 50 35 90 20" />
                  <path d="M85 10 L 90 20 L 80 25" />
                </svg>
              </div>
            </div>

            {/* PASO 3 (Azul #005DA4) */}
            <div className="bg-white rounded-2xl p-6 shadow-[0_10px_25px_rgba(11,59,112,0.08)] border border-slate-100 space-y-3 relative flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-full bg-[#005DA4] text-white flex items-center justify-center font-extrabold text-sm shadow-xs">
                  3
                </div>
                <span className="text-[10px] font-bold text-[#005DA4] uppercase tracking-wider block">
                  ENCUENTRA AL MEJOR PERFIL
                </span>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <strong className="font-bold text-slate-900">Contacta al candidato</strong> verificado y solicita poligrafía o visita domiciliaria en 1 clic.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Grande para Empresas */}
          <div className="pt-2">
            <Link
              href="/empresa/vacantes/nueva"
              className="rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white font-bold px-8 py-3.5 text-xs sm:text-sm inline-flex items-center gap-2 shadow-md transition-all active:scale-[0.98]"
            >
              <span>Publicar Ofertas Ahora</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* BLOQUE 3: BANNER CON ETIQUETA AMARILLA "NUEVO" + 4 TARJETAS VERTICALES    */}
      {/* ========================================================================= */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-10">
        {/* Banner Superior con Etiqueta Amarilla "Nuevo" */}
        <div className="bg-white border border-[#E1E4E9] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6 max-w-6xl mx-auto">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FFE066]/30 border border-[#FFE066] flex items-center justify-center shrink-0 text-[#0B3B70]">
              <GraduationCap className="w-6 h-6 text-[#0B3B70]" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-[#FFD15C] text-slate-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Nuevo
                </span>
                <h3 className="text-base sm:text-lg font-bold text-[#0B3B70]">
                  Potencia tu desarrollo profesional y vigencia operativa
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                Renueva tu curso de Vigilancia, Escolta o CCTV con las Academias Aliadas acreditadas ante la SuperVigilancia y obtén descuentos especiales por convenio.
              </p>
            </div>
          </div>

          <Link
            href="/guarda/academias"
            className="rounded-full border-2 border-[#0B3B70] text-[#0B3B70] hover:bg-[#0B3B70] hover:text-white px-6 py-2.5 text-xs sm:text-sm font-bold transition-all shrink-0 whitespace-nowrap shadow-xs"
          >
            FuerzaVerificada te ayuda
          </Link>
        </div>

        {/* Sección "Si buscas trabajo ¡FuerzaVerificada es tu mejor aliado!" */}
        <div className="text-center space-y-2 pt-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B3B70] tracking-tight">
            Si buscas trabajo ¡FuerzaVerificada es tu mejor aliado!
          </h2>
          <p className="text-xs sm:text-sm text-[#627384] max-w-xl mx-auto">
            Herramientas creadas específicamente para el personal operativo de vigilancia y seguridad privada en Colombia.
          </p>
        </div>

        {/* Cuadrícula de 4 Tarjetas Verticales (3 en #EAF3FA + 1 en #005DA4) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {/* Tarjeta 1: Registro Gratuito */}
          <div className="bg-[#EAF3FA] rounded-3xl p-7 text-center space-y-4 hover:shadow-md transition-all border border-[#D5E6F5]/60 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white text-[#0B3B70] flex items-center justify-center mx-auto shadow-xs border border-slate-100">
                <FileText className="w-6 h-6 text-[#0B3B70]" strokeWidth={1.75} />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Registro gratuito
              </h3>
              <p className="text-xs text-[#627384] leading-relaxed">
                Crea tu Hoja de Vida estructurada en minutos sin costos ni intermediarios. Tu perfil queda listo para postularte en 1 clic.
              </p>
            </div>
            <Link
              href="/login"
              className="rounded-full bg-white hover:bg-slate-50 text-[#0B3B70] font-bold text-xs py-2 px-4 shadow-2xs border border-slate-200 transition-colors inline-block"
            >
              Comenzar gratis
            </Link>
          </div>

          {/* Tarjeta 2: Vacantes Diarias */}
          <div className="bg-[#EAF3FA] rounded-3xl p-7 text-center space-y-4 hover:shadow-md transition-all border border-[#D5E6F5]/60 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white text-[#0B3B70] flex items-center justify-center mx-auto shadow-xs border border-slate-100">
                <Briefcase className="w-6 h-6 text-[#0B3B70]" strokeWidth={1.75} />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Vacantes diarias
              </h3>
              <p className="text-xs text-[#627384] leading-relaxed">
                Convocatorias directas con empresas legalmente constituidas y vigiladas por la Superintendencia de Vigilancia.
              </p>
            </div>
            <Link
              href="/vacantes"
              className="rounded-full bg-white hover:bg-slate-50 text-[#0B3B70] font-bold text-xs py-2 px-4 shadow-2xs border border-slate-200 transition-colors inline-block"
            >
              Explorar ofertas
            </Link>
          </div>

          {/* Tarjeta 3: Alertas y Seguimiento de CV */}
          <div className="bg-[#EAF3FA] rounded-3xl p-7 text-center space-y-4 hover:shadow-md transition-all border border-[#D5E6F5]/60 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white text-[#0B3B70] flex items-center justify-center mx-auto shadow-xs border border-slate-100">
                <Bell className="w-6 h-6 text-[#0B3B70]" strokeWidth={1.75} />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Alertas y Seguimiento
              </h3>
              <p className="text-xs text-[#627384] leading-relaxed">
                Notificaciones en tiempo real cuando una empresa revisa tu hoja de vida o te cita a entrevista presencial.
              </p>
            </div>
            <Link
              href="/guarda/postulaciones"
              className="rounded-full bg-white hover:bg-slate-50 text-[#0B3B70] font-bold text-xs py-2 px-4 shadow-2xs border border-slate-200 transition-colors inline-block"
            >
              Ver mis postulaciones
            </Link>
          </div>

          {/* Tarjeta 4: En Azul Intenso (#005DA4) con Celular y QR */}
          <div className="bg-[#005DA4] text-white rounded-3xl p-7 text-center flex flex-col justify-between overflow-hidden relative shadow-xl hover:shadow-2xl transition-all">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white leading-snug">
                Sigue buscando desde tu celular
              </h3>
              <p className="text-xs font-semibold text-[#FFE066]">
                ¡Tu credencial QR lista!
              </p>
              <p className="text-[11px] text-slate-200 leading-relaxed">
                Escanea el código para acceder a tu perfil y postularte desde cualquier lugar.
              </p>
            </div>

            {/* Ilustración de smartphone con pantalla QR */}
            <div className="my-3 mx-auto w-24 h-28 bg-white/95 rounded-2xl p-2 shadow-inner border border-white/40 flex flex-col items-center justify-center text-slate-900">
              <QrCode className="w-16 h-16 text-[#0B3B70]" />
              <span className="text-[8px] font-mono font-bold text-[#0B3B70] uppercase mt-0.5">
                VERIFICADO
              </span>
            </div>

            <Link
              href="/vacantes"
              className="rounded-full bg-white text-[#005DA4] hover:bg-slate-100 font-bold text-xs py-2.5 px-4 shadow-sm transition-colors"
            >
              Postularme ahora
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* BLOQUE 4: PESTAÑAS BOLSA DE EMPLEO (LOCALIZACIÓN | CARGOS PROFESIONALES)   */}
      {/* CON SÍMBOLO └ EN 4 COLUMNAS LIMPIAS                                       */}
      {/* ========================================================================= */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="bg-white border border-[#E1E4E9] rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E1E4E9]">
            <div>
              <h3 className="text-lg font-bold text-[#0B3B70]">
                Bolsa de empleo según:
              </h3>
              <p className="text-xs text-[#627384]">
                Explora las convocatorias abiertas por departamento o especialidad táctica
              </p>
            </div>

            {/* Pestañas superiores estilo carpeta */}
            <div className="inline-flex p-1 rounded-full bg-[#F2F5F8] border border-[#E1E4E9]">
              <button
                type="button"
                onClick={() => setActiveDirectoryTab("localizacion")}
                className={`rounded-full px-5 py-2 text-xs font-bold transition-all ${
                  activeDirectoryTab === "localizacion"
                    ? "bg-[#0B3B70] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Localización
              </button>
              <button
                type="button"
                onClick={() => setActiveDirectoryTab("cargos")}
                className={`rounded-full px-5 py-2 text-xs font-bold transition-all ${
                  activeDirectoryTab === "cargos"
                    ? "bg-[#0B3B70] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Cargos profesionales
              </button>
            </div>
          </div>

          {/* Contenido en 4 Columnas con árbol └ */}
          {activeDirectoryTab === "localizacion" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
              {/* Columna 1: Bogotá D.C. y Cundinamarca */}
              <div className="space-y-2">
                <Link
                  href="/vacantes?location=Bogotá"
                  className="font-bold text-slate-900 hover:text-[#005DA4] block"
                >
                  Empleos en Bogotá, D.C.
                </Link>
                <div className="space-y-1.5 text-[#627384] pl-2 font-mono">
                  <Link href="/vacantes?location=Bogotá&search=Vigilante" className="block hover:text-[#005DA4]">
                    └ Vigilantes en Bogotá
                  </Link>
                  <Link href="/vacantes?location=Bogotá&search=Escolta" className="block hover:text-[#005DA4]">
                    └ Escoltas en Bogotá
                  </Link>
                  <Link href="/vacantes?location=Bogotá&search=CCTV" className="block hover:text-[#005DA4]">
                    └ Operadores CCTV en Bogotá
                  </Link>
                  <Link href="/vacantes?location=Cundinamarca" className="block hover:text-[#005DA4]">
                    └ Empleos en Cundinamarca
                  </Link>
                  <Link href="/vacantes?location=Chía" className="block hover:text-[#005DA4]">
                    └ Seguridad en Chía, Funza y Mosquera
                  </Link>
                </div>
              </div>

              {/* Columna 2: Antioquia */}
              <div className="space-y-2">
                <Link
                  href="/vacantes?location=Antioquia"
                  className="font-bold text-slate-900 hover:text-[#005DA4] block"
                >
                  Empleos en Antioquia
                </Link>
                <div className="space-y-1.5 text-[#627384] pl-2 font-mono">
                  <Link href="/vacantes?location=Medellín" className="block hover:text-[#005DA4]">
                    └ Empleos en Medellín
                  </Link>
                  <Link href="/vacantes?location=Itagüí" className="block hover:text-[#005DA4]">
                    └ Vigilantes en Itagüí
                  </Link>
                  <Link href="/vacantes?location=Rionegro" className="block hover:text-[#005DA4]">
                    └ Seguridad en Rionegro
                  </Link>
                  <Link href="/vacantes?location=Envigado" className="block hover:text-[#005DA4]">
                    └ Operadores CCTV en Envigado
                  </Link>
                  <Link href="/vacantes?location=Bello" className="block hover:text-[#005DA4]">
                    └ Vigilantes en Bello
                  </Link>
                </div>
              </div>

              {/* Columna 3: Valle del Cauca */}
              <div className="space-y-2">
                <Link
                  href="/vacantes?location=Valle%20del%20Cauca"
                  className="font-bold text-slate-900 hover:text-[#005DA4] block"
                >
                  Empleos en Valle del Cauca
                </Link>
                <div className="space-y-1.5 text-[#627384] pl-2 font-mono">
                  <Link href="/vacantes?location=Cali" className="block hover:text-[#005DA4]">
                    └ Empleos en Cali
                  </Link>
                  <Link href="/vacantes?location=Palmira" className="block hover:text-[#005DA4]">
                    └ Vigilantes en Palmira
                  </Link>
                  <Link href="/vacantes?location=Yumbo" className="block hover:text-[#005DA4]">
                    └ Custodia Industrial en Yumbo
                  </Link>
                  <Link href="/vacantes?location=Jamundí" className="block hover:text-[#005DA4]">
                    └ Seguridad en Jamundí
                  </Link>
                  <Link href="/vacantes?location=Buenaventura" className="block hover:text-[#005DA4]">
                    └ Seguridad Portuaria Buenaventura
                  </Link>
                </div>
              </div>

              {/* Columna 4: Atlántico, Magdalena, Bolívar, Santander, Meta */}
              <div className="space-y-2">
                <Link
                  href="/vacantes?location=Atlántico"
                  className="font-bold text-slate-900 hover:text-[#005DA4] block"
                >
                  Caribe, Santander y Meta
                </Link>
                <div className="space-y-1.5 text-[#627384] pl-2 font-mono">
                  <Link href="/vacantes?location=Barranquilla" className="block hover:text-[#005DA4]">
                    └ Empleos en Barranquilla y Soledad
                  </Link>
                  <Link href="/vacantes?location=Cartagena" className="block hover:text-[#005DA4]">
                    └ Empleos en Cartagena (Bolívar)
                  </Link>
                  <Link href="/vacantes?location=Santa%20Marta" className="block hover:text-[#005DA4]">
                    └ Empleos en Santa Marta (Magdalena)
                  </Link>
                  <Link href="/vacantes?location=Bucaramanga" className="block hover:text-[#005DA4]">
                    └ Empleos en Santander (Bucaramanga)
                  </Link>
                  <Link href="/vacantes?location=Villavicencio" className="block hover:text-[#005DA4]">
                    └ Empleos en Meta (Villavicencio)
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
              {/* Columna 1: Vigilancia Fija y Móvil */}
              <div className="space-y-2">
                <Link href="/vacantes?search=Vigilante" className="font-bold text-slate-900 hover:text-[#005DA4] block">
                  Vigilancia de Seguridad
                </Link>
                <div className="space-y-1.5 text-[#627384] pl-2 font-mono">
                  <Link href="/vacantes?search=Vigilante%20Fijo" className="block hover:text-[#005DA4]">
                    └ Vigilante Fijo 2x2x2
                  </Link>
                  <Link href="/vacantes?search=Vigilante%20Movil" className="block hover:text-[#005DA4]">
                    └ Vigilante Móvil con Arma
                  </Link>
                  <Link href="/vacantes?search=Guarda%20Residencial" className="block hover:text-[#005DA4]">
                    └ Guarda Residencial
                  </Link>
                  <Link href="/vacantes?search=Guarda%20Comercial" className="block hover:text-[#005DA4]">
                    └ Seguridad Comercial y Retail
                  </Link>
                </div>
              </div>

              {/* Columna 2: Escoltas VIP y Motorizados */}
              <div className="space-y-2">
                <Link href="/vacantes?search=Escolta" className="font-bold text-slate-900 hover:text-[#005DA4] block">
                  Protección y Escoltas
                </Link>
                <div className="space-y-1.5 text-[#627384] pl-2 font-mono">
                  <Link href="/vacantes?search=Escolta%20VIP" className="block hover:text-[#005DA4]">
                    └ Escolta VIP Dignatarios
                  </Link>
                  <Link href="/vacantes?search=Escolta%20Motorizado" className="block hover:text-[#005DA4]">
                    └ Escolta Motorizado
                  </Link>
                  <Link href="/vacantes?search=Escolta%20Vehicular" className="block hover:text-[#005DA4]">
                    └ Escolta Conductor Blindado
                  </Link>
                  <Link href="/vacantes?search=Custodia%20Mercancias" className="block hover:text-[#005DA4]">
                    └ Custodia de Mercancías
                  </Link>
                </div>
              </div>

              {/* Columna 3: CCTV y Medios Tecnológicos */}
              <div className="space-y-2">
                <Link href="/vacantes?search=CCTV" className="font-bold text-slate-900 hover:text-[#005DA4] block">
                  Medios Tecnológicos
                </Link>
                <div className="space-y-1.5 text-[#627384] pl-2 font-mono">
                  <Link href="/vacantes?search=Operador%20CCTV" className="block hover:text-[#005DA4]">
                    └ Operador Centro de Control CCTV
                  </Link>
                  <Link href="/vacantes?search=Central%20Alarmas" className="block hover:text-[#005DA4]">
                    └ Operador Central de Alarmas
                  </Link>
                  <Link href="/vacantes?search=Monitoreo%20GPS" className="block hover:text-[#005DA4]">
                    └ Monitoreo Satelital GPS
                  </Link>
                  <Link href="/vacantes?search=Seguridad%20Electronica" className="block hover:text-[#005DA4]">
                    └ Técnico en Seguridad Electrónica
                  </Link>
                </div>
              </div>

              {/* Columna 4: Supervisión, Caninos y Operaciones */}
              <div className="space-y-2">
                <Link href="/vacantes?search=Supervisor" className="font-bold text-slate-900 hover:text-[#005DA4] block">
                  Supervisión y Operaciones
                </Link>
                <div className="space-y-1.5 text-[#627384] pl-2 font-mono">
                  <Link href="/vacantes?search=Supervisor%20Zona" className="block hover:text-[#005DA4]">
                    └ Supervisor de Zona
                  </Link>
                  <Link href="/vacantes?search=Manejador%20Canino" className="block hover:text-[#005DA4]">
                    └ Manejador Canino de Seguridad
                  </Link>
                  <Link href="/vacantes?search=Jefe%20Operaciones" className="block hover:text-[#005DA4]">
                    └ Jefe de Operaciones
                  </Link>
                  <Link href="/vacantes?search=Coordinador%20Seguridad" className="block hover:text-[#005DA4]">
                    └ Coordinador de Puestos
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* BLOQUE 5: CINTILLO NORMATIVO Y FOOTER DE 4 COLUMNAS                       */}
      {/* ========================================================================= */}
      <Footer />
    </div>
  );
}
