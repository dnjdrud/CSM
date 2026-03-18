# 모바일/UX 피드백 정리 — 어디를 어떻게 고쳐야 하는지

피드백을 항목별로 **해당 파일·위치**와 **수정 방향**으로 정리했습니다.

---

## 1. 인터페이스가 스마트폰 친화적이지 않음 (버튼/요소 과다)

### 1-1. 오른쪽 스와이프(햄버거 메뉴) — 버튼이 너무 많음 → 인스타처럼 DM만

**현재:**  
모바일에서 햄버거 클릭 시 **오른쪽에서 슬라이드 인**되는 드로어에 다음이 모두 노출됨.

- **위치:** `components/layout/Header.tsx` (약 337~374행, `<nav>` 내부)
- **포함 항목:**  
  프로필, 다이렉트 메시지, 글쓰기, (구분선), 설정, 가이드, (관리자일 때) 관리자, (하단) 로그아웃

**수정 제안:**
- **인스타처럼 “DM만”** 보이게 하려면: 드로어 내용을 **“다이렉트 메시지” 링크 하나**(+ 필요 시 로그아웃만 하단 고정)로 단순화.
- 또는: 프로필/글쓰기/설정은 **하단 탭 또는 상단 헤더**로만 두고, 드로어에는 **DM + 로그아웃**만 두기.

**수정할 파일:**  
`components/layout/Header.tsx` — 드로어 내부 `<nav>`의 `DrawerLink` 목록 축소/재구성.

---

### 1-2. 컨텐츠 탭 — “요청”이 뭔지 모르겠음 / 숏츠처럼 콘텐츠만 보고 싶음

**“요청”이 뭔지**
- **의미:** **콘텐츠 제작 협업 요청 보드**입니다.  
  촬영·편집·기획·교육·협업 등 **제작 도움이 필요할 때** 올리는 요청 글이고, 크리에이터가 “협업하기”로 댓글 연결하는 기능입니다.
- **노출 위치:**
  - **컨텐츠 페이지 탭:** `app/(app)/contents/page.tsx` — 상단에 “콘텐츠 | 요청” 탭.
  - **탭 UI:** `app/(app)/contents/_components/ContentsTabs.tsx` (라벨 "요청", 아이콘 📬).
  - **요청 탭 본문:** 같은 `contents/page.tsx`의 `RequestTabContent`,  
    `app/(app)/contents/_components/RequestInfiniteList.tsx`,  
    `app/(app)/contents/_components/RequestCard.tsx`.

**수정 제안 (요청 인지 개선):**
- "요청" → **"제작 요청"** 또는 **"협업 요청"** 같이 의미가 드러나게 라벨 변경.
- 또는 컨텐츠 첫 진입 시 짧은 문구로 “촬영/편집 등 제작 도움이 필요할 때 올리는 요청 보드” 안내.

**“숏츠처럼 숏츠만 보고 싶음”**
- **현재:**  
  - **컨텐츠 탭:** `ContentsInfiniteList` → 일반 카드 리스트.  
  - **글 클릭 시:** `app/(app)/post/[id]/page.tsx` 로 이동 → 상단 “← 홈으로”, 작성자 헤더, 본문, 리액션, 댓글 섹션 등 **한 페이지에 다 나옴.**

**수정 제안:**
- **컨텐츠 전용 상세 뷰**를 하나 두고, **영상/이미지 위주 콘텐츠**는:
  - 전체 화면 또는 거의 전체 화면.
  - 상/하단 최소 UI(닫기, 제목 한 줄 등).
  - 댓글/리액션은 스와이프 업 또는 “댓글” 탭으로 분리.
- 구현 시 고려할 파일:
  - `app/(app)/post/[id]/page.tsx` — 여기서 category가 CONTENT/PHOTO 등이면 **다른 레이아웃(숏츠 뷰)** 로 보여주거나,
  - `app/(app)/contents/` 아래에 **전용 상세 라우트** (예: `/contents/[id]`)를 만들어 **숏츠 전용 풀스크린 컴포넌트** 사용.

---

### 1-3. 프로필 옵션이 두 개인 것 같다

**원인:**
- **하단 탭:** `components/layout/BottomNav.tsx` — “프로필” 탭이 **`/me`**(내 공간)로 연결됨.
- **드로어:** `components/layout/Header.tsx` — “프로필” 링크가 **`/profile/${user.id}`**(내 프로필 페이지)로 연결됨.

그래서 **“프로필”** 에 접근하는 경로가 두 가지입니다.

- **`/me`:** 묵상/감사/기도 노트 등 **내 전용 공간** (Notes, Daily prompt 등).
- **`/profile/[id]`:** **프로필 페이지** (게시글, 컨텐츠, 구독 등).

**수정 제안:**
- **하단 탭:**  
  - “프로필”을 **내 프로필 페이지**(`/profile/[id]`)로 통일하고,  
  - “내 공간”/“My” 같은 항목은 드로어나 프로필 상단에서만 들어가게 하기.
- 또는 **하단 탭 라벨 분리:**  
  - 하나는 “프로필”(공개 프로필), 하나는 “내 공간” 등으로 구분해, 같은 탭에 두 개 버튼이 있는 느낌을 없애기.

**수정할 파일:**  
`components/layout/BottomNav.tsx` (profile 링크/라벨),  
`app/(app)/layout.tsx` (BottomNav에 넘기는 `profileHref` 등이 있다면),  
필요 시 `components/layout/Header.tsx` 드로어에서 “프로필”/“내 공간” 구분.

---

### 1-4. 댓글 열었을 때 댓글만 집중 못함 — 너무 많은 게 보임

**현재:**  
`app/(app)/post/[id]/page.tsx` 에서 **한 페이지에 모두** 노출됨.

- “← 홈으로” 링크  
- `PostDetailHeader` (작성자, 팔로우, 메뉴)  
- `PostDetailBody` (본문, 미디어, 태그)  
- `PostDetailReactions` (기도했어요, 함께해요 등)  
- `CommentsSection` (댓글 제목, 입력 폼, 댓글 목록)

**수정 제안 (인스타 스타일):**
- **댓글만 보는 뷰**를 분리:
  - **방법 A:** 글 상세에서 “댓글” 탭/버튼 클릭 시 **댓글 전용 풀스크린(또는 바텀시트)** 로 전환.  
    상단: “댓글” + 닫기. 그 아래 댓글 입력 + 리스트만.
  - **방법 B:** `/post/[id]/comments` 같은 **댓글 전용 라우트**를 두고, 글 상세에서는 “댓글 N개”만 누르면 해당 페이지로 이동.

**수정할 파일:**
- **라우트/페이지:**  
  - `app/(app)/post/[id]/page.tsx` — 댓글 영역을 “댓글 보기” 버튼 + 모달/시트로 대체하거나,  
  - `app/(app)/post/[id]/comments/page.tsx` (신규) — 댓글 전용 전체 화면.
- **컴포넌트:**  
  - `app/(app)/post/[id]/_components/CommentsSection.tsx` — 그대로 재사용하되, **풀스크린/시트 레이아웃**으로 감싸는 클라이언트 컴포넌트 추가 (예: `CommentsDrawer.tsx`).

---

### 1-5. 검색창 활용하면 “Tag” 버튼·Following recommendations 불필요

**현재:**
- **Tags 버튼:**  
  `components/FeedScopeToggle.tsx` — 홈 피드 상단에서 **All | Following | Tags** 중 “Tags”가 `/topics` 로 연결됨.
- **Following recommendations:**  
  `app/(app)/home/page.tsx` (약 216~223행) — `SuggestedPeople`(“함께할 사람들”)이 **팔로우가 없을 때만** 피드 상단에 노출됨.  
  컴포넌트: `app/(app)/feed/_components/SuggestedPeople.tsx`.

**수정 제안:**
- **검색**에서 태그 검색 + 사람 검색을 지원하도록 하면:
  - **Tags 전용 탭/버튼** 제거 가능: `FeedScopeToggle`에서 “Tags” 링크 제거 → 홈은 **All | Following** 만.
  - **SuggestedPeople** 섹션 제거 또는 축소:  
    “함께할 사람들”을 **검색 결과의 “사람” 탭** 또는 “추천”으로 이전.

**수정할 파일:**
- `components/FeedScopeToggle.tsx` — `context === "home"` 일 때 Tags `Link` 제거.
- `app/(app)/home/page.tsx` — `SuggestedPeople` 렌더링 제거 또는 조건 완화.
- `app/(app)/search/page.tsx`, `app/(app)/search/_components/SearchResults.tsx` — 태그/사람 검색이 잘 동작하는지 확인 후, 필요하면 검색 진입점(헤더 검색 아이콘 등)을 더 눈에 띄게.

---

## 2. 아이콘·색이 구림 — 이모지 말고 다른 걸로

**현재:**  
여러 곳에서 **이모지**를 아이콘처럼 사용 중입니다.

| 용도           | 파일 예시 |
|----------------|-----------|
| 셀/토픽 섹션   | `app/(app)/cells/topics/[slug]/page.tsx` — 💬 셀 나눔, 🎬 관련 콘텐츠 |
| 컨텐츠 탭      | `app/(app)/contents/_components/ContentsTabs.tsx` — 🎬 콘텐츠, 📬 요청 |
| 프로필 탭      | `app/(app)/profile/[id]/_components/ProfileTabs.tsx` — 📝 🎬 🐦 |
| 설정 메뉴      | `app/(app)/settings/page.tsx` — 👤 🔐 🔔 🔖 🕯️ 🐦 등 |
| 글쓰기 타입    | `app/(app)/write/_components/WritePageClient.tsx` — 💬 🎬 🌍 📬 |
| 리액션/댓글    | `components/PostCard.tsx` — 🙏 🤍 💬 등 |
| 기타 빈 상태 등 | `app/(app)/contents/_components/ContentsInfiniteList.tsx`, RequestInfiniteList, ProfilePostsTab 등 — 🎬 📝 📬 |

**수정 제안:**
- 이모지 대신 **동일한 스타일의 SVG 아이콘** 또는 **아이콘 라이브러리**(예: Heroicons, Lucide)로 통일.
- 이미 `Header.tsx`, `BottomNav.tsx` 등에서는 SVG 아이콘을 쓰고 있으므로, 위 파일들에서 `<span aria-hidden>{emoji}</span>` 부분을 **같은 디자인 시스템의 Icon 컴포넌트**로 교체.

**수정할 파일 (우선순위 높은 것):**
- `components/PostCard.tsx` — 리액션/댓글/북마크 아이콘
- `app/(app)/post/[id]/_components/PostDetailReactions.tsx`
- `app/(app)/contents/_components/ContentsTabs.tsx`
- `app/(app)/profile/[id]/_components/ProfileTabs.tsx`
- `app/(app)/settings/page.tsx`
- `app/(app)/cells/topics/[slug]/page.tsx`, `TopicContentSection.tsx`
- `app/(app)/mission/[country]/page.tsx`
- `app/(app)/home/page.tsx` (DailyPrayerBanner 등)
- 나머지 빈 상태/섹션 헤더 이모지

---

## 3. 게시글 구분(간격)이 너무 벌어져서 안 예쁨

**현재:**  
홈 피드 리스트에서 카드 사이 **세로 간격**이 `space-y-6` (24px)로 설정되어 있음.

- **위치:** `app/(app)/home/_components/HomeInfiniteList.tsx` — 85행  
  `<ul className="list-none p-0 space-y-6" ...>`

**수정 제안:**
- `space-y-6` → `space-y-4` (16px) 또는 `space-y-3` (12px)로 줄여서 카드가 더 붙어 보이게.

**수정할 파일:**  
`app/(app)/home/_components/HomeInfiniteList.tsx` — `space-y-6` 변경.

---

## 요약 체크리스트

| # | 피드백 | 수정 위치 | 방향 |
|---|--------|-----------|------|
| 1-1 | 오른쪽 메뉴 버튼 많음 | `Header.tsx` 드로어 | DM(+ 로그아웃) 위주로 단순화 |
| 1-2 | “요청”이 뭔지 / 숏츠처럼 | `contents/` 탭 라벨, `post/[id]` 또는 컨텐츠 전용 뷰 | 라벨 개선 + 컨텐츠 전용 풀스크린 뷰 |
| 1-3 | 프로필 옵션 두 개 | `BottomNav.tsx`, `Header.tsx` | 프로필/내 공간 경로·라벨 통일 또는 분리 |
| 1-4 | 댓글만 집중 못함 | `post/[id]/page.tsx`, CommentsSection | 댓글 전용 풀스크린/시트 또는 전용 라우트 |
| 1-5 | Tag 버튼·추천 불필요 | `FeedScopeToggle.tsx`, `home/page.tsx` | Tags 제거, SuggestedPeople 제거/검색으로 대체 |
| 2 | 이모지 구림 | PostCard, 탭들, 설정, 토픽/선교 등 | 이모지 → SVG/아이콘 컴포넌트로 교체 |
| 3 | 게시글 간격 너무 넓음 | `HomeInfiniteList.tsx` | `space-y-6` → `space-y-4` 또는 `space-y-3` |

원하시면 위 항목 중 특정 번호부터 구체적인 코드 수정안(패치)으로 제안해 드리겠습니다.
