# CSM Implementation Summary

현재까지 구현된 내용을 아래 7가지 기준으로 정리한 문서입니다.  
(설명은 한국어, 앱/코드 표시는 영어 기준 유지.)

**페이지별 URL·데이터·UI·액션 상세**는 → [PAGES_REFERENCE.md](./PAGES_REFERENCE.md) 참고.

---

## 1. 프론트엔드 중심

### 공통 UI
- **Root layout** (`app/layout.tsx`): 전역 헤더(CSM 로고, Community / My Space / Topics / Search / Notifications / Write / Support, 로그인 시 사용자명·Sign out, 비로그인 시 Sign in).
- **TimelineContainer**, **HeaderWrapper** 등으로 피드·포스트 상세 공통 레이아웃. TimelineContainer는 iOS safe area(`pb-[max(1rem,env(safe-area-inset-bottom))]`) 반영.
- **디자인 시스템**: `lib/design/tokens.ts`(BG, TEXT, BORDER, PADDING, RADIUS, TYPOGRAPHY, DISABLED, FOCUS_RING, TRANSITION), `tailwind.config.ts` 확장(colors.design, borderRadius, fontSize), `docs/DESIGN.md`(원칙·금지·토큰 표·새 UI 가이드). Card, Section, Button, FeedScopeToggle, NotesTabs가 토큰 사용.

### 페이지별 화면
- **`/`**: 랜딩. Hero(헤드라인 "A digital sanctuary…", 서브 "No algorithms. No ads. No noise.", 보조 문구, CTA "Enter quietly" / "Why this exists"), Why 섹션, 푸터.
- **`/principles`**: 원칙 페이지. 좁은 읽기 폭(max-w-[65ch]), leading-7, 섹션 간격·선언형 톤.
- **`/support`**, **`/support/[id]`**, **`/support/thank-you`**: 정적·지원 플로우.
- **`/onboarding`**: ① 프로필 있으면 /feed. ② Auth만 있으면 **InviteGateForm**(You're invited, 초대 코드) → **OnboardingForm**(Introduce yourself, 이름·역할·bio·초대코드). ③ 비로그인 시 **MagicLinkForm**(이메일 → 매직 링크, "used only for sign-in, not shared" 안내).
- **`/feed`**: 피드(ALL / FOLLOWING), 상단 ComposeBox, 고정글 1개, 커서 기반 무한 스크롤, Daily Prayer 안내, 포스트 카드(반응·인라인 댓글·본인 글 수정/삭제, TESTIMONY 시 "Testimony" 뱃지, 고정글은 "Pinned by community" 문구, Daily Prayer는 소프트 캘아웃). PostCard 모바일: 카드 padding·액션 44px 터치, 반응 토글 시 미세 스케일 피드백. ComposeBox: 콘텐츠 있으면 Post 버튼 항상 노출, 성공 시 "Posted" 잠시 후 접기, 에러 시 인라인 안내.
- **`/post/[id]`**: 단일 포스트 상세, 댓글·반응·신고·본인 글/댓글 수정·삭제.
- **`/write`**: ComposeBox 전용 글쓰기, 게시 후 /feed 리다이렉트.
- **`/topics`**, **`/topics/[tag]`**: 태그 목록·태그별 포스트.
- **`/search`**: 포스트·사람·태그 검색 탭.
- **`/notifications`**: 알림 목록·읽음 처리.
- **`/me` (My Space)**: **개인 전용**. Today(일일 프롬프트 Prayer/Gratitude), Overview 카드(활성 기도·응답된 기도·감사·명상), 탭(Prayer / Gratitude / Meditation), NoteComposer·MeditationComposer, NotesList(NoteCard·MeditationNoteCard). **Answered prayer**에 Answer note 추가/편집, **Share as testimony**로 TESTIMONY 포스트 생성·링크.
- **`/profile/[id]`**: **프로필 홈 v2(섹션 기반)**. ProfileHero(이름 강조, 역할은 plain text, 소속·bio 절제, Follow/UserActionsMenu/Go to My Space/Support this work·44px 터치), ProfileStatsStrip(StatCard variant="plain", 테두리 없음·숫자 강조), 역할별 섹션 순서(Notes·Testimonies·Recent posts·About), FeaturedNotes·FeaturedTestimonies·RecentPosts·ProfileAboutSection.
- **`/admin`**: 어드민 대시보드(통계 + Create Daily Prayer).
- **`/admin/moderation`**: 신고 큐(Pin/Unpin/Hide/Delete comment/Resolve).
- **`/admin/users`**, **`/admin/audit`**, **`/admin/invites`**: 사용자·감사·초대 관리.

### 컴포넌트
- **ComposeBox**, **FeedScopeToggle**(토큰 사용, 탭 전환 부드럽게), **FeedInfiniteList**, **PostCard**(단일 primary 라벨·고정/Daily Prayer 스타일, 본인 글 PostActionsMenu, 인라인 댓글·들여쓰기·작은 글씨), **PostActionsMenu**, **CommentList**/**CommentForm**/**CommentItem**.
- **My Space**: **DailyPromptCards**(소프트 CTA·테두리 버튼), **NoteComposer**, **NoteCard**(border-gray-100·bg-gray-50/30 개인 노트 톤), **MeditationComposer**/**MeditationNoteCard**/**MeditationEditorModal**, **MySpaceOverviewCards**. **NotesTabs** 토큰·44px 터치.
- **Profile**: **ProfileHero**, **ProfileStatsStrip**, **ProfileSection**, **FeaturedNotes**, **FeaturedTestimonies**, **RecentPosts**, **ProfileAboutSection**, **ProfileFollowButton**, **UserActionsMenu**.
- **UI 공통**: 버튼/탭에 transition·active 상태, disabled는 opacity-40·cursor-not-allowed. UI 텍스트는 영어 유지.

---

## 2. 데이터 기준

### 도메인 타입 (`lib/domain/types.ts`)
- **User**: id, name, role (LAY | MINISTRY_WORKER | PASTOR | MISSIONARY | SEMINARIAN | ADMIN), bio, affiliation, createdAt.
- **Post**: id, authorId, **category (PRAYER | DEVOTIONAL | MINISTRY | TESTIMONY)**, title?, content, visibility, tags[], reflectionPrompt?, createdAt, pinnedAt?, pinnedBy?.
- **Note**: id, userId, type (PRAYER | GRATITUDE | MEDITATION), title?, content, tags[], isArchived, shareToProfile, publishedPostId?, **status?** (PRAYER용 ONGOING | ANSWERED), **answerNote?**, createdAt, updatedAt.
- **Comment**, **Reaction**, **Follow**, **Notification**, **ModerationReport** 등.

### 페이지네이션·Daily Prayer
- **FeedCursor**, **FeedPageResult** (`lib/domain/pagination.ts`), **encodeCursor/decodeCursor** (`lib/data/feedCursor.ts`).
- **buildDailyPrayerPost** (`lib/domain/dailyPrayer.ts`): category PRAYER, tags ["daily-prayer"].

### 데이터 소스
- **DATA_MODE**: `NEXT_PUBLIC_SUPABASE_*` 설정 시 `"supabase"`, 미설정 시 `"memory"`.
- **repository.ts**: 단일 진입점. **listFeedPostsPage**, **listNotesByType**, **listSharedNotesByUserId**, **hasNoteOfTypeToday**, **createNote**/**updateNote**/**updatePrayerAnswer**/**publishPrayerAsTestimony**, **publishNoteToCommunity**, **listPostsByAuthorId** 등.
- **supabaseRepository.ts**: notes에 **status**, **answer_note** 매핑·조회. posts에 **title** select. TESTIMONY 카테고리 지원.

### 세션·프로필
- Session: Supabase Auth + public.users. Admin 부트스트랩: **ADMIN_EMAILS**로 role = 'ADMIN' 갱신.

---

## 3. 워크플로우 기준

### 인증
- Sign in → onboarding → magic link → /auth/callback → 프로필 생성 후 피드 등 이용.

### 콘텐츠
- **피드**: ALL/FOLLOWING, 고정글 1개, listFeedPostsPage + 무한 스크롤, Daily Prayer 안내, PostCard(반응·댓글·수정/삭제·TESTIMONY 뱃지).
- **글쓰기**: ComposeBox(피드/Write) → composePostAction / publishPostAction.
- **댓글**: 피드 인라인·포스트 상세 CommentForm/CommentList, 본인 댓글 Edit/Delete.
- **포스트 수정/삭제**: 본인만 PostActionsMenu → Edit/Delete.

### My Space (Private Notes)
- **Prayer / Gratitude / Meditation** 탭별 노트 작성·목록. **Answer note**: status === ANSWERED인 기도에 "How was this prayer answered?" 추가/편집(notes.answer_note).
- **Daily prompts**: 오늘 해당 타입 노트 미작성 시 "Today" 섹션에서 Prayer/Gratitude 프롬프트·링크 → 해당 탭 Composer에 placeholder.
- **Share as testimony**: ANSWERED + answer_note + 미공개 시 "Share as testimony" → publishPrayerAsTestimony → TESTIMONY 포스트 생성, notes.published_post_id 연결. idempotent.

### 프로필
- **Profile v2**: Hero → Stats(Notes/Posts/Testimonies) → 역할별 섹션 순서(Notes, Testimonies, Recent posts, About). Missionary는 Notes→Testimonies→Posts→About; Lay/Seminarian은 Notes→Posts→About(Testimonies 있으면 삽입); Pastor/Ministry Worker/Admin은 Posts→Notes→About.

### 신고·관리·Daily Prayer
- Report → moderation_reports. ADMIN이 /admin/moderation에서 Pin/Unpin/Hide/Delete comment/Resolve. **Create Daily Prayer** → createDailyPrayerAndPin, audit CREATE_DAILY_PRAYER+PIN_POST.

---

## 4. 권한 중심

### 역할
- **UserRole**: LAY, MINISTRY_WORKER, PASTOR, MISSIONARY, SEMINARIAN, ADMIN.

### 라우트 보호
- 공개: `/`, `/principles`, `/onboarding`, `/auth/callback`. 그 외 로그인 필수. `/admin/*`는 role === 'ADMIN' 또는 ADMIN_EMAILS.

### 페이지·액션
- 포스트/댓글 수정·삭제: 작성자만. 고정글·Daily Prayer 생성: ADMIN만. **Answer note·Share as testimony**: 노트 소유자만, PRAYER + ANSWERED + answer_note 조건.

---

## 5. 보안 중심

### 인증·RLS
- Supabase Auth 매직 링크, 쿠키 세션, RLS. block/mute 필터, canViewPost(visibility).

### 서버 액션
- **feed**: loadMoreFeedAction. **post/[id]**: addCommentAction, getCommentsForPostAction, deleteCommentAction, updateCommentAction, deletePostAction, updatePostAction.
- **me**: createNoteAction, updateNoteAction, deleteNoteAction, toggleShareToProfileAction, publishNoteAction, **updatePrayerAnswerAction**, **publishTestimonyAction** (revalidatePath /me, /feed).
- **admin**: createDailyPrayerAction; **admin/moderation**: hidePostAction, pinPostAction, unpinPostAction 등.

---

## 6. 백엔드 중심

### 런타임
- Next.js 15 App Router, Server Actions + RSC. Supabase Auth, Postgres.

### 데이터 레이어
- **repository.ts**: listFeedPostsPage, listNotesByType, listSharedNotesByUserId, hasNoteOfTypeToday, createNote, updateNote, updatePrayerAnswer, publishPrayerAsTestimony, publishNoteToCommunity, listPostsByAuthorId 등. Supabase 위임 또는 메모리 구현.
- **supabaseRepository.ts**: notes status/answer_note, posts title/category TESTIMONY, publishPrayerAsTestimony(조건 검사 후 Post 생성·notes 업데이트).

### 마이그레이션
- users, posts( title, pinned_at, pinned_by, hidden_at, hidden_by ), notes( status, answer_note ), comments, follows, reactions, notifications, moderation_reports, audit_logs 등.

---

## 7. 구현된 기능 중심

| 기능 | 설명 | 비고 |
|------|------|------|
| **랜딩·정적** | /, /principles, /support, /support/[id], thank-you | 공개 |
| **매직 링크·온보딩** | /onboarding, /auth/callback, 프로필 생성 | |
| **글로벌 헤더** | Community, My Space, Topics, Search, Notifications, Write, Support | |
| **피드** | ALL/FOLLOWING, ComposeBox, 고정글, 무한 스크롤, Daily Prayer 안내, PostCard(TESTIMONY 뱃지) | |
| **포스트 상세** | 본문·댓글·반응·신고·본인 글/댓글 수정·삭제 | |
| **글쓰기** | ComposeBox(피드/Write), publishPostAction | |
| **포스트 수정/삭제** | 본인만 PostActionsMenu | |
| **댓글 인라인·수정/삭제** | 피드/상세, 본인만 Edit/Delete | |
| **태그·토픽** | /topics, /topics/[tag] | |
| **검색** | 포스트·사람·태그 탭 | |
| **알림** | 목록·읽음 처리 | |
| **My Space** | /me — Today(일일 프롬프트), Overview, Prayer/Gratitude/Meditation 탭, 노트 작성·목록 | 전용 |
| **Answer note** | ANSWERED 기도에 답변 노트 추가/편집, notes.answer_note | |
| **Share as testimony** | ANSWERED+answer_note → TESTIMONY 포스트 생성, published_post_id | idempotent |
| **Daily prompts** | 오늘 Prayer/Gratitude 미작성 시 프롬프트 카드·Composer placeholder | |
| **프로필 v2** | /profile/[id] — Hero, Stats, 역할별 섹션(Notes, Testimonies, Posts, About) | |
| **팔로우·반응·신고** | ProfileFollowButton, UserActionsMenu, 반응 토글, Report | |
| **어드민** | /admin(대시보드, Create Daily Prayer), /admin/moderation(신고 큐) | ADMIN |
| **고정글·Daily Prayer** | getPinnedPost, Create Daily Prayer, audit | |

---

## 미비된 부분 / 추가 개발이 필요한 부분

- **Contact 링크**: 랜딩 푸터 "Contact"가 `href="#"`로만 연결됨. 실제 연락처·문의 경로 연결 필요.
- **검색·토픽 동적 라우트**: `/topics`는 `cookies` 사용으로 정적 생성 불가(dynamic). 필요 시 `export const dynamic = 'force-dynamic'` 등 명시.
- **반응 카운트 UI**: 피드/포스트 상세에 Prayed·With you **집계 수** 노출은 없음(현재 본인 반응 상태만). 필요 시 도메인·API·UI 추가.
- **See all 전용 뷰**: 프로필 `view=notes|testimonies|posts` 쿼리는 있으나, 해당 뷰 전용 페이지(예: `/profile/[id]/notes`) 미구현. 목록만 필터하는 단순 뷰로 확장 가능.
- **알림 실시간성**: 알림 목록은 페이지 로드 시점 데이터. 실시간 구독( Supabase Realtime 등) 미적용.
- **디자인 토큰 적용 범위**: PostCard·ComposeBox·EmptyState·FlashBanner 등은 아직 토큰 직접 import 없이 Tailwind 클래스만 사용. 점진적으로 토큰으로 통일하면 유지보수에 유리.
- **다국어**: UI 텍스트 영어 고정. i18n 도입 시 라우트·문자열 키·설계 정리 필요.
- **접근성 감사**: 스크린 리더·키보드만 사용·색 대비 등 정식 감사 미실시. 필요 시 WCAG 체크리스트 기준으로 점검.

이 문서는 위 7가지 관점으로 현재 구현 상태를 요약한 것입니다. 기능 추가·변경 시 이 파일을 갱신하면 됩니다.
