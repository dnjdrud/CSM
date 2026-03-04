# 배포/검증 체크리스트

## DB 마이그레이션 (필수)

`public.posts`에 `title` 컬럼이 없으면 피드/포스트 쿼리에서 스키마 오류가 날 수 있습니다. 아래 SQL을 실행하거나 기존 마이그레이션을 적용하세요.

```sql
-- supabase/migrations/20250228100000_posts_add_title_if_not_exists.sql
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS title text;
```

- 이미 컬럼이 있으면 무시됩니다.
- 적용 후 피드/포스트 목록이 정상 노출되는지 확인하세요.

## 세션/프로필 검증

1. **디버그 엔드포인트** (로그인 상태에서 호출)
   - `GET /api/debug/auth` — Route Handler 기준 쿠키·authUser·profile·posts 요약
   - `GET /api/debug/session` — RSC와 동일한 `cookies()`/`getSession()` 기준 결과 (userId, role, feedWouldGetCurrentUserId)

2. **확인 사항**
   - `getSession()`이 `userId`, `role`을 반환하면 Header/피드가 로그인 사용자를 인식합니다.
   - `getSession()`이 null이면 쿠키 도메인(예: `.cellah.co.kr`) 또는 미들웨어의 세션 갱신 응답 전달을 점검하세요.

## 라우트

- `/profile/[id]` — `app/(app)/profile/[id]/page.tsx` 단일 진입점만 사용합니다. `app/profile/` 하위 페이지는 제거해 두었습니다.
