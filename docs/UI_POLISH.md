# Cellah UI Polish 가이드

기능·Next.js 구조·기존 컴포넌트 기반을 유지하면서 **깔끔하고 일관된 UI**를 위한 규칙입니다.  
Tailwind + `lib/design/tokens` 기준으로 적용합니다.

---

## 1. Spacing consistency

- **기준**: 4px 그리드. `1`(4px), `2`(8px), `3`(12px), `4`(16px), `5`(20px), `6`(24px).
- **카드 내부**: `CardContent` 기본 `p-5`; 모바일에서만 줄일 때 `px-4 py-4 sm:px-5 sm:py-5`.
- **섹션 간**: 리스트/피드에서 카드 간 `gap-4` ~ `gap-6` (예: `space-y-6`).
- **페이지 좌우**: `px-4`(모바일), `sm:px-5` 또는 `max-w-2xl mx-auto` + `px-4`.
- **블록 내부**: 제목 ↔ 본문 `mt-2` ~ `mt-4`, 버튼 영역 위 `mt-4` ~ `mt-6`.

| 용도 | 클래스 예 |
|------|-----------|
| 타이트한 인라인 | `gap-1.5`, `gap-2` |
| 폼/카드 내부 | `gap-3`, `gap-4`, `p-4`, `p-5` |
| 섹션/카드 간 | `gap-4`, `gap-6`, `mt-5`, `mt-6` |
| 빈 상태/모달 | `py-12`, `sm:py-14`, `px-6`, `sm:px-8` |

---

## 2. Typography hierarchy

- **페이지 제목**: `text-2xl font-semibold tracking-tight text-theme-text` (또는 `TYPOGRAPHY.headingLg`).
- **섹션 제목**: `text-xl font-semibold` 또는 `text-lg font-semibold`.
- **소제목/라벨**: `text-sm font-medium text-theme-text` (`TEXT.labelMd`).
- **본문**: `text-[15px]` 또는 `text-body`, `leading-relaxed` ~ `leading-reading`.
- **캡션/메타**: `text-meta text-theme-muted` 또는 `text-caption text-theme-muted`.
- **섹션 라벨(작은 캡스)**: `SectionHeader` → `TYPOGRAPHY.sectionTitle` + `TEXT.label`.

토큰 참고: `lib/design/tokens` → `TYPOGRAPHY`, `TEXT`.

---

## 3. Card layout

- **컨테이너**: `Card` (rounded-card, shadow-card, hover:shadow-card-hover).
- **내부 구조**: `CardHeader` / `CardContent` / `CardFooter` 사용 시 패딩은 각각 `px-5 pt-5 pb-0`, `p-5`, `px-5 pb-5 pt-0`.
- **오버라이드**: 모바일에서만 줄일 때 `CardContent`에 `className="px-4 py-4 sm:px-5 sm:py-5"`.
- **리스트 카드**: 카드 간 `space-y-4` 또는 `space-y-6`; 카드 내부는 위 패딩 규칙 유지.

---

## 4. Interaction feedback

- **Hover**: 배경/테두리 변화. 예: `hover:bg-theme-surface-2`, `hover:border-theme-border-2`.
- **Active**: 눌림 표현. 예: `active:bg-theme-surface-3`, `active:scale-[0.98]` (버튼).
- **Focus**: 키보드 포커스. `focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2` (또는 `FOCUS_RING`).
- **Disabled**: `disabled:opacity-40 disabled:cursor-not-allowed` (또는 `DISABLED`).
- **트랜지션**: `transition-colors duration-150` 또는 토큰 `TRANSITION` / `TRANSITION_ALL`.

버튼·링크·탭에는 위 상태를 모두 적용하는 것을 권장합니다.

---

## 5. Hover states

| 요소 | 권장 클래스 |
|------|-------------|
| 카드 | `hover:shadow-card-hover` (Card 기본 포함) |
| 버튼(primary) | `hover:bg-theme-primary-2` |
| 버튼(secondary/ghost) | `hover:bg-theme-surface-2` |
| 링크 | `hover:underline` 또는 `hover:text-theme-primary` |
| 리스트 행 | `hover:bg-theme-surface-2/80` |
| 아이콘 버튼 | `hover:bg-theme-surface-2 hover:text-theme-text` |

---

## 6. Empty states

- **컴포넌트**: `@/components/ui/EmptyState`.
- **Props**: `title`, `description`, `action?: { label, href }`, `icon?` (선택).
- **스타일**: 제목 `text-lg font-semibold`, 설명 `text-[15px] leading-relaxed text-theme-muted`, 패딩 `py-12 px-6 sm:py-14 sm:px-8`, CTA는 토큰 기반 primary 버튼.
- **배치**: 빈 리스트/검색 결과 중앙에 배치하고, 필요 시 `max-w-sm mx-auto`로 설명 너비 제한.

---

## 7. Loading states

- **스켈레톤**: `@/components/ui/Skeleton`. `animate-pulse rounded-md bg-theme-surface-2`.
- **피드 카드**: `FeedPostSkeleton` — PostCard와 동일한 구조·간격(px-4 py-4 sm:px-5 sm:py-5).
- **작은 행**: `FeedSkeletonRow` — 한 줄 짧은 스켈레톤, `Skeleton` 컴포넌트 사용.
- **인라인 로딩**: 버튼 내 스피너 `h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin`; 전체 영역 로딩은 `h-5 w-5` + `border-theme-border border-t-theme-text`.

스켈레톤은 실제 콘텐츠 레이아웃과 맞추고, `rounded-md`로 통일합니다.

---

## 8. 적용된 주요 컴포넌트 요약

| 컴포넌트 | 변경 요약 |
|----------|-----------|
| **EmptyState** | 제목 hierarchy(text-lg font-semibold), 패딩(py-12 sm:py-14), CTA 토큰, 선택 icon |
| **Skeleton** | theme 색(bg-theme-surface-2), rounded-md |
| **FeedPostSkeleton** | PostCard와 동일 패딩·간격, rounded-md 일괄 |
| **FeedSkeletonRow** | Skeleton 사용, px-4 py-4 sm:px-5 |
| **Section** | SectionHeader subtitle에 text-meta, gap-1, min-w-0 |
| **Card** | 기존 유지 (shadow-card, hover, focus-within) |

---

## 9. 체크리스트 (신규/수정 시)

- [ ] 간격이 4px 단위(1,2,3,4,5,6)로 통일되어 있는가?
- [ ] 제목/본문/캡션에 토큰 또는 가이드 계층이 적용되어 있는가?
- [ ] 카드/리스트에 일관된 패딩(p-4 또는 p-5)이 적용되어 있는가?
- [ ] 버튼·링크에 hover / active / focus 상태가 있는가?
- [ ] 빈 상태는 EmptyState를 사용하고, 로딩 상태는 Skeleton/FeedPostSkeleton을 사용하는가?

기능과 라우팅은 유지하고, 위 규칙만 적용해 전반적인 UI 품질을 맞추면 됩니다.
