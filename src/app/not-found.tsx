import Link from "next/link";
import { Shield, ArrowLeft, Home, KeyRound } from "lucide-react";

export const metadata = {
  title: "404 — Ruta no encontrada o restringida | FuerzaVerificada",
  description: "La página solicitada no existe o requiere permisos de acceso en la red FuerzaVerificada.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 text-center">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-md bg-slate-900 flex items-center justify-center text-white shadow-[0_1px_2px_rgba(15,23,42,0.08)] group-hover:bg-slate-800 transition-colors">
            <Shield className="w-4 h-4 text-white" strokeWidth={1.75} />
          </div>
          <div className="text-left">
            <span className="text-base font-semibold tracking-tight text-slate-900 block leading-none">
              Fuerza<span className="text-slate-700 font-bold">Verificada</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium block mt-0.5">
              Red Nacional de Seguridad
            </span>
          </div>
        </Link>

        {/* 404 Card */}
        <div className="bg-white border border-slate-200/90 rounded-lg p-6 sm:p-8 shadow-[0_1px_3px_rgba(15,23,42,0.05)] space-y-5 text-left">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="font-mono text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200/70 tabular-nums">
              ERROR 404
            </span>
            <span className="font-mono text-[11px] text-slate-400 tabular-nums">
              SECURITY_PROTOCOL_NULL
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight">
              Ruta no encontrada o restringida
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              La dirección web a la que intentas acceder no existe, fue reubicada o requiere un nivel de autorización específico dentro de la plataforma.
            </p>
          </div>

          <div className="p-3.5 rounded-md bg-slate-50/80 border border-slate-200/80 text-[11px] text-slate-500 leading-relaxed space-y-1">
            <p className="font-semibold text-slate-700">Verificaciones sugeridas:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Si eres empresa de seguridad, verifica que tu sesión corporativa esté activa.</li>
              <li>Si eres personal operativo, ingresa a través del panel de candidato.</li>
            </ul>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <Link
              href="/"
              className="flex-1 h-10 px-4 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors shadow-[0_1px_2px_rgba(15,23,42,0.06)] flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" strokeWidth={1.75} />
              Volver al Inicio
            </Link>
            <Link
              href="/login"
              className="h-10 px-4 rounded-md bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-xs font-medium transition-colors flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
              Iniciar Sesión
            </Link>
          </div>
        </div>

        <p className="text-[11px] text-slate-400">
          © 2026 FuerzaVerificada · Plataforma Certificada de Seguridad Privada
        </p>
      </div>
    </div>
  );
}
