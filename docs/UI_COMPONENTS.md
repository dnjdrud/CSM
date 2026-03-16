# Cellah UI 컴포넌트 가이드

기능·구조 변경 없이 **UI만** 적용된 공통 컴포넌트 사용법입니다.  
디자인 토큰은 [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md), 클래스 선택은 [STYLE_GUIDE.md](./STYLE_GUIDE.md)를 참고하세요.

---

## 1. Button

**경로:** `@/components/ui/Button`

- **Variants:** `primary` | `secondary` | `ghost` | `danger`
- **Sizes:** `sm` | `md`
- **상태:** hover, active(scale), focus(ring), disabled, loading

```tsx
import { Button } from "@/components/ui/Button";

<Button variant="primary" size="md">저장</Button>
<Button variant="secondary" size="sm">취소</Button>
<Button variant="ghost" loading>처리 중…</Button>
<Button variant="danger">삭제</Button>
```

- Primary: `focus-visible:ring-theme-primary`
- Secondary/Ghost: `focus-visible:ring-theme-accent`
- Danger(soft): `focus-visible:ring-theme-danger` (배경: danger-bg, 텍스트: danger)
- Spacing: `sm` → `px-3 py-1.5`, `md` → `px-4 py-2` (min-height 44px)

---

## 2. Input

**경로:** `@/components/ui/Input`

- 단일 라인 입력; `error` 시 테두리/링 색상 변경
- **상태:** hover(border), focus(ring), disabled

```tsx
import { Input } from "@/components/ui/Input";

<Input placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} />
<Input type="password" error={!!errors.password} />
```

- `ref` 전달 가능 (`forwardRef`)
- 클래스: `rounded-input`, `px-3 py-2.5`, `focus:ring-2 focus:ring-theme-primary/20`

---

## 3. Card

**경로:** `@/components/ui/Card`

- `Card`, `CardHeader`, `CardContent`, `CardFooter` 조합
- **상태:** hover(shadow 강화), focus-within(ring)

```tsx
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";

<Card>
  <CardHeader><h2>제목</h2></CardHeader>
  <CardContent>본문</CardContent>
  <CardFooter>버튼 영역</CardFooter>
</Card>
```

- 패딩: Header/Content/Footer 각각 `p-5` 기준, 경계는 `pb-0` / `pt-0`로 맞춤
- Shadow: 기본 `shadow-card`, hover `shadow-card-hover`

---

## 4. Avatar

**경로:** `@/components/ui/Avatar`

- 이미지 또는 이니셜; **sizes:** `sm` (32px) | `md` (40px)
- 링크 등으로 감쌀 경우 `focus-within:ring-theme-primary` 적용

```tsx
import { Avatar } from "@/components/ui/Avatar";

<Avatar name="홍길동" src={avatarUrl} size="md" />
<Avatar name="홍길동" size="sm" />
```

---

## 5. Badge

**경로:** `@/components/ui/Badge`

- **Variants:** `default` | `muted` | `subtle` | `testimony` | `daily-prayer`
- Spacing: `px-2 py-0.5`, `rounded-sm`

```tsx
import { Badge } from "@/components/ui/Badge";

<Badge variant="default">역할</Badge>
<Badge variant="muted">태그</Badge>
```

---

## 6. Modal

**경로:** `@/components/ui/Modal`

- Overlay + 패널; ESC로 닫기; 클릭 아웃사이드 닫기
- **상태:** 닫기 버튼 hover/active/focus

```tsx
import { Modal } from "@/components/ui/Modal";

<Modal open={isOpen} onClose={() => setIsOpen(false)} title="제목" aria-label="대화상자">
  <p>내용</p>
</Modal>
```

- 패널: `rounded-2xl`, `shadow-lg`, `border-theme-border`
- 닫기 버튼: `rounded-lg`, 36×36px, focus ring

---

## 7. Dropdown

**경로:** `@/components/ui/Dropdown`, `DropdownItem`, `DropdownItemDanger`

- 트리거 + 메뉴 패널; ESC로 닫기
- **상태:** 아이템 hover/active/focus

```tsx
import { Dropdown, DropdownItem, DropdownItemDanger } from "@/components/ui/Dropdown";

const [open, setOpen] = useState(false);
<Dropdown open={open} onOpenChange={setOpen} trigger={({ onToggle }) => (
  <button type="button" onClick={onToggle} className="...">메뉴</button>
)} align="right">
  <DropdownItem onClick={...}>편집</DropdownItem>
  <DropdownItemDanger onClick={...}>삭제</DropdownItemDanger>
</Dropdown>
```

- 트리거: `trigger`에 ReactNode 또는 `({ onToggle }) => ReactNode` 전달
- 메뉴: `rounded-lg`, `shadow-md`, `py-1`; 아이템 `px-3 py-2.5`, hover/active 배경

---

## 8. Tabs

**경로:** `@/components/ui/Tabs`, `Tab`, `TabPanel`

- 제어 모드: `value` + `onChange`
- **상태:** 탭 hover/focus, 활성 탭 하단 보더

```tsx
import { Tabs, Tab, TabPanel } from "@/components/ui/Tabs";

const [tab, setTab] = useState("posts");
<Tabs value={tab} onChange={setTab} aria-label="프로필 탭">
  <Tab value="posts" icon="📝">글</Tab>
  <Tab value="contents" icon="🎬">콘텐츠</Tab>
</Tabs>
<TabPanel value="posts">...</TabPanel>
<TabPanel value="contents">...</TabPanel>
```

- 탭: `px-4 py-3`, `border-b-2`, active 시 `border-theme-primary text-theme-primary`
- 기존 페이지별 탭(HomeTabs, ProfileTabs 등)은 데이터/라우팅이 다르므로 필요 시 점진적으로 `Tabs`/`Tab`/`TabPanel`로 교체 가능

---

## 9. Toast

**경로:** `@/components/ui/Toast` (Provider + `useToast`)

- `show(message)` / `error(message?)`; 일정 시간 후 자동 사라짐
- **상태:** 성공(primary 배경), 에러(danger-bg + danger 텍스트); 스페이싱/radius 통일

```tsx
import { ToastProvider, useToast } from "@/components/ui/Toast";

// layout
<ToastProvider><App /></ToastProvider>

// in component
const toast = useToast();
toast.show("저장되었습니다.");
toast.error("다시 시도해 주세요.");
```

- 컨테이너: `rounded-xl`, `px-5 py-3`, `shadow-lg`

---

## 공통 규칙

| 항목 | 적용 |
|------|------|
| **Hover** | 배경/테두리 변화, 카드·버튼은 shadow/scale 등으로 구분 |
| **Active** | 버튼/아이템은 `active:bg-*` 또는 `active:scale-[0.98]` |
| **Focus** | `focus:outline-none` + `focus-visible:ring-2 focus-visible:ring-offset-2` (색은 역할별) |
| **Spacing** | 카드/모달/드롭다운 패딩 `p-5` 또는 `px-5 py-4`, 버튼/입력은 토큰 기준 |
| **접근성** | `aria-label`, `aria-selected`, `role="dialog"` 등 유지; 포커스 링 필수 |

기능·라우팅·데이터·API는 변경하지 않고, 위 컴포넌트와 클래스만 사용해 UI 일관성을 유지하면 됩니다.

---

## 10. Feed / PostCard

**경로:** `@/components/PostCard`

SNS 스타일 피드의 한 게시글 카드. **데이터·기능 변경 없이** 레이아웃·스타일만 적용됨.

### 레이아웃 요약

| 영역 | 적용 |
|------|------|
| **카드** | `Card` + `CardContent`, 패딩 `px-4 py-4 sm:px-5 sm:py-5` |
| **작성자** | 아바타(프로필 링크) + 이름(font-semibold) + 역할/소속(meta) + 시간(caption). 액션(메뉴/팔로우) 우측 정렬 |
| **본문** | `text-[15px] leading-[1.65]`, `break-words`. 더보기 링크는 `text-theme-primary` |
| **태그** | `rounded-full`, `gap-2`, `px-3 py-1`, hover 시 `bg-theme-surface-3` |
| **반응/액션 바** | `mt-5 pt-4 border-t`, 공통 `actionBtnBase` (hover/active/focus). 활성 시 `bg-theme-accent-bg/60 text-theme-primary` |
| **댓글 영역** | `mt-5 pt-5 border-t`, 제목 `text-caption` uppercase, 내부 `rounded-lg bg-theme-surface-2/40` |

### 반응 버튼·댓글 버튼

- 터치 타겟 44px, `rounded-lg`, `border-transparent` 기본.
- hover: `bg-theme-surface-2`, active: `bg-theme-surface-3`, focus: `ring-2 ring-theme-accent ring-offset-2`.
- 선택됨( Prayed / With you / 댓글 열림 ): `bg-theme-accent-bg/60 text-theme-primary border-theme-accent/40`.
- 카운트는 `tabular-nums opacity-80`로 라벨 옆 표시.

참고: Instagram / Threads / Substack / Patreon 스타일을 참고해 가독성과 인터랙션 구분을 맞춤.
