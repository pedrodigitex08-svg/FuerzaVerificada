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
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] h-16 flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[#0F172A] flex items-center justify-center text-white shadow-sm group-hover:bg-[#1E3A8A] transition-colors">
            <Shield className="w-5 h-5 text-white" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-[#1E293B] leading-tight">
              Fuerza<span className="text-[#0F172A]">Verificada</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider text-[#64748B] font-semibold">
              Red Nacional de Seguridad
            </span>
          </div>
        </Link>

        {/* Central Navigation */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-[#64748B]">
          {/* CASO 1: Empresa de Seguridad */}
          {role === "company" && (
            <>
              <Link
                href="/empresa/dashboard"
                className="hover:text-[#0F172A] transition-colors"
              >
                Panel de Empresa
              </Link>
              <Link
                href="/empresa/vacantes/nueva"
                className="hover:text-[#0F172A] transition-colors"
              >
                Publicar Vacante
              </Link>
              <Link
                href="/empresa/vacantes"
                className="hover:text-[#0F172A] transition-colors"
              >
                Mis Vacantes
              </Link>
              <Link
                href="/empresa/relevos"
                className="hover:text-[#0F172A] transition-colors"
              >
                Personal Verificado
              </Link>
              <Link
                href="/empresa/estudios"
                className="hover:text-[#0F172A] transition-colors flex items-center gap-1.5 text-[#1E293B]"
              >
                <Lock className="w-3.5 h-3.5 text-[#10B981]" strokeWidth={1.5} />
                <span>Estudios & Poligrafía</span>
              </Link>
              <Link
                href="/precios-empresas"
                className="hover:text-[#0F172A] transition-colors"
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
                className="hover:text-[#0F172A] transition-colors"
              >
                Buscador de Vacantes
              </Link>
              <Link
                href="/guarda/postulaciones"
                className="hover:text-[#0F172A] transition-colors"
              >
                Mis Postulaciones
              </Link>
              <Link
                href="/guarda/perfil"
                className="hover:text-[#0F172A] transition-colors"
              >
                Mi Hoja de Vida
              </Link>
              <Link
                href="/guarda/documentos"
                className="hover:text-[#0F172A] transition-colors"
              >
                Mis Cursos
              </Link>
            </>
          )}

          {/* CASO 3: SuperAdmin */}
          {role === "admin" && (
            <>
              <Link
                href="/admin/estudios"
                className="hover:text-[#0F172A] transition-colors"
              >
                Bandeja de Estudios
              </Link>
              <Link
                href="/admin/empresas"
                className="hover:text-[#0F172A] transition-colors"
              >
                Empresas B2B
              </Link>
              <Link
                href="/admin/academias"
                className="hover:text-[#0F172A] transition-colors"
              >
                Academias Aliadas
              </Link>
              <Link
                href="/admin/planes"
                className="hover:text-[#0F172A] transition-colors"
              >
                Planes B2B
              </Link>
              <Link
                href="/admin/configuracion"
                className="hover:text-[#0F172A] transition-colors"
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
                className="hover:text-[#0F172A] transition-colors"
              >
                Explorar Vacantes
              </Link>
              <Link
                href="/precios-empresas"
                className="hover:text-[#0F172A] transition-colors"
              >
                Planes Empresas
              </Link>
            </>
          )}
        </nav>

        {/* Right CTA Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {role === "company" ? (
                <>
                  <Link
                    href="/empresa/dashboard"
                    className="text-xs font-semibold text-[#1E293B] hover:text-[#0F172A] px-3 py-1.5 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors flex items-center gap-1.5"
                  >
                    <Building2 className="w-3.5 h-3.5 text-[#64748B]" strokeWidth={1.5} />
                    <span>Panel ATS</span>
                  </Link>

                  <Link
                    href="/empresa/vacantes/nueva"
                    className="bg-[#0F172A] hover:bg-[#1E3A8A] text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition-all duration-200"
                  >
                    Publicar Vacante
                  </Link>
                </>
              ) : role === "admin" ? (
                <Link
                  href="/admin/estudios"
                  className="text-xs font-semibold text-[#1E293B] hover:text-[#0F172A] px-3.5 py-2 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.75} />
                  <span>Panel SuperAdmin</span>
                </Link>
              ) : (
                <Link
                  href="/guarda/vacantes"
                  className="text-xs font-semibold text-[#1E293B] hover:text-[#0F172A] px-3.5 py-2 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors flex items-center gap-1.5"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#64748B]" strokeWidth={1.5} />
                  <span>{fullName || "Mi Portal"}</span>
                </Link>
              )}

              <button
                onClick={async () => {
                  await signOut();
                }}
                className="text-xs text-[#64748B] hover:text-rose-600 p-2 rounded-xl transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          ) : (
            <div className="flex items-center">
              <Link
                href="/login"
                className="bg-[#0F172A] hover:bg-[#1E3A8A] text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition-all duration-200"
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
              className="bg-[#0F172A] hover:bg-[#1E3A8A] text-white rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm transition-all"
            >
              Ingresar / Registrarse
            </Link>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-xl border border-[#E2E8F0] text-[#64748B]"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" strokeWidth={1.5} />
            ) : (
              <Menu className="w-5 h-5" strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-16 inset-x-0 bg-white border-b border-[#E2E8F0] p-4 shadow-lg space-y-3 animate-in fade-in slide-in-from-top-2">
          {/* CASO 1: Empresa de Seguridad */}
          {role === "company" && (
            <>
              <Link
                href="/empresa/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-semibold text-[#1E293B] p-2 rounded-lg hover:bg-[#F8FAFC]"
              >
                Panel de Empresa
              </Link>
              <Link
                href="/empresa/vacantes/nueva"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-semibold text-[#1E293B] p-2 rounded-lg hover:bg-[#F8FAFC]"
              >
                Publicar Vacante
              </Link>
              <Link
                href="/empresa/vacantes"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-semibold text-[#1E293B] p-2 rounded-lg hover:bg-[#F8FAFC]"
              >
                Mis Vacantes
              </Link>
              <Link
                href="/empresa/relevos"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-semibold text-[#1E293B] p-2 rounded-lg hover:bg-[#F8FAFC]"
              >
                Directorio de Personal Verificado / Relevos
              </Link>
              <Link
                href="/empresa/estudios"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-xs font-semibold text-[#1E293B] p-2 rounded-lg hover:bg-[#F8FAFC]"
              >
                <Lock className="w-3.5 h-3.5 text-[#10B981]" strokeWidth={1.5} />
                <span>Solicitar Estudios & Poligrafía</span>
              </Link>
              <Link
                href="/precios-empresas"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-semibold text-[#1E293B] p-2 rounded-lg hover:bg-[#F8FAFC]"
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
                className="block text-xs font-semibold text-[#1E293B] p-2 rounded-lg hover:bg-[#F8FAFC]"
              >
                Buscador de Vacantes
              </Link>
              <Link
                href="/guarda/postulaciones"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-semibold text-[#1E293B] p-2 rounded-lg hover:bg-[#F8FAFC]"
              >
                Mis Postulaciones
              </Link>
              <Link
                href="/guarda/perfil"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-semibold text-[#1E293B] p-2 rounded-lg hover:bg-[#F8FAFC]"
              >
                Mi Hoja de Vida
              </Link>
              <Link
                href="/guarda/documentos"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-semibold text-[#1E293B] p-2 rounded-lg hover:bg-[#F8FAFC]"
              >
                Mis Cursos y Documentos
              </Link>
            </>
          )}

          {/* CASO 3: SuperAdmin */}
          {role === "admin" && (
            <>
              <Link
                href="/admin/estudios"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-semibold text-[#1E293B] p-2 rounded-lg hover:bg-[#F8FAFC]"
              >
                Bandeja de Estudios & Poligrafía
              </Link>
              <Link
                href="/admin/empresas"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-semibold text-[#1E293B] p-2 rounded-lg hover:bg-[#F8FAFC]"
              >
                Empresas & Recarga B2B
              </Link>
              <Link
                href="/admin/academias"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-semibold text-[#1E293B] p-2 rounded-lg hover:bg-[#F8FAFC]"
              >
                Red de Academias Aliadas
              </Link>
              <Link
                href="/admin/planes"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-semibold text-[#1E293B] p-2 rounded-lg hover:bg-[#F8FAFC]"
              >
                Planes & Tarifas B2B
              </Link>
              <Link
                href="/admin/configuracion"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-semibold text-[#1E293B] p-2 rounded-lg hover:bg-[#F8FAFC]"
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
                className="block text-xs font-semibold text-[#1E293B] p-2 rounded-lg hover:bg-[#F8FAFC]"
              >
                Explorar Vacantes
              </Link>
              <Link
                href="/precios-empresas"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-semibold text-[#1E293B] p-2 rounded-lg hover:bg-[#F8FAFC]"
              >
                Planes Empresas
              </Link>
            </>
          )}

          <div className="pt-2 border-t border-[#E2E8F0] flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                {role === "company" && (
                  <Link
                    href="/empresa/vacantes/nueva"
                    onClick={() => setMobileMenuOpen(false)}
                    className="bg-[#0F172A] hover:bg-[#1E3A8A] text-white rounded-xl py-2.5 text-xs font-semibold w-full text-center"
                  >
                    Publicar Vacante
                  </Link>
                )}
                <button
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await signOut();
                  }}
                  className="text-xs text-rose-600 font-semibold p-2 rounded-lg hover:bg-rose-50 text-center flex items-center justify-center gap-1.5"
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
                  className="bg-[#0F172A] hover:bg-[#1E3A8A] text-white rounded-xl py-2.5 text-xs font-semibold w-full text-center"
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
