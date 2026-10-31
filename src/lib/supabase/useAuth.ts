"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

export type UserRole = "candidate" | "company" | "admin" | null;

export interface AuthState {
  user: User | null;
  role: UserRole;
  fullName: string;
  email: string;
  avatarUrl: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

/**
 * Auto-aprovisionamiento transparente en caliente cuando un usuario cambia de rol en public.profiles
 */
export async function ensureRoleProvisioning(
  supabase: ReturnType<typeof createClient>,
  user: User,
  role: UserRole,
  profileFullName?: string,
  profilePhone?: string
) {
  try {
    if (role === "company") {
      const { data: existingComp } = await supabase
        .from("companies")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!existingComp) {
        const meta = user.user_metadata || {};
        const compName =
          meta.company_name ||
          profileFullName ||
          meta.full_name ||
          user.email?.split("@")[0] ||
          "Empresa de Seguridad";

        await supabase.from("companies").insert({
          owner_id: user.id,
          company_name: compName,
          nit: meta.nit || `NIT-${user.id.slice(0, 8)}`,
          city: meta.city || "Bogotá D.C.",
          contact_person: profileFullName || meta.full_name || "Contacto Principal",
          contact_phone: profilePhone || meta.phone_whatsapp || meta.phone || "3000000000",
          is_verified_company: false,
          plan_name: "basico",
          credits_security_studies: 0,
        });
      }
    } else if (role === "candidate") {
      const { data: existingCand } = await supabase
        .from("candidate_profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existingCand) {
        const meta = user.user_metadata || {};
        await supabase.from("candidate_profiles").insert({
          user_id: user.id,
          national_id: meta.national_id || `TEMP-${user.id.slice(0, 8)}`,
          city: meta.city || "Bogotá D.C.",
          primary_role: "vigilante_fijo",
          years_experience: 1,
          has_military_booklet: false,
          has_own_motorcycle: false,
          available_immediately: true,
        });
      }
    }
  } catch (err) {
    console.error("Error en auto-aprovisionamiento de rol:", err);
  }
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();
    let profileChannel: ReturnType<typeof supabase.channel> | null = null;

    // Fetch live Supabase session and canonical role from public.profiles (Single Source of Truth)
    async function checkSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          if (isMounted) {
            setUser(null);
            setRole(null);
            setFullName("");
            setEmail("");
            setIsLoading(false);
          }
          if (typeof window !== "undefined") {
            localStorage.removeItem("fv_demo_role");
            localStorage.removeItem("fv_demo_user");
          }
          return;
        }

        const currentUser = session.user;
        if (isMounted) {
          setUser(currentUser);
          setEmail(currentUser.email || "");
        }

        // ÚNICA FUENTE DE LA VERDAD: consultar directamente public.profiles sin caché estático
        let profile: any = null;
        const { data: primaryProfile, error: primaryErr } = await supabase
          .from("profiles")
          .select("role, full_name, avatar_url")
          .eq("id", currentUser.id)
          .single();

        if (!primaryErr && primaryProfile) {
          profile = primaryProfile;
        } else {
          const { data: fallbackProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .maybeSingle();
          profile = fallbackProfile;
        }

        let userRole: UserRole = null;

        // Prioridad absoluta a public.profiles.role ('candidate', 'company', 'admin')
        if (
          profile?.role &&
          (profile.role === "company" ||
            profile.role === "candidate" ||
            profile.role === "admin")
        ) {
          userRole = profile.role as UserRole;
        } else if (
          currentUser.user_metadata?.role &&
          (currentUser.user_metadata.role === "company" ||
            currentUser.user_metadata.role === "candidate" ||
            currentUser.user_metadata.role === "admin")
        ) {
          userRole = currentUser.user_metadata.role as UserRole;
        } else {
          userRole = "candidate";
        }

        // Auto-aprovisionamiento transparente en caliente según el rol activo
        await ensureRoleProvisioning(
          supabase,
          currentUser,
          userRole,
          profile?.full_name,
          profile?.phone_whatsapp
        );

        const name =
          profile?.full_name ||
          currentUser.user_metadata?.full_name ||
          currentUser.user_metadata?.name ||
          currentUser.email?.split("@")[0] ||
          (userRole === "company" ? "Empresa de Seguridad" : "Personal Operativo");

        const photo =
          profile?.avatar_url ||
          currentUser.user_metadata?.avatar_url ||
          currentUser.user_metadata?.picture ||
          currentUser.user_metadata?.photo_url ||
          (typeof window !== "undefined" ? localStorage.getItem("fv_user_avatar") || "" : "") ||
          "";

        if (isMounted) {
          setRole(userRole);
          setFullName(name);
          setAvatarUrl(photo);
          setIsLoading(false);
        }

        if (typeof window !== "undefined" && userRole) {
          localStorage.setItem("fv_demo_role", userRole);
          localStorage.setItem(
            "fv_demo_user",
            JSON.stringify({
              email: currentUser.email,
              full_name: name,
              role: userRole,
              avatar_url: photo,
            })
          );
        }

        // Suscripción Realtime a public.profiles para detectar cambios manuales de rol en vivo
        if (!profileChannel && isMounted) {
          profileChannel = supabase
            .channel(`profile-role-sync-${currentUser.id}`)
            .on(
              "postgres_changes",
              {
                event: "UPDATE",
                schema: "public",
                table: "profiles",
                filter: `id=eq.${currentUser.id}`,
              },
              () => {
                checkSession();
              }
            )
            .subscribe();
        }
      } catch (err) {
        console.error("Error al verificar sesión y rol en Supabase:", err);
        if (isMounted) setIsLoading(false);
      }
    }

    checkSession();

    // Revalidar rol de public.profiles al volver a enfocar la ventana/pestaña
    const handleFocusOrVisibility = () => {
      if (document.visibilityState === "visible") {
        checkSession();
      }
    };
    window.addEventListener("focus", handleFocusOrVisibility);
    document.addEventListener("visibilitychange", handleFocusOrVisibility);

    // Listen to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("fv_demo_role");
          localStorage.removeItem("fv_demo_user");
        }
        if (isMounted) {
          setUser(null);
          setRole(null);
          setFullName("");
          setEmail("");
          setAvatarUrl("");
          setIsLoading(false);
        }
      } else {
        await checkSession();
      }
    });

    return () => {
      isMounted = false;
      window.removeEventListener("focus", handleFocusOrVisibility);
      document.removeEventListener("visibilitychange", handleFocusOrVisibility);
      subscription.unsubscribe();
      if (profileChannel) {
        supabase.removeChannel(profileChannel);
      }
    };
  }, []);

  const signOut = async () => {
    try {
      const supabase = createClient();
      await Promise.race([
        supabase.auth.signOut({ scope: "local" }).catch(() => {}),
        new Promise((res) => setTimeout(res, 800)),
      ]);
      await Promise.race([
        supabase.auth.signOut().catch(() => {}),
        new Promise((res) => setTimeout(res, 800)),
      ]);
    } catch (err) {
      console.error("Error signing out:", err);
    }

    if (typeof window !== "undefined") {
      localStorage.removeItem("fv_demo_role");
      localStorage.removeItem("fv_demo_user");
      localStorage.removeItem("fv_user_avatar");
      localStorage.removeItem("fv_company_verified");
      localStorage.removeItem("fv_candidate_profile");
      sessionStorage.clear();

      setUser(null);
      setRole(null);
      setFullName("");
      setEmail("");
      setAvatarUrl("");
      setIsLoading(false);

      window.location.href = "/login";
    }
  };

  return {
    user,
    role,
    fullName,
    email,
    avatarUrl,
    isAuthenticated: !!role || !!user,
    isLoading,
    signOut,
  };
}
