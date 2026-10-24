import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const intent = requestUrl.searchParams.get("intent");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.session?.user) {
      const user = data.session.user;

      // 1. Verify canonical profile in public.profiles
      let { data: profile } = await supabase
        .from("profiles")
        .select("id, role, full_name")
        .eq("id", user.id)
        .maybeSingle();

      // Si intent es 'login' y el usuario no tiene perfil registrado, bloquear ingreso
      if (intent === "login" && !profile) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=not_registered`);
      }

      // Si el perfil no existe y viene de registro, crearlo con rol candidate por defecto
      if (!profile) {
        const googleFullName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "Personal Operativo";

        const { data: upsertedProfile } = await supabase
          .from("profiles")
          .upsert(
            {
              id: user.id,
              role: "candidate",
              full_name: googleFullName,
              email: user.email ?? "",
              phone_whatsapp: user.phone ?? "",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          )
          .select("id, role, full_name")
          .maybeSingle();

        if (upsertedProfile) {
          profile = upsertedProfile;
        }
      }

      // Verificación de rol: Si el perfil tiene role definido en public.profiles
      let activeRole = profile?.role;

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

      // If candidate profile is incomplete, redirect to onboarding wizard
      if (!candidateProfile || !candidateProfile.national_id) {
        return NextResponse.redirect(`${origin}/guarda/onboarding`);
      }

      // If profile is already structured and completed, redirect to jobs feed
      return NextResponse.redirect(`${origin}/guarda/vacantes`);
    }
  }

  // Fallback if exchange failed
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
