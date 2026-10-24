"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  KeyRound,
  Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function ActualizarPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isVerifying, setIsVerifying] = useState(true);
  const [isSessionValid, setIsSessionValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkRecoverySession() {
      try {
        // 1. Si la URL trae un parámetro 'code' (PKCE directo), intercambiarlo por sesión
        const code = searchParams.get("code");
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error && data?.session) {
            if (isMounted) {
              setIsSessionValid(true);
              setIsVerifying(false);
            }
            return;
          }
        }

        // 2. Comprobar si ya existe una sesión activa (ej: establecida por /auth/callback)
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          if (isMounted) {
            setIsSessionValid(true);
            setIsVerifying(false);
          }
          return;
        }

        // 3. Temporizador de gracia de 2 segundos para permitir que Supabase procese fragmentos hash
        const timer = setTimeout(async () => {
          if (!isMounted) return;
          const {
            data: { session: delayedSession },
          } = await supabase.auth.getSession();

          if (delayedSession) {
            setIsSessionValid(true);
          } else {
            setIsSessionValid(false);
          }
          setIsVerifying(false);
        }, 2000);

        return () => clearTimeout(timer);
      } catch {
        if (isMounted) {
          setIsSessionValid(false);
          setIsVerifying(false);
        }
      }
    }

    checkRecoverySession();

    // 4. Escuchar evento explícito PASSWORD_RECOVERY o SIGNED_IN
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        if (isMounted) {
          setIsSessionValid(true);
          setIsVerifying(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [searchParams, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validaciones
    if (newPassword.length < 6) {
      setErrorMsg("La contraseña debe tener un mínimo de 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden. Por favor verifícalas.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      setSuccessMsg("Tu contraseña ha sido actualizada correctamente. Redirigiendo a tu cuenta...");

      // Determinar rol del usuario para redirigir a su panel correspondiente
      setTimeout(async () => {
        try {
          if (data?.user) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("role")
              .eq("id", data.user.id)
              .maybeSingle();

            const userRole = profile?.role;
            if (userRole === "admin") {
              router.push("/admin/estudios");
              return;
            } else if (userRole === "company") {
              router.push("/empresa/dashboard");
              return;
            } else if (userRole === "candidate") {
              router.push("/guarda/vacantes");
              return;
            }
          }
        } catch {}

        router.push("/login?success=password_updated");
      }, 2000);
    } catch (err: any) {
      console.error("Error al actualizar la contraseña:", err);
      setErrorMsg(err.message || "No fue posible actualizar la contraseña. El enlace puede haber expirado.");
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = newPassword.length >= 6 && newPassword === confirmPassword;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-[#0F172A] flex items-center justify-center text-white shadow-sm group-hover:bg-[#1E3A8A] transition-colors">
              <Shield className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <div className="text-left">
              <span className="text-lg font-bold tracking-tight text-[#1E293B] block leading-none">
                Fuerza<span className="text-[#0F172A]">Verificada</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#64748B] font-semibold">
                Red Nacional de Seguridad
              </span>
            </div>
          </Link>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto leading-relaxed">
            Plataforma oficial de validación y empleo en seguridad privada
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-8 shadow-md space-y-5">
          {isVerifying ? (
            /* Estado 1: Verificando enlace o sesión */
            <div className="py-8 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#0F172A] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#64748B] font-semibold">
                Verificando enlace de recuperación seguro...
              </p>
            </div>
          ) : !isSessionValid ? (
            /* Estado 2: Enlace expirado o inválido */
            <div className="py-4 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" strokeWidth={1.75} />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-bold text-[#1E293B]">
                  Enlace inválido o expirado
                </h2>
                <p className="text-xs text-[#64748B] max-w-xs mx-auto leading-relaxed">
                  El enlace para restablecer tu contraseña ha caducado por seguridad o ya fue utilizado anteriormente.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="w-full bg-[#0F172A] hover:bg-[#1E3A8A] text-white rounded-xl py-3 px-4 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <span>Solicitar nuevo enlace en Iniciar Sesión</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            /* Estado 3: Formulario de Nueva Contraseña */
            <div className="space-y-5">
              <div className="flex items-center gap-2.5 pb-2 border-b border-[#E2E8F0]">
                <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[#0F172A]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#1E293B]">
                    Restablecer Contraseña
                  </h2>
                  <p className="text-[11px] text-[#64748B]">
                    Ingresa y confirma tu nueva clave de acceso
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" strokeWidth={1.75} />
                  <span className="leading-relaxed">{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#10B981]/30 text-xs text-[#065F46] flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" strokeWidth={2} />
                  <span className="leading-relaxed font-semibold">{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Campo 1: Nueva Contraseña */}
                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                    Nueva Contraseña *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-3.5" strokeWidth={1.5} />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      minLength={6}
                      disabled={loading || !!successMsg}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-9 pr-10 py-2.5 text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F172A] min-h-[44px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3.5 text-[#64748B] hover:text-[#1E293B]"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-[#64748B] mt-1 block">
                    Debe contener al menos 6 caracteres.
                  </span>
                </div>

                {/* Campo 2: Confirmar Contraseña */}
                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                    Confirmar Nueva Contraseña *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-3.5" strokeWidth={1.5} />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      minLength={6}
                      disabled={loading || !!successMsg}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite tu nueva contraseña"
                      className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-9 pr-10 py-2.5 text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F172A] min-h-[44px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3.5 text-[#64748B] hover:text-[#1E293B]"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordsMatch && (
                    <span className="text-[10px] text-[#065F46] font-semibold mt-1 flex items-center gap-1">
                      <Check className="w-3 h-3 text-[#10B981]" strokeWidth={2.5} />
                      Las contraseñas coinciden
                    </span>
                  )}
                </div>

                {/* Botón de Enviar */}
                <button
                  type="submit"
                  disabled={loading || !!successMsg}
                  className="w-full font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-all shadow-sm min-h-[48px] bg-[#0F172A] hover:bg-[#1E3A8A] text-white disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Actualizando contraseña...
                    </span>
                  ) : (
                    <>
                      <span>Actualizar Contraseña</span>
                      <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-2 text-center border-t border-[#E2E8F0]">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
                >
                  ← Regresar al Inicio de Sesión
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ActualizarPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
          <div className="w-8 h-8 border-2 border-[#0F172A] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ActualizarPasswordContent />
    </Suspense>
  );
}
