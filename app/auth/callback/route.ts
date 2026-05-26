import { NextResponse, type NextRequest } from "next/server";
import { getHomePathForProfile } from "@/lib/auth/roles";
import { getProfile, syncProfileFromUser } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      const profile = (await getProfile(user.id)) ?? (await syncProfileFromUser(user));

      if (profile) {
        return NextResponse.redirect(new URL(getHomePathForProfile(profile), request.url));
      }
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
