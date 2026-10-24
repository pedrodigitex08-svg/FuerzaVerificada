"use client";

import Link from "next/link";
import { Shield, Lock, FileCheck, CheckCircle } from "lucide-react";
import { useAuth } from "@/lib/supabase/useAuth";

export function Footer() {
  const { role, isAuthenticated } = useAuth();
  const isCompanyOrAdmin = role === "company" || role === "admin";

  return (
    <footer className="bg-[#F8FAFC] text-[#64748B] border-t border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1 */}
          <div className="space-y-3.5 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#0F172A] flex items-center justify-center text-white">
                <Shield className="w-4 h-4 text-white" strokeWidth={1.5} />
              </div>
              <span className="text-base font-bold text-[#1E293B] tracking-tight">
                Fuerza<span className="text-[#0F172A]">Verificada</span>
              </span>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Infraestructura digital para la seguridad privada en Colombia. Conexión de personal operativo y profesionales certificados, con blindaje en estudios de confiabilidad y poligrafía.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#065F46] font-semibold">
              <CheckCircle className="w-4 h-4 text-[#10B981]" strokeWidth={1.5} />
              Garantía Cero Cobros a Candidatos
            </div>
          </div>

          {/* Col 2: Solo para Candidato, Admin o Visitante (oculto para Empresa) */}
          {role !== "company" ? (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#1E293B] tracking-wider uppercase">
                Para Personal Operativo
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/guarda/vacantes" className="hover:text-[#0F172A] transition-colors">
                    Buscador de Vacantes
                  </Link>
                </li>
                <li>
                  <Link
                    href={isAuthenticated && role === "candidate" ? "/guarda/perfil" : "/login"}
                    className="hover:text-[#0F172A] transition-colors"
                  >
                    {isAuthenticated && role === "candidate" ? "Mi Hoja de Vida" : "Registro de Hoja de Vida"}
                  </Link>
                </li>
                <li>
                  <Link
                    href={isAuthenticated && role === "candidate" ? "/guarda/documentos" : "/guarda/vacantes"}
                    className="hover:text-[#0F172A] transition-colors"
                  >
                    Credencial SuperVigilancia
                  </Link>
                </li>
                <li>
                  <Link
                    href={isAuthenticated && role === "candidate" ? "/guarda/postulaciones" : "/guarda/vacantes"}
                    className="hover:text-[#0F172A] transition-colors"
                  >
                    Seguimiento de Postulaciones
                  </Link>
                </li>
              </ul>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#1E293B] tracking-wider uppercase">
                Gestión Corporativa
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/empresa/dashboard" className="hover:text-[#0F172A] transition-colors">
                    Panel de Control B2B
                  </Link>
                </li>
                <li>
                  <Link href="/precios-empresas" className="hover:text-[#0F172A] transition-colors">
                    Planes para Empresas
                  </Link>
                </li>
                <li>
                  <Link href="/empresa/relevos" className="hover:text-[#0F172A] transition-colors">
                    Directorio de Relevos 24/7
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* Col 3: Solo para Empresa, Admin o Visitante (oculto para Candidato) */}
          {role !== "candidate" ? (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#1E293B] tracking-wider uppercase">
                Para Empresas de Seguridad
              </h4>
              <ul className="space-y-2 text-xs">
                {isCompanyOrAdmin ? (
                  <>
                    <li>
                      <Link href="/empresa/vacantes/nueva" className="hover:text-[#0F172A] transition-colors font-medium text-[#1E293B]">
                        Publicar Nueva Vacante
                      </Link>
                    </li>
                    <li>
                      <Link href="/empresa/vacantes" className="hover:text-[#0F172A] transition-colors">
                        Panel ATS & Vacantes
                      </Link>
                    </li>
                    <li>
                      <Link href="/empresa/relevos" className="hover:text-[#0F172A] transition-colors">
                        Radar de Relevos Hoy
                      </Link>
                    </li>
                    <li>
                      <Link href="/empresa/estudios" className="hover:text-[#0F172A] transition-colors flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-[#10B981]" strokeWidth={1.5} />
                        <span>Poligrafía y Visitas</span>
                      </Link>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link href="/login" className="hover:text-[#0F172A] transition-colors">
                        Portal Empresarial (Ingreso)
                      </Link>
                    </li>
                    <li>
                      <Link href="/precios-empresas" className="hover:text-[#0F172A] transition-colors">
                        Planes para Empresas
                      </Link>
                    </li>
                    <li>
                      <Link href="/precios-empresas" className="hover:text-[#0F172A] transition-colors">
                        Estructura de Poligrafía y ATS
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#1E293B] tracking-wider uppercase">
                Respaldo al Operativo
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/guarda/documentos" className="hover:text-[#0F172A] transition-colors">
                    Semáforo de Curso SuperVigilancia
                  </Link>
                </li>
                <li>
                  <Link href="/guarda/documentos" className="hover:text-[#0F172A] transition-colors">
                    Convenios con Academias Aliadas
                  </Link>
                </li>
                <li>
                  <Link href="/guarda/perfil" className="hover:text-[#0F172A] transition-colors">
                    Modo Disponible para Relevo Hoy
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* Col 4 */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#1E293B] tracking-wider uppercase">
              Garantía Jurídica
            </h4>
            <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] space-y-2 text-xs text-[#64748B]">
              <div className="flex items-center gap-1.5 font-bold text-[#1E293B]">
                <FileCheck className="w-3.5 h-3.5 text-[#10B981]" strokeWidth={1.5} />
                <span>Superintendencia de Vigilancia</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Procesos de selección y poligrafía ajustados al Decreto 356 de 1994 y Ley 1581 de Protección de Datos Personales en Colombia.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64748B]">
          <p>© 2026 FuerzaVerificada. Todos los derechos reservados. Colombia.</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-[#0F172A]">Términos de Servicio</Link>
            <Link href="/" className="hover:text-[#0F172A]">Aviso de Privacidad</Link>
            {role === "admin" && (
              <Link href="/admin/estudios" className="text-slate-400 hover:text-[#0F172A]">
                Mando SuperAdmin
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
