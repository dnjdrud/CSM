import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await supabaseServer();

  const { data: authData, error: authError } = await supabase.auth.getUser();

  let profile: any = null;
  let profileError: any = null;

  if (authData?.user?.id) {
    const res = await supabase
      .from("users")
      .select("id, role")
      .eq("id", authData.user.id)
      .single();
    profile = res.data;
    profileError = res.error;
  }

  return NextResponse.json({
    authUser: authData.user
      ? { id: authData.user.id, email: authData.user.email }
      : null,
    authError: authError?.message ?? null,
    profile,
    profileError: profileError?.message ?? null,
  });
}