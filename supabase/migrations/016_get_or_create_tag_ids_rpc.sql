-- 1) Drop the old function (signature must match exactly)
DROP FUNCTION IF EXISTS public.get_or_create_tag_ids(text[]);

-- 2) Recreate with the non-ambiguous return column name
CREATE FUNCTION public.get_or_create_tag_ids(tag_names text[])
RETURNS TABLE(id uuid, tag_name text)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.tags (name)
  SELECT DISTINCT lower(trim(n))
  FROM unnest(tag_names) AS n
  WHERE n IS NOT NULL AND trim(n) <> ''
  ON CONFLICT (name) DO NOTHING;

  RETURN QUERY
  SELECT t.id, t.name AS tag_name
  FROM public.tags AS t
  WHERE t.name IN (
    SELECT DISTINCT lower(trim(n))
    FROM unnest(tag_names) AS n
    WHERE n IS NOT NULL AND trim(n) <> ''
  );
END;
$$;
