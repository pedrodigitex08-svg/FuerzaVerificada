"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  User,
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
  Bike,
  Check,
  BadgeCheck,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { CourseSemaphoreBanner } from "@/components/guarda/CourseSemaphoreBanner";
import { SecurityRoleType, WorkExperienceItem } from "@/types/database";
import {
  SECURITY_ROLE_OPTIONS,
  normalizeSecurityRole,
  formatSecurityRoleLabel,
} from "@/lib/utils/roleNormalizer";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);

  // STEP 1 STATE
  const [fullName, setFullName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Bogotá D.C.");
  const [locality, setLocality] = useState("");
  const [primaryRole, setPrimaryRole] = useState<SecurityRoleType>("vigilante_fijo");
  const [yearsExperience, setYearsExperience] = useState(0);
  const [hasMilitaryBooklet, setHasMilitaryBooklet] = useState(false);
  const [hasMotorcycle, setHasMotorcycle] = useState(false);
  const [motorcycleCc, setMotorcycleCc] = useState<number | null>(null);

  // STEP 2 STATE
  const [courseCompletionDate, setCourseCompletionDate] = useState("");
  const [courseAcademy, setCourseAcademy] = useState("");
  const [credencialSupervigilancia, setCredencialSupervigilancia] = useState("");

  // STEP 3 STATE
  const [experiences, setExperiences] = useState<WorkExperienceItem[]>([]);
  const [newCompany, setNewCompany] = useState("");
  const [newRole, setNewRole] = useState("");

  useEffect(() => {
    async function loadInitialUserData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, phone_whatsapp")
            .eq("id", user.id)
            .maybeSingle();

          if (profile?.full_name) setFullName(profile.full_name);
          else if (user.user_metadata?.full_name) setFullName(user.user_metadata.full_name);

          if (profile?.phone_whatsapp) setPhone(profile.phone_whatsapp);
          else if (user.user_metadata?.phone_whatsapp) setPhone(user.user_metadata.phone_whatsapp);

          if (user.user_metadata?.primary_role) {
            setPrimaryRole(normalizeSecurityRole(user.user_metadata.primary_role));
          }

          if (user.user_metadata?.city) {
            setCity(user.user_metadata.city);
          }

          const { data: candProfile } = await supabase
            .from("candidate_profiles")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

          if (candProfile) {
            if (candProfile.national_id && !candProfile.national_id.startsWith("CC-")) {
              setNationalId(candProfile.national_id);
            }
            if (candProfile.city) setCity(candProfile.city);
            if (candProfile.locality_neighborhood) setLocality(candProfile.locality_neighborhood);
            if (candProfile.primary_role) {
              setPrimaryRole(normalizeSecurityRole(candProfile.primary_role));
            }
            if (candProfile.years_experience !== undefined) {
              setYearsExperience(candProfile.years_experience);
            }
            if (candProfile.has_military_booklet !== undefined) {
              setHasMilitaryBooklet(candProfile.has_military_booklet);
            }
            if (candProfile.has_own_motorcycle !== undefined) {
              setHasMotorcycle(candProfile.has_own_motorcycle);
            }
            if (candProfile.motorcycle_cc) {
              setMotorcycleCc(candProfile.motorcycle_cc);
            }
            if (candProfile.resume_pdf_url) {
              setExistingResumeUrl(candProfile.resume_pdf_url);
            }
          }
        }
      } catch {}
    }

    loadInitialUserData();
  }, [supabase]);
  const [newDates, setNewDates] = useState("");

  // Files
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [courseFile, setCourseFile] = useState<File | null>(null);
  const [cedulaFile, setCedulaFile] = useState<File | null>(null);
  const [existingResumeUrl, setExistingResumeUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddExperience = () => {
    if (!newCompany || !newRole) return;
    setExperiences([
      ...experiences,
      {
        company: newCompany,
        role: newRole,
        startDate: newDates || "Reciente",
      },
    ]);
    setNewCompany("");
    setNewRole("");
    setNewDates("");
  };

  const handleRemoveExperience = (index: number) => {
    setExperiences(experiences.filter((_, i) => i !== index));
  };

  const handleCompleteOnboarding = async () => {
    setErrorMsg(null);
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        throw new Error("No se detectó una sesión activa. Por favor inicia sesión nuevamente.");
      }
      const userId = authData.user.id;

      let uploadedResumeUrl: string | null = null;
      let uploadedCourseUrl: string | null = null;
      let uploadedCedulaUrl: string | null = null;

      // 1. Upsert public.profiles para garantizar llave foránea antes de candidate_profiles
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: userId,
          role: "candidate",
          full_name: fullName.trim() || "Personal Operativo",
          phone_whatsapp: phone.trim(),
          email: authData.user.email || "",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      if (profileError) {
        console.error("Error al actualizar perfil base:", profileError);
      }

      // 2. Subida real a Supabase Storage (bucket: 'documents')
      const uploadDoc = async (file: File, folder: "cvs" | "courses" | "id_cards") => {
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const filePath = `${folder}/${userId}/${Date.now()}_${cleanFileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, file, { upsert: true });

        if (uploadError) {
          console.error(`Error en Supabase Storage (${folder}):`, uploadError);
          throw new Error(`Error al subir ${file.name} al bucket de documentos: ${uploadError.message}`);
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("documents").getPublicUrl(filePath);

        return publicUrl;
      };

      if (resumeFile) {
        uploadedResumeUrl = await uploadDoc(resumeFile, "cvs");
      }
      if (courseFile) {
        uploadedCourseUrl = await uploadDoc(courseFile, "courses");
      }
      if (cedulaFile) {
        uploadedCedulaUrl = await uploadDoc(cedulaFile, "id_cards");
      }

      const validPrimaryRole = normalizeSecurityRole(primaryRole);
      const roleLabel = formatSecurityRoleLabel(primaryRole);

      const finalResumeUrl = uploadedResumeUrl || existingResumeUrl || null;

      // 3. Verificar si la fila en public.candidate_profiles ya existe:
      const { data: existingCandProfile } = await supabase
        .from("candidate_profiles")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingCandProfile) {
        const { error: updateErr } = await supabase
          .from("candidate_profiles")
          .update({
            national_id: nationalId.trim() || `CC-${userId.slice(0, 8)}`,
            city,
            locality_neighborhood: locality,
            primary_role: validPrimaryRole,
            years_experience: yearsExperience,
            has_military_booklet: hasMilitaryBooklet,
            has_own_motorcycle: hasMotorcycle,
            motorcycle_cc: hasMotorcycle ? motorcycleCc : null,
            available_immediately: true,
            resume_pdf_url: finalResumeUrl,
            work_experience_json: experiences as any,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        if (updateErr) {
          // Respaldo desacoplado exclusivo para guardar resume_pdf_url sin forzar primary_role si hubiese restricción
          if (finalResumeUrl) {
            const { error: fallbackErr } = await supabase
              .from("candidate_profiles")
              .update({
                resume_pdf_url: finalResumeUrl,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", userId);
            if (fallbackErr) {
              throw new Error(`Error guardando expediente del candidato: ${fallbackErr.message}`);
            }
          } else {
            throw new Error(`Error guardando expediente del candidato: ${updateErr.message}`);
          }
        }
      } else {
        const { error: insertErr } = await supabase.from("candidate_profiles").insert({
          user_id: userId,
          national_id: nationalId.trim() || `CC-${userId.slice(0, 8)}`,
          city,
          locality_neighborhood: locality,
          primary_role: validPrimaryRole,
          years_experience: yearsExperience,
          has_military_booklet: hasMilitaryBooklet,
          has_own_motorcycle: hasMotorcycle,
          motorcycle_cc: hasMotorcycle ? motorcycleCc : null,
          available_immediately: true,
          resume_pdf_url: finalResumeUrl,
          work_experience_json: experiences as any,
          updated_at: new Date().toISOString(),
        });

        if (insertErr) {
          throw new Error(`Error guardando expediente del candidato: ${insertErr.message}`);
        }
      }

      // 4. Insert/update candidate_courses si se proporcionó fecha de curso
      if (courseCompletionDate) {
        const compDateObj = new Date(courseCompletionDate);
        compDateObj.setFullYear(compDateObj.getFullYear() + 1);
        const computedExpirationDate = compDateObj.toISOString().split("T")[0];

        const { error: courseError } = await supabase.from("candidate_courses").insert({
          candidate_id: userId,
          course_name: `Reentrenamiento - ${roleLabel}`,
          academy_name: courseAcademy.trim() || "Academia Autorizada SuperVigilancia",
          completion_date: courseCompletionDate,
          expiration_date: computedExpirationDate,
          nro_credencial_supervigilancia: credencialSupervigilancia.trim() || null,
          certificate_file_url: uploadedCourseUrl,
          is_verified_by_admin: false,
        });

        if (courseError) {
          console.warn("Aviso al registrar curso:", courseError);
        }
      }

      // 5. Registrar documento en public.candidate_documents guardando el publicUrl
      const docsToInsert: any[] = [];
      if (uploadedResumeUrl) {
        docsToInsert.push({
          candidate_id: userId,
          doc_type: "hoja_de_vida_pdf",
          file_url: uploadedResumeUrl,
        });
      }
      if (uploadedCourseUrl) {
        docsToInsert.push({
          candidate_id: userId,
          doc_type: "diploma_curso",
          file_url: uploadedCourseUrl,
        });
      }
      if (uploadedCedulaUrl) {
        docsToInsert.push({
          candidate_id: userId,
          doc_type: "cedula_ciudadania",
          file_url: uploadedCedulaUrl,
        });
      }

      if (docsToInsert.length > 0) {
        const { error: docsError } = await supabase.from("candidate_documents").insert(docsToInsert);
        if (docsError) {
          console.warn("Aviso al registrar en candidate_documents:", docsError);
        }
      }

      // Redirigir al feed de vacantes únicamente tras guardar exitosamente
      router.push("/guarda/vacantes");
    } catch (err: any) {
      console.error("Error al completar onboarding:", err);
      setErrorMsg(err.message || "Ocurrió un error al guardar los documentos y el perfil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Configuración de Hoja de Vida y Credenciales
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#005DA4] bg-[#EAF3FA] px-2.5 py-0.5 rounded-full border border-[#D5E6F5]">
              <Sparkles className="w-3 h-3 text-[#005DA4]" />
              Paso a Paso
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-normal">
            Complete sus datos operativos para activar la compatibilidad automática con empresas de seguridad en Colombia.
          </p>
        </div>

        {/* Progress Stepper Tabs */}
        <div className="flex items-center gap-2 shrink-0">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border tabular-nums transition-all ${
                step === s
                  ? "bg-[#0B3B70] text-white border-[#0B3B70] shadow-xs"
                  : step > s
                  ? "bg-[#EAF3FA] text-[#005DA4] border-[#D5E6F5]"
                  : "bg-white text-slate-400 border-slate-200"
              }`}
            >
              <span>{step > s ? "✓" : s}</span>
              <span className="hidden sm:inline">
                {s === 1 ? "Datos" : s === 2 ? "Curso" : "Documentos"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2-COLUMN WORKSPACE: LEFT = FORM STEPS (7 cols), RIGHT = LIVE CREDENTIAL PREVIEW (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: STEPS */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
          
          {/* STEP 1: DATOS Y ROL */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Paso 1: Identificación y Perfil Operativo
                </h3>
                <p className="text-xs text-slate-500">
                  Datos de contacto e información clave para postulaciones armadas o motorizadas.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre Completo (como en Cédula)
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3.5 text-sm text-slate-900 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all shadow-2xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cédula de Ciudadanía
                    </label>
                    <input
                      type="text"
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
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
                      className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3.5 text-sm text-slate-900 font-mono tabular-nums focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                      placeholder="Ej: Suba, Fontibón"
                      className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3.5 text-sm text-slate-900 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                {/* ROLE CHIPS SELECTION */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Especialidad Principal en Seguridad Privada:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SECURITY_ROLE_OPTIONS.map((opt) => {
                      const isSel = normalizeSecurityRole(primaryRole) === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setPrimaryRole(opt.value)}
                          className={`p-2.5 rounded-xl text-xs font-semibold border text-left transition-all ${
                            isSel
                              ? "bg-[#0B3B70] text-white border-[#0B3B70] shadow-xs"
                              : "bg-white text-slate-700 border-slate-200 hover:border-[#005DA4] hover:bg-[#EAF3FA]/30"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Years Experience */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Años de Experiencia en el Sector:{" "}
                    <strong className="text-[#0B3B70] font-bold font-mono tabular-nums">{yearsExperience} años</strong>
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[0, 1, 2, 3, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setYearsExperience(val)}
                        className={`py-2 rounded-xl text-xs font-semibold border tabular-nums transition-all ${
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

                {/* Military booklet & motorcycle switches */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Libreta Militar</span>
                      <span className="text-[10px] text-slate-500">1ra o 2da clase</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHasMilitaryBooklet(!hasMilitaryBooklet)}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors flex items-center ${
                        hasMilitaryBooklet ? "bg-[#005DA4] justify-end" : "bg-slate-300 justify-start"
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Moto Propia</span>
                      <span className="text-[10px] text-slate-500 tabular-nums">{hasMotorcycle ? `${motorcycleCc} cc` : "No"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHasMotorcycle(!hasMotorcycle)}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors flex items-center ${
                        hasMotorcycle ? "bg-amber-500 justify-end" : "bg-slate-300 justify-start"
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white text-xs font-semibold h-11 px-6 w-full flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <span>Continuar al Paso 2: Curso SuperVigilancia</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SEMÁFORO DE CURSO */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Paso 2: Validación del Curso de Seguridad
                </h3>
                <p className="text-xs text-slate-500">
                  Comprobación del periodo de vigencia legal para servicios armados o fijos.
                </p>
              </div>

              <div className="space-y-4">
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

                {/* Banner */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Diagnóstico de Vigencia en Vivo:
                  </label>
                  <CourseSemaphoreBanner
                    completionDate={courseCompletionDate}
                    candidateName={fullName}
                    city={city}
                    courseName={`Curso de ${formatSecurityRoleLabel(primaryRole)}`}
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

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Número de Credencial SuperVigilancia (si ya fue expedida)
                  </label>
                  <input
                    type="text"
                    value={credencialSupervigilancia}
                    onChange={(e) => setCredencialSupervigilancia(e.target.value)}
                    placeholder="SV-89421"
                    className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3.5 text-sm text-slate-900 font-mono tabular-nums focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15 transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-full bg-[#EAF3FA] hover:bg-[#D5E6F5] text-[#0B3B70] border border-[#D5E6F5] text-xs h-11 px-6 font-semibold w-1/3 flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <ArrowLeft className="w-4 h-4" strokeWidth={2} />
                  <span>Atrás</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white text-xs font-semibold h-11 px-6 w-2/3 flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <span>Continuar al Paso 3: Hoja de Vida</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: HOJA DE VIDA & EXPERIENCIA */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Paso 3: Soportes y Hoja de Vida Digital
                </h3>
                <p className="text-xs text-slate-500">
                  Adjunte su archivo PDF tradicional para que las empresas puedan descargarlo directamente.
                </p>
              </div>

              {/* UPLOAD ZONE */}
              <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#005DA4] text-center space-y-2.5 bg-slate-50/50 transition-colors">
                <div className="w-10 h-10 rounded-2xl bg-[#EAF3FA] text-[#0B3B70] flex items-center justify-center mx-auto border border-[#D5E6F5]">
                  <Upload className="w-4 h-4 text-[#005DA4]" strokeWidth={2} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    Subir Hoja de Vida (PDF o Word)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Arrastre su archivo o selecciónelo de su dispositivo
                  </p>
                </div>
                <label className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF3FA] hover:bg-[#D5E6F5] text-[#0B3B70] border border-[#D5E6F5] text-xs font-semibold cursor-pointer h-10 px-4 transition-colors shadow-2xs">
                  <FileText className="w-3.5 h-3.5 text-[#005DA4]" strokeWidth={2} />
                  <span>{resumeFile ? resumeFile.name : "Seleccionar Archivo"}</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setResumeFile(e.target.files[0]);
                    }}
                  />
                </label>
                {resumeFile && (
                  <div className="text-[11px] text-emerald-700 font-semibold flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2.5} />
                    <span>Archivo listo para carga: {resumeFile.name}</span>
                  </div>
                )}
                {existingResumeUrl && !resumeFile && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Hoja de Vida actual cargada en el sistema
                    </span>
                    <a
                      href={existingResumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold underline hover:text-emerald-950 inline-flex items-center gap-1 text-[11px]"
                    >
                      Ver / Descargar archivo <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* EXPERIENCIAS */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Experiencia Laboral
                </h4>
                <div className="space-y-2">
                  {experiences.map((exp, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <strong className="text-slate-900 font-bold block">{exp.company}</strong>
                        <span className="text-slate-500 font-medium">{exp.role} • {exp.startDate}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveExperience(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={2} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Quick Add */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5 shadow-2xs">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <input
                      type="text"
                      placeholder="Empresa de Seguridad"
                      value={newCompany}
                      onChange={(e) => setNewCompany(e.target.value)}
                      className="h-10 bg-white border border-slate-300 rounded-xl px-3 text-xs text-slate-900 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15"
                    />
                    <input
                      type="text"
                      placeholder="Cargo (Ej: Escolta)"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="h-10 bg-white border border-slate-300 rounded-xl px-3 text-xs text-slate-900 focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Años (Ej: 2022 - 2024)"
                      value={newDates}
                      onChange={(e) => setNewDates(e.target.value)}
                      className="w-2/3 h-10 bg-white border border-slate-300 rounded-xl px-3 text-xs text-slate-900 tabular-nums focus:outline-none focus:border-[#005DA4] focus:ring-2 focus:ring-[#005DA4]/15"
                    />
                    <button
                      type="button"
                      onClick={handleAddExperience}
                      className="w-1/3 rounded-full bg-[#EAF3FA] hover:bg-[#D5E6F5] text-[#0B3B70] border border-[#D5E6F5] text-xs font-semibold h-10 transition-colors shadow-2xs"
                    >
                      + Agregar
                    </button>
                  </div>
                </div>
              </div>

              {/* Mensaje de Error Visible si falla la subida o la base de datos */}
              {errorMsg && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" strokeWidth={2} />
                  <div className="space-y-1">
                    <strong className="block font-bold">No fue posible completar el guardado:</strong>
                    <p className="leading-relaxed">{errorMsg}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="rounded-full bg-[#EAF3FA] hover:bg-[#D5E6F5] text-[#0B3B70] border border-[#D5E6F5] text-xs h-11 px-6 font-semibold w-1/3 flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <ArrowLeft className="w-4 h-4" strokeWidth={2} />
                  <span>Atrás</span>
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCompleteOnboarding}
                  className="rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white text-xs font-semibold h-11 px-6 w-2/3 flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Guardando y subiendo archivo...
                    </span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" strokeWidth={2.5} />
                      <span>Finalizar y Acceder al Feed</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: LIVE DIGITAL CREDENTIAL & CV PREVIEW (5 cols - Sticky) */}
        <div className="lg:col-span-5 sticky top-20 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Vista Previa de Credencial Digital
              </span>
              <span className="text-[10px] font-bold text-[#005DA4] bg-[#EAF3FA] px-2.5 py-0.5 rounded-full border border-[#D5E6F5]">
                Validada SuperVigilancia
              </span>
            </div>

            {/* Precision Security Card Mockup estilo Computrabajo */}
            <div className="rounded-2xl bg-white p-5 border-[1.5px] border-[#005DA4] shadow-sm space-y-4">
              {/* Brand Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#0B3B70] flex items-center justify-center text-white">
                    <Shield className="w-4 h-4 text-[#FFE066]" strokeWidth={2} />
                  </div>
                  <span className="text-xs font-bold tracking-tight text-[#0B3B70]">
                    Fuerza<span className="text-[#005DA4]">Verificada</span>
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  ● Activo
                </span>
              </div>

              {/* Officer Details */}
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#EAF3FA] border border-[#D5E6F5] text-[#0B3B70] font-bold text-lg flex items-center justify-center shrink-0">
                  {fullName ? fullName.charAt(0) : "G"}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
                    {fullName || "Nombre del Guarda"}
                  </h4>
                  <div className="text-xs font-semibold text-[#005DA4] mt-0.5">
                    {formatSecurityRoleLabel(primaryRole)}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                    C.C. {nationalId || "Pendiente"} • {city}
                  </div>
                </div>
              </div>

              {/* Operational Checklist */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Experiencia</span>
                  <span className="font-bold text-slate-800 font-mono tabular-nums">{yearsExperience} años</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Libreta Militar</span>
                  <span className="font-bold text-slate-800">{hasMilitaryBooklet ? "Al día" : "Pendiente"}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Vehículo</span>
                  <span className="font-bold text-slate-800 tabular-nums">{hasMotorcycle ? `Moto ${motorcycleCc || 150}cc` : "Sin vehículo"}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Credencial SV</span>
                  <span className="font-bold text-[#005DA4] font-mono tabular-nums truncate block">{credencialSupervigilancia || "Por registrar"}</span>
                </div>
              </div>

              {/* Security Guarantee Seal */}
              <div className="pt-2 text-[11px] text-slate-500 text-center border-t border-slate-100 flex items-center justify-center gap-1.5 font-medium">
                <BadgeCheck className="w-3.5 h-3.5 text-[#005DA4]" strokeWidth={2} />
                <span>Verificación de identidad bajo estándar Ley 1581</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
