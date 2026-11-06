"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  FileText,
  FileCheck,
  CreditCard,
  Plus,
  Trash2,
  Sparkles,
  Check,
  AlertCircle,
  ExternalLink,
  GraduationCap,
  Car,
  Briefcase,
  Award,
  X,
  ChevronDown,
} from "lucide-react";
import { CourseSemaphoreBanner } from "@/components/guarda/CourseSemaphoreBanner";
import { SecurityRoleType } from "@/types/database";
import {
  OFFICIAL_SECURITY_PROFILES,
  normalizeSecurityRole,
  formatSecurityRoleLabel,
} from "@/lib/utils/shiftNormalizer";
import { createClient } from "@/lib/supabase/client";
import { openSecureDocument } from "@/lib/utils/storageSecurity";

const EDUCATION_LEVEL_OPTIONS = [
  "Educación Básica primaria",
  "Educación Básica secundaria",
  "Bachillerato / Educación Media",
  "Universidad / Carrera técnica",
  "Universidad / Carrera tecnológica",
  "Universidad / Carrera profesional",
  "Postgrado / Especialización",
  "Postgrado / Maestría",
  "Postgrado / Doctorado",
] as const;

const VEHICLE_TYPE_OPTIONS = ["Motocicleta", "Automóvil", "Camioneta"] as const;

const MONTHS_ES = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

const DAYS_LIST = Array.from({ length: 31 }, (_, i) =>
  String(i + 1).padStart(2, "0")
);

const CURRENT_YEAR = new Date().getFullYear();
const YEARS_LIST = Array.from({ length: 65 }, (_, i) =>
  String(CURRENT_YEAR - i)
);

export interface CandidateWorkExperience {
  id: string;
  company: string;
  startDate: string;
  endDate: string | null;
  currentlyWorking: boolean;
  functions: string;
  role?: string;
}

function parseIsoParts(dateStr?: string | null): {
  year: string;
  month: string;
  day: string;
} {
  if (!dateStr) return { year: "", month: "", day: "" };
  const clean = dateStr.trim().split("T")[0];
  const parts = clean.split("-");
  if (parts.length === 3) {
    return {
      year: parts[0] || "",
      month: parts[1].padStart(2, "0") || "",
      day: parts[2].padStart(2, "0") || "",
    };
  }
  return { year: "", month: "", day: "" };
}

function formatHumanDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  const { year, month, day } = parseIsoParts(dateStr);
  if (!year || !month || !day) return dateStr;
  const monthObj = MONTHS_ES.find((m) => m.value === month);
  return `${parseInt(day, 10)} de ${monthObj ? monthObj.label : month} de ${year}`;
}

interface InteractiveDateBoxProps {
  label: string;
  value: string;
  onChange: (nextIsoDate: string) => void;
  disabled?: boolean;
  disabledText?: string;
  headerRight?: React.ReactNode;
}

function InteractiveDateBox({
  label,
  value,
  onChange,
  disabled = false,
  disabledText = "Actualmente activo",
  headerRight,
}: InteractiveDateBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const parsed = parseIsoParts(value);
  const [selDay, setSelDay] = useState<string>(parsed.day || "01");
  const [selMonth, setSelMonth] = useState<string>(parsed.month || "01");
  const [selYear, setSelYear] = useState<string>(
    parsed.year || String(CURRENT_YEAR - 1)
  );

  useEffect(() => {
    const p = parseIsoParts(value);
    if (p.day) setSelDay(p.day);
    if (p.month) setSelMonth(p.month);
    if (p.year) setSelYear(p.year);
  }, [value]);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleOutside);
    }
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isOpen]);

  const applySelection = (d: string, m: string, y: string) => {
    setSelDay(d);
    setSelMonth(m);
    setSelYear(y);
    onChange(`${y}-${m}-${d}`);
  };

  return (
    <div
      ref={containerRef}
      className={`relative rounded-xl border p-3.5 transition-all ${
        disabled
          ? "bg-slate-50 border-slate-200 opacity-85"
          : isOpen
          ? "bg-white border-[#005DA4] ring-2 ring-[#005DA4]/15 shadow-xs"
          : "bg-white border-slate-300 hover:border-[#005DA4] shadow-2xs"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        {headerRight}
      </div>

      {disabled ? (
        <div className="h-9 flex items-center gap-2 text-xs font-semibold text-[#005DA4]">
          <Calendar className="w-4 h-4 text-[#005DA4] shrink-0" />
          <span>{disabledText}</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full h-9 flex items-center justify-between gap-2 text-left cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#EAF3FA] border border-[#D5E6F5] flex items-center justify-center text-[#005DA4] shrink-0">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            {value ? (
              <span className="text-xs font-bold text-slate-900 truncate">
                {formatHumanDate(value)}
              </span>
            ) : (
              <span className="text-xs font-medium text-slate-400 truncate">
                Toca para elegir Día, Mes y Año
              </span>
            )}
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
              isOpen ? "rotate-180 text-[#005DA4]" : ""
            }`}
          />
        </button>
      )}

      {/* Popover / Calendario Interactivo con Día, Mes y Año independientes */}
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 sm:w-80 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-40 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-[#0B3B70]">
              Seleccionar Fecha ({label})
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Selector independiente de DÍA */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Día
              </label>
              <select
                value={selDay}
                onChange={(e) => applySelection(e.target.value, selMonth, selYear)}
                className="w-full h-9 bg-[#F2F5F8] border border-slate-300 rounded-lg px-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#005DA4]"
              >
                {DAYS_LIST.map((d) => (
                  <option key={d} value={d}>
                    {parseInt(d, 10)}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector independiente de MES */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Mes
              </label>
              <select
                value={selMonth}
                onChange={(e) => applySelection(selDay, e.target.value, selYear)}
                className="w-full h-9 bg-[#F2F5F8] border border-slate-300 rounded-lg px-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#005DA4]"
              >
                {MONTHS_ES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector independiente de AÑO */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Año
              </label>
              <select
                value={selYear}
                onChange={(e) => applySelection(selDay, selMonth, e.target.value)}
                className="w-full h-9 bg-[#F2F5F8] border border-slate-300 rounded-lg px-2 text-xs font-bold font-mono text-slate-900 focus:outline-none focus:border-[#005DA4]"
              >
                {YEARS_LIST.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cuadrícula rápida interactiva de días del mes */}
          <div>
            <span className="block text-[10px] font-semibold text-slate-400 mb-1">
              Selección rápida de día:
            </span>
            <div className="grid grid-cols-7 gap-1">
              {DAYS_LIST.map((d) => {
                const active = selDay === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => applySelection(d, selMonth, selYear)}
                    className={`h-7 rounded-md text-[11px] font-semibold transition-colors ${
                      active
                        ? "bg-[#0B3B70] text-white font-bold shadow-2xs"
                        : "bg-slate-50 text-slate-700 hover:bg-[#EAF3FA] hover:text-[#0B3B70]"
                    }`}
                  >
                    {parseInt(d, 10)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className="text-[11px] font-semibold text-slate-500 hover:text-rose-600"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={() => {
                applySelection(selDay, selMonth, selYear);
                setIsOpen(false);
              }}
              className="rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white text-xs font-semibold px-4 py-1.5 transition-colors"
            >
              Confirmar fecha
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DocumentosPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // =========================================================================
  // PASO 1: IDENTIFICACIÓN, ESPECIALIDADES (MÁX 5), EDUCACIÓN Y VEHÍCULO
  // =========================================================================
  const [fullName, setFullName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Bogotá D.C.");
  const [locality, setLocality] = useState("");

  // Especialidad Principal en Seguridad Privada (Hasta 5 opciones)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([
    "Guarda de seguridad",
  ]);
  const [roleLimitNotice, setRoleLimitNotice] = useState<string | null>(null);

  const [yearsExperience, setYearsExperience] = useState(0);
  const [hasMilitaryBooklet, setHasMilitaryBooklet] = useState(false);

  // Formación Académica
  const [educationLevel, setEducationLevel] = useState<string>(
    "Bachillerato / Educación Media"
  );
  const [educationTitle, setEducationTitle] = useState("");
  const [educationInstitution, setEducationInstitution] = useState("");
  const [educationCurrentlyStudying, setEducationCurrentlyStudying] =
    useState(false);
  const [educationStartDate, setEducationStartDate] = useState("");
  const [educationEndDate, setEducationEndDate] = useState("");

  // Vehículo propio (Reemplaza "Moto propia")
  const [hasOwnVehicle, setHasOwnVehicle] = useState(false);
  const [vehicleType, setVehicleType] = useState<string>("Motocicleta");
  const [driverLicenseClass, setDriverLicenseClass] = useState("");

  // =========================================================================
  // PASO 2: CURSO DE SEGURIDAD & CURSO SIMETRIC (SIN CREDENCIAL SV NI PREVIEW)
  // =========================================================================
  const [courseCompletionDate, setCourseCompletionDate] = useState("");
  const [courseAcademy, setCourseAcademy] = useState("");
  const [hasSimetricCourse, setHasSimetricCourse] = useState(false);
  const [simetricCourseNumber, setSimetricCourseNumber] = useState("");

  // =========================================================================
  // PASO 3: 4 SOPORTES DOCUMENTALES & EXPERIENCIA LABORAL MÚLTIPLE
  // =========================================================================
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cedulaFile, setCedulaFile] = useState<File | null>(null);
  const [libretaFile, setLibretaFile] = useState<File | null>(null);
  const [diplomasFile, setDiplomasFile] = useState<File | null>(null);

  const [documentCvUrl, setDocumentCvUrl] = useState<string | null>(null);
  const [documentCedulaUrl, setDocumentCedulaUrl] = useState<string | null>(
    null
  );
  const [documentLibretaUrl, setDocumentLibretaUrl] = useState<string | null>(
    null
  );
  const [documentDiplomasUrl, setDocumentDiplomasUrl] = useState<string | null>(
    null
  );

  // Experiencia Laboral Múltiple
  const [workExperiences, setWorkExperiences] = useState<
    CandidateWorkExperience[]
  >([]);
  const [expCompany, setExpCompany] = useState("");
  const [expStartDate, setExpStartDate] = useState("");
  const [expEndDate, setExpEndDate] = useState("");
  const [expCurrentlyWorking, setExpCurrentlyWorking] = useState(false);
  const [expFunctions, setExpFunctions] = useState("");

  // Regla condicional: Si selecciona Personal administrativo o Conserje, ocultar libreta militar
  const isExemptFromMilitaryBooklet =
    selectedRoles.includes("Personal administrativo") ||
    selectedRoles.includes("Conserje");

  // Regla condicional: Mostrar "Nombre del título que recibió" si escoge Universidad o Postgrado
  const requiresEducationTitle =
    educationLevel.startsWith("Universidad") ||
    educationLevel.startsWith("Postgrado");

  // Primera opción seleccionada como primary_role por retrocompatibilidad
  const primaryRole: SecurityRoleType =
    (selectedRoles[0] as SecurityRoleType) || "Guarda de seguridad";

  // Cargar información actual del candidato desde Supabase
  useEffect(() => {
    async function loadCandidateData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, phone_whatsapp")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.full_name) {
          setFullName(profile.full_name);
        } else if (user.user_metadata?.full_name) {
          setFullName(user.user_metadata.full_name);
        }

        if (profile?.phone_whatsapp) {
          setPhone(profile.phone_whatsapp);
        } else if (user.user_metadata?.phone_whatsapp) {
          setPhone(user.user_metadata.phone_whatsapp);
        }

        const { data: candProfile } = await supabase
          .from("candidate_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (candProfile) {
          const cp = candProfile as any;

          if (cp.national_id && !String(cp.national_id).startsWith("CC-")) {
            setNationalId(cp.national_id);
          }
          if (cp.city) setCity(cp.city);
          if (cp.locality_neighborhood) setLocality(cp.locality_neighborhood);

          // Cargar selected_roles o inicializar desde primary_role
          if (Array.isArray(cp.selected_roles) && cp.selected_roles.length > 0) {
            const normalizedList = cp.selected_roles
              .map((r: string) => normalizeSecurityRole(r))
              .filter(Boolean)
              .slice(0, 5);
            if (normalizedList.length > 0) {
              setSelectedRoles(Array.from(new Set(normalizedList)));
            }
          } else if (cp.primary_role) {
            setSelectedRoles([normalizeSecurityRole(cp.primary_role)]);
          }

          if (cp.years_experience !== undefined && cp.years_experience !== null) {
            setYearsExperience(Number(cp.years_experience) || 0);
          }
          if (cp.has_military_booklet !== undefined) {
            setHasMilitaryBooklet(Boolean(cp.has_military_booklet));
          }

          // Formación académica
          if (cp.education_level) setEducationLevel(cp.education_level);
          if (cp.education_title) setEducationTitle(cp.education_title);
          if (cp.education_institution) {
            setEducationInstitution(cp.education_institution);
          }
          if (cp.education_currently_studying !== undefined) {
            setEducationCurrentlyStudying(
              Boolean(cp.education_currently_studying)
            );
          }
          if (cp.education_start_date) {
            setEducationStartDate(cp.education_start_date);
          }
          if (cp.education_end_date) {
            setEducationEndDate(cp.education_end_date);
          }

          // Vehículo propio y licencia
          if (cp.has_own_vehicle !== undefined && cp.has_own_vehicle !== null) {
            setHasOwnVehicle(Boolean(cp.has_own_vehicle));
          } else if (cp.has_own_motorcycle || cp.has_motorcycle) {
            setHasOwnVehicle(true);
            setVehicleType("Motocicleta");
          }

          if (cp.vehicle_type) {
            setVehicleType(cp.vehicle_type);
          }
          if (cp.driver_license_class) {
            setDriverLicenseClass(cp.driver_license_class);
          } else if (cp.license_category) {
            setDriverLicenseClass(cp.license_category);
          }

          // Curso SIMETRIC
          if (cp.has_simetric_course !== undefined) {
            setHasSimetricCourse(Boolean(cp.has_simetric_course));
          }
          if (cp.simetric_course_number) {
            setSimetricCourseNumber(cp.simetric_course_number);
          }

          // Soportes documentales
          if (cp.document_cv_url || cp.resume_pdf_url) {
            setDocumentCvUrl(cp.document_cv_url || cp.resume_pdf_url);
          }
          if (cp.document_cedula_url) {
            setDocumentCedulaUrl(cp.document_cedula_url);
          }
          if (cp.document_libreta_url) {
            setDocumentLibretaUrl(cp.document_libreta_url);
          }
          if (cp.document_diplomas_url) {
            setDocumentDiplomasUrl(cp.document_diplomas_url);
          }

          // Experiencias laborales
          const rawExps = Array.isArray(cp.work_experiences)
            ? cp.work_experiences
            : Array.isArray(cp.work_experience_json)
            ? cp.work_experience_json
            : [];

          if (rawExps.length > 0) {
            setWorkExperiences(
              rawExps.map((item: any, idx: number) => ({
                id: item.id || `exp-${idx}-${Date.now()}`,
                company: item.company || "",
                startDate: item.startDate || item.start_date || "",
                endDate: item.endDate || item.end_date || null,
                currentlyWorking: Boolean(
                  item.currentlyWorking ?? item.current ?? false
                ),
                functions: String(
                  item.functions || item.description || item.role || ""
                ).slice(0, 500),
                role: item.role || item.functions || "",
              }))
            );
          }
        }

        // Cargar último curso en public.candidate_courses
        const { data: course } = await supabase
          .from("candidate_courses")
          .select("*")
          .eq("candidate_id", user.id)
          .order("completion_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (course) {
          if (course.completion_date) {
            setCourseCompletionDate(course.completion_date);
          }
          if (course.academy_name) {
            setCourseAcademy(course.academy_name);
          }
          const certUrl =
            course.certificate_file_url || (course as any).diploma_pdf_url;
          if (certUrl) {
            setDocumentDiplomasUrl((prev) => prev || certUrl);
          }
        }

        // Cargar documentos desde public.candidate_documents por retrocompatibilidad
        const { data: docs } = await supabase
          .from("candidate_documents")
          .select("*")
          .eq("candidate_id", user.id);

        if (docs && docs.length > 0) {
          docs.forEach((d: any) => {
            const docType = d.doc_type || d.document_type;
            if (docType === "hoja_de_vida_pdf" && d.file_url) {
              setDocumentCvUrl((prev) => prev || d.file_url);
            } else if (docType === "cedula_ciudadania" && d.file_url) {
              setDocumentCedulaUrl((prev) => prev || d.file_url);
            } else if (docType === "libreta_militar" && d.file_url) {
              setDocumentLibretaUrl((prev) => prev || d.file_url);
            } else if (docType === "diploma_curso" && d.file_url) {
              setDocumentDiplomasUrl((prev) => prev || d.file_url);
            }
          });
        }
      } catch (err) {
        console.error("Error cargando datos en /guarda/documentos:", err);
      }
    }

    loadCandidateData();
  }, [supabase]);

  // Alternar selección de especialidad (máximo 5 opciones simultáneas)
  const handleToggleRole = (roleLabel: string) => {
    setRoleLimitNotice(null);
    setSelectedRoles((prev) => {
      const exists = prev.includes(roleLabel);
      if (exists) {
        if (prev.length === 1) {
          setRoleLimitNotice(
            "Debes mantener al menos 1 especialidad seleccionada."
          );
          return prev;
        }
        return prev.filter((r) => r !== roleLabel);
      } else {
        if (prev.length >= 5) {
          setRoleLimitNotice(
            "Puedes seleccionar máximo 5 especialidades al mismo tiempo."
          );
          return prev;
        }
        return [...prev, roleLabel];
      }
    });
  };

  // Agregar experiencia laboral a la lista
  const handleAddExperience = () => {
    if (!expCompany.trim()) {
      setErrorMsg("Por favor ingresa el nombre de la Empresa.");
      return;
    }
    if (!expFunctions.trim()) {
      setErrorMsg("Por favor describe tu rol o funciones desempeñadas.");
      return;
    }

    setErrorMsg(null);
    const nextItem: CandidateWorkExperience = {
      id: `exp-${Date.now()}`,
      company: expCompany.trim(),
      startDate: expStartDate || "",
      endDate: expCurrentlyWorking ? null : expEndDate || null,
      currentlyWorking: expCurrentlyWorking,
      functions: expFunctions.trim().slice(0, 500),
      role: expFunctions.trim().slice(0, 120),
    };

    setWorkExperiences((prev) => [...prev, nextItem]);
    setExpCompany("");
    setExpStartDate("");
    setExpEndDate("");
    setExpCurrentlyWorking(false);
    setExpFunctions("");
  };

  const handleRemoveExperience = (id: string) => {
    setWorkExperiences((prev) => prev.filter((item) => item.id !== id));
  };

  // Guardar todo el expediente inteligente en Supabase
  const handleSaveAll = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        throw new Error(
          "No se detectó una sesión activa. Por favor inicia sesión nuevamente."
        );
      }
      const userId = authData.user.id;

      // 1. Asegurar fila base en public.profiles (sin sobrescribir role si ya existe)
      const { data: existingProf } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", userId)
        .maybeSingle();

      if (existingProf) {
        await supabase
          .from("profiles")
          .update({
            full_name: fullName.trim() || "Personal Operativo",
            phone_whatsapp: phone.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
      } else {
        await supabase.from("profiles").insert({
          id: userId,
          role: "candidate",
          full_name: fullName.trim() || "Personal Operativo",
          phone_whatsapp: phone.trim(),
          email: authData.user.email || "",
          updated_at: new Date().toISOString(),
        });
      }

      // 2. Subir archivos seleccionados a Supabase Storage (bucket 'documents')
      const uploadSupportFile = async (
        file: File,
        folder: "cvs" | "id_cards" | "military_booklets" | "diplomas"
      ): Promise<string> => {
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const filePath = `${folder}/${userId}/${Date.now()}_${cleanFileName}`;

        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, file, { upsert: true });

        if (uploadError) {
          throw new Error(
            `Error al subir ${file.name} al repositorio: ${uploadError.message}`
          );
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("documents").getPublicUrl(filePath);

        return publicUrl;
      };

      let finalCvUrl = documentCvUrl;
      let finalCedulaUrl = documentCedulaUrl;
      let finalLibretaUrl = isExemptFromMilitaryBooklet
        ? null
        : documentLibretaUrl;
      let finalDiplomasUrl = documentDiplomasUrl;

      if (cvFile) {
        finalCvUrl = await uploadSupportFile(cvFile, "cvs");
        setDocumentCvUrl(finalCvUrl);
      }
      if (cedulaFile) {
        finalCedulaUrl = await uploadSupportFile(cedulaFile, "id_cards");
        setDocumentCedulaUrl(finalCedulaUrl);
      }
      if (libretaFile && !isExemptFromMilitaryBooklet) {
        finalLibretaUrl = await uploadSupportFile(
          libretaFile,
          "military_booklets"
        );
        setDocumentLibretaUrl(finalLibretaUrl);
      }
      if (diplomasFile) {
        finalDiplomasUrl = await uploadSupportFile(diplomasFile, "diplomas");
        setDocumentDiplomasUrl(finalDiplomasUrl);
      }

      // Si el usuario escribió una experiencia en los campos pero no pulsó "+ Añadir experiencia", incluirla
      let finalExperiences = [...workExperiences];
      if (expCompany.trim() && expFunctions.trim()) {
        finalExperiences.push({
          id: `exp-${Date.now()}`,
          company: expCompany.trim(),
          startDate: expStartDate || "",
          endDate: expCurrentlyWorking ? null : expEndDate || null,
          currentlyWorking: expCurrentlyWorking,
          functions: expFunctions.trim().slice(0, 500),
          role: expFunctions.trim().slice(0, 120),
        });
        setWorkExperiences(finalExperiences);
        setExpCompany("");
        setExpStartDate("");
        setExpEndDate("");
        setExpCurrentlyWorking(false);
        setExpFunctions("");
      }

      const finalSelectedRoles =
        selectedRoles.length > 0
          ? selectedRoles.slice(0, 5)
          : ["Guarda de seguridad"];
      const firstSelectedRole = normalizeSecurityRole(finalSelectedRoles[0]);

      const isMoto = hasOwnVehicle && vehicleType === "Motocicleta";
      const finalMilitaryBooklet = isExemptFromMilitaryBooklet
        ? false
        : hasMilitaryBooklet;

      // 3. Construir payload de public.candidate_profiles con todas las nuevas columnas y retrocompatibilidad
      const baseCandidatePayload: Record<string, any> = {
        user_id: userId,
        national_id: nationalId.trim() || `CC-${userId.slice(0, 8)}`,
        city,
        locality_neighborhood: locality.trim() || null,
        selected_roles: finalSelectedRoles,
        primary_role: firstSelectedRole,
        years_experience: yearsExperience,
        has_military_booklet: finalMilitaryBooklet,
        education_level: educationLevel,
        education_title: requiresEducationTitle
          ? educationTitle.trim() || null
          : null,
        education_institution: educationInstitution.trim() || null,
        education_currently_studying: educationCurrentlyStudying,
        education_start_date: educationStartDate || null,
        education_end_date: educationCurrentlyStudying
          ? null
          : educationEndDate || null,
        has_own_vehicle: hasOwnVehicle,
        vehicle_type: hasOwnVehicle ? vehicleType : null,
        driver_license_class: hasOwnVehicle
          ? driverLicenseClass.trim() || null
          : null,
        has_own_motorcycle: isMoto,
        has_driving_license: hasOwnVehicle && Boolean(driverLicenseClass.trim()),
        license_category: hasOwnVehicle
          ? driverLicenseClass.trim() || null
          : null,
        has_simetric_course: hasSimetricCourse,
        simetric_course_number: hasSimetricCourse
          ? simetricCourseNumber.trim() || null
          : null,
        work_experiences: finalExperiences,
        work_experience_json: finalExperiences,
        document_cv_url: finalCvUrl,
        resume_pdf_url: finalCvUrl,
        document_cedula_url: finalCedulaUrl,
        document_libreta_url: finalLibretaUrl,
        document_diplomas_url: finalDiplomasUrl,
        available_immediately: true,
        updated_at: new Date().toISOString(),
      };

      // Intentar primero incluyendo también has_motorcycle: true si eligió Motocicleta
      const payloadWithHasMotorcycle = {
        ...baseCandidatePayload,
        ...(isMoto ? { has_motorcycle: true } : { has_motorcycle: false }),
      };

      let { error: upsertErr } = await supabase
        .from("candidate_profiles")
        .upsert(payloadWithHasMotorcycle as any, { onConflict: "user_id" });

      if (upsertErr) {
        // Reintentar con baseCandidatePayload (usando has_own_motorcycle estándar si has_motorcycle no es columna física)
        const retry = await supabase
          .from("candidate_profiles")
          .upsert(baseCandidatePayload as any, { onConflict: "user_id" });
        upsertErr = retry.error;
      }

      if (upsertErr) {
        throw new Error(
          `Error guardando expediente del candidato: ${upsertErr.message}`
        );
      }

      // 4. Registrar curso en public.candidate_courses si se diligenció fecha de curso
      if (courseCompletionDate) {
        const compDateObj = new Date(courseCompletionDate);
        compDateObj.setFullYear(compDateObj.getFullYear() + 1);
        const computedExpirationDate = compDateObj.toISOString().split("T")[0];

        await supabase.from("candidate_courses").insert({
          candidate_id: userId,
          course_name: `Reentrenamiento - ${formatSecurityRoleLabel(
            firstSelectedRole
          )}`,
          academy_name:
            courseAcademy.trim() || "Academia Autorizada SuperVigilancia",
          completion_date: courseCompletionDate,
          expiration_date: computedExpirationDate,
          nro_credencial_supervigilancia:
            hasSimetricCourse && simetricCourseNumber.trim()
              ? simetricCourseNumber.trim()
              : null,
          certificate_file_url: finalDiplomasUrl,
          is_verified_by_admin: false,
        });
      }

      // 5. Registrar soportes subidos en public.candidate_documents
      const docsToInsert: any[] = [];
      if (cvFile && finalCvUrl) {
        docsToInsert.push({
          candidate_id: userId,
          doc_type: "hoja_de_vida_pdf",
          file_url: finalCvUrl,
        });
      }
      if (cedulaFile && finalCedulaUrl) {
        docsToInsert.push({
          candidate_id: userId,
          doc_type: "cedula_ciudadania",
          file_url: finalCedulaUrl,
        });
      }
      if (libretaFile && finalLibretaUrl && !isExemptFromMilitaryBooklet) {
        docsToInsert.push({
          candidate_id: userId,
          doc_type: "libreta_militar",
          file_url: finalLibretaUrl,
        });
      }
      if (diplomasFile && finalDiplomasUrl) {
        docsToInsert.push({
          candidate_id: userId,
          doc_type: "diploma_curso",
          file_url: finalDiplomasUrl,
        });
      }

      if (docsToInsert.length > 0) {
        await supabase.from("candidate_documents").insert(docsToInsert);
      }

      setCvFile(null);
      setCedulaFile(null);
      setLibretaFile(null);
      setDiplomasFile(null);

      setSuccessMsg(
        "¡Hoja de Vida, Formación, Cursos y Soportes actualizados exitosamente!"
      );
      setTimeout(() => {
        router.push("/guarda/perfil");
      }, 1500);
    } catch (err: any) {
      console.error("Error al guardar en /guarda/documentos:", err);
      setErrorMsg(
        err.message ||
          "Ocurrió un error al guardar los documentos y el perfil."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera Principal */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Configuración de Hoja de Vida, Cursos y Soportes
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#005DA4] bg-[#EAF3FA] px-2.5 py-0.5 rounded-full border border-[#D5E6F5]">
              <Sparkles className="w-3 h-3 text-[#005DA4]" />
              Paso a Paso
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-normal">
            Actualiza tus especialidades (hasta 5 perfiles), formación académica, curso SIMETRIC y bóveda documental.
          </p>
        </div>

        {/* Pestañas interactivas de los 3 Pasos */}
        <div className="flex items-center gap-2 shrink-0">
          {[1, 2, 3].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStep(s as 1 | 2 | 3)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border tabular-nums transition-all cursor-pointer ${
                step === s
                  ? "bg-[#0B3B70] text-white border-[#0B3B70] shadow-xs"
                  : step > s
                  ? "bg-[#EAF3FA] text-[#005DA4] border-[#D5E6F5]"
                  : "bg-white text-slate-500 border-slate-200 hover:border-[#005DA4]"
              }`}
            >
              <span>{step > s ? "✓" : s}</span>
              <span className="hidden sm:inline">
                {s === 1
                  ? "1. Perfil & Educación"
                  : s === 2
                  ? "2. Cursos & SIMETRIC"
                  : "3. Soportes & Experiencia"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Contenedor Principal del Formulario (Ancho completo sin tarjeta de Vista Previa de Credencial Digital) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
        {/* ===================================================================
            PASO 1: IDENTIFICACIÓN, ESPECIALIDADES (MÁX 5), EDUCACIÓN Y VEHÍCULO
           =================================================================== */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Paso 1: Identificación, Especialidades y Formación Académica
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Selecciona hasta 5 perfiles oficiales de seguridad privada y registra tus estudios y movilidad.
              </p>
            </div>

            {/* Datos de Identificación y Ubicación */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre Completo (como en Cédula)
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej: Carlos Andrés Gómez"
                  className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3.5 text-sm text-slate-900 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cédula de Ciudadanía
                </label>
                <input
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="Ej: 1020304050"
                  className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3.5 text-sm text-slate-900 font-mono tabular-nums focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  WhatsApp de Contacto
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej: 3001234567"
                  className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3.5 text-sm text-slate-900 font-mono tabular-nums focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all shadow-2xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ciudad Sede
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3 text-sm text-slate-900 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all shadow-2xs"
                >
                  <option value="Bogotá D.C.">Bogotá D.C.</option>
                  <option value="Medellín">Medellín</option>
                  <option value="Cali">Cali</option>
                  <option value="Barranquilla">Barranquilla</option>
                  <option value="Bucaramanga">Bucaramanga</option>
                  <option value="Cartagena">Cartagena</option>
                  <option value="Pereira">Pereira</option>
                  <option value="Ibagué">Ibagué</option>
                  <option value="Cúcuta">Cúcuta</option>
                  <option value="Villavicencio">Villavicencio</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Barrio / Localidad
                </label>
                <input
                  type="text"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="Ej: Suba, Fontibón, Kennedy"
                  className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3.5 text-sm text-slate-900 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* 1. ESPECIALIDAD PRINCIPAL EN SEGURIDAD PRIVADA (MÁXIMO 5 OPCIONES ENTRE LOS 13 PERFILES OFICIALES) */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-900">
                    Especialidad Principal en Seguridad Privada (Selecciona hasta máximo 5 opciones):
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    La primera opción seleccionada (<strong className="text-[#0B3B70]">{selectedRoles[0] || "Guarda de seguridad"}</strong>) será tu cargo principal visible para las empresas.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B3B70] bg-[#EAF3FA] border border-[#D5E6F5] px-3 py-1 rounded-full shrink-0 self-start sm:self-auto">
                  <span>{selectedRoles.length} / 5 seleccionadas</span>
                </span>
              </div>

              {roleLimitNotice && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{roleLimitNotice}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {OFFICIAL_SECURITY_PROFILES.map((perfil) => {
                  const selectedIndex = selectedRoles.indexOf(perfil.label);
                  const isSelected = selectedIndex !== -1;
                  const isFirst = selectedIndex === 0;

                  return (
                    <button
                      key={perfil.id}
                      type="button"
                      onClick={() => handleToggleRole(perfil.label)}
                      className={`p-3 rounded-xl text-xs font-semibold border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? "bg-[#0B3B70] text-white border-[#0B3B70] shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:border-[#005DA4] hover:bg-[#EAF3FA]/40"
                      }`}
                    >
                      <span className="truncate">{perfil.label}</span>
                      {isSelected && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            isFirst
                              ? "bg-[#FFE066] text-[#0B3B70]"
                              : "bg-white/20 text-white"
                          }`}
                        >
                          {isFirst ? "1° Principal" : `${selectedIndex + 1}°`}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Años de Experiencia */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Años de Experiencia en el Sector:{" "}
                <strong className="text-[#0B3B70] font-bold font-mono tabular-nums">
                  {yearsExperience} años
                </strong>
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[0, 1, 2, 3, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setYearsExperience(val)}
                    className={`py-2.5 rounded-xl text-xs font-semibold border tabular-nums transition-all cursor-pointer ${
                      yearsExperience === val
                        ? "bg-[#0B3B70] text-white border-[#0B3B70] shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:border-[#005DA4]"
                    }`}
                  >
                    {val === 5 ? "5+ años" : `${val} a`}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. FORMACIÓN ACADÉMICA (9 OPCIONES + TÍTULO CONDICIONAL + INSTITUCIÓN + FECHAS DÍA/MES/AÑO) */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#EAF3FA] border border-[#D5E6F5] flex items-center justify-center text-[#005DA4]">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Formación Académica
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Nivel de escolaridad, institución educativa y periodo de estudio.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nivel de Formación Académica
                  </label>
                  <select
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3 text-sm text-slate-900 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all shadow-2xs"
                  >
                    {EDUCATION_LEVEL_OPTIONS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre de la institución
                  </label>
                  <input
                    type="text"
                    value={educationInstitution}
                    onChange={(e) => setEducationInstitution(e.target.value)}
                    placeholder="Ej: SENA / Universidad Militar / Colegio..."
                    className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3.5 text-sm text-slate-900 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Campo condicional si escoge Universidad o Postgrado */}
              {requiresEducationTitle && (
                <div className="animate-in fade-in duration-150">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre del título que recibió
                  </label>
                  <input
                    type="text"
                    value={educationTitle}
                    onChange={(e) => setEducationTitle(e.target.value)}
                    placeholder="Ej: Tecnólogo en Gestión de Seguridad / Administrador de Empresas"
                    className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3.5 text-sm text-slate-900 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all shadow-2xs"
                  />
                </div>
              )}

              {/* Switch Cursando actualmente */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-[#F2F5F8] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Cursando actualmente
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Activa esta opción si aún te encuentras estudiando este nivel académico
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEducationCurrentlyStudying(!educationCurrentlyStudying)
                  }
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors flex items-center cursor-pointer ${
                    educationCurrentlyStudying
                      ? "bg-[#005DA4] justify-end"
                      : "bg-slate-300 justify-start"
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                </button>
              </div>

              {/* 2 Cuadritos interactivos: Fecha de inicio y Fecha de fin (Día, Mes y Año independientes) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InteractiveDateBox
                  label="Fecha de inicio"
                  value={educationStartDate}
                  onChange={setEducationStartDate}
                />

                {!educationCurrentlyStudying ? (
                  <InteractiveDateBox
                    label="Fecha de fin"
                    value={educationEndDate}
                    onChange={setEducationEndDate}
                  />
                ) : (
                  <InteractiveDateBox
                    label="Fecha de fin"
                    value=""
                    onChange={setEducationEndDate}
                    disabled
                    disabledText="Cursando actualmente"
                  />
                )}
              </div>
            </div>

            {/* 3. LIBRETA MILITAR (CONDICIONAL) Y VEHÍCULO PROPIO (REEMPLAZO DE MOTO PROPIA) */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div
                className={`grid grid-cols-1 ${
                  !isExemptFromMilitaryBooklet ? "sm:grid-cols-2" : ""
                } gap-4`}
              >
                {/* Pregunta de Libreta Militar: Se oculta si selecciona Personal administrativo o Conserje */}
                {!isExemptFromMilitaryBooklet && (
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Libreta Militar
                      </span>
                      <span className="text-[11px] text-slate-500">
                        ¿Cuenta con libreta militar de 1ra o 2da clase?
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHasMilitaryBooklet(!hasMilitaryBooklet)}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors flex items-center cursor-pointer shrink-0 ${
                        hasMilitaryBooklet
                          ? "bg-[#005DA4] justify-end"
                          : "bg-slate-300 justify-start"
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                    </button>
                  </div>
                )}

                {/* Switch Vehículo propio */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#EAF3FA] border border-[#D5E6F5] flex items-center justify-center text-[#005DA4]">
                      <Car className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Vehículo propio
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {hasOwnVehicle ? vehicleType : "Sin vehículo propio"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHasOwnVehicle(!hasOwnVehicle)}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors flex items-center cursor-pointer shrink-0 ${
                      hasOwnVehicle
                        ? "bg-[#005DA4] justify-end"
                        : "bg-slate-300 justify-start"
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                  </button>
                </div>
              </div>

              {/* Opciones desplegadas cuando Vehículo propio está activo */}
              {hasOwnVehicle && (
                <div className="p-4 rounded-xl border border-[#D5E6F5] bg-[#EAF3FA]/40 space-y-4 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-xs font-bold text-[#0B3B70] mb-2">
                      Tipo de vehículo propio:
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {VEHICLE_TYPE_OPTIONS.map((vType) => {
                        const isSel = vehicleType === vType;
                        return (
                          <button
                            key={vType}
                            type="button"
                            onClick={() => setVehicleType(vType)}
                            className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                              isSel
                                ? "bg-[#0B3B70] text-white border-[#0B3B70] shadow-xs"
                                : "bg-white text-slate-700 border-slate-200 hover:border-[#005DA4]"
                            }`}
                          >
                            {vType}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Clase de licencia de conducción
                    </label>
                    <input
                      type="text"
                      value={driverLicenseClass}
                      onChange={(e) => setDriverLicenseClass(e.target.value)}
                      placeholder="Ej: A2, B1, C1, A2 y B1..."
                      className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3.5 text-sm text-slate-900 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all shadow-2xs"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white text-xs font-semibold h-11 px-6 w-full flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <span>Continuar al Paso 2: Cursos & SIMETRIC</span>
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================
            PASO 2: VALIDACIÓN DE CURSO DE SEGURIDAD & CURSO SIMETRIC
            (SIN VISTA PREVIA DE CREDENCIAL DIGITAL NI NÚMERO DE CREDENCIAL SV)
           =================================================================== */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Paso 2: Validación del Curso de Seguridad y Registro SIMETRIC
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Comprobación de vigencia legal de tu capacitación y certificación SIMETRIC.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fecha de Realización del Último Curso
                  </label>
                  <input
                    type="date"
                    value={courseCompletionDate}
                    onChange={(e) => setCourseCompletionDate(e.target.value)}
                    className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3.5 text-sm text-slate-900 tabular-nums focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Academia de Seguridad Emisora
                  </label>
                  <input
                    type="text"
                    value={courseAcademy}
                    onChange={(e) => setCourseAcademy(e.target.value)}
                    placeholder="Ej: Academia Nacional de Seguridad / Escovigil"
                    className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3.5 text-sm text-slate-900 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Semáforo de Vigencia en Vivo */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Diagnóstico de Vigencia en Vivo:
                </label>
                <CourseSemaphoreBanner
                  completionDate={courseCompletionDate}
                  candidateName={fullName}
                  city={city}
                  courseName={`Curso de ${formatSecurityRoleLabel(primaryRole)}`}
                />
              </div>

              {/* Switch ¿Cuenta con curso SIMETRIC? */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="p-4 rounded-xl border border-slate-200 bg-[#F2F5F8] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#0B3B70] text-white flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4 text-[#FFE066]" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        ¿Cuenta con curso SIMETRIC?
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Activa esta opción si posees registro de curso en plataforma SIMETRIC
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHasSimetricCourse(!hasSimetricCourse)}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors flex items-center cursor-pointer shrink-0 ${
                      hasSimetricCourse
                        ? "bg-[#005DA4] justify-end"
                        : "bg-slate-300 justify-start"
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                  </button>
                </div>

                {hasSimetricCourse && (
                  <div className="p-4 rounded-xl border border-[#D5E6F5] bg-[#EAF3FA]/40 animate-in fade-in duration-150">
                    <label className="block text-xs font-bold text-[#0B3B70] mb-1">
                      Número de registro del curso
                    </label>
                    <input
                      type="text"
                      value={simetricCourseNumber}
                      onChange={(e) => setSimetricCourseNumber(e.target.value)}
                      placeholder="Ingresa el número de registro SIMETRIC"
                      className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3.5 text-sm text-slate-900 font-mono tabular-nums focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all shadow-2xs"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-full bg-[#EAF3FA] hover:bg-[#D5E6F5] text-[#0B3B70] border border-[#D5E6F5] text-xs h-11 px-6 font-semibold w-1/3 flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={2} />
                <span>Atrás</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white text-xs font-semibold h-11 px-6 w-2/3 flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <span>Continuar al Paso 3: Soportes & Experiencia</span>
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================
            PASO 3: 4 SOPORTES DOCUMENTALES & EXPERIENCIA LABORAL MÚLTIPLE
           =================================================================== */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Paso 3: Soportes Documentales y Experiencia Laboral
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Adjunta tus soportes obligatorios y registra tu historial laboral detallado.
              </p>
            </div>

            {/* SECCIÓN A: 4 SOPORTES (HOJA DE VIDA, CÉDULA, LIBRETA MILITAR CONDICIONAL, DIPLOMAS) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Soportes Documentales Requeridos
              </h4>

              <div
                className={`grid grid-cols-1 sm:grid-cols-2 ${
                  !isExemptFromMilitaryBooklet
                    ? "lg:grid-cols-4"
                    : "lg:grid-cols-3"
                } gap-3.5`}
              >
                {/* Soporte 1: Hoja de Vida */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-[#F2F5F8] flex flex-col justify-between space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#0B3B70]">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        cvFile || documentCvUrl
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {cvFile ? "Listo" : documentCvUrl ? "Cargado" : "Pendiente"}
                    </span>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-slate-900">
                      Hoja de Vida
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Archivo PDF o Word actualizado
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-white hover:bg-[#EAF3FA] text-[#0B3B70] border border-slate-300 text-xs font-semibold cursor-pointer h-9 px-3 transition-colors shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-[#005DA4]" />
                      <span className="truncate">
                        {cvFile ? cvFile.name : "Adjuntar Hoja de Vida"}
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) setCvFile(e.target.files[0]);
                        }}
                      />
                    </label>
                    {documentCvUrl && !cvFile && (
                      <button
                        type="button"
                        onClick={() => openSecureDocument(documentCvUrl)}
                        className="text-[11px] font-semibold text-[#005DA4] hover:underline inline-flex items-center gap-1"
                      >
                        <span>Ver archivo actual</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Soporte 2: Cédula */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-[#F2F5F8] flex flex-col justify-between space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#0B3B70]">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        cedulaFile || documentCedulaUrl
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {cedulaFile
                        ? "Listo"
                        : documentCedulaUrl
                        ? "Cargado"
                        : "Pendiente"}
                    </span>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Cédula</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Documento de identidad por ambos lados
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-white hover:bg-[#EAF3FA] text-[#0B3B70] border border-slate-300 text-xs font-semibold cursor-pointer h-9 px-3 transition-colors shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-[#005DA4]" />
                      <span className="truncate">
                        {cedulaFile ? cedulaFile.name : "Adjuntar Cédula"}
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            setCedulaFile(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                    {documentCedulaUrl && !cedulaFile && (
                      <button
                        type="button"
                        onClick={() => openSecureDocument(documentCedulaUrl)}
                        className="text-[11px] font-semibold text-[#005DA4] hover:underline inline-flex items-center gap-1"
                      >
                        <span>Ver archivo actual</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Soporte 3: Libreta Militar (Oculta si es Personal administrativo o Conserje) */}
                {!isExemptFromMilitaryBooklet && (
                  <div className="p-4 rounded-2xl border border-slate-200 bg-[#F2F5F8] flex flex-col justify-between space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#0B3B70]">
                        <Shield className="w-4 h-4" />
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          libretaFile || documentLibretaUrl
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {libretaFile
                          ? "Listo"
                          : documentLibretaUrl
                          ? "Cargado"
                          : "Pendiente"}
                      </span>
                    </div>

                    <div>
                      <h5 className="text-xs font-bold text-slate-900">
                        Libreta Militar
                      </h5>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Soporte de situación militar definida
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-white hover:bg-[#EAF3FA] text-[#0B3B70] border border-slate-300 text-xs font-semibold cursor-pointer h-9 px-3 transition-colors shadow-2xs">
                        <Upload className="w-3.5 h-3.5 text-[#005DA4]" />
                        <span className="truncate">
                          {libretaFile
                            ? libretaFile.name
                            : "Adjuntar Libreta Militar"}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setLibretaFile(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                      {documentLibretaUrl && !libretaFile && (
                        <button
                          type="button"
                          onClick={() => openSecureDocument(documentLibretaUrl)}
                          className="text-[11px] font-semibold text-[#005DA4] hover:underline inline-flex items-center gap-1"
                        >
                          <span>Ver archivo actual</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Soporte 4: Diplomas */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-[#F2F5F8] flex flex-col justify-between space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-700">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        diplomasFile || documentDiplomasUrl
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {diplomasFile
                        ? "Listo"
                        : documentDiplomasUrl
                        ? "Cargado"
                        : "Pendiente"}
                    </span>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-slate-900">
                      Diplomas
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Certificados de cursos y estudios
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-white hover:bg-[#EAF3FA] text-[#0B3B70] border border-slate-300 text-xs font-semibold cursor-pointer h-9 px-3 transition-colors shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-[#005DA4]" />
                      <span className="truncate">
                        {diplomasFile ? diplomasFile.name : "Adjuntar Diplomas"}
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            setDiplomasFile(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                    {documentDiplomasUrl && !diplomasFile && (
                      <button
                        type="button"
                        onClick={() => openSecureDocument(documentDiplomasUrl)}
                        className="text-[11px] font-semibold text-[#005DA4] hover:underline inline-flex items-center gap-1"
                      >
                        <span>Ver archivo actual</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN B: EXPERIENCIA LABORAL MÚLTIPLE */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#EAF3FA] border border-[#D5E6F5] flex items-center justify-center text-[#005DA4]">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Experiencia Laboral
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Puedes registrar varias experiencias laborales con fechas exactas y funciones.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#0B3B70] bg-[#EAF3FA] border border-[#D5E6F5] px-3 py-1 rounded-full">
                  {workExperiences.length} registrada(s)
                </span>
              </div>

              {/* Lista de experiencias añadidas */}
              {workExperiences.length > 0 && (
                <div className="space-y-2.5">
                  {workExperiences.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-4 rounded-xl border border-slate-200 bg-[#F2F5F8] flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-xs font-bold text-slate-900">
                            {exp.company}
                          </strong>
                          <span className="text-[11px] font-semibold text-[#005DA4] bg-[#EAF3FA] border border-[#D5E6F5] px-2 py-0.5 rounded-full">
                            {exp.startDate
                              ? formatHumanDate(exp.startDate)
                              : "Inicio no especificado"}{" "}
                            —{" "}
                            {exp.currentlyWorking
                              ? "Trabajando actualmente"
                              : exp.endDate
                              ? formatHumanDate(exp.endDate)
                              : "Finalizado"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed break-words">
                          {exp.functions}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveExperience(exp.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                        title="Eliminar experiencia"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulario para añadir una experiencia laboral */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-2xs">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Empresa
                  </label>
                  <input
                    type="text"
                    placeholder="Empresa"
                    value={expCompany}
                    onChange={(e) => setExpCompany(e.target.value)}
                    className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3.5 text-sm text-slate-900 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all shadow-2xs"
                  />
                </div>

                {/* 2 Cuadritos interactivos de Fecha de inicio y Fecha de fin (con switch "Trabajando actualmente en esta empresa") */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InteractiveDateBox
                    label="Fecha de inicio"
                    value={expStartDate}
                    onChange={setExpStartDate}
                  />

                  <InteractiveDateBox
                    label="Fecha de fin"
                    value={expEndDate}
                    onChange={setExpEndDate}
                    disabled={expCurrentlyWorking}
                    disabledText="Trabajando actualmente en esta empresa"
                    headerRight={
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-slate-600">
                          Trabajando actualmente en esta empresa
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setExpCurrentlyWorking(!expCurrentlyWorking)
                          }
                          className={`w-9 h-5 rounded-full p-0.5 transition-colors flex items-center cursor-pointer ${
                            expCurrentlyWorking
                              ? "bg-[#005DA4] justify-end"
                              : "bg-slate-300 justify-start"
                          }`}
                        >
                          <div className="w-4 h-4 rounded-full bg-white shadow-2xs" />
                        </button>
                      </div>
                    }
                  />
                </div>

                {/* Cuadro de texto para el rol o funciones (máximo 500 caracteres) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Rol o funciones desempeñadas
                    </label>
                    <span
                      className={`text-[11px] font-mono tabular-nums ${
                        expFunctions.length >= 500
                          ? "text-rose-600 font-bold"
                          : "text-slate-400"
                      }`}
                    >
                      {expFunctions.length} / 500 caracteres
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={expFunctions}
                    onChange={(e) =>
                      setExpFunctions(e.target.value.slice(0, 500))
                    }
                    placeholder="Describe tu cargo, responsabilidades, control de accesos, monitoreo o funciones principales (máximo 500 caracteres)..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-3.5 text-xs text-slate-900 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all shadow-2xs resize-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddExperience}
                    className="rounded-full bg-[#EAF3FA] hover:bg-[#D5E6F5] text-[#0B3B70] border border-[#D5E6F5] text-xs font-bold h-10 px-5 inline-flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-[#005DA4]" strokeWidth={2.5} />
                    <span>Añadir experiencia laboral</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Avisos de Error o Éxito */}
            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle
                  className="w-4 h-4 text-rose-600 shrink-0 mt-0.5"
                  strokeWidth={2}
                />
                <div className="space-y-1">
                  <strong className="block font-bold">
                    No fue posible completar el guardado:
                  </strong>
                  <p className="leading-relaxed">{errorMsg}</p>
                </div>
              </div>
            )}

            {successMsg && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold">{successMsg}</span>
              </div>
            )}

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-full bg-[#EAF3FA] hover:bg-[#D5E6F5] text-[#0B3B70] border border-[#D5E6F5] text-xs h-11 px-6 font-semibold w-1/3 flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={2} />
                <span>Atrás</span>
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleSaveAll}
                className="rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white text-xs font-semibold h-11 px-6 w-2/3 flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando expediente y soportes...
                  </span>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" strokeWidth={2.5} />
                    <span>Guardar Hoja de Vida y Soportes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* BANNER DE ACCESO A ACADEMIAS ALIADAS */}
      <div className="bg-gradient-to-r from-[#0B3B70] to-[#005DA4] rounded-2xl p-6 text-white shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/20">
            <GraduationCap className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">
              Directorio de Academias Aliadas Autorizadas SuperVigilancia
            </h4>
            <p className="text-xs text-blue-100 mt-0.5 max-w-xl leading-relaxed">
              Consulta nuestra red nacional de escuelas autorizadas para cursos de Vigilancia, Escolta y CCTV con convenios de descuento del 15% y contacto directo por WhatsApp.
            </p>
          </div>
        </div>
        <Link
          href="/guarda/academias"
          className="rounded-full bg-white text-[#0B3B70] hover:bg-blue-50 px-5 py-2.5 text-xs font-bold shrink-0 transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <span>Ver Academias Aliadas</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
