import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.session?.user) {
      const user = data.session.user;

      // 1. Verify or create user profile in public.profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, role, full_name")
        .eq("id", user.id)
        .single();

      if (!profile) {
        const googleFullName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "Personal Operativo";

        await supabase.from("profiles").insert({
          id: user.id,
          role: "candidate",
          full_name: googleFullName,
          email: user.email ?? "",
          phone_whatsapp: user.phone ?? "",
        });
      }

      // 2. Check if candidate has completed structured profile (national_id & course)
      const { data: candidateProfile } = await supabase
        .from("candidate_profiles")
        .select("user_id, national_id, primary_role")
        .eq("user_id", user.id)
        .single();

      // If no candidate profile or national_id is missing, redirect to onboarding wizard
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
