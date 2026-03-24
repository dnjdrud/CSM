-- Efficient DB-side aggregation RPCs for post hydration.
-- Replaces the previous approach of fetching all raw comment/reaction rows
-- and counting them in JavaScript.
--
-- Each function receives an array of post IDs and returns only the aggregated
-- counts — transferring O(distinct posts) rows instead of O(total rows).
--
-- SECURITY DEFINER so counts are always visible regardless of caller auth level.
-- No user-identifying data is returned, only numeric counts per post/type.

CREATE OR REPLACE FUNCTION get_comment_counts(post_ids uuid[])
RETURNS TABLE(post_id uuid, count bigint)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT post_id, COUNT(*)::bigint
  FROM comments
  WHERE post_id = ANY(post_ids)
  GROUP BY post_id;
$$;

CREATE OR REPLACE FUNCTION get_reaction_counts(post_ids uuid[])
RETURNS TABLE(post_id uuid, type text, count bigint)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT post_id, type, COUNT(*)::bigint
  FROM reactions
  WHERE post_id = ANY(post_ids)
  GROUP BY post_id, type;
$$;
