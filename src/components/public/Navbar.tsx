"use client";

import Link from "next/link";
import { useState } from "react";
import { Shield, Menu, X, Lock, CheckCircle } from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-[#64748B]">
          <Link
            href="/guarda/vacantes"
            className="hover:text-[#0F172A] transition-colors"
          >
            Explorar Vacantes
          </Link>
          <Link
            href="/empresa/relevos"
            className="hover:text-[#0F172A] transition-colors"
          >
            Perfiles Verificados
          </Link>
          <Link
            href="/empresa/estudios"
            className="hover:text-[#0F172A] transition-colors flex items-center gap-1.5 text-[#1E293B]"
          >
            <Lock className="w-3.5 h-3.5 text-[#10B981]" strokeWidth={1.5} />
            <span>Poligrafía & Visita Domiciliaria</span>
          </Link>
          <Link
            href="/precios-empresas"
            className="hover:text-[#0F172A] transition-colors"
          >
            Planes Empresas
          </Link>
        </nav>

        {/* Right CTA Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs font-semibold text-[#1E293B] hover:text-[#0F172A] px-3.5 py-2 rounded-xl transition-colors"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/empresa/vacantes/nueva"
            className="bg-[#0F172A] hover:bg-[#1E3A8A] text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition-all duration-200"
          >
            Publicar Vacante
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center gap-2">
          <Link
            href="/login"
            className="text-xs font-semibold text-[#1E293B] px-2.5 py-1.5"
          >
            Entrar
          </Link>
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
          <Link
            href="/guarda/vacantes"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-xs font-semibold text-[#1E293B] p-2 rounded-lg hover:bg-[#F8FAFC]"
          >
            Explorar Vacantes
          </Link>
          <Link
            href="/empresa/relevos"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-xs font-semibold text-[#1E293B] p-2 rounded-lg hover:bg-[#F8FAFC]"
          >
            Perfiles Verificados
          </Link>
          <Link
            href="/empresa/estudios"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 text-xs font-semibold text-[#1E293B] p-2 rounded-lg hover:bg-[#F8FAFC]"
          >
            <Lock className="w-3.5 h-3.5 text-[#10B981]" strokeWidth={1.5} />
            <span>Poligrafía & Visita Domiciliaria</span>
          </Link>
          <Link
            href="/precios-empresas"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-xs font-semibold text-[#1E293B] p-2 rounded-lg hover:bg-[#F8FAFC]"
          >
            Planes Empresas
          </Link>
          <div className="pt-2 border-t border-[#E2E8F0] flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-secondary text-xs w-full justify-center"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/empresa/vacantes/nueva"
              onClick={() => setMobileMenuOpen(false)}
              className="bg-[#0F172A] hover:bg-[#1E3A8A] text-white rounded-xl py-2.5 text-xs font-semibold w-full text-center"
            >
              Publicar Vacante
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
