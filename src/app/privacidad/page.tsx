import Link from "next/link";
import { Shield, Lock, FileCheck, CheckCircle, Scale, Clock, Mail } from "lucide-react";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";

export const metadata = {
  title: "Política de Privacidad y Tratamiento de Datos — FuerzaVerificada",
  description:
    "Política de tratamiento de datos personales conforme a la Ley 1581 de 2012 y Decreto 1377 de 2013 de la República de Colombia.",
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-[#F2F5F8] flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 w-full">
        {/* Cabecera Institucional */}
        <div className="space-y-3 border-b border-slate-200/90 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B3B70] text-white text-[11px] font-semibold tracking-wide">
            <Scale className="w-3.5 h-3.5 text-sky-300" strokeWidth={1.75} />
            Marco Legal Colombiano · Ley 1581 de 2012
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0B3B70] tracking-tight">
            Política de Privacidad y Tratamiento de Datos Personales
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
            En cumplimiento de la Ley Estatutaria 1581 de 2012, el Decreto Reglamentario 1377 de 2013 y las directrices de la Superintendencia de Industria y Comercio (SIC), <strong>FuerzaVerificada</strong> adopta la presente política para regular la recolección, almacenamiento, uso, circulación y supresión de datos personales en el marco de la seguridad privada en Colombia.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-2 font-mono tabular-nums">
            <span>Última actualización: 25 de Octubre de 2026</span>
            <span>·</span>
            <span>Versión 2.4 (Producción)</span>
          </div>
        </div>

        {/* Contenido Estructurado */}
        <div className="mt-8 space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed">
          {/* 1. Responsable */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-sm space-y-3">
            <h2 className="text-sm sm:text-base font-bold text-[#0B3B70] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#005DA4]" strokeWidth={2} />
              1. Identificación del Responsable del Tratamiento
            </h2>
            <p>
              <strong>FuerzaVerificada</strong> (en adelante &quot;La Plataforma&quot;) es una infraestructura digital de empleo vertical y verificación de confiabilidad para el sector de la seguridad y vigilancia privada en la República de Colombia.
            </p>
            <div className="p-4 rounded-xl bg-[#F2F5F8] border border-slate-200 space-y-1.5 text-xs text-slate-600">
              <p><strong className="text-slate-900">Domicilio:</strong> Barranquilla, Colombia.</p>
              <p><strong className="text-slate-900">Canal de Notificaciones de Habeas Data:</strong> <a href="mailto:privacidad@fuerzaverificada.com" className="text-[#005DA4] font-semibold underline hover:text-[#0B3B70]">privacidad@fuerzaverificada.com</a></p>
              <p><strong className="text-slate-900">Atención a Usuarios:</strong> <a href="mailto:soporte@fuerzaverificada.com" className="text-[#005DA4] font-semibold underline hover:text-[#0B3B70]">soporte@fuerzaverificada.com</a></p>
            </div>
          </section>

          {/* 2. Alcance y Finalidad */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-sm space-y-4">
            <h2 className="text-sm sm:text-base font-bold text-[#0B3B70] flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#005DA4]" strokeWidth={2} />
              2. Finalidades Específicas del Tratamiento
            </h2>
            <p>
              La recolección y tratamiento de datos personales obedece a fines estrictamente legítimos en el marco del <strong>Decreto 356 de 1994 (Estatuto de Vigilancia y Seguridad Privada)</strong> y regulaciones complementarias:
            </p>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-[#F2F5F8] border border-slate-200 space-y-2">
                <h3 className="font-bold text-[#0B3B70] text-xs sm:text-sm">
                  A. Para Personal Operativo (Aspirantes, Vigilantes, Escoltas, Operadores):
                </h3>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
                  <li>Validación de identidad ante registros oficiales y cotejo de documentos de identificación ciudadana.</li>
                  <li>Verificación de antecedentes disciplinarios, penales, fiscales y medidas correctivas públicas.</li>
                  <li>Comprobación de la autenticidad y vigencia de credenciales y cursos expedidos por academias autorizadas por la <strong>Superintendencia de Vigilancia y Seguridad Privada (SuperVigilancia)</strong>.</li>
                  <li>Conexión laboral directa y sin intermediarios económicos con empresas de seguridad privada debidamente licenciadas.</li>
                  <li>Realización y consolidación de estudios de seguridad integrales, evaluaciones psicofisiológicas de poligrafía y visitas domiciliarias sociofamiliares, <strong>únicamente mediando consentimiento expreso, previo e informado del titular</strong>.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#F2F5F8] border border-slate-200 space-y-2">
                <h3 className="font-bold text-[#0B3B70] text-xs sm:text-sm">
                  B. Para Empresas de Seguridad Privada (Personas Jurídicas y Representantes):
                </h3>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
                  <li>Verificación de personería jurídica, NIT y existencia de licencia de operación vigente ante SuperVigilancia.</li>
                  <li>Administración del portal corporativo, panel ATS de vacantes y asignación de personal para relevos operativos.</li>
                  <li>Gestión y trazabilidad de órdenes de estudios de seguridad y custodia de resultados bajo estricta confidencialidad laboral.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. Tratamiento de Datos Sensibles */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-sm space-y-3">
            <h2 className="text-sm sm:text-base font-bold text-[#0B3B70] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#005DA4]" strokeWidth={2} />
              3. Tratamiento de Datos Sensibles (Poligrafía y Visitas Domiciliarias)
            </h2>
            <p>
              Conforme al artículo 6 de la Ley 1581 de 2012, se consideran datos sensibles aquellos que afectan la intimidad del titular o cuyo uso indebido puede generar discriminación. En particular, las evaluaciones psicofisiológicas de poligrafía y las visitas sociofamiliares constituyen información de especial protección.
            </p>
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1.5">
              <p className="font-bold">Principio de Consentimiento Calificado:</p>
              <p>
                Ningún aspirante está legalmente obligado a autorizar el tratamiento de datos sensibles. La práctica de estudios de poligrafía y visitas domiciliarias en FuerzaVerificada es voluntaria y exige una manifestación escrita o digital inequívoca antes del procedimiento, orientada exclusivamente a evaluar la idoneidad y confiabilidad en cargos de riesgo en seguridad privada.
              </p>
            </div>
          </section>

          {/* 4. Derechos ARCO */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-sm space-y-3">
            <h2 className="text-sm sm:text-base font-bold text-[#0B3B70] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#005DA4]" strokeWidth={2} />
              4. Derechos de los Titulares de los Datos (Derechos ARCO)
            </h2>
            <p>
              De conformidad con el artículo 8 de la Ley 1581 de 2012, usted como titular cuenta con los siguientes derechos:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-4 rounded-xl bg-[#F2F5F8] border border-slate-200">
                <span className="font-bold text-[#0B3B70] block mb-1">a) Conocer y Actualizar:</span>
                <span className="text-xs text-slate-600">Acceder a sus datos personales y solicitar su rectificación cuando sean parciales, inexactos o incompletos.</span>
              </div>
              <div className="p-4 rounded-xl bg-[#F2F5F8] border border-slate-200">
                <span className="font-bold text-[#0B3B70] block mb-1">b) Solicitar Prueba:</span>
                <span className="text-xs text-slate-600">Exigir constancia de la autorización otorgada para el tratamiento de su información.</span>
              </div>
              <div className="p-4 rounded-xl bg-[#F2F5F8] border border-slate-200">
                <span className="font-bold text-[#0B3B70] block mb-1">c) Ser Informado:</span>
                <span className="text-xs text-slate-600">Conocer el uso que FuerzaVerificada y las empresas evaluadoras han hecho de su expediente.</span>
              </div>
              <div className="p-4 rounded-xl bg-[#F2F5F8] border border-slate-200">
                <span className="font-bold text-[#0B3B70] block mb-1">d) Revocar y Suprimir:</span>
                <span className="text-xs text-slate-600">Solicitar la revocatoria de la autorización y la eliminación de su cuenta, salvo obligación legal o contractual vigente.</span>
              </div>
            </div>
          </section>

          {/* 5. Procedimiento de Peticiones y Reclamos */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-sm space-y-3">
            <h2 className="text-sm sm:text-base font-bold text-[#0B3B70] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#005DA4]" strokeWidth={2} />
              5. Canales y Tiempos Legales de Respuesta (Art. 14 y 15, Ley 1581)
            </h2>
            <p>
              Para ejercer cualquiera de sus derechos, envíe una comunicación formal a <a href="mailto:privacidad@fuerzaverificada.com" className="text-[#005DA4] font-bold underline hover:text-[#0B3B70]">privacidad@fuerzaverificada.com</a> indicando su nombre completo, número de cédula, hechos de la solicitud y dirección de notificación.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-4 rounded-xl bg-[#F2F5F8] border border-slate-200">
                <p className="font-bold text-[#0B3B70]">Consultas:</p>
                <p className="text-slate-600 mt-1">
                  Serán atendidas en un plazo máximo de <strong className="text-slate-900">diez (10) días hábiles</strong>. Si no fuere posible, se informará al interesado antes de su vencimiento, prorrogable por hasta cinco (5) días hábiles más.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#F2F5F8] border border-slate-200">
                <p className="font-bold text-[#0B3B70]">Reclamos y Supresión:</p>
                <p className="text-slate-600 mt-1">
                  Serán atendidos en un término máximo de <strong className="text-slate-900">quince (15) días hábiles</strong>. En caso de prórroga motivada, se extenderá por máximo ocho (8) días hábiles adicionales.
                </p>
              </div>
            </div>
          </section>

          {/* 6. Seguridad y Encriptación */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-sm space-y-3">
            <h2 className="text-sm sm:text-base font-bold text-[#0B3B70] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#005DA4]" strokeWidth={2} />
              6. Medidas de Seguridad y Custodia Técnica
            </h2>
            <p>
              FuerzaVerificada implementa protocolos técnicos de blindaje, incluyendo encriptación de extremo a extremo en tránsito (TLS/HTTPS), políticas de aislamiento de datos por usuario (Row Level Security en Supabase) y auditoría inmutable de accesos para prevenir la adulteración, pérdida, consulta no autorizada o uso fraudulento de los expedientes.
            </p>
          </section>

          {/* 7. Vigencia */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-sm space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-[#0B3B70]">
              7. Vigencia de la Política
            </h2>
            <p className="text-xs text-slate-600">
              Esta política entra en vigor a partir del día de su expedición y se mantendrá vigente durante el funcionamiento de la plataforma o mientras subsistan las obligaciones legales de custodia documental aplicables en el territorio colombiano.
            </p>
          </section>
        </div>

        {/* Botón de Retorno */}
        <div className="mt-10 pt-6 border-t border-slate-200/80 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#005DA4] hover:underline transition-colors"
          >
            ← Volver al Inicio
          </Link>
          <Link
            href="/terminos"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#0B3B70] hover:underline"
          >
            Ver Términos y Condiciones →
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
