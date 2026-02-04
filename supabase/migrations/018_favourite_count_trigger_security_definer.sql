-- Favourite count triggers: run with definer rights so UPDATE templates succeeds
-- for any user (RLS on templates only allows UPDATE for the owner otherwise).

CREATE OR REPLACE FUNCTION public.template_favourites_increment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE templates
  SET favourite_count = favourite_count + 1
  WHERE id = NEW.template_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.template_favourites_decrement_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE templates
  SET favourite_count = GREATEST(0, favourite_count - 1)
  WHERE id = OLD.template_id;
  RETURN OLD;
END;
$$;
