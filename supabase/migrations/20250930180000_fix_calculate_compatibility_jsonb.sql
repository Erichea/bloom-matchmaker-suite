-- Fix calculate_compatibility_score to handle jsonb answer column
CREATE OR REPLACE FUNCTION public.calculate_compatibility_score(
  p_profile_1_id UUID,
  p_profile_2_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_shared_interests INTEGER := 0;
  v_location_score INTEGER := 0;
  v_age_preference_score INTEGER := 0;
  v_total_score INTEGER := 0;
  v_profile_1 RECORD;
  v_profile_2 RECORD;
  v_profile_1_interests TEXT[];
  v_profile_2_interests TEXT[];
BEGIN
  -- Get profile data
  SELECT * INTO v_profile_1 FROM profiles WHERE id = p_profile_1_id;
  SELECT * INTO v_profile_2 FROM profiles WHERE id = p_profile_2_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Get interests from profile_answers (convert jsonb array to text array)
  SELECT COALESCE(
    ARRAY(SELECT jsonb_array_elements_text(answer)),
    ARRAY[]::text[]
  ) INTO v_profile_1_interests
  FROM profile_answers
  WHERE user_id = v_profile_1.user_id AND question_id = 'interests';

  SELECT COALESCE(
    ARRAY(SELECT jsonb_array_elements_text(answer)),
    ARRAY[]::text[]
  ) INTO v_profile_2_interests
  FROM profile_answers
  WHERE user_id = v_profile_2.user_id AND question_id = 'interests';

  -- Calculate shared interests score (40% weight)
  IF array_length(v_profile_1_interests, 1) > 0 AND array_length(v_profile_2_interests, 1) > 0 THEN
    v_shared_interests := (
      SELECT COUNT(*)::INTEGER
      FROM unnest(v_profile_1_interests) AS interest1
      WHERE interest1 = ANY(v_profile_2_interests)
    );
    v_shared_interests := LEAST(40, (v_shared_interests * 40 / GREATEST(array_length(v_profile_1_interests, 1), 1)));
  END IF;

  -- Calculate location proximity score (30% weight)
  IF v_profile_1.city IS NOT NULL AND v_profile_2.city IS NOT NULL THEN
    IF LOWER(v_profile_1.city) = LOWER(v_profile_2.city) THEN
      v_location_score := 30;
    ELSIF LOWER(v_profile_1.country) = LOWER(v_profile_2.country) THEN
      v_location_score := 15;
    END IF;
  END IF;

  -- Calculate age preference match score (30% weight)
  IF v_profile_1.date_of_birth IS NOT NULL AND v_profile_2.date_of_birth IS NOT NULL THEN
    DECLARE
      v_age_1 INTEGER := EXTRACT(YEAR FROM age(v_profile_1.date_of_birth));
      v_age_2 INTEGER := EXTRACT(YEAR FROM age(v_profile_2.date_of_birth));
    BEGIN
      -- Check if ages fall within preferred ranges
      IF (v_profile_1.preferred_min_age IS NULL OR v_age_2 >= v_profile_1.preferred_min_age) AND
         (v_profile_1.preferred_max_age IS NULL OR v_age_2 <= v_profile_1.preferred_max_age) AND
         (v_profile_2.preferred_min_age IS NULL OR v_age_1 >= v_profile_2.preferred_min_age) AND
         (v_profile_2.preferred_max_age IS NULL OR v_age_1 <= v_profile_2.preferred_max_age) THEN
        v_age_preference_score := 30;
      ELSIF (v_profile_1.preferred_min_age IS NULL OR v_age_2 >= v_profile_1.preferred_min_age - 2) AND
            (v_profile_1.preferred_max_age IS NULL OR v_age_2 <= v_profile_1.preferred_max_age + 2) THEN
        v_age_preference_score := 15;
      END IF;
    END;
  END IF;

  v_total_score := v_shared_interests + v_location_score + v_age_preference_score;

  RETURN LEAST(100, v_total_score);
END;
$$;