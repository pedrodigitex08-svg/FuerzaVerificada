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
} from "lucide-react";
import { CourseSemaphoreBanner } from "@/components/guarda/CourseSemaphoreBanner";
import { SecurityRoleType } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

const SECURITY_ROLES: SecurityRoleType[] = [
  "Vigilante Fijo",
  "Vigilante Móvil",
  "Escolta VIP",
  "Escolta Mercancía",
  "Supervisor Motorizado",
  "Operador Medios Tecnológicos",
  "Manejador Canino",
];

export default function PerfilGuardaPage() {
  const [nationalId, setNationalId] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Bogotá D.C.");
  const [locality, setLocality] = useState("");
  const [primaryRole, setPrimaryRole] = useState<SecurityRoleType>("Vigilante Fijo");
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
            if (candProfile.primary_role) setPrimaryRole(candProfile.primary_role);
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
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from("profiles")
          .update({
            full_name: fullName,
            phone_whatsapp: phone,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        await supabase
          .from("candidate_profiles")
          .upsert(
            {
              user_id: user.id,
              national_id: nationalId.trim() || `TEMP-${user.id.slice(0, 8)}`,
              city,
              locality_neighborhood: locality,
              primary_role: primaryRole,
              years_experience: yearsExperience,
              has_military_booklet: hasMilitaryBooklet,
              has_own_motorcycle: hasMotorcycle,
              motorcycle_cc: hasMotorcycle ? motorcycleCc : null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
      }

      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch (err) {
      console.error("Error saving profile:", err);
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
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw new Error(`Error en Supabase Storage: ${uploadError.message}`);
      }

      // 3. Obtener URL pública:
      const {
        data: { publicUrl },
      } = supabase.storage.from("documents").getPublicUrl(filePath);

      // 4. Asegurar/actualizar candidate_profiles con resume_pdf_url
      const { error: profileErr } = await supabase.from("candidate_profiles").upsert(
        {
          user_id: user.id,
          national_id: nationalId.trim() || `TEMP-${user.id.slice(0, 8)}`,
          city,
          locality_neighborhood: locality,
          primary_role: primaryRole,
          years_experience: yearsExperience,
          has_military_booklet: hasMilitaryBooklet,
          has_own_motorcycle: hasMotorcycle,
          motorcycle_cc: hasMotorcycle ? motorcycleCc : null,
          resume_pdf_url: publicUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      if (profileErr) {
        throw new Error(`Error actualizando perfil: ${profileErr.message}`);
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
            Mi Perfil & Hoja de Vida Profesional
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            Actualice su información operativa, preferencias de turno y documentos adjuntos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedNotice && (
            <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> Cambios guardados
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary text-xs h-9 px-4 font-medium inline-flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Guardando...
              </span>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" strokeWidth={1.75} />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: EDITABLE DETAILS (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section 1: Contact */}
          <div className="bg-white border border-slate-200/90 rounded-lg p-6 shadow-subtle space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Datos de Identificación y Contacto
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  placeholder="Ingrese sus nombres y apellidos"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-10 bg-white border border-slate-200/90 rounded-md px-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Cédula
                  </label>
                  <input
                    type="text"
                    placeholder="Número de cédula"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    className="w-full h-10 bg-white border border-slate-200/90 rounded-md px-3.5 text-sm text-slate-900 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="Ej. 3001234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-10 bg-white border border-slate-200/90 rounded-md px-3.5 text-sm text-slate-900 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Ciudad
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-10 bg-white border border-slate-200/90 rounded-md px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
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
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Barrio / Localidad
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Suba, Kennedy, Chapinero..."
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    className="w-full h-10 bg-white border border-slate-200/90 rounded-md px-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Role & Experience */}
          <div className="bg-white border border-slate-200/90 rounded-lg p-6 shadow-subtle space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Cargo y Dotación Operativa
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  Especialidad Principal:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SECURITY_ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setPrimaryRole(role)}
                      className={`p-2 rounded-md text-xs font-medium border text-left transition-colors ${
                        primaryRole === role
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-slate-50 text-slate-700 border-slate-200/90 hover:bg-slate-100"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Años de Experiencia en Seguridad
                </label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(parseInt(e.target.value, 10) || 0)}
                  className="w-full sm:w-40 h-10 bg-white border border-slate-200/90 rounded-md px-3.5 text-sm text-slate-900 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div className="p-3 rounded-md border border-slate-200/80 bg-slate-50 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">Libreta Militar</span>
                  <button
                    type="button"
                    onClick={() => setHasMilitaryBooklet(!hasMilitaryBooklet)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center ${
                      hasMilitaryBooklet ? "bg-emerald-600 justify-end" : "bg-slate-300 justify-start"
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>

                <div className="p-3 rounded-md border border-slate-200/80 bg-slate-50 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">Moto Propia</span>
                  <button
                    type="button"
                    onClick={() => setHasMotorcycle(!hasMotorcycle)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center ${
                      hasMotorcycle ? "bg-amber-500 justify-end" : "bg-slate-300 justify-start"
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Document Repository */}
          <div className="bg-white border border-slate-200/90 rounded-lg p-6 shadow-subtle space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Archivos y Documentos Almacenados
            </h3>

            {resumeUrl ? (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-lg border border-slate-200/80 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-md bg-white border border-slate-200/90 flex items-center justify-center text-slate-700 shrink-0">
                      <FileText className="w-4 h-4 text-slate-700" strokeWidth={1.75} />
                    </div>
                    <div>
                      <strong className="text-slate-900 font-semibold block">Hoja de Vida Adjunta (PDF)</strong>
                      <span className="text-[11px] text-slate-500">Documento activo consultable por reclutadores</span>
                    </div>
                  </div>

                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-xs h-8 px-3 font-semibold text-emerald-700 hover:text-emerald-900 border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 inline-flex items-center justify-center gap-1.5 transition-colors shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Ver / Descargar Hoja de Vida cargada
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                <FileText className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                <p>Aún no has adjuntado tu Hoja de Vida en PDF.</p>
              </div>
            )}

            {/* Error visible si falla la subida */}
            {uploadCvError && (
              <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p>{uploadCvError}</p>
              </div>
            )}

            {/* Botón directo para subir o actualizar Hoja de Vida */}
            <div className="pt-1 flex flex-col sm:flex-row items-center gap-3">
              <label className="w-full sm:w-auto inline-flex items-center justify-center gap-2 btn-secondary text-xs cursor-pointer h-9 px-3.5">
                <Upload className="w-3.5 h-3.5 text-slate-600" strokeWidth={1.75} />
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
                className="text-xs text-slate-600 hover:text-slate-900 hover:underline"
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
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Estado de Credencial SuperVigilancia
            </span>
            <CourseSemaphoreBanner
              completionDate={courseDate || new Date().toISOString().split("T")[0]}
              candidateName={fullName || "Aspirante"}
              city={city}
            />
          </div>

          {/* DIGITAL CARD */}
          <div className="rounded-lg bg-slate-900 text-white p-5 shadow-card border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" strokeWidth={1.75} />
                <span className="text-xs font-semibold tracking-tight text-white">
                  Fuerza<span className="text-emerald-400">Verificada</span>
                </span>
              </div>
              <span className="badge-emerald text-[9px] py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Auditado
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center font-semibold text-emerald-400 text-base">
                {fullName ? fullName.charAt(0).toUpperCase() : <User className="w-5 h-5 text-slate-400" />}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white tracking-tight">
                  {fullName || "Nombre del Aspirante"}
                </h4>
                <div className="text-xs text-emerald-400 font-mono mt-0.5">{primaryRole}</div>
                <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                  {nationalId ? `C.C. ${nationalId}` : "Sin Cédula"} • {city}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between tabular-nums">
              <span>Años de exp: <strong className="text-white font-semibold">{yearsExperience}</strong></span>
              <span>Libreta: <strong className="text-white font-semibold">{hasMilitaryBooklet ? "Sí" : "No"}</strong></span>
              <span>Moto: <strong className="text-white font-semibold">{hasMotorcycle ? `${motorcycleCc || 150}cc` : "No"}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
