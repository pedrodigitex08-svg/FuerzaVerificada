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
} from "lucide-react";
import { CourseSemaphoreBanner } from "@/components/guarda/CourseSemaphoreBanner";
import { generateAcademyRenewalLink } from "@/lib/utils/whatsappTemplates";
import { createClient } from "@/lib/supabase/client";
import { PartnerAcademy } from "@/types/database";

export default function DocumentosPage() {
  const [candidateName, setCandidateName] = useState("Aspirante");
  const [candidateCity, setCandidateCity] = useState("Bogotá D.C.");
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
            if (course.credential_number) setCredencialSupervigilancia(course.credential_number);
            if (course.academy_name) setCourseAcademy(course.academy_name);
            if (course.diploma_pdf_url) {
              setHasCourseDiploma(true);
              setCourseDiplomaUrl(course.diploma_pdf_url);
            }
          }

          // Load candidate_documents
          const { data: docs } = await supabase
            .from("candidate_documents")
            .select("*")
            .eq("candidate_id", user.id);

          if (docs && docs.length > 0) {
            docs.forEach((d: any) => {
              if (d.document_type === "hoja_de_vida_pdf") {
                setHasResume(true);
                setResumeUrl(d.file_url);
              } else if (d.document_type === "diploma_curso") {
                setHasCourseDiploma(true);
                setCourseDiplomaUrl(d.file_url);
              } else if (d.document_type === "cedula_ciudadania") {
                setHasIdCard(true);
                setIdCardUrl(d.file_url);
              }
            });
          }
        } else if (typeof window !== "undefined") {
          const saved = localStorage.getItem("fv_candidate_profile");
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed.full_name) setCandidateName(parsed.full_name);
              if (parsed.city) setCandidateCity(parsed.city);
              if (parsed.course_completion_date) setCourseCompletionDate(parsed.course_completion_date);
              if (parsed.credencial_supervigilancia) setCredencialSupervigilancia(parsed.credencial_supervigilancia);
              if (parsed.course_academy) setCourseAcademy(parsed.course_academy);
            } catch {}
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Credencial SuperVigilancia & Bóveda Documental
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            Verificación institucional de vigencia del curso y repositorio de soportes para contratación.
          </p>
        </div>

        <Link href="/guarda/onboarding" className="btn-secondary text-xs">
          <Upload className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
          Actualizar Documentos
        </Link>
      </div>

      {/* SEMÁFORO DEL CURSO BANNER */}
      <CourseSemaphoreBanner
        completionDate={courseCompletionDate}
        candidateName={candidateName}
        courseName="Reentrenamiento en Vigilancia"
      />

      {/* CREDENCIAL CORPORATE CARD */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-subtle space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
              <Shield className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Credencial de Identificación SuperVigilancia
              </h3>
              <p className="text-xs text-slate-500">
                Superintendencia de Vigilancia y Seguridad Privada • Ministerio de Defensa
              </p>
            </div>
          </div>
          <span className="badge-emerald text-[11px] py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Estado: Habilitado
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
              Número de Credencial
            </span>
            <span className="font-bold text-slate-900 font-mono text-sm tabular-nums mt-0.5 block">
              {credencialSupervigilancia}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
              Fecha de Realización
            </span>
            <span className="font-bold text-slate-900 font-mono text-sm tabular-nums mt-0.5 block">
              {courseCompletionDate || "Sin registrar"}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
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
            className="btn-secondary text-xs py-2 px-3.5 font-semibold text-amber-700 hover:text-amber-800"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.75} />
            Consultar Convenio con Academia Aliada (15% OFF)
          </a>
        </div>
      </div>

      {/* REPOSITORIO DE DOCUMENTOS */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-subtle space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Documentos Operativos Almacenados
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Doc 1 */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50 flex flex-col justify-between space-y-3">
            <div className="flex items-start justify-between">
              <FileText className="w-6 h-6 text-slate-700" strokeWidth={1.5} />
              <span className={hasResume ? "badge-emerald text-[10px]" : "badge-amber text-[10px]"}>
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
                className="text-[11px] font-semibold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <span>Ver Hoja_de_Vida.pdf</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-[10px] text-slate-400 font-mono">Sin archivo</span>
            )}
          </div>

          {/* Doc 2 */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50 flex flex-col justify-between space-y-3">
            <div className="flex items-start justify-between">
              <FileCheck className="w-6 h-6 text-emerald-600" strokeWidth={1.5} />
              <span className={hasCourseDiploma ? "badge-emerald text-[10px]" : "badge-amber text-[10px]"}>
                {hasCourseDiploma ? "Cargado" : "Pendiente"}
              </span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Diploma del Curso</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Certificado de Reentrenamiento</p>
            </div>
            {courseDiplomaUrl ? (
              <a
                href={courseDiplomaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <span>Ver Diploma_Vigilancia.pdf</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-[10px] text-slate-400 font-mono">Sin archivo</span>
            )}
          </div>

          {/* Doc 3 */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50 flex flex-col justify-between space-y-3">
            <div className="flex items-start justify-between">
              <CreditCard className="w-6 h-6 text-slate-700" strokeWidth={1.5} />
              <span className={hasIdCard ? "badge-emerald text-[10px]" : "badge-amber text-[10px]"}>
                {hasIdCard ? "Cargado" : "Pendiente"}
              </span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Cédula de Ciudadanía</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Documento de identidad nacional</p>
            </div>
            {idCardUrl ? (
              <a
                href={idCardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <span>Ver Documento_Identidad.pdf</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-[10px] text-slate-400 font-mono">Sin archivo</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
