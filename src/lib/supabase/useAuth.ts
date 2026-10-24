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
  isAuthenticated: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    // 1. Initial cached check from localStorage to prevent UI flashing
    if (typeof window !== "undefined") {
      const cachedRole = localStorage.getItem("fv_demo_role") as UserRole;
      const cachedUserStr = localStorage.getItem("fv_demo_user");
      if (cachedRole) {
        setRole(cachedRole);
      }
      if (cachedUserStr) {
        try {
          const parsed = JSON.parse(cachedUserStr);
          if (parsed.full_name) setFullName(parsed.full_name);
          if (parsed.email) setEmail(parsed.email);
        } catch {}
      }
    }

    // 2. Fetch live Supabase session
    async function checkSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          if (typeof window !== "undefined") {
            const cachedRole = localStorage.getItem("fv_demo_role");
            if (!cachedRole) {
              if (isMounted) {
                setUser(null);
                setRole(null);
                setFullName("");
                setEmail("");
                setIsLoading(false);
              }
              return;
            }
          }
          if (isMounted) setIsLoading(false);
          return;
        }

        const currentUser = session.user;
        if (isMounted) {
          setUser(currentUser);
          setEmail(currentUser.email || "");
        }

        // Fetch role and profile from public.profiles
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, full_name")
          .eq("id", currentUser.id)
          .maybeSingle();

        const userRole =
          (profile as any)?.role ||
          currentUser.user_metadata?.role ||
          "candidate";

        const name =
          (profile as any)?.full_name ||
          currentUser.user_metadata?.full_name ||
          currentUser.user_metadata?.name ||
          currentUser.email?.split("@")[0] ||
          "Usuario";

        if (isMounted) {
          setRole(userRole as UserRole);
          setFullName(name);
          setIsLoading(false);
        }

        if (typeof window !== "undefined") {
          localStorage.setItem("fv_demo_role", userRole);
          localStorage.setItem(
            "fv_demo_user",
            JSON.stringify({
              email: currentUser.email,
              full_name: name,
              role: userRole,
            })
          );
        }
      } catch {
        if (isMounted) setIsLoading(false);
      }
    }

    checkSession();

    // 3. Listen to auth state changes
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
          setIsLoading(false);
        }
      } else {
        await checkSession();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const supabase = createClient();
      // Try local and global signout with timeout so it never hangs
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
      // Clear all cached credentials and states
      localStorage.removeItem("fv_demo_role");
      localStorage.removeItem("fv_demo_user");
      localStorage.removeItem("fv_company_verified");
      localStorage.removeItem("fv_candidate_profile");
      sessionStorage.clear();

      setUser(null);
      setRole(null);
      setFullName("");
      setEmail("");
      setIsLoading(false);

      // Force clean navigation and fresh context
      window.location.href = "/login";
    }
  };

  return {
    user,
    role,
    fullName,
    email,
    isAuthenticated: !!role || !!user,
    isLoading,
    signOut,
  };
}
