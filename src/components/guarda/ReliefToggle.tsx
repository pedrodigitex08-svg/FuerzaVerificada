"use client";

import { useState } from "react";
import { Zap, Check } from "lucide-react";

interface ReliefToggleProps {
  initialValue?: boolean;
  onToggle?: (newValue: boolean) => void;
}

export function ReliefToggle({
  initialValue = true,
  onToggle,
}: ReliefToggleProps) {
  const [isActive, setIsActive] = useState(initialValue);

  const handleToggle = () => {
    const nextVal = !isActive;
    setIsActive(nextVal);
    if (onToggle) onToggle(nextVal);
  };

  return (
    <div
      onClick={handleToggle}
      role="button"
      tabIndex={0}
      className={`cursor-pointer select-none rounded-lg p-4 border transition-colors duration-200 flex items-center justify-between gap-3 shadow-subtle ${
        isActive
          ? "bg-emerald-50/70 border-emerald-200/80"
          : "bg-white border-slate-200/90 hover:border-slate-300"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 transition-colors ${
            isActive
              ? "bg-emerald-600 text-white"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          <Zap className="w-4 h-4" strokeWidth={1.75} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold text-slate-900 tracking-tight">
              {isActive
                ? "Disponible para Relevos de Emergencia Hoy"
                : "No disponible para turnos inmediatos"}
            </h4>
            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
            {isActive
              ? "Apareces en el radar prioritario de empresas para cubrir novedades o incapacidades hoy."
              : "Activa este interruptor para que las empresas te contacten en 1 clic."}
          </p>
        </div>
      </div>

      {/* Switch Component */}
      <div
        className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0 flex items-center ${
          isActive ? "bg-emerald-600 justify-end" : "bg-slate-200 justify-start"
        }`}
      >
        <div className="w-4 h-4 rounded-full bg-white shadow-xs flex items-center justify-center">
          {isActive ? <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[2.5]" /> : null}
        </div>
      </div>
    </div>
  );
}
