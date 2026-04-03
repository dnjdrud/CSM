# CSM 페이지별 상세 레퍼런스

앱의 **페이지(라우트) 단위**로 URL, 설계 의도, 진입점, 데이터, UI, 액션을 정리한 문서입니다.

Last updated: 2026-03-27

---

## Part 0. 전체 페이지 진입점 및 설계 단계

### 0.1 라우트 맵 (진입점 요약)

| 경로 | 구분 | 진입 경로 | 설계 목적 |
|------|------|-----------|-----------|
| **`/login`** | 공개 | 비로그인 상태로 보호 경로 접근 시 리다이렉트 | 매직 링크 로그인 + 초대 코드 입력 |
| **`/onboarding`** | 공개 | 로그인 후 프로필 미완성 시 | 이름·역할·bio 프로필 설정 |
| **`/principles`** | 공개 | 푸터 링크 | 플랫폼 원칙 안내(알고리즘 없음, 광고 없음 등) |
| **`/guide`** | 공개 | 설정 내 링크 | 서비스 이용 가이드 |
| **`/contact`** | 공개 | 푸터 링크 | 문의 페이지 |
| **`/request-access`** | 공개 | 직접 URL | 액세스 요청 폼 |
| **`/support`** | 공개 | 직접 링크 | 사역 지원 랜딩·목록 |
| **`/support/[id]`** | 공개 | /support 목록 | 특정 사역 지원 플로우 |
| **`/support/thank-you`** | 공개 | 지원 플로우 완료 후 | 감사 페이지 |
| **`/home`** | 앱(로그인) | BottomNav "홈", `/feed` 리다이렉트 | 팔로잉 피드·글쓰기·Daily Prayer |
| **`/write`** | 앱 | 헤더 글쓰기 버튼 | 전용 글쓰기 |
| **`/post/[id]`** | 앱 | 피드/프로필/검색에서 포스트 클릭 | 단일 포스트 상세·댓글·반응 |
| **`/cells`** | 앱 | BottomNav "셀" | 셀 허브: 관심사 토픽 + 커뮤니티 게시판 |
| **`/cells/[id]`** | 앱 | /cells 토픽 카드 등 | 셀 상세·멤버·미팅 |
| **`/cells/counsel`** | 앱 | /cells 게시판 "고민상담" | 신앙 질문·고민 게시판 |
| **`/cells/topics/[slug]`** | 앱 | /cells 토픽 카드 | 토픽 기반 셀 피드 |
| **`/contents`** | 앱 | BottomNav "콘텐츠", `/explore` 리다이렉트 | YouTube 콘텐츠 피드 (추천 스코어링) |
| **`/shorts`** | 앱 | BottomNav "숏츠" | 숏폼 세로 영상 피드 |
| **`/mission`** | 앱 | BottomNav "셀" 탭에서 게시판 "선교" | 세계 선교 포스트 피드 (국가 필터) |
| **`/mission/[country]`** | 앱 | /mission 국가 필터 | 국가별 선교 포스트 |
| **`/missions`** | 앱 | /mission 내 링크 | 선교 프로젝트 디렉토리 |
| **`/missions/[id]`** | 앱 | /missions 목록 | 선교 프로젝트 상세·기도 후원 |
| **`/missionary`** | 앱 | /missions 내 링크 (MISSIONARY only) | 선교사 대시보드 |
| **`/missionary/project/create`** | 앱 | /missionary 대시보드 | 선교 프로젝트 등록 (MISSIONARY only) |
| **`/me`** | 앱 | BottomNav "프로필" | redirect → /profile/[현재 사용자 id] |
| **`/profile/[id]`** | 앱 | 포스트 작성자 클릭·검색 결과·팔로우 목록 등 | 사용자 프로필 (포스트·숏츠 탭) |
| **`/profile/[id]/followers`** | 앱 | 프로필 팔로워 수 클릭 | 팔로워 목록 |
| **`/profile/[id]/following`** | 앱 | 프로필 팔로잉 수 클릭 | 팔로잉 목록 |
| **`/messages`** | 앱 | 헤더 메시지 아이콘 | DM 인박스 |
| **`/messages/[userId]`** | 앱 | /messages 대화 목록 | DM 스레드 |
| **`/notifications`** | 앱 | 헤더 알림 벨 아이콘 | 알림 목록·읽음 처리 |
| **`/bookmarks`** | 앱 | 설정 내 링크 | 저장된 포스트 목록 |
| **`/search`** | 앱 | 헤더 또는 내부 링크 | 포스트·사람·태그 통합 검색 |
| **`/topics/[tag]`** | 앱 | 포스트 태그 클릭 | 특정 태그 포스트 목록 |
| **`/settings`** | 앱 | 헤더 설정 아이콘 | 설정 허브 |
| **`/settings/profile`** | 앱 | /settings, `/profile/[id]/edit` 리다이렉트 | 프로필 편집 (canonical) |
| **`/settings/account`** | 앱 | /settings | 계정 관리·탈퇴 |
| **`/settings/notifications`** | 앱 | /settings | 알림 설정 |
| **`/admin`** | 어드민 | 헤더 (ADMIN only) | 대시보드·통계·Daily Prayer 생성 |
| **`/admin/moderation`** | 어드민 | /admin 레이아웃 | 신고 큐·Hide/Delete/Resolve |
| **`/admin/users`** | 어드민 | /admin 레이아웃 | 사용자 목록·역할·차단 |
| **`/admin/audit`** | 어드민 | /admin 레이아웃 | 감사 로그 |
| **`/admin/invites`** | 어드민 | /admin 레이아웃 | 초대 코드 관리 |

### 0.2 미들웨어·보호 규칙

- **공개(PUBLIC) 경로**: `/login`, `/onboarding/*`, `/principles`, `/guide`, `/contact`, `/request-access`, `/support/*`, `/auth/*` → 비로그인 허용.
- **앱 경로**: 세션 없으면 `/login?from=...` 리다이렉트. 세션 있으나 `public.users` 레코드 없으면 `ensureProfile()` 후 `/onboarding` 리다이렉트.
- **`/admin/*`**: 세션 + `users.role === 'ADMIN'` 필수. 아니면 `/home?message=admin_required`.
- **`/missionary/*`**: MISSIONARY role 또는 ADMIN만 접근 (일부 액션 role-gated).

### 0.3 네비게이션 구조

**BottomNav (5탭, 모바일 고정)**
홈(`/home`) · 셀(`/cells`) · 콘텐츠(`/contents`) · 숏츠(`/shorts`) · 프로필(`/me`)

**Header (홈 화면에서만 표시: `/` · `/home` · `/feed`)**
로고(CellahLogo) · 알림 벨(unread count, 10초 폴링) · 글쓰기 · 메시지 · 유저 메뉴

**설정 허브(`/settings`)에서 진입**
프로필 편집 · 계정 · 알림 설정 · 북마크 · 언어 설정 · 이용 가이드 · 로그아웃 · 어드민 패널(ADMIN only)

---

## 목차

1. [공개·인증·온보딩](#1-공개인증온보딩)
2. [홈 피드·글쓰기](#2-홈-피드글쓰기)
3. [포스트 상세](#3-포스트-상세)
4. [셀·커뮤니티](#4-셀커뮤니티)
5. [콘텐츠·숏츠](#5-콘텐츠숏츠)
6. [선교](#6-선교)
7. [프로필·메시지](#7-프로필메시지)
8. [탐색·알림·북마크](#8-탐색알림북마크)
9. [설정](#9-설정)
10. [관리자](#10-관리자)

---

## 1. 공개·인증·온보딩

### `GET /login`

| 항목 | 내용 |
|------|------|
| **역할** | 매직 링크 로그인 진입점 + 초대 코드 입력. |
| **보호** | 공개. 이미 세션·프로필 있으면 `/home` 리다이렉트. |
| **분기** | ① 비로그인 → 이메일 입력 → 매직 링크 발송 ("Check your email"). ② getAuthUserId()만 존재(세션 있으나 프로필 없음) → 초대 코드 → OnboardingFlow. |
| **제출 후** | 매직 링크 클릭 → `/auth/verify-magic` → 세션 설정 → `/home`. |

### `GET /onboarding`

| 항목 | 내용 |
|------|------|
| **역할** | 이름·역할·bio 프로필 초기 설정. |
| **보호** | 공개. 프로필 완성 시 `/home` 리다이렉트. |
| **데이터** | getAuthUserId(). |
| **UI 구성** | OnboardingForm: 이름, 역할(LAY/MISSIONARY/PASTOR), bio, 초대 코드 검증. |
| **제출 후** | public.users 생성 → `/home`. |

### `GET /principles`

| 항목 | 내용 |
|------|------|
| **역할** | 플랫폼 원칙 안내 정적 페이지. |
| **보호** | 공개. |
| **UI 구성** | 본문 max-w-[65ch]. 원칙 목록(Algorithm-free, No ads, Psychological and spiritual safety, Slow content, Giving is reverent). "← Return home". |

### `GET /support`, `/support/[id]`, `/support/thank-you`

| 항목 | 내용 |
|------|------|
| **역할** | 사역 지원 랜딩 → 지원 플로우 → 감사 페이지. |
| **보호** | 공개. |
| **데이터** | getMinistries() (목록), getMinistryById(id) (상세). |
| **UI 구성** | 사역별 카드 → SupportFlowForm → thank-you 메시지. |

---

## 2. 홈 피드·글쓰기

### `GET /home`

| 항목 | 내용 |
|------|------|
| **역할** | 메인 팔로잉 피드. Daily Prayer 배너·Composer·무한 스크롤. |
| **보호** | 로그인 필수. (`/feed`는 `/home`으로 리다이렉트.) |
| **데이터** | `getCurrentUser()`, `listFeedPostsPage(scope="FOLLOWING")`, `listFollowingIds()`, `getTodaysDailyPrayer()`, `getBookmarkedPostIds()`. 병렬 패치. force-dynamic. |
| **UI 구성** | **DailyPrayerBanner**(오늘의 Daily Prayer 고정 표시). **FeedComposer**(상단 글쓰기 박스). **SuggestedPeople**(팔로잉 없을 시). **HomeInfiniteList**(무한 스크롤, PostCard 목록). |
| **특이사항** | 팔로잉 피드만 표시(scope="FOLLOWING"). 팔로잉 없으면 SuggestedPeople CTA 노출. |
| **액션** | composePostAction → revalidatePath("/home"). |

### `GET /write`

| 항목 | 내용 |
|------|------|
| **역할** | 전용 글쓰기. ComposeBox 확장·More options 기본 노출. |
| **보호** | 로그인 필수. |
| **데이터** | 없음(클라이언트 폼). |
| **UI 구성** | "← Back", ComposeBox(defaultExpanded, defaultMoreOptions). 제목·본문·태그·카테고리·visibility 옵션. |
| **액션** | composePostAction / publishPostAction → 저장 후 router.push("/home"). |

---

## 3. 포스트 상세

### `GET /post/[id]`

| 항목 | 내용 |
|------|------|
| **역할** | 단일 포스트 상세. 본문·댓글·답글·반응·신고·수정/삭제. |
| **보호** | 로그인 필수. canViewPost 실패 시 "This post is not available." |
| **데이터** | `getPostById(id)`, `getCurrentUser()`, `listFollowingIds()`, `listCommentsByPostId(id)`. block/mute 필터 적용. |
| **UI 구성** | "← Back", 헤더(작성자·역할·날짜·affiliation), ReportMenu. 본문(title, content, tags), TESTIMONY 뱃지. CommentForm, CommentList(본인 댓글 Edit/Delete). 반응 버튼(Prayed / With you). |
| **액션** | addCommentAction, deleteCommentAction, updateCommentAction, deletePostAction, updatePostAction, reportPostAction. |

---

## 4. 셀·커뮤니티

### `GET /cells`

| 항목 | 내용 |
|------|------|
| **역할** | 셀 허브. 관심사 기반 토픽 카드 + 커뮤니티 게시판. |
| **보호** | 로그인 필수. |
| **데이터** | CELL_TOPICS (정적 config), 비동기 패치 없음. |
| **UI 구성** | "관심사 기반 신앙 공동체". **커뮤니티 게시판**: 고민상담(→/cells/counsel), 선교(→/mission). **토픽 카드**: CELL_TOPICS 기반 TopicCard 목록 → /cells/topics/[slug]. |

### `GET /cells/[id]`

| 항목 | 내용 |
|------|------|
| **역할** | 셀 상세. 멤버 목록·미팅 기록·채팅 등. |
| **보호** | 로그인 필수. 비멤버 접근 제한(셀 설정에 따라). |
| **데이터** | getCellById(id), getCellMembers(id), getCellMessages(id). |

### `GET /cells/[id]/meeting/*`

| 항목 | 내용 |
|------|------|
| **역할** | 셀 미팅 단계별 진행(start → prayer → sermon → life → pray → summary). |
| **보호** | 로그인 + 셀 멤버. |

### `GET /cells/counsel`

| 항목 | 내용 |
|------|------|
| **역할** | 신앙 질문·고민 게시판. |
| **보호** | 로그인 필수. |

### `GET /cells/topics/[slug]`

| 항목 | 내용 |
|------|------|
| **역할** | 토픽 기반 셀 피드. |
| **보호** | 로그인 필수. |

---

## 5. 콘텐츠·숏츠

### `GET /contents`

| 항목 | 내용 |
|------|------|
| **역할** | YouTube 콘텐츠 피드. 추천 스코어링 적용. |
| **보호** | 로그인 필수. (`/explore`는 `/contents`로 리다이렉트.) |
| **데이터** | `getAuthUserId()`, `listFeedPostsPage(scope="ALL", requireYoutubeUrl=true)`, `listMySubscriptions()`, `getUserInteractions(100)`, `getUserInterestTags()`. |
| **UI 구성** | ContentsInfiniteList(무한 스크롤). ContentsBottomSearchBar. YouTube URL 있는 포스트만 표시. |
| **특이사항** | `rankPosts()` 추천 엔진: 구독·인터랙션·태그 기반 스코어로 재정렬. |

### `GET /shorts`

| 항목 | 내용 |
|------|------|
| **역할** | 숏폼 세로 영상 피드 (TikTok 스타일). |
| **보호** | 로그인 필수. |
| **데이터** | `getAuthUserId()`, `listFeedPostsPage(category="SHORTS", hasMedia=true, limit=30)`. |
| **UI 구성** | ShortsFeed (세로 전체 화면 스와이프 플레이어). mediaUrls 있는 SHORTS 카테고리 포스트만 표시. |

---

## 6. 선교

### `GET /mission`

| 항목 | 내용 |
|------|------|
| **역할** | 세계 선교 콘텐츠 허브. 국가 필터 + 포스트 피드. |
| **보호** | 로그인 필수. |
| **쿼리** | `country`: 국가 코드 (선택). |
| **데이터** | `getAuthUserId()`, `listFeedPostsPage(categories=[MISSION,CONTENT,PHOTO])`, `getCurrentUser()`(역할 확인), `filterVisiblePosts()`. |
| **UI 구성** | MissionCountryFilter(국가 드롭다운). MissionHubInfiniteList. MISSIONARY role이면 대시보드 링크 노출. |

### `GET /mission/[country]`

| 항목 | 내용 |
|------|------|
| **역할** | 국가별 선교 포스트. |
| **보호** | 로그인 필수. |

### `GET /missions`

| 항목 | 내용 |
|------|------|
| **역할** | 선교 프로젝트 디렉토리. DB 구조화된 레코드 목록. |
| **보호** | 로그인 필수. |
| **데이터** | `getCurrentUser()`, `listMissionaryProjects()`. |
| **UI 구성** | 제목·선교사명·국가·분야·설명·기도 후원자 수·"내가 후원 중" 표시. MISSIONARY role이면 "/missionary 대시보드" 링크. "프로젝트 등록" 버튼 (MISSIONARY only). |

### `GET /missions/[id]`

| 항목 | 내용 |
|------|------|
| **역할** | 선교 프로젝트 상세. 기도 후원·현장 보고서. |
| **보호** | 로그인 필수. |

### `GET /missionary`, `/missionary/project/create`, `/missionary/supporters`, `/missionary/reports`

| 항목 | 내용 |
|------|------|
| **역할** | 선교사 전용 대시보드·프로젝트 등록·후원자·보고서 관리. |
| **보호** | MISSIONARY role 또는 ADMIN. |

---

## 7. 프로필·메시지

### `GET /me`

redirect → `/profile/[현재 사용자 id]`. BottomNav "프로필" 탭의 진입점.

### `GET /profile/[id]`

| 항목 | 내용 |
|------|------|
| **역할** | 사용자 프로필. 포스트·숏츠 탭. |
| **보호** | 로그인 필수. 없는 사용자 notFound(). |
| **데이터** | `getUserById(id)`, `getCurrentUser()`, `listPostsByAuthorId(id)`, `isFollowing`, `isBlocked`, `isMuted`, follower/following/posts 카운트. |
| **UI 구성** | **ProfileShell**: 이름·역할·affiliation·bio, 팔로우 버튼(타인), UserActionsMenu(mute/block). **ProfileTabs**: "Posts" 탭, "Shorts" 탭. **ProfileStatsStrip**: 포스트 수·팔로워·팔로잉. |
| **액션** | toggleFollowAction, toggleMuteAction, toggleBlockAction. |

### `GET /profile/[id]/followers`, `/profile/[id]/following`

| 항목 | 내용 |
|------|------|
| **역할** | 팔로워·팔로잉 목록. |
| **보호** | 로그인 필수. |

### `GET /messages`

| 항목 | 내용 |
|------|------|
| **역할** | DM 인박스. 대화 목록 + 마지막 메시지 미리보기. |
| **보호** | 로그인 필수. |
| **데이터** | `getCurrentUser()`, `listDMThreads(userId)`. |

### `GET /messages/[userId]`

| 항목 | 내용 |
|------|------|
| **역할** | 1:1 DM 스레드. |
| **보호** | 로그인 필수. |
| **데이터** | `getCurrentUser()`, `getUserById(userId)`, `listDMMessages(currentUserId, userId)`. |
| **액션** | sendDMAction → 실시간 또는 폴링으로 갱신. |

---

## 8. 탐색·알림·북마크

### `GET /search`

| 항목 | 내용 |
|------|------|
| **역할** | 포스트·사람·태그 통합 검색. |
| **보호** | 로그인 필수. |
| **쿼리** | `q`: 검색어. `tab`: posts \| people \| tags (기본 posts). |
| **데이터** | `getCurrentUser()`. q 있으면 searchPosts / searchPeople / searchTags. |
| **UI 구성** | SearchForm, SearchTabs, SearchResults(PostCard / UserCard / TagPill). |

### `GET /topics/[tag]`

| 항목 | 내용 |
|------|------|
| **역할** | 특정 태그 포스트 목록. 포스트 태그 클릭 시 진입. |
| **보호** | 로그인 필수. |
| **데이터** | `normalizeTag(tag)`, `listPostsByTag(normalized, currentUserId)`. |
| **UI 구성** | "← 태그 검색"(→/search?tab=tags), 태그명, PostCard 리스트. |
| **비고** | `/topics`(목록 페이지)는 `/search?tab=tags`로 리다이렉트. |

### `GET /notifications`

| 항목 | 내용 |
|------|------|
| **역할** | 알림 목록·읽음 처리. |
| **보호** | 로그인 필수. |
| **데이터** | `getCurrentUser()`, `listNotifications(userId)`, `getAuthorMap(supabase, actorIds)` (배치). |
| **UI 구성** | "← Back to feed", "Notifications", MarkAllReadButton(미읽음 있을 때), NotificationsListLive(그룹핑 표시). |
| **액션** | markNotificationReadAction(개별), markAllReadAction(전체) → revalidatePath("/notifications", "/home", "/" layout). |
| **헤더 동기화** | MarkAllReadButton이 `csm:notifications-read-all` 이벤트 dispatch → Header 카운터 즉시 0으로. |

### `GET /bookmarks`

| 항목 | 내용 |
|------|------|
| **역할** | 북마크한 포스트 목록. |
| **보호** | 로그인 필수. |
| **데이터** | `getCurrentUser()`, `listBookmarkedPosts(userId)`. |
| **UI 구성** | PostCard 목록. 북마크 해제 가능. |

---

## 9. 설정

### `GET /settings`

| 항목 | 내용 |
|------|------|
| **역할** | 설정 허브. 하위 설정 페이지 진입점 + 로그아웃. |
| **보호** | 로그인 필수. |
| **데이터** | `getCurrentUser()`. |
| **UI 구성** | 프로필 요약 카드(→/settings/profile). 항목: 프로필 편집, 계정, 알림 설정, 북마크, 언어 설정(인라인), 이용 가이드(→/guide), 로그아웃. ADMIN이면 "어드민 패널"(→/admin). |

### `GET /settings/profile`

| 항목 | 내용 |
|------|------|
| **역할** | 프로필 편집. 이름·역할·bio·affiliation 수정. |
| **보호** | 로그인 필수. (`/profile/[id]/edit`는 여기로 리다이렉트.) |
| **액션** | updateProfileAction → revalidatePath("/profile/[id]"), revalidatePath("/settings"). |

### `GET /settings/account`

| 항목 | 내용 |
|------|------|
| **역할** | 계정 관리. 비밀번호 변경·계정 비활성화. |
| **보호** | 로그인 필수. |

### `GET /settings/notifications`

| 항목 | 내용 |
|------|------|
| **역할** | 알림 수신 설정 (종류별 on/off). |
| **보호** | 로그인 필수. |

---

## 10. 관리자

### `GET /admin`

| 항목 | 내용 |
|------|------|
| **역할** | 어드민 대시보드. 통계 + Daily Prayer 생성. |
| **보호** | ADMIN role만. 아니면 `/home?message=admin_required`. |
| **데이터** | `getDashboardStats()`: openReportsToday, newUsersToday, activeUsersLast7d. |
| **UI 구성** | "Dashboard", 3열 통계 카드. "Create Daily Prayer (today)" → DangerZoneConfirm. |
| **액션** | createDailyPrayerAction → revalidatePath("/home", "/admin"). |

### `GET /admin/moderation`

| 항목 | 내용 |
|------|------|
| **역할** | 열린 신고 큐. Hide · Delete comment · Resolve. |
| **보호** | ADMIN 전용. |
| **데이터** | `listOpenReports()`, 신고 대상 포스트/댓글/사용자. |
| **UI 구성** | 테이블(Type, Reason, Reporter, Target, Date, Actions). ModerationReportActions: View post, Hide post, Delete comment, Resolve. DangerZoneConfirm. |
| **액션** | hidePostAction, deleteCommentAction, resolveReportAction. |

### `GET /admin/users`

| 항목 | 내용 |
|------|------|
| **역할** | 사용자 목록. 역할 변경·block·mute. |
| **보호** | ADMIN 전용. |
| **데이터** | adminRepository.listAllUsers(). |

### `GET /admin/audit`

| 항목 | 내용 |
|------|------|
| **역할** | 모든 관리자 조치의 감사 로그. |
| **보호** | ADMIN 전용. |

### `GET /admin/invites`

| 항목 | 내용 |
|------|------|
| **역할** | 초대 코드 생성·목록·만료 처리. |
| **보호** | ADMIN 전용. |

---

## 공통 사항

- **Root layout**: BottomNav(5탭) · Header(홈 화면 한정, 로고·알림·글쓰기·메시지·유저 메뉴).
- **서버 액션**: `"use server"`, `getSession()` (getUser() 금지)로 권한 확인 후 repository 호출, revalidatePath/redirect.
- **세션**: `lib/auth/session.ts`의 `getSession()` 사용. Route Handler·Server Action에서 `getUser()` 호출 금지(자동 로그아웃 위험).
- **디자인**: `lib/design/tokens.ts` 참고. TimelineContainer 하단 safe area 반영.
- **무한 스크롤**: `useInfiniteScroll` 단일 훅 (Home·Contents·Shorts·Mission·Profile 공용).
- **시간 표시**: `lib/utils/time.ts` 단일 구현 (relativeTime / formatDate / formatTime).

---

## 미비 사항 / 추가 개발이 필요한 부분

- **실시간 알림**: 현재 헤더에서 10초 폴링. WebSocket 또는 Supabase Realtime으로 교체 가능.
- **검색 페이지네이션**: `/search` 결과에 무한 스크롤 미적용.
- **/topics 목록**: `/topics`는 `/search?tab=tags`로 리다이렉트 처리. 별도 인기 태그 목록 페이지 없음.
- **접근성**: 스크린 리더·키보드·색 대비 체크리스트는 별도 정리 권장.

이 문서는 라우트별 진입점·설계 의도·화면·데이터·액션을 참고하기 위한 레퍼런스입니다. 구현 변경 시 함께 갱신하는 것을 권장합니다.
