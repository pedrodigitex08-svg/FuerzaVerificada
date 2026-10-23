"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Shield,
  Briefcase,
  Users,
  Database,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { initializeSeedData } from "@/lib/utils/seedData";

export function DemoRoleSwitcher() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  const handleResetSeed = () => {
    initializeSeedData(true);
    setSeedSuccess(true);
    setTimeout(() => {
      setSeedSuccess(false);
      window.location.reload();
    }, 800);
  };

  const navItems = [
    {
      title: "Landing & Planes B2B",
      subtitle: "Conversión y propuesta de valor",
      href: "/",
      icon: Compass,
      active: pathname === "/" || pathname === "/precios-empresas",
      badge: "Público",
    },
    {
      title: "Portal Guarda / Escolta",
      subtitle: "Vacantes, Match % y Semáforo",
      href: "/guarda/vacantes",
      icon: Users,
      active: pathname.startsWith("/guarda"),
      badge: "Candidatos",
    },
    {
      title: "Panel Empresa & ATS",
      subtitle: "Pipeline y orden de estudios",
      href: "/empresa/dashboard",
      icon: Briefcase,
      active: pathname.startsWith("/empresa"),
      badge: "Empresas",
    },
    {
      title: "Comando SuperAdmin",
      subtitle: "Poligrafía, visitas y empresas",
      href: "/admin/estudios",
      icon: Shield,
      active: pathname.startsWith("/admin"),
      badge: "Operaciones",
    },
  ];

  return (
    <aside aria-label="Selector de demostración comercial" className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-slate-950/95 text-white border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-md w-80 space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-bold tracking-tight text-slate-200 uppercase">
                Demostración Comercial
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              title="Minimizar barra"
            >
              <ChevronDown className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>

          <p className="text-[11px] text-slate-400 leading-tight">
            Navega en 1 clic entre los 4 módulos operativos de <strong>FuerzaVerificada</strong>.
          </p>

          {/* Role Navigation Links */}
          <div className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-all border ${
                    item.active
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-300 font-semibold"
                      : "bg-slate-900/80 border-slate-800/80 hover:bg-slate-800 hover:border-slate-700 text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0 text-slate-400" strokeWidth={1.75} />
                    <div className="text-left">
                      <div className="font-semibold text-slate-100">{item.title}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{item.subtitle}</div>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider ${
                      item.active
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {item.badge}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Seed Data Reset Action */}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={handleResetSeed}
              disabled={seedSuccess}
              className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                seedSuccess
                  ? "bg-emerald-600 border-emerald-500 text-white"
                  : "bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white"
              }`}
            >
              {seedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" strokeWidth={2} />
                  <span>¡Datos demo restaurados!</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.75} />
                  <span>Restaurar Datos Demo (Seed)</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-slate-950/90 text-white border border-slate-800 shadow-xl backdrop-blur-md hover:bg-slate-900 transition-all text-xs font-semibold group"
          title="Abrir selector de roles de demostración"
        >
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-slate-200 group-hover:text-amber-300 transition-colors">
            Demo Switcher
          </span>
          <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" strokeWidth={1.75} />
        </button>
      )}
    </aside>
  );
}
