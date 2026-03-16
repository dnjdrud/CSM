# 구현된 화면(라우트) 목록

복붙용. Next.js App Router 기준 실제 URL 경로입니다.

---

## 전체 라우트 (한 줄씩 복붙)

```
/
/feed
/home
/write
/search
/explore
/bookmarks
/me
/post/[id]
/topics
/topics/[tag]
/notifications
/notifications/settings
/messages
/messages/[userId]
/cell
/cell/[id]
/cell/join/[token]
/cells
/cells/[id]
/cells/[id]/meetings
/cells/[id]/members
/cells/[id]/posts
/cells/[id]/prayer
/cells/[id]/meeting/start
/cells/[id]/meeting/life
/cells/[id]/meeting/prayer
/cells/[id]/meeting/pray
/cells/[id]/meeting/sermon
/cells/[id]/meeting/summary
/cells/topics/[slug]
/cells/join/[token]
/network
/network/cells
/network/churches
/network/suggested
/contents
/creator
/creator/dashboard
/creator/posts
/creator/analytics
/settings
/settings/account
/settings/profile
/settings/notifications
/settings/creator
/settings/candles
/profile/[id]
/profile/[id]/edit
/profile/[id]/posts
/profile/[id]/testimonies
/profile/[id]/followers
/profile/[id]/following
/profile/[id]/cells
/profile/[id]/notes
/profile/[id]/prayers
/profile/[id]/missions
/prayer
/prayer/[id]
/prayer/create
/prayer/my
/prayer/chains
/mission
/mission/[country]
/missions
/missions/[id]
/missionary
/missionary/project/create
/missionary/supporters
/missionary/reports
/theology
/theology/topics
/theology/[id]
/theology/ask
/payments/success
/payments/fail
/login
/onboarding
/onboarding/welcome
/onboarding/complete
/request-access
/auth/complete
/auth/set-password
/auth/callback/session
/support
/support/[id]
/support/checkout
/support/success
/support/fail
/support/thank-you
/guide
/principles
/terms
/privacy
/contact
/admin
/admin/debug
/admin/users
/admin/signups
/admin/signup-requests
/admin/invites
/admin/audit
/admin/content
/admin/moderation
/admin/system-logs
```

---

## 그룹별 정리

### 퍼블릭 (비로그인)
| 경로 | 설명 |
|------|------|
| `/` | 랜딩 |
| `/login` | 로그인 |
| `/onboarding` | 온보딩 |
| `/onboarding/welcome` | 온보딩 환영 |
| `/onboarding/complete` | 온보딩 완료 |
| `/request-access` | 가입 신청 |
| `/auth/complete` | 인증 완료 |
| `/auth/set-password` | 비밀번호 설정 |
| `/auth/callback/session` | 세션 콜백 |
| `/support` | 후원 |
| `/support/[id]` | 후원 상세 |
| `/support/checkout` | 결제 |
| `/support/success` | 결제 성공 |
| `/support/fail` | 결제 실패 |
| `/support/thank-you` | 감사 |
| `/guide` | 가이드 |
| `/principles` | 원칙 |
| `/terms` | 이용약관 |
| `/privacy` | 개인정보처리방침 |
| `/contact` | 문의 |

### 앱 (로그인 후)
| 경로 | 설명 |
|------|------|
| `/feed` | 피드 |
| `/home` | 홈(피드/기도) |
| `/write` | 글쓰기 |
| `/search` | 검색 |
| `/explore` | 탐색 |
| `/bookmarks` | 북마크 |
| `/me` | 마이 |
| `/post/[id]` | 포스트 상세 |
| `/topics` | 토픽 목록 |
| `/topics/[tag]` | 토픽별 피드 |
| `/notifications` | 알림 |
| `/notifications/settings` | 알림 설정 |
| `/messages` | 메시지 목록 |
| `/messages/[userId]` | 채팅 |
| `/cell` | 셀 |
| `/cell/[id]` | 셀 상세 |
| `/cell/join/[token]` | 셀 초대 가입 |
| `/cells` | 셀 목록 |
| `/cells/[id]` | 셀 상세 |
| `/cells/[id]/meetings` | 모임 목록 |
| `/cells/[id]/members` | 멤버 |
| `/cells/[id]/posts` | 셀 포스트 |
| `/cells/[id]/prayer` | 셀 기도 |
| `/cells/[id]/meeting/start` | 모임 시작 |
| `/cells/[id]/meeting/life` | 삶 나눔 |
| `/cells/[id]/meeting/prayer` | 기도 |
| `/cells/[id]/meeting/pray` | 기도 |
| `/cells/[id]/meeting/sermon` | 말씀 |
| `/cells/[id]/meeting/summary` | 모임 요약 |
| `/cells/topics/[slug]` | 셀 토픽 피드 |
| `/cells/join/[token]` | 셀 초대 가입 |
| `/network` | 네트워크 |
| `/network/cells` | 네트워크 셀 |
| `/network/churches` | 교회 |
| `/network/suggested` | 추천 |
| `/contents` | 콘텐츠 |
| `/creator` | 크리에이터 |
| `/creator/dashboard` | 대시보드 |
| `/creator/posts` | 포스트 관리 |
| `/creator/analytics` | 분석 |
| `/settings` | 설정 |
| `/settings/account` | 계정 |
| `/settings/profile` | 프로필 |
| `/settings/notifications` | 알림 설정 |
| `/settings/creator` | 크리에이터 설정 |
| `/settings/candles` | 캔들 |
| `/profile/[id]` | 프로필 |
| `/profile/[id]/edit` | 프로필 수정 |
| `/profile/[id]/posts` | 프로필 글 |
| `/profile/[id]/testimonies` | 간증 |
| `/profile/[id]/followers` | 팔로워 |
| `/profile/[id]/following` | 팔로잉 |
| `/profile/[id]/cells` | 셀 |
| `/profile/[id]/notes` | 노트 |
| `/profile/[id]/prayers` | 기도 |
| `/profile/[id]/missions` | 선교 |
| `/prayer` | 기도 |
| `/prayer/[id]` | 기도 상세 |
| `/prayer/create` | 기도 작성 |
| `/prayer/my` | 내 기도 |
| `/prayer/chains` | 기도 체인 |
| `/mission` | 선교 |
| `/mission/[country]` | 국가별 선교 |
| `/missions` | 선교 목록 |
| `/missions/[id]` | 선교 상세 |
| `/missionary` | 선교사 |
| `/missionary/project/create` | 프로젝트 생성 |
| `/missionary/supporters` | 서포터 |
| `/missionary/reports` | 리포트 |
| `/theology` | 신학 |
| `/theology/topics` | 주제 |
| `/theology/[id]` | 신학 상세 |
| `/theology/ask` | 질문 |
| `/payments/success` | 결제 성공 |
| `/payments/fail` | 결제 실패 |

### 어드민
| 경로 | 설명 |
|------|------|
| `/admin` | 어드민 홈 |
| `/admin/debug` | 디버그 |
| `/admin/users` | 사용자 |
| `/admin/signups` | 가입 |
| `/admin/signup-requests` | 가입 승인 |
| `/admin/invites` | 초대 |
| `/admin/audit` | 감사 로그 |
| `/admin/content` | 콘텐츠 |
| `/admin/moderation` | 검토 |
| `/admin/system-logs` | 시스템 로그 |
