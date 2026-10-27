"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileCheck,
  Shield,
  CreditCard,
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  MessageCircle,
  ExternalLink,
  Check,
  BadgeCheck,
  MapPin,
  GraduationCap,
} from "lucide-react";
import { CourseSemaphoreBanner } from "@/components/guarda/CourseSemaphoreBanner";
import { generateAcademyRenewalLink } from "@/lib/utils/whatsappTemplates";
import { createClient } from "@/lib/supabase/client";
import { PartnerAcademy } from "@/types/database";
import { openSecureDocument } from "@/lib/utils/storageSecurity";

export default function DocumentosPage() {
  const [candidateName, setCandidateName] = useState("");
  const [candidateCity, setCandidateCity] = useState("");
  const [courseCompletionDate, setCourseCompletionDate] = useState<string | null>(null);
  const [credencialSupervigilancia, setCredencialSupervigilancia] = useState("Sin registrar");
  const [courseAcademy, setCourseAcademy] = useState("Pendiente de registro");
  const [hasResume, setHasResume] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [hasCourseDiploma, setHasCourseDiploma] = useState(false);
  const [courseDiplomaUrl, setCourseDiplomaUrl] = useState<string | null>(null);
  const [hasIdCard, setHasIdCard] = useState(false);
  const [idCardUrl, setIdCardUrl] = useState<string | null>(null);
  const [partnerAcademies, setPartnerAcademies] = useState<PartnerAcademy[]>([]);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      try {
        // Load active partner academies from Supabase
        const { data: acads } = await supabase
          .from("partner_academies")
          .select("*")
          .eq("is_active", true)
          .order("name", { ascending: true });
        if (acads && acads.length > 0) {
          setPartnerAcademies(acads as PartnerAcademy[]);
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .maybeSingle();

          if (profile?.full_name) {
            setCandidateName(profile.full_name);
          } else if (user.user_metadata?.full_name) {
            setCandidateName(user.user_metadata.full_name);
          }

          const { data: candProfile } = await supabase
            .from("candidate_profiles")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

          if (candProfile) {
            if (candProfile.city) setCandidateCity(candProfile.city);
            if (candProfile.resume_pdf_url) {
              setHasResume(true);
              setResumeUrl(candProfile.resume_pdf_url);
            }
          }

          // Load latest course from public.candidate_courses
          const { data: course } = await supabase
            .from("candidate_courses")
            .select("*")
            .eq("candidate_id", user.id)
            .order("completion_date", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (course) {
            if (course.completion_date) setCourseCompletionDate(course.completion_date);
            const credNum = course.nro_credencial_supervigilancia || course.credential_number;
            if (credNum) setCredencialSupervigilancia(credNum);
            if (course.academy_name) setCourseAcademy(course.academy_name);
            const certUrl = course.certificate_file_url || course.diploma_pdf_url;
            if (certUrl) {
              setHasCourseDiploma(true);
              setCourseDiplomaUrl(certUrl);
            }
          }

          // Load candidate_documents
          const { data: docs } = await supabase
            .from("candidate_documents")
            .select("*")
            .eq("candidate_id", user.id);

          if (docs && docs.length > 0) {
            docs.forEach((d: any) => {
              const docType = d.doc_type || d.document_type;
              if (docType === "hoja_de_vida_pdf") {
                setHasResume(true);
                setResumeUrl(d.file_url);
              } else if (docType === "diploma_curso") {
                setHasCourseDiploma(true);
                setCourseDiplomaUrl(d.file_url);
              } else if (docType === "cedula_ciudadania") {
                setHasIdCard(true);
                setIdCardUrl(d.file_url);
              }
            });
          }
        }
      } catch (err) {
        console.error("Error loading candidate info:", err);
      }
    }

    loadData();
  }, []);

  const primaryAcademy =
    partnerAcademies.find((a) => a.city === candidateCity) || partnerAcademies[0];

  const renewalLink = generateAcademyRenewalLink({
    academyPhone: primaryAcademy?.whatsapp_number || "573158901234",
    academyName: primaryAcademy?.name || "Academia Nacional de Seguridad",
    candidateName: candidateName,
    city: primaryAcademy?.city || candidateCity,
    referralCode: primaryAcademy?.referral_code || "FUERZA2026",
    discountText: primaryAcademy?.discount_text || "15% Descuento Convenio FuerzaVerificada",
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Credencial SuperVigilancia & Bóveda Documental
          </h1>
          <p className="text-xs text-slate-500 font-normal mt-1">
            Verificación institucional de vigencia del curso y repositorio de soportes para contratación.
          </p>
        </div>

        <Link
          href="/guarda/onboarding"
          className="rounded-full bg-[#EAF3FA] hover:bg-[#d8e8f6] text-[#0B3B70] border border-[#D5E6F5] text-xs h-10 px-5 font-semibold inline-flex items-center gap-2 transition-colors self-start sm:self-auto shadow-2xs"
        >
          <Upload className="w-3.5 h-3.5 text-[#005DA4]" strokeWidth={2} />
          <span>Actualizar Documentos</span>
        </Link>
      </div>

      {/* SEMÁFORO DEL CURSO BANNER */}
      <CourseSemaphoreBanner
        completionDate={courseCompletionDate}
        candidateName={candidateName}
        courseName="Reentrenamiento en Vigilancia"
      />

      {/* CREDENCIAL CORPORATE CARD */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#0B3B70] text-white flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Credencial de Identificación SuperVigilancia
              </h3>
              <p className="text-xs text-slate-500">
                Superintendencia de Vigilancia y Seguridad Privada • Ministerio de Defensa
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Estado: Habilitado
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-[#F2F5F8] border border-slate-200/80">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
              Número de Credencial
            </span>
            <span className="font-bold text-slate-900 font-mono text-sm tabular-nums mt-0.5 block">
              {credencialSupervigilancia}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#F2F5F8] border border-slate-200/80">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
              Fecha de Realización
            </span>
            <span className="font-bold text-slate-900 font-mono text-sm tabular-nums mt-0.5 block">
              {courseCompletionDate || "Sin registrar"}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#F2F5F8] border border-slate-200/80">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
              Academia Emisora
            </span>
            <span className="font-semibold text-slate-800 text-xs mt-0.5 block truncate">
              {courseAcademy}
            </span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            ¿Desea adelantar su renovación antes del vencimiento?
          </span>
          <a
            href={renewalLink}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-[#EAF3FA] hover:bg-[#d8e8f6] text-[#0B3B70] border border-[#D5E6F5] text-xs h-9 px-4 font-semibold inline-flex items-center gap-2 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2} />
            Consultar Convenio con Academia Aliada (15% OFF)
          </a>
        </div>
      </div>

      {/* REPOSITORIO DE DOCUMENTOS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Documentos Operativos Almacenados
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Doc 1 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-[#F2F5F8] flex flex-col justify-between space-y-3">
            <div className="flex items-start justify-between">
              <FileText className="w-5 h-5 text-slate-700" strokeWidth={1.5} />
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${hasResume ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-amber-50 text-amber-800 border border-amber-200"}`}>
                {hasResume ? "Cargado" : "Pendiente"}
              </span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Hoja de Vida en PDF</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Formato tradicional descargable</p>
            </div>
            {resumeUrl ? (
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-[#005DA4] hover:underline inline-flex items-center gap-1.5"
              >
                <span>Ver Hoja de Vida cargada</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <span className="text-[10px] text-slate-400 font-mono">Sin archivo</span>
            )}
          </div>

          {/* Doc 2 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-[#F2F5F8] flex flex-col justify-between space-y-3">
            <div className="flex items-start justify-between">
              <FileCheck className="w-5 h-5 text-emerald-600" strokeWidth={1.5} />
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${hasCourseDiploma ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-amber-50 text-amber-800 border border-amber-200"}`}>
                {hasCourseDiploma ? "Cargado" : "Pendiente"}
              </span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Diploma del Curso</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Certificado de Reentrenamiento</p>
            </div>
            {courseDiplomaUrl ? (
              <button
                type="button"
                onClick={() => openSecureDocument(courseDiplomaUrl)}
                className="text-[11px] font-semibold text-[#005DA4] hover:underline flex items-center gap-1"
              >
                <span>Ver Diploma_Vigilancia.pdf</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            ) : (
              <span className="text-[10px] text-slate-400 font-mono">Sin archivo</span>
            )}
          </div>

          {/* Doc 3 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-[#F2F5F8] flex flex-col justify-between space-y-3">
            <div className="flex items-start justify-between">
              <CreditCard className="w-5 h-5 text-slate-700" strokeWidth={1.5} />
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${hasIdCard ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-amber-50 text-amber-800 border border-amber-200"}`}>
                {hasIdCard ? "Cargado" : "Pendiente"}
              </span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Cédula de Ciudadanía</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Documento de identidad nacional</p>
            </div>
            {idCardUrl ? (
              <button
                type="button"
                onClick={() => openSecureDocument(idCardUrl)}
                className="text-[11px] font-semibold text-[#005DA4] hover:underline flex items-center gap-1"
              >
                <span>Ver Documento_Identidad.pdf</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            ) : (
              <span className="text-[10px] text-slate-400 font-mono">Sin archivo</span>
            )}
          </div>
        </div>
      </div>

      {/* RED DE ACADEMIAS ALIADAS AUTORIZADAS */}
      <div id="academias" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-slate-700" strokeWidth={1.75} />
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Red de Academias Aliadas Autorizadas (SuperVigilancia)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Escuelas de capacitación con convenios activos de descuento para renovación y fundamentación de cursos.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#005DA4] bg-[#EAF3FA] px-2.5 py-0.5 rounded-full border border-[#D5E6F5] self-start sm:self-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-[#005DA4]" />
            Convenio Oficial
          </span>
        </div>

        {partnerAcademies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {partnerAcademies.map((acad) => {
              const acadLink = generateAcademyRenewalLink({
                academyPhone: acad.whatsapp_number || "573158901234",
                academyName: acad.name,
                candidateName: candidateName,
                city: acad.city || candidateCity,
                referralCode: acad.referral_code || "FUERZA2026",
                discountText: acad.discount_text || "15% Descuento Convenio FuerzaVerificada",
              });

              return (
                <div
                  key={acad.id}
                  className="p-4 rounded-xl border border-slate-200 bg-[#F2F5F8] flex flex-col justify-between space-y-3 hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">
                        {acad.name}
                      </h4>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {acad.discount_text || "Descuento Convenio"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" strokeWidth={1.5} />
                      <span>{acad.city}</span>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono tabular-nums">
                      Código de Convenio: <span className="font-bold text-slate-700">{acad.referral_code || "FUERZA2026"}</span>
                    </div>
                  </div>

                  <a
                    href={acadLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white w-full h-9 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>Contactar por WhatsApp</span>
                  </a>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
            <p className="font-semibold text-slate-600">Consulte nuestras academias asociadas en Bogotá, Medellín y Cali.</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Comuníquese a la línea de soporte para acceder a los convenios de hasta 15% de descuento en su certificado.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
