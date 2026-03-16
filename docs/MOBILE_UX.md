# Cellah 모바일 UX 가이드

기능 변경 없이 **모바일 UI·UX**만 적용할 때 따르는 규칙입니다.

---

## 1. 터치 타겟 (Touch target)

- **최소 크기**: 모든 터치 가능 요소는 **44×44px** 이상 유지.
- 버튼·링크·탭·아이콘 버튼: `min-h-[44px] min-w-[44px]` 또는 동일한 최소 영역 보장.
- 라벨이 있는 버튼: 높이만 44px 이상이면 됨 (`min-h-[44px]`).

### 적용된 컴포넌트 예

| 컴포넌트 | 적용 |
|----------|------|
| **BottomNav** 탭 | `min-h-[44px]` (sm 이상 48px), 전체 링크 영역 터치 |
| **PostCard** 반응/댓글/공유/북마크 | `actionBtnBase` → `min-h-[44px] min-w-[44px]` |
| **Button** (md) | `min-h-[44px]` |
| **FollowButton** (compact 포함) | `min-h-[44px] min-w-[44px]` |
| **ProfileHero** 액션 버튼 | `min-h-[44px] min-w-[44px]` |
| **EmptyState** CTA | `min-h-[44px]` |

---

## 2. 하단 네비게이션 (Bottom navigation)

- **위치**: `fixed bottom-0 inset-x-0 z-30`.
- **Safe area**: `pb-[env(safe-area-inset-bottom)]`로 노치·홈 인디케이터 영역 피함.
- **탭 터치 영역**: 각 탭이 최소 44px 높이, `rounded-lg`, `active:bg-theme-surface-2/80`, `focus-visible:ring-2`.
- **간격**: `px-1`(모바일), `sm:px-2`(태블릿 이상). 아이콘 `w-5 h-5`, `sm:w-6 sm:h-6`.
- **라벨**: 긴 텍스트는 `truncate max-w-[4.5rem]`로 한 줄 처리.

### 메인 콘텐츠 하단 여백

- 하단 nav에 가려지지 않도록 **main**에 `.pb-bottom-nav` 사용.
- `app/globals.css`:  
  `padding-bottom: calc(4rem + env(safe-area-inset-bottom, 0px));`

---

## 3. 모바일 친화적 간격 (Spacing)

- **기준**: 4px 그리드. Tailwind `1`(4px), `2`(8px), `3`(12px), `4`(16px), `5`(20px), `6`(24px).
- **카드/리스트**: 섹션 간 `gap-4` ~ `gap-6`, 카드 내부 `p-4` ~ `p-5`.
- **페이지 좌우**: `px-4`(모바일), `sm:px-5` 권장.
- **스크롤 영역**: 리스트 하단에 여유 있게 `pb-4` 이상 또는 `.pb-bottom-nav`로 nav 높이 확보.

---

## 4. Sticky 네비게이션·스크롤

- **헤더**: `sticky top-0 z-20` (예: `Header`).
- **피드/탭 상단**: `sticky top-0 z-10` (예: `FeedHeader`, `HomeTabs`, `ProfileTabs`).
- **z-index 순서**: 하단 nav `z-30` > 헤더 `z-20` > 스티키 탭/필터 `z-10` > 콘텐츠.
- **스크롤**: 메인 콘텐츠는 `<main>` 하나에서 스크롤. 내부에서 `sticky`는 한 단계만 두는 것을 권장 (헤더 + 탭 등).

---

## 5. 스크롤 동작 (Scroll behavior)

- **메인 영역**: `main`이 `flex-1 min-w-0`로 남는 공간 채우고, 세로 스크롤은 body/main 기준.
- **무한 스크롤**: sentinel에 `rootMargin`(예: 200px) 사용해 미리 다음 페이지 로드.
- **하단 여백**: 스크롤 끝에서 콘텐츠가 nav에 가리지 않도록 `.pb-bottom-nav` 유지.

---

## 6. Safe area 요약

| 위치 | 적용 |
|------|------|
| **BottomNav** | `pb-[env(safe-area-inset-bottom)]` |
| **main** | `.pb-bottom-nav` → `calc(4rem + env(safe-area-inset-bottom, 0px))` |
| **ComposeBox** (sticky 툴바) | `pb-[max(0.75rem, env(safe-area-inset-bottom))]` |
| **TimelineContainer** | `pb-[max(1.5rem, env(safe-area-inset-bottom))]` |

---

## 7. 체크리스트 (신규/수정 시)

- [ ] 터치 가능한 모든 컨트롤이 44×44px 이상인가?
- [ ] 하단 nav가 있는 화면에서 main에 `.pb-bottom-nav` 또는 동일한 하단 여백이 있는가?
- [ ] fixed/sticky 하단 UI에 `env(safe-area-inset-bottom)`을 반영했는가?
- [ ] 모바일에서 패딩이 `px-4` 이상, 섹션 간격이 `gap-4` 이상인가?
- [ ] 포커스 링(`focus-visible:ring-2`)이 필요한 인터랙티브 요소에 적용되어 있는가?

기능·라우팅·데이터는 유지하고, 위 규칙만 적용해 모바일 UX를 일관되게 유지하면 됩니다.
