"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Shield,
  FileText,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  Search,
  Filter,
  MapPin,
  Clock,
  Sparkles,
  Download,
  Calendar,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Users,
} from "lucide-react";
import { ResumeDrawerModal } from "@/components/empresa/ResumeDrawerModal";
import { OrderSecurityStudyModal } from "@/components/empresa/OrderSecurityStudyModal";
import { ApplicationStatus, SecurityRoleType } from "@/types/database";
import { generateInterviewCitationLink } from "@/lib/utils/whatsappTemplates";
import { createClient } from "@/lib/supabase/client";

interface ATSCandidate {
  id: string;
  full_name: string;
  national_id: string;
  phone_whatsapp: string;
  city: string;
  locality?: string;
  primary_role: SecurityRoleType;
  years_experience: number;
  has_military_booklet: boolean;
  has_own_motorcycle: boolean;
  motorcycle_cc?: number | null;
  available_immediately: boolean;
  resume_pdf_url: string;
  course_semaphore: "VIGENTE" | "PROXIMO_A_VENCER" | "VENCIDO";
  days_remaining: number;
  match_score: number;
  status: ApplicationStatus;
  work_history?: { company: string; role: string; dates: string }[];
}

export default function ATSVacantePage() {
  const params = useParams();
  const vacancyId = params?.id as string;

  const [candidates, setCandidates] = useState<ATSCandidate[]>([]);
  const [vacancyTitle, setVacancyTitle] = useState<string>("Vacante de Seguridad");
  const [vacancyShift, setVacancyShift] = useState<string>("Turno rotativo");
  const [vacancyAddress, setVacancyAddress] = useState<string>("Colombia");
  const [selectedCandidateForDrawer, setSelectedCandidateForDrawer] = useState<ATSCandidate | null>(null);
  const [selectedCandidateForStudy, setSelectedCandidateForStudy] = useState<ATSCandidate | null>(null);
  const [credits, setCredits] = useState(5);
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [notificationToast, setNotificationToast] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCredits = localStorage.getItem("fv_company_credits");
      if (savedCredits !== null) setCredits(parseInt(savedCredits, 10));
    }

    async function loadVacancyAndCandidates() {
      setIsLoading(true);
      const supabase = createClient();

      // 1. Load Vacancy Details
      try {
        const { data: jobData } = await supabase
          .from("jobs")
          .select("*")
          .eq("id", vacancyId)
          .maybeSingle();

        if (jobData) {
          setVacancyTitle(jobData.title);
          setVacancyShift(jobData.shift || "Turno rotativo");
          setVacancyAddress(jobData.zone_neighborhood || jobData.city || "Colombia");
        } else if (typeof window !== "undefined") {
          const localJobs = localStorage.getItem("fv_company_jobs");
          if (localJobs) {
            try {
              const parsed = JSON.parse(localJobs);
              const found = parsed.find((j: any) => j.id === vacancyId);
              if (found) {
                setVacancyTitle(found.title);
                setVacancyShift(found.shift || "Turno rotativo");
                setVacancyAddress(found.zone_neighborhood || found.city || "Colombia");
              }
            } catch {}
          }
        }
      } catch (err) {
        console.error("Error fetching job details:", err);
      }

      // 2. Load Applications / Candidates for this job
      try {
        const { data: appsData, error: appsError } = await supabase
          .from("applications")
          .select("*, profiles(*), candidate_profiles(*)")
          .eq("job_id", vacancyId);

        if (!appsError && appsData && appsData.length > 0) {
          const loaded: ATSCandidate[] = appsData.map((a: any) => {
            const prof = a.profiles || {};
            const candProf = a.candidate_profiles || {};
            return {
              id: a.id,
              full_name: prof.full_name || "Aspirante",
              national_id: prof.phone_whatsapp || "Sin cédula",
              phone_whatsapp: prof.phone_whatsapp || "573000000000",
              city: candProf.city || "Bogotá D.C.",
              locality: candProf.locality || "",
              primary_role: candProf.primary_role || "Vigilante Fijo",
              years_experience: candProf.years_experience || 0,
              has_military_booklet: !!candProf.has_military_booklet,
              has_own_motorcycle: !!candProf.has_own_motorcycle,
              motorcycle_cc: candProf.motorcycle_cc || null,
              available_immediately: !!candProf.available_immediately,
              resume_pdf_url: candProf.resume_pdf_url || "",
              course_semaphore: "VIGENTE",
              days_remaining: 180,
              match_score: a.compatibility_score || 85,
              status: a.status || "postulado",
            };
          });
          setCandidates(loaded);
        } else {
          setCandidates([]);
        }
      } catch (err) {
        console.error("Error fetching applications:", err);
        setCandidates([]);
      } finally {
        setIsLoading(false);
      }
    }

    if (vacancyId) {
      loadVacancyAndCandidates();
    }
  }, [vacancyId]);

  // Handle status update
  const handleStatusChange = async (candId: string, newStatus: ApplicationStatus) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === candId ? { ...c, status: newStatus } : c))
    );

    // Persist status change to Supabase if exists
    try {
      const supabase = createClient();
      await supabase
        .from("applications")
        .update({ status: newStatus })
        .eq("id", candId);
    } catch {}
  };

  // Confirm Security Study Order: Deduct 1 credit & set status to 'en_estudio_seguridad'
  const handleConfirmStudyOrder = async () => {
    if (!selectedCandidateForStudy || credits <= 0) return;

    const newCredits = credits - 1;
    setCredits(newCredits);

    if (typeof window !== "undefined") {
      localStorage.setItem("fv_company_credits", newCredits.toString());

      // Append to orders list in localStorage
      const existingOrdersStr = localStorage.getItem("fv_security_orders") || "[]";
      try {
        const orders = JSON.parse(existingOrdersStr);
        orders.unshift({
          id: `order-${Date.now()}`,
          candidate_name: selectedCandidateForStudy.full_name,
          national_id: selectedCandidateForStudy.national_id,
          job_title: vacancyTitle,
          status: "solicitado",
          scheduled_date: "Programando visita domiciliaria...",
          final_concept: "En verificación de antecedentes y prueba de poligrafía",
          report_pdf_url: null,
          created_at: new Date().toISOString(),
        });
        localStorage.setItem("fv_security_orders", JSON.stringify(orders));
      } catch {}
    }

    // Update candidate in local state
    handleStatusChange(selectedCandidateForStudy.id, "en_estudio_seguridad");

    setNotificationToast(
      `¡Orden radicada para ${selectedCandidateForStudy.full_name}! Se descontó 1 crédito de tu paquete.`
    );
    setTimeout(() => setNotificationToast(null), 4000);
  };

  const filteredCandidates = candidates
    .filter((c) => {
      const matchSearch =
        c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.national_id.includes(searchTerm);
      const matchStatus = filterStatus === "todos" || c.status === filterStatus;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => b.match_score - a.match_score);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Vacancy Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/empresa/vacantes" className="hover:text-slate-900 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              Mis Vacantes
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold">Bandeja ATS</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {vacancyTitle}
          </h1>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
            <span>Turno: <strong className="text-slate-700 font-mono">{vacancyShift}</strong></span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-500">
              <MapPin className="w-3 h-3" />
              {vacancyAddress}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-900 text-white flex items-center gap-2.5 shadow-subtle">
            <Shield className="w-4 h-4 text-amber-400" strokeWidth={2} />
            <div className="text-xs">
              <span className="text-[10px] text-slate-400 block uppercase leading-none">
                Créditos Poligrafía
              </span>
              <strong className="text-amber-400 font-mono text-sm tabular-nums">
                {credits} disponibles
              </strong>
            </div>
          </div>
        </div>
      </div>

      {notificationToast && (
        <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center gap-2 shadow-elevated border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" strokeWidth={2} />
          <span>{notificationToast}</span>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" strokeWidth={1.75} />
          <input
            type="text"
            placeholder="Buscar por nombre o cédula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400 shadow-subtle"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { key: "todos", label: "Todos" },
            { key: "postulado", label: "Postulados" },
            { key: "preseleccionado", label: "Preseleccionados" },
            { key: "citado_entrevista", label: "Citados" },
            { key: "en_estudio_seguridad", label: "En Estudio" },
          ].map((st) => (
            <button
              key={st.key}
              type="button"
              onClick={() => setFilterStatus(st.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition-all ${
                filterStatus === st.key
                  ? "bg-slate-900 text-white border-slate-900 font-semibold shadow-subtle"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* HIGH-DENSITY LINEAR/STRIPE ATS CANDIDATE TABLE */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-5 font-semibold">Aspirante & Cédula</th>
                <th className="py-3 px-3 font-semibold">Cargo & Experiencia</th>
                <th className="py-3 px-3 font-semibold">Credencial SuperVigilancia</th>
                <th className="py-3 px-3 font-semibold">Match %</th>
                <th className="py-3 px-3 font-semibold">Estado del Proceso</th>
                <th className="py-3 px-5 text-right font-semibold">Acciones Operativas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" strokeWidth={1.5} />
                    <p className="text-sm font-semibold text-slate-700">
                      {searchTerm || filterStatus !== "todos"
                        ? "No se encontraron aspirantes con esos filtros"
                        : "Aún no hay aspirantes postulados a esta vacante"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      Los aspirantes aparecerán automáticamente aquí clasificados por compatibilidad (% Match) y estado del curso de seguridad.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((cand) => {
                  const whatsappCitationLink = generateInterviewCitationLink({
                    phone: cand.phone_whatsapp,
                    candidateName: cand.full_name,
                    companyName: "Seguridad Privada",
                    jobTitle: vacancyTitle,
                    shift: vacancyShift,
                    interviewAddress: vacancyAddress,
                    interviewDateText: "Mañana a las 8:30 AM",
                  });

                  return (
                    <tr key={cand.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Candidate Identity */}
                      <td className="py-3.5 px-5">
                        <button
                          type="button"
                          onClick={() => setSelectedCandidateForDrawer(cand)}
                          className="font-bold text-slate-900 hover:text-amber-600 transition-colors text-left block"
                        >
                          {cand.full_name}
                        </button>
                        <span className="text-[11px] text-slate-400 font-mono">
                          C.C. {cand.national_id} • {cand.city}
                        </span>
                      </td>

                      {/* Role & Exp */}
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-slate-800 block">
                          {cand.primary_role}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                          {cand.years_experience} años exp.
                        </span>
                      </td>

                      {/* Course Semaphore Technical Badge */}
                      <td className="py-3.5 px-3">
                        {cand.course_semaphore === "VIGENTE" ? (
                          <span className="badge-emerald text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Vigente ({cand.days_remaining}d)
                          </span>
                        ) : cand.course_semaphore === "PROXIMO_A_VENCER" ? (
                          <span className="badge-amber text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Por Vencer ({cand.days_remaining}d)
                          </span>
                        ) : (
                          <span className="badge-rose text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Vencido
                          </span>
                        )}
                      </td>

                      {/* Match Score */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono tabular-nums ${
                            cand.match_score >= 85
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {cand.match_score}% Match
                        </span>
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3.5 px-3">
                        <select
                          value={cand.status}
                          onChange={(e) =>
                            handleStatusChange(cand.id, e.target.value as ApplicationStatus)
                          }
                          className={`rounded-lg px-2 py-1 text-xs font-semibold border ${
                            cand.status === "en_estudio_seguridad"
                              ? "bg-amber-50 border-amber-300 text-amber-900"
                              : cand.status === "citado_entrevista"
                              ? "bg-slate-900 border-slate-900 text-white"
                              : cand.status === "preseleccionado"
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                              : "bg-slate-50 border-slate-200 text-slate-700"
                          }`}
                        >
                          <option value="postulado">Postulado</option>
                          <option value="preseleccionado">Preseleccionado</option>
                          <option value="citado_entrevista">Citado Entrevista</option>
                          <option value="en_estudio_seguridad">En Estudio / Polígrafo</option>
                          <option value="contratado">Contratado</option>
                          <option value="descartado">Descartado</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right space-x-1.5 whitespace-nowrap">
                        {/* Action 1: View Resume Drawer */}
                        <button
                          type="button"
                          onClick={() => setSelectedCandidateForDrawer(cand)}
                          title="Ver Hoja de Vida y Soportes"
                          className="btn-secondary text-xs py-1.5 px-2.5 inline-flex font-semibold"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-600" strokeWidth={1.75} />
                          Ver HV
                        </button>

                        {/* Action 2: WhatsApp Citation (1 Clic) */}
                        <a
                          href={whatsappCitationLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleStatusChange(cand.id, "citado_entrevista")}
                          title="Citar a entrevista por WhatsApp (1 Clic)"
                          className="btn-secondary text-xs py-1.5 px-2.5 inline-flex font-semibold text-emerald-700 hover:text-emerald-800"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.75} />
                          Citar
                        </a>

                        {/* Action 3: B2B STAR BUTTON (Order Polygraph/Study) */}
                        <button
                          type="button"
                          onClick={() => setSelectedCandidateForStudy(cand)}
                          title="Solicitar Estudio + Visita + Polígrafo"
                          className="bg-[#0F172A] hover:bg-[#1E3A8A] text-white rounded-xl text-xs py-1.5 px-3 inline-flex items-center gap-1.5 font-bold shadow-sm transition-all duration-200"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" strokeWidth={1.5} />
                          <span>Solicitar Polígrafo</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DRAWER MODAL FOR CANDIDATE RESUME */}
      <ResumeDrawerModal
        isOpen={!!selectedCandidateForDrawer}
        onClose={() => setSelectedCandidateForDrawer(null)}
        candidate={selectedCandidateForDrawer}
        onOpenStudyModal={() => {
          setSelectedCandidateForStudy(selectedCandidateForDrawer);
          setSelectedCandidateForDrawer(null);
        }}
      />

      {/* B2B MONETIZATION MODAL: ORDER SECURITY STUDY & POLYGRAPH */}
      <OrderSecurityStudyModal
        isOpen={!!selectedCandidateForStudy}
        onClose={() => setSelectedCandidateForStudy(null)}
        candidateName={selectedCandidateForStudy?.full_name || ""}
        candidateNationalId={selectedCandidateForStudy?.national_id || ""}
        candidateRole={selectedCandidateForStudy?.primary_role || ""}
        availableCredits={credits}
        onConfirmOrder={handleConfirmStudyOrder}
      />
    </div>
  );
}
