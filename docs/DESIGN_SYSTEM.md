# Cellah Design System

UI/디자인만 적용합니다. 기능·라우팅·데이터·API는 변경하지 않습니다.

참고 스타일: **Substack**(가독성, 에디토리얼), **Patreon**(크리에이터·따뜻함), **Notion**(미니멀·명확), **Instagram**(콘텐츠 우선·계층).

---

## 1. Color Palette

### 1.1 배경 (Backgrounds)

| 토큰 | CSS 변수 | 값 | 용도 |
|------|----------|-----|------|
| `bg` | `--bg` | `#F7F5EF` | 페이지 배경 (warm paper) |
| `surface` | `--surface` | `#FFFFFF` | 카드, 모달, 입력 필드 |
| `surface-2` | `--surface-2` | `#EFEDE6` | 호버, 은은한 채움 |
| `surface-3` | `--surface-3` | `#E6E3DA` | 액티브, 구분선 강조 |

### 1.2 텍스트 (Text)

| 토큰 | CSS 변수 | 값 | 용도 |
|------|----------|-----|------|
| `text` | `--text` | `#111009` | 본문·제목 |
| `text-2` | `--text-2` | `#3A3830` | 부가 설명 |
| `muted` | `--muted` | `#6B685F` | 플레이스홀더, 타임스탬프, 캡션 |

### 1.3 테두리 (Borders)

| 토큰 | CSS 변수 | 값 | 용도 |
|------|----------|-----|------|
| `border` | `--border` | `#DDD9D0` | 기본 테두리 |
| `border-2` | `--border-2` | `#C9C5BC` | 강조 테두리 |

### 1.4 브랜드 (Brand)

| 토큰 | CSS 변수 | 값 | 용도 |
|------|----------|-----|------|
| `primary` | `--primary` | `#0D3635` | CTA, 링크 (teal) |
| `primary-2` | `--primary-2` | `#092928` | 호버/프레스 |
| `accent` | `--accent` | `#C8943A` | 강조 (amber gold) |
| `accent-bg` | `--accent-bg` | `#FEF6E7` | 강조 배경 |

### 1.5 시맨틱 (Semantic)

| 토큰 | CSS 변수 | 값 | 용도 |
|------|----------|-----|------|
| `danger` | `--danger` | `#B42318` | 삭제, 에러 |
| `danger-bg` | `--danger-bg` | `#FFF1F0` | 에러 배경 |
| `success` | `--success` | `#15622D` | 성공 |
| `success-bg` | `--success-bg` | `#F0FDF4` | 성공 배경 |
| `warning` | `--warning` | `#92400E` | 경고 |
| `warning-bg` | `--warning-bg` | `#FFFBEB` | 경고 배경 |

---

## 2. Typography

### 2.1 폰트 패밀리

| 역할 | 폰트 스택 | 용도 |
|------|-----------|------|
| **Sans** | Pretendard Variable, Pretendard, system-ui | 본문, UI |
| **Serif** | Georgia, Charter, Noto Serif KR | 인용, 에디토리얼 |
| **Mono** | JetBrains Mono, Menlo | 코드, 숫자 |

### 2.2 타입 스케일 (Tailwind `text-*`)

| 클래스 | 크기 | line-height | letter-spacing | 용도 |
|--------|------|--------------|----------------|------|
| `text-caption` | 11px | 1.4 | 0.01em | 라벨, 오버레이 |
| `text-meta` | 12px | 1.5 | 0 | 타임스탬프, 메타 |
| `text-sm` | 13px | 1.6 | 0 | 보조 본문 |
| `text-body` | 15px | 1.75 | 0 | 기본 본문 |
| `text-body-md` | 16px | 1.625 | -0.01em | 강조 본문 |
| `text-lg` | 18px | 1.5 | -0.015em | 소제목 |
| `text-xl` | 22px | 1.3 | -0.02em | 제목 |
| `text-2xl` | 28px | 1.2 | -0.025em | 큰 제목 |
| `text-3xl` | 34px | 1.15 | -0.03em | 히어로 |

### 2.3 Line height (Tailwind `leading-*`)

- `leading-tight` 1.25 — 제목
- `leading-snug` 1.375 — 부제목
- `leading-normal` 1.5 — 리스트
- `leading-relaxed` 1.625 — 본문
- `leading-loose` 1.75 — 여유 본문
- `leading-reading` 1.8 — 장문 읽기

### 2.4 Letter spacing (Tailwind `tracking-*`)

- `tracking-tighter` -0.03em — 큰 제목
- `tracking-tight` -0.025em — 제목
- `tracking-caps` 0.08em — 라벨, 캡스

---

## 3. Spacing Scale

기본 단위 `0.25rem` (4px). Tailwind 숫자 = 단위 개수.

| Tailwind | 값 | px | 용도 예 |
|----------|-----|-----|---------|
| 0 | 0 | 0 | 리셋 |
| 1 | 0.25rem | 4 | 극소 |
| 2 | 0.5rem | 8 | 아이콘–텍스트 갭 |
| 3 | 0.75rem | 12 | 컴포넌트 내부 |
| 4 | 1rem | 16 | 기본 패딩 |
| 5 | 1.25rem | 20 | |
| 6 | 1.5rem | 24 | 섹션 간격 |
| 8 | 2rem | 32 | 블록 간격 |
| 10 | 2.5rem | 40 | |
| 12 | 3rem | 48 | |
| 16 | 4rem | 64 | |
| 4.5 | 1.125rem | 18 | (extend) |
| 5.5 | 1.375rem | 22 | (extend) |
| 13 | 3.25rem | 52 | (extend) |
| 15 | 3.75rem | 60 | (extend) |
| 18 | 4.5rem | 72 | (extend) |

**일관성 규칙**: 카드 내부 `p-4`~`p-5`, 섹션 간 `gap-4`~`gap-6`, 페이지 여백 `px-4` / `max-w-*` + `mx-auto`.

---

## 4. Border Radius

| Tailwind | 값 | 용도 |
|----------|-----|------|
| `rounded-sm` | 6px | 뱃지, 태그 |
| `rounded-md` | 10px | 버튼, 입력 |
| `rounded-lg` | 14px | 패널, 드롭다운 |
| `rounded-xl` | 18px | 카드 |
| `rounded-2xl` | 24px | 모달, 큰 카드 |
| `rounded-card` | 18px | 카드(시맨틱) |
| `rounded-panel` | 14px | 패널(시맨틱) |
| `rounded-button` | 10px | 버튼(시맨틱) |
| `rounded-input` | 10px | 입력(시맨틱) |
| `rounded-pill` | 9999px | 필, 아바타 원형 |

---

## 5. Shadow System

| Tailwind | 용도 |
|----------|------|
| `shadow-xs` | 미세 구분 (리스트 행) |
| `shadow-sm` | 버튼·입력 눌림 |
| `shadow-soft` | 기본 카드/패널 |
| `shadow-md` | 플로팅 버튼, 드롭다운 |
| `shadow-lg` | 모달, 오버레이 |
| `shadow-xl` | 풀스크린 오버레이 |
| `shadow-inner` | 입력 inset |
| `shadow-card` | 카드 기본 |
| `shadow-card-hover` | 카드 호버 |

값은 `tailwind.config.ts`의 `boxShadow` 확장 참고.

---

## 6. 사용 원칙

1. **색**: 배경/텍스트/테두리는 `theme-*` CSS 변수 계열만 사용 (`bg-theme-bg`, `text-theme-text` 등).
2. **타이포**: 본문은 `text-body` + `leading-reading` 또는 `text-body-md`, 제목은 `text-xl`~`text-2xl` + `font-semibold` + `tracking-tight`.
3. **간격**: 4의 배수(4, 8, 12, 16, 24, 32) 우선. `gap-4`/`p-5`로 정렬.
4. **반경**: 컴포넌트 크기에 맞춰 `rounded-md`(작은 UI), `rounded-xl`(카드), `rounded-2xl`(모달).
5. **그림자**: 평면은 `shadow-card`, 떠 있는 요소는 `shadow-md`/`shadow-lg`.

---

## 7. 파일 참조

- **테마 확장**: `tailwind.config.ts` — `theme.extend`
- **CSS 변수**: `app/globals.css` — `:root`
- **시맨틱 토큰**: `lib/design/tokens.ts` — `BG`, `TEXT`, `BORDER`, `RADIUS`, `SHADOW`, `PADDING`, `TYPOGRAPHY`, 버튼/입력/카드 패턴
