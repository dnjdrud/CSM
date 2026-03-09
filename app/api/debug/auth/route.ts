import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getUserIdFromCookies, decodeBase64URL } from "@/lib/auth/cookieSession";

export const dynamic = "force-dynamic";

type JsonResponse = {
  request: {
    host: string;
    pathname: string;
    searchKeys: string[];
  };
  cookies: {
    hasSupabaseAuth: boolean;
    sbCookieNames: string[];
  };
  serverUrl: string | undefined;
  hasAnonKey: boolean;
  authUser: { id: string; email: string | null } | null;
  authError: string | null;
  authErrorCode: string | null;
  /** User ID parsed from cookie only (no SDK). Same logic as middleware fallback. */
  userIdFromCookie: string | null;
  /** Access token expiry from cookie (Unix s). null if no cookie or unparseable. */
  cookieExpiresAt: number | null;
  /** Diagnosis for "로그인이 풀리는" debugging. */
  diagnosis: string;
  /** Human-readable recommendation. */
  recommendation: string;
  /** true if this response will set Set-Cookie to clear invalid auth cookies. */
  cookiesWillBeCleared: boolean;
  /** 배포 확인용. 2 이상이면 진단 필드 포함 버전. */
  debugVersion: number;
  profile: { id: string; role: string } | null;
  authUidSql: string | null;
  postsSummary: {
    total_posts: number;
    visible_posts: number;
    newest_created_at: string | null;
  } | null;
};

function getCookieExpiresAt(cookieList: Array<{ name: string; value: string }>, serverUrl: string): number | null {
  try {
    const projectRef = new URL(serverUrl).hostname.split(".")[0];
    const name = `sb-${projectRef}-auth-token`;
    let value = cookieList.find((c) => c.name === name)?.value ?? "";
    if (!value) {
      for (let i = 0; ; i++) {
        const chunk = cookieList.find((c) => c.name === `${name}.${i}`);
        if (!chunk) break;
        value += chunk.value;
      }
    }
    if (!value) return null;
    const sessionStr = value.startsWith("base64-") ? decodeBase64URL(value.slice(7)) : value;
    if (!sessionStr) return null;
    const session = JSON.parse(sessionStr) as { expires_at?: number };
    return session.expires_at ?? null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const serverUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    const searchKeys: string[] = [];
    requestUrl.searchParams.forEach((_, key) => searchKeys.push(key));

    const cookieList = request.cookies.getAll();
    const sbCookieNames = cookieList
      .filter((c) => c.name.startsWith("sb-"))
      .map((c) => c.name);
    const hasSupabaseAuth = sbCookieNames.length > 0;

    const userIdFromCookie = serverUrl ? getUserIdFromCookies(cookieList, serverUrl) : null;
    const cookieExpiresAt = serverUrl ? getCookieExpiresAt(cookieList, serverUrl) : null;

    const payload: JsonResponse = {
      request: {
        host: requestUrl.host,
        pathname: requestUrl.pathname,
        searchKeys,
      },
      cookies: {
        hasSupabaseAuth,
        sbCookieNames,
      },
      serverUrl,
      hasAnonKey,
      authUser: null,
      authError: null,
      authErrorCode: null,
      userIdFromCookie,
      cookieExpiresAt,
      diagnosis: "",
      recommendation: "",
      cookiesWillBeCleared: false,
      debugVersion: 2,
      profile: null,
      authUidSql: null,
      postsSummary: null,
    };

    const supabase = await supabaseServer();
    const { data: { session: authSession }, error: authError } = await supabase.auth.getSession();
    const authUser = authSession?.user ?? null;
    if (authError) {
      payload.authError = authError.message ?? String(authError);
      payload.authErrorCode = (authError as { code?: string }).code ?? null;
    } else {
      payload.authError = null;
    }

    // 진단: 로그인이 풀리는 원인
    if (!hasSupabaseAuth || sbCookieNames.length === 0) {
      payload.diagnosis = "NO_COOKIE";
      payload.recommendation = "쿠키 없음. 로그인하세요.";
    } else if (authUser) {
      payload.diagnosis = "SESSION_OK";
      payload.recommendation = "세션 정상. 로그인 유지됨.";
    } else if (payload.authErrorCode === "refresh_token_already_used" || (payload.authError && payload.authError.includes("Already Used"))) {
      payload.diagnosis = "REFRESH_TOKEN_ALREADY_USED";
      payload.recommendation = "리프레시 토큰이 이미 사용됨(다른 탭/요청에서 사용). 이 응답으로 쿠키가 삭제됩니다. 재로그인하세요.";
    } else if (userIdFromCookie) {
      payload.diagnosis = "COOKIE_VALID_SDK_FAILED";
      payload.recommendation = "쿠키 내 access token은 유효하나 SDK getSession 실패. 새로고침하면 미들웨어 fallback으로 로그인 유지될 수 있음.";
    } else if (cookieExpiresAt != null && cookieExpiresAt * 1000 < Date.now()) {
      payload.diagnosis = "COOKIE_EXPIRED";
      payload.recommendation = "access token 만료. 리프레시도 실패한 상태. 재로그인하세요.";
    } else {
      payload.diagnosis = "COOKIE_INVALID_OR_UNKNOWN";
      payload.recommendation = "쿠키 파싱 실패 또는 알 수 없는 오류. 재로그인하세요.";
    }

    if (authUser) {
      payload.authUser = { id: authUser.id, email: authUser.email ?? null };
      const { data: profileRow } = await supabase
        .from("users")
        .select("id, role")
        .eq("id", authUser.id)
        .single();
      if (profileRow) {
        payload.profile = { id: profileRow.id, role: profileRow.role };
      }
    }

    try {
      const { data: rpcData } = await supabase.rpc("auth_uid" as "uid");
      if (rpcData != null) payload.authUidSql = String(rpcData);
    } catch {
      // ignore
    }

    const { count: totalCount } = await supabase
      .from("posts")
      .select("id", { count: "exact", head: true });
    const { data: newestRow } = await supabase
      .from("posts")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    payload.postsSummary = {
      total_posts: totalCount ?? 0,
      visible_posts: totalCount ?? 0,
      newest_created_at: newestRow?.created_at ?? null,
    };

    payload.cookiesWillBeCleared =
      payload.diagnosis === "REFRESH_TOKEN_ALREADY_USED" && sbCookieNames.length > 0;

    const response = NextResponse.json(payload);
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    // When refresh token is invalid, clear auth cookies so the next request is clean (user can sign in again).
    if (payload.cookiesWillBeCleared) {
      const clearOpts = { path: "/" as const, maxAge: 0, expires: new Date(0) };
      sbCookieNames.forEach((name) => {
        response.cookies.set(name, "", clearOpts);
      });
      // Also clear possible chunked cookie variants (sb-xxx-auth-token.0, .1, …) if not already in request.
      if (serverUrl) {
        const projectRef = new URL(serverUrl).hostname.split(".")[0];
        const baseName = `sb-${projectRef}-auth-token`;
        for (let i = 0; i < 5; i++) {
          const chunkName = `${baseName}.${i}`;
          if (!sbCookieNames.includes(chunkName)) response.cookies.set(chunkName, "", clearOpts);
        }
      }
    }
    return response;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        request: { host: "", pathname: "", searchKeys: [] },
        cookies: { hasSupabaseAuth: false, sbCookieNames: [] },
        serverUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        authUser: null,
        authError: message as string,
        authErrorCode: null,
        userIdFromCookie: null,
        cookieExpiresAt: null,
        diagnosis: "EXCEPTION",
        recommendation: "서버 예외 발생. 에러 메시지 확인.",
        cookiesWillBeCleared: false,
        debugVersion: 2,
        profile: null,
        authUidSql: null,
        postsSummary: null,
      },
      { status: 200 }
    );
  }
}
