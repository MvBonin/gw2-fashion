-- Trending: time-weighted likes (7d, 30d, 90d) + views*1 + copies*2
-- Score: views*1 + copies*2 + 7d*6 + (30d-7d)*4 + (90d-30d)*2

-- Bucket columns (refreshed by cron via update_templates_favourite_buckets)
ALTER TABLE templates
  ADD COLUMN IF NOT EXISTS favourite_count_last_7d INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS favourite_count_last_30d INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS favourite_count_last_90d INTEGER NOT NULL DEFAULT 0;

-- Generated trending_score
ALTER TABLE templates
  ADD COLUMN IF NOT EXISTS trending_score INTEGER GENERATED ALWAYS AS (
    view_count
    + (copy_count * 2)
    + (favourite_count_last_7d * 6)
    + ((favourite_count_last_30d - favourite_count_last_7d) * 4)
    + ((favourite_count_last_90d - favourite_count_last_30d) * 2)
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_templates_trending_score ON templates (trending_score DESC);

-- Function to refresh bucket counts from template_favourites (run via cron)
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

GRANT EXECUTE ON FUNCTION update_templates_favourite_buckets() TO anon;

-- Initial backfill
SELECT update_templates_favourite_buckets();
