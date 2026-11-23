"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Shield,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Bike,
  Sparkles,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Check,
  Radio,
  EyeOff,
  Star,
  Flame,
  Plus,
  Trash2,
  X,
  GraduationCap,
  Languages,
  Car,
  Plane,
  Home,
  Accessibility,
  HelpCircle,
  Mail,
  Phone,
  Building2,
  ShieldAlert,
  Calendar,
  Users,
  FileText,
} from "lucide-react";
import {
  SecurityRoleType,
  RequiredLanguageItem,
  ScreeningQuestionItem,
} from "@/types/database";
import {
  OFFICIAL_SECURITY_PROFILES,
  normalizeSecurityRole,
  formatSecurityRoleLabel,
  DbShiftTypeEnum,
  SHIFT_OPTIONS,
  normalizeShift,
  formatShiftLabel,
} from "@/lib/utils/shiftNormalizer";
import {
  COLOMBIA_DEPARTMENTS,
  COLOMBIA_DEPARTMENTS_CITIES,
  CONTRACT_TYPES,
  WORK_MODALITIES,
  EDUCATION_LEVELS,
  SECURITY_SKILLS_CATALOG,
  LANGUAGE_OPTIONS,
  LANGUAGE_LEVELS,
  DRIVER_LICENSE_CLASSES,
  EXPERIENCE_OPTIONS,
  findDepartmentByCity,
} from "@/lib/constants/colombiaSecurityCatalog";
import { createClient } from "@/lib/supabase/client";

// 4 PLANTILLAS RÁPIDAS DEL SECTOR SEGURIDAD CON PERFILES OFICIALES Y ENUMS CANÓNICOS
const QUICK_TEMPLATES = [
  {
    name: "Guarda de Seguridad (2x2x2)",
    icon: Shield,
    role: "Guarda de seguridad" as SecurityRoleType,
    title: "Guarda de Seguridad - Control de Accesos 2x2x2",
    titleComplement: "Turnos rotativos / Vinculación directa",
    shift: "2x2x2" as DbShiftTypeEnum,
    contractType: "Contrato a término fijo",
    workModality: "Presencial",
    salary: 1950000,
    requiresCourse: true,
    requiresMilitaryBooklet: true,
    requiresMotorcycle: false,
    requiresLicense: false,
    minExperienceKey: "1",
    minEducationLevel: "Bachillerato / Educación Media",
    skills: [
      "Control de accesos",
      "Curso SIMETRIC vigente",
      "Seguridad física",
      "Minuta digital",
      "Servicio al cliente",
    ],
    description:
      "Control estricto de accesos peatonales y vehiculares, registro de visitantes y contratistas, rondas perimétricas de verificación física, custodia de activos y reporte oportuno en minuta electrónica según protocolos de la Superintendencia de Vigilancia y Seguridad Privada.",
  },
  {
    name: "Escolta Motorizado",
    icon: Bike,
    role: "Escolta" as SecurityRoleType,
    title: "Escolta Motorizado - Protección de Personas y Mercancías",
    titleComplement: "Con moto propia y licencia vigente",
    shift: "12x12" as DbShiftTypeEnum,
    contractType: "Contrato a término indefinido",
    workModality: "Presencial",
    salary: 2850000,
    requiresCourse: true,
    requiresMilitaryBooklet: true,
    requiresMotorcycle: true,
    minMotorcycleCc: 200,
    requiresLicense: true,
    licenseClass: "A2",
    minExperienceKey: "2",
    minEducationLevel: "Bachillerato / Educación Media",
    skills: [
      "Escolta VIP",
      "Manejo de armas",
      "Conducción defensiva",
      "Curso SIMETRIC vigente",
      "Poligrafía",
    ],
    description:
      "Custodia y protección armada en desplazamientos urbanos e intermunicipales, evaluación preventiva de rutas críticas, técnicas de manejo defensivo y evasivo en motocicleta de alto cilindraje y reacción inmediata ante contingencias de seguridad.",
  },
  {
    name: "Operador CCTV / Medios",
    icon: Radio,
    role: "Operador de medios tecnológicos" as SecurityRoleType,
    title: "Operador de Medios Tecnológicos - Centro de Control CCTV",
    titleComplement: "Monitoreo 24/7 / Consola central",
    shift: "2x2x2" as DbShiftTypeEnum,
    contractType: "Contrato a término fijo",
    workModality: "Presencial",
    salary: 2200000,
    requiresCourse: true,
    requiresMilitaryBooklet: false,
    requiresMotorcycle: false,
    requiresLicense: false,
    minExperienceKey: "1",
    minEducationLevel: "Universidad / Carrera técnica",
    skills: [
      "CCTV y monitoreo",
      "Curso SIMETRIC vigente",
      "Minuta digital",
      "Ofimática / Excel",
      "Gestión de riesgos",
    ],
    description:
      "Monitoreo constante de cámaras de seguridad y circuito cerrado de televisión (CCTV), control perimétrico digital, recepción y despacho de alarmas, coordinación radial con cuadrantes y personal operativo, y elaboración de bitácoras de incidencias.",
  },
  {
    name: "Supervisor de Seguridad",
    icon: Briefcase,
    role: "Supervisor de seguridad" as SecurityRoleType,
    title: "Supervisor de Seguridad y Patrulla Operativa",
    titleComplement: "Coordinación de puestos de zona",
    shift: "4x2" as DbShiftTypeEnum,
    contractType: "Contrato a término indefinido",
    workModality: "Presencial",
    salary: 2600000,
    requiresCourse: true,
    requiresMilitaryBooklet: true,
    requiresMotorcycle: true,
    minMotorcycleCc: 150,
    requiresLicense: true,
    licenseClass: "A2",
    minExperienceKey: "3",
    minEducationLevel: "Universidad / Carrera tecnológica",
    skills: [
      "Supervisión operativa",
      "Curso SIMETRIC vigente",
      "Gestión de riesgos",
      "Normas BASC / ISO",
      "Conducción defensiva",
    ],
    description:
      "Supervisión táctica y disciplinaria de puestos asignados en la zona, revista de armamento y minutas de servicio, atención y relevo oportuno de contingencias, instrucción de consignas del cliente y control estricto de dotación reglamentaria.",
  },
];

// Regex de validación suave anti-fuga de datos en la descripción
const EMAIL_LEAK_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
const URL_LEAK_REGEX =
  /(?:https?:\/\/|www\.|[a-z0-9-]+\.(?:com|co|net|org|io|gov|edu|me|wa\.me)\b)/i;
const PHONE_LEAK_REGEX =
  /(?:\+?57[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}|\b3\d{2}[\s.-]?\d{3}[\s.-]?\d{4}\b|\b60[1-8][\s.-]?\d{7}\b)/;

function detectDataLeakInText(text: string): string[] {
  if (!text.trim()) return [];
  const findings: string[] = [];
  if (EMAIL_LEAK_REGEX.test(text)) findings.push("correo electrónico");
  if (PHONE_LEAK_REGEX.test(text)) findings.push("número telefónico o WhatsApp");
  if (URL_LEAK_REGEX.test(text)) findings.push("enlace o sitio web (URL)");
  return findings;
}

export default function NuevaVacantePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("Empresa de Seguridad");
  const [honeypot, setHoneypot] = useState("");
  const [activeTemplateName, setActiveTemplateName] = useState<string | null>(null);
  const [leakWarningAcknowledged, setLeakWarningAcknowledged] = useState(false);

  // =========================================================================
  // BLOQUE 1: VISIBILIDAD Y PRIVACIDAD DE LA OFERTA
  // =========================================================================
  const [isFeatured, setIsFeatured] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [isFlash, setIsFlash] = useState(false);
  const [hideCompanyName, setHideCompanyName] = useState(false);
  const [customCompanyAlias, setCustomCompanyAlias] = useState("");
  const [showContactEmail, setShowContactEmail] = useState(false);
  const [showContactPhone, setShowContactPhone] = useState(false);
  const [showContactAddress, setShowContactAddress] = useState(false);

  // =========================================================================
  // BLOQUE 2: DATOS DE LA OFERTA
  // =========================================================================
  const [roleRequired, setRoleRequired] =
    useState<SecurityRoleType>("Guarda de seguridad");
  const [title, setTitle] = useState("");
  const [titleComplement, setTitleComplement] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("Bogotá D.C.");
  const [city, setCity] = useState("Bogotá D.C.");
  const [postalCodeZone, setPostalCodeZone] = useState("");
  const [interviewAddress, setInterviewAddress] = useState("");
  const [shift, setShift] = useState<DbShiftTypeEnum>("2x2x2");
  const [workModality, setWorkModality] = useState<string>(WORK_MODALITIES[0]);
  const [contractType, setContractType] = useState<string>(CONTRACT_TYPES[0]);
  const [salaryInput, setSalaryInput] = useState("1950000");
  const [includesSurcharges, setIncludesSurcharges] = useState(true);
  const [vacanciesCount, setVacanciesCount] = useState(1);
  const [hireDate, setHireDate] = useState("");

  // =========================================================================
  // BLOQUE 3: REQUERIMIENTOS DEL CANDIDATO
  // =========================================================================
  const [experienceKey, setExperienceKey] = useState<string>("1");
  const [minEducationLevel, setMinEducationLevel] = useState<string>(
    "Bachillerato / Educación Media"
  );
  const [requiredSkills, setRequiredSkills] = useState<string[]>([
    "Control de accesos",
    "Curso SIMETRIC vigente",
  ]);
  const [customSkillInput, setCustomSkillInput] = useState("");
  const [requiredLanguages, setRequiredLanguages] = useState<
    RequiredLanguageItem[]
  >([]);
  const [newLangName, setNewLangName] = useState("Inglés");
  const [newLangLevel, setNewLangLevel] =
    useState<RequiredLanguageItem["level"]>("Intermedio");

  // Requisitos operativos SuperVigilancia (retrocompatibilidad)
  const [requiresCourse, setRequiresCourse] = useState(true);
  const [requiresMilitaryBooklet, setRequiresMilitaryBooklet] = useState(true);
  const [requiresMotorcycle, setRequiresMotorcycle] = useState(false);
  const [minMotorcycleCc, setMinMotorcycleCc] = useState(150);
  const [isStrictFilter] = useState(true);

  // Requisitos logísticos e inclusión
  const [requiresLicense, setRequiresLicense] = useState(false);
  const [licenseClassRequired, setLicenseClassRequired] = useState("A2");
  const [requiresTravelAvailability, setRequiresTravelAvailability] =
    useState(false);
  const [requiresRelocation, setRequiresRelocation] = useState(false);
  const [inclusiveDisability, setInclusiveDisability] = useState(false);

  // =========================================================================
  // BLOQUE 4: PREGUNTAS DE FILTRADO (MÁXIMO 5)
  // =========================================================================
  const [screeningQuestions, setScreeningQuestions] = useState<
    ScreeningQuestionItem[]
  >([]);

  const availableCities = useMemo(() => {
    return COLOMBIA_DEPARTMENTS_CITIES[department] || ["Bogotá D.C."];
  }, [department]);

  const salaryMonthly = useMemo(() => {
    const clean = salaryInput.replace(/\D/g, "");
    return clean ? parseInt(clean, 10) : 0;
  }, [salaryInput]);

  const dataLeakFindings = useMemo(
    () => detectDataLeakInText(description),
    [description]
  );

  // Reset acknowledgment if user edits description
  useEffect(() => {
    setLeakWarningAcknowledged(false);
  }, [description]);

  useEffect(() => {
    async function loadCompanyInfo() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: comp } = await supabase
          .from("companies")
          .select("company_name, city")
          .eq("owner_id", user.id)
          .maybeSingle();

        if (comp?.company_name) {
          setCompanyName(comp.company_name);
          if (comp.city) {
            const matchedDept = findDepartmentByCity(comp.city);
            setDepartment(matchedDept);
            const deptCities = COLOMBIA_DEPARTMENTS_CITIES[matchedDept] || [];
            const exactCity = deptCities.find(
              (c) => c.toLowerCase() === comp.city.toLowerCase()
            );
            setCity(exactCity || deptCities[0] || comp.city);
          }
          return;
        }

        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();

        if (prof?.full_name) {
          setCompanyName(prof.full_name);
        }
      } catch (err) {
        console.error("Error loading company info:", err);
      }
    }

    loadCompanyInfo();
  }, [supabase]);

  // Cambio en cascada Departamento -> Ciudad
  const handleDepartmentChange = (nextDept: string) => {
    setDepartment(nextDept);
    const nextCities = COLOMBIA_DEPARTMENTS_CITIES[nextDept] || [];
    setCity(nextCities[0] || "");
  };

  // Aplicar plantilla rápida en 1 clic
  const handleApplyTemplate = (tmpl: (typeof QUICK_TEMPLATES)[0]) => {
    setActiveTemplateName(tmpl.name);
    setRoleRequired(tmpl.role);
    setTitle(tmpl.title);
    setTitleComplement(tmpl.titleComplement);
    setShift(tmpl.shift);
    setContractType(tmpl.contractType);
    setWorkModality(tmpl.workModality);
    setSalaryInput(String(tmpl.salary));
    setRequiresCourse(tmpl.requiresCourse);
    setRequiresMilitaryBooklet(tmpl.requiresMilitaryBooklet);
    setRequiresMotorcycle(tmpl.requiresMotorcycle);
    if (tmpl.minMotorcycleCc) setMinMotorcycleCc(tmpl.minMotorcycleCc);
    setRequiresLicense(tmpl.requiresLicense);
    if (tmpl.licenseClass) setLicenseClassRequired(tmpl.licenseClass);
    setExperienceKey(tmpl.minExperienceKey);
    setMinEducationLevel(tmpl.minEducationLevel);
    setRequiredSkills(tmpl.skills);
    setDescription(tmpl.description);
  };

  // Manejo de destrezas
  const handleToggleSkill = (skill: string) => {
    setRequiredSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleAddCustomSkill = () => {
    const clean = customSkillInput.trim();
    if (!clean) return;
    const exists = requiredSkills.some(
      (s) => s.toLowerCase() === clean.toLowerCase()
    );
    if (!exists) {
      setRequiredSkills((prev) => [...prev, clean]);
    }
    setCustomSkillInput("");
  };

  // Manejo de idiomas
  const handleAddLanguage = () => {
    const cleanLang = newLangName.trim();
    if (!cleanLang) return;
    const exists = requiredLanguages.some(
      (l) => l.language.toLowerCase() === cleanLang.toLowerCase()
    );
    if (exists) {
      setRequiredLanguages((prev) =>
        prev.map((l) =>
          l.language.toLowerCase() === cleanLang.toLowerCase()
            ? { ...l, level: newLangLevel }
            : l
        )
      );
    } else {
      setRequiredLanguages((prev) => [
        ...prev,
        { language: cleanLang, level: newLangLevel },
      ]);
    }
  };

  const handleRemoveLanguage = (lang: string) => {
    setRequiredLanguages((prev) => prev.filter((l) => l.language !== lang));
  };

  // Manejo de preguntas de filtrado (máximo 5)
  const handleAddQuestion = (preset?: Partial<ScreeningQuestionItem>) => {
    if (screeningQuestions.length >= 5) return;
    const newId = `sq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setScreeningQuestions((prev) => [
      ...prev,
      {
        id: newId,
        question: preset?.question || "",
        type: preset?.type || "cerrada",
        ideal_answer:
          (preset?.type || "cerrada") === "cerrada"
            ? preset?.ideal_answer || "Sí"
            : undefined,
      },
    ]);
  };

  const handleUpdateQuestion = (
    id: string,
    patch: Partial<ScreeningQuestionItem>
  ) => {
    setScreeningQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        const nextType = patch.type ?? q.type;
        return {
          ...q,
          ...patch,
          ideal_answer:
            nextType === "cerrada"
              ? patch.ideal_answer ?? q.ideal_answer ?? "Sí"
              : undefined,
        };
      })
    );
  };

  const handleRemoveQuestion = (id: string) => {
    setScreeningQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleMoveQuestion = (index: number, direction: "up" | "down") => {
    setScreeningQuestions((prev) => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.splice(targetIndex, 0, moved);
      return copy;
    });
  };

  // Resolución numérica entera de años de experiencia para columna PostgreSQL
  const resolveExperienceYearsInt = (key: string): number => {
    if (key === "0" || key === "0.5") return 0;
    const parsed = parseInt(key, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return;

    // Validación suave anti-fuga de datos en la descripción
    if (dataLeakFindings.length > 0 && !leakWarningAcknowledged) {
      setErrorMessage(
        `Detectamos posible ${dataLeakFindings.join(", ")} en la descripción. Por seguridad, evita incluir datos de contacto directos en el texto. Corrígelo o confirma si deseas publicar de todas formas.`
      );
      setLeakWarningAcknowledged(true);
      return;
    }

    if (salaryMonthly <= 0) {
      setErrorMessage("Por favor ingresa un salario mensual válido en COP.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      let resolvedCompanyId: string | null = null;
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        let { data: comp } = await supabase
          .from("companies")
          .select("id")
          .eq("owner_id", user.id)
          .maybeSingle();

        if (!comp) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("full_name, phone_whatsapp")
            .eq("id", user.id)
            .maybeSingle();

          const compName =
            companyName.trim() ||
            user.user_metadata?.company_name ||
            prof?.full_name ||
            user.user_metadata?.full_name ||
            "Empresa de Seguridad";

          const { data: createdComp } = await supabase
            .from("companies")
            .insert({
              owner_id: user.id,
              company_name: compName,
              nit: user.user_metadata?.nit || `NIT-${user.id.slice(0, 8)}`,
              contact_person:
                prof?.full_name ||
                user.user_metadata?.full_name ||
                "Contacto Empresa",
              contact_phone:
                prof?.phone_whatsapp ||
                user.user_metadata?.phone ||
                "3000000000",
              city: city || "Bogotá D.C.",
              is_verified_company: false,
              plan_name: "basico",
              credits_security_studies: 0,
            })
            .select("id")
            .maybeSingle();

          if (createdComp) comp = createdComp;
        }

        if (comp) resolvedCompanyId = comp.id;
      }

      const normalizedRoleRequired = normalizeSecurityRole(roleRequired);
      const roleLabel = formatSecurityRoleLabel(normalizedRoleRequired);
      const normalizedShift = normalizeShift(shift);

      const cleanedScreeningQuestions: ScreeningQuestionItem[] =
        screeningQuestions
          .filter((q) => q.question.trim().length > 0)
          .slice(0, 5)
          .map((q) =>
            q.type === "cerrada"
              ? {
                  id: q.id,
                  question: q.question.trim(),
                  type: "cerrada",
                  ideal_answer: q.ideal_answer || "Sí",
                }
              : {
                  id: q.id,
                  question: q.question.trim(),
                  type: "abierta",
                }
          );

      const payload = {
        // Columnas originales retrocompatibles
        company_id: resolvedCompanyId,
        title: title.trim() || `${roleLabel} - ${city}`,
        role_required: normalizedRoleRequired,
        city,
        zone_neighborhood: postalCodeZone.trim() || "Zona Principal",
        shift: normalizedShift,
        salary_monthly: salaryMonthly,
        includes_surcharges: includesSurcharges,
        requires_active_course: requiresCourse,
        requires_motorcycle: requiresMotorcycle,
        min_motorcycle_cc: requiresMotorcycle ? minMotorcycleCc : null,
        requires_military_booklet: requiresMilitaryBooklet,
        min_experience_years: resolveExperienceYearsInt(experienceKey),
        is_strict_filter: isStrictFilter,
        is_urgent_relief: isUrgent,
        description:
          description.trim() ||
          "Control de accesos, rondas preventivas y cumplimiento de protocolos de seguridad.",
        interview_address: interviewAddress.trim() || null,
        is_active: true,

        // Columnas nuevas (Fase 1 Empresa Profesional Colombia)
        title_complement: titleComplement.trim() || null,
        department,
        postal_code_zone: postalCodeZone.trim() || null,
        work_modality: workModality,
        contract_type: contractType,
        vacancies_count: Math.max(1, Number(vacanciesCount) || 1),
        hire_date: hireDate || null,
        min_education_level: minEducationLevel,
        required_languages: requiredLanguages,
        required_skills: requiredSkills,
        requires_license: requiresLicense,
        license_class_required: requiresLicense
          ? licenseClassRequired.trim() || null
          : null,
        requires_travel_availability: requiresTravelAvailability,
        requires_relocation: requiresRelocation,
        inclusive_disability: inclusiveDisability,
        is_featured: isFeatured,
        is_urgent: isUrgent,
        is_flash: isFlash,
        hide_company_name: hideCompanyName,
        custom_company_alias: hideCompanyName
          ? customCompanyAlias.trim() ||
            "Importante empresa de seguridad privada"
          : null,
        show_contact_email: showContactEmail,
        show_contact_phone: showContactPhone,
        show_contact_address: showContactAddress,
        screening_questions: cleanedScreeningQuestions,
      };

      const { error: jobPostErr } = await supabase
        .from("job_posts")
        .insert(payload)
        .select("*")
        .maybeSingle();

      if (jobPostErr) {
        console.error("Error creating job_posts:", jobPostErr);
        setErrorMessage(
          `Error al publicar la vacante en la base de datos: ${
            jobPostErr.message || "No fue posible guardar la vacante."
          }`
        );
        return;
      }

      setSuccessToast(true);
      setTimeout(() => {
        router.push("/empresa/vacantes");
      }, 1200);
    } catch (err: any) {
      console.error("Error submitting vacancy:", err);
      setErrorMessage(
        err?.message || "Ocurrió un error inesperado al procesar la vacante."
      );
    } finally {
      setLoading(false);
    }
  };

  const previewCompanyLabel = hideCompanyName
    ? customCompanyAlias.trim() || "Importante empresa de seguridad privada"
    : companyName;

  const selectedExpLabel =
    EXPERIENCE_OPTIONS.find((e) => String(e.value) === experienceKey)?.label ||
    "1 año";

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header Estilo Computrabajo Empresas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Publicador Profesional de Vacantes
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#005DA4] bg-[#EAF3FA] px-2.5 py-0.5 rounded-full border border-[#D5E6F5]">
              <Sparkles className="w-3 h-3 text-[#005DA4]" />
              Seguridad Privada Colombia
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configura visibilidad, condiciones laborales, requerimientos del candidato y preguntas de filtrado en 4 pasos claros.
          </p>
        </div>

        <Link
          href="/empresa/vacantes"
          className="rounded-full bg-[#EAF3FA] hover:bg-[#D5E6F5] text-[#0B3B70] border border-[#D5E6F5] text-xs h-10 px-5 font-semibold inline-flex items-center gap-2 transition-colors shadow-2xs shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
          <span>Volver a Mis Vacantes</span>
        </Link>
      </div>

      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white text-xs font-semibold flex items-center gap-2.5 shadow-md">
          <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={2.5} />
          <span>
            ¡Vacante publicada con éxito! Redirigiendo a tu bandeja ATS...
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-600 hover:text-rose-800 text-xs font-bold px-2.5 py-1 rounded-md hover:bg-rose-100 transition-colors self-end sm:self-center shrink-0"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* PLANTILLAS RÁPIDAS DEL SECTOR SEGURIDAD (1 CLIC) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-bold text-xs">
              ⚡
            </span>
            <span className="text-sm font-bold text-slate-900 tracking-tight">
              Plantillas Rápidas del Sector Seguridad (Publicación en 30 Segundos)
            </span>
          </div>
          <span className="text-xs text-slate-500">
            Haz clic para pre-llenar cargo, salario, destrezas y requisitos:
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_TEMPLATES.map((tmpl) => {
            const Icon = tmpl.icon;
            const isSelected = activeTemplateName === tmpl.name;

            return (
              <button
                key={tmpl.name}
                type="button"
                onClick={() => handleApplyTemplate(tmpl)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#0B3B70] text-white border-[#0B3B70] shadow-xs"
                    : "bg-white border-slate-200 text-slate-700 hover:border-[#005DA4] hover:bg-[#EAF3FA]/30 shadow-2xs"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isSelected
                        ? "bg-white/10 text-[#FFE066]"
                        : "bg-[#EAF3FA] border border-[#D5E6F5] text-[#005DA4]"
                    }`}
                  >
                    <Icon className="w-4 h-4" strokeWidth={2} />
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-bold text-[#FFE066] uppercase tracking-wider">
                      Aplicada ✓
                    </span>
                  )}
                </div>

                <div className="font-bold text-xs leading-tight">
                  {tmpl.name}
                </div>
                <div
                  className={`text-[11px] font-mono tabular-nums mt-1 ${
                    isSelected ? "text-white/80" : "text-slate-500"
                  }`}
                >
                  ${(tmpl.salary / 1000000).toFixed(2)}M •{" "}
                  {tmpl.shift.split(" ")[0]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2-COLUMN WORKSPACE: FORM (8 cols) + LIVE CARD PREVIEW (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form onSubmit={handleSubmit} className="lg:col-span-8 space-y-6">
          {/* Anti-Spam Honeypot */}
          <div className="hidden" aria-hidden="true" tabIndex={-1}>
            <input
              type="text"
              name="fv_field_check"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {/* =============================================================== */}
          {/* BLOQUE 1 — VISIBILIDAD Y PRIVACIDAD DE LA OFERTA                */}
          {/* =============================================================== */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <span className="w-7 h-7 rounded-full bg-[#0B3B70] text-white text-xs font-bold flex items-center justify-center shrink-0">
                1
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Visibilidad y Privacidad de la Oferta
                </h2>
                <p className="text-[11px] text-slate-500">
                  Potencia el alcance de tu vacante y controla qué datos corporativos ven los postulantes.
                </p>
              </div>
            </div>

            {/* Tarjetas interactivas de visibilidad */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Oferta destacada */}
              <button
                type="button"
                onClick={() => setIsFeatured(!isFeatured)}
                className={`p-4 rounded-xl border text-left transition-all flex items-start justify-between gap-3 cursor-pointer ${
                  isFeatured
                    ? "bg-amber-50/70 border-amber-300 ring-1 ring-amber-200"
                    : "bg-slate-50/60 border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isFeatured
                        ? "bg-amber-500 text-white"
                        : "bg-white border border-slate-200 text-slate-500"
                    }`}
                  >
                    <Star className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Oferta destacada
                    </span>
                    <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
                      Resalta tu oferta en el listado para atraer más candidatos
                    </span>
                  </div>
                </div>
                <span
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center shrink-0 mt-0.5 ${
                    isFeatured
                      ? "bg-amber-500 justify-end"
                      : "bg-slate-300 justify-start"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </span>
              </button>

              {/* Oferta urgente */}
              <button
                type="button"
                onClick={() => setIsUrgent(!isUrgent)}
                className={`p-4 rounded-xl border text-left transition-all flex items-start justify-between gap-3 cursor-pointer ${
                  isUrgent
                    ? "bg-rose-50/70 border-rose-300 ring-1 ring-rose-200"
                    : "bg-slate-50/60 border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isUrgent
                        ? "bg-rose-600 text-white"
                        : "bg-white border border-slate-200 text-slate-500"
                    }`}
                  >
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Oferta urgente
                    </span>
                    <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
                      Prioriza candidatos con disponibilidad de incorporación inmediata
                    </span>
                  </div>
                </div>
                <span
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center shrink-0 mt-0.5 ${
                    isUrgent
                      ? "bg-rose-600 justify-end"
                      : "bg-slate-300 justify-start"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </span>
              </button>

              {/* Oferta flash */}
              <button
                type="button"
                onClick={() => setIsFlash(!isFlash)}
                className={`p-4 rounded-xl border text-left transition-all flex items-start justify-between gap-3 cursor-pointer ${
                  isFlash
                    ? "bg-[#EAF3FA] border-[#005DA4]/50 ring-1 ring-[#005DA4]/20"
                    : "bg-slate-50/60 border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isFlash
                        ? "bg-[#005DA4] text-white"
                        : "bg-white border border-slate-200 text-slate-500"
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Oferta flash
                    </span>
                    <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
                      Notifica de inmediato a candidatos potenciales del perfil
                    </span>
                  </div>
                </div>
                <span
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center shrink-0 mt-0.5 ${
                    isFlash
                      ? "bg-[#005DA4] justify-end"
                      : "bg-slate-300 justify-start"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </span>
              </button>

              {/* Ocultar nombre de la empresa */}
              <button
                type="button"
                onClick={() => setHideCompanyName(!hideCompanyName)}
                className={`p-4 rounded-xl border text-left transition-all flex items-start justify-between gap-3 cursor-pointer ${
                  hideCompanyName
                    ? "bg-slate-900 text-white border-slate-800"
                    : "bg-slate-50/60 border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      hideCompanyName
                        ? "bg-white/15 text-white"
                        : "bg-white border border-slate-200 text-slate-500"
                    }`}
                  >
                    <EyeOff className="w-4 h-4" />
                  </div>
                  <div>
                    <span
                      className={`text-xs font-bold block ${
                        hideCompanyName ? "text-white" : "text-slate-900"
                      }`}
                    >
                      Ocultar nombre de la empresa
                    </span>
                    <span
                      className={`text-[11px] leading-snug block mt-0.5 ${
                        hideCompanyName ? "text-slate-300" : "text-slate-500"
                      }`}
                    >
                      Publica de forma confidencial usando un alias personalizado
                    </span>
                  </div>
                </div>
                <span
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center shrink-0 mt-0.5 ${
                    hideCompanyName
                      ? "bg-emerald-500 justify-end"
                      : "bg-slate-300 justify-start"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </span>
              </button>
            </div>

            {hideCompanyName && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Alias público de la empresa (Opcional)
                </label>
                <input
                  type="text"
                  value={customCompanyAlias}
                  onChange={(e) => setCustomCompanyAlias(e.target.value)}
                  placeholder="Ej: Importante empresa de seguridad privada"
                  className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15"
                />
                <p className="text-[11px] text-slate-500">
                  Si lo dejas vacío, se mostrará &ldquo;Importante empresa de seguridad privada&rdquo;.
                </p>
              </div>
            )}

            {/* Checkboxes de contacto visible */}
            <div className="pt-2 border-t border-slate-100 space-y-2.5">
              <span className="text-xs font-semibold text-slate-700 block">
                Información de contacto visible en la oferta:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={showContactEmail}
                    onChange={(e) => setShowContactEmail(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#0B3B70] focus:ring-[#005DA4]"
                  />
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Mostrar e-mail de contacto</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={showContactPhone}
                    onChange={(e) => setShowContactPhone(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#0B3B70] focus:ring-[#005DA4]"
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Mostrar teléfono de contacto</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={showContactAddress}
                    onChange={(e) => setShowContactAddress(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#0B3B70] focus:ring-[#005DA4]"
                  />
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Mostrar dirección de contacto</span>
                </label>
              </div>
            </div>
          </section>

          {/* =============================================================== */}
          {/* BLOQUE 2 — DATOS DE LA OFERTA                                   */}
          {/* =============================================================== */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <span className="w-7 h-7 rounded-full bg-[#0B3B70] text-white text-xs font-bold flex items-center justify-center shrink-0">
                2
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Datos de la Oferta
                </h2>
                <p className="text-[11px] text-slate-500">
                  Define el cargo oficial, funciones, ubicación en Colombia y condiciones laborales.
                </p>
              </div>
            </div>

            {/* Cargo / Perfil Oficial (13 perfiles) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Cargo / Perfil Oficial * (13 Perfiles de Seguridad Privada)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {OFFICIAL_SECURITY_PROFILES.map((prof) => (
                  <button
                    key={prof.id}
                    type="button"
                    onClick={() => setRoleRequired(prof.label)}
                    className={`p-2.5 rounded-xl text-xs font-semibold border text-left transition-all cursor-pointer ${
                      normalizeSecurityRole(roleRequired) === prof.label
                        ? "bg-[#0B3B70] text-white border-[#0B3B70] shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:border-[#005DA4] hover:bg-[#EAF3FA]/30"
                    }`}
                  >
                    {prof.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Título y Complemento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Título de la oferta *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Guarda de Seguridad - Centro Empresarial"
                  className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Complemento al título{" "}
                  <span className="text-slate-400 font-normal">(Opcional)</span>
                </label>
                <input
                  type="text"
                  value={titleComplement}
                  onChange={(e) => setTitleComplement(e.target.value)}
                  placeholder="Ej: Turno nocturno / Sector Norte"
                  className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all"
                />
              </div>
            </div>

            {/* Descripción de tareas con alerta anti-fuga */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Descripción de tareas *
              </label>

              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/90 flex items-start gap-2.5 text-[11px] text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Atención:</strong> no incluyas teléfonos, correos electrónicos, direcciones exactas ni enlaces URL en la descripción.
                </span>
              </div>

              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalla las funciones del puesto, consignas de seguridad, protocolos y beneficios..."
                className={`w-full bg-white border rounded-xl p-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  dataLeakFindings.length > 0
                    ? "border-amber-400 focus:border-amber-500 focus:ring-amber-200"
                    : "border-slate-200 focus:border-[#005DA4] focus:ring-[#005DA4]/15"
                }`}
              />

              {dataLeakFindings.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">
                      Posible fuga de datos detectada ({dataLeakFindings.join(", ")}).
                    </span>{" "}
                    Te recomendamos retirar esta información de la descripción y gestionar el contacto desde el ATS para proteger tu proceso.
                  </div>
                </div>
              )}
            </div>

            {/* Ubicación en cascada (Colombia) */}
            <div className="pt-3 border-t border-slate-100 space-y-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <MapPin className="w-3.5 h-3.5 text-[#005DA4]" />
                <span>Ubicación del Puesto (Colombia)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Departamento *
                  </label>
                  <select
                    required
                    value={department}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 cursor-pointer"
                  >
                    {COLOMBIA_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Ciudad / Municipio *
                  </label>
                  <select
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 cursor-pointer"
                  >
                    {availableCities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Localidad / Barrio / C. Postal{" "}
                    <span className="text-slate-400 font-normal">(Opc.)</span>
                  </label>
                  <input
                    type="text"
                    value={postalCodeZone}
                    onChange={(e) => setPostalCodeZone(e.target.value)}
                    placeholder="Ej: Chapinero, Calle 100, 110221"
                    className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Dirección para Entrevista Presencial{" "}
                  <span className="text-slate-400 font-normal">
                    (Opcional — solo visible al citar al candidato)
                  </span>
                </label>
                <input
                  type="text"
                  value={interviewAddress}
                  onChange={(e) => setInterviewAddress(e.target.value)}
                  placeholder="Ej: Carrera 7 # 71-21 Torre A Oficina 502"
                  className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15"
                />
              </div>
            </div>

            {/* Condiciones Laborales */}
            <div className="pt-3 border-t border-slate-100 space-y-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Briefcase className="w-3.5 h-3.5 text-[#005DA4]" />
                <span>Condiciones Laborales</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Tipo de turno (SuperVigilancia) *
                  </label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(normalizeShift(e.target.value))}
                    className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 cursor-pointer"
                  >
                    {SHIFT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Lugar de trabajo *
                  </label>
                  <select
                    required
                    value={workModality}
                    onChange={(e) => setWorkModality(e.target.value)}
                    className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 cursor-pointer"
                  >
                    {WORK_MODALITIES.map((mod) => (
                      <option key={mod} value={mod}>
                        {mod}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Tipo de contrato *
                  </label>
                  <select
                    required
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value)}
                    className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 cursor-pointer"
                  >
                    {CONTRACT_TYPES.map((ct) => (
                      <option key={ct} value={ct}>
                        {ct}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Salario mensual (COP sin puntos ni comas) *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={salaryInput}
                    onChange={(e) =>
                      setSalaryInput(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="Ej: 1950000"
                    className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-sm font-bold text-slate-900 font-mono tabular-nums focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[11px] font-mono text-[#005DA4] font-semibold">
                      ${salaryMonthly.toLocaleString("es-CO")} COP / mes
                    </span>
                    <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includesSurcharges}
                        onChange={(e) =>
                          setIncludesSurcharges(e.target.checked)
                        }
                        className="w-3.5 h-3.5 rounded border-slate-300 text-[#0B3B70]"
                      />
                      <span>+ Recargos de ley</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Cantidad de vacantes *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    required
                    value={vacanciesCount}
                    onChange={(e) =>
                      setVacanciesCount(
                        Math.max(1, parseInt(e.target.value, 10) || 1)
                      )
                    }
                    className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-sm font-bold text-slate-900 font-mono tabular-nums focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Fecha estimada de contratación{" "}
                    <span className="text-slate-400 font-normal">(Opc.)</span>
                  </label>
                  <input
                    type="date"
                    value={hireDate}
                    onChange={(e) => setHireDate(e.target.value)}
                    className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* =============================================================== */}
          {/* BLOQUE 3 — REQUERIMIENTOS DEL CANDIDATO                         */}
          {/* =============================================================== */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <span className="w-7 h-7 rounded-full bg-[#0B3B70] text-white text-xs font-bold flex items-center justify-center shrink-0">
                3
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Requerimientos del Candidato
                </h2>
                <p className="text-[11px] text-slate-500">
                  Define experiencia, estudios mínimos, destrezas operativas, idiomas y logística.
                </p>
              </div>
            </div>

            {/* Experiencia y Estudios Mínimos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Años de experiencia *
                </label>
                <select
                  required
                  value={experienceKey}
                  onChange={(e) => setExperienceKey(e.target.value)}
                  className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 cursor-pointer"
                >
                  {EXPERIENCE_OPTIONS.map((opt) => (
                    <option key={String(opt.value)} value={String(opt.value)}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Estudios mínimos *
                </label>
                <select
                  required
                  value={minEducationLevel}
                  onChange={(e) => setMinEducationLevel(e.target.value)}
                  className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 cursor-pointer"
                >
                  {EDUCATION_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Destrezas y conocimientos */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Destrezas y conocimientos
                </label>
                <span className="text-[11px] font-semibold text-[#005DA4]">
                  {requiredSkills.length} seleccionada
                  {requiredSkills.length === 1 ? "" : "s"}
                </span>
              </div>

              {/* Píldoras del catálogo */}
              <div className="flex flex-wrap gap-2">
                {SECURITY_SKILLS_CATALOG.map((skill) => {
                  const selected = requiredSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleToggleSkill(skill)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                        selected
                          ? "bg-[#0B3B70] text-white border-[#0B3B70] shadow-2xs"
                          : "bg-white text-slate-700 border-slate-200 hover:border-[#005DA4] hover:bg-[#EAF3FA]/40"
                      }`}
                    >
                      {selected && <Check className="w-3 h-3" strokeWidth={3} />}
                      <span>{skill}</span>
                    </button>
                  );
                })}
              </div>

              {/* Destrezas personalizadas agregadas */}
              {requiredSkills.some(
                (s) => !SECURITY_SKILLS_CATALOG.includes(s)
              ) && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {requiredSkills
                    .filter((s) => !SECURITY_SKILLS_CATALOG.includes(s))
                    .map((customSkill) => (
                      <span
                        key={customSkill}
                        className="px-3 py-1 rounded-full text-xs font-semibold bg-[#EAF3FA] text-[#0B3B70] border border-[#D5E6F5] inline-flex items-center gap-1.5"
                      >
                        <span>{customSkill}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleSkill(customSkill)}
                          className="hover:text-rose-600 transition-colors"
                          title="Quitar destreza"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                </div>
              )}

              {/* Añadir destreza personalizada */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomSkill();
                    }
                  }}
                  placeholder="Añadir destreza personalizada (ej: Manejo de drones, SAP...)"
                  className="flex-1 h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSkill}
                  className="h-10 px-4 rounded-xl bg-[#EAF3FA] hover:bg-[#D5E6F5] text-[#0B3B70] border border-[#D5E6F5] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir</span>
                </button>
              </div>
            </div>

            {/* Idiomas (Opcional) */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Languages className="w-3.5 h-3.5 text-[#005DA4]" />
                <span>
                  Idiomas{" "}
                  <span className="text-slate-400 font-normal">(Opcional)</span>
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={newLangName}
                  onChange={(e) => setNewLangName(e.target.value)}
                  className="flex-1 h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#005DA4] cursor-pointer"
                >
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
                <select
                  value={newLangLevel}
                  onChange={(e) =>
                    setNewLangLevel(
                      e.target.value as RequiredLanguageItem["level"]
                    )
                  }
                  className="sm:w-44 h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#005DA4] cursor-pointer"
                >
                  {LANGUAGE_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      Nivel {lvl}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddLanguage}
                  className="h-10 px-4 rounded-xl bg-[#EAF3FA] hover:bg-[#D5E6F5] text-[#0B3B70] border border-[#D5E6F5] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar idioma</span>
                </button>
              </div>

              {requiredLanguages.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {requiredLanguages.map((item) => (
                    <span
                      key={item.language}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800"
                    >
                      <span>
                        {item.language} —{" "}
                        <span className="text-[#005DA4]">{item.level}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLanguage(item.language)}
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                        title="Eliminar idioma"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Acreditación SuperVigilancia (retrocompatible) */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-800 block">
                Acreditación Operativa (SuperVigilancia)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Curso Vigente
                    </span>
                    <span className="text-[11px] text-slate-500">
                      SuperVigilancia / SIMETRIC
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRequiresCourse(!requiresCourse)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center shrink-0 cursor-pointer ${
                      requiresCourse
                        ? "bg-[#005DA4] justify-end"
                        : "bg-slate-300 justify-start"
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Libreta Militar
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Primera o segunda clase
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setRequiresMilitaryBooklet(!requiresMilitaryBooklet)
                    }
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center shrink-0 cursor-pointer ${
                      requiresMilitaryBooklet
                        ? "bg-[#005DA4] justify-end"
                        : "bg-slate-300 justify-start"
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Moto Propia
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Patrullas o escoltas
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRequiresMotorcycle(!requiresMotorcycle)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center shrink-0 cursor-pointer ${
                      requiresMotorcycle
                        ? "bg-[#005DA4] justify-end"
                        : "bg-slate-300 justify-start"
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>
              </div>

              {requiresMotorcycle && (
                <div className="p-3.5 rounded-xl bg-[#EAF3FA]/60 border border-[#D5E6F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-[#0B3B70]">
                    Cilindraje mínimo requerido para la motocicleta (cc):
                  </span>
                  <select
                    value={minMotorcycleCc}
                    onChange={(e) =>
                      setMinMotorcycleCc(parseInt(e.target.value, 10) || 150)
                    }
                    className="sm:w-44 h-9 bg-white border border-[#D5E6F5] rounded-lg px-3 text-xs font-bold text-slate-900"
                  >
                    <option value={125}>Desde 125 cc</option>
                    <option value={150}>Desde 150 cc</option>
                    <option value={180}>Desde 180 cc</option>
                    <option value={200}>Desde 200 cc</option>
                    <option value={250}>Desde 250 cc</option>
                  </select>
                </div>
              )}
            </div>

            {/* Switches de requisitos logísticos e inclusión */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-800 block">
                Requisitos Logísticos e Inclusión
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Requiere licencia de conducción */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-[#005DA4] shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">
                          Requiere licencia de conducción
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Moto o vehículo (A2, B1, C1...)
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRequiresLicense(!requiresLicense)}
                      className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center shrink-0 cursor-pointer ${
                        requiresLicense
                          ? "bg-[#005DA4] justify-end"
                          : "bg-slate-300 justify-start"
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                    </button>
                  </div>

                  {requiresLicense && (
                    <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-600 shrink-0">
                        Categoría:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {DRIVER_LICENSE_CLASSES.map((cls) => (
                          <button
                            key={cls}
                            type="button"
                            onClick={() => setLicenseClassRequired(cls)}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-colors cursor-pointer ${
                              licenseClassRequired === cls
                                ? "bg-[#0B3B70] text-white border-[#0B3B70]"
                                : "bg-white text-slate-700 border-slate-200 hover:border-[#005DA4]"
                            }`}
                          >
                            {cls}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Disponibilidad para viajar */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Plane className="w-4 h-4 text-[#005DA4] shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Disponibilidad para viajar
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Desplazamientos intermunicipales
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setRequiresTravelAvailability(!requiresTravelAvailability)
                    }
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center shrink-0 cursor-pointer ${
                      requiresTravelAvailability
                        ? "bg-[#005DA4] justify-end"
                        : "bg-slate-300 justify-start"
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>

                {/* Disponibilidad para cambiar de residencia */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-[#005DA4] shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Cambio de residencia
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Disponibilidad de traslado
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRequiresRelocation(!requiresRelocation)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center shrink-0 cursor-pointer ${
                      requiresRelocation
                        ? "bg-[#005DA4] justify-end"
                        : "bg-slate-300 justify-start"
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>

                {/* Vacante apta para personas con discapacidad */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Accessibility className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Apta para personas con discapacidad
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Vacante con inclusión laboral
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInclusiveDisability(!inclusiveDisability)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center shrink-0 cursor-pointer ${
                      inclusiveDisability
                        ? "bg-emerald-600 justify-end"
                        : "bg-slate-300 justify-start"
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* =============================================================== */}
          {/* BLOQUE 4 — PREGUNTAS DE FILTRADO (MÁXIMO 5)                     */}
          {/* =============================================================== */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#0B3B70] text-white text-xs font-bold flex items-center justify-center shrink-0">
                  4
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Preguntas de Filtrado (Máximo 5)
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Filtra aspirantes automáticamente antes de revisar su hoja de vida.
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-[#0B3B70] bg-[#EAF3FA] border border-[#D5E6F5] px-3 py-1 rounded-full self-start sm:self-center">
                {screeningQuestions.length} / 5 preguntas
              </span>
            </div>

            {screeningQuestions.length === 0 ? (
              <div className="p-5 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 text-center space-y-2.5">
                <HelpCircle className="w-7 h-7 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-600 font-medium">
                  Aún no has agregado preguntas de filtrado para esta oferta.
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      handleAddQuestion({
                        question:
                          "¿Cuentas con curso de vigilancia SIMETRIC vigente?",
                        type: "cerrada",
                        ideal_answer: "Sí",
                      })
                    }
                    className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-[#005DA4] hover:text-[#005DA4] transition-colors cursor-pointer"
                  >
                    + ¿Curso SIMETRIC vigente?
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleAddQuestion({
                        question:
                          "¿Tienes disponibilidad inmediata para iniciar turnos rotativos?",
                        type: "cerrada",
                        ideal_answer: "Sí",
                      })
                    }
                    className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-[#005DA4] hover:text-[#005DA4] transition-colors cursor-pointer"
                  >
                    + ¿Disponibilidad inmediata?
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleAddQuestion({
                        question:
                          "¿En qué localidad o sector resides actualmente?",
                        type: "abierta",
                      })
                    }
                    className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-[#005DA4] hover:text-[#005DA4] transition-colors cursor-pointer"
                  >
                    + ¿Sector de residencia?
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {screeningQuestions.map((sq, idx) => (
                  <div
                    key={sq.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B3B70]">
                        Pregunta #{idx + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveQuestion(idx, "up")}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-[#0B3B70] disabled:opacity-35 cursor-pointer"
                          title="Subir pregunta"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === screeningQuestions.length - 1}
                          onClick={() => handleMoveQuestion(idx, "down")}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-[#0B3B70] disabled:opacity-35 cursor-pointer"
                          title="Bajar pregunta"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(sq.id)}
                          className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer ml-1"
                          title="Eliminar pregunta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={sq.question}
                      onChange={(e) =>
                        handleUpdateQuestion(sq.id, {
                          question: e.target.value,
                        })
                      }
                      placeholder="Escribe la pregunta que deberá responder el candidato..."
                      className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15"
                    />

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-slate-600">
                          Tipo:
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateQuestion(sq.id, { type: "cerrada" })
                          }
                          className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer ${
                            sq.type === "cerrada"
                              ? "bg-[#0B3B70] text-white border-[#0B3B70]"
                              : "bg-white text-slate-600 border-slate-200 hover:border-[#005DA4]"
                          }`}
                        >
                          Cerrada (Sí / No)
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateQuestion(sq.id, { type: "abierta" })
                          }
                          className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer ${
                            sq.type === "abierta"
                              ? "bg-[#0B3B70] text-white border-[#0B3B70]"
                              : "bg-white text-slate-600 border-slate-200 hover:border-[#005DA4]"
                          }`}
                        >
                          Abierta (texto corto)
                        </button>
                      </div>

                      {sq.type === "cerrada" && (
                        <div className="flex items-center gap-1.5 sm:ml-auto">
                          <span className="text-[11px] font-semibold text-slate-600">
                            Respuesta ideal:
                          </span>
                          {(["Sí", "No"] as const).map((ans) => (
                            <button
                              key={ans}
                              type="button"
                              onClick={() =>
                                handleUpdateQuestion(sq.id, {
                                  ideal_answer: ans,
                                })
                              }
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                                sq.ideal_answer === ans
                                  ? "bg-emerald-600 text-white border-emerald-600"
                                  : "bg-white text-slate-600 border-slate-200 hover:border-emerald-400"
                              }`}
                            >
                              {ans}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              disabled={screeningQuestions.length >= 5}
              onClick={() => handleAddQuestion()}
              className="w-full sm:w-auto rounded-full bg-[#EAF3FA] hover:bg-[#D5E6F5] text-[#0B3B70] border border-[#D5E6F5] text-xs font-semibold h-10 px-5 inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>
                {screeningQuestions.length >= 5
                  ? "Límite de 5 preguntas alcanzado"
                  : "Agregar pregunta de filtrado"}
              </span>
            </button>
          </section>

          {/* BOTÓN FINAL DE PUBLICACIÓN */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Al publicar, la vacante queda activa inmediatamente en el buscador nacional y en tu bandeja ATS.
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white text-xs font-semibold h-11 px-8 inline-flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed shrink-0 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Publicando Vacante...
                </span>
              ) : (
                <>
                  <Check className="w-4 h-4" strokeWidth={2.5} />
                  <span>
                    {dataLeakFindings.length > 0 && leakWarningAcknowledged
                      ? "Publicar Vacante de Todas Formas"
                      : "Publicar Vacante & Activar ATS"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* RIGHT COLUMN: LIVE CARD PREVIEW (4 cols) */}
        <div className="lg:col-span-4 sticky top-20 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Vista Previa en el Portal
              </span>
              <span className="text-[10px] font-bold text-[#005DA4] bg-[#EAF3FA] px-2.5 py-0.5 rounded-full border border-[#D5E6F5]">
                En vivo
              </span>
            </div>

            <div
              className={`bg-white rounded-2xl p-5 border-[1.5px] shadow-sm space-y-3 ${
                isFeatured
                  ? "border-amber-400 ring-2 ring-amber-100"
                  : "border-[#005DA4]"
              }`}
            >
              {/* Badges de visibilidad */}
              {(isFeatured || isUrgent || isFlash || inclusiveDisability) && (
                <div className="flex flex-wrap gap-1.5">
                  {isFeatured && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      <Star className="w-3 h-3" /> Destacada
                    </span>
                  )}
                  {isUrgent && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                      <Flame className="w-3 h-3" /> Urgente
                    </span>
                  )}
                  {isFlash && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#EAF3FA] text-[#005DA4] px-2 py-0.5 rounded-full">
                      <Zap className="w-3 h-3" /> Flash
                    </span>
                  )}
                  {inclusiveDisability && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                      <Accessibility className="w-3 h-3" /> Inclusiva
                    </span>
                  )}
                </div>
              )}

              <div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {title || "Título de la vacante"}
                </h3>
                {titleComplement.trim() && (
                  <p className="text-xs font-medium text-slate-500 mt-0.5">
                    {titleComplement}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                {hideCompanyName ? (
                  <EyeOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                ) : (
                  <CheckCircle2
                    className="w-3.5 h-3.5 text-[#005DA4] shrink-0"
                    strokeWidth={2.5}
                  />
                )}
                <span className="text-[#005DA4] font-semibold truncate">
                  {previewCompanyLabel}
                </span>
              </div>

              <div className="text-xs text-slate-600 flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  {city}
                  {department && department !== city ? `, ${department}` : ""}
                  {postalCodeZone ? ` • ${postalCodeZone}` : ""}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                  {workModality}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                  {formatShiftLabel(shift).split(" ")[0]}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#EAF3FA] text-[#0B3B70] font-semibold">
                  {contractType.replace("Contrato ", "")}
                </span>
              </div>

              <div className="pt-1 flex items-baseline justify-between">
                <span className="text-sm text-slate-900 font-bold font-mono tabular-nums">
                  ${salaryMonthly.toLocaleString("es-CO")} COP
                </span>
                <span className="text-[11px] text-slate-500 inline-flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {vacanciesCount}{" "}
                  {vacanciesCount === 1 ? "vacante" : "vacantes"}
                </span>
              </div>

              {/* Resumen de requisitos */}
              <div className="pt-2.5 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>Experiencia: {selectedExpLabel}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{minEducationLevel}</span>
                </div>
                {hireDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>Contratación est.: {hireDate}</span>
                  </div>
                )}
                {screeningQuestions.filter((q) => q.question.trim()).length >
                  0 && (
                  <div className="flex items-center gap-1.5 text-[#005DA4] font-semibold">
                    <FileText className="w-3 h-3 shrink-0" />
                    <span>
                      {
                        screeningQuestions.filter((q) => q.question.trim())
                          .length
                      }{" "}
                      pregunta(s) de filtrado
                    </span>
                  </div>
                )}
              </div>

              {requiredSkills.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {requiredSkills.slice(0, 4).map((s) => (
                    <span
                      key={s}
                      className="text-[10px] font-medium bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md"
                    >
                      {s}
                    </span>
                  ))}
                  {requiredSkills.length > 4 && (
                    <span className="text-[10px] font-semibold text-slate-500 px-1.5 py-0.5">
                      +{requiredSkills.length - 4} más
                    </span>
                  )}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Publicada hace un momento</span>
                <span className="border border-slate-300 rounded-full px-2.5 py-0.5 text-slate-600 font-semibold">
                  {formatSecurityRoleLabel(roleRequired)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
