import Link from "next/link";
import { Shield, FileText, CheckCircle, AlertTriangle, Building2, UserCheck, Scale } from "lucide-react";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";

export const metadata = {
  title: "Términos y Condiciones de Uso — FuerzaVerificada",
  description:
    "Términos de servicio y condiciones de uso de la plataforma tecnológica FuerzaVerificada para el sector de la seguridad privada en Colombia.",
};

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 w-full">
        {/* Cabecera Institucional */}
        <div className="space-y-3 border-b border-slate-200/90 pb-8">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900 text-white text-[11px] font-medium tracking-wide">
            <FileText className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.75} />
            Acuerdo de Servicio · Colombia
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
            Términos y Condiciones de Uso de la Plataforma
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
            El acceso y utilización del ecosistema <strong>FuerzaVerificada</strong> implica la aceptación plena e incondicional de los presentes Términos y Condiciones por parte de los aspirantes y las empresas de seguridad privada legalmente autorizadas en Colombia.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-2 font-mono tabular-nums">
            <span>Última revisión: 25 de Octubre de 2026</span>
            <span>·</span>
            <span>Vigencia: Nacional (Colombia)</span>
          </div>
        </div>

        {/* Articulado de Términos */}
        <div className="mt-8 space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed">
          {/* 1. Naturaleza del Servicio */}
          <section className="bg-white border border-slate-200/90 rounded-lg p-5 sm:p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-3">
            <h2 className="text-sm sm:text-base font-semibold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-900" strokeWidth={1.75} />
              1. Naturaleza de la Plataforma y Alcance del Ecosistema
            </h2>
            <p>
              <strong>FuerzaVerificada</strong> es un software de infraestructura tecnológica especializado en la digitalización, centralización de hojas de vida, validación documental y trazabilidad de estudios de confiabilidad y poligrafía para los servicios de vigilancia y seguridad privada regulados por el <strong>Decreto Ley 356 de 1994</strong>.
            </p>
            <p className="text-slate-600">
              FuerzaVerificada opera como facilitador tecnológico entre el personal operativo calificado y las empresas habilitadas, proveyendo herramientas objetivas para la verificación de competencias y credenciales.
            </p>
          </section>

          {/* 2. Régimen para Personal Operativo */}
          <section className="bg-white border border-slate-200/90 rounded-lg p-5 sm:p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-4">
            <h2 className="text-sm sm:text-base font-semibold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" strokeWidth={1.75} />
              2. Condiciones para Personal Operativo (Aspirantes y Guardas)
            </h2>

            <div className="space-y-3">
              <div className="p-3.5 rounded-md bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" strokeWidth={1.75} />
                <div className="text-xs text-emerald-900">
                  <strong className="block font-semibold">Garantía Cero Cobros al Candidato:</strong>
                  El registro, creación de hoja de vida, postulación a ofertas y visibilidad en el radar de relevos es y será <strong>100% gratuito</strong> para el personal operativo. Ningún funcionario de FuerzaVerificada está facultado para cobrar o solicitar dinero a los postulantes.
                </div>
              </div>

              <div className="p-3.5 rounded-md bg-slate-50/80 border border-slate-200/80 space-y-2 text-xs text-slate-600">
                <strong className="text-slate-900 block font-semibold">Obligaciones del Aspirante:</strong>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Veracidad Absoluta:</strong> Todos los datos consignados (cédula, libreta militar, licencias, cursos y experiencia) deben ser auténticos y vigentes.</li>
                  <li><strong>Tolerancia Cero a la Falsedad Documental:</strong> La presentación de actas de capacitación apócrifas, cursos falsificados o suplantación de identidad causará la expulsión inmediata, el bloqueo permanente de la cédula en la red nacional y el reporte ante las autoridades competentes (Fiscalía General de la Nación y SuperVigilancia).</li>
                  <li><strong>Consentimiento de Pruebas:</strong> Al postularse a vacantes que exijan estudios de confiabilidad, el aspirante se compromete a asistir oportunamente a las citas de poligrafía o visitas domiciliarias acordadas.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. Régimen para Empresas de Seguridad */}
          <section className="bg-white border border-slate-200/90 rounded-lg p-5 sm:p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-4">
            <h2 className="text-sm sm:text-base font-semibold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-900" strokeWidth={1.75} />
              3. Condiciones para Empresas de Seguridad Privada
            </h2>

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                Toda empresa que se registre en FuerzaVerificada declara contar con personería jurídica válida y cumplir con los requisitos del Decreto 356 de 1994 y la inspección de la Superintendencia de Vigilancia y Seguridad Privada.
              </p>
              <div className="p-3.5 rounded-md bg-slate-50/80 border border-slate-200/80 space-y-2">
                <strong className="text-slate-900 block font-semibold">Compromisos Corporativos:</strong>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li><strong>Uso Exclusivo Laboral:</strong> Los datos y expedientes a los que tenga acceso mediante el panel ATS se utilizarán estrictamente con fines de selección y evaluación de cargos dentro de la empresa. Queda terminantemente prohibida su comercialización, cesión o divulgación pública.</li>
                  <li><strong>Contratación de Estudios de Seguridad:</strong> Las órdenes de poligrafía, visitas sociofamiliares y validaciones integrales se tramitarán con base en el esquema de créditos o paquetes contratados y respetarán los protocolos de consentimiento informado del evaluado.</li>
                  <li><strong>Cumplimiento de Ofertas:</strong> Las vacantes publicadas deben corresponder a oportunidades laborales reales, con compensación salarial acorde a la ley laboral colombiana y a los turnos autorizados por el régimen de vigilancia.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 4. Delimitación de Responsabilidad */}
          <section className="bg-white border border-slate-200/90 rounded-lg p-5 sm:p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-3">
            <h2 className="text-sm sm:text-base font-semibold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" strokeWidth={1.75} />
              4. Delimitación Expresa de Responsabilidad Laboral
            </h2>
            <div className="p-3.5 rounded-md bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 space-y-2">
              <p>
                <strong>No Intermediación Laboral Directa ni Contrato de Trabajo:</strong> FuerzaVerificada <strong>no es empleador ni patrono</strong> del personal operativo que se registra en el sistema, ni se constituye como empresa de servicios temporales.
              </p>
              <p>
                La relación de trabajo, la decisión definitiva de vinculación o no vinculación, el pago de acreencias laborales, salarios, seguridad social y prestaciones corresponden exclusivamente a la empresa de seguridad contratante. FuerzaVerificada no garantiza la contratación de ningún candidato ni responde por el desempeño individual del personal en su puesto de servicio.
              </p>
            </div>
          </section>

          {/* 5. Propiedad Intelectual y Uso Aceptable */}
          <section className="bg-white border border-slate-200/90 rounded-lg p-5 sm:p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-3">
            <h2 className="text-sm sm:text-base font-semibold text-slate-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-slate-900" strokeWidth={1.75} />
              5. Propiedad Intelectual y Disponibilidad
            </h2>
            <p>
              El código fuente, diseños, logotipos, marcas, algoritmos de compatibilidad y estructuras de datos de FuerzaVerificada son propiedad intelectual protegida por la Decisión Andina 486 y las leyes de propiedad industrial de Colombia. Se prohíbe cualquier ingeniería inversa, extracción masiva (scraping) o reproducción no autorizada.
            </p>
          </section>

          {/* 6. Ley Aplicable y Jurisdicción */}
          <section className="bg-white border border-slate-200/90 rounded-lg p-5 sm:p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-2">
            <h2 className="text-sm sm:text-base font-semibold text-slate-900">
              6. Ley Aplicable y Jurisdicción
            </h2>
            <p className="text-xs text-slate-600">
              Estos Términos y Condiciones se rigen e interpretan de conformidad con las leyes de la República de Colombia. Cualquier diferencia o controversia que surja en relación con el uso de la plataforma será resuelta prioritariamente por arreglo directo o ante los jueces competentes de la ciudad de Bogotá D.C., Colombia.
            </p>
          </section>
        </div>

        {/* Botón de Retorno */}
        <div className="mt-10 pt-6 border-t border-slate-200/80 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 hover:text-slate-950 transition-colors"
          >
            ← Volver al Inicio
          </Link>
          <Link
            href="/privacidad"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-900 hover:underline"
          >
            Ver Política de Privacidad (Habeas Data) →
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
