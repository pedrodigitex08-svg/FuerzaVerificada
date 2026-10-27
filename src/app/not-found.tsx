import Link from "next/link";
import { Shield, ArrowLeft, Home, KeyRound } from "lucide-react";

export const metadata = {
  title: "404 — Ruta no encontrada o restringida | FuerzaVerificada",
  description: "La página solicitada no existe o requiere permisos de acceso en la red FuerzaVerificada.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F2F5F8] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 text-center font-sans">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-[#0B3B70] flex items-center justify-center text-white shadow-sm group-hover:bg-[#082B54] transition-colors">
            <Shield className="w-5 h-5 text-white" strokeWidth={1.75} />
          </div>
          <div className="text-left">
            <span className="text-lg font-bold tracking-tight text-[#0B3B70] block leading-none">
              Fuerza<span className="text-slate-900">Verificada</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block mt-1">
              Red Nacional de Seguridad
            </span>
          </div>
        </Link>

        {/* 404 Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5 text-left">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="font-mono text-xs font-bold text-[#FF4B6E] bg-rose-50 px-3 py-1 rounded-full border border-rose-200/70 tabular-nums">
              ERROR 404
            </span>
            <span className="font-mono text-[11px] text-slate-400 tabular-nums">
              SECURITY_PROTOCOL_NULL
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-lg sm:text-xl font-bold text-[#0B3B70] tracking-tight">
              Ruta no encontrada o restringida
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              La dirección web a la que intentas acceder no existe, fue reubicada o requiere un nivel de autorización específico dentro de la plataforma.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F2F5F8] border border-slate-200 text-[11px] text-slate-600 leading-relaxed space-y-1">
            <p className="font-bold text-slate-800">Verificaciones sugeridas:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Si eres empresa de seguridad, verifica que tu sesión corporativa esté activa.</li>
              <li>Si eres personal operativo, ingresa a través del panel de candidato.</li>
            </ul>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <Link
              href="/"
              className="flex-1 h-11 px-5 rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <Home className="w-4 h-4" strokeWidth={2} />
              Volver al Inicio
            </Link>
            <Link
              href="/login"
              className="h-11 px-5 rounded-full bg-[#EAF3FA] hover:bg-sky-100/70 border border-[#005DA4]/20 text-[#0B3B70] text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <KeyRound className="w-4 h-4 text-[#005DA4]" strokeWidth={2} />
              Iniciar Sesión
            </Link>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 font-medium">
          © 2026 FuerzaVerificada · Plataforma Certificada de Seguridad Privada
        </p>
      </div>
    </div>
  );
}
