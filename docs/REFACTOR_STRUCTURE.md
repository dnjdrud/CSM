# 리팩터링 구조: 백엔드/프론트엔드 분리 및 기능·권한·페이지별 구성

## 원칙

- **백엔드**: 서버 전용(세션, DB, 권한, 도메인 로직). 기능별·권한별·연결(connection)별로 분리.
- **프론트엔드**: UI·페이지·클라이언트 훅. 기능별·권한별·페이지별로 분리.
- 기존 `lib/`, `app/` 동작은 유지하면서 **새 경로에서 re-export** 후 점진적으로 이전.

---

## 1. 백엔드 구조 (`backend/`)

```
backend/
├── connection/          # 연결·클라이언트 (Supabase, 세션)
│   ├── index.ts         # re-export
│   ├── supabase-server.ts
│   ├── supabase-admin.ts
│   └── session.ts       # getSession, getCurrentUser
│
├── permissions/         # 권한·가드·레이트리밋
│   ├── index.ts
│   ├── auth.ts          # requireSession, getAuthUserId
│   ├── admin.ts         # requireAdmin, getAdminOrNull
│   ├── guards.ts        # canViewPost 등 도메인 가드
│   └── rateLimit.ts     # assertRateLimit
│
└── features/            # 기능별 도메인·데이터 접근
    ├── auth/            # 로그인, 프로비저닝, bypass
    ├── posts/           # CRUD, 목록, 작성자별
    ├── comments/        # CRUD, 목록
    ├── feed/            # 피드 목록, 커서, 페이지
    ├── profile/         # 사용자 조회, 팔로우, 블록, 뮤트
    ├── admin/           # 관리자: 사용자/감사/모더레이션/일일기도
    ├── notifications/  # 알림 목록, 읽음 처리
    ├── onboarding/      # 가입 요청, 승인, 완료
    ├── reports/         # 신고 생성
    ├── notes/           # 노트(나의 공간), 발행
    └── search/          # 검색(게시글, 사람, 태그)
```

- **connection**: Supabase 서버/어드민 클라이언트, `getSession` 등. 액션/API에서만 사용.
- **permissions**: 역할·RLS 수준 가드, 레이트리밋. 모든 보호된 액션에서 사용.
- **features**: 기능 단위 데이터·로직. 각 feature는 `repository`(또는 서비스) + 필요한 타입만 노출.

---

## 2. 프론트엔드 구조

### 2.1 앱 라우트 (`app/`) — 페이지·권한별

- **`(public)`**: 비로그인 접근 (로그인, 가입 요청, 온보딩, 지원 등).
- **`(app)`**: 로그인 필수 (피드, 글쓰기, 프로필, 알림, 검색, 나의 공간 등).
- **`(admin)`**: 관리자 전용 (사용자, 가입 요청, 모더레이션, 감사, 시스템 로그 등).
- **`api/`**: REST/내부 API (auth callback, debug, internal log 등).

페이지별 로직은 가능한 한 해당 라우트의 `_components/`, `_lib/`, `actions.ts`에 두고, 공통은 `components/`·`backend/`로 뺀다.

### 2.2 공용 컴포넌트 (`components/`)

```
components/
├── ui/                  # 디자인 시스템 (Button, Card, Avatar, Toast, ...)
├── layout/              # 권한·역할별 공통 레이아웃
│   ├── Header.tsx
│   ├── HeaderWrapper.tsx
│   └── AdminSidebar.tsx
├── features/            # 기능별 UI (피드, 글, 프로필, 관리자, …)
│   ├── feed/            # FeedComposer, FeedList, FeedPostCard, FeedScopeToggle, TimelineContainer
│   ├── post/            # PostCard, PostDetailHeader, CommentList, CommentForm, ComposeBox
│   ├── profile/         # ProfileShell, ProfileTabs, ProfileHero, RecentPosts
│   ├── auth/            # LoginForm, RequestAccessForm, CompleteSignupForm
│   ├── admin/           # SignupRequestsTable, ModerationReportActions, DiagnosticsTable
│   └── notifications/  # NotificationsList, MarkAllReadButton
└── shared/              # 여러 기능에서 쓰는 공통 (FollowButton, FlashBanner, BrandMark)
```

- **기능별**: 해당 기능 도메인에만 쓰는 컴포넌트.
- **권한별**: `layout/`에 헤더·사이드바 등 역할별 공통 UI.
- **페이지별**: 페이지 전용 조합은 `app/.../page.tsx` + `_components/`에 유지.

---

## 3. 마이그레이션 순서

1. **백엔드 re-export**
   - `backend/connection`, `backend/permissions`, `backend/features/*` 생성.
   - 기존 `lib/supabase`, `lib/auth`, `lib/data/repository` 등은 그대로 두고, `backend/*`에서만 re-export.
2. **서버 액션·API에서 import 경로 변경**
   - `getSession` → `@/backend/connection`
   - `assertRateLimit`, `canViewPost` → `@/backend/permissions`
   - `createPost`, `listFeedPostsPage` 등 → `@/backend/features/posts`, `@/backend/features/feed` 등
3. **컴포넌트 재배치**
   - `components/features/*`, `components/layout/`, `components/shared/` 생성 후 기존 컴포넌트 이동.
   - import를 `@/components/features/feed/...` 등으로 변경.
4. **기존 `lib/` 정리**
   - 모든 참조가 `backend/`·`components/`로 바뀐 뒤, `lib/` 내부를 `backend/`·`lib/domain` 등으로 이전하고 deprecated 정리.

---

## 4. import 예시 (목표)

```ts
// 서버 액션 (예: feed)
import { getSession } from "@/backend/connection";
import { assertRateLimit } from "@/backend/permissions";
import { createPost } from "@/backend/features/posts";
import { listFeedPostsPage } from "@/backend/features/feed";
import { canViewPost } from "@/backend/permissions";

// 관리자 액션
import { getAdminOrNull } from "@/backend/permissions";
import { listUsers, hidePost } from "@/backend/features/admin";

// 컴포넌트
import { FeedComposer } from "@/components/features/feed/FeedComposer";
import { Header } from "@/components/layout/Header";
```

이 구조로 나누면 백엔드는 **기능·권한·연결** 기준으로, 프론트는 **기능·권한·페이지** 기준으로 관리하기 쉬워진다.

---

## 5. 실제 적용된 경로 (re-export)

- **백엔드**: `backend/connection`, `backend/permissions`, `backend/features/<auth|posts|comments|feed|profile|admin|notifications|onboarding|reports|notes|search>`
  - 기존 `lib/data/repository`, `lib/auth/session` 등은 유지되고, 위 경로에서 re-export.
- **프론트 레이아웃**: `components/layout` → `common/Header`, `HeaderWrapper` re-export.
- **프론트 기능별**: `components/features/feed`, `components/features/post`, `components/features/shared` 등에서 해당 컴포넌트 re-export.

점진적으로 기존 `@/lib/...` import를 `@/backend/connection`, `@/backend/features/posts` 등으로 바꾸면 된다.
