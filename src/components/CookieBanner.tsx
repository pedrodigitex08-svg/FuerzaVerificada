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
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-white border border-[#E1E4E9] rounded-2xl p-5 shadow-xl text-left animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-[#EAF3FA] border border-[#005DA4]/20 flex items-center justify-center text-[#0B3B70] shrink-0 mt-0.5 shadow-sm">
          <Cookie className="w-5 h-5 text-[#005DA4]" strokeWidth={2} />
        </div>

        <div className="space-y-1.5 flex-1 pr-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-bold text-[#0B3B70] tracking-tight">
              Control de Privacidad y Cookies
            </h3>
            <button
              type="button"
              onClick={() => handleConsent("essential")}
              className="text-slate-400 hover:text-slate-600 p-0.5 -mr-1 rounded transition-colors"
              title="Cerrar banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-slate-600 leading-relaxed">
            Utilizamos cookies técnicas necesarias para autenticar su sesión de manera segura y analizar de forma anónima el rendimiento de la red, conforme a la Ley 1581 de 2012. Conozca los detalles en nuestra{" "}
            <Link
              href="/privacidad"
              className="font-semibold text-[#005DA4] hover:underline"
            >
              Política de Privacidad
            </Link>.
          </p>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => handleConsent("all")}
              className="h-9 px-4 rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white text-xs font-semibold transition-all shadow-sm active:scale-[0.99]"
            >
              Aceptar y continuar
            </button>
            <button
              type="button"
              onClick={() => handleConsent("essential")}
              className="h-9 px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200/80 text-slate-700 text-xs font-medium transition-all active:scale-[0.99]"
            >
              Solo esenciales
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
