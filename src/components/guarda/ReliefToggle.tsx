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
      className={`cursor-pointer select-none rounded-xl p-4 border transition-all duration-200 flex items-center justify-between gap-3 shadow-sm ${
        isActive
          ? "bg-[#ECFDF5] border-[#10B981]/40 ring-1 ring-[#10B981]/20"
          : "bg-white border-[#E2E8F0] hover:border-slate-300"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            isActive
              ? "bg-[#10B981] text-white"
              : "bg-[#F3F4F6] text-[#64748B]"
          }`}
        >
          <Zap className="w-5 h-5" strokeWidth={1.5} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-[#1E293B] tracking-tight">
              {isActive
                ? "Disponible para Relevos de Emergencia Hoy"
                : "No disponible para turnos inmediatos"}
            </h4>
            {isActive && (
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            )}
          </div>
          <p className="text-[11px] text-[#64748B] mt-0.5 leading-snug">
            {isActive
              ? "Apareces en el radar prioritario de empresas para cubrir novedades o incapacidades hoy."
              : "Activa este interruptor para que las empresas te contacten en 1 clic."}
          </p>
        </div>
      </div>

      {/* Switch Component */}
      <div
        className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 shrink-0 flex items-center ${
          isActive ? "bg-[#10B981] justify-end" : "bg-slate-200 justify-start"
        }`}
      >
        <div className="w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center">
          {isActive ? <Check className="w-3 h-3 text-[#10B981] stroke-[2.5]" /> : null}
        </div>
      </div>
    </div>
  );
}
