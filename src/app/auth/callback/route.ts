import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { EmailOtpType } from "@supabase/supabase-js";
import { normalizeSecurityRole } from "@/lib/utils/roleNormalizer";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const intent = requestUrl.searchParams.get("intent");
  const roleParam = requestUrl.searchParams.get("role");
  const next = requestUrl.searchParams.get("next");
  const origin = requestUrl.origin;

  if (code || (token_hash && type)) {
    const supabase = createClient();

    let sessionUser = null;

    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data?.session?.user) {
        sessionUser = data.session.user;
      }
    } else if (token_hash && type) {
      const { data, error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      });
      if (!error && data?.user) {
        sessionUser = data.user;
      }
    }

    if (sessionUser) {
      const user = sessionUser;
      const meta = user.user_metadata || {};

      // Si se especificó una ruta de destino directa (ej: /actualizar-password), redirigir de inmediato
      if (next && next.startsWith("/")) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // 1. Verify canonical profile in public.profiles
      let { data: profile } = await supabase
        .from("profiles")
        .select("id, role, full_name, phone_whatsapp")
        .eq("id", user.id)
        .maybeSingle();

      // Si intent es 'login' por Google OAuth y el usuario no tiene perfil ni metadatos de registro por correo, bloquear ingreso
      if (intent === "login" && !profile && !meta.role) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=not_registered`);
      }

      const targetRole = (roleParam || meta.role || profile?.role || "candidate") as
        | "candidate"
        | "company"
        | "admin";

      // Si el perfil no existe (viene de registro OAuth o confirmación de correo), crearlo con sus metadatos reales
      if (!profile) {
        const resolvedFullName =
          meta.full_name ||
          meta.name ||
          meta.company_name ||
          user.email?.split("@")[0] ||
          (targetRole === "company" ? "Empresa de Seguridad" : "Personal Operativo");

        const { data: upsertedProfile } = await supabase
          .from("profiles")
          .upsert(
            {
              id: user.id,
              role: targetRole,
              full_name: resolvedFullName,
              email: user.email ?? "",
              phone_whatsapp: meta.phone_whatsapp || user.phone || "",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          )
          .select("id, role, full_name, phone_whatsapp")
          .maybeSingle();

        if (upsertedProfile) {
          profile = upsertedProfile;
        }
      }

      // Verificación de rol: Si el perfil tiene role definido en public.profiles
      let activeRole = profile?.role || targetRole;

      // Si no es admin ni company, verificar si tiene empresa registrada como propietario
      if (activeRole !== "admin" && activeRole !== "company") {
        const { data: comp } = await supabase
          .from("companies")
          .select("id")
          .eq("owner_id", user.id)
          .maybeSingle();

        if (comp) {
          activeRole = "company";
          await supabase
            .from("profiles")
            .update({ role: "company" })
            .eq("id", user.id);
        }
      }

      if (!activeRole) {
        activeRole = "candidate";
      }

      // Si es empresa, garantizar que tenga su registro en public.companies
      if (activeRole === "company") {
        const { data: existingComp } = await supabase
          .from("companies")
          .select("id")
          .eq("owner_id", user.id)
          .maybeSingle();

        if (!existingComp) {
          await supabase.from("companies").insert({
            owner_id: user.id,
            company_name:
              meta.company_name ||
              profile?.full_name ||
              meta.full_name ||
              "Empresa de Seguridad",
            nit: meta.nit || `NIT-${user.id.slice(0, 8)}`,
            city: meta.city || "Bogotá D.C.",
            contact_person: profile?.full_name || meta.full_name || "Contacto Principal",
            contact_phone: profile?.phone_whatsapp || meta.phone_whatsapp || user.phone || "",
            is_verified_company: false,
            plan_name: "basico",
            credits_security_studies: 0,
          });
        }
      }

      // Role-based destination
      if (activeRole === "admin") {
        return NextResponse.redirect(`${origin}/admin/estudios`);
      } else if (activeRole === "company") {
        return NextResponse.redirect(`${origin}/empresa/dashboard`);
      }

      // Candidate: Check if structured profile exists in candidate_profiles
      const { data: candidateProfile } = await supabase
        .from("candidate_profiles")
        .select("user_id, national_id, primary_role")
        .eq("user_id", user.id)
        .maybeSingle();

      // If candidate profile does not exist yet or was auto-initialized with CC- prefix, redirect to onboarding wizard
      if (
        !candidateProfile ||
        !candidateProfile.national_id ||
        candidateProfile.national_id.startsWith("CC-") ||
        intent === "register"
      ) {
        if (!candidateProfile) {
          const validRole = normalizeSecurityRole(meta.primary_role);

          await supabase.from("candidate_profiles").upsert(
            {
              user_id: user.id,
              national_id: `CC-${user.id.slice(0, 8)}`,
              city: meta.city || "Bogotá D.C.",
              primary_role: validRole,
              years_experience: 0,
              available_immediately: true,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
        }
        return NextResponse.redirect(`${origin}/guarda/onboarding`);
      }

      // If profile is already structured and completed, redirect to jobs feed
      return NextResponse.redirect(`${origin}/guarda/vacantes`);
    }
  }

  // Fallback if exchange failed
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
