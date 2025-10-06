CREATE OR REPLACE FUNCTION create_match_from_suggestion(
    p_profile_id UUID,
    p_match_profile_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_match_id UUID;
    v_profile_1_id UUID;
    v_profile_2_id UUID;
    v_compatibility_score NUMERIC;
    v_existing_match_count INT;
BEGIN
    -- Ensure the profiles exist and are not deleted
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_profile_id AND deleted_at IS NULL) THEN
        RETURN json_build_object('success', FALSE, 'message', 'Client profile not found or is deleted.');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_match_profile_id AND deleted_at IS NULL) THEN
        RETURN json_build_object('success', FALSE, 'message', 'Match profile not found or is deleted.');
    END IF;

    -- Determine profile_1_id and profile_2_id to maintain consistent ordering
    IF p_profile_id < p_match_profile_id THEN
        v_profile_1_id := p_profile_id;
        v_profile_2_id := p_match_profile_id;
    ELSE
        v_profile_1_id := p_match_profile_id;
        v_profile_2_id := p_profile_id;
    END IF;

    -- Check if a match already exists between these two profiles
    SELECT COUNT(*)
    INTO v_existing_match_count
    FROM matches
    WHERE (profile_1_id = v_profile_1_id AND profile_2_id = v_profile_2_id)
       OR (profile_1_id = v_profile_2_id AND profile_2_id = v_profile_1_id);

    IF v_existing_match_count > 0 THEN
        RETURN json_build_object('success', FALSE, 'message', 'A match already exists between these two profiles.');
    END IF;

    -- Calculate compatibility score (this is a placeholder, replace with actual logic if needed)
    -- For now, we'll set it to a default or calculate a basic one.
    -- In a real scenario, you'd call a more complex compatibility function here.
    v_compatibility_score := 75; -- Example default score

    -- Insert the new match
    INSERT INTO matches (profile_1_id, profile_2_id, compatibility_score, match_status, suggested_at)
    VALUES (v_profile_1_id, v_profile_2_id, v_compatibility_score, 'pending', NOW())
    RETURNING id INTO v_match_id;



    RETURN json_build_object('success', TRUE, 'match_id', v_match_id, 'message', 'Match created successfully.');

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', FALSE, 'message', SQLERRM);
END;
$$;

-- Grant usage to authenticated role
GRANT EXECUTE ON FUNCTION create_match_from_suggestion(UUID, UUID) TO authenticated;