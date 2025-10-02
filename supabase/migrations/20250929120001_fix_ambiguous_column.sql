-- Fix ambiguous column reference in calculate_profile_completion function
DROP FUNCTION IF EXISTS public.calculate_profile_completion(UUID);
CREATE FUNCTION public.calculate_profile_completion(input_profile_id UUID)
RETURNS INTEGER AS $$
DECLARE
  completion_score INTEGER := 0;
  total_fields INTEGER := 20;
  profile_record public.profiles%ROWTYPE;
  photo_count INTEGER;
BEGIN
  SELECT * INTO profile_record FROM public.profiles WHERE id = input_profile_id;

  -- Check required fields (1 point each)
  IF profile_record.first_name IS NOT NULL THEN completion_score := completion_score + 1; END IF;
  IF profile_record.last_name IS NOT NULL THEN completion_score := completion_score + 1; END IF;
  IF profile_record.email IS NOT NULL THEN completion_score := completion_score + 1; END IF;
  IF profile_record.date_of_birth IS NOT NULL THEN completion_score := completion_score + 1; END IF;
  IF profile_record.gender IS NOT NULL THEN completion_score := completion_score + 1; END IF;
  IF profile_record.country IS NOT NULL THEN completion_score := completion_score + 1; END IF;
  IF profile_record.city IS NOT NULL THEN completion_score := completion_score + 1; END IF;
  IF profile_record.profession IS NOT NULL THEN completion_score := completion_score + 1; END IF;
  IF profile_record.education IS NOT NULL THEN completion_score := completion_score + 1; END IF;
  IF profile_record.relationship_status IS NOT NULL THEN completion_score := completion_score + 1; END IF;
  IF profile_record.about_me IS NOT NULL THEN completion_score := completion_score + 1; END IF;
  IF profile_record.preferred_gender IS NOT NULL THEN completion_score := completion_score + 1; END IF;
  IF profile_record.preferred_min_age IS NOT NULL THEN completion_score := completion_score + 1; END IF;
  IF profile_record.preferred_max_age IS NOT NULL THEN completion_score := completion_score + 1; END IF;
  IF profile_record.height_cm IS NOT NULL THEN completion_score := completion_score + 1; END IF;
  IF profile_record.nationality IS NOT NULL THEN completion_score := completion_score + 1; END IF;
  IF profile_record.faith IS NOT NULL THEN completion_score := completion_score + 1; END IF;
  IF profile_record.income_level IS NOT NULL THEN completion_score := completion_score + 1; END IF;
  IF profile_record.wants_more_children IS NOT NULL THEN completion_score := completion_score + 1; END IF;

  -- Check for photos (minimum 1 required) - fixed ambiguous column reference
  SELECT COUNT(*) INTO photo_count FROM public.profile_photos WHERE profile_photos.profile_id = input_profile_id;
  IF photo_count > 0 THEN completion_score := completion_score + 1; END IF;

  RETURN (completion_score * 100 / total_fields);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;