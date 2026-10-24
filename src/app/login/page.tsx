"use client";

import { Suspense, useState, useEffect, useRef } from "react";
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
  KeyRound,
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

  // Password Recovery States
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [pendingConfirmEmail, setPendingConfirmEmail] = useState<string | null>(null);
  const [registrationCompleted, setRegistrationCompleted] = useState(false);

  // Evita condición de carrera entre onAuthStateChange y handleSubmit durante el registro
  const isSubmittingRef = useRef(false);

  const supabase = createClient();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "register") {
      setMode("register");
      setRegistrationCompleted(false);
    }
    if (tab === "login") {
      setMode("login");
      setRegistrationCompleted(false);
    }

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
    } else if (errorParam === "unauthorized_company") {
      setErrorType("generic");
      setErrorMsg("Inicia sesión con tu cuenta corporativa o registra tu empresa para acceder al panel B2B.");
    } else if (errorParam === "unauthorized_candidate") {
      setErrorType("generic");
      setErrorMsg("Inicia sesión o crea tu cuenta gratuita para completar tu expediente operativo.");
    } else if (errorParam === "auth_callback_failed") {
      setErrorType("generic");
      setErrorMsg("No fue posible completar la autenticación con Google. Por favor intenta de nuevo.");
    }

    const successParam = searchParams.get("success");
    if (successParam === "password_updated") {
      setSuccessMsg("Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión con tu nueva clave.");
    }

    // 1. Detección de sesión activa para evitar pantallas congeladas
    async function checkExistingUserSession() {
      try {
        // Si hay un error o acción en la URL, no redirigir automáticamente para permitir ver el mensaje
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("error") || urlParams.get("unauthorized")) {
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, full_name")
            .eq("id", session.user.id)
            .maybeSingle();

          let userRole = profile?.role;
          if (userRole !== "admin" && userRole !== "company") {
            const { data: comp } = await supabase
              .from("companies")
              .select("id")
              .eq("owner_id", session.user.id)
              .maybeSingle();
            if (comp) {
              userRole = "company";
              await supabase
                .from("profiles")
                .update({ role: "company" })
                .eq("id", session.user.id);
            }
          }

          if (!userRole) {
            userRole = session.user.user_metadata?.role || "candidate";
          }

          if (typeof window !== "undefined") {
            localStorage.setItem("fv_demo_role", userRole);
          }

          if (userRole === "admin") {
            window.location.href = "/admin/estudios";
          } else if (userRole === "company") {
            window.location.href = "/empresa/dashboard";
          } else {
            window.location.href = "/guarda/vacantes";
          }
        }
      } catch {}
    }

    checkExistingUserSession();

    // 2. Escucha reactiva si el usuario finaliza OAuth en otra pestaña o regresa autenticado
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Si handleSubmit está en plena ejecución (guardando perfil/empresa), no interrumpir con redirección prematura
      if (isSubmittingRef.current) {
        return;
      }

      if (event === "SIGNED_IN" && session?.user) {
        setLoading(true);
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, full_name")
            .eq("id", session.user.id)
            .maybeSingle();

          let userRole = profile?.role;
          if (userRole !== "admin" && userRole !== "company") {
            const { data: comp } = await supabase
              .from("companies")
              .select("id")
              .eq("owner_id", session.user.id)
              .maybeSingle();
            if (comp) {
              userRole = "company";
              await supabase
                .from("profiles")
                .update({ role: "company" })
                .eq("id", session.user.id);
            }
          }

          if (!userRole) {
            userRole = session.user.user_metadata?.role || "candidate";
          }

          const meta = session.user.user_metadata || {};

          // Asegurar que el perfil exista (upsert automático solo si no existe)
          if (!profile) {
            const googleFullName =
              meta.full_name ||
              meta.name ||
              session.user.email?.split("@")[0] ||
              (userRole === "company" ? "Empresa de Seguridad" : "Personal Operativo");

            await supabase.from("profiles").upsert(
              {
                id: session.user.id,
                role: userRole,
                full_name: googleFullName,
                email: session.user.email ?? "",
                phone_whatsapp: meta.phone_whatsapp || session.user.phone || "",
                updated_at: new Date().toISOString(),
              },
              { onConflict: "id" }
            );
          }

          // Si el usuario es empresa y aún no tiene su registro en public.companies, crearlo desde user_metadata
          if (userRole === "company") {
            const { data: existingComp } = await supabase
              .from("companies")
              .select("id")
              .eq("owner_id", session.user.id)
              .maybeSingle();

            if (!existingComp) {
              await supabase.from("companies").insert({
                owner_id: session.user.id,
                company_name:
                  meta.company_name ||
                  profile?.full_name ||
                  meta.full_name ||
                  "Empresa de Seguridad",
                nit: meta.nit || `NIT-${session.user.id.slice(0, 8)}`,
                city: meta.city || "Bogotá D.C.",
                contact_person: profile?.full_name || meta.full_name || "Contacto Principal",
                contact_phone: meta.phone_whatsapp || session.user.phone || "",
                is_verified_company: false,
                plan_name: "basico",
                credits_security_studies: 0,
              });
            }
          }

          if (typeof window !== "undefined") {
            localStorage.setItem("fv_demo_role", userRole);
          }

          if (userRole === "admin") {
            window.location.href = "/admin/estudios";
          } else if (userRole === "company") {
            window.location.href = "/empresa/dashboard";
          } else {
            window.location.href = "/guarda/vacantes";
          }
        } catch (err) {
          console.error("Error al redirigir tras inicio de sesión:", err);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [searchParams, supabase]);

  // Google OAuth Login exclusively for Candidates with dynamic intent
  const handleGoogleLogin = async (intent: "login" | "register" = mode === "register" ? "register" : "login") => {
    setErrorMsg(null);
    setErrorType(null);
    setLoading(true);

    // Temporizador de seguridad: si la redirección se bloquea o demora, destraba el botón tras 6s
    const failsafeTimer = setTimeout(() => {
      setLoading(false);
    }, 6000);

    try {
      const origin =
        typeof window !== "undefined" && window.location.origin
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL || "";

      const redirectUrl = `${origin}/auth/callback?intent=${intent}&role=${selectedRole}`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (error) {
        clearTimeout(failsafeTimer);
        throw error;
      }

      // Si retorna la URL de Google OAuth, redirigir explícitamente
      if (data?.url) {
        clearTimeout(failsafeTimer);
        window.location.href = data.url;
      }
    } catch (err: any) {
      clearTimeout(failsafeTimer);
      console.error("Error al conectar con Google OAuth:", err);
      setErrorType("generic");
      setErrorMsg(err.message || "Error al conectar con Google. Por favor intenta de nuevo.");
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(false);
    setForgotLoading(true);

    try {
      const origin =
        typeof window !== "undefined" && window.location.origin
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL || "";

      const redirectTo = `${origin}/auth/callback?next=/actualizar-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo,
      });

      if (error) {
        throw error;
      }

      setForgotSuccess(true);
    } catch (err: any) {
      console.error("Error al solicitar enlace de restablecimiento:", err);
      setForgotError(err.message || "No fue posible enviar el enlace de recuperación. Intenta nuevamente.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    const targetEmail = (pendingConfirmEmail || email).trim().toLowerCase();
    if (!targetEmail) return;
    setResendLoading(true);
    try {
      const origin =
        typeof window !== "undefined" && window.location.origin
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL || "";

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: targetEmail,
        options: {
          emailRedirectTo: `${origin}/auth/callback?intent=register&role=${selectedRole}`,
        },
      });
      if (error) throw error;
      setSuccessMsg(
        `Hemos reenviado el enlace de activación a ${targetEmail}. Revisa tu bandeja de entrada y carpeta de Spam.`
      );
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(
        err.message || "No fue posible reenviar el correo en este momento. Intenta en unos segundos."
      );
    } finally {
      setResendLoading(false);
    }
  };

  // Sincroniza de forma garantizada public.profiles, public.companies y public.candidate_profiles
  const syncUserRegistrationRecords = async (params: {
    userId: string;
    role: "candidate" | "company" | "admin";
    fullName: string;
    phone: string;
    email: string;
    city: string;
    primaryRole?: string;
    companyName?: string;
    companyNit?: string;
  }) => {
    const cleanFullName =
      params.fullName.trim() ||
      (params.role === "company" ? params.companyName?.trim() || "Empresa de Seguridad" : "Personal Operativo");
    const cleanPhone = params.phone.trim();
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanCity = params.city || "Bogotá D.C.";

    // 1. Upsert en public.profiles
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: params.userId,
        role: params.role,
        full_name: cleanFullName,
        phone_whatsapp: cleanPhone,
        email: cleanEmail,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (profileError) {
      console.error("Error guardando en public.profiles:", profileError);
    }

    // 2. Si es empresa, insertar o actualizar en public.companies
    if (params.role === "company") {
      const { data: existingComp } = await supabase
        .from("companies")
        .select("id")
        .eq("owner_id", params.userId)
        .maybeSingle();

      if (existingComp) {
        await supabase
          .from("companies")
          .update({
            company_name: params.companyName?.trim() || cleanFullName,
            nit: params.companyNit?.trim() || `NIT-${params.userId.slice(0, 8)}`,
            city: cleanCity,
            contact_person: cleanFullName,
            contact_phone: cleanPhone,
          })
          .eq("id", existingComp.id);
      } else {
        const { error: compError } = await supabase.from("companies").insert({
          owner_id: params.userId,
          company_name: params.companyName?.trim() || cleanFullName || "Empresa de Seguridad",
          nit: params.companyNit?.trim() || `NIT-${params.userId.slice(0, 8)}`,
          city: cleanCity,
          contact_person: cleanFullName,
          contact_phone: cleanPhone,
          is_verified_company: false,
          plan_name: "basico",
          credits_security_studies: 0,
        });
        if (compError) {
          console.error("Error guardando en public.companies:", compError);
        }
      }
    }

    // 3. Si es candidato, asegurar registro inicial en public.candidate_profiles
    if (params.role === "candidate") {
      const { data: existingCand } = await supabase
        .from("candidate_profiles")
        .select("user_id")
        .eq("user_id", params.userId)
        .maybeSingle();

      if (!existingCand) {
        const validRole =
          params.primaryRole === "Operador de Medios Tecnológicos"
            ? "Operador Medios Tecnológicos"
            : params.primaryRole || "Vigilante Fijo";

        const { error: candError } = await supabase.from("candidate_profiles").upsert(
          {
            user_id: params.userId,
            national_id: `CC-${params.userId.slice(0, 8)}`,
            city: cleanCity,
            primary_role: validRole as any,
            years_experience: 0,
            has_military_booklet: false,
            has_own_motorcycle: false,
            has_driving_license: false,
            has_weapon_permit_experience: false,
            available_immediately: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
        if (candError) {
          console.error("Error guardando en public.candidate_profiles:", candError);
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setErrorType(null);
    setSuccessMsg(null);
    setPendingConfirmEmail(null);
    setLoading(true);
    isSubmittingRef.current = true;

    const cleanEmail = email.trim().toLowerCase();

    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          if (error.message.toLowerCase().includes("email not confirmed")) {
            setPendingConfirmEmail(cleanEmail);
            setErrorType("generic");
            setErrorMsg(
              "Tu cuenta ya fue creada pero tu correo electrónico aún no ha sido confirmado. Revisa tu bandeja de entrada o carpeta de Spam y haz clic en el enlace de activación."
            );
          } else {
            setErrorType("not_registered_credentials");
            setErrorMsg(
              "No te encuentras registrado o tus datos son incorrectos. Si no tienes cuenta, debes registrarte primero aquí."
            );
          }
          setLoading(false);
          isSubmittingRef.current = false;
          return;
        }

        if (data.user) {
          const meta = data.user.user_metadata || {};

          // Consult canonical role in public.profiles table
          let { data: profile } = await supabase
            .from("profiles")
            .select("role, full_name, email, phone_whatsapp")
            .eq("id", data.user.id)
            .maybeSingle();

          // Si el usuario autenticó con correo/contraseña pero su perfil aún no se había creado en public.profiles
          if (!profile) {
            const inferredRole = (meta.role || "candidate") as "candidate" | "company" | "admin";
            const inferredName =
              meta.full_name ||
              meta.company_name ||
              data.user.email?.split("@")[0] ||
              (inferredRole === "company" ? "Empresa de Seguridad" : "Personal Operativo");

            await syncUserRegistrationRecords({
              userId: data.user.id,
              role: inferredRole,
              fullName: inferredName,
              phone: meta.phone_whatsapp || "",
              email: data.user.email || cleanEmail,
              city: meta.city || "Bogotá D.C.",
              primaryRole: meta.primary_role || "Vigilante Fijo",
              companyName: meta.company_name || inferredName,
              companyNit: meta.nit,
            });

            const { data: createdProfile } = await supabase
              .from("profiles")
              .select("role, full_name, email, phone_whatsapp")
              .eq("id", data.user.id)
              .maybeSingle();

            profile = createdProfile;
          }

          let role = profile?.role;
          if (role !== "admin" && role !== "company") {
            const { data: comp } = await supabase
              .from("companies")
              .select("id")
              .eq("owner_id", data.user.id)
              .maybeSingle();
            if (comp) {
              role = "company";
              await supabase
                .from("profiles")
                .update({ role: "company" })
                .eq("id", data.user.id);
            }
          }

          if (!role) {
            role = meta.role || "candidate";
          }

          // Si el rol es company, garantizar que tenga su fila en public.companies
          if (role === "company") {
            const { data: existingComp } = await supabase
              .from("companies")
              .select("id")
              .eq("owner_id", data.user.id)
              .maybeSingle();

            if (!existingComp) {
              await supabase.from("companies").insert({
                owner_id: data.user.id,
                company_name:
                  meta.company_name ||
                  profile?.full_name ||
                  meta.full_name ||
                  "Empresa de Seguridad",
                nit: meta.nit || `NIT-${data.user.id.slice(0, 8)}`,
                city: meta.city || "Bogotá D.C.",
                contact_person: profile?.full_name || meta.full_name || "Contacto Principal",
                contact_phone: profile?.phone_whatsapp || meta.phone_whatsapp || "",
                is_verified_company: false,
                plan_name: "basico",
                credits_security_studies: 0,
              });
            }
          }

          const userFullName =
            profile?.full_name ||
            meta.full_name ||
            (role === "company" ? "Empresa de Seguridad" : "Usuario Verificado");

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
            if (role === "company") {
              localStorage.setItem("fv_company_verified", "true");
            }
          }

          // Exact role-based redirection via window.location.href for fresh context
          if (role === "admin") {
            window.location.href = "/admin/estudios";
          } else if (role === "company") {
            window.location.href = "/empresa/dashboard";
          } else {
            window.location.href = "/guarda/vacantes";
          }
          return;
        }
      } else {
        // =====================================================================
        // FLUJO DE REGISTRO (CREAR CUENTA) - PERSONAL OPERATIVO O EMPRESA
        // =====================================================================
        const origin =
          typeof window !== "undefined" && window.location.origin
            ? window.location.origin
            : process.env.NEXT_PUBLIC_SITE_URL || "";

        const validPrimaryRole =
          primaryRole === "Operador de Medios Tecnológicos"
            ? "Operador Medios Tecnológicos"
            : primaryRole;

        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: `${origin}/auth/callback?intent=register&role=${selectedRole}`,
            data: {
              full_name: fullName.trim(),
              phone_whatsapp: phone.trim(),
              role: selectedRole,
              primary_role: selectedRole === "candidate" ? validPrimaryRole : undefined,
              company_name: selectedRole === "company" ? companyName.trim() : undefined,
              nit: selectedRole === "company" ? companyNit.trim() : undefined,
              city: city || "Bogotá D.C.",
            },
          },
        });

        // 1. Intentar ejecutar RPC transaccional SECURITY DEFINER (si fue instalado en Supabase)
        // Esto auto-confirma el email e inserta public.profiles, public.companies y public.candidate_profiles
        if (data?.user?.id) {
          try {
            await supabase.rpc("complete_user_registration", {
              p_user_id: data.user.id,
              p_email: cleanEmail,
              p_role: selectedRole,
              p_full_name: fullName.trim(),
              p_phone: phone.trim(),
              p_city: city || "Bogotá D.C.",
              p_primary_role: selectedRole === "candidate" ? validPrimaryRole : "Vigilante Fijo",
              p_company_name: selectedRole === "company" ? companyName.trim() : null,
              p_company_nit: selectedRole === "company" ? companyNit.trim() : null,
            });
          } catch {}
        }

        let activeUser = data?.user ?? null;
        let activeSession = data?.session ?? null;

        // 2. Si signUp no devolvió sesión activa (por ej. auto-confirm RPC o cuenta existente en auth.users),
        // intentar iniciar sesión inmediatamente con las mismas credenciales:
        if (!activeSession) {
          const { data: signInData, error: signInError } =
            await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password,
            });

          if (!signInError && signInData?.session && signInData?.user) {
            activeUser = signInData.user;
            activeSession = signInData.session;
          } else if (error) {
            const lowerErr = error.message.toLowerCase();
            if (lowerErr.includes("already registered") || lowerErr.includes("already exists")) {
              if (signInError?.message?.toLowerCase().includes("email not confirmed")) {
                setPendingConfirmEmail(cleanEmail);
                throw new Error(
                  "Este correo ya fue registrado pero aún no ha sido confirmado. Revisa tu bandeja de entrada o carpeta de Spam para activar tu cuenta."
                );
              }
              throw new Error(
                "Este correo electrónico ya se encuentra registrado. Por favor inicia sesión o usa '¿Olvidaste tu contraseña?'."
              );
            }
            if (lowerErr.includes("rate limit") || lowerErr.includes("security purposes")) {
              throw new Error(
                "Has realizado varios intentos seguidos y Supabase activó una pausa de seguridad de correo. Espera 1 minuto o verifica tu bandeja de entrada."
              );
            }
            throw new Error(error.message);
          }
        }

        // 3. Detectar cuando Supabase retorna un usuario ofuscado con identities = [] (correo duplicado con Confirm Email activo)
        if (
          activeUser &&
          Array.isArray(activeUser.identities) &&
          activeUser.identities.length === 0 &&
          !activeSession
        ) {
          setPendingConfirmEmail(cleanEmail);
          throw new Error(
            "Este correo electrónico ya se encuentra registrado en el sistema. Si ya confirmaste tu correo, ve a 'Inicia sesión aquí'; de lo contrario revisa tu bandeja de entrada."
          );
        }

        // 4. Si tenemos sesión autenticada activa: guardar en public.profiles, public.companies / candidate_profiles y redirigir
        if (activeUser && activeSession) {
          await syncUserRegistrationRecords({
            userId: activeUser.id,
            role: selectedRole,
            fullName: fullName.trim(),
            phone: phone.trim(),
            email: cleanEmail,
            city: city || "Bogotá D.C.",
            primaryRole: validPrimaryRole,
            companyName: companyName.trim(),
            companyNit: companyNit.trim(),
          });

          if (typeof window !== "undefined") {
            localStorage.setItem("fv_demo_role", selectedRole);
            if (selectedRole === "company") {
              localStorage.setItem("fv_company_verified", "false");
              localStorage.setItem("fv_company_credits", "0");
              localStorage.setItem(
                "fv_demo_user",
                JSON.stringify({
                  email: cleanEmail,
                  full_name: companyName.trim() || fullName.trim(),
                  role: "company",
                })
              );
            } else {
              localStorage.setItem("fv_candidate_role", validPrimaryRole);
              localStorage.setItem(
                "fv_demo_user",
                JSON.stringify({
                  email: cleanEmail,
                  full_name: fullName.trim(),
                  role: "candidate",
                })
              );
            }
          }

          if (selectedRole === "company") {
            window.location.href = "/empresa/dashboard";
          } else {
            window.location.href = "/guarda/onboarding";
          }
          return;
        }

        // 5. Si el usuario fue creado en auth.users pero Supabase requiere confirmación por correo (activeSession === null)
        if (activeUser && !activeSession) {
          if (typeof window !== "undefined") {
            localStorage.setItem(
              "fv_pending_registration",
              JSON.stringify({
                userId: activeUser.id,
                role: selectedRole,
                fullName: fullName.trim(),
                phone: phone.trim(),
                email: cleanEmail,
                city: city || "Bogotá D.C.",
                primaryRole: validPrimaryRole,
                companyName: companyName.trim(),
                companyNit: companyNit.trim(),
              })
            );
          }

          setPendingConfirmEmail(cleanEmail);
          setRegistrationCompleted(true);
          setErrorMsg(null);
          setErrorType(null);
          setSuccessMsg(
            `¡Cuenta creada exitosamente! Hemos enviado un enlace de activación a ${cleanEmail}. Por favor abre tu correo (revisa también Spam) y haz clic en el enlace para activar tu cuenta y continuar.`
          );
          return;
        }
      }
    } catch (err: any) {
      setErrorType("generic");
      setErrorMsg(err.message || "Error al procesar la solicitud");
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
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

        {registrationCompleted ? (
          <div className="pt-1">
            <h1 className="text-base sm:text-lg font-bold text-[#1E293B] tracking-tight">
              Activa tu Cuenta Profesional
            </h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Hemos enviado un enlace de confirmación a tu correo
            </p>
          </div>
        ) : mode === "login" ? (
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
        {/* CASO: CONFIRMACIÓN EXCLUSIVA DE CUENTA CREADA                            */}
        {/* ========================================================================= */}
        {registrationCompleted ? (
          <div className="space-y-5 text-center py-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#ECFDF5] border border-[#10B981]/30 flex items-center justify-center text-[#10B981] shadow-xs">
              <CheckCircle className="w-8 h-8" strokeWidth={1.75} />
            </div>

            <div className="space-y-2">
              <h2 className="text-base sm:text-lg font-bold text-[#1E293B]">
                ¡Cuenta creada exitosamente!
              </h2>
              <div className="p-4 rounded-xl bg-[#ECFDF5] border border-[#10B981]/30 text-xs text-[#065F46] leading-relaxed text-left space-y-2">
                <p>
                  Hemos enviado un enlace de activación a{" "}
                  <strong className="font-bold text-[#065F46] font-mono underline">
                    {pendingConfirmEmail || email}
                  </strong>
                  .
                </p>
                <p>
                  Por favor abre tu correo (revisa también Spam) y haz clic en el enlace para activar tu cuenta y continuar.
                </p>
                {successMsg && successMsg.includes("reenviado") && (
                  <p className="font-bold text-emerald-800 pt-1.5 border-t border-emerald-200/80">
                    ✓ {successMsg}
                  </p>
                )}
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 text-left flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" strokeWidth={1.5} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 2. Botón secundario: Reenviar correo de confirmación */}
            <button
              type="button"
              onClick={handleResendConfirmation}
              disabled={resendLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#F8FAFC] hover:bg-slate-100 border border-[#E2E8F0] text-[#1E293B] font-semibold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {resendLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Reenviando correo...</span>
                </>
              ) : (
                <span>Reenviar correo de confirmación</span>
              )}
            </button>

            {/* 3. Botón principal oscuro: Ir a Iniciar Sesión -> */}
            <div className="pt-2 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => {
                  setRegistrationCompleted(false);
                  setPendingConfirmEmail(null);
                  setSuccessMsg(null);
                  setErrorMsg(null);
                  setErrorType(null);
                  setEmail(pendingConfirmEmail || email);
                  setPassword("");
                  setMode("login");
                }}
                className="w-full bg-[#0F172A] hover:bg-[#1E3A8A] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-all shadow-sm min-h-[48px]"
              >
                <span>Ir a Iniciar Sesión</span>
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        ) : showForgotPassword ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[#E2E8F0]">
              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[#0F172A]">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#1E293B]">¿Olvidaste tu contraseña?</h2>
                <p className="text-[11px] text-[#64748B]">Restablece tu acceso con tu correo registrado</p>
              </div>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Ingresa el correo electrónico asociado a tu cuenta. Te enviaremos un enlace seguro para crear una nueva contraseña.
            </p>

            {forgotSuccess ? (
              <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#10B981]/30 text-xs text-[#065F46] space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" strokeWidth={2} />
                  <span className="font-medium leading-relaxed">
                    Si el correo está registrado, recibirás un enlace para restablecer tu contraseña en unos segundos. Revisa también tu carpeta de Spam.
                  </span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                {forgotError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{forgotError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                    Correo Electrónico *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#64748B] absolute left-3 top-3.5" strokeWidth={1.5} />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="usuario@correo.com"
                      className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F172A] min-h-[44px]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-all shadow-sm min-h-[48px] bg-[#0F172A] hover:bg-[#1E3A8A] text-white disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {forgotLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Enviando enlace...
                    </span>
                  ) : (
                    <>
                      <span>Enviar enlace de recuperación</span>
                      <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="pt-2 text-center border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotSuccess(false);
                  setForgotError(null);
                }}
                className="text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
              >
                ← Regresar a Iniciar Sesión
              </button>
            </div>
          </div>
        ) : mode === "login" ? (
          <>
            {/* INFORMATIVE BADGE: DETECCIÓN AUTOMÁTICA DE ROL */}
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-start gap-2.5 text-xs text-[#64748B]">
              <Shield className="w-4 h-4 text-[#0F172A] shrink-0 mt-0.5" strokeWidth={1.5} />
              <div className="leading-relaxed">
                <strong className="text-[#1E293B] block font-bold">
                  Acceso Único con Detección Automática de Rol
                </strong>
                <span className="text-[11px] text-[#64748B]">
                  Personal Operativo, Empresas de Seguridad y Administradores. El sistema te dirigirá automáticamente al panel correspondiente según tu cuenta registrada.
                </span>
              </div>
            </div>

            {/* FEEDBACK ALERTS */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2">
                <div className="flex items-start gap-2.5">
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
                {pendingConfirmEmail && (
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={resendLoading}
                    className="w-full py-2 px-3 rounded-lg bg-white border border-rose-300 text-[#0F172A] font-bold text-[11px] hover:bg-slate-50 transition-colors"
                  >
                    {resendLoading ? "Reenviando correo..." : "Reenviar correo de confirmación"}
                  </button>
                )}
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-[#ECFDF5] border border-[#10B981]/30 text-xs text-[#065F46] flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" strokeWidth={1.5} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* ACCESO UNIVERSAL */}
            <div className="space-y-4 pt-1">
              {/* Botón de Google en 1 clic para cualquier rol */}
              <button
                type="button"
                onClick={() => handleGoogleLogin("login")}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] active:bg-[#F1F5F9] text-[#1E293B] text-xs font-bold transition-all shadow-sm min-h-[46px] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <GoogleIcon />
                <span>{loading ? "Conectando con Google..." : "Continuar con Google"}</span>
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
                      placeholder="usuario@correo.com"
                      className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F172A] min-h-[44px]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#1E293B]">
                      Contraseña *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(email);
                        setShowForgotPassword(true);
                        setForgotSuccess(false);
                        setForgotError(null);
                      }}
                      className="text-[11px] font-semibold text-[#0F172A] hover:text-[#1E3A8A] hover:underline transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
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

            {/* TEXTO SUTIL Y DIRECTO AL PIE */}
            <div className="pt-2 text-center">
              <p className="text-xs text-[#64748B]">
                ¿No tienes una cuenta?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setRegistrationCompleted(false);
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
        ) : null}

        {/* ========================================================================= */}
        {/* CASO 2: PANTALLA / MODAL DE REGISTRO SEPARADO                             */}
        {/* ========================================================================= */}
        {!registrationCompleted && mode === "register" && (
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
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] active:bg-[#F1F5F9] text-[#1E293B] text-xs font-bold transition-all shadow-sm min-h-[46px] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <GoogleIcon />
                  <span>{loading ? "Conectando con Google..." : "Registrarme con Google (1 Clic)"}</span>
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
                      <option value="Escolta Mercancía">Escolta Mercancía</option>
                      <option value="Supervisor Motorizado">Supervisor Motorizado</option>
                      <option value="Operador Medios Tecnológicos">Operador de Medios Tecnológicos</option>
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

                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" strokeWidth={1.5} />
                        <span className="leading-relaxed">{errorMsg}</span>
                      </div>
                      {pendingConfirmEmail && (
                        <button
                          type="button"
                          onClick={handleResendConfirmation}
                          disabled={resendLoading}
                          className="w-full py-2 px-3 rounded-lg bg-white border border-rose-300 text-[#0F172A] font-bold text-[11px] hover:bg-slate-50 transition-colors"
                        >
                          {resendLoading ? "Reenviando correo..." : "Reenviar correo de confirmación"}
                        </button>
                      )}
                    </div>
                  )}

                  {successMsg && (
                    <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#10B981]/30 text-xs text-[#065F46] space-y-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" strokeWidth={1.75} />
                        <span className="font-medium leading-relaxed">{successMsg}</span>
                      </div>
                      {pendingConfirmEmail && (
                        <button
                          type="button"
                          onClick={handleResendConfirmation}
                          disabled={resendLoading}
                          className="w-full py-2 px-3 rounded-lg bg-white border border-[#10B981]/40 text-[#065F46] font-bold text-[11px] hover:bg-emerald-50 transition-colors"
                        >
                          {resendLoading ? "Reenviando correo..." : "Reenviar correo de confirmación"}
                        </button>
                      )}
                    </div>
                  )}

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

                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" strokeWidth={1.5} />
                        <span className="leading-relaxed">{errorMsg}</span>
                      </div>
                      {pendingConfirmEmail && (
                        <button
                          type="button"
                          onClick={handleResendConfirmation}
                          disabled={resendLoading}
                          className="w-full py-2 px-3 rounded-lg bg-white border border-rose-300 text-[#0F172A] font-bold text-[11px] hover:bg-slate-50 transition-colors"
                        >
                          {resendLoading ? "Reenviando correo..." : "Reenviar correo de confirmación"}
                        </button>
                      )}
                    </div>
                  )}

                  {successMsg && (
                    <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#10B981]/30 text-xs text-[#065F46] space-y-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" strokeWidth={1.75} />
                        <span className="font-medium leading-relaxed">{successMsg}</span>
                      </div>
                      {pendingConfirmEmail && (
                        <button
                          type="button"
                          onClick={handleResendConfirmation}
                          disabled={resendLoading}
                          className="w-full py-2 px-3 rounded-lg bg-white border border-[#10B981]/40 text-[#065F46] font-bold text-[11px] hover:bg-emerald-50 transition-colors"
                        >
                          {resendLoading ? "Reenviando correo..." : "Reenviar correo de confirmación"}
                        </button>
                      )}
                    </div>
                  )}

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
                    setRegistrationCompleted(false);
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
