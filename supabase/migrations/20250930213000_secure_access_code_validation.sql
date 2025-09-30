-- Ensure public users cannot freely select from access_codes
DROP POLICY IF EXISTS "Allow access code validation" ON public.access_codes;

-- Security definer function to validate an access code without exposing event details
CREATE OR REPLACE FUNCTION public.validate_access_code(p_code text)
RETURNS TABLE (
  id uuid,
  is_used boolean,
  expires_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    access_codes.id,
    access_codes.is_used,
    access_codes.expires_at
  FROM public.access_codes
  WHERE access_codes.code = upper(trim(p_code))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.validate_access_code(text) TO anon;
