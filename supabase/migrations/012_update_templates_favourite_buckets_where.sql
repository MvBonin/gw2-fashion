-- Fix: Supabase requires WHERE on UPDATE. Add WHERE true to satisfy.
CREATE OR REPLACE FUNCTION update_templates_favourite_buckets()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE templates
  SET favourite_count_last_7d = 0, favourite_count_last_30d = 0, favourite_count_last_90d = 0
  WHERE true;

  WITH buckets AS (
    SELECT
      template_id,
      count(*) FILTER (WHERE created_at >= now() - interval '7 days')  AS n_7d,
      count(*) FILTER (WHERE created_at >= now() - interval '30 days') AS n_30d,
      count(*) FILTER (WHERE created_at >= now() - interval '90 days') AS n_90d
    FROM template_favourites
    GROUP BY template_id
  )
  UPDATE templates t
  SET
    favourite_count_last_7d = b.n_7d,
    favourite_count_last_30d = b.n_30d,
    favourite_count_last_90d = b.n_90d
  FROM buckets b
  WHERE t.id = b.template_id;
END;
$$;
