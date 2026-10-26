"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  Shield,
  CreditCard,
  Phone,
  MapPin,
  Briefcase,
  FileText,
  FileCheck,
  CheckCircle2,
  Bike,
  LogOut,
  Save,
  Check,
  BadgeCheck,
  Upload,
  ExternalLink,
  AlertCircle,
  Sparkles,
  Award,
  Calendar,
} from "lucide-react";
import { CourseSemaphoreBanner } from "@/components/guarda/CourseSemaphoreBanner";
import { SecurityRoleType } from "@/types/database";
import {
  SECURITY_ROLE_OPTIONS,
  normalizeSecurityRole,
  formatSecurityRoleLabel,
} from "@/lib/utils/roleNormalizer";
import { createClient } from "@/lib/supabase/client";

export default function PerfilGuardaPage() {
  const [nationalId, setNationalId] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Bogotá D.C.");
  const [locality, setLocality] = useState("");
  const [primaryRole, setPrimaryRole] = useState<SecurityRoleType>("vigilante_fijo");
  const [yearsExperience, setYearsExperience] = useState(0);
  const [hasMilitaryBooklet, setHasMilitaryBooklet] = useState(false);
  const [hasMotorcycle, setHasMotorcycle] = useState(false);
  const [motorcycleCc, setMotorcycleCc] = useState<number | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [courseDate, setCourseDate] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [uploadingCv, setUploadingCv] = useState(false);
  const [uploadCvError, setUploadCvError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCandidateProfile() {
      setIsLoading(true);
      const supabase = createClient();

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

          const { data: candProfile } = await supabase
            .from("candidate_profiles")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

          const { data: candCourse } = await supabase
            .from("candidate_courses")
            .select("*")
            .eq("candidate_id", user.id)
            .order("completion_date", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (profile) {
            if (profile.full_name) setFullName(profile.full_name);
            if (profile.phone_whatsapp) setPhone(profile.phone_whatsapp);
          } else if (user.user_metadata?.full_name) {
            setFullName(user.user_metadata.full_name);
          }

          if (candProfile) {
            if (candProfile.national_id) setNationalId(candProfile.national_id);
            if (candProfile.city) setCity(candProfile.city);
            if (candProfile.locality_neighborhood || candProfile.locality) {
              setLocality(candProfile.locality_neighborhood || candProfile.locality);
            }
            if (candProfile.primary_role) {
              setPrimaryRole(normalizeSecurityRole(candProfile.primary_role));
            }
            if (candProfile.years_experience !== undefined) setYearsExperience(candProfile.years_experience);
            if (candProfile.has_military_booklet !== undefined) setHasMilitaryBooklet(candProfile.has_military_booklet);
            if (candProfile.has_own_motorcycle !== undefined) setHasMotorcycle(candProfile.has_own_motorcycle);
            if (candProfile.motorcycle_cc) setMotorcycleCc(candProfile.motorcycle_cc);
            if (candProfile.resume_pdf_url) setResumeUrl(candProfile.resume_pdf_url);
          }

          if (candCourse?.completion_date) {
            setCourseDate(candCourse.completion_date);
          }
        }
      } catch (err) {
        console.error("Error loading candidate profile:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadCandidateProfile();
  }, []);

  const handleSave = async () => {
    if (honeypot || isSaving) return;
    setIsSaving(true);
    setUploadCvError(null);
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from("profiles")
          .upsert(
            {
              id: user.id,
              role: "candidate",
              full_name: fullName.trim() || user.user_metadata?.full_name || "Personal Operativo",
              phone_whatsapp: phone.trim(),
              email: user.email || "",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          );

        const normalizedRole = normalizeSecurityRole(primaryRole);

        const { error: candErr } = await supabase
          .from("candidate_profiles")
          .upsert(
            {
              user_id: user.id,
              national_id: nationalId.trim() || `TEMP-${user.id.slice(0, 8)}`,
              city,
              locality_neighborhood: locality,
              primary_role: normalizedRole,
              years_experience: yearsExperience,
              has_military_booklet: hasMilitaryBooklet,
              has_own_motorcycle: hasMotorcycle,
              motorcycle_cc: hasMotorcycle ? motorcycleCc : null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );

        if (candErr) {
          throw new Error(`Error actualizando perfil: ${candErr.message}`);
        }
      }

      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch (err: any) {
      console.error("Error saving profile:", err);
      setUploadCvError(err.message || "Error al guardar los cambios del perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDirectResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadCvError(null);
    setUploadingCv(true);
    const supabase = createClient();

    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user) {
        throw new Error("No hay una sesión activa de usuario.");
      }

      // 1. Construir ruta limpia sin caracteres especiales:
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `cvs/${user.id}/${Date.now()}_${cleanFileName}`;

      // 2. Subir al bucket 'documents':
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw new Error(`Error en Supabase Storage: ${uploadError.message}`);
      }

      // 3. Obtener URL pública:
      const {
        data: { publicUrl },
      } = supabase.storage.from("documents").getPublicUrl(filePath);

      // 4. Desacoplar subida de PDF: si la fila en candidate_profiles ya existe,
      // hacer únicamente update de resume_pdf_url y updated_at sin forzar primary_role.
      const { data: existingCandProfile } = await supabase
        .from("candidate_profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingCandProfile) {
        const { error: updateErr } = await supabase
          .from("candidate_profiles")
          .update({
            resume_pdf_url: publicUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        if (updateErr) {
          throw new Error(`Error actualizando URL de Hoja de Vida: ${updateErr.message}`);
        }
      } else {
        // Garantizar primero la fila en public.profiles por llave foránea
        await supabase.from("profiles").upsert(
          {
            id: user.id,
            role: "candidate",
            full_name: fullName.trim() || user.user_metadata?.full_name || "Personal Operativo",
            phone_whatsapp: phone.trim() || user.user_metadata?.phone_whatsapp || "",
            email: user.email || "",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

        const { error: insertErr } = await supabase.from("candidate_profiles").insert({
          user_id: user.id,
          national_id: nationalId.trim() || `TEMP-${user.id.slice(0, 8)}`,
          city: city || "Bogotá D.C.",
          locality_neighborhood: locality || "",
          primary_role: normalizeSecurityRole(primaryRole),
          years_experience: yearsExperience,
          has_military_booklet: hasMilitaryBooklet,
          has_own_motorcycle: hasMotorcycle,
          motorcycle_cc: hasMotorcycle ? motorcycleCc : null,
          resume_pdf_url: publicUrl,
          updated_at: new Date().toISOString(),
        });

        if (insertErr) {
          throw new Error(`Error creando perfil operativo: ${insertErr.message}`);
        }
      }

      // 5. Registrar en candidate_documents
      const { error: docErr } = await supabase.from("candidate_documents").insert({
        candidate_id: user.id,
        doc_type: "hoja_de_vida_pdf",
        file_url: publicUrl,
      });

      if (docErr) {
        console.warn("Aviso al registrar en candidate_documents:", docErr);
      }

      setResumeUrl(publicUrl);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch (err: any) {
      console.error("Error subiendo Hoja de Vida:", err);
      setUploadCvError(err.message || "Error al subir el archivo.");
    } finally {
      setUploadingCv(false);
      if (e.target) e.target.value = "";
    }
  };

  // Cálculo dinámico de completitud de Hoja de Vida (0% a 100%)
  const hasPersonalInfo = Boolean(fullName?.trim().length >= 3 && phone?.trim().length >= 7);
  const hasWorkProfile = Boolean(
    primaryRole &&
    city?.trim() &&
    nationalId?.trim() &&
    !nationalId.startsWith("TEMP-") &&
    yearsExperience !== undefined
  );
  const hasCourse = Boolean(courseDate && courseDate.trim().length > 0);
  const hasResume = Boolean(resumeUrl && resumeUrl.trim().length > 0);

  const steps = [
    {
      id: "personal",
      label: "Datos Personales",
      desc: "Nombre completo y WhatsApp",
      done: hasPersonalInfo,
    },
    {
      id: "work",
      label: "Perfil Operativo",
      desc: "Cédula, ciudad y especialidad",
      done: hasWorkProfile,
    },
    {
      id: "course",
      label: "Curso SuperVigilancia",
      desc: "Acreditación y vigencia",
      done: hasCourse,
    },
    {
      id: "resume",
      label: "Hoja de Vida en PDF",
      desc: "Documento adjunto en PDF",
      done: hasResume,
    },
  ];

  const completedStepsCount = steps.filter((s) => s.done).length;
  const completionPercentage = completedStepsCount * 25;

  let nextPrompt = "";
  if (completionPercentage === 100) {
    nextPrompt = "¡Perfil 100% Completo! Tu hoja de vida cuenta con máxima visibilidad ante empresas de seguridad de Colombia.";
  } else if (!hasPersonalInfo) {
    nextPrompt = `Tu perfil está al ${completionPercentage}%. Completa tu nombre y WhatsApp para que las empresas puedan contactarte.`;
  } else if (!hasWorkProfile) {
    nextPrompt = `Tu perfil está al ${completionPercentage}%. Ingresa tu cédula y especialidad operativa para avanzar.`;
  } else if (!hasCourse) {
    nextPrompt = `Tu perfil está al ${completionPercentage}%. Registra la fecha de tu curso SuperVigilancia para validar tu credencial.`;
  } else if (!hasResume) {
    nextPrompt = `Tu perfil está al ${completionPercentage}%. Adjunta tu Hoja de Vida en PDF para alcanzar el 100% y ser contactado 3x más rápido.`;
  }

  return (
    <div className="space-y-6">
      {/* Botón trampa Honeypot anti-spam */}
      <input
        type="text"
        name="company_tax_id_bypass"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
        className="hidden"
      />

      {/* CABECERA ESTILO COMPUTRABAJO */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Mi Hoja de Vida & Perfil Profesional
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#005DA4] bg-[#EAF3FA] px-2.5 py-0.5 rounded-full border border-[#D5E6F5]">
              <Shield className="w-3 h-3 text-[#005DA4]" />
              SuperVigilancia
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestiona tu información operativa, preferencias de turno y documento adjunto en PDF para empresas de seguridad.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {savedNotice && (
            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
              <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> Cambios guardados
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white text-xs font-semibold h-10 px-6 inline-flex items-center gap-2 shadow-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </span>
            ) : (
              <>
                <Save className="w-4 h-4" strokeWidth={2} />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>

      {/* EXECUTIVE COMPLETION PROGRESS BANNER (0% - 100%) ESTILO COMPUTRABAJO */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                completionPercentage === 100
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-[#0B3B70] border-[#0B3B70] text-white"
              }`}
            >
              {completionPercentage === 100 ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600" strokeWidth={2.5} />
              ) : (
                <span className="text-sm font-bold tabular-nums">{completionPercentage}%</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Nivel de Completitud de tu Hoja de Vida
                </h2>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full tabular-nums ${
                    completionPercentage === 100
                      ? "bg-emerald-100/90 text-emerald-800 border border-emerald-200"
                      : "bg-[#EAF3FA] text-[#0B3B70] border border-[#D5E6F5]"
                  }`}
                >
                  {completionPercentage}% de 100%
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-xl">
                {nextPrompt}
              </p>
            </div>
          </div>

          {completionPercentage < 100 && !hasResume && (
            <label className="rounded-full bg-[#EAF3FA] hover:bg-[#D5E6F5] text-[#0B3B70] border border-[#D5E6F5] text-xs h-10 px-4 font-semibold cursor-pointer inline-flex items-center gap-2 shrink-0 self-start sm:self-auto transition-colors shadow-2xs">
              <Upload className="w-4 h-4 text-[#005DA4]" strokeWidth={2} />
              <span>Subir Hoja de Vida (+25%)</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                disabled={uploadingCv}
                onChange={handleDirectResumeUpload}
              />
            </label>
          )}
        </div>

        {/* Progress Bar Container */}
        <div className="space-y-1.5 pt-1">
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                completionPercentage === 100
                  ? "bg-emerald-600"
                  : completionPercentage >= 75
                  ? "bg-[#0B3B70]"
                  : completionPercentage >= 50
                  ? "bg-[#005DA4]"
                  : "bg-amber-500"
              }`}
              style={{ width: `${Math.max(completionPercentage, 5)}%` }}
            />
          </div>
        </div>

        {/* Checklist Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100">
          {steps.map((st) => (
            <div
              key={st.id}
              className={`p-3 rounded-xl border text-xs flex items-center gap-3 transition-colors ${
                st.done
                  ? "bg-[#EAF3FA]/60 border-[#D5E6F5] text-[#0B3B70]"
                  : "bg-slate-50 border-slate-200 text-slate-500"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                  st.done
                    ? "bg-[#005DA4] text-white"
                    : "bg-white border border-slate-300 text-slate-400"
                }`}
              >
                {st.done ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : "+25%"}
              </div>
              <div className="min-w-0">
                <div className="font-bold truncate text-xs leading-tight text-slate-900">
                  {st.label}
                </div>
                <div className="text-[11px] text-slate-500 truncate leading-tight mt-0.5">
                  {st.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2-COLUMN WORKSPACE ESTILO COMPUTRABAJO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: EDITABLE DETAILS (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section 1: Contact */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <User className="w-4 h-4 text-[#005DA4]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Datos de Identificación y Contacto
              </h3>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  placeholder="Ingrese sus nombres y apellidos"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Cédula de Ciudadanía
                  </label>
                  <input
                    type="text"
                    placeholder="Número de cédula"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-sm font-semibold text-slate-900 font-mono tabular-nums placeholder:text-slate-400 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    WhatsApp de Contacto
                  </label>
                  <input
                    type="tel"
                    placeholder="Ej. 3001234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-sm font-semibold text-slate-900 font-mono tabular-nums placeholder:text-slate-400 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Ciudad de Residencia
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all cursor-pointer"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Barrio / Localidad
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Suba, Kennedy, Poblado..."
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Role & Experience */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Briefcase className="w-4 h-4 text-[#005DA4]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Cargo y Dotación Operativa
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Especialidad Principal en Seguridad:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SECURITY_ROLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPrimaryRole(opt.value)}
                      className={`p-2.5 rounded-xl text-xs font-semibold border text-left transition-all ${
                        normalizeSecurityRole(primaryRole) === opt.value
                          ? "bg-[#0B3B70] text-white border-[#0B3B70] shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:border-[#005DA4] hover:bg-[#EAF3FA]/30"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Años de Experiencia en el Sector
                </label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(parseInt(e.target.value, 10) || 0)}
                  className="w-full sm:w-48 h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-sm font-bold text-slate-900 font-mono tabular-nums focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Libreta Militar</span>
                    <span className="text-[11px] text-slate-500">Documento de primera o segunda clase</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHasMilitaryBooklet(!hasMilitaryBooklet)}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors flex items-center shrink-0 ${
                      hasMilitaryBooklet ? "bg-[#005DA4] justify-end" : "bg-slate-300 justify-start"
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                  </button>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Moto Propia</span>
                    <span className="text-[11px] text-slate-500">Para cargos móviles o supervisión</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHasMotorcycle(!hasMotorcycle)}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors flex items-center shrink-0 ${
                      hasMotorcycle ? "bg-[#005DA4] justify-end" : "bg-slate-300 justify-start"
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Document Repository */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <FileText className="w-4 h-4 text-[#005DA4]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Archivos y Documentos Almacenados
              </h3>
            </div>

            {resumeUrl ? (
              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-xl border border-[#D5E6F5] bg-[#EAF3FA]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#D5E6F5] flex items-center justify-center text-[#0B3B70] shrink-0 shadow-2xs">
                      <FileCheck className="w-5 h-5 text-[#005DA4]" strokeWidth={2} />
                    </div>
                    <div>
                      <strong className="text-slate-900 font-bold block text-sm">Hoja de Vida Adjunta (PDF)</strong>
                      <span className="text-xs text-slate-500">Documento activo consultable por empresas de seguridad</span>
                    </div>
                  </div>

                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full text-xs h-9 px-4 font-semibold text-[#005DA4] hover:text-[#0B3B70] border border-[#D5E6F5] bg-white hover:bg-slate-50 inline-flex items-center justify-center gap-1.5 transition-all shrink-0 shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Ver / Descargar Hoja de Vida cargada
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl border border-dashed border-slate-300 text-center text-slate-400 text-xs bg-slate-50/50">
                <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-700 text-sm">Aún no has adjuntado tu Hoja de Vida en PDF</p>
                <p className="text-xs text-slate-500 mt-0.5">Sube tu documento para que las empresas verifiquen tu trayectoria completa.</p>
              </div>
            )}

            {/* Error visible si falla la subida */}
            {uploadCvError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="font-medium">{uploadCvError}</p>
              </div>
            )}

            {/* Botón directo para subir o actualizar Hoja de Vida */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <label className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold cursor-pointer h-10 px-5 transition-all shadow-2xs">
                <Upload className="w-4 h-4 text-[#005DA4]" strokeWidth={2} />
                <span>
                  {uploadingCv
                    ? "Subiendo archivo a Storage..."
                    : resumeUrl
                    ? "Reemplazar Hoja de Vida (PDF)"
                    : "Subir Hoja de Vida (PDF)"}
                </span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  disabled={uploadingCv}
                  onChange={handleDirectResumeUpload}
                />
              </label>

              <Link
                href="/guarda/onboarding"
                className="text-xs text-[#005DA4] hover:text-[#0B3B70] hover:underline font-semibold"
              >
                o configurar en el Asistente de Onboarding →
              </Link>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE CREDENTIAL & COURSE WIDGET (5 cols - Sticky) */}
        <div className="lg:col-span-5 sticky top-20 space-y-5">
          {/* SEMAPHORE CARD */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Estado de Credencial SuperVigilancia
            </span>
            <CourseSemaphoreBanner
              completionDate={courseDate || new Date().toISOString().split("T")[0]}
              candidateName={fullName || "Aspirante"}
              city={city}
            />
          </div>

          {/* DIGITAL CARD ESTILO FUERZAVERIFICADA CORPORATIVA */}
          <div className="rounded-2xl bg-gradient-to-br from-[#0B3B70] to-[#082B54] text-white p-6 shadow-md border border-[#082B54] space-y-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#FFE066]" strokeWidth={2} />
                <span className="text-sm font-bold tracking-tight text-white">
                  Fuerza<span className="text-[#FFE066]">Verificada</span>
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Auditado SuperVigilancia
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-bold text-white text-lg shrink-0">
                {fullName ? fullName.charAt(0).toUpperCase() : <User className="w-6 h-6 text-white/70" />}
              </div>
              <div className="min-w-0">
                <h4 className="text-base font-bold text-white tracking-tight truncate">
                  {fullName || "Nombre del Aspirante"}
                </h4>
                <div className="text-xs text-[#FFE066] font-semibold mt-0.5">
                  {formatSecurityRoleLabel(primaryRole)}
                </div>
                <div className="text-[11px] text-white/70 font-mono tabular-nums mt-0.5">
                  {nationalId ? `C.C. ${nationalId}` : "Sin Cédula registrada"} • {city}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 text-xs text-white/80 grid grid-cols-3 gap-2 text-center tabular-nums">
              <div className="bg-white/5 rounded-xl p-2 border border-white/10">
                <span className="text-[10px] text-white/60 block">Experiencia</span>
                <strong className="text-white font-bold text-sm">{yearsExperience} años</strong>
              </div>
              <div className="bg-white/5 rounded-xl p-2 border border-white/10">
                <span className="text-[10px] text-white/60 block">Libreta</span>
                <strong className="text-white font-bold text-sm">{hasMilitaryBooklet ? "Sí" : "No"}</strong>
              </div>
              <div className="bg-white/5 rounded-xl p-2 border border-white/10">
                <span className="text-[10px] text-white/60 block">Moto</span>
                <strong className="text-white font-bold text-sm">{hasMotorcycle ? `${motorcycleCc || 150}cc` : "No"}</strong>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] text-white/60 border-t border-white/10">
              <span>Identificador Seguro:</span>
              <span className="font-mono text-white/80 font-semibold">FV-COL-OP</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
