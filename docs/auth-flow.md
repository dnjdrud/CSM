# 인증 플로우 (Auth Flow)

## 개요

- **매직 링크**: 이메일 링크 → `/auth/callback/session` → 서버에서 쿠키 설정 → 피드로 리다이렉트.
- **쿠키**: 모든 인증 쿠키 옵션은 `lib/auth/cookieOptions.ts`에서만 정의. middleware, set-session-redirect, ensure-profile에서 동일 옵션 사용으로 네비게이션 후에도 세션 유지.

## 단계별 플로우

### 1. 로그인 요청 (매직 링크)

1. 사용자가 로그인 페이지에서 이메일 입력.
2. `POST /api/auth/magic-link` 호출 (Resend로 이메일 발송).
3. 이메일 내 링크: `{SITE_URL}/auth/callback/session?token_hash=...&type=magiclink&next=/feed`.

### 2. 콜백 페이지 (`/auth/callback/session`)

- **역할**: 브라우저에서 토큰 검증 후, 서버에 토큰 전달·쿠키 설정·리다이렉트만 수행.
- **Flow A (쿼리)**  
  `token_hash` + `type` 있음 → `supabase.auth.verifyOtp()` → 성공 시 `access_token`, `refresh_token` 획득.
- **Flow B (해시)**  
  `#access_token=...&refresh_token=...` 있음 → 그대로 사용.
- 공통: `access_token`, `refresh_token`을 **form POST**로 `POST /api/auth/set-session-redirect?next=/feed`에 전송.  
  (form POST로 보내야 서버가 내려주는 Set-Cookie가 리다이렉트 응답과 함께 브라우저에 적용됨.)

### 3. 세션 쿠키 설정 (`POST /api/auth/set-session-redirect`)

- `lib/auth/cookieOptions`의 `getAuthCookieOptions` / `applySupabaseCookies` 사용.
- `createServerClient`로 `setSession({ access_token, refresh_token })` 호출 → Supabase가 `setAll`로 쿠키 목록 전달 → 동일 옵션으로 응답에 Set-Cookie 설정.
- **응답**: `200` + HTML (즉시 `window.location.replace`로 이동).  
  CDN/프록시가 302에서 Set-Cookie를 제거하는 경우를 피하기 위해 200 + HTML 리다이렉트 사용.

### 4. 앱 접근 (middleware)

- **공개 경로**: `/`, `/login`, `/onboarding`, `/request-access`, `/auth/*` 등 → 그대로 통과.
- **앱 경로** (`/feed`, `/profile`, …):  
  - 쿠키로 `getUser()` → 없으면 `/login?from=...` 리다이렉트.  
  - 있으면 `public.users`에 프로필 있는지 확인.  
  - 프로필 없으면 `/api/auth/ensure-profile?next=...`로 리다이렉트.
- **ensure-profile**: 현재 사용자로 프로필 생성 후 `?next=` 경로로 리다이렉트.  
  이때에도 동일 쿠키 옵션(`applySupabaseCookies`)으로 리다이렉트 응답에 쿠키 반영.

### 5. 쿠키 옵션 통일

| 항목       | 값 |
|------------|----|
| path       | `/` |
| httpOnly   | true |
| secure     | 요청이 HTTPS일 때 true (x-forwarded-proto 등 반영) |
| sameSite   | lax |
| maxAge     | 7일 |
| domain     | 설정하지 않음 (호스트 전용 쿠키) |

- 정의: `lib/auth/cookieOptions.ts`  
  - `getAuthCookieOptions(request)`  
  - `applySupabaseCookies(request, response, cookiesToSet)`  
  - `getRequestOrigin(request, fallback)`
- 사용처: `middleware.ts`, `app/api/auth/set-session-redirect/route.ts`, `app/api/auth/ensure-profile/route.ts`.

## 환경 변수

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 클라이언트.
- `SITE_URL` (또는 `APP_URL`): 이메일 링크의 베이스 URL. Vercel 배포 보호 등으로 `*.vercel.app` 대신 실제 도메인 사용 시 필수.
- Resend: `RESEND_API_KEY`, `EMAIL_FROM` (매직 링크 이메일 발송).

## 문제 해결

- **로그인 후 다른 페이지로 가면 세션 풀림**  
  → 모든 쿠키 설정 지점이 `lib/auth/cookieOptions`를 쓰는지 확인. domain을 넣지 않았는지, secure/sameSite/maxAge가 동일한지 확인.
- **매직 링크 클릭 시 Vercel 로그인 페이지로 이동**  
  → 이메일 링크 베이스 URL이 `SITE_URL`(실제 사이트 도메인)인지 확인. Redirect URL에 `/auth/callback/session` 등이 Supabase 대시보드에 등록돼 있는지 확인.
- **ensure-profile 리다이렉트 후 세션 없음**  
  → ensure-profile의 리다이렉트 응답에도 `applySupabaseCookies`가 적용되는지 확인.
