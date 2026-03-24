# Product Surface Map

Last updated: 2026-03-24
Reflects the cleaned-up surface after the 2026 Q1 data-layer and product-surface cleanup passes.

---

## Core Visible Surface

Routes that are reachable from the primary navigation (BottomNav, Header, or direct in-flow links).
These are the routes that constitute the current product.

### Bottom Navigation (5 tabs)

| Tab | Route | Active match |
|---|---|---|
| 홈 | `/home` | `/home` exactly |
| 셀 | `/cells` | `/cells/*` or `/mission/*` |
| 콘텐츠 | `/contents` | `/contents/*` |
| 숏츠 | `/shorts` | `/shorts/*` |
| 프로필 | `/me` → `/profile/[id]` | `/me` or `/profile/*` |

### Header Actions

| Action | Route |
|---|---|
| 글 쓰기 | `/write` |
| 메시지 | `/messages` |
| 알림 | `/notifications` |
| 설정 | `/settings` |
| 관리자 (ADMIN role only) | `/admin` |

### Core In-Flow Routes

These are reachable from the nav surfaces above via normal user interaction.

```
/home                          — following feed (home tab)
/cells                         — cells hub with topic cards + community boards
/cells/[id]                    — individual cell detail
/cells/[id]/meetings           — cell meeting history
/cells/[id]/meeting/start      — start a new cell meeting
/cells/[id]/meeting/prayer     — meeting prayer phase
/cells/[id]/meeting/sermon     — meeting sermon phase
/cells/[id]/meeting/life       — meeting life-sharing phase
/cells/[id]/meeting/pray       — meeting pray phase
/cells/[id]/meeting/summary    — meeting summary
/cells/join/[token]            — join cell via invite token
/cells/counsel                 — 고민상담 board (신앙 질문/고민)
/cells/topics/[slug]           — topic-scoped cell feed
/contents                      — content feed (search + category browsing)
/shorts                        — short-form video feed
/mission                       — 세계 선교 content hub (post feed, country filter)
/mission/[country]             — country-specific mission post feed
/missions                      — 선교 프로젝트 directory (structured DB records)
/missions/[id]                 — mission project detail (prayer support, reports)
/missionary                    — missionary dashboard (MISSIONARY role only)
/missionary/project/create     — register new mission project (MISSIONARY only)
/missionary/supporters         — supporter list for missionary projects
/missionary/reports            — field reports for missionary projects
/me                            — redirect → /profile/[id] (current user)
/profile/[id]                  — user profile (posts tab + shorts tab)
/profile/[id]/followers        — follower list (linked from profile stats)
/profile/[id]/following        — following list (linked from profile stats)
/post/[id]                     — post detail with comments and reactions
/write                         — compose post
/messages                      — message inbox
/messages/[userId]             — direct message thread
/notifications                 — notification center
/bookmarks                     — saved posts
/search                        — search (posts / people / tags tabs)
/topics/[tag]                  — tag-filtered post feed (linked from post tags)
/settings                      — settings hub
/settings/profile              — profile editing (canonical edit path)
/settings/account              — account management, deactivation
/settings/notifications        — notification preferences
/admin/*                       — admin panel (ADMIN role only)
```

---

## Redirect Routes (Legacy Compat)

These routes exist only to preserve old links and bookmarks. They have no product content.

| Route | Redirects to | Reason |
|---|---|---|
| `/feed` | `/home` (with qs forwarding) | Old feed URL |
| `/explore` | `/contents` | Retired discovery hub |
| `/topics` | `/search?tab=tags` | Retired tag-listing hub |
| `/profile/[id]/edit` | `/settings/profile` | Duplicate edit surface; canonical is settings |
| `/profile/[id]/posts` | `/profile/[id]` | Duplicate posts surface; canonical is profile default tab |

---

## Disconnected-but-Retained Domains

These routes have full implementations but **no visible navigation entry** from the core surface.
They are accessible only via direct URL. They should not be linked from core pages.

### Creator / Candle Subscription System

Entry point removed from `/settings` in 2026 Q1 cleanup. The crow (구독) tab was removed
from the profile. The candle purchase flow has no active surface entry.

```
/creator                       — creator dashboard (post stats, analytics links)
/creator/posts                 — content management list
/creator/analytics             — per-post reaction analytics
/creator/dashboard             — aggregate stats dashboard
/settings/creator              — subscription price configuration
/settings/candles              — candle balance + purchase
/payments/success              — candle purchase success callback
/payments/fail                 — candle purchase failure callback
```

**Canonical access**: direct URL only.
**Status**: feature-complete but disconnected from nav.

### Theology Q&A

No core nav entry was ever added. Fully self-contained.

```
/theology                      — question list with category tabs
/theology/ask                  — submit a theology question
/theology/topics               — browse questions by category
/theology/[id]                 — question detail with answers and voting
```

**Canonical access**: direct URL only.
**Status**: functional but dark.

### Network Hub

No bottom nav entry. Was linked from `/explore` (now redirects to `/contents`).
All internal links are within the network domain itself.

```
/network                       — people/cells/churches discovery hub
/network/suggested             — suggested people to follow
/network/cells                 — open cells directory
/network/churches              — registered churches
```

**Canonical access**: direct URL only.
**Status**: functional but dark.

### Orphaned Profile Subroutes

No profile tab links here. Accessible only via direct URL.

```
/profile/[id]/notes            — paginated shared notes for a user
/profile/[id]/testimonies      — TESTIMONY-category posts for a user
/profile/[id]/cells            — cells a user is a member of
/profile/[id]/missions         — missionary projects for a user
```

**Canonical access**: direct URL only.
**Status**: functional but dark. No visible navigation entry.

### Disconnected Cells Board

Board card removed from `/cells` hub in 2026 Q1 cleanup.

```
/cells/collab-requests         — collaboration request board (creator-adjacent)
```

**Canonical access**: direct URL only.
**Status**: functional but dark.

---

## Future Deletion Candidates

These domains/routes should be evaluated for full deletion in a future pass.
Do not add new features to these. Do not link to them from core pages.

### High priority

| Domain | Reason |
|---|---|
| `/creator/*` + `/settings/creator` + `/settings/candles` + `/payments/*` | Entire crow/candle subscription system; crow tab and subscriber UI already removed from profile. No active user-facing entry point. Delete when subscription feature is formally retired. |
| `ProfileCrowTab.tsx` | Component for removed crow tab. Dead code — profile page no longer renders it. |
| `ProfileSpiritualTab.tsx` | Component for removed spiritual tab. Dead code — profile page no longer renders it. |

### Medium priority

| Domain | Reason |
|---|---|
| `/network/*` | Overlaps with `/search` (people tab) and `/cells`. No nav entry. Consider redirect → `/search` if formally retired. |
| `/cells/collab-requests/*` | Creator-adjacent board. Removed from cells nav. Linked to crow/creator feature set. |
| `/profile/[id]/testimonies` | Uses English labels in a Korean app. Duplicates profile posts filtered by category. No nav entry. |

### Low priority (evaluate later)

| Domain | Reason |
|---|---|
| `/theology/*` | Self-contained, functional. No nav entry. Either promote to core (add to cells hub) or delete. Not currently misleading. |
| `/profile/[id]/notes` | Shared notes listing. No profile tab entry since spiritual tab removal. May be re-linked when notes becomes core again. |
| `/profile/[id]/cells` | User cell membership. Could be linked from profile or cells domain. No current entry. |
| `/profile/[id]/missions` | User missionary projects. Could be linked from missionary profile badge. No current entry. |

---

## Data Layer Summary

The data layer was split from a monolithic `repository.ts` (1421 lines) into domain repos in 2026 Q1.

### Domain repositories (`lib/data/`)

| File | Covers |
|---|---|
| `postRepository.ts` | Posts, feed, categories |
| `commentRepository.ts` | Comments |
| `userRepository.ts` | Users, profiles, reports |
| `followRepository.ts` | Follow graph |
| `reactionRepository.ts` | Reactions (prayed, withYou) |
| `notificationRepository.ts` | Notifications |
| `dmRepository.ts` | Direct messages |
| `bookmarkRepository.ts` | Bookmarks |
| `searchRepository.ts` | Search (posts, people, tags) |
| `aiRepository.ts` | AI/recommendation features |
| `cellsRepository.ts` | Cells, membership, messages |
| `notesRepository.ts` | Spiritual notes, prayer, life journal |
| `supportRepository.ts` | Ministry support/donation intents |
| `missionaryRepository.ts` | Missionary projects, reports, supporters |
| `theologyRepository.ts` | Theology Q&A, answers, votes |
| `statsRepository.ts` | Creator post stats |
| `moderationRepository.ts` | Admin moderation reports |

### Compatibility shims

- `lib/data/supabaseRepository.ts` — re-exports all domain repos (16 `export *` lines)
- `lib/data/repository.ts` — backward-compat shim for 97 existing callers; also holds `getCurrentUser`, `isBlocked`, `isMuted`, `toggleBlock`, `toggleMute` (in-memory browser state, no DB table)
