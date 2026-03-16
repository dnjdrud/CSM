# Cellah — Tailwind 스타일 가이드

기능·라우팅·데이터·API는 건드리지 않고, **UI 클래스 선택**만 이 가이드를 따릅니다.  
전체 토큰 정의는 [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) 참고.

---

## 1. 색상 (Colors)

### 배경
- 페이지 배경: `bg-theme-bg`
- 카드/모달/입력: `bg-theme-surface`
- 호버/은은한 채움: `bg-theme-surface-2`
- 액티브/구분: `bg-theme-surface-3`
- 강조 배경(배지 등): `bg-theme-accent-bg`

### 텍스트
- 본문/제목: `text-theme-text`
- 부가 설명: `text-theme-text-2`
- 캡션/타임스탬프/플레이스홀더: `text-theme-muted`
- 링크/CTA: `text-theme-primary`
- 강조(금색 등): `text-theme-accent`
- 에러: `text-theme-danger`
- 성공: `text-theme-success`

### 테두리
- 기본: `border border-theme-border`
- 강조: `border-theme-border-2`
- 포커스/액센트: `border-theme-accent`

---

## 2. 타이포그래피 (Typography)

### 본문
- 기본 본문: `text-body text-theme-text leading-reading`
- 작은 본문: `text-sm text-theme-text-2`
- 메타/캡션: `text-meta text-theme-muted` 또는 `text-caption text-theme-muted`

### 제목
- 페이지 제목: `text-2xl font-semibold tracking-tight text-theme-text`
- 섹션 제목: `text-xl font-semibold tracking-tight text-theme-text`
- 카드/리스트 제목: `text-lg font-semibold tracking-tight text-theme-text`
- 라벨/캡스: `text-caption font-semibold uppercase tracking-caps text-theme-muted`

### 시맨틱 토큰 사용 (권장)
`lib/design/tokens.ts`의 `TYPOGRAPHY`, `TEXT` 조합 사용 예:
- `TYPOGRAPHY.body` + `TEXT.primary`
- `TYPOGRAPHY.headingLg` + `TEXT.primary`
- `TEXT.caption`, `TEXT.meta`, `TEXT.sectionTitle`

---

## 3. 간격 (Spacing)

### 패딩
- 카드: `p-5` 또는 `p-4` (작은 카드)
- 버튼: `px-4 py-2` (md), `px-5 py-2.5` (lg), `px-3 py-1.5` (sm)
- 입력: `px-3 py-2.5`
- 탭: `px-4 py-2.5`

### 갭
- 인라인 요소 간: `gap-2` (8px)
- 리스트/그리드: `gap-4` (16px)
- 섹션 간: `gap-6` (24px)

### 마진
- 섹션 하단: `mb-6` 또는 `mb-8`
- 블록 간: `space-y-4` / `space-y-6`

---

## 4. Border Radius

- 뱃지/태그: `rounded-sm`
- 버튼/입력: `rounded-md` 또는 `rounded-button` / `rounded-input`
- 패널/드롭다운: `rounded-lg` 또는 `rounded-panel`
- 카드: `rounded-xl` 또는 `rounded-card`
- 모달/풀 카드: `rounded-2xl`
- 필/원형: `rounded-pill`

---

## 5. 그림자 (Shadows)

- 카드 기본: `shadow-card`
- 카드 호버: `shadow-card-hover` (호버 시 전환)
- 플로팅 버튼/드롭다운: `shadow-md`
- 모달: `shadow-lg`
- 입력 inset: `shadow-inner`
- 리스트 행 구분: `shadow-xs` (필요 시)

---

## 6. 컴포넌트 패턴 (토큰 조합)

`lib/design/tokens.ts`에서 가져와 그대로 사용하는 것을 권장합니다.

| 용도 | 사용할 상수 |
|------|-------------|
| 페이지 배경 | `BG.page` |
| 카드 컨테이너 | `CARD` (전체 조합) |
| Primary 버튼 | `BTN_PRIMARY` |
| Secondary 버튼 | `BTN_SECONDARY` |
| Ghost/아이콘 버튼 | `BTN_GHOST` |
| Danger 버튼 | `BTN_DANGER` |
| 텍스트/링크 버튼 | `BTN_TEXT` |
| 입력 필드 | `INPUT` |
| 인라인 액션 행 버튼 | `BTN_ACTION` |

예시:
```tsx
import { CARD, BTN_PRIMARY, PADDING, TEXT } from "@/lib/design/tokens";

<div className={`${CARD} ${PADDING.card}`}>
  <h2 className={TEXT.sectionTitle}>섹션</h2>
  <button className={BTN_PRIMARY}>저장</button>
</div>
```

---

## 7. 트랜지션·포커스

- 기본 색/배경 전환: `transition-colors duration-150`
- 포커스 링: `focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2`
- 토큰: `FOCUS_RING`, `FOCUS_RING_PRIMARY`, `TRANSITION`, `TRANSITION_ALL` (`tokens.ts`)

---

## 8. 금지 사항 (UI만 해당)

- 인라인 하드코딩 색상 사용 금지: `#hex`, `rgb()` 대신 `theme-*` 또는 `tokens` 사용
- 일관되지 않은 간격 금지: 4px 단위(1,2,3,4,6,8…) 유지
- 새로운 shadow/radius 값 임의 추가 금지: 기존 스케일(`sm`, `md`, `lg`, `card` 등) 사용

이 가이드와 `DESIGN_SYSTEM.md`만 적용하면 UI 일관성과 현대적인 인터페이스를 유지할 수 있습니다.
