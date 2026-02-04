-- Single RPC to create template + tags (reduces roundtrips from route to Supabase).
-- Callable by authenticated user; RLS applies (SECURITY INVOKER).
-- If this migration was already applied and you only fixed the function signature:
-- run this entire file in Supabase Dashboard → SQL Editor to update the function in place.
-- Drop any existing version (e.g. with OUT params) so only the RETURNS TABLE version remains.
DROP FUNCTION IF EXISTS create_template_with_tags(uuid, text, text, armor_type_enum, text, boolean, text[]);

CREATE OR REPLACE FUNCTION create_template_with_tags(
  p_user_id uuid,
  p_name text,
  p_fashion_code text,
  p_armor_type armor_type_enum,
  p_description text DEFAULT NULL,
  p_is_private boolean DEFAULT false,
  p_tag_names text[] DEFAULT '{}'
)
RETURNS TABLE(id uuid, slug text)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_username text;
  v_username_slug text;
  v_template_slug text;
  v_base_slug text;
  v_slug text;
  v_template_id uuid;
  v_existing_slugs text[];
  v_max_num int := 0;
  v_s text;
  v_has_base boolean := false;
  v_suffix text;
BEGIN
  -- Must be creating for self
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Username for slug
  SELECT u.username INTO v_username
  FROM users u
  WHERE u.id = p_user_id;
  IF v_username IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- Slugify (match JS: lower, trim, non-word out, spaces/hyphens to single hyphen, trim hyphens)
  v_username_slug := trim(both '-' from regexp_replace(regexp_replace(lower(trim(v_username)), '[^a-z0-9\s-]', '', 'g'), '[\s_-]+', '-', 'g'));
  v_template_slug := trim(both '-' from regexp_replace(regexp_replace(lower(trim(p_name)), '[^a-z0-9\s-]', '', 'g'), '[\s_-]+', '-', 'g'));
  v_base_slug := v_username_slug || '-' || v_template_slug;

  -- Existing slugs for this base
  SELECT array_agg(t.slug) INTO v_existing_slugs
  FROM templates t
  WHERE t.slug = v_base_slug OR t.slug LIKE v_base_slug || '-%';

  IF v_existing_slugs IS NULL OR array_length(v_existing_slugs, 1) IS NULL THEN
    v_slug := v_base_slug;
  ELSE
    FOREACH v_s IN ARRAY v_existing_slugs
    LOOP
      IF v_s = v_base_slug THEN
        v_has_base := true;
        v_max_num := greatest(v_max_num, 1);
      ELSIF v_s LIKE v_base_slug || '-%' THEN
        v_suffix := substring(v_s from length(v_base_slug) + 2);
        IF v_suffix ~ '^\d+$' THEN
          v_max_num := greatest(v_max_num, v_suffix::int);
        END IF;
      END IF;
    END LOOP;
    IF NOT v_has_base AND v_max_num = 0 THEN
      v_slug := v_base_slug;
    ELSE
      v_slug := v_base_slug || '-' || (v_max_num + 1);
    END IF;
  END IF;

  -- Insert template
  INSERT INTO templates (user_id, name, slug, fashion_code, armor_type, description, is_private)
  VALUES (p_user_id, p_name, v_slug, p_fashion_code, p_armor_type, nullif(trim(p_description), ''), p_is_private)
  RETURNING templates.id INTO v_template_id;

  -- Tags: ensure exist and link (get_or_create_tag_ids normalizes names internally)
  IF p_tag_names IS NOT NULL AND array_length(p_tag_names, 1) > 0 THEN
    INSERT INTO template_tags (template_id, tag_id)
    SELECT v_template_id, tag_row.id
    FROM get_or_create_tag_ids(p_tag_names) AS tag_row;
  END IF;

  id := v_template_id;
  slug := v_slug;
  RETURN NEXT;
END;
$$;
