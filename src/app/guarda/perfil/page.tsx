"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  User,
  Shield,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  FileText,
  FileCheck,
  CreditCard,
  Pencil,
  Plus,
  Check,
  CheckCircle2,
  AlertCircle,
  Award,
  Upload,
  ExternalLink,
  Lightbulb,
  Camera,
  ChevronRight,
  X,
  Bike,
  Sparkles,
  Info,
} from "lucide-react";
import { SecurityRoleType } from "@/types/database";
import {
  SECURITY_ROLE_OPTIONS,
  normalizeSecurityRole,
  formatSecurityRoleLabel,
} from "@/lib/utils/roleNormalizer";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/useAuth";
import { openSecureDocument } from "@/lib/utils/storageSecurity";

// Habilidades y conocimientos frecuentes en seguridad privada
const DEFAULT_SKILLS = [
  "Control de Acceso Peatonal y Vehicular",
  "Rondas Perimétricas y Vigilancia Fija",
  "Monitoreo de Cámaras y Alarmas CCTV",
  "Atención al Usuario y Manejo de Conflictos",
  "Protocolos de Emergencia y Primeros Auxilios",
  "Elaboración de Minutas y Reportes de Novedades",
  "Defensa Personal y Uso Proporcional de la Fuerza",
];

export default function PerfilGuardaPage() {
  const { role, fullName: authName, email: authEmail, avatarUrl: authAvatar } = useAuth();
  const supabase = createClient();

  // Estados del candidato
  const [userId, setUserId] = useState<string>("");
  const [nationalId, setNationalId] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Bogotá D.C.");
  const [locality, setLocality] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  // Perfil Operativo y Especialidad
  const [primaryRole, setPrimaryRole] = useState<SecurityRoleType>("vigilante_fijo");
  const [yearsExperience, setYearsExperience] = useState(2);
  const [bioSummary, setBioSummary] = useState("");

  // Estudios y Curso SuperVigilancia
  const [courseName, setCourseName] = useState("Reentrenamiento en Vigilancia");
  const [academyName, setAcademyName] = useState("Academia Superior de Seguridad");
  const [courseCompletionDate, setCourseCompletionDate] = useState<string | null>(null);
  const [nroCredencial, setNroCredencial] = useState("SIN REGISTRAR");
  const [courseId, setCourseId] = useState<string | null>(null);

  // Competencias y Dotación
  const [shirtSize, setShirtSize] = useState("M");
  const [pantsSize, setPantsSize] = useState("32");
  const [shoesSize, setShoesSize] = useState("40");
  const [bookletType, setBookletType] = useState("Primera Clase");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    "Control de Acceso Peatonal y Vehicular",
    "Rondas Perimétricas y Vigilancia Fija",
    "Monitoreo de Cámaras y Alarmas CCTV",
  ]);

  // Movilidad e Identificación
  const [hasMotorcycle, setHasMotorcycle] = useState(false);
  const [motorcycleCc, setMotorcycleCc] = useState<number | null>(null);
  const [shiftAvailability, setShiftAvailability] = useState("Turnos rotativos 2x2x2 y relevos");

  // Documentos adjuntos (3 soportes individuales)
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [idCardUrl, setIdCardUrl] = useState<string | null>(null);
  const [diplomaUrl, setDiplomaUrl] = useState<string | null>(null);

  // Estados de control UI y carga
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estado de edición por sección ("none" | "header" | "role" | "course" | "competencies" | "mobility")
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // Estados de carga individual de archivos
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  // Popover del medidor circular flotante
  const [showProgressTooltip, setShowProgressTooltip] = useState(false);

  // Referencias para inputs tipo archivo
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const idCardInputRef = useRef<HTMLInputElement>(null);
  const diplomaInputRef = useRef<HTMLInputElement>(null);

  // 1. CARGA DE DATOS DESDE SUPABASE
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setUserId(user.id);
          setEmail(user.email || "");

          // Foto de perfil desde localStorage o metadatos
          const cachedAvatar =
            typeof window !== "undefined"
              ? localStorage.getItem("fv_user_avatar") || user.user_metadata?.avatar_url || user.user_metadata?.picture
              : "";
          if (cachedAvatar) setAvatarUrl(cachedAvatar);

          // Cargar public.profiles
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

          if (profile) {
            if (profile.full_name) setFullName(profile.full_name);
            if (profile.phone_whatsapp) setPhone(profile.phone_whatsapp);
            if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
          } else if (user.user_metadata?.full_name) {
            setFullName(user.user_metadata.full_name);
          }

          // Cargar public.candidate_profiles
          const { data: candProfile } = await supabase
            .from("candidate_profiles")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

          if (candProfile) {
            if (candProfile.national_id) setNationalId(candProfile.national_id);
            if (candProfile.city) setCity(candProfile.city);
            if (candProfile.locality_neighborhood) setLocality(candProfile.locality_neighborhood);
            if (candProfile.primary_role) {
              setPrimaryRole(normalizeSecurityRole(candProfile.primary_role));
            }
            if (candProfile.years_experience !== undefined) {
              setYearsExperience(candProfile.years_experience);
            }
            if (candProfile.bio_summary) {
              setBioSummary(candProfile.bio_summary);
            }
            if (candProfile.has_own_motorcycle !== undefined) {
              setHasMotorcycle(candProfile.has_own_motorcycle);
            }
            if (candProfile.motorcycle_cc) {
              setMotorcycleCc(candProfile.motorcycle_cc);
            }
            if (candProfile.resume_pdf_url) {
              setResumeUrl(candProfile.resume_pdf_url);
            }

            // Parsear dotación y habilidades desde work_experience_json
            if (candProfile.work_experience_json) {
              const expData = candProfile.work_experience_json as any;
              if (expData?.uniform_sizes) {
                if (expData.uniform_sizes.shirt) setShirtSize(expData.uniform_sizes.shirt);
                if (expData.uniform_sizes.pants) setPantsSize(expData.uniform_sizes.pants);
                if (expData.uniform_sizes.shoes) setShoesSize(expData.uniform_sizes.shoes);
                if (expData.uniform_sizes.booklet) setBookletType(expData.uniform_sizes.booklet);
              }
              if (expData?.skills && Array.isArray(expData.skills) && expData.skills.length > 0) {
                setSelectedSkills(expData.skills);
              }
              if (expData?.shift_availability) {
                setShiftAvailability(expData.shift_availability);
              }
            }
          }

          // Cargar último curso de seguridad en public.candidate_courses
          const { data: course } = await supabase
            .from("candidate_courses")
            .select("*")
            .eq("candidate_id", user.id)
            .order("completion_date", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (course) {
            setCourseId(course.id);
            if (course.course_name) setCourseName(course.course_name);
            if (course.academy_name) setAcademyName(course.academy_name);
            if (course.completion_date) setCourseCompletionDate(course.completion_date);
            const regNumber = course.nro_credencial_supervigilancia || (course as any).credential_number;
            if (regNumber) setNroCredencial(regNumber);
            if (course.certificate_file_url) setDiplomaUrl(course.certificate_file_url);
          }

          // Cargar soportes documentales desde public.candidate_documents
          const { data: docs } = await supabase
            .from("candidate_documents")
            .select("*")
            .eq("candidate_id", user.id);

          if (docs && docs.length > 0) {
            docs.forEach((doc: any) => {
              const type = doc.doc_type || doc.document_type;
              if (type === "hoja_de_vida_pdf" && doc.file_url) {
                setResumeUrl(doc.file_url);
              } else if (type === "cedula_ciudadania" && doc.file_url) {
                setIdCardUrl(doc.file_url);
              } else if (type === "diploma_curso" && doc.file_url) {
                setDiplomaUrl(doc.file_url);
              }
            });
          }
        }
      } catch (err) {
        console.error("Error al cargar perfil del guarda:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authAvatar]);

  // Toast temporizado de notificación
  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // 2. SUBIDA INDIVIDUAL DE FOTO DE PERFIL
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    try {
      setUploadingDoc("avatar");
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `avatars/${userId}/${Date.now()}_${cleanName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("documents").getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      if (typeof window !== "undefined") {
        localStorage.setItem("fv_user_avatar", publicUrl);
      }

      // Actualizar en profiles y metadatos
      await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", userId);
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl, picture: publicUrl } });

      showToast("Foto de perfil actualizada correctamente.");
    } catch (err: any) {
      console.error("Error al subir foto:", err);
      setErrorMessage(err.message || "No se pudo actualizar la foto.");
    } finally {
      setUploadingDoc(null);
      if (e.target) e.target.value = "";
    }
  };

  // 3. SUBIDA INDIVIDUAL DE HOJA DE VIDA (PDF)
  const handleUploadResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    try {
      setUploadingDoc("resume");
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `cvs/${userId}/${Date.now()}_${cleanName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("documents").getPublicUrl(filePath);

      setResumeUrl(publicUrl);

      // Actualizar en candidate_profiles
      await supabase
        .from("candidate_profiles")
        .update({ resume_pdf_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("user_id", userId);

      // Registrar en candidate_documents
      await supabase.from("candidate_documents").insert({
        candidate_id: userId,
        doc_type: "hoja_de_vida_pdf",
        file_url: publicUrl,
      });

      showToast("Hoja de Vida en PDF cargada con éxito.");
    } catch (err: any) {
      console.error("Error al subir Hoja de Vida:", err);
      setErrorMessage(err.message || "Error al subir la Hoja de Vida.");
    } finally {
      setUploadingDoc(null);
      if (e.target) e.target.value = "";
    }
  };

  // 4. SUBIDA INDIVIDUAL DE CÉDULA DE CIUDADANÍA
  const handleUploadIdCard = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    try {
      setUploadingDoc("idCard");
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `id_cards/${userId}/${Date.now()}_${cleanName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("documents").getPublicUrl(filePath);

      setIdCardUrl(publicUrl);

      // Registrar en candidate_documents
      await supabase.from("candidate_documents").insert({
        candidate_id: userId,
        doc_type: "cedula_ciudadania",
        file_url: publicUrl,
      });

      showToast("Cédula de Ciudadanía cargada con éxito.");
    } catch (err: any) {
      console.error("Error al subir Cédula:", err);
      setErrorMessage(err.message || "Error al subir documento de identidad.");
    } finally {
      setUploadingDoc(null);
      if (e.target) e.target.value = "";
    }
  };

  // 5. SUBIDA INDIVIDUAL DE DIPLOMA DE CURSO SUPERVIGILANCIA
  const handleUploadDiploma = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    try {
      setUploadingDoc("diploma");
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `certificates/${userId}/${Date.now()}_${cleanName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("documents").getPublicUrl(filePath);

      setDiplomaUrl(publicUrl);

      // Actualizar en candidate_courses si existe
      if (courseId) {
        await supabase
          .from("candidate_courses")
          .update({ certificate_file_url: publicUrl })
          .eq("id", courseId);
      }

      // Registrar en candidate_documents
      await supabase.from("candidate_documents").insert({
        candidate_id: userId,
        doc_type: "diploma_curso",
        file_url: publicUrl,
      });

      showToast("Diploma del Curso de Seguridad cargado con éxito.");
    } catch (err: any) {
      console.error("Error al subir Diploma:", err);
      setErrorMessage(err.message || "Error al subir diploma del curso.");
    } finally {
      setUploadingDoc(null);
      if (e.target) e.target.value = "";
    }
  };

  // 6. GUARDAR SECCIÓN A: CABECERA Y CONTACTO
  const handleSaveHeader = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone_whatsapp: phone.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      await supabase
        .from("candidate_profiles")
        .update({
          city,
          locality_neighborhood: locality,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      setEditingSection(null);
      showToast("Datos de contacto actualizados.");
    } catch (err: any) {
      setErrorMessage("Error al guardar datos de contacto.");
    } finally {
      setIsSaving(false);
    }
  };

  // 7. GUARDAR SECCIÓN B: ESPECIALIDAD Y DESCRIPCIÓN
  const handleSaveRole = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      const normalized = normalizeSecurityRole(primaryRole);
      await supabase
        .from("candidate_profiles")
        .update({
          primary_role: normalized,
          years_experience: yearsExperience,
          bio_summary: bioSummary.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      setEditingSection(null);
      showToast("Especialidad y descripción guardadas.");
    } catch (err: any) {
      setErrorMessage("Error al guardar especialidad.");
    } finally {
      setIsSaving(false);
    }
  };

  // 8. GUARDAR SECCIÓN C: CURSO SUPERVIGILANCIA
  const handleSaveCourse = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      const completion = courseCompletionDate || new Date().toISOString().split("T")[0];
      // Calcular vigencia exacta a 1 año
      const compDateObj = new Date(completion);
      const expDateObj = new Date(compDateObj);
      expDateObj.setFullYear(expDateObj.getFullYear() + 1);
      const expirationDate = expDateObj.toISOString().split("T")[0];

      if (courseId) {
        await supabase
          .from("candidate_courses")
          .update({
            course_name: courseName,
            academy_name: academyName,
            completion_date: completion,
            expiration_date: expirationDate,
            nro_credencial_supervigilancia: nroCredencial.trim(),
          })
          .eq("id", courseId);
      } else {
        const { data: newCourse } = await supabase
          .from("candidate_courses")
          .insert({
            candidate_id: userId,
            course_name: courseName,
            academy_name: academyName,
            completion_date: completion,
            expiration_date: expirationDate,
            nro_credencial_supervigilancia: nroCredencial.trim(),
            certificate_file_url: diplomaUrl,
          })
          .select("id")
          .single();

        if (newCourse) setCourseId(newCourse.id);
      }

      setEditingSection(null);
      showToast("Información del curso de seguridad actualizada.");
    } catch (err: any) {
      setErrorMessage("Error al guardar información del curso.");
    } finally {
      setIsSaving(false);
    }
  };

  // 9. GUARDAR SECCIÓN D: COMPETENCIAS Y DOTACIÓN
  const handleSaveCompetencies = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      const payloadJson = {
        uniform_sizes: {
          shirt: shirtSize,
          pants: pantsSize,
          shoes: shoesSize,
          booklet: bookletType,
        },
        skills: selectedSkills,
        shift_availability: shiftAvailability,
      };

      await supabase
        .from("candidate_profiles")
        .update({
          work_experience_json: payloadJson,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      setEditingSection(null);
      showToast("Dotación y competencias actualizadas.");
    } catch (err: any) {
      setErrorMessage("Error al guardar dotación.");
    } finally {
      setIsSaving(false);
    }
  };

  // 10. GUARDAR SECCIÓN E: MOVILIDAD E IDENTIFICACIÓN
  const handleSaveMobility = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      const payloadJson = {
        uniform_sizes: {
          shirt: shirtSize,
          pants: pantsSize,
          shoes: shoesSize,
          booklet: bookletType,
        },
        skills: selectedSkills,
        shift_availability: shiftAvailability,
      };

      await supabase
        .from("candidate_profiles")
        .update({
          national_id: nationalId.trim(),
          has_own_motorcycle: hasMotorcycle,
          motorcycle_cc: hasMotorcycle ? motorcycleCc : null,
          work_experience_json: payloadJson,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      setEditingSection(null);
      showToast("Datos de movilidad e identificación actualizados.");
    } catch (err: any) {
      setErrorMessage("Error al guardar movilidad.");
    } finally {
      setIsSaving(false);
    }
  };

  // 11. CÁLCULO DINÁMICO EN VIVO DE COMPLETITUD (0% A 100%)
  const hasAvatar = Boolean(avatarUrl && avatarUrl.trim().length > 0);
  const hasPersonalInfo = Boolean(fullName.trim().length >= 3 && phone.trim().length >= 7);
  const hasRoleAndBio = Boolean(primaryRole && (bioSummary.trim().length > 15 || yearsExperience > 0));
  const hasNationalId = Boolean(nationalId && nationalId.trim().length >= 6 && !nationalId.startsWith("TEMP-"));
  const hasCourse = Boolean(courseCompletionDate && courseCompletionDate.trim().length > 0);
  const hasResume = Boolean(resumeUrl && resumeUrl.trim().length > 0);
  const hasIdCard = Boolean(idCardUrl && idCardUrl.trim().length > 0);
  const hasDiploma = Boolean(diplomaUrl && diplomaUrl.trim().length > 0);

  const checklist = [
    { label: "Foto de perfil cargada", done: hasAvatar, weight: 12 },
    { label: "Datos de contacto (Nombre y WhatsApp)", done: hasPersonalInfo, weight: 13 },
    { label: "Especialidad y resumen profesional", done: hasRoleAndBio, weight: 15 },
    { label: "Cédula de Ciudadanía registrada", done: hasNationalId, weight: 15 },
    { label: "Curso SuperVigilancia validado", done: hasCourse, weight: 15 },
    { label: "Hoja de Vida en PDF adjunta", done: hasResume, weight: 10 },
    { label: "Copia de Cédula adjunta", done: hasIdCard, weight: 10 },
    { label: "Diploma del Curso adjunto", done: hasDiploma, weight: 10 },
  ];

  const totalPercentage = checklist.reduce((acc, item) => (item.done ? acc + item.weight : acc), 0);
  const pendingCount = checklist.filter((item) => !item.done).length;

  // Cálculo de círculo SVG
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (totalPercentage / 100) * circumference;

  return (
    <div className="space-y-6 pb-20">
      {/* ALERTA DE TOAST FLOTANTE */}
      {successToast && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold">{successToast}</span>
        </div>
      )}

      {errorMessage && (
        <div className="fixed top-20 right-4 z-50 bg-rose-50 border border-rose-300 text-rose-900 px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="text-xs font-semibold">{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-600 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. SUB-BARRA SUPERIOR TIPO PÍLDORA (MI ÁREA / HOJA DE VIDA ESTILO COMPUTRABAJO) */}
      <div className="bg-[#EAF3FA]/80 p-1.5 rounded-full flex items-center justify-between max-w-4xl mx-auto border border-[#D5E6F5] overflow-x-auto scrollbar-none shadow-2xs">
        <Link
          href="/guarda/perfil"
          className="bg-[#0B3B70] text-white rounded-full px-5 sm:px-6 py-2 text-xs font-semibold shadow-xs flex items-center gap-2 shrink-0 transition-colors"
        >
          <User className="w-3.5 h-3.5" />
          <span>Hoja de Vida</span>
        </Link>
        <Link
          href="/guarda/postulaciones"
          className="text-slate-700 hover:text-[#0B3B70] hover:bg-white/90 rounded-full px-4 sm:px-5 py-2 text-xs font-medium shrink-0 transition-colors"
        >
          Mis Aplicaciones
        </Link>
        <Link
          href="/guarda/documentos"
          className="text-slate-700 hover:text-[#0B3B70] hover:bg-white/90 rounded-full px-4 sm:px-5 py-2 text-xs font-medium shrink-0 transition-colors"
        >
          Credencial & Cursos
        </Link>
        <Link
          href="/guarda/academias"
          className="text-slate-700 hover:text-[#0B3B70] hover:bg-white/90 rounded-full px-4 sm:px-5 py-2 text-xs font-medium shrink-0 transition-colors"
        >
          Academias Aliadas
        </Link>
      </div>

      {/* 2. LAYOUT DE 2 COLUMNAS (lg:grid-cols-12 gap-6) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* COLUMNA IZQUIERDA PRINCIPAL (lg:col-span-8) - TARJETA BLANCA CONTINUA     */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-8">
          {/* --------------------------------------------------------------------- */}
          {/* SECCIÓN A: CABECERA CON FOTO, BOTÓN + Y CONTACTO (✏️)                 */}
          {/* --------------------------------------------------------------------- */}
          <div className="relative pb-6 border-b border-slate-100">
            {editingSection !== "header" ? (
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                {/* Foto circular con botón '+' flotante */}
                <div className="relative shrink-0">
                  <div className="w-28 h-28 rounded-full border-2 border-slate-100 shadow-xs overflow-hidden bg-[#0B3B70] text-white flex items-center justify-center font-bold text-2xl">
                    {avatarUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={avatarUrl}
                        alt={fullName || "Aspirante"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{fullName ? fullName.slice(0, 2).toUpperCase() : "PO"}</span>
                    )}
                  </div>
                  {/* Botón '+' circular para subir foto */}
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingDoc === "avatar"}
                    className="w-8 h-8 rounded-full bg-[#005DA4] hover:bg-[#0B3B70] text-white flex items-center justify-center shadow-md absolute bottom-0 right-0 cursor-pointer active:scale-95 transition-all"
                    title="Subir o cambiar foto de perfil"
                  >
                    {uploadingDoc === "avatar" ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="file"
                    ref={avatarInputRef}
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>

                {/* Datos de Identificación y Contacto */}
                <div className="flex-1 text-center sm:text-left min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
                        {fullName || "Personal Operativo de Seguridad"}
                      </h2>
                      <p className="text-xs font-semibold text-slate-600 flex items-center justify-center sm:justify-start gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{city}{locality ? ` • ${locality}` : ""}</span>
                      </p>
                    </div>

                    {/* Botón Lápiz Azul */}
                    <button
                      type="button"
                      onClick={() => setEditingSection("header")}
                      className="p-2 rounded-full text-[#005DA4] hover:bg-[#EAF3FA] transition-colors cursor-pointer shrink-0"
                      title="Editar datos de contacto"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs">
                    <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{email || authEmail || "Sin correo"}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-slate-800 font-bold font-mono">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{phone ? `+57 ${phone}` : "Sin celular registrado"}</span>
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* MODO EDICIÓN SECCIÓN A */
              <div className="space-y-4 bg-[#F2F5F8]/70 p-5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-[#0B3B70] uppercase tracking-wider">
                    Editar Datos Personales y de Contacto
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingSection(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nombres y apellidos completos"
                      className="w-full h-9 bg-white border border-slate-300 rounded-xl px-3 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#005DA4]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">WhatsApp / Teléfono</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ej. 3001234567"
                      className="w-full h-9 bg-white border border-slate-300 rounded-xl px-3 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-[#005DA4]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Ciudad Principal</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full h-9 bg-white border border-slate-300 rounded-xl px-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#005DA4]"
                    >
                      <option value="Bogotá D.C.">Bogotá D.C.</option>
                      <option value="Medellín">Medellín</option>
                      <option value="Cali">Cali</option>
                      <option value="Barranquilla">Barranquilla</option>
                      <option value="Bucaramanga">Bucaramanga</option>
                      <option value="Cartagena">Cartagena</option>
                      <option value="Pereira">Pereira</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Barrio o Localidad</label>
                    <input
                      type="text"
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                      placeholder="Ej. Suba, Kennedy, Poblado..."
                      className="w-full h-9 bg-white border border-slate-300 rounded-xl px-3 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#005DA4]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingSection(null)}
                    className="px-4 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveHeader}
                    disabled={isSaving}
                    className="px-5 py-1.5 rounded-full bg-[#0B3B70] text-white text-xs font-semibold hover:bg-[#082B54] shadow-xs"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* SECCIÓN B: ESPECIALIDAD PRINCIPAL Y DESCRIPCIÓN DEL PERFIL (✏️)        */}
          {/* --------------------------------------------------------------------- */}
          <div className="space-y-2 pb-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  {formatSecurityRoleLabel(primaryRole)}
                </h3>
                <span className="text-xs text-[#005DA4] font-semibold">
                  {yearsExperience} año{yearsExperience !== 1 ? "s" : ""} de experiencia certificada
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingSection(editingSection === "role" ? null : "role")}
                className="p-2 rounded-full text-[#005DA4] hover:bg-[#EAF3FA] transition-colors cursor-pointer"
                title="Editar especialidad y descripción"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>

            {editingSection !== "role" ? (
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                {bioSummary.trim() ||
                  "Personal de seguridad privada con vocación de servicio, disciplina y cumplimiento normativo ante la SuperVigilancia. Experiencia en control de acceso, rondas y protección de activos en instalaciones corporativas y residenciales."}
              </p>
            ) : (
              /* MODO EDICIÓN SECCIÓN B */
              <div className="space-y-4 bg-[#F2F5F8]/70 p-5 rounded-2xl border border-slate-200 mt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Especialidad Principal</label>
                    <select
                      value={primaryRole}
                      onChange={(e) => setPrimaryRole(e.target.value as SecurityRoleType)}
                      className="w-full h-9 bg-white border border-slate-300 rounded-xl px-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#005DA4]"
                    >
                      {SECURITY_ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Años de Experiencia</label>
                    <input
                      type="number"
                      min="0"
                      max="40"
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(parseInt(e.target.value, 10) || 0)}
                      className="w-full h-9 bg-white border border-slate-300 rounded-xl px-3 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#005DA4]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 text-xs">
                    Descripción / Resumen Profesional
                  </label>
                  <textarea
                    rows={3}
                    value={bioSummary}
                    onChange={(e) => setBioSummary(e.target.value)}
                    placeholder="Describe tus principales responsabilidades, habilidades y logros operativos..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#005DA4]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingSection(null)}
                    className="px-4 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveRole}
                    disabled={isSaving}
                    className="px-5 py-1.5 rounded-full bg-[#0B3B70] text-white text-xs font-semibold hover:bg-[#082B54] shadow-xs"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* SECCIÓN C: MIS ESTUDIOS Y CURSOS SUPERVIGILANCIA (✏️)                  */}
          {/* --------------------------------------------------------------------- */}
          <div className="space-y-4 pb-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Mis estudios y Cursos SuperVigilancia
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSection(editingSection === "course" ? null : "course")}
                  className="p-2 rounded-full text-[#005DA4] hover:bg-[#EAF3FA] transition-colors cursor-pointer"
                  title="Editar curso de seguridad"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            </div>

            {editingSection !== "course" ? (
              <div className="space-y-3">
                {/* Línea de tiempo vertical con punto azul */}
                <div className="relative pl-6 space-y-3">
                  <div className="absolute left-[7px] top-2 bottom-1 w-0.5 bg-slate-200" />
                  <div className="relative">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#005DA4] ring-4 ring-[#EAF3FA] absolute -left-[23px] top-1" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{courseName}</h4>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">{academyName}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1 font-mono">
                        <span>
                          Fecha: <strong className="text-slate-800">{courseCompletionDate || "Sin registrar"}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Registro NRO: <strong className="text-slate-800">{nroCredencial}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Caja de sugerencia azul suave con bombillo */}
                <div className="bg-[#EAF3FA]/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-700 border border-[#D5E6F5]">
                  <div className="flex items-start gap-2.5">
                    <Lightbulb className="w-4 h-4 text-[#005DA4] shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      Mantén al día tu reentrenamiento anual ante la SuperVigilancia. Las empresas verifican vigencias antes de contratar.
                    </p>
                  </div>
                  <Link
                    href="/guarda/academias"
                    className="font-bold text-[#0B3B70] hover:underline whitespace-nowrap shrink-0 self-end sm:self-auto"
                  >
                    Ver convenios (15% OFF) →
                  </Link>
                </div>
              </div>
            ) : (
              /* MODO EDICIÓN SECCIÓN C */
              <div className="space-y-4 bg-[#F2F5F8]/70 p-5 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-[#0B3B70] uppercase tracking-wider block">
                  Actualizar Acreditación de Seguridad Privada
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nombre del Curso</label>
                    <input
                      type="text"
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      placeholder="Ej. Reentrenamiento en Vigilancia"
                      className="w-full h-9 bg-white border border-slate-300 rounded-xl px-3 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#005DA4]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Academia Emisora</label>
                    <input
                      type="text"
                      value={academyName}
                      onChange={(e) => setAcademyName(e.target.value)}
                      placeholder="Nombre de la academia autorizada"
                      className="w-full h-9 bg-white border border-slate-300 rounded-xl px-3 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#005DA4]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Fecha de Realización</label>
                    <input
                      type="date"
                      value={courseCompletionDate || ""}
                      onChange={(e) => setCourseCompletionDate(e.target.value)}
                      className="w-full h-9 bg-white border border-slate-300 rounded-xl px-3 text-xs font-mono font-medium text-slate-900 focus:outline-none focus:border-[#005DA4]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Número de Credencial / Registro</label>
                    <input
                      type="text"
                      value={nroCredencial}
                      onChange={(e) => setNroCredencial(e.target.value)}
                      placeholder="NRO SuperVigilancia"
                      className="w-full h-9 bg-white border border-slate-300 rounded-xl px-3 text-xs font-mono font-medium text-slate-900 focus:outline-none focus:border-[#005DA4]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingSection(null)}
                    className="px-4 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCourse}
                    disabled={isSaving}
                    className="px-5 py-1.5 rounded-full bg-[#0B3B70] text-white text-xs font-semibold hover:bg-[#082B54] shadow-xs"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* SECCIÓN D: COMPETENCIAS OPERATIVAS Y DOTACIÓN EN PÍLDORAS             */}
          {/* --------------------------------------------------------------------- */}
          <div className="space-y-4 pb-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Conocimientos, competencias y dotación
              </h3>
              <button
                type="button"
                onClick={() => setEditingSection(editingSection === "competencies" ? null : "competencies")}
                className="rounded-full border border-[#0B3B70] text-[#0B3B70] hover:bg-[#EAF3FA] px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
              >
                {editingSection === "competencies" ? "Cerrar" : "Editar / Añadir"}
              </button>
            </div>

            {editingSection !== "competencies" ? (
              <div className="space-y-3">
                {/* Píldoras de Dotación Corporativa */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Tallas de Dotación Corporativa
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-[#EAF3FA] text-slate-800 rounded-full px-3.5 py-1 text-xs font-medium inline-flex items-center gap-1.5 border border-[#D5E6F5]">
                      👕 Camisa: <strong className="text-[#0B3B70]">Talla {shirtSize}</strong>
                    </span>
                    <span className="bg-[#EAF3FA] text-slate-800 rounded-full px-3.5 py-1 text-xs font-medium inline-flex items-center gap-1.5 border border-[#D5E6F5]">
                      👖 Pantalón: <strong className="text-[#0B3B70]">Talla {pantsSize}</strong>
                    </span>
                    <span className="bg-[#EAF3FA] text-slate-800 rounded-full px-3.5 py-1 text-xs font-medium inline-flex items-center gap-1.5 border border-[#D5E6F5]">
                      🥾 Calzado / Botas: <strong className="text-[#0B3B70]">Talla {shoesSize}</strong>
                    </span>
                    <span className="bg-[#EAF3FA] text-slate-800 rounded-full px-3.5 py-1 text-xs font-medium inline-flex items-center gap-1.5 border border-[#D5E6F5]">
                      🪖 Libreta Militar: <strong className="text-[#0B3B70]">{bookletType}</strong>
                    </span>
                  </div>
                </div>

                {/* Píldoras de Competencias */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Competencias y Habilidades
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedSkills.map((sk) => (
                      <span
                        key={sk}
                        className="bg-[#F2F5F8] text-slate-700 rounded-full px-3.5 py-1 text-xs font-medium border border-slate-200"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* MODO EDICIÓN SECCIÓN D */
              <div className="space-y-4 bg-[#F2F5F8]/70 p-5 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-[#0B3B70] uppercase tracking-wider block">
                  Configurar Tallas y Competencias
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Camisa</label>
                    <select
                      value={shirtSize}
                      onChange={(e) => setShirtSize(e.target.value)}
                      className="w-full h-9 bg-white border border-slate-300 rounded-xl px-2 text-xs font-bold text-slate-900 focus:outline-none"
                    >
                      {["S", "M", "L", "XL", "XXL"].map((s) => (
                        <option key={s} value={s}>
                          Talla {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Pantalón</label>
                    <select
                      value={pantsSize}
                      onChange={(e) => setPantsSize(e.target.value)}
                      className="w-full h-9 bg-white border border-slate-300 rounded-xl px-2 text-xs font-bold text-slate-900 focus:outline-none"
                    >
                      {["28", "30", "32", "34", "36", "38"].map((s) => (
                        <option key={s} value={s}>
                          Talla {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Calzado</label>
                    <select
                      value={shoesSize}
                      onChange={(e) => setShoesSize(e.target.value)}
                      className="w-full h-9 bg-white border border-slate-300 rounded-xl px-2 text-xs font-bold text-slate-900 focus:outline-none"
                    >
                      {["37", "38", "39", "40", "41", "42", "43", "44"].map((s) => (
                        <option key={s} value={s}>
                          Talla {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Libreta Militar</label>
                    <select
                      value={bookletType}
                      onChange={(e) => setBookletType(e.target.value)}
                      className="w-full h-9 bg-white border border-slate-300 rounded-xl px-2 text-xs font-bold text-slate-900 focus:outline-none"
                    >
                      <option value="Primera Clase">Primera Clase</option>
                      <option value="Segunda Clase">Segunda Clase</option>
                      <option value="No aplica">No aplica</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block font-semibold text-slate-700 mb-2 text-xs">
                    Selecciona tus competencias operativas:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {DEFAULT_SKILLS.map((sk) => {
                      const isChecked = selectedSkills.includes(sk);
                      return (
                        <button
                          key={sk}
                          type="button"
                          onClick={() => {
                            if (isChecked) {
                              setSelectedSkills(selectedSkills.filter((s) => s !== sk));
                            } else {
                              setSelectedSkills([...selectedSkills, sk]);
                            }
                          }}
                          className={`p-2 rounded-xl text-left border flex items-center gap-2 transition-all cursor-pointer ${
                            isChecked
                              ? "bg-[#0B3B70] text-white border-[#0B3B70]"
                              : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-md flex items-center justify-center border text-[10px] ${
                              isChecked ? "bg-white text-[#0B3B70] border-white" : "border-slate-300"
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3" />}
                          </div>
                          <span className="truncate">{sk}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingSection(null)}
                    className="px-4 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCompetencies}
                    disabled={isSaving}
                    className="px-5 py-1.5 rounded-full bg-[#0B3B70] text-white text-xs font-semibold hover:bg-[#082B54] shadow-xs"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* SECCIÓN E: DESPLAZAMIENTO, MOVILIDAD E IDENTIFICACIÓN (✏️)            */}
          {/* --------------------------------------------------------------------- */}
          <div className="space-y-3 pb-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Desplazamiento, movilidad e identificación
              </h3>
              <button
                type="button"
                onClick={() => setEditingSection(editingSection === "mobility" ? null : "mobility")}
                className="p-2 rounded-full text-[#005DA4] hover:bg-[#EAF3FA] transition-colors cursor-pointer"
                title="Editar movilidad e identificación"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>

            {editingSection !== "mobility" ? (
              <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#005DA4] shrink-0" />
                  <span>
                    <strong>Cédula de Ciudadanía:</strong>{" "}
                    <span className="font-mono text-slate-900">
                      {nationalId && !nationalId.startsWith("TEMP-") ? nationalId : "Sin registrar"}
                    </span>
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#005DA4] shrink-0" />
                  <span>
                    <strong>Medio de transporte / Vehículo propio:</strong>{" "}
                    {hasMotorcycle ? `Moto propia (${motorcycleCc || 150} cc)` : "Sin vehículo propio / Transporte público"}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#005DA4] shrink-0" />
                  <span>
                    <strong>Disponibilidad de turno y relevos:</strong> {shiftAvailability}
                  </span>
                </li>
              </ul>
            ) : (
              /* MODO EDICIÓN SECCIÓN E */
              <div className="space-y-4 bg-[#F2F5F8]/70 p-5 rounded-2xl border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Cédula de Ciudadanía</label>
                    <input
                      type="text"
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      placeholder="Número de cédula de ciudadanía"
                      className="w-full h-9 bg-white border border-slate-300 rounded-xl px-3 text-xs font-mono font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Disponibilidad de Turno</label>
                    <select
                      value={shiftAvailability}
                      onChange={(e) => setShiftAvailability(e.target.value)}
                      className="w-full h-9 bg-white border border-slate-300 rounded-xl px-2.5 text-xs font-medium text-slate-900 focus:outline-none"
                    >
                      <option value="Turnos rotativos 2x2x2 y relevos">Turnos rotativos 2x2x2 y relevos</option>
                      <option value="Turnos 4x4x2 rotativo">Turnos 4x4x2 rotativo</option>
                      <option value="Exclusivo turno nocturno">Exclusivo turno nocturno</option>
                      <option value="Exclusivo turno diurno">Exclusivo turno diurno</option>
                      <option value="Disponibilidad inmediata total">Disponibilidad inmediata total</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasMotorcycle}
                      onChange={(e) => setHasMotorcycle(e.target.checked)}
                      className="rounded-sm border-slate-300 text-[#005DA4]"
                    />
                    <span>¿Posee moto propia?</span>
                  </label>
                  {hasMotorcycle && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-600 font-medium">Cilindraje (cc):</span>
                      <input
                        type="number"
                        value={motorcycleCc || 150}
                        onChange={(e) => setMotorcycleCc(parseInt(e.target.value, 10) || 150)}
                        className="w-20 h-8 bg-white border border-slate-300 rounded-lg px-2 text-xs font-mono font-bold text-slate-900"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingSection(null)}
                    className="px-4 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveMobility}
                    disabled={isSaving}
                    className="px-5 py-1.5 rounded-full bg-[#0B3B70] text-white text-xs font-semibold hover:bg-[#082B54] shadow-xs"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* SECCIÓN F: DOCUMENTOS ADJUNTOS (3 SOPORTES INDIVIDUALES SEPARADOS)    */}
          {/* --------------------------------------------------------------------- */}
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Documentos adjuntos (3 soportes obligatorios)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Carga y consulta cada documento de forma individual para que las empresas verifiquen tu perfil al 100%.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              {/* DOCUMENTO 1: HOJA DE VIDA EN PDF */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-[#F2F5F8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#005DA4] shrink-0" />
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#0B3B70] shrink-0 shadow-2xs">
                    <FileText className="w-4 h-4 text-[#005DA4]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Hoja de Vida (PDF)</h4>
                    <span className="text-[11px] font-medium block">
                      {resumeUrl ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" /> Archivo cargado y activo
                        </span>
                      ) : (
                        <span className="text-amber-700 font-semibold">Pendiente por adjuntar</span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {resumeUrl && (
                    <button
                      type="button"
                      onClick={() => openSecureDocument(resumeUrl)}
                      className="rounded-full bg-white text-slate-700 hover:text-[#0B3B70] border border-slate-300 text-xs px-3.5 py-1.5 font-semibold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Ver</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => resumeInputRef.current?.click()}
                    disabled={uploadingDoc === "resume"}
                    className="rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white text-xs px-4 py-1.5 font-semibold inline-flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingDoc === "resume" ? "Subiendo..." : resumeUrl ? "Reemplazar" : "Subir PDF"}</span>
                  </button>
                  <input
                    type="file"
                    ref={resumeInputRef}
                    accept=".pdf,.doc,.docx"
                    onChange={handleUploadResume}
                    className="hidden"
                  />
                </div>
              </div>

              {/* DOCUMENTO 2: CÉDULA DE CIUDADANÍA */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-[#F2F5F8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#005DA4] shrink-0" />
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#0B3B70] shrink-0 shadow-2xs">
                    <CreditCard className="w-4 h-4 text-[#005DA4]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Cédula de Ciudadanía (PDF o Imagen)</h4>
                    <span className="text-[11px] font-medium block">
                      {idCardUrl ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" /> Documento cargado
                        </span>
                      ) : (
                        <span className="text-amber-700 font-semibold">Pendiente por adjuntar</span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {idCardUrl && (
                    <button
                      type="button"
                      onClick={() => openSecureDocument(idCardUrl)}
                      className="rounded-full bg-white text-slate-700 hover:text-[#0B3B70] border border-slate-300 text-xs px-3.5 py-1.5 font-semibold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Ver</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => idCardInputRef.current?.click()}
                    disabled={uploadingDoc === "idCard"}
                    className="rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white text-xs px-4 py-1.5 font-semibold inline-flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingDoc === "idCard" ? "Subiendo..." : idCardUrl ? "Reemplazar" : "Subir Cédula"}</span>
                  </button>
                  <input
                    type="file"
                    ref={idCardInputRef}
                    accept=".pdf,image/*"
                    onChange={handleUploadIdCard}
                    className="hidden"
                  />
                </div>
              </div>

              {/* DOCUMENTO 3: DIPLOMA / CERTIFICADO CURSO SUPERVIGILANCIA */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-[#F2F5F8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#005DA4] shrink-0" />
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#0B3B70] shrink-0 shadow-2xs">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Diploma / Certificado Curso SuperVigilancia</h4>
                    <span className="text-[11px] font-medium block">
                      {diplomaUrl ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" /> Certificado cargado
                        </span>
                      ) : (
                        <span className="text-amber-700 font-semibold">Pendiente por adjuntar</span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {diplomaUrl && (
                    <button
                      type="button"
                      onClick={() => openSecureDocument(diplomaUrl)}
                      className="rounded-full bg-white text-slate-700 hover:text-[#0B3B70] border border-slate-300 text-xs px-3.5 py-1.5 font-semibold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Ver</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => diplomaInputRef.current?.click()}
                    disabled={uploadingDoc === "diploma"}
                    className="rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white text-xs px-4 py-1.5 font-semibold inline-flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingDoc === "diploma" ? "Subiendo..." : diplomaUrl ? "Reemplazar" : "Subir Diploma"}</span>
                  </button>
                  <input
                    type="file"
                    ref={diplomaInputRef}
                    accept=".pdf,image/*"
                    onChange={handleUploadDiploma}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COLUMNA DERECHA LATERAL (lg:col-span-4) - ESTADO Y DESTACADO CORPORATIVO  */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          {/* TARJETA 1: CREDENCIAL Y ESTADO DE HDV */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Credencial y Estado de HdV
              </h3>
              <span className="bg-[#FFD15C] text-slate-900 font-bold px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider">
                Nuevo
              </span>
            </div>

            {/* Lista de completitud de elementos */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-semibold">Nivel de completitud:</span>
                <span className="font-bold text-slate-900 font-mono text-sm">{totalPercentage}%</span>
              </div>

              {/* Barra de progreso visual */}
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    totalPercentage === 100
                      ? "bg-emerald-500"
                      : totalPercentage >= 70
                      ? "bg-[#0B3B70]"
                      : "bg-amber-500"
                  }`}
                  style={{ width: `${Math.max(totalPercentage, 5)}%` }}
                />
              </div>

              <div className="pt-2 space-y-1.5 text-[11px]">
                {checklist.map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5 truncate">
                      {item.done ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" strokeWidth={2.5} />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                      )}
                      <span className={item.done ? "text-slate-800 font-medium" : "text-slate-400"}>
                        {item.label}
                      </span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">+{item.weight}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Botón Píldora Azul Marino 'Ver mi Credencial QR' */}
            <Link
              href="/guarda/documentos"
              className="rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white w-full py-3 text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Shield className="w-4 h-4 text-[#FFE066]" />
              <span>Ver mi Credencial QR</span>
            </Link>
          </div>

          {/* TARJETA 2: DESTACADO TURQUESA/AZUL ESTILO COMPUTRABAJO */}
          <div className="rounded-3xl bg-gradient-to-br from-[#0B3B70] to-[#005DA4] text-white p-6 shadow-md border border-[#082B54] space-y-4">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-[#FFE066]" />
              <h4 className="text-sm font-bold tracking-tight text-white">
                Prioridad de Selección B2B
              </h4>
            </div>

            <p className="text-xs text-blue-100 leading-relaxed">
              Las empresas de seguridad privada autorizadas en Colombia filtran automáticamente candidatos con{" "}
              <strong className="text-white">Hoja de Vida al 100%</strong> y con los 3 soportes adjuntos validados.
            </p>

            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-200 block">
                Cumplimiento Decreto 356
              </span>
              <p className="text-[11px] text-white/90">
                Tu perfil queda habilitado para postulación en 1 clic y citación inmediata a entrevista presencial.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MEDIDOR CIRCULAR FLOTANTE DEL PORCENTAJE REAL (0% A 100%)              */}
      {/* ========================================================================= */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="relative">
          {/* Tooltip / Popover flotante hacia arriba al interactuar */}
          {showProgressTooltip && (
            <div className="absolute bottom-full right-0 mb-3 w-80 bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#0B3B70]" />
                  <span className="text-xs font-bold text-slate-900">Estado de tu Hoja de Vida</span>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-mono">
                  {totalPercentage}%
                </span>
              </div>

              <p className="text-[11px] text-slate-500 mt-2 mb-3 leading-relaxed">
                {totalPercentage === 100
                  ? "¡Felicitaciones! Tu Hoja de Vida está al 100% y tiene máxima visibilidad ante empresas contratistas."
                  : `Te falta${pendingCount > 1 ? "n" : ""} ${pendingCount} elemento${pendingCount > 1 ? "s" : ""} para alcanzar el 100% de visibilidad.`}
              </p>

              <div className="space-y-1.5 text-[11px]">
                {checklist.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 truncate">
                      {item.done ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" strokeWidth={2.5} />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                      )}
                      <span className={item.done ? "text-slate-800 font-medium" : "text-slate-500 font-normal"}>
                        {item.label}
                      </span>
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-slate-400">
                      {item.done ? "Listo" : `+${item.weight}%`}
                    </span>
                  </div>
                ))}
              </div>

              {totalPercentage < 100 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowProgressTooltip(false);
                    window.scrollTo({ top: 300, behavior: "smooth" });
                  }}
                  className="mt-4 w-full py-2 bg-[#0B3B70] hover:bg-[#082B54] text-white rounded-full text-xs font-semibold shadow-xs transition-colors"
                >
                  Completar ahora
                </button>
              )}
            </div>
          )}

          {/* Círculo medidor flotante interactivo */}
          <button
            type="button"
            onClick={() => setShowProgressTooltip(!showProgressTooltip)}
            onMouseEnter={() => setShowProgressTooltip(true)}
            className="w-16 h-16 rounded-full bg-white shadow-xl hover:shadow-2xl border-2 border-slate-100 flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 group relative select-none"
            aria-label="Ver porcentaje de Hoja de Vida"
            title="Porcentaje de completitud de Hoja de Vida"
          >
            {/* SVG Anillo de Progreso */}
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
              {/* Círculo de fondo */}
              <circle
                cx="28"
                cy="28"
                r={radius}
                className="stroke-slate-200"
                strokeWidth="3.5"
                fill="transparent"
              />
              {/* Círculo de progreso dinámico */}
              <circle
                cx="28"
                cy="28"
                r={radius}
                className="transition-all duration-700 ease-out"
                stroke={totalPercentage === 100 ? "#10B981" : totalPercentage >= 70 ? "#005DA4" : "#F59E0B"}
                strokeWidth="3.5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Porcentaje en el centro */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-extrabold text-slate-900 font-mono tracking-tight leading-none">
                {totalPercentage}%
              </span>
              <span className="text-[8px] font-bold uppercase text-slate-400 tracking-wider leading-none mt-0.5">
                HdV
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
