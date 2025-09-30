-- Create ENUM for match status
CREATE TYPE match_status AS ENUM (
  'pending',
  'profile_1_accepted',
  'profile_1_rejected', 
  'profile_2_accepted',
  'profile_2_rejected',
  'both_accepted',
  'rejected'
);

-- Update matches table with new columns
ALTER TABLE public.matches 
ADD COLUMN match_status match_status DEFAULT 'pending',
ADD COLUMN profile_1_feedback TEXT,
ADD COLUMN profile_2_feedback TEXT,
ADD COLUMN suggested_by UUID REFERENCES auth.users(id),
ADD COLUMN suggested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN viewed_by_profile_1 BOOLEAN DEFAULT false,
ADD COLUMN viewed_by_profile_2 BOOLEAN DEFAULT false;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_matches_match_status ON public.matches(match_status);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_suggested_by ON public.matches(suggested_by);

-- Create RPC function to respond to matches
CREATE OR REPLACE FUNCTION public.respond_to_match(
  p_match_id UUID,
  p_user_id UUID, 
  p_response TEXT,
  p_feedback TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match RECORD;
  v_profile_id UUID;
  v_is_profile_1 BOOLEAN;
  v_other_response TEXT;
  v_new_match_status match_status;
BEGIN
  -- Get the match and determine which profile the user belongs to
  SELECT m.*, p1.user_id as profile_1_user_id, p2.user_id as profile_2_user_id
  INTO v_match
  FROM matches m
  JOIN profiles p1 ON m.profile_1_id = p1.id
  JOIN profiles p2 ON m.profile_2_id = p2.id
  WHERE m.id = p_match_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Match not found'
    );
  END IF;

  -- Determine if user is profile_1 or profile_2
  IF v_match.profile_1_user_id = p_user_id THEN
    v_is_profile_1 := true;
    v_profile_id := v_match.profile_1_id;
    v_other_response := v_match.profile_2_response;
  ELSIF v_match.profile_2_user_id = p_user_id THEN
    v_is_profile_1 := false;
    v_profile_id := v_match.profile_2_id;
    v_other_response := v_match.profile_1_response;
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User is not part of this match'
    );
  END IF;

  -- Update the appropriate response field and determine new match status
  IF v_is_profile_1 THEN
    -- Update profile_1's response
    UPDATE matches 
    SET 
      profile_1_response = p_response,
      profile_1_feedback = CASE WHEN p_response = 'rejected' THEN p_feedback ELSE profile_1_feedback END,
      match_status = CASE 
        WHEN p_response = 'accepted' AND v_other_response = 'accepted' THEN 'both_accepted'::match_status
        WHEN p_response = 'accepted' AND (v_other_response IS NULL OR v_other_response != 'accepted') THEN 'profile_1_accepted'::match_status
        WHEN p_response = 'rejected' THEN 'profile_1_rejected'::match_status
        ELSE match_status
      END,
      updated_at = now()
    WHERE id = p_match_id;
  ELSE
    -- Update profile_2's response
    UPDATE matches 
    SET 
      profile_2_response = p_response,
      profile_2_feedback = CASE WHEN p_response = 'rejected' THEN p_feedback ELSE profile_2_feedback END,
      match_status = CASE 
        WHEN p_response = 'accepted' AND v_other_response = 'accepted' THEN 'both_accepted'::match_status
        WHEN p_response = 'accepted' AND (v_other_response IS NULL OR v_other_response != 'accepted') THEN 'profile_2_accepted'::match_status
        WHEN p_response = 'rejected' THEN 'profile_2_rejected'::match_status
        ELSE match_status
      END,
      updated_at = now()
    WHERE id = p_match_id;
  END IF;

  -- Get updated match status
  SELECT match_status INTO v_new_match_status FROM matches WHERE id = p_match_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Response recorded successfully',
    'match_status', v_new_match_status,
    'is_mutual_match', v_new_match_status = 'both_accepted'
  );
END;
$$;

-- Add RLS policies for new columns
CREATE POLICY "Users can view match details for their matches" ON public.matches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE ((profiles.id = matches.profile_1_id) OR (profiles.id = matches.profile_2_id)) 
      AND profiles.user_id = auth.uid()
    )
  );

-- Create function to calculate compatibility score
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

  -- Get interests from profile_answers
  SELECT COALESCE(answer::text[], ARRAY[]::text[]) INTO v_profile_1_interests
  FROM profile_answers 
  WHERE user_id = v_profile_1.user_id AND question_id = 'interests';

  SELECT COALESCE(answer::text[], ARRAY[]::text[]) INTO v_profile_2_interests
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