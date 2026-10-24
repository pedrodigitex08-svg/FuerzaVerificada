"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Shield,
  UserCheck,
  Building2,
  Lock,
  Mail,
  Phone,
  User,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { UserRole } from "@/types/database";

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state defaults
  const initialTab = searchParams.get("tab") === "register" ? "register" : "login";
  const initialRole: UserRole =
    searchParams.get("role") === "company" ? "company" : "candidate";

  const [mode, setMode] = useState<"login" | "register">(initialTab);
  const [selectedRole, setSelectedRole] = useState<"candidate" | "company">(initialRole);

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [primaryRole, setPrimaryRole] = useState("Vigilante Fijo");
  const [companyName, setCompanyName] = useState("");
  const [companyNit, setCompanyNit] = useState("");
  const [city, setCity] = useState("Bogotá D.C.");

  // Feedback states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<
    "not_registered_oauth" | "not_registered_credentials" | "generic" | null
  >(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "register") setMode("register");
    if (tab === "login") setMode("login");

    const roleParam = searchParams.get("role");
    if (roleParam === "company") setSelectedRole("company");
    if (roleParam === "candidate") setSelectedRole("candidate");

    const errorParam = searchParams.get("error");
    if (errorParam === "not_registered") {
      setErrorType("not_registered_oauth");
      setErrorMsg("No te encuentras registrado. Debes registrarte primero aquí");
    } else if (errorParam === "unauthorized_admin" || searchParams.get("unauthorized") === "true") {
      setErrorType("generic");
      setErrorMsg(
        "Acceso restringido: Esta sección requiere rol de Super Administrador (Operaciones & Poligrafía)."
      );
    } else if (errorParam === "auth_callback_failed") {
      setErrorType("generic");
      setErrorMsg("No fue posible completar la autenticación con Google. Por favor intenta de nuevo.");
    }
  }, [searchParams]);

  // Google OAuth Login exclusively for Candidates with dynamic intent
  const handleGoogleLogin = async (intent: "login" | "register" = mode === "register" ? "register" : "login") => {
    setErrorMsg(null);
    setErrorType(null);
    setLoading(true);
    try {
      const origin =
        typeof window !== "undefined" && window.location.origin
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL || "";

      const redirectUrl = `${origin}/auth/callback?intent=${intent}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorType("generic");
      setErrorMsg(err.message || "Error al conectar con Google");
      setLoading(false);
    }
  };

  // Demo direct switch for instant testing without waiting for confirmation emails
  const handleDemoLogin = (role: "candidate" | "company" | "admin") => {
    setLoading(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("fv_demo_role", role);
      localStorage.setItem(
        "fv_demo_user",
        JSON.stringify({
          email: `${role}@fuerzaverificada.com`,
          full_name:
            role === "candidate"
              ? "Personal Operativo"
              : role === "company"
              ? "Empresa de Seguridad"
              : "Administrador de Plataforma",
          role,
        })
      );
      if (role === "company") {
        localStorage.setItem("fv_company_verified", "true");
      }
    }

    if (role === "candidate") router.push("/guarda/vacantes");
    else if (role === "company") router.push("/empresa/dashboard");
    else router.push("/admin/estudios");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setErrorType(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorType("not_registered_credentials");
          setErrorMsg(
            "No te encuentras registrado o tus datos son incorrectos. Si no tienes cuenta, debes registrarte primero aquí."
          );
          setLoading(false);
          return;
        }

        if (data.user) {
          // Consult role in public.profiles table
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, full_name")
            .eq("id", data.user.id)
            .maybeSingle();

          // If user exists in auth but has no profile registered
          if (!profile) {
            await supabase.auth.signOut();
            setErrorType("not_registered_oauth");
            setErrorMsg("No te encuentras registrado. Debes registrarte primero aquí");
            setLoading(false);
            return;
          }

          const role = (profile as any)?.role || data.user.user_metadata?.role || "candidate";
          const userFullName =
            (profile as any)?.full_name || data.user.user_metadata?.full_name || "Usuario Verificado";

          if (typeof window !== "undefined") {
            localStorage.setItem("fv_demo_role", role);
            localStorage.setItem(
              "fv_demo_user",
              JSON.stringify({
                email: data.user.email,
                full_name: userFullName,
                role,
              })
            );
          }

          // Exact role-based redirection
          if (role === "admin") {
            router.push("/admin/estudios");
          } else if (role === "company") {
            router.push("/empresa/dashboard");
          } else {
            router.push("/guarda/vacantes");
          }
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone_whatsapp: phone,
              role: selectedRole,
              primary_role: selectedRole === "candidate" ? primaryRole : undefined,
            },
          },
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data.user) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            role: selectedRole,
            full_name: fullName,
            phone_whatsapp: phone,
            email,
          });

          if (selectedRole === "company") {
            // Enterprise registration: is_verified_company defaults to false until validated
            await supabase.from("companies").insert({
              owner_id: data.user.id,
              company_name: companyName,
              nit: companyNit,
              city,
              contact_person: fullName,
              contact_phone: phone,
              is_verified_company: false,
              plan_name: "basico",
              credits_security_studies: 0,
            });

            if (typeof window !== "undefined") {
              localStorage.setItem("fv_company_verified", "false");
              localStorage.setItem("fv_company_credits", "0");
              localStorage.setItem(
                "fv_demo_user",
                JSON.stringify({
                  email,
                  full_name: companyName,
                  role: "company",
                })
              );
            }
            router.push("/empresa/dashboard");
          } else {
            if (typeof window !== "undefined") {
              localStorage.setItem("fv_candidate_role", primaryRole);
            }
            router.push("/guarda/onboarding");
          }
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error al procesar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md sm:max-w-lg space-y-6 transition-all">
      {/* 1. BRAND HEADER */}
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

        {mode === "login" ? (
          <p className="text-xs text-[#64748B] max-w-sm mx-auto leading-relaxed">
            La red de empleo y validación especializada para el sector de seguridad privada
          </p>
        ) : (
          <div className="pt-1">
            <h1 className="text-base sm:text-lg font-bold text-[#1E293B] tracking-tight">
              ¿Cómo deseas unirte a FuerzaVerificada?
            </h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Selecciona una opción para configurar tu cuenta profesional
            </p>
          </div>
        )}
      </div>

      {/* 2. MAIN CARD */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-8 shadow-md space-y-5">
        {/* ========================================================================= */}
        {/* CASO 1: PANTALLA PRINCIPAL DE INGRESO (INICIAR SESIÓN)                    */}
        {/* ========================================================================= */}
        {mode === "login" && (
          <>
            {/* DOS BOTONES GRANDES Y ELEGANTES PARA ELEGIR EL ROL */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                Selecciona tu tipo de ingreso:
              </label>

              {/* Botón 1: Personal Operativo */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("candidate");
                  setErrorMsg(null);
                }}
                className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between group min-h-[56px] ${
                  selectedRole === "candidate"
                    ? "border-[#0F172A] bg-[#0F172A] text-white shadow-sm"
                    : "border-[#E2E8F0] bg-[#F8FAFC] text-[#1E293B] hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      selectedRole === "candidate"
                        ? "bg-white/10 text-[#10B981]"
                        : "bg-white border border-[#E2E8F0] text-[#10B981]"
                    }`}
                  >
                    <UserCheck className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <span className="text-xs font-bold block leading-tight">
                      Ingresar como personal operativo de seguridad
                    </span>
                    <span
                      className={`text-[11px] block mt-0.5 ${
                        selectedRole === "candidate" ? "text-slate-300" : "text-[#64748B]"
                      }`}
                    >
                      Vigilantes, Escoltas, Supervisores y Operadores
                    </span>
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    selectedRole === "candidate"
                      ? "border-[#10B981] bg-[#10B981] text-white"
                      : "border-slate-300"
                  }`}
                >
                  {selectedRole === "candidate" && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                </div>
              </button>

              {/* Botón 2: Empresa de Seguridad */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("company");
                  setErrorMsg(null);
                }}
                className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between group min-h-[56px] ${
                  selectedRole === "company"
                    ? "border-[#0F172A] bg-[#0F172A] text-white shadow-sm"
                    : "border-[#E2E8F0] bg-[#F8FAFC] text-[#1E293B] hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      selectedRole === "company"
                        ? "bg-white/10 text-white"
                        : "bg-white border border-[#E2E8F0] text-[#0F172A]"
                    }`}
                  >
                    <Building2 className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <span className="text-xs font-bold block leading-tight">
                      Ingresar como Empresa de Seguridad
                    </span>
                    <span
                      className={`text-[11px] block mt-0.5 ${
                        selectedRole === "company" ? "text-slate-300" : "text-[#64748B]"
                      }`}
                    >
                      Portal B2B, ATS y Verificación de Personal
                    </span>
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    selectedRole === "company"
                      ? "border-[#10B981] bg-[#10B981] text-white"
                      : "border-slate-300"
                  }`}
                >
                  {selectedRole === "company" && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                </div>
              </button>
            </div>

            {/* FEEDBACK ALERTS */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" strokeWidth={1.75} />
                <div className="flex-1 leading-relaxed">
                  {errorType === "not_registered_oauth" ? (
                    <>
                      <span>No te encuentras registrado. Debes registrarte primero{" "}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setMode("register");
                          setErrorMsg(null);
                          setErrorType(null);
                        }}
                        className="font-bold text-[#0F172A] underline hover:text-[#1E3A8A] transition-colors inline"
                      >
                        aquí
                      </button>
                    </>
                  ) : errorType === "not_registered_credentials" ? (
                    <>
                      <span>No te encuentras registrado o tus datos son incorrectos. Si no tienes cuenta, debes registrarte primero{" "}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setMode("register");
                          setErrorMsg(null);
                          setErrorType(null);
                        }}
                        className="font-bold text-[#0F172A] underline hover:text-[#1E3A8A] transition-colors inline"
                      >
                        aquí.
                      </button>
                    </>
                  ) : (
                    <span>{errorMsg}</span>
                  )}
                </div>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-[#ECFDF5] border border-[#10B981]/30 text-xs text-[#065F46] flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" strokeWidth={1.5} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* ACCESO DIRECTO CORRESPONDIENTE: PERSONAL OPERATIVO */}
            {selectedRole === "candidate" ? (
              <div className="space-y-4 pt-1">
                {/* Botón de Google en 1 clic */}
                <button
                  type="button"
                  onClick={() => handleGoogleLogin("login")}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] active:bg-[#F1F5F9] text-[#1E293B] text-xs font-bold transition-all shadow-sm min-h-[46px]"
                >
                  <GoogleIcon />
                  <span>Continuar con Google</span>
                </button>

                <div className="relative flex items-center justify-center py-0.5">
                  <div className="border-t border-[#E2E8F0] w-full" />
                  <span className="bg-white px-3 text-[11px] text-[#64748B] font-medium uppercase tracking-wider relative">
                    o con tu correo y contraseña
                  </span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                      Correo Electrónico *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#64748B] absolute left-3 top-3.5" strokeWidth={1.5} />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="profesional@correo.com"
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F172A] min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                      Contraseña *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-3.5" strokeWidth={1.5} />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Tu contraseña"
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-9 pr-10 py-2.5 text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F172A] min-h-[44px]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-[#64748B] hover:text-[#1E293B]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-all shadow-sm min-h-[48px] bg-[#0F172A] hover:bg-[#1E3A8A] text-white ${
                      loading ? "opacity-75 cursor-not-allowed" : ""
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Ingresando...
                      </span>
                    ) : (
                      <>
                        Ingresar a la Plataforma
                        <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              /* ACCESO DIRECTO CORRESPONDIENTE: EMPRESA DE SEGURIDAD */
              <div className="space-y-4 pt-1">
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-start gap-2.5 text-xs text-[#64748B]">
                  <Shield className="w-4 h-4 text-[#0F172A] shrink-0 mt-0.5" strokeWidth={1.5} />
                  <p className="leading-relaxed text-[11px]">
                    <strong className="text-[#1E293B]">Portal Corporativo B2B:</strong> Acceso para empresas de seguridad privada y departamentos de talento humano.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                      Correo Corporativo *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#64748B] absolute left-3 top-3.5" strokeWidth={1.5} />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seleccion@seguridadatlas.com.co"
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F172A] min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                      Contraseña *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-3.5" strokeWidth={1.5} />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Contraseña corporativa"
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-9 pr-10 py-2.5 text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F172A] min-h-[44px]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-[#64748B] hover:text-[#1E293B]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-all shadow-sm min-h-[48px] bg-[#0F172A] hover:bg-[#1E3A8A] text-white ${
                      loading ? "opacity-75 cursor-not-allowed" : ""
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Ingresando...
                      </span>
                    ) : (
                      <>
                        Ingresar al Panel Corporativo
                        <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* TEXTO SUTIL Y DIRECTO AL PIE */}
            <div className="pt-2 text-center">
              <p className="text-xs text-[#64748B]">
                ¿No tienes una cuenta?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setErrorMsg(null);
                    setErrorType(null);
                    setSuccessMsg(null);
                  }}
                  className="font-bold text-[#0F172A] hover:text-[#1E3A8A] hover:underline transition-colors"
                >
                  Regístrate aquí
                </button>
              </p>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* CASO 2: PANTALLA / MODAL DE REGISTRO SEPARADO                             */}
        {/* ========================================================================= */}
        {mode === "register" && (
          <>
            {/* DOS TARJETAS LIMPIAS Y SEPARADAS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Tarjeta 1: Personal Operativo */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("candidate");
                  setErrorMsg(null);
                }}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between group min-h-[120px] ${
                  selectedRole === "candidate"
                    ? "border-[#0F172A] bg-white ring-2 ring-[#0F172A] shadow-sm"
                    : "border-[#E2E8F0] bg-[#F8FAFC] hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] border border-[#10B981]/20 flex items-center justify-center text-[#10B981] mb-2.5">
                    <UserCheck className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-xs font-bold text-[#1E293B] leading-snug">
                    Ingresar como personal operativo de seguridad
                  </h3>
                  <p className="text-[11px] text-[#64748B] mt-1 leading-relaxed">
                    Acceso libre con Google o correo en 1 clic.
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-[#10B981]">
                  <CheckCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Personal Operativo</span>
                </div>
              </button>

              {/* Tarjeta 2: Empresa de Seguridad */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("company");
                  setErrorMsg(null);
                }}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between group min-h-[120px] ${
                  selectedRole === "company"
                    ? "border-[#0F172A] bg-white ring-2 ring-[#0F172A] shadow-sm"
                    : "border-[#E2E8F0] bg-[#F8FAFC] hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[#0F172A] mb-2.5">
                    <Building2 className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-xs font-bold text-[#1E293B] leading-snug">
                    Soy Empresa de Seguridad
                  </h3>
                  <p className="text-[11px] text-[#64748B] mt-1 leading-relaxed">
                    Registro corporativo con NIT y validación.
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-[#0F172A]">
                  <Shield className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Empresa de Seguridad</span>
                </div>
              </button>
            </div>

            {/* FEEDBACK ALERTS */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" strokeWidth={1.5} />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-[#ECFDF5] border border-[#10B981]/30 text-xs text-[#065F46] flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" strokeWidth={1.5} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* REGISTRO PERSONAL OPERATIVO */}
            {selectedRole === "candidate" ? (
              <div className="space-y-4 pt-1">
                {/* Botón Google OAuth */}
                <button
                  type="button"
                  onClick={() => handleGoogleLogin("register")}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] active:bg-[#F1F5F9] text-[#1E293B] text-xs font-bold transition-all shadow-sm min-h-[46px]"
                >
                  <GoogleIcon />
                  <span>Registrarme con Google (1 Clic)</span>
                </button>

                <div className="relative flex items-center justify-center py-0.5">
                  <div className="border-t border-[#E2E8F0] w-full" />
                  <span className="bg-white px-3 text-[11px] text-[#64748B] font-medium uppercase tracking-wider relative">
                    o completa tu registro con correo
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-left">
                  <p className="text-[11px] text-[#64748B] leading-relaxed">
                    Plataforma abierta para: <strong className="text-[#1E293B] font-medium">Vigilante Fijo, Móvil, Escolta VIP, Supervisor Motorizado, Operador de Medios Tecnológicos, Manejador Canino e Inspector de Seguridad</strong>.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                      Nombre Completo (como en Cédula) *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#64748B] absolute left-3 top-3.5" strokeWidth={1.5} />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nombres y apellidos completos"
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F172A] min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                      Especialidad o Cargo Principal *
                    </label>
                    <select
                      value={primaryRole}
                      onChange={(e) => setPrimaryRole(e.target.value)}
                      className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-xs text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#0F172A] min-h-[44px] font-medium"
                    >
                      <option value="Vigilante Fijo">Vigilante Fijo</option>
                      <option value="Vigilante Móvil">Vigilante Móvil</option>
                      <option value="Escolta VIP">Escolta VIP</option>
                      <option value="Supervisor Motorizado">Supervisor Motorizado</option>
                      <option value="Operador de Medios Tecnológicos">Operador de Medios Tecnológicos</option>
                      <option value="Manejador Canino">Manejador Canino</option>
                      <option value="Inspector de Seguridad">Inspector de Seguridad</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                      Número de WhatsApp *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#64748B] absolute left-3 top-3.5" strokeWidth={1.5} />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="3101234567"
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F172A] min-h-[44px] tabular-nums"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                      Correo Electrónico *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#64748B] absolute left-3 top-3.5" strokeWidth={1.5} />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="candidato@correo.com"
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F172A] min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                      Contraseña *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-3.5" strokeWidth={1.5} />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-9 pr-10 py-2.5 text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F172A] min-h-[44px]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-[#64748B] hover:text-[#1E293B]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-all shadow-sm min-h-[48px] bg-[#0F172A] hover:bg-[#1E3A8A] text-white ${
                      loading ? "opacity-75 cursor-not-allowed" : ""
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Creando cuenta...
                      </span>
                    ) : (
                      <>
                        Crear Cuenta de Personal Operativo
                        <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              /* REGISTRO EMPRESA DE SEGURIDAD */
              <div className="space-y-4 pt-1">
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-start gap-2.5 text-xs text-[#64748B]">
                  <Shield className="w-4 h-4 text-[#0F172A] shrink-0 mt-0.5" strokeWidth={1.5} />
                  <p className="leading-relaxed text-[11px]">
                    <strong className="text-[#1E293B]">Validación Institucional:</strong> Por seguridad del gremio, toda cuenta empresarial pasa por validación de NIT ante SuperVigilancia por nuestro equipo antes de publicar ofertas.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                      Nombre de la Persona de Contacto *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#64748B] absolute left-3 top-3.5" strokeWidth={1.5} />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ej: Dra. Claudia Santamaría (RRHH)"
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F172A] min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                      Razón Social de la Empresa *
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-[#64748B] absolute left-3 top-3.5" strokeWidth={1.5} />
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Ej: Seguridad Atlas de Colombia"
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F172A] min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                        NIT de la Empresa *
                      </label>
                      <input
                        type="text"
                        required
                        value={companyNit}
                        onChange={(e) => setCompanyNit(e.target.value)}
                        placeholder="860.024.112-9"
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F172A] min-h-[44px] font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                        Ciudad Principal *
                      </label>
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-xs text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#0F172A] min-h-[44px] font-medium"
                      >
                        <option value="Bogotá D.C.">Bogotá D.C.</option>
                        <option value="Medellín">Medellín</option>
                        <option value="Cali">Cali</option>
                        <option value="Barranquilla">Barranquilla</option>
                        <option value="Bucaramanga">Bucaramanga</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                      Teléfono / WhatsApp Corporativo *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#64748B] absolute left-3 top-3.5" strokeWidth={1.5} />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="3101234567"
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F172A] min-h-[44px] tabular-nums"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                      Correo Corporativo *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#64748B] absolute left-3 top-3.5" strokeWidth={1.5} />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seleccion@seguridadatlas.com.co"
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F172A] min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                      Contraseña *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-3.5" strokeWidth={1.5} />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-9 pr-10 py-2.5 text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F172A] min-h-[44px]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-[#64748B] hover:text-[#1E293B]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-all shadow-sm min-h-[48px] bg-[#0F172A] hover:bg-[#1E3A8A] text-white ${
                      loading ? "opacity-75 cursor-not-allowed" : ""
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Registrando Empresa...
                      </span>
                    ) : (
                      <>
                        Registrar Empresa de Seguridad
                        <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* REGRESAR A INICIAR SESIÓN */}
            <div className="pt-2 text-center">
              <p className="text-xs text-[#64748B]">
                ¿Ya tienes una cuenta?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setErrorMsg(null);
                    setErrorType(null);
                    setSuccessMsg(null);
                  }}
                  className="font-bold text-[#0F172A] hover:text-[#1E3A8A] hover:underline transition-colors"
                >
                  Inicia sesión aquí
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="text-center text-[#64748B] text-xs flex items-center justify-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-[#0F172A] border-t-transparent rounded-full animate-spin" />
            Cargando...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
