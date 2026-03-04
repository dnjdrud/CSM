# Pinned post columns (posts.pinned_at / pinned_by)

The feed supports an optional pinned post at the top. If your `posts` table does not have these columns, the app still works: the repository detects "pinned_at does not exist" and skips pinned filters.

## Option 1: Run existing migration

From the project root:

```bash
npx supabase db push
```

Or apply the migration file manually: `supabase/migrations/20250302000000_post_pinning.sql`

## Option 2: Run SQL in Supabase Dashboard

In Supabase → SQL Editor, run:

```sql
-- Pinned post: one global pinned post at top of feed. Admin-only pin/unpin.
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS pinned_at timestamptz,
  ADD COLUMN IF NOT EXISTS pinned_by uuid REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_posts_pinned_at ON public.posts(pinned_at DESC) WHERE pinned_at IS NOT NULL;
```

## Columns

| Column      | Type        | Nullable | Description                    |
|------------|-------------|----------|--------------------------------|
| `pinned_at`  | timestamptz | YES      | When the post was pinned       |
| `pinned_by`  | uuid        | YES      | User who pinned (FK to users.id) |

Index: `idx_posts_pinned_at` on `(pinned_at DESC)` where `pinned_at IS NOT NULL`.
