"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import {
  Shield,
  Search,
  MapPin,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  LogOut,
  User as UserIcon,
  Building2,
  Bell,
  Briefcase,
  PlusCircle,
  FileCheck,
  Send,
  GraduationCap,
  Lock,
  Zap,
  LayoutDashboard,
  Settings,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/lib/supabase/useAuth";

/**
 * Subcomponente para el Buscador en Píldora Compacto (Estilo Computrabajo en /vacantes).
 * Envuelto en Suspense para compatibilidad con Next.js App Router (useSearchParams).
 */
function NavbarSearchPill() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");

  useEffect(() => {
    if (searchParams) {
      const q =
        searchParams.get("search") ||
        searchParams.get("role") ||
        searchParams.get("q") ||
        "";
      const loc =
        searchParams.get("location") ||
        searchParams.get("city") ||
        searchParams.get("ciudad") ||
        "";
      setSearchQuery(q);
      setLocationQuery(loc);
    }
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim());
      params.set("q", searchQuery.trim());
    }
    if (locationQuery.trim()) {
      params.set("location", locationQuery.trim());
      params.set("ciudad", locationQuery.trim());
    }
    router.push(`/guarda/vacantes?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="hidden md:flex items-center rounded-full border border-slate-300 bg-white shadow-2xs hover:shadow-xs hover:border-[#005DA4] transition-all p-1 max-w-xl w-full mx-4"
    >
      {/* Campo Cargo o categoría */}
      <div className="flex items-center flex-1 min-w-0 px-2.5">
        <Briefcase className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={1.75} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cargo o categoría (ej. Vigilante)"
          className="w-full bg-transparent border-none text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none px-2"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="text-slate-400 hover:text-slate-600 p-0.5"
            title="Limpiar cargo"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Divisor vertical */}
      <span className="h-5 w-px bg-slate-200 shrink-0" />

      {/* Campo Lugar / Ciudad */}
      <div className="flex items-center flex-1 min-w-0 px-2.5">
        <MapPin className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={1.75} />
        <input
          type="text"
          value={locationQuery}
          onChange={(e) => setLocationQuery(e.target.value)}
          placeholder="Lugar (ej. Bogotá, Barranquilla)"
          className="w-full bg-transparent border-none text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none px-2"
        />
        {locationQuery && (
          <button
            type="button"
            onClick={() => setLocationQuery("")}
            className="text-slate-400 hover:text-slate-600 p-0.5"
            title="Limpiar lugar"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Botón circular azul marino (#0B3B70) */}
      <button
        type="submit"
        className="w-8 h-8 rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white flex items-center justify-center shrink-0 shadow-xs transition-colors"
        title="Buscar empleos"
      >
        <Search className="w-3.5 h-3.5" strokeWidth={2.5} />
      </button>
    </form>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, isAuthenticated, fullName, email, signOut } = useAuth();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const userDropdownRef = useRef<HTMLDivElement>(null);

  const isCompany = role === "company";
  const isCandidate = role === "candidate";
  const isAdmin = role === "admin";

  const isVacantesPage =
    pathname === "/vacantes" || pathname.startsWith("/guarda/vacantes");

  // Función para determinar si una ruta está activa
  const isActiveRoute = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    if (href === "/vacantes") {
      return isVacantesPage;
    }
    if (href === "/mi-perfil") {
      return pathname === "/mi-perfil" || pathname.startsWith("/guarda/perfil");
    }
    if (href === "/empresa/vacantes") {
      return (
        pathname === "/empresa/vacantes" ||
        (pathname.startsWith("/empresa/vacantes/") && !pathname.includes("/nueva"))
      );
    }
    return pathname === href || (href !== "/" && pathname.startsWith(href));
  };

  // 1. Cerrar dropdowns al cambiar de ruta
  useEffect(() => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  // 2. Cerrar dropdown al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. Cerrar dropdown al presionar tecla Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setUserMenuOpen(false);
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Nombre formateado e iniciales
  const displayName =
    fullName ||
    (isCompany
      ? "Empresa de Seguridad"
      : isCandidate
      ? "Personal Operativo"
      : isAdmin
      ? "SuperAdmin"
      : "Mi Cuenta");

  const initials = fullName
    ? fullName
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : isCompany
    ? "ES"
    : isAdmin
    ? "SA"
    : "PO";

  const roleBadgeLabel = isCompany
    ? "Empresa de Seguridad B2B"
    : isCandidate
    ? "Personal Operativo"
    : isAdmin
    ? "SuperAdministrador"
    : "Visitante";

  // Manejo de Logout limpio
  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true);
      setUserMenuOpen(false);
      setMobileMenuOpen(false);
      await signOut();
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E1E4E9] h-16 flex items-center shadow-[0_1px_3px_rgba(11,59,112,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between">
        
        {/* LADO IZQUIERDO: LOGO FUERZAVERIFICADA (ESTILO COMPUTRABAJO CON AZUL #0B3B70) */}
        <div className="flex items-center gap-6 lg:gap-8">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#0B3B70] flex items-center justify-center text-white shadow-xs group-hover:bg-[#082B54] transition-colors">
              <Shield className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-[#0B3B70] leading-none">
                Fuerza<span className="text-[#005DA4]">Verificada</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-0.5">
                Portal de Empleo & Seguridad
              </span>
            </div>
          </Link>

          {/* CENTRO CONDICIONAL 1: EN VISTA DE OFERTAS (/vacantes) -> BUSCADOR EN PÍLDORA COMPACTO */}
          {isVacantesPage ? (
            <Suspense fallback={<div className="hidden md:block w-96 h-10" />}>
              <NavbarSearchPill />
            </Suspense>
          ) : (
            /* CENTRO CONDICIONAL 2: NAVEGACIÓN DESKTOP CON SUBRAYADO ACTIVO DINÁMICO (border-b-[3px] border-[#0B3B70]) */
            <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
              {/* CASO 1: Candidato Autenticado */}
              {isCandidate && (
                <>
                  <Link
                    href="/vacantes"
                    className={`py-5 border-b-[3px] transition-all ${
                      isActiveRoute("/vacantes")
                        ? "text-[#0B3B70] font-semibold border-[#0B3B70]"
                        : "text-slate-700 hover:text-[#0B3B70] border-transparent hover:border-[#0B3B70]"
                    }`}
                  >
                    Buscar Empleo
                  </Link>
                  <Link
                    href="/guarda/postulaciones"
                    className={`py-5 border-b-[3px] transition-all ${
                      isActiveRoute("/guarda/postulaciones")
                        ? "text-[#0B3B70] font-semibold border-[#0B3B70]"
                        : "text-slate-700 hover:text-[#0B3B70] border-transparent hover:border-[#0B3B70]"
                    }`}
                  >
                    Mis Postulaciones
                  </Link>
                  <Link
                    href="/mi-perfil"
                    className={`py-5 border-b-[3px] transition-all ${
                      isActiveRoute("/mi-perfil")
                        ? "text-[#0B3B70] font-semibold border-[#0B3B70]"
                        : "text-slate-700 hover:text-[#0B3B70] border-transparent hover:border-[#0B3B70]"
                    }`}
                  >
                    Mi Hoja de Vida
                  </Link>
                  <Link
                    href="/guarda/documentos"
                    className={`py-5 border-b-[3px] transition-all ${
                      isActiveRoute("/guarda/documentos")
                        ? "text-[#0B3B70] font-semibold border-[#0B3B70]"
                        : "text-slate-700 hover:text-[#0B3B70] border-transparent hover:border-[#0B3B70]"
                    }`}
                  >
                    Credencial & Cursos
                  </Link>
                  <Link
                    href="/guarda/documentos#academias"
                    className="py-5 border-b-[3px] border-transparent text-slate-700 hover:text-[#0B3B70] hover:border-[#0B3B70] transition-all"
                  >
                    Academias Aliadas
                  </Link>
                </>
              )}

              {/* CASO 2: Empresa Autenticada */}
              {isCompany && (
                <>
                  <Link
                    href="/empresa/dashboard"
                    className={`py-5 border-b-[3px] transition-all ${
                      isActiveRoute("/empresa/dashboard")
                        ? "text-[#0B3B70] font-semibold border-[#0B3B70]"
                        : "text-slate-700 hover:text-[#0B3B70] border-transparent hover:border-[#0B3B70]"
                    }`}
                  >
                    Panel ATS
                  </Link>
                  <Link
                    href="/empresa/vacantes/nueva"
                    className={`py-5 border-b-[3px] transition-all ${
                      isActiveRoute("/empresa/vacantes/nueva")
                        ? "text-[#0B3B70] font-semibold border-[#0B3B70]"
                        : "text-slate-700 hover:text-[#0B3B70] border-transparent hover:border-[#0B3B70]"
                    }`}
                  >
                    Publicar Vacante
                  </Link>
                  <Link
                    href="/empresa/vacantes"
                    className={`py-5 border-b-[3px] transition-all ${
                      isActiveRoute("/empresa/vacantes")
                        ? "text-[#0B3B70] font-semibold border-[#0B3B70]"
                        : "text-slate-700 hover:text-[#0B3B70] border-transparent hover:border-[#0B3B70]"
                    }`}
                  >
                    Mis Vacantes
                  </Link>
                  <Link
                    href="/empresa/relevos"
                    className={`py-5 border-b-[3px] transition-all ${
                      isActiveRoute("/empresa/relevos")
                        ? "text-[#0B3B70] font-semibold border-[#0B3B70]"
                        : "text-slate-700 hover:text-[#0B3B70] border-transparent hover:border-[#0B3B70]"
                    }`}
                  >
                    Personal Verificado
                  </Link>
                  <Link
                    href="/empresa/estudios"
                    className={`py-5 border-b-[3px] transition-all flex items-center gap-1.5 ${
                      isActiveRoute("/empresa/estudios")
                        ? "text-[#0B3B70] font-semibold border-[#0B3B70]"
                        : "text-slate-700 hover:text-[#0B3B70] border-transparent hover:border-[#0B3B70]"
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Poligrafía & Visitas</span>
                  </Link>
                  <Link
                    href="/precios-empresas"
                    className={`py-5 border-b-[3px] transition-all ${
                      isActiveRoute("/precios-empresas")
                        ? "text-[#0B3B70] font-semibold border-[#0B3B70]"
                        : "text-slate-700 hover:text-[#0B3B70] border-transparent hover:border-[#0B3B70]"
                    }`}
                  >
                    Tarifas B2B
                  </Link>
                </>
              )}

              {/* CASO 3: SuperAdmin */}
              {isAdmin && (
                <>
                  <Link
                    href="/admin/estudios"
                    className={`py-5 border-b-[3px] transition-all ${
                      isActiveRoute("/admin/estudios")
                        ? "text-[#0B3B70] font-semibold border-[#0B3B70]"
                        : "text-slate-700 hover:text-[#0B3B70] border-transparent hover:border-[#0B3B70]"
                    }`}
                  >
                    Bandeja de Estudios
                  </Link>
                  <Link
                    href="/admin/empresas"
                    className={`py-5 border-b-[3px] transition-all ${
                      isActiveRoute("/admin/empresas")
                        ? "text-[#0B3B70] font-semibold border-[#0B3B70]"
                        : "text-slate-700 hover:text-[#0B3B70] border-transparent hover:border-[#0B3B70]"
                    }`}
                  >
                    Empresas
                  </Link>
                  <Link
                    href="/admin/academias"
                    className={`py-5 border-b-[3px] transition-all ${
                      isActiveRoute("/admin/academias")
                        ? "text-[#0B3B70] font-semibold border-[#0B3B70]"
                        : "text-slate-700 hover:text-[#0B3B70] border-transparent hover:border-[#0B3B70]"
                    }`}
                  >
                    Academias
                  </Link>
                  <Link
                    href="/admin/planes"
                    className={`py-5 border-b-[3px] transition-all ${
                      isActiveRoute("/admin/planes")
                        ? "text-[#0B3B70] font-semibold border-[#0B3B70]"
                        : "text-slate-700 hover:text-[#0B3B70] border-transparent hover:border-[#0B3B70]"
                    }`}
                  >
                    Planes B2B
                  </Link>
                  <Link
                    href="/admin/configuracion"
                    className={`py-5 border-b-[3px] transition-all ${
                      isActiveRoute("/admin/configuracion")
                        ? "text-[#0B3B70] font-semibold border-[#0B3B70]"
                        : "text-slate-700 hover:text-[#0B3B70] border-transparent hover:border-[#0B3B70]"
                    }`}
                  >
                    Configuración
                  </Link>
                </>
              )}

              {/* CASO 4: Visitante No Autenticado */}
              {!isAuthenticated && (
                <>
                  <Link
                    href="/"
                    className={`py-5 border-b-[3px] transition-all ${
                      isActiveRoute("/")
                        ? "text-[#0B3B70] font-semibold border-[#0B3B70]"
                        : "text-slate-700 hover:text-[#0B3B70] border-transparent hover:border-[#0B3B70]"
                    }`}
                  >
                    Buscar Empleo
                  </Link>
                  <Link
                    href="/precios-empresas"
                    className={`py-5 border-b-[3px] transition-all ${
                      isActiveRoute("/precios-empresas")
                        ? "text-[#0B3B70] font-semibold border-[#0B3B70]"
                        : "text-slate-700 hover:text-[#0B3B70] border-transparent hover:border-[#0B3B70]"
                    }`}
                  >
                    Para Empresas
                  </Link>
                  <Link
                    href="/privacidad"
                    className={`py-5 border-b-[3px] transition-all ${
                      isActiveRoute("/privacidad")
                        ? "text-[#0B3B70] font-semibold border-[#0B3B70]"
                        : "text-slate-700 hover:text-[#0B3B70] border-transparent hover:border-[#0B3B70]"
                    }`}
                  >
                    Seguridad & Ley 1581
                  </Link>
                </>
              )}
            </nav>
          )}
        </div>

        {/* LADO DERECHO: PÍLDORA DE USUARIO CON DROPDOWN O BOTONES PÍLDORA VISITANTE */}
        <div className="hidden sm:flex items-center gap-3">
          {isAuthenticated ? (
            /* USUARIO AUTENTICADO: PÍLDORA ESTILO COMPUTRABAJO CON DROPDOWN FLOTANTE */
            <div className="relative" ref={userDropdownRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-expanded={userMenuOpen}
                className="rounded-full border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs px-3.5 py-1.5 flex items-center gap-2.5 transition-all cursor-pointer group select-none"
              >
                {/* Punto coral circular de alerta (#FF4B6E) */}
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF4B6E] opacity-75" />
                  <span
                    className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF4B6E]"
                    title="Notificaciones activas"
                  />
                </span>

                {/* Divisor vertical */}
                <span className="text-slate-300 font-light text-xs">|</span>

                {/* Nombre de usuario truncado */}
                <span className="text-xs font-semibold text-slate-800 max-w-[125px] truncate group-hover:text-[#0B3B70] transition-colors">
                  {displayName}
                </span>

                {/* Avatar circular */}
                <div className="w-7 h-7 rounded-full bg-[#0B3B70] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                  {initials}
                </div>

                {/* Flecha indicadora */}
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-transform duration-200 ${
                    userMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* MENÚ DESPLEGABLE (DROPDOWN FLOTANTE INTERACTIVO) */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2.5 z-50 animate-in fade-in slide-in-from-top-2">
                  {/* Cabecera del Dropdown con datos del perfil */}
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0B3B70] text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-xs">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {displayName}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {email || "Sesión verificada"}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EAF3FA] text-[#0B3B70] border border-[#0B3B70]/10">
                        {roleBadgeLabel}
                      </span>
                    </div>
                  </div>

                  {/* Enlaces según el Rol Activo */}
                  <div className="p-2 space-y-0.5">
                    {/* Opciones Candidato */}
                    {isCandidate && (
                      <>
                        <Link
                          href="/vacantes"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-[#0B3B70] hover:bg-[#EAF3FA] rounded-xl transition-colors"
                        >
                          <Briefcase className="w-4 h-4 text-[#0B3B70] shrink-0" strokeWidth={1.75} />
                          <span>Buscar Ofertas de Empleo</span>
                        </Link>
                        <Link
                          href="/guarda/postulaciones"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-[#0B3B70] hover:bg-[#EAF3FA] rounded-xl transition-colors"
                        >
                          <Send className="w-4 h-4 text-[#0B3B70] shrink-0" strokeWidth={1.75} />
                          <span>Mis Postulaciones y Estado</span>
                        </Link>
                        <Link
                          href="/mi-perfil"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-[#0B3B70] hover:bg-[#EAF3FA] rounded-xl transition-colors"
                        >
                          <UserIcon className="w-4 h-4 text-[#0B3B70] shrink-0" strokeWidth={1.75} />
                          <span>Mi Hoja de Vida & CV (100%)</span>
                        </Link>
                        <Link
                          href="/guarda/documentos"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-[#0B3B70] hover:bg-[#EAF3FA] rounded-xl transition-colors"
                        >
                          <FileCheck className="w-4 h-4 text-[#0B3B70] shrink-0" strokeWidth={1.75} />
                          <span>Credencial & Cursos Vigentes</span>
                        </Link>
                        <Link
                          href="/guarda/documentos#academias"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-[#0B3B70] hover:bg-[#EAF3FA] rounded-xl transition-colors"
                        >
                          <GraduationCap className="w-4 h-4 text-[#0B3B70] shrink-0" strokeWidth={1.75} />
                          <span>Academias Aliadas con Descuento</span>
                        </Link>
                      </>
                    )}

                    {/* Opciones Empresa */}
                    {isCompany && (
                      <>
                        <Link
                          href="/empresa/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-[#0B3B70] hover:bg-[#EAF3FA] rounded-xl transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-[#0B3B70] shrink-0" strokeWidth={1.75} />
                          <span>Panel ATS de Empresa</span>
                        </Link>
                        <Link
                          href="/empresa/vacantes"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-[#0B3B70] hover:bg-[#EAF3FA] rounded-xl transition-colors"
                        >
                          <Briefcase className="w-4 h-4 text-[#0B3B70] shrink-0" strokeWidth={1.75} />
                          <span>Mis Vacantes y Procesos</span>
                        </Link>
                        <Link
                          href="/empresa/vacantes/nueva"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-[#0B3B70] hover:bg-[#EAF3FA] rounded-xl transition-colors"
                        >
                          <PlusCircle className="w-4 h-4 text-[#0B3B70] shrink-0" strokeWidth={1.75} />
                          <span>Publicar Nueva Oferta</span>
                        </Link>
                        <Link
                          href="/empresa/relevos"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-[#0B3B70] hover:bg-[#EAF3FA] rounded-xl transition-colors"
                        >
                          <Zap className="w-4 h-4 text-amber-600 shrink-0" strokeWidth={1.75} />
                          <span>Personal Verificado 24/7</span>
                        </Link>
                        <Link
                          href="/empresa/estudios"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-[#0B3B70] hover:bg-[#EAF3FA] rounded-xl transition-colors"
                        >
                          <Lock className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={1.75} />
                          <span>Estudios & Poligrafía</span>
                        </Link>
                        <Link
                          href="/precios-empresas"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-[#0B3B70] hover:bg-[#EAF3FA] rounded-xl transition-colors"
                        >
                          <Shield className="w-4 h-4 text-[#0B3B70] shrink-0" strokeWidth={1.75} />
                          <span>Tarifas y Paquetes B2B</span>
                        </Link>
                      </>
                    )}

                    {/* Opciones SuperAdmin */}
                    {isAdmin && (
                      <>
                        <Link
                          href="/admin/estudios"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-[#0B3B70] hover:bg-[#EAF3FA] rounded-xl transition-colors"
                        >
                          <FileCheck className="w-4 h-4 text-[#0B3B70] shrink-0" strokeWidth={1.75} />
                          <span>Bandeja de Estudios</span>
                        </Link>
                        <Link
                          href="/admin/empresas"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-[#0B3B70] hover:bg-[#EAF3FA] rounded-xl transition-colors"
                        >
                          <Building2 className="w-4 h-4 text-[#0B3B70] shrink-0" strokeWidth={1.75} />
                          <span>Empresas Registradas</span>
                        </Link>
                        <Link
                          href="/admin/academias"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-[#0B3B70] hover:bg-[#EAF3FA] rounded-xl transition-colors"
                        >
                          <GraduationCap className="w-4 h-4 text-[#0B3B70] shrink-0" strokeWidth={1.75} />
                          <span>Academias Aliadas</span>
                        </Link>
                        <Link
                          href="/admin/planes"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-[#0B3B70] hover:bg-[#EAF3FA] rounded-xl transition-colors"
                        >
                          <Shield className="w-4 h-4 text-[#0B3B70] shrink-0" strokeWidth={1.75} />
                          <span>Planes y Facturación</span>
                        </Link>
                        <Link
                          href="/admin/configuracion"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-[#0B3B70] hover:bg-[#EAF3FA] rounded-xl transition-colors"
                        >
                          <Settings className="w-4 h-4 text-[#0B3B70] shrink-0" strokeWidth={1.75} />
                          <span>Configuración Global</span>
                        </Link>
                      </>
                    )}
                  </div>

                  {/* Pie del Dropdown: Cerrar Sesión Integrado */}
                  <div className="pt-2 mt-1 border-t border-slate-100 px-2">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      disabled={isLoggingOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                    >
                      <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                      <span>{isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* VISITANTE SIN SESIÓN: BOTONES PÍLDORA ROUNDED-FULL ESTILO COMPUTRABAJO */
            <div className="flex items-center gap-2.5">
              {/* Botón secundario píldora "Publicar ofertas / Empresas" */}
              <Link
                href="/precios-empresas"
                className="rounded-full border border-slate-300 hover:border-[#0B3B70] text-slate-700 hover:text-[#0B3B70] px-4 py-2 text-xs font-semibold transition-all bg-white shadow-2xs hover:bg-[#EAF3FA]/40"
              >
                Publicar ofertas / Empresas
              </Link>

              {/* Botón primario píldora "Ingresar" */}
              <Link
                href="/login"
                className="rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white px-5 py-2 text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5"
              >
                <span>Ingresar</span>
              </Link>
            </div>
          )}
        </div>

        {/* BOTÓN HAMBURGUESA MÓVIL (< 1024px) */}
        <div className="lg:hidden flex items-center gap-2">
          {!isAuthenticated ? (
            <Link
              href="/login"
              className="rounded-full bg-[#0B3B70] text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs"
            >
              Ingresar
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="w-8 h-8 rounded-full bg-[#0B3B70] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs"
            >
              {initials}
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            aria-label="Abrir menú de navegación"
          >
            <Menu className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* DRAWER MÓVIL SLIDE-OVER ESTILO COMPUTRABAJO */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop con desenfoque suave */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Panel Lateral Deslizable (Slide-over) */}
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200">
            {/* Cabecera del Drawer con Logo y Botón Cerrar */}
            <div className="h-16 px-4 border-b border-[#E1E4E9] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#0B3B70] flex items-center justify-center text-white">
                  <Shield className="w-4 h-4 text-white" strokeWidth={2} />
                </div>
                <span className="text-sm font-bold tracking-tight text-[#0B3B70]">
                  Fuerza<span className="text-[#005DA4]">Verificada</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Cerrar menú"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>

            {/* Tarjeta de Usuario si está autenticado */}
            {isAuthenticated && (
              <div className="p-4 border-b border-slate-100 bg-[#F2F5F8]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0B3B70] text-white flex items-center justify-center text-sm font-bold shadow-xs shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {displayName}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{email}</p>
                    <span className="inline-block mt-0.5 text-[10px] font-semibold text-[#0B3B70]">
                      {roleBadgeLabel}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de Enlaces en Tarjetas con Título, Subtítulo y Chevron */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {/* Vistas Candidato */}
              {isCandidate && (
                <>
                  <Link
                    href="/vacantes"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200/90 hover:border-[#0B3B70] hover:bg-[#EAF3FA] transition-all"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">Buscar Empleo</p>
                      <p className="text-[11px] text-slate-500">Ofertas operativas en Colombia</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>

                  <Link
                    href="/guarda/postulaciones"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200/90 hover:border-[#0B3B70] hover:bg-[#EAF3FA] transition-all"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">Mis Postulaciones</p>
                      <p className="text-[11px] text-slate-500">Seguimiento en tiempo real</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>

                  <Link
                    href="/mi-perfil"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200/90 hover:border-[#0B3B70] hover:bg-[#EAF3FA] transition-all"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">Mi Hoja de Vida</p>
                      <p className="text-[11px] text-slate-500">Perfil estructurado y PDF</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>

                  <Link
                    href="/guarda/documentos"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200/90 hover:border-[#0B3B70] hover:bg-[#EAF3FA] transition-all"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">Credencial & Cursos</p>
                      <p className="text-[11px] text-slate-500">SuperVigilancia y vigencias</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>

                  <Link
                    href="/guarda/documentos#academias"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200/90 hover:border-[#0B3B70] hover:bg-[#EAF3FA] transition-all"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">Academias Aliadas</p>
                      <p className="text-[11px] text-slate-500">Renovación con código convenio</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                </>
              )}

              {/* Vistas Empresa */}
              {isCompany && (
                <>
                  <Link
                    href="/empresa/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200/90 hover:border-[#0B3B70] hover:bg-[#EAF3FA] transition-all"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">Panel ATS</p>
                      <p className="text-[11px] text-slate-500">Resumen y métricas corporativas</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>

                  <Link
                    href="/empresa/vacantes"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200/90 hover:border-[#0B3B70] hover:bg-[#EAF3FA] transition-all"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">Mis Vacantes & ATS</p>
                      <p className="text-[11px] text-slate-500">Embudo de candidatos SherlockHR</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>

                  <Link
                    href="/empresa/vacantes/nueva"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200/90 hover:border-[#0B3B70] hover:bg-[#EAF3FA] transition-all"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">Publicar Vacante</p>
                      <p className="text-[11px] text-slate-500">Formulario en 1 clic</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>

                  <Link
                    href="/empresa/relevos"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200/90 hover:border-[#0B3B70] hover:bg-[#EAF3FA] transition-all"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">Personal Verificado</p>
                      <p className="text-[11px] text-slate-500">Relevos 24/7 inmediatos</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>

                  <Link
                    href="/empresa/estudios"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200/90 hover:border-[#0B3B70] hover:bg-[#EAF3FA] transition-all"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">Poligrafía & Visitas</p>
                      <p className="text-[11px] text-slate-500">Estudios de confiabilidad</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>

                  <Link
                    href="/precios-empresas"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200/90 hover:border-[#0B3B70] hover:bg-[#EAF3FA] transition-all"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">Tarifas B2B</p>
                      <p className="text-[11px] text-slate-500">Paquetes y recargas</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                </>
              )}

              {/* Vistas SuperAdmin */}
              {isAdmin && (
                <>
                  <Link
                    href="/admin/estudios"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200/90 hover:border-[#0B3B70] hover:bg-[#EAF3FA] transition-all"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">Bandeja de Estudios</p>
                      <p className="text-[11px] text-slate-500">Poligrafía y verificación</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>

                  <Link
                    href="/admin/empresas"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200/90 hover:border-[#0B3B70] hover:bg-[#EAF3FA] transition-all"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">Empresas Registradas</p>
                      <p className="text-[11px] text-slate-500">Validación de NITs</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>

                  <Link
                    href="/admin/academias"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200/90 hover:border-[#0B3B70] hover:bg-[#EAF3FA] transition-all"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">Academias Aliadas</p>
                      <p className="text-[11px] text-slate-500">Convenios y códigos</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>

                  <Link
                    href="/admin/configuracion"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200/90 hover:border-[#0B3B70] hover:bg-[#EAF3FA] transition-all"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">Configuración Global</p>
                      <p className="text-[11px] text-slate-500">WhatsApp y parámetros</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                </>
              )}

              {/* Vistas Visitante No Autenticado */}
              {!isAuthenticated && (
                <>
                  <Link
                    href="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200/90 hover:border-[#0B3B70] hover:bg-[#EAF3FA] transition-all"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">Buscar Empleo</p>
                      <p className="text-[11px] text-slate-500">Vacantes de seguridad privada</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>

                  <Link
                    href="/precios-empresas"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200/90 hover:border-[#0B3B70] hover:bg-[#EAF3FA] transition-all"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">Para Empresas</p>
                      <p className="text-[11px] text-slate-500">Planes B2B y poligrafía</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>

                  <Link
                    href="/privacidad"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200/90 hover:border-[#0B3B70] hover:bg-[#EAF3FA] transition-all"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">Seguridad & Ley 1581</p>
                      <p className="text-[11px] text-slate-500">Protección de datos y habeas data</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                </>
              )}
            </div>

            {/* Pie del Drawer Móvil */}
            <div className="p-4 border-t border-slate-100 bg-[#F2F5F8]">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                  className="w-full h-11 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-xs flex items-center justify-center gap-2 transition-colors border border-rose-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/precios-empresas"
                    onClick={() => setMobileMenuOpen(false)}
                    className="h-10 rounded-full border border-slate-300 text-slate-700 text-[11px] font-semibold flex items-center justify-center bg-white text-center px-1"
                  >
                    Publicar ofertas / Empresas
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="h-10 rounded-full bg-[#0B3B70] text-white text-xs font-semibold flex items-center justify-center shadow-xs"
                  >
                    Ingresar
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
