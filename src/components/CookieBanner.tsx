"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("fv_cookie_consent");
      if (!consent) {
        setShowBanner(true);
      }
    } catch {
      // In case localStorage is blocked or unavailable
    }
  }, []);

  const handleConsent = (type: "all" | "essential") => {
    try {
      localStorage.setItem("fv_cookie_consent", type);
    } catch {
      // ignore
    }
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <aside
      aria-label="Consentimiento de Cookies"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-white border border-slate-200/90 rounded-lg p-4 sm:p-4.5 shadow-[0_4px_16px_rgba(15,23,42,0.12)] text-left animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-md bg-slate-900 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <Cookie className="w-4 h-4 text-white" strokeWidth={1.75} />
        </div>

        <div className="space-y-1.5 flex-1 pr-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold text-slate-900 tracking-tight">
              Control de Privacidad y Cookies
            </h3>
            <button
              type="button"
              onClick={() => handleConsent("essential")}
              className="text-slate-400 hover:text-slate-600 p-0.5 -mr-1 rounded transition-colors"
              title="Cerrar banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-slate-600 leading-relaxed">
            Utilizamos cookies técnicas necesarias para autenticar su sesión de manera segura y analizar de forma anónima el rendimiento de la red, conforme a la Ley 1581 de 2012. Conozca los detalles en nuestra{" "}
            <Link
              href="/privacidad"
              className="font-medium text-slate-900 underline hover:text-emerald-700"
            >
              Política de Privacidad
            </Link>.
          </p>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => handleConsent("all")}
              className="h-8 px-3 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-medium transition-colors shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
            >
              Aceptar
            </button>
            <button
              type="button"
              onClick={() => handleConsent("essential")}
              className="h-8 px-3 rounded-md bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-[11px] font-medium transition-colors"
            >
              Solo esenciales
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
