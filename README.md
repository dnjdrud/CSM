# CSM

A minimal MVP for a Christian-only professional network: text-first, reflection-driven, no backend.

## Tech

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (Auth, Postgres, Edge Functions) — optional; falls back to in-memory when env is not set.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Supabase (Phases 4–4.4)

When `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set, the app uses Supabase for auth (magic link), social data (posts, comments, follows, reactions, notifications), and notifications via Edge Function.

### Manual steps after cloning / env setup

0. **Enable email signups (Auth)**  
   Supabase Dashboard → **Authentication** → **Providers** → **Email**  
   - **Enable email signups** (또는 "Allow new users to sign up")를 켜야 로그인 링크·가입 요청이 동작합니다.  
   - 꺼져 있으면 "Signup is not configured on this server" 같은 오류가 날 수 있습니다.

1. **Apply SQL migrations**  
   In Supabase Dashboard → SQL Editor, run in order:
   - `supabase/migrations/20250228000000_social_tables.sql` (tables + RLS)
   - `supabase/migrations/20250228000001_notifications_edge_and_visibility_rls.sql` (notifications insert removed, posts visibility RLS)
   - `supabase/migrations/20250228000002_moderation_reports.sql` (moderation_reports table, posts hidden_at, RLS for admin/reports)
   - `supabase/migrations/20250228000003_invite_codes.sql` (invite_codes table, single-use codes, RLS)
   - `supabase/migrations/20250301000000_audit_logs.sql` (audit_logs, blocks, mutes, admin user update policy)
   - `supabase/migrations/20250308000000_signup_approval.sql` (signup_requests, approval_tokens, users.username/church, APPROVAL invite code)

2. **Optional: Admin moderation (Phase 4-5)**  
   Set in `.env.local`:
   ```env
   ADMIN_EMAILS=you@gmail.com,other@church.org
   ```
   Comma-separated list of emails that receive the ADMIN role on login (idempotent). Only these users can access `/admin/*` and the moderation dashboard.

3. **Deploy the `notify` Edge Function**  
   Notifications are created only by this function (no direct inserts from the app).  
   Notifications are created only by this function (no direct inserts from the app).

   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase functions deploy notify
   ```

   Ensure the function has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (set via Dashboard → Project Settings → Edge Functions or `supabase secrets set`).

4. **Deploy the `send-approval-email` Edge Function (approval-based signup)**  
   When using approval-based signup, admins approve requests and the app emails a “complete signup” link. Deploy and set secrets:

   ```bash
   npx supabase functions deploy send-approval-email
   npx supabase secrets set RESEND_API_KEY=re_xxxx
   npx supabase secrets set EMAIL_FROM="CSM <no-reply@yourdomain.com>"
   ```

   In your app env (e.g. `.env.local`), set:
   - `NEXT_PUBLIC_APP_URL` (or `APP_URL`) — base URL for completion links (e.g. `https://yourapp.com`).
   - Resend: use a verified domain in [Resend](https://resend.com) and set `EMAIL_FROM` in Supabase secrets to that sender.

   **Invite link by email:** To use “Send link” on Admin → Invites (email the invite code and sign-in URL to a recipient), deploy the `send-invite-email` Edge Function with the same Resend secrets:

   ```bash
   npx supabase functions deploy send-invite-email
   ```
   (Uses the same `RESEND_API_KEY` and `EMAIL_FROM` as above.)

5. **Verify**
   - Follow / comment / react: notifications still appear (created via Edge Function).
   - Direct insert into `public.notifications` from the app is denied (RLS has no insert policy).
   - Feed and post detail: FOLLOWERS and PRIVATE posts are enforced at DB level (RLS); only author or followers see FOLLOWERS, only author sees PRIVATE.
   - **Admin:** Log in with an email in `ADMIN_EMAILS` → you get role ADMIN; visit `/admin/moderation` to see open reports. Report a post/comment from the app → it appears in the queue. Use "Hide post" / "Delete comment" / "Resolve" as needed. Hidden posts no longer appear in feed for non-authors (RLS).

---

## Invite-only Beta (Phase 5-1)

The app can run in **invite-only** mode: only users who have a valid invite code can complete onboarding and become members.

- **Admins:** Log in with an email in `ADMIN_EMAILS`, then go to **Admin → Invite codes** (`/admin/invites`). Click **Generate Invite Code** to create a new single-use code. Copy the code and share it (e.g. by email) with the person you want to invite.
- **New users:** After signing in via magic link, they land on the onboarding page. They must enter a valid invite code (and name, role, etc.). If the code is invalid or already used, they see an error and cannot complete onboarding. Once the code is consumed, their profile is created and they are redirected to the feed.
- **Single-use:** Each code can be used exactly once. Used codes are shown in the admin invite table with "Used by" and "Used at".
- **Middleware:** Authenticated users without a profile (e.g. just clicked the magic link) cannot access `/feed` or other protected routes until they complete onboarding; they are redirected to `/onboarding`.

Apply the migration `supabase/migrations/20250228000003_invite_codes.sql` to enable invite codes.

---

## Approval-based signup

New users can **request access** (no password until approved):

1. **Request:** Anyone visits `/onboarding`, fills email, name, role, church, bio, affiliation, and submits. No Auth account is created.
2. **Review:** Admins go to **Admin → Signup requests** (`/admin/signup-requests`), see pending requests, and **Approve** or **Reject** (with optional note).
3. **Approve:** On approve, the system sends an email (via Edge Function `send-approval-email`) with a “Complete signup” link valid for 7 days.
4. **Complete:** User opens the link (`/onboarding/complete?token=...`), sets password (and optional username), confirms profile fields; the app creates the Auth user and `public.users` row, then redirects to `/login`.
5. **Sign in:** User signs in at `/login` with email+password or Google/Kakao. Only users with a `public.users` row can access protected routes; others are redirected to `/login?message=profile_missing`.

**Env:** Apply `supabase/migrations/20250308000000_signup_approval.sql`. In `.env.local` set **`SUPABASE_SERVICE_ROLE_KEY`** (from Supabase Dashboard → Project Settings → API → `service_role` secret); the app uses it to create signup requests and complete signup. Deploy `send-approval-email` and set `RESEND_API_KEY`, `EMAIL_FROM` in Supabase secrets; set `NEXT_PUBLIC_APP_URL` (or `APP_URL`) in the app.

**Bootstrapping the first admin:** Invite codes can only be generated by an ADMIN. To get the first admin, create their auth user (e.g. via Supabase Dashboard → Authentication), then insert a row into `public.users` with that `id`, a `name`, and `role = 'ADMIN'`. Add their email to `ADMIN_EMAILS` so they keep the ADMIN role on login. They can then generate invite codes for others.

---

## Admin Console v1 (Phase 5-1.5)

The admin area at `/admin/*` is protected by middleware (auth + ADMIN role) and a shared layout with sidebar.

- **Layout:** All admin routes use `app/admin/layout.tsx`, which calls `requireAdmin()` and renders `AdminSidebar` (Dashboard, Moderation, Invites, Users, Audit Log) plus the page content.
- **Dashboard (`/admin`):** Cards for open reports today, new users today, and active users (last 7 days).
- **Moderation (`/admin/moderation`):** Open reports table. **Hide post** and **Delete comment** use a Danger Zone confirmation (user must type e.g. "hide post" / "delete comment" to enable the button). Resolve is a simple button. All actions are written to `audit_logs`.
- **Signup requests (`/admin/signup-requests`):** List pending approval requests. **Approve** sends an email with a 7-day completion link; **Reject** (with optional note) logs the action.
- **Invites (`/admin/invites`):** List invite codes, generate new ones. Generating logs `CREATE_INVITE` to the audit log.
- **Users (`/admin/users`):** Search users by name. For each user: role, blocked/muted status (by you as admin). Actions: **Block** / Unblock, **Mute** / Unmute, **Change role** (with Danger Zone: type the role code to confirm). Block and role change are destructive and require confirmation.
- **Audit Log (`/admin/audit`):** Read-only table of latest admin actions (time, actor, action, target).

**Architecture:**

- **Admin-only logic** lives under `lib/admin/*` (guard, audit, constants). **Admin UI** under `app/admin/*`. No admin business logic inside general repositories; admin mutations go through `lib/data/adminRepository.ts`, which performs the action and calls `logAdminAction()`.
- **Audit:** Every mutating admin action (hide post, delete comment, resolve report, create invite, block/mute user, change role) inserts a row into `public.audit_logs` (actor_id, action, target_type, target_id, metadata, created_at). RLS: only ADMIN can select/insert.
- **Danger Zone:** The `<DangerZoneConfirm />` component requires the user to type an exact confirmation string before enabling the action button (red). Used for hide post, delete comment, block user, and role change.

Apply `supabase/migrations/20250301000000_audit_logs.sql` to create `audit_logs`, `blocks`, `mutes`, and the admin user-update policy.

**Extracting to a standalone admin app later:** Keep `lib/admin/*` and `lib/data/adminRepository.ts` as the only places that depend on admin semantics. The admin app would use the same guard (`requireAdmin()` with your session source), the same `logAdminAction` and `adminRepository` (pointing to the same Supabase project). Move `app/admin/*` into the new app’s routes and reuse `AdminSidebar` and `DangerZoneConfirm`. Middleware in the new app would enforce `/admin` → auth + ADMIN the same way.

---

## Public launch checklist

Before going live, ensure:

1. **Sentry (errors & source maps)**  
   - Create a project at [sentry.io](https://sentry.io) and set in `.env` / deployment:
     - `SENTRY_DSN` (server/edge)
     - `NEXT_PUBLIC_SENTRY_DSN` (client)
     - `SENTRY_ENVIRONMENT` (e.g. `production`, `preview`)
   - Optional (for source map upload and readable stack traces): `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`.
   - Errors from client, server, and edge will appear in the Sentry dashboard; stack traces map to source when source maps are uploaded.

2. **Notify Edge Function**  
   - Deploy `notify` and confirm logs in Supabase Dashboard → Edge Functions → Logs. Each request logs `type`, `actorId`, `recipientId`, `postId`; failures log clearly for debugging.

3. **Admin signals**  
   - Dashboard shows “Today errors” and “Notify failures (today)” cards (placeholders until wired to Sentry API or system_logs). Use Sentry and Supabase logs to confirm “something broke today” when needed.

4. **Env and infra**  
   - All required Supabase and auth env vars set in production. Migrations applied. Rate limiting and RLS in place.

5. **Legal and trust**  
   - Publish and link `/privacy`, `/terms`, and `/contact` (footer links in root layout). Set `CONTACT_EMAIL` in production. Content is short, plain English, community-first.

6. **Security headers**  
   - Production responses include: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security`, `Permissions-Policy` (camera/microphone/geolocation disabled). Configured in `next.config.ts` via `lib/security/headers.ts`.

---

## Pages

- **/** — Landing (value prop, links to Feed / Write)
- **/feed** — List of reflections
- **/post/[id]** — Single reflection + optional reflection prompt
- **/write** — Compose form (demo; does not persist)

## Design

- **Tokens & components:** See [docs/DESIGN.md](docs/DESIGN.md) for principles, tokens (`lib/design/tokens.ts`), and how to add UI without breaking tone.
- Neutral palette (gray, off-white, muted blue); typography-first (serif for reading, system UI for chrome).
- Accessibility: skip link, focus-visible, semantic HTML. No gamification or flashy UI.
