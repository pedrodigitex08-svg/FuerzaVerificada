"use client";

import Link from "next/link";
import { Shield, Lock, FileCheck, CheckCircle, MapPin, Phone, Mail } from "lucide-react";
import { useAuth } from "@/lib/supabase/useAuth";

export function Footer() {
  const { role, isAuthenticated } = useAuth();
  const isCompany = role === "company";
  const isCandidate = role === "candidate";

  return (
    <footer className="bg-white text-[#4B5968] border-t border-[#E1E4E9] pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 4 COLUMNAS ESTILO COMPUTRABAJO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-[#E1E4E9]">
          {/* Columna 1: Marca y Propósito */}
          <div className="space-y-3.5">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#0B3B70] flex items-center justify-center text-white">
                <Shield className="w-4 h-4 text-white" strokeWidth={2} />
              </div>
              <span className="text-base font-bold text-[#0B3B70] tracking-tight">
                Fuerza<span className="text-[#005DA4]">Verificada</span>
              </span>
            </Link>

            <p className="text-xs text-[#627384] leading-relaxed">
              El portal de empleo especializado en seguridad privada en Colombia. Conectamos talento operativo auditado con las empresas líderes del sector.
            </p>

            <div className="inline-flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-full font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-600" strokeWidth={2} />
              <span>Garantía 100% Cero Cobros a Guardas</span>
            </div>
          </div>

          {/* Columna 2: Personal Operativo */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#0B3B70] tracking-wider uppercase">
              Personal Operativo
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/vacantes" className="hover:text-[#005DA4] transition-colors">
                  Bolsa de Empleo y Vacantes
                </Link>
              </li>
              <li>
                <Link
                  href={isAuthenticated && isCandidate ? "/guarda/perfil" : "/login"}
                  className="hover:text-[#005DA4] transition-colors"
                >
                  {isAuthenticated && isCandidate ? "Mi Hoja de Vida (PDF)" : "Registrar Hoja de Vida"}
                </Link>
              </li>
              <li>
                <Link
                  href={isAuthenticated && isCandidate ? "/guarda/postulaciones" : "/vacantes"}
                  className="hover:text-[#005DA4] transition-colors"
                >
                  Rastreador de Postulaciones (4 Etapas)
                </Link>
              </li>
              <li>
                <Link
                  href={isAuthenticated && isCandidate ? "/guarda/documentos" : "/vacantes"}
                  className="hover:text-[#005DA4] transition-colors"
                >
                  Semáforo de Cursos SuperVigilancia
                </Link>
              </li>
              <li>
                <Link
                  href="/guarda/documentos#academias"
                  className="hover:text-[#005DA4] transition-colors"
                >
                  Red de Academias Aliadas
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Empresas de Seguridad */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#0B3B70] tracking-wider uppercase">
              Empresas de Seguridad
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href={isCompany ? "/empresa/vacantes/nueva" : "/login?role=company"}
                  className="hover:text-[#005DA4] transition-colors font-medium text-slate-900"
                >
                  Publicar Vacante con Plantillas ⚡
                </Link>
              </li>
              <li>
                <Link
                  href={isCompany ? "/empresa/vacantes" : "/login?role=company"}
                  className="hover:text-[#005DA4] transition-colors"
                >
                  Bandeja ATS con Filtro Killer Checks
                </Link>
              </li>
              <li>
                <Link
                  href={isCompany ? "/empresa/relevos" : "/login?role=company"}
                  className="hover:text-[#005DA4] transition-colors"
                >
                  Radar de Relevos Urgentes 24/7
                </Link>
              </li>
              <li>
                <Link
                  href={isCompany ? "/empresa/estudios" : "/login?role=company"}
                  className="hover:text-[#005DA4] transition-colors flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Laboratorio de Poligrafía & Visitas</span>
                </Link>
              </li>
              <li>
                <Link href="/precios-empresas" className="hover:text-[#005DA4] transition-colors">
                  Tarifas y Paquetes B2B
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 4: Normativa & Soporte */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#0B3B70] tracking-wider uppercase">
              Legalidad & Contacto
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/terminos" className="hover:text-[#005DA4] transition-colors">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="hover:text-[#005DA4] transition-colors">
                  Política de Privacidad y Habeas Data
                </Link>
              </li>
              <li className="pt-1">
                <a
                  href="https://wa.me/573104508920?text=Hola,%20requiero%20asistencia%20en%20FuerzaVerificada"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Soporte WhatsApp (+57 310 450 8920)</span>
                </a>
              </li>
              <li className="text-[11px] text-[#627384]">
                Sede Central: Bogotá D.C., Colombia
              </li>
            </ul>
          </div>
        </div>

        {/* CINTILLO NORMATIVO INSTITUCIONAL */}
        <div className="py-4 text-[11px] text-slate-500 leading-relaxed text-center sm:text-left border-b border-[#E1E4E9]">
          <p>
            <strong>Marco Regulatorio:</strong> FuerzaVerificada opera en estricto cumplimiento del Decreto 356 de 1994 (Estatuto de Vigilancia y Seguridad Privada), la Resolución 20111300041285 de la Superintendencia de Vigilancia y la Ley 1581 de 2012 de Protección de Datos Personales de Colombia. Prohibida toda intermediación laboral con costo para el aspirante.
          </p>
        </div>

        {/* COPYRIGHT BOTTOM BAR */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <span>
            © {new Date().getFullYear()} FuerzaVerificada Colombia. Todos los derechos reservados.
          </span>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/terminos" className="hover:text-slate-700">Términos</Link>
            <span>•</span>
            <Link href="/privacidad" className="hover:text-slate-700">Privacidad</Link>
            <span>•</span>
            <Link href="/sitemap.xml" className="hover:text-slate-700">Mapa del Sitio</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
