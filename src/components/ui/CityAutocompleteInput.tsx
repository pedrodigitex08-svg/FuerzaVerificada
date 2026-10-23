"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, X, Check } from "lucide-react";

export const COLOMBIAN_CITIES = [
  "Bogotá D.C.",
  "Medellín",
  "Cali",
  "Barranquilla",
  "Cartagena",
  "Santa Marta",
  "Bucaramanga",
  "Cúcuta",
  "Pereira",
  "Manizales",
  "Villavicencio",
  "Ibagué",
  "Pasto",
  "Montería",
  "Neiva",
  "Armenia",
  "Popayán",
  "Valledupar",
  "Sincelejo",
  "Tunja",
  "Riohacha",
  "Florencia",
  "Yopal",
  "Quibdó",
  "Palmira",
  "Buenaventura",
  "Soacha",
  "Bello",
  "Itagüí",
  "Envigado",
  "Floridablanca",
  "Barrancabermeja",
  "Girardot",
  "Facatativá",
  "Chía",
  "Zipaquirá",
  "Rionegro",
  "Apartadó",
  "Cartago",
  "Dosquebradas",
  "Sogamoso",
  "Duitama",
];

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

interface CityAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  onSelect?: (city: string) => void;
  id?: string;
  autoFocus?: boolean;
}

export function CityAutocompleteInput({
  value,
  onChange,
  placeholder = "Bogotá D.C., Medellín, Cali...",
  className = "",
  inputClassName = "",
  onSelect,
  id,
  autoFocus = false,
}: CityAutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter cities based on user input (ignoring accents and case)
  const query = value.trim();
  const normalizedQuery = normalizeText(query);

  const filteredCities = query
    ? COLOMBIAN_CITIES.filter((city) =>
        normalizeText(city).includes(normalizedQuery)
      ).sort((a, b) => {
        const aStarts = normalizeText(a).startsWith(normalizedQuery);
        const bStarts = normalizeText(b).startsWith(normalizedQuery);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.localeCompare(b);
      }).slice(0, 8)
    : [];

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleSelectCity = (city: string) => {
    onChange(city);
    onSelect?.(city);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="flex items-center gap-2 w-full">
        <MapPin className="w-4 h-4 text-[#64748B] shrink-0" strokeWidth={1.5} />
        <input
          id={id}
          type="text"
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (value.trim().length > 0) setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsOpen(false);
            }
          }}
          placeholder={placeholder}
          className={`w-full text-xs font-semibold text-[#1E293B] placeholder-[#94A3B8] focus:outline-none bg-transparent ${inputClassName}`}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
            title="Borrar ubicación"
          >
            <X className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Floating Predictive Suggestions Dropdown */}
      {isOpen && query.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden py-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 text-left">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
            <span>Ciudades Sugeridas</span>
            <span>Colombia</span>
          </div>

          {filteredCities.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {filteredCities.map((city) => {
                const isSelected =
                  normalizeText(city) === normalizeText(value.trim());

                return (
                  <button
                    key={city}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectCity(city);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-[#F8FAFC] active:bg-slate-100 transition-colors group cursor-pointer ${
                      isSelected ? "bg-slate-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? "bg-[#0F172A] text-white"
                            : "bg-slate-100 text-slate-500 group-hover:bg-[#0F172A] group-hover:text-white"
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </div>
                      <div>
                        <span className="font-semibold text-[#1E293B] group-hover:text-[#0F172A] block leading-tight">
                          {city}
                        </span>
                        <span className="text-[10px] text-slate-400">Colombia</span>
                      </div>
                    </div>

                    {isSelected ? (
                      <Check className="w-3.5 h-3.5 text-[#10B981]" strokeWidth={2} />
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-[#0F172A] transition-opacity">
                        Elegir →
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-3.5 py-3 text-xs text-slate-500 text-center">
              No encontramos coincidencias para &quot;{query}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
