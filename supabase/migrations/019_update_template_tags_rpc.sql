-- Single RPC to update template tags: resolve names, delete old links, insert new links.
-- One roundtrip, one transaction. Callable only by template owner (SECURITY INVOKER + ownership check).

CREATE OR REPLACE FUNCTION public.update_template_tags(
  p_template_id uuid,
  p_tag_names text[] DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT user_id INTO v_owner
  FROM public.templates
  WHERE id = p_template_id;

  IF v_owner IS NULL OR v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  DELETE FROM public.template_tags
  WHERE template_id = p_template_id;

  IF p_tag_names IS NOT NULL AND array_length(p_tag_names, 1) > 0 THEN
    INSERT INTO public.template_tags (template_id, tag_id)
    SELECT p_template_id, tg.id
    FROM public.get_or_create_tag_ids(p_tag_names) AS tg;
  END IF;
END;
$$;
