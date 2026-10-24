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
} from "lucide-react";
import { CourseSemaphoreBanner } from "@/components/guarda/CourseSemaphoreBanner";
import { SecurityRoleType, WorkExperienceItem } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

const SECURITY_ROLES: SecurityRoleType[] = [
  "Vigilante Fijo",
  "Vigilante Móvil",
  "Escolta VIP",
  "Escolta Mercancía",
  "Supervisor Motorizado",
  "Operador Medios Tecnológicos",
  "Manejador Canino",
  "Inspector de Seguridad",
];

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
  const [primaryRole, setPrimaryRole] = useState<SecurityRoleType>("Vigilante Fijo");
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
    setLoading(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      let uploadedResumeUrl: string | null = null;
      let uploadedCourseUrl: string | null = null;
      let uploadedCedulaUrl: string | null = null;

      if (userId) {
        // 1. Update public.profiles
        await supabase
          .from("profiles")
          .update({
            full_name: fullName.trim() || "Personal Operativo",
            phone_whatsapp: phone.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        // 2. Upload files to Storage bucket 'documents' if provided
        const uploadDoc = async (file: File, folder: string) => {
          try {
            const ext = file.name.split(".").pop() || "pdf";
            const path = `${folder}/${userId}-${Date.now()}.${ext}`;
            const { data: upData, error: upErr } = await supabase.storage
              .from("documents")
              .upload(path, file, { upsert: true });
            if (!upErr && upData) {
              const { data: pub } = supabase.storage
                .from("documents")
                .getPublicUrl(upData.path);
              return pub.publicUrl;
            }
          } catch {}
          return null;
        };

        if (resumeFile) uploadedResumeUrl = await uploadDoc(resumeFile, "resumes");
        if (courseFile) uploadedCourseUrl = await uploadDoc(courseFile, "courses");
        if (cedulaFile) uploadedCedulaUrl = await uploadDoc(cedulaFile, "id_cards");

        // 3. Upsert candidate_profiles
        await supabase.from("candidate_profiles").upsert(
          {
            user_id: userId,
            national_id: nationalId.trim() || `CC-${userId.slice(0, 8)}`,
            city,
            locality_neighborhood: locality,
            primary_role: primaryRole,
            years_experience: yearsExperience,
            has_military_booklet: hasMilitaryBooklet,
            has_own_motorcycle: hasMotorcycle,
            motorcycle_cc: hasMotorcycle ? motorcycleCc : null,
            available_immediately: true,
            resume_pdf_url: uploadedResumeUrl,
            work_experience_json: experiences as any,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

        // 4. Insert/update candidate_courses if completion date was provided
        if (courseCompletionDate) {
          await supabase.from("candidate_courses").insert({
            candidate_id: userId,
            course_name: `Reentrenamiento - ${primaryRole}`,
            academy_name: courseAcademy.trim() || "Academia Autorizada SuperVigilancia",
            completion_date: courseCompletionDate,
            credential_number: credencialSupervigilancia.trim() || null,
            diploma_pdf_url: uploadedCourseUrl,
            is_verified: false,
          });
        }

        // 5. Record documents in candidate_documents
        const docsToInsert: any[] = [];
        if (resumeFile && uploadedResumeUrl) {
          docsToInsert.push({
            candidate_id: userId,
            document_type: "hoja_de_vida_pdf",
            file_name: resumeFile.name,
            file_url: uploadedResumeUrl,
          });
        }
        if (courseFile && uploadedCourseUrl) {
          docsToInsert.push({
            candidate_id: userId,
            document_type: "diploma_curso",
            file_name: courseFile.name,
            file_url: uploadedCourseUrl,
          });
        }
        if (cedulaFile && uploadedCedulaUrl) {
          docsToInsert.push({
            candidate_id: userId,
            document_type: "cedula_ciudadania",
            file_name: cedulaFile.name,
            file_url: uploadedCedulaUrl,
          });
        }
        if (docsToInsert.length > 0) {
          await supabase.from("candidate_documents").insert(docsToInsert);
        }
      }

      if (typeof window !== "undefined") {
        localStorage.setItem(
          "fv_candidate_profile",
          JSON.stringify({
            full_name: fullName,
            national_id: nationalId,
            phone,
            city,
            locality,
            primary_role: primaryRole,
            years_experience: yearsExperience,
            has_military_booklet: hasMilitaryBooklet,
            has_own_motorcycle: hasMotorcycle,
            motorcycle_cc: motorcycleCc,
            available_immediately: true,
            course_completion_date: courseCompletionDate,
            course_academy: courseAcademy,
            credencial_supervigilancia: credencialSupervigilancia,
          })
        );
      }

      router.push("/guarda/vacantes");
    } catch {
      router.push("/guarda/vacantes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Configuración de Hoja de Vida y Credenciales
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            Complete sus datos operativos para activar la compatibilidad automática con empresas de seguridad.
          </p>
        </div>

        {/* Progress Stepper Tabs */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                step === s
                  ? "bg-slate-900 text-white border-slate-900 shadow-subtle"
                  : step > s
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: STEPS */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-subtle space-y-6">
          
          {/* STEP 1: DATOS Y ROL */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Paso 1: Identificación y Perfil Operativo
                </h3>
                <p className="text-xs text-slate-500">
                  Datos de contacto e información clave para postulaciones armadas o motorizadas.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nombre Completo (como en Cédula)
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Cédula de Ciudadanía
                    </label>
                    <input
                      type="text"
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      WhatsApp de Contacto
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Ciudad Sede
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                    >
                      <option value="Bogotá D.C.">Bogotá D.C.</option>
                      <option value="Medellín">Medellín</option>
                      <option value="Cali">Cali</option>
                      <option value="Barranquilla">Barranquilla</option>
                      <option value="Bucaramanga">Bucaramanga</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Barrio / Localidad
                    </label>
                    <input
                      type="text"
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                      placeholder="Ej: Suba, Fontibón"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                    />
                  </div>
                </div>

                {/* ROLE CHIPS SELECTION */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">
                    Especialidad Principal en Seguridad Privada:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SECURITY_ROLES.map((role) => {
                      const isSel = primaryRole === role;
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setPrimaryRole(role)}
                          className={`p-2.5 rounded-lg text-xs font-medium border text-left transition-all ${
                            isSel
                              ? "bg-slate-900 text-white border-slate-900 shadow-subtle font-semibold"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {role}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Years Experience */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Años de Experiencia en el Sector:{" "}
                    <strong className="text-slate-900 font-mono tabular-nums">{yearsExperience} años</strong>
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[0, 1, 2, 3, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setYearsExperience(val)}
                        className={`py-2 rounded-lg text-xs font-semibold border ${
                          yearsExperience === val
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        {val === 5 ? "5+ años" : `${val} a`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Military booklet & motorcycle switches */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">Libreta Militar</span>
                      <span className="text-[10px] text-slate-400">1ra o 2da clase</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHasMilitaryBooklet(!hasMilitaryBooklet)}
                      className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center ${
                        hasMilitaryBooklet ? "bg-emerald-600 justify-end" : "bg-slate-300 justify-start"
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-subtle" />
                    </button>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">Moto Propia</span>
                      <span className="text-[10px] text-slate-400">{hasMotorcycle ? `${motorcycleCc} cc` : "No"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHasMotorcycle(!hasMotorcycle)}
                      className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center ${
                        hasMotorcycle ? "bg-amber-500 justify-end" : "bg-slate-300 justify-start"
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-subtle" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-primary w-full text-xs font-semibold"
                >
                  Continuar al Paso 2: Curso SuperVigilancia
                  <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SEMÁFORO DE CURSO */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Paso 2: Validación del Curso de Seguridad
                </h3>
                <p className="text-xs text-slate-500">
                  Comprobación del periodo de vigencia legal para servicios armados o fijos.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Fecha de Realización del Último Curso
                  </label>
                  <input
                    type="date"
                    value={courseCompletionDate}
                    onChange={(e) => setCourseCompletionDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>

                {/* Banner */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Diagnóstico de Vigencia en Vivo:
                  </label>
                  <CourseSemaphoreBanner
                    completionDate={courseCompletionDate}
                    candidateName={fullName}
                    city={city}
                    courseName={`Curso de ${primaryRole}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Academia de Seguridad Emisora
                  </label>
                  <input
                    type="text"
                    value={courseAcademy}
                    onChange={(e) => setCourseAcademy(e.target.value)}
                    placeholder="Ej: Academia Nacional de Seguridad / Escovigil"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Número de Credencial SuperVigilancia (si ya fue expedida)
                  </label>
                  <input
                    type="text"
                    value={credencialSupervigilancia}
                    onChange={(e) => setCredencialSupervigilancia(e.target.value)}
                    placeholder="SV-89421"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary w-1/3 text-xs"
                >
                  <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="btn-primary w-2/3 text-xs font-semibold"
                >
                  Continuar al Paso 3: Hoja de Vida
                  <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: HOJA DE VIDA & EXPERIENCIA */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Paso 3: Soportes y Hoja de Vida Digital
                </h3>
                <p className="text-xs text-slate-500">
                  Adjunte su archivo PDF tradicional para que las empresas puedan descargarlo directamente.
                </p>
              </div>

              {/* UPLOAD ZONE */}
              <div className="p-6 rounded-xl border-2 border-dashed border-slate-300 hover:border-slate-400 text-center space-y-2 bg-slate-50/50 transition-all">
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
                  <Upload className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    Subir Hoja de Vida (PDF o Word)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Arrastre su archivo o selecciónelo de su dispositivo
                  </p>
                </div>
                <label className="inline-flex items-center gap-1.5 btn-secondary text-xs cursor-pointer py-1.5 px-3">
                  <FileText className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
                  {resumeFile ? resumeFile.name : "Seleccionar Archivo"}
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
                  <div className="text-[11px] text-emerald-600 font-medium flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
                    Archivo listo para carga: {resumeFile.name}
                  </div>
                )}
              </div>

              {/* EXPERIENCIAS */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Experiencia Laboral
                </h4>
                <div className="space-y-2">
                  {experiences.map((exp, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <strong className="text-slate-900 block">{exp.company}</strong>
                        <span className="text-slate-500">{exp.role} • {exp.startDate}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveExperience(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Quick Add */}
                <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <input
                      type="text"
                      placeholder="Empresa de Seguridad"
                      value={newCompany}
                      onChange={(e) => setNewCompany(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900"
                    />
                    <input
                      type="text"
                      placeholder="Cargo (Ej: Escolta)"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Años (Ej: 2022 - 2024)"
                      value={newDates}
                      onChange={(e) => setNewDates(e.target.value)}
                      className="w-2/3 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={handleAddExperience}
                      className="w-1/3 btn-secondary text-xs py-1"
                    >
                      + Agregar
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-secondary w-1/3 text-xs"
                >
                  <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
                  Atrás
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCompleteOnboarding}
                  className="btn-emerald w-2/3 text-xs font-semibold"
                >
                  {loading ? (
                    "Guardando..."
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
                      Finalizar y Acceder al Feed
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: LIVE DIGITAL CREDENTIAL & CV PREVIEW (5 cols - Sticky) */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Vista Previa de Credencial Digital
          </div>

          {/* Precision Security Card Mockup */}
          <div className="rounded-2xl bg-slate-900 text-white p-6 shadow-elevated border border-slate-800 space-y-5 relative overflow-hidden">
            {/* Top Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400 fill-amber-500/20" strokeWidth={1.75} />
                <span className="text-xs font-bold tracking-tight text-white">
                  Fuerza<span className="text-amber-400">Verificada</span>
                </span>
              </div>
              <span className="badge-emerald text-[9px] py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Validada SuperVigilancia
              </span>
            </div>

            {/* Officer Details */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400 text-lg shrink-0">
                {fullName.charAt(0)}
              </div>
              <div>
                <h4 className="text-base font-bold text-white leading-tight">
                  {fullName}
                </h4>
                <div className="text-xs font-semibold text-amber-400 font-mono mt-0.5">
                  {primaryRole}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  C.C. {nationalId} • {city}
                </div>
              </div>
            </div>

            {/* Operational Checklist */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Experiencia</span>
                <span className="font-bold text-white font-mono tabular-nums">{yearsExperience} años</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Libreta Militar</span>
                <span className="font-bold text-white">{hasMilitaryBooklet ? "Al día" : "Pendiente"}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Vehículo</span>
                <span className="font-bold text-white">{hasMotorcycle ? `Moto ${motorcycleCc}cc` : "Sin vehículo"}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Credencial SV</span>
                <span className="font-bold text-amber-400 font-mono">{credencialSupervigilancia}</span>
              </div>
            </div>

            {/* Security Guarantee Seal */}
            <div className="pt-2 text-[10px] text-slate-400 text-center border-t border-slate-800 flex items-center justify-center gap-1.5">
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.75} />
              <span>Verificación de identidad bajo estándar Ley 1581</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
