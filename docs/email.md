# Email (Resend) and Auth Tokens

이메일 발송은 **Resend**를 사용하며, 서버에서만 호출됩니다. 승인제 회원가입·매직링크·비밀번호 재설정 링크는 DB에 **해시만 저장**하고, 만료·1회 사용을 적용합니다.

## 환경 변수

| 변수 | 설명 |
|------|------|
| `RESEND_API_KEY` | Resend API 키 (필수) |
| `EMAIL_FROM` | 발신 주소, 예: `Cellah <admin@cellah.co.kr>` |
| `SITE_URL` | **이메일 링크용** 사이트 URL. Vercel에서는 커스텀 도메인으로 설정 권장 (예: `https://cellah.co.kr`). 서버 전용이라 재배포만 하면 적용됨. |
| `NEXT_PUBLIC_SITE_URL` | 사이트 기준 URL (SITE_URL 미설정 시 사용) |
| `TOKEN_HMAC_SECRET` | (선택) 토큰 HMAC salt. 미설정 시 기본값 사용. 프로덕션에서는 설정 권장. |

### 매직 링크 클릭 시 Vercel 로그인으로 빠질 때

이메일 안의 링크가 `https://xxx.vercel.app/...` 이면, Vercel 배포 보호 때문에 Vercel 로그인 페이지로 리다이렉트됩니다.  
**해결**: Vercel에 **SITE_URL** (서버 전용) 을 커스텀 도메인으로 설정하세요. 빌드 없이 런타임에 적용됩니다.

- Vercel → 프로젝트 → **Settings** → **Environment Variables**
- **Name**: `SITE_URL`  
  **Value**: `https://cellah.co.kr` (실제 서비스 도메인, 끝에 `/` 없이)  
  **Environment**: Production (필요 시 Preview도)
- 해당 도메인을 프로젝트 **Domains**에 추가한 뒤 **Redeploy**

이후 발송되는 매직/승인/초대/비밀번호재설정 링크는 모두 `https://cellah.co.kr/...` 로 나가서, 클릭 시 앱으로 바로 들어갑니다.

### "RESEND_API_KEY is not set" 나올 때

- **로컬**: 프로젝트 루트의 `.env.local`에 `RESEND_API_KEY`, `EMAIL_FROM` 추가 후 **dev 서버 재시작** (`npm run dev` 다시 실행).
- **Vercel**: [Vercel 대시보드](https://vercel.com) → 해당 프로젝트 → **Settings** → **Environment Variables** → **Add** 로 `RESEND_API_KEY`, `EMAIL_FROM` 추가 (Production/Preview/Development 원하는 환경 선택) → **Redeploy** 한 번 실행.

## 발송 동작

- **개발**: 콘솔에 수신자·제목 로그 출력 후 실제 발송 (개발에서도 발송 가능).
- **프로덕션**: 동일하게 실제 발송. “프로덕션에서만 발송” 제한은 없음.

## API 엔드포인트

### 1. 관리자 초대 이메일 (승인제 플로우)

관리자만 호출 가능. `auth_invites`에 토큰 해시 저장 후 초대 링크 이메일 발송.

```bash
curl -X POST https://your-app.com/api/admin/invite \
  -H "Content-Type: application/json" \
  -H "Cookie: <admin session cookie>" \
  -d '{"email":"invitee@example.com"}'
```

- 성공: `{ "ok": true }`
- 링크 형식: `{NEXT_PUBLIC_SITE_URL}/onboarding?token={rawToken}` (rawToken은 이메일에만 포함, DB에는 해시만 저장)

### 2. 매직 링크 (비밀번호 없이 로그인)

```bash
curl -X POST https://your-app.com/api/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

- 링크: `/auth/verify-magic?id={uuid}&token={rawToken}` → 클릭 시 토큰 소비 후 Supabase 세션으로 리다이렉트.

**매직 링크 클릭 후 로그인 안 될 때**  
Supabase가 리다이렉트하는 URL을 허용 목록에 넣어야 합니다.

1. [Supabase Dashboard](https://supabase.com/dashboard) → 프로젝트 → **Authentication** → **URL Configuration**
2. **Redirect URLs**에 다음을 추가 (프로덕션 도메인 기준):
   - `https://cellah.co.kr/auth/callback/hash`
   - `https://cellah.co.kr/auth/callback/session`
   - 로컬: `http://localhost:3000/auth/callback/hash`
3. **Site URL**이 실제 서비스 URL과 같게 설정되어 있는지 확인 (예: `https://cellah.co.kr`).

### 3. 비밀번호 재설정

```bash
curl -X POST https://your-app.com/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

- 링크: `/auth/set-password?id={uuid}&token={rawToken}` → 새 비밀번호 입력 후 저장.

## 로컬 테스트

1. `.env.local`에 `RESEND_API_KEY`, `EMAIL_FROM`, `NEXT_PUBLIC_SITE_URL` 설정.
2. 관리자로 로그인한 뒤 초대:
   ```bash
   curl -X POST http://localhost:3000/api/admin/invite \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}' \
     --cookie "sb-...=..."  # 브라우저에서 복사
   ```
3. Resend 대시보드 또는 로그에서 발송 여부 확인.

## DB 테이블 (마이그레이션)

- `auth_invites`: 초대 링크 (email, token_hash, expires_at, used_at, created_by)
- `auth_magic_links`: 매직 링크 (email, token_hash, expires_at, used_at)
- `auth_password_resets`: 비밀번호 재설정 (email, token_hash, expires_at, used_at)

토큰은 항상 해시(SHA256 HMAC)로만 저장하며, raw 토큰은 이메일/URL에만 사용됩니다.
