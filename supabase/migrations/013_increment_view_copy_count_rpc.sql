-- View/Copy tracking: allow anonymous and authenticated users to increment counts.
-- RLS on templates only allows UPDATE for the owner; these SECURITY DEFINER functions
-- run with definer rights so the increment succeeds for everyone.

CREATE OR REPLACE FUNCTION public.increment_view_count(template_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE templates
  SET view_count = view_count + 1
  WHERE id = template_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_copy_count(template_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE templates
  SET copy_count = copy_count + 1
  WHERE id = template_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_view_count(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_view_count(UUID) TO authenticated;

GRANT EXECUTE ON FUNCTION public.increment_copy_count(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_copy_count(UUID) TO authenticated;
