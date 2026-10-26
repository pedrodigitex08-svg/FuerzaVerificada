"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Shield,
  Menu,
  X,
  Lock,
  LogOut,
  User as UserIcon,
  Building2,
  Bell,
  Briefcase,
  PlusCircle,
} from "lucide-react";
import { useAuth } from "@/lib/supabase/useAuth";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { role, isAuthenticated, fullName, signOut } = useAuth();

  const isCompany = role === "company";
  const isCandidate = role === "candidate";
  const isAdmin = role === "admin";

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E1E4E9] h-16 flex items-center shadow-[0_1px_3px_rgba(11,59,112,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between">
        {/* LOGO COMPUTRAVAJO STYLE CON AZUL #0B3B70 */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-[#0B3B70] flex items-center justify-center text-white shadow-xs group-hover:bg-[#082a52] transition-colors">
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

          {/* NAVEGACIÓN CENTRAL CON SUBRAYADO ACTIVO EN #0B3B70 */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
            {/* CASO 1: Empresa de Seguridad */}
            {isCompany && (
              <>
                <Link
                  href="/empresa/dashboard"
                  className="text-slate-700 hover:text-[#0B3B70] py-5 border-b-[3px] border-transparent hover:border-[#0B3B70] transition-colors"
                >
                  Panel ATS
                </Link>
                <Link
                  href="/empresa/vacantes/nueva"
                  className="text-slate-700 hover:text-[#0B3B70] py-5 border-b-[3px] border-transparent hover:border-[#0B3B70] transition-colors"
                >
                  Publicar Vacante
                </Link>
                <Link
                  href="/empresa/vacantes"
                  className="text-[#0B3B70] font-semibold py-5 border-b-[3px] border-[#0B3B70] transition-colors"
                >
                  Mis Vacantes
                </Link>
                <Link
                  href="/empresa/relevos"
                  className="text-slate-700 hover:text-[#0B3B70] py-5 border-b-[3px] border-transparent hover:border-[#0B3B70] transition-colors"
                >
                  Personal Verificado
                </Link>
                <Link
                  href="/empresa/estudios"
                  className="text-slate-700 hover:text-[#0B3B70] py-5 border-b-[3px] border-transparent hover:border-[#0B3B70] transition-colors flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Poligrafía & Visitas</span>
                </Link>
                <Link
                  href="/precios-empresas"
                  className="text-slate-700 hover:text-[#0B3B70] py-5 border-b-[3px] border-transparent hover:border-[#0B3B70] transition-colors"
                >
                  Tarifas B2B
                </Link>
              </>
            )}

            {/* CASO 2: Candidato (Personal Operativo) */}
            {isCandidate && (
              <>
                <Link
                  href="/guarda/vacantes"
                  className="text-[#0B3B70] font-semibold py-5 border-b-[3px] border-[#0B3B70] transition-colors"
                >
                  Buscar Empleo
                </Link>
                <Link
                  href="/guarda/postulaciones"
                  className="text-slate-700 hover:text-[#0B3B70] py-5 border-b-[3px] border-transparent hover:border-[#0B3B70] transition-colors"
                >
                  Mis Postulaciones
                </Link>
                <Link
                  href="/guarda/perfil"
                  className="text-slate-700 hover:text-[#0B3B70] py-5 border-b-[3px] border-transparent hover:border-[#0B3B70] transition-colors"
                >
                  Mi Hoja de Vida
                </Link>
                <Link
                  href="/guarda/documentos"
                  className="text-slate-700 hover:text-[#0B3B70] py-5 border-b-[3px] border-transparent hover:border-[#0B3B70] transition-colors"
                >
                  Credencial SuperVigilancia
                </Link>
                <Link
                  href="/guarda/documentos#academias"
                  className="text-slate-700 hover:text-[#0B3B70] py-5 border-b-[3px] border-transparent hover:border-[#0B3B70] transition-colors"
                >
                  Academias Aliadas
                </Link>
              </>
            )}

            {/* CASO 3: SuperAdmin */}
            {isAdmin && (
              <>
                <Link
                  href="/admin/estudios"
                  className="text-[#0B3B70] font-semibold py-5 border-b-[3px] border-[#0B3B70]"
                >
                  Bandeja de Estudios
                </Link>
                <Link
                  href="/admin/empresas"
                  className="text-slate-700 hover:text-[#0B3B70] py-5 border-b-[3px] border-transparent hover:border-[#0B3B70]"
                >
                  Empresas
                </Link>
                <Link
                  href="/admin/academias"
                  className="text-slate-700 hover:text-[#0B3B70] py-5 border-b-[3px] border-transparent hover:border-[#0B3B70]"
                >
                  Academias
                </Link>
                <Link
                  href="/admin/planes"
                  className="text-slate-700 hover:text-[#0B3B70] py-5 border-b-[3px] border-transparent hover:border-[#0B3B70]"
                >
                  Planes B2B
                </Link>
              </>
            )}

            {/* CASO 4: Visitante No Autenticado */}
            {!isAuthenticated && (
              <>
                <Link
                  href="/vacantes"
                  className="text-[#0B3B70] font-semibold py-5 border-b-[3px] border-[#0B3B70] transition-colors"
                >
                  Buscar Empleo
                </Link>
                <Link
                  href="/precios-empresas"
                  className="text-slate-700 hover:text-[#0B3B70] py-5 border-b-[3px] border-transparent hover:border-[#0B3B70] transition-colors"
                >
                  Para Empresas
                </Link>
                <Link
                  href="/privacidad"
                  className="text-slate-700 hover:text-[#0B3B70] py-5 border-b-[3px] border-transparent hover:border-[#0B3B70] transition-colors"
                >
                  Seguridad & Ley 1581
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* DERECHA: PÍLDORA DE USUARIO O BOTONES PÍLDORA ROUNDED-FULL */}
        <div className="hidden sm:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {/* PÍLDORA ROUNDED-FULL ESTILO COMPUTRABAJO */}
              <Link
                href={
                  isCompany
                    ? "/empresa/dashboard"
                    : isAdmin
                    ? "/admin/estudios"
                    : "/guarda/vacantes"
                }
                className="rounded-full border border-slate-200/90 bg-white hover:border-slate-300 px-3.5 py-1.5 flex items-center gap-2.5 transition-all shadow-xs group"
              >
                {/* Círculo coral #FF4B6E de notificación */}
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF4B6E] shrink-0" title="Notificaciones activas" />
                <span className="text-slate-300 font-light text-xs">|</span>

                {/* Nombre de usuario truncado */}
                <span className="text-xs font-semibold text-slate-800 max-w-[120px] truncate group-hover:text-[#0B3B70] transition-colors">
                  {fullName || (isCompany ? "Empresa" : "Mi Cuenta")}
                </span>

                {/* Avatar circular */}
                <div className="w-7 h-7 rounded-full bg-[#0B3B70] text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {fullName ? fullName.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
                </div>
              </Link>

              {/* Botón Logout discreto */}
              <button
                onClick={async () => {
                  await signOut();
                }}
                className="h-9 w-9 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              {/* Botón secundario píldora "Publicar ofertas" */}
              <Link
                href="/login?role=company"
                className="rounded-full border border-slate-300 hover:border-[#0B3B70] text-slate-700 hover:text-[#0B3B70] px-4 py-2 text-xs font-semibold transition-all bg-white shadow-2xs"
              >
                Publicar ofertas
              </Link>

              {/* Botón primario píldora "Ingresar" */}
              <Link
                href="/login"
                className="rounded-full bg-[#0B3B70] hover:bg-[#082a52] text-white px-5 py-2 text-xs font-semibold shadow-xs transition-all inline-flex items-center gap-1.5"
              >
                <span>Ingresar</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center gap-2">
          {!isAuthenticated && (
            <Link
              href="/login"
              className="rounded-full bg-[#0B3B70] text-white px-3.5 py-1.5 text-xs font-semibold"
            >
              Ingresar
            </Link>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="h-9 w-9 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" strokeWidth={2} />
            ) : (
              <Menu className="w-5 h-5" strokeWidth={2} />
            )}
          </button>
        </div>
      </div>

      {/* Menú Móvil Desplegable */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-16 inset-x-0 bg-white border-b border-[#E1E4E9] p-4 shadow-lg space-y-2 z-50">
          {/* Navegación por rol */}
          {isCompany && (
            <>
              <Link
                href="/empresa/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-semibold text-slate-800 p-2.5 rounded-lg hover:bg-slate-50"
              >
                Panel ATS
              </Link>
              <Link
                href="/empresa/vacantes/nueva"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-semibold text-slate-800 p-2.5 rounded-lg hover:bg-slate-50"
              >
                Publicar Vacante
              </Link>
              <Link
                href="/empresa/vacantes"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-semibold text-slate-800 p-2.5 rounded-lg hover:bg-slate-50"
              >
                Mis Vacantes
              </Link>
              <Link
                href="/empresa/estudios"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-semibold text-slate-800 p-2.5 rounded-lg hover:bg-slate-50"
              >
                Poligrafía & Visitas
              </Link>
            </>
          )}

          {isCandidate && (
            <>
              <Link
                href="/guarda/vacantes"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-semibold text-slate-800 p-2.5 rounded-lg hover:bg-slate-50"
              >
                Buscar Empleo
              </Link>
              <Link
                href="/guarda/postulaciones"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-semibold text-slate-800 p-2.5 rounded-lg hover:bg-slate-50"
              >
                Mis Postulaciones
              </Link>
              <Link
                href="/guarda/perfil"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-semibold text-slate-800 p-2.5 rounded-lg hover:bg-slate-50"
              >
                Mi Hoja de Vida
              </Link>
              <Link
                href="/guarda/documentos"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-semibold text-slate-800 p-2.5 rounded-lg hover:bg-slate-50"
              >
                Credencial SuperVigilancia
              </Link>
            </>
          )}

          {!isAuthenticated && (
            <>
              <Link
                href="/vacantes"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-semibold text-slate-800 p-2.5 rounded-lg hover:bg-slate-50"
              >
                Buscar Empleo
              </Link>
              <Link
                href="/precios-empresas"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-semibold text-slate-800 p-2.5 rounded-lg hover:bg-slate-50"
              >
                Para Empresas
              </Link>
            </>
          )}

          <div className="pt-2 border-t border-slate-100">
            {isAuthenticated ? (
              <button
                onClick={async () => {
                  setMobileMenuOpen(false);
                  await signOut();
                }}
                className="text-xs text-rose-600 font-semibold p-2 w-full text-center flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar Sesión</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/login?role=company"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-full border border-slate-300 text-slate-700 text-xs font-semibold py-2 text-center"
                >
                  Publicar ofertas
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-full bg-[#0B3B70] text-white text-xs font-semibold py-2 text-center"
                >
                  Ingresar
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
