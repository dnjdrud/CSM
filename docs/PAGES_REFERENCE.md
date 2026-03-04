# CSM 페이지별 상세 레퍼런스

앱의 **페이지(라우트) 단위**로 URL, 설계 의도, 진입점, 데이터, UI, 액션을 정리한 문서입니다.

---

## Part 0. 전체 페이지 진입점 및 설계 단계

이 섹션에서는 **모든 라우트의 진입 경로**와 **설계 단계에서 정한 목적·기능**을 한눈에 설명합니다.

### 0.1 라우트 맵 (진입점 요약)

| 경로 | 구분 | 진입 경로 | 설계 목적 |
|------|------|-----------|-----------|
| **`/`** | 공개 | 브라우저 최초 접속, 로고 클릭 | 서비스 소개·가치 제안, 피드/글쓰기로 유도 |
| **`/principles`** | 공개 | 랜딩 "Why"·푸터 링크 | 플랫폼 원칙 안내(알고리즘 없음, 광고 없음 등) |
| **`/onboarding`** | 공개 | 비로그인 상태로 보호 경로 접근 시 리다이렉트, Sign in | 매직 링크 로그인 + 프로필 미완성 시 프로필 입력 |
| **`/auth/callback`** | 공개 | 매직 링크 클릭 후 Supabase 리다이렉트 | 세션 설정, 이후 피드 등으로 이동 |
| **`/feed`** | 앱(로그인) | 헤더 "Community", 랜딩 "Enter quietly" | 메인 타임라인·글쓰기·고정글·Daily Prayer |
| **`/write`** | 앱 | 헤더 "Write", 랜딩 링크 | 전용 글쓰기(확장 ComposeBox) |
| **`/post/[id]`** | 앱 | 피드/프로필/검색/토픽에서 포스트 클릭 | 단일 포스트 상세·댓글·반응·신고·수정/삭제 |
| **`/me`** | 앱 | 헤더 "My Space" | 개인 노트(Prayer/Gratitude/Meditation)·일일 프롬프트·Answer note·Share as testimony |
| **`/profile/[id]`** | 앱 | 포스트 작성자명·검색 결과·팔로우 목록 등 | 사용자 프로필 홈(섹션 기반)·팔로우·Support |
| **`/topics`** | 앱 | 헤더 "Topics", 피드 하단 링크 | 인기 태그 목록·태그별 포스트 진입 |
| **`/topics/[tag]`** | 앱 | /topics 또는 포스트 태그 클릭 | 특정 태그 포스트 목록 |
| **`/search`** | 앱 | 헤더 "Search", 피드 하단 링크 | 포스트·사람·태그 통합 검색 |
| **`/notifications`** | 앱 | 헤더 "Notifications" | 알림 목록·읽음 처리 |
| **`/support`** | 공개 | 헤더 "Support", 랜딩/푸터 | 지원 랜딩·사역 목록 |
| **`/support/[id]`** | 공개 | /support에서 사역별 링크 | 특정 사역 지원 플로우 |
| **`/support/thank-you`** | 공개 | 지원 플로우 완료 후 | 감사 페이지 |
| **`/admin`** | 어드민 | 헤더 또는 직접 URL(ADMIN만) | 대시보드·통계·Create Daily Prayer |
| **`/admin/moderation`** | 어드민 | /admin 또는 레이아웃 링크 | 신고 큐·Hide/Delete/Resolve |
| **`/admin/users`** | 어드민 | /admin 레이아웃 | 사용자 목록·역할·block/mute |
| **`/admin/audit`** | 어드민 | /admin 레이아웃 | 감사 로그 |
| **`/admin/invites`** | 어드민 | /admin 레이아웃 | 초대 코드 목록 |

### 0.2 설계 단계에서 정한 기능·역할

- **공개 영역**  
  - 비로그인 사용자도 접근 가능. 랜딩·원칙·지원·온보딩(로그인 유도)까지 담당.  
  - **설계**: "첫 방문에서 부담 없이 가치를 전달하고, 로그인/프로필 완성으로 자연스럽게 유도."

- **앱 영역 (로그인 필수)**  
  - **피드**: 커뮤니티 타임라인, 스코프(전체/팔로잉), 고정글·Daily Prayer·무한 스크롤.  
  - **설계**: "알고리즘 없음, 느린 읽기, 한 곳에서 소통과 발견."
  - **글쓰기**: 피드 상단 + /write 전용.  
  - **설계**: "공유 공간이지 무대가 아님(Shared space, not a stage)."
  - **포스트 상세**: 댓글·답글·반응·신고·본인 글/댓글 수정·삭제.  
  - **설계**: "대화와 반응은 명시적, 본인 콘텐츠만 수정/삭제."
  - **My Space (/me)**: 개인 전용 노트(Prayer/Gratitude/Meditation), 일일 프롬프트, Answer note, Share as testimony.  
  - **설계**: "조용한 개인 공간, 응답된 기도를 간증으로 공유하는 것은 사용자가 명시적으로 선택."
  - **프로필 (/profile/[id])**: 섹션 기반 홈(Notes, Testimonies, Recent posts, About), 역할별 강조.  
  - **설계**: "탭보다 섹션, 역할에 맞는 진입점(Missionary 지원 강조 등)."
  - **탐색**: Topics, Search, Notifications.  
  - **설계**: "태그·검색·알림으로 발견과 참여 유도, 트렌드 없음."

- **지원 영역**  
  - 사역 목록·사역별 지원 플로우·감사 페이지.  
  - **설계**: "지원은 신중하고, 감사 메시지로 마무리."

- **관리자 영역**  
  - 대시보드, 신고 처리, Daily Prayer 생성, 사용자·감사·초대.  
  - **설계**: "ADMIN만 접근, 감사 로그로 모든 조치 추적."

### 0.3 미들웨어·보호 규칙 (설계 반영)

- **PUBLIC_PATHS**: `/`, `/principles`, `/onboarding`, `/auth/callback` → 비로그인 허용.
- **그 외 경로**: 세션 없으면 `/onboarding?from=...` 리다이렉트. 세션 있으나 프로필(users 레코드) 없으면 `/onboarding` 리다이렉트.
- **`/admin/*`**: 세션 + `users.role === 'ADMIN'` 또는 `ADMIN_EMAILS` 이메일. 아니면 `/feed?message=admin_required`.

---

## 목차

1. [공개·랜딩](#1-공개랜딩)
2. [인증·온보딩](#2-인증온보딩)
3. [피드·글쓰기](#3-피드글쓰기)
4. [포스트·댓글](#4-포스트댓글)
5. [My Space](#5-my-space)
6. [프로필](#6-프로필)
7. [탐색·알림](#7-탐색알림)
8. [지원·정적](#8-지원정적)
9. [관리자](#9-관리자)

---

## 1. 공개·랜딩

### `GET /` (홈/랜딩)

| 항목 | 내용 |
|------|------|
| **역할** | 비로그인·로그인 모두 접근. 서비스 가치 제안과 진입점 제공. |
| **보호** | 공개. `PUBLIC_PATHS`에 포함. |
| **데이터** | 서버 데이터 없음. 정적 마크업만. |
| **레이아웃** | Root layout(HeaderWrapper). 본문 `max-w-3xl` 등. |
| **UI 구성** | **Hero**: 헤드라인 "A digital sanctuary for the Christian life", 서브 "No algorithms. No ads. No noise.", 보조 문구 "A place for prayer, Scripture, testimony, and mission.", CTA Primary "Enter quietly"(→/feed), Secondary "Why this exists"(→#why, rounded-lg·transition). **Why**: 짧은 설명 + Principles / Support 링크. **Footer**: Principles, Support, Contact, "CSM". |
| **주요 링크** | `/feed`, `#why`, `/principles`, `/support`. |

---

## 2. 인증·온보딩

### `GET /onboarding`

| 항목 | 내용 |
|------|------|
| **역할** | 매직 링크 로그인 진입점 + 로그인 후 프로필 미완성 시 초대 코드 → 프로필 입력. |
| **보호** | 공개. 이미 프로필 있으면 `redirect("/feed")`. |
| **분기** | ① getCurrentUser() 존재 → /feed 리다이렉트. ② getAuthUserId()만 존재 → **OnboardingFlow**: InviteGateForm("You're invited", 초대 코드 입력) → OnboardingForm("Introduce yourself", 이름·역할·bio·초대코드). ③ 비로그인 → MagicLinkForm(이메일 입력, "used only for sign-in, not shared" 안내 → 매직 링크 발송; 발송 후 "Check your email", 링크 클릭 안내·스팸함 안내). |
| **데이터** | getCurrentUser(), getAuthUserId(). |
| **제출 후** | 매직 링크 클릭 → /auth/callback → 세션 설정. InviteGateForm에서 코드 입력 후 OnboardingForm으로. OnboardingForm 제출 → invite 코드 검증·public.users 프로필 생성 후 피드 등으로 이동. |

### `GET /auth/callback`

| 항목 | 내용 |
|------|------|
| **역할** | Supabase 매직 링크 콜백. 쿠키 세션 저장 후 리다이렉트. |
| **보호** | 공개. |

---

## 3. 피드·글쓰기

### `GET /feed`

| 항목 | 내용 |
|------|------|
| **역할** | 메인 타임라인. 전체/팔로잉 스코프, 상단 Compose, 고정글 1개, Daily Prayer 안내. |
| **보호** | 로그인 필수. 비로그인 시 /onboarding?from=... 리다이렉트. |
| **쿼리** | `scope`: "following" | 미지정(ALL). |
| **데이터** | getCurrentUser(), listFeedPostsPage(scope, cursor), listFollowingIds. |
| **필터** | block/mute 제외, canViewPost(visibility). |
| **UI 구성** | FeedScopeToggle(ALL/FOLLOWING, 토큰·탭 전환 transition), ComposeBox(로그인 시; 콘텐츠 있으면 Post 버튼 항상 노출, 성공 시 "Posted" 잠시 후 접기, 에러 시 인라인 문구, 확장 시 하단 sticky·safe area), FeedInfiniteList(무한 스크롤, space-y-6 모바일). PostCard: 단일 primary 라벨(Daily Prayer/Testimony), 본인 글 PostActionsMenu, 인라인 댓글(들여쓰기·작은 글씨), 반응 버튼 44px·토글 시 미세 스케일 피드백. |
| **액션** | composePostAction(성공 시 revalidatePath, router.refresh). |

### `GET /write`

| 항목 | 내용 |
|------|------|
| **역할** | 전용 글쓰기. ComposeBox 확장·More options 기본 노출. |
| **보호** | 로그인 필수. |
| **데이터** | 없음(클라이언트 폼). |
| **UI 구성** | "Share", "This is a shared space, not a stage." → ComposeBox(defaultExpanded, defaultMoreOptions, redirectOnSuccess="/feed"). "← Back to feed". |
| **액션** | composePostAction / publishPostAction → 저장 후 router.push("/feed"). |

---

## 4. 포스트·댓글

### `GET /post/[id]`

| 항목 | 내용 |
|------|------|
| **역할** | 단일 포스트 상세. 본문, 댓글 목록·작성·답글·수정/삭제, 반응(Prayed/With you), 신고. |
| **보호** | 로그인 필수. canViewPost 실패 시 "This post is not available." + Back to feed. |
| **데이터** | getPostById(id), getCurrentUser(), listFollowingIds, listCommentsByPostId(id). block/mute 필터. |
| **UI 구성** | "← Back to feed", 헤더(작성자·역할·날짜·affiliation), ReportMenu. 본문(title, content, tags), Reflection(reflectionPrompt 있으면). CommentForm, CommentList(본인 댓글 Edit/Delete). PostCard와 동일한 반응·카테고리(TESTIMONY 뱃지). |
| **액션** | addCommentAction, getCommentsForPostAction, deleteCommentAction, updateCommentAction, deletePostAction, updatePostAction. |

---

## 5. My Space

### `GET /me`

| 항목 | 내용 |
|------|------|
| **역할** | 개인 전용 노트 공간. Prayer / Gratitude / Meditation 탭, 일일 프롬프트, Overview, Answer note·Share as testimony. |
| **보호** | 로그인 필수. 비로그인 시 redirect("/onboarding"). |
| **쿼리** | `tab`: prayer | gratitude | meditation (기본 prayer). `prompt`: "daily" 시 해당 탭 Composer에 일일 placeholder. |
| **데이터** | getCurrentUser(), listNotesByType(userId, activeTab), getMySpaceOverview(userId), hasNoteOfTypeToday(userId, PRAYER), hasNoteOfTypeToday(userId, GRATITUDE). |
| **UI 구성** | "← Back to feed", "My Space", "A quiet place for your personal notes." **Today**: DailyPromptCards(Prayer/Gratitude 카드, 오늘 미작성 시 프롬프트·"Add a prayer note" 등, 완료 시 "Done for today"). **Overview**: MySpaceOverviewCards(활성 기도·응답된 기도·감사·명상 수 등). **NotesTabs** → NoteComposer(또는 MeditationComposer) → NotesList(NoteCard / MeditationNoteCard). NoteCard: ANSWERED + answerNote 시 Answer 섹션, "Add answer note" / "Edit", 모달("How was this prayer answered?"); "Share as testimony" / "Shared as testimony" + View post. |
| **액션** | createNoteAction, updateNoteAction, deleteNoteAction, toggleShareToProfileAction, publishNoteAction, updatePrayerAnswerAction, publishTestimonyAction. revalidatePath("/me"), publishTestimony 시 revalidatePath("/feed"). |

---

## 6. 프로필

### `GET /profile/[id]`

| 항목 | 내용 |
|------|------|
| **역할** | 사용자 프로필 홈 v2(섹션 기반). Hero, 통계, 역할별 섹션 순서. |
| **보호** | 로그인 필수. 없는 사용자 notFound(). |
| **쿼리** | `view`: notes | testimonies | posts (See all 링크용, MVP에서 전용 페이지는 선택). |
| **데이터** | getUserById(id), getCurrentUser(), listPostsByAuthorId(id), listSharedNotesByUserId(userId, PRAYER), isFollowing, isBlocked, isMuted. testimonies = posts.filter(category===TESTIMONY), postsExcludingTestimonies = 나머지. |
| **UI 구성** | "← Back to feed". **ProfileHero**: 이름(가장 강조), 역할은 plain text(뱃지 아님), affiliation·bio 절제·line-clamp-2. 본인 아니면 ProfileFollowButton, UserActionsMenu(mute/block). 본인이면 "Go to My Space". Missionary(타인)면 "Support this work"(secondary 스타일·테두리 버튼). 버튼/링크 min-h-[44px] 터치. **ProfileStatsStrip**: StatCard variant="plain"(테두리 없음, 숫자 강조·라벨 muted). **섹션**(getProfileSectionOrder(role, hasTestimonies)): **Notes** → FeaturedNotes, **Testimonies** → FeaturedTestimonies, **Recent posts** → RecentPosts, **About** → ProfileAboutSection. 각 섹션 "See all" 링크(갯수 초과 시). 하단 "Support this work"(본인·Missionary 제외). |
| **컴포넌트** | ProfileHero, ProfileStatsStrip, ProfileSection, FeaturedNotes, FeaturedTestimonies, RecentPosts, ProfileAboutSection, ProfileFollowButton, UserActionsMenu. |
| **액션** | toggleFollowAction, toggleMuteAction, toggleBlockAction. |

---

## 7. 탐색·알림

### `GET /search`

| 항목 | 내용 |
|------|------|
| **역할** | 포스트·사람·태그 통합 검색. 탭 전환. |
| **보호** | 로그인 필수. |
| **쿼리** | `q`: 검색어. `tab`: posts | people | tags. |
| **데이터** | getCurrentUser(). q 있으면 searchPosts, searchPeople, searchTags. |
| **UI 구성** | "← Back to feed", "Search", SearchForm, SearchTabs, SearchResults(PostCard 등). |

### `GET /topics`

| 항목 | 내용 |
|------|------|
| **역할** | 인기 태그 목록. |
| **보호** | 로그인 필수. |
| **데이터** | listPopularTags(20). |
| **UI 구성** | "← Back to feed", "Topics", TagPill 목록 또는 "No topics yet." |

### `GET /topics/[tag]`

| 항목 | 내용 |
|------|------|
| **역할** | 특정 태그 포스트 목록. |
| **보호** | 로그인 필수. |
| **데이터** | normalizeTag(tag), listPostsByTag(normalized, currentUserId). |
| **UI 구성** | "← All topics", 태그명, PostCard 리스트 또는 "No posts with this topic yet." |

### `GET /notifications`

| 항목 | 내용 |
|------|------|
| **역할** | 현재 사용자 알림 목록·읽음 처리. |
| **보호** | 로그인 필수. |
| **데이터** | getCurrentUser(), listNotifications(userId), actor 보강. |
| **UI 구성** | "← Back to feed", "Notifications", MarkAllReadButton, NotificationList. |
| **액션** | 개별 읽음, 전체 읽음. |

---

## 8. 지원·정적

### `GET /principles`

| 항목 | 내용 |
|------|------|
| **역할** | 플랫폼 원칙 안내. |
| **보호** | 공개. |
| **UI 구성** | "← Back", "Our principles", 짧은 소개 문구. 본문 max-w-[65ch], leading-7, 섹션 간격(space-y-12). 목록(Algorithm-free, No ads no trends, Psychological and spiritual safety first, Slow content intentional reading, Giving is reverent). 선언형·비교 언급 없음. "← Return home". |

### `GET /support`

| 항목 | 내용 |
|------|------|
| **역할** | 지원 랜딩. 사역 목록. |
| **보호** | 공개. |
| **데이터** | getMinistries(). |
| **UI 구성** | "← Back", "Support this work", 사역별 카드 → /support/[id]. |

### `GET /support/[id]`, `GET /support/thank-you`

| 항목 | 내용 |
|------|------|
| **역할** | 특정 사역 지원 플로우, 완료 후 감사 페이지. |
| **보호** | 공개(또는 로그인에 따라). |
| **UI** | SupportFlowForm, thank-you 메시지. |

---

## 9. 관리자

### `GET /admin`

| 항목 | 내용 |
|------|------|
| **역할** | 어드민 대시보드. 통계 + Create Daily Prayer. |
| **보호** | ADMIN만. 아니면 /feed?message=admin_required. |
| **데이터** | getDashboardStats(): openReportsToday, newUsersToday, activeUsersLast7d. |
| **UI 구성** | "Dashboard", 3열 카드, "Create Daily Prayer (today)"(DangerZoneConfirm "create daily prayer"). |
| **액션** | createDailyPrayerAction → createDailyPrayer, revalidatePath("/feed", "/admin"). |

### `GET /admin/moderation`

| 항목 | 내용 |
|------|------|
| **역할** | 열린 신고 큐. Hide, Delete comment, Resolve. |
| **보호** | ADMIN 전용. |
| **데이터** | listOpenReports(), getUserById 등. |
| **UI 구성** | "Moderation", 테이블(Type, Reason, Reporter, Target, Date, Actions). ModerationReportActions: View post, Hide post, Delete comment, Resolve. DangerZoneConfirm. |
| **액션** | hidePostAction, deleteCommentAction, resolveReportAction. |

### `GET /admin/users`, `GET /admin/audit`, `GET /admin/invites`

| 항목 | 내용 |
|------|------|
| **역할** | 사용자 목록·감사 로그·초대 코드. |
| **보호** | ADMIN 전용. |
| **데이터** | adminRepository 등. |
| **UI** | 테이블·필터·액션. |

---

## 공통 사항

- **Root layout**: HeaderWrapper(로고, Community / My Space / Topics / Search / Notifications / Write / Support, 로그인 시 사용자명·Sign out).
- **서버 액션**: "use server", getSession() 또는 getAdminOrNull()로 권한 확인 후 repository 호출, revalidatePath/redirect.
- **도메인**: PostCategory에 TESTIMONY, Note에 status/answerNote. CATEGORY_LABELS.TESTIMONY = "Testimony".
- **디자인**: `lib/design/tokens.ts`, `docs/DESIGN.md` 참고. Card·Section·Button·FeedScopeToggle·NotesTabs는 토큰 사용. TimelineContainer 하단 safe area 반영.

---

## 미비된 부분 / 추가 개발이 필요한 부분

- **랜딩 Contact**: 푸터 "Contact"가 `href="#"`. 실제 문의 경로(메일·폼·페이지) 연결 필요.
- **프로필 view 쿼리**: `view=notes|testimonies|posts`는 있으나 전용 하위 라우트(예: `/profile/[id]/notes`) 없음. "See all" 시 필터된 목록만 보여주는 단순 뷰로 확장 가능.
- **검색·토픽**: `/search`·`/topics` 쿼리·필터 상세(페이지네이션, 정렬)는 구현에 따라 문서 보완.
- **알림**: 실시간 푸시/폴링 미적용 시 "새 알림" 배지 등 부가 UX 문서화 여지.
- **접근성**: 스크린 리더·키보드 전용·색 대비 등 페이지별 체크리스트는 별도 정리 권장.

이 문서는 라우트별 진입점·설계 의도·화면·데이터·액션을 참고하기 위한 레퍼런스입니다. 구현 변경 시 함께 갱신하는 것을 권장합니다.
