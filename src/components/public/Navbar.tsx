"use client";

import Link from "next/link";
import { useState } from "react";
import { Shield, Menu, X, Lock, CheckCircle, LogOut, User as UserIcon, Building2 } from "lucide-react";
import { useAuth } from "@/lib/supabase/useAuth";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { role, isAuthenticated, fullName, signOut } = useAuth();

  const isCompanyOrAdmin = role === "company" || role === "admin";
  const isCandidate = role === "candidate";

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-slate-200/80 h-16 flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-md bg-[#0F172A] flex items-center justify-center text-white shadow-[0_1px_2px_rgba(15,23,42,0.08)] group-hover:bg-slate-800 transition-colors">
            <Shield className="w-4 h-4 text-white" strokeWidth={1.75} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-slate-900 leading-none">
              Fuerza<span className="text-[#0F172A]">Verificada</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mt-1">
              Red Nacional de Seguridad
            </span>
          </div>
        </Link>

        {/* Central Navigation */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-600">
          {/* CASO 1: Empresa de Seguridad */}
          {role === "company" && (
            <>
              <Link
                href="/empresa/dashboard"
                className="hover:text-slate-900 transition-colors"
              >
                Panel de Empresa
              </Link>
              <Link
                href="/empresa/vacantes/nueva"
                className="hover:text-slate-900 transition-colors"
              >
                Publicar Vacante
              </Link>
              <Link
                href="/empresa/vacantes"
                className="hover:text-slate-900 transition-colors"
              >
                Mis Vacantes
              </Link>
              <Link
                href="/empresa/relevos"
                className="hover:text-slate-900 transition-colors"
              >
                Personal Verificado
              </Link>
              <Link
                href="/empresa/estudios"
                className="hover:text-slate-900 transition-colors flex items-center gap-1.5 text-slate-900 font-semibold"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.5} />
                <span>Estudios & Poligrafía</span>
              </Link>
              <Link
                href="/precios-empresas"
                className="hover:text-slate-900 transition-colors"
              >
                Planes Empresas
              </Link>
            </>
          )}

          {/* CASO 2: Personal Operativo (Candidato) */}
          {role === "candidate" && (
            <>
              <Link
                href="/guarda/vacantes"
                className="hover:text-slate-900 transition-colors"
              >
                Vacantes / Buscar Empleo
              </Link>
              <Link
                href="/guarda/postulaciones"
                className="hover:text-slate-900 transition-colors"
              >
                Mis Postulaciones
              </Link>
              <Link
                href="/guarda/perfil"
                className="hover:text-slate-900 transition-colors"
              >
                Mi Hoja de Vida
              </Link>
              <Link
                href="/guarda/documentos"
                className="hover:text-slate-900 transition-colors"
              >
                Mis Cursos y Documentos
              </Link>
              <Link
                href="/guarda/documentos#academias"
                className="hover:text-slate-900 transition-colors"
              >
                Academias Aliadas
              </Link>
            </>
          )}

          {/* CASO 3: SuperAdmin */}
          {role === "admin" && (
            <>
              <Link
                href="/admin/estudios"
                className="hover:text-slate-900 transition-colors"
              >
                Bandeja de Estudios
              </Link>
              <Link
                href="/admin/empresas"
                className="hover:text-slate-900 transition-colors"
              >
                Empresas B2B
              </Link>
              <Link
                href="/admin/academias"
                className="hover:text-slate-900 transition-colors"
              >
                Academias Aliadas
              </Link>
              <Link
                href="/admin/planes"
                className="hover:text-slate-900 transition-colors"
              >
                Planes B2B
              </Link>
              <Link
                href="/admin/configuracion"
                className="hover:text-slate-900 transition-colors"
              >
                Configuración
              </Link>
            </>
          )}

          {/* CASO 4: Visitante No Autenticado */}
          {!isAuthenticated && (
            <>
              <Link
                href="/guarda/vacantes"
                className="hover:text-slate-900 transition-colors"
              >
                Explorar Vacantes
              </Link>
              <Link
                href="/precios-empresas"
                className="hover:text-slate-900 transition-colors"
              >
                Planes Empresas
              </Link>
            </>
          )}
        </nav>

        {/* Right CTA Buttons */}
        <div className="hidden sm:flex items-center gap-2.5">
          {isAuthenticated ? (
            <div className="flex items-center gap-2.5">
              {role === "company" ? (
                <>
                  <Link
                    href="/empresa/dashboard"
                    className="h-9 text-xs font-medium text-slate-800 hover:text-slate-950 px-3.5 rounded-md border border-slate-200/90 bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
                  >
                    <Building2 className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.5} />
                    <span>Panel ATS</span>
                  </Link>

                  <Link
                    href="/empresa/vacantes/nueva"
                    className="h-9 bg-[#0F172A] hover:bg-slate-800 text-white rounded-md px-4 text-xs font-medium shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-colors inline-flex items-center justify-center"
                  >
                    Publicar Vacante
                  </Link>
                </>
              ) : role === "admin" ? (
                <Link
                  href="/admin/estudios"
                  className="h-9 text-xs font-medium text-slate-800 hover:text-slate-950 px-3.5 rounded-md border border-slate-200/90 bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-600" strokeWidth={1.75} />
                  <span>Panel SuperAdmin</span>
                </Link>
              ) : (
                <Link
                  href="/guarda/vacantes"
                  className="h-9 text-xs font-medium text-slate-800 hover:text-slate-950 px-3.5 rounded-md border border-slate-200/90 bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.5} />
                  <span>{fullName || "Mi Portal"}</span>
                </Link>
              )}

              <button
                onClick={async () => {
                  await signOut();
                }}
                className="h-9 w-9 flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50/70 rounded-md transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          ) : (
            <div className="flex items-center">
              <Link
                href="/login"
                className="h-9 bg-[#0F172A] hover:bg-slate-800 text-white rounded-md px-4 text-xs font-medium shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-colors inline-flex items-center justify-center"
              >
                Ingresar / Registrarse
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center gap-2">
          {!isAuthenticated && (
            <Link
              href="/login"
              className="h-8 bg-[#0F172A] hover:bg-slate-800 text-white rounded-md px-3 text-xs font-medium shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-colors inline-flex items-center justify-center"
            >
              Ingresar / Registrarse
            </Link>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-200/90 text-slate-600 hover:bg-slate-50"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? (
              <X className="w-4 h-4" strokeWidth={1.5} />
            ) : (
              <Menu className="w-4 h-4" strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-16 inset-x-0 bg-white border-b border-slate-200/90 p-4 shadow-[0_4px_12px_rgba(15,23,42,0.06)] space-y-2">
          {/* CASO 1: Empresa de Seguridad */}
          {role === "company" && (
            <>
              <Link
                href="/empresa/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-medium text-slate-800 p-2 rounded-md hover:bg-slate-50"
              >
                Panel de Empresa
              </Link>
              <Link
                href="/empresa/vacantes/nueva"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-medium text-slate-800 p-2 rounded-md hover:bg-slate-50"
              >
                Publicar Vacante
              </Link>
              <Link
                href="/empresa/vacantes"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-medium text-slate-800 p-2 rounded-md hover:bg-slate-50"
              >
                Mis Vacantes
              </Link>
              <Link
                href="/empresa/relevos"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-medium text-slate-800 p-2 rounded-md hover:bg-slate-50"
              >
                Directorio de Personal Verificado / Relevos
              </Link>
              <Link
                href="/empresa/estudios"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-xs font-medium text-slate-800 p-2 rounded-md hover:bg-slate-50"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.5} />
                <span>Solicitar Estudios & Poligrafía</span>
              </Link>
              <Link
                href="/precios-empresas"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-medium text-slate-800 p-2 rounded-md hover:bg-slate-50"
              >
                Planes Empresas
              </Link>
            </>
          )}

          {/* CASO 2: Personal Operativo (Candidato) */}
          {role === "candidate" && (
            <>
              <Link
                href="/guarda/vacantes"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-medium text-slate-800 p-2 rounded-md hover:bg-slate-50"
              >
                Vacantes / Buscar Empleo
              </Link>
              <Link
                href="/guarda/postulaciones"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-medium text-slate-800 p-2 rounded-md hover:bg-slate-50"
              >
                Mis Postulaciones
              </Link>
              <Link
                href="/guarda/perfil"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-medium text-slate-800 p-2 rounded-md hover:bg-slate-50"
              >
                Mi Hoja de Vida
              </Link>
              <Link
                href="/guarda/documentos"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-medium text-slate-800 p-2 rounded-md hover:bg-slate-50"
              >
                Mis Cursos y Documentos
              </Link>
              <Link
                href="/guarda/documentos#academias"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-medium text-slate-800 p-2 rounded-md hover:bg-slate-50"
              >
                Academias Aliadas
              </Link>
            </>
          )}

          {/* CASO 3: SuperAdmin */}
          {role === "admin" && (
            <>
              <Link
                href="/admin/estudios"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-medium text-slate-800 p-2 rounded-md hover:bg-slate-50"
              >
                Bandeja de Estudios & Poligrafía
              </Link>
              <Link
                href="/admin/empresas"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-medium text-slate-800 p-2 rounded-md hover:bg-slate-50"
              >
                Empresas & Recarga B2B
              </Link>
              <Link
                href="/admin/academias"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-medium text-slate-800 p-2 rounded-md hover:bg-slate-50"
              >
                Red de Academias Aliadas
              </Link>
              <Link
                href="/admin/planes"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-medium text-slate-800 p-2 rounded-md hover:bg-slate-50"
              >
                Planes & Tarifas B2B
              </Link>
              <Link
                href="/admin/configuracion"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-medium text-slate-800 p-2 rounded-md hover:bg-slate-50"
              >
                Configuración Comercial
              </Link>
            </>
          )}

          {/* CASO 4: Visitante No Autenticado */}
          {!isAuthenticated && (
            <>
              <Link
                href="/guarda/vacantes"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-medium text-slate-800 p-2 rounded-md hover:bg-slate-50"
              >
                Explorar Vacantes
              </Link>
              <Link
                href="/precios-empresas"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-medium text-slate-800 p-2 rounded-md hover:bg-slate-50"
              >
                Planes Empresas
              </Link>
            </>
          )}

          <div className="pt-2 border-t border-slate-200/90 flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                {role === "company" && (
                  <Link
                    href="/empresa/vacantes/nueva"
                    onClick={() => setMobileMenuOpen(false)}
                    className="h-9 bg-[#0F172A] hover:bg-slate-800 text-white rounded-md text-xs font-medium w-full flex items-center justify-center"
                  >
                    Publicar Vacante
                  </Link>
                )}
                <button
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await signOut();
                  }}
                  className="text-xs text-rose-600 font-medium p-2 rounded-md hover:bg-rose-50 text-center flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar Sesión ({fullName || (role === "company" ? "Empresa" : "Usuario")})</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-9 bg-[#0F172A] hover:bg-slate-800 text-white rounded-md text-xs font-medium w-full flex items-center justify-center"
                >
                  Ingresar / Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
