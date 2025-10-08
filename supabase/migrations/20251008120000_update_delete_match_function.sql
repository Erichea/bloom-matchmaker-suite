-- Update delete_match function to also handle match_interactions
CREATE OR REPLACE FUNCTION delete_match(p_match_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count integer := 0;
  v_notifications_deleted integer := 0;
  v_interactions_deleted integer := 0;
BEGIN
  -- Check if match exists
  IF NOT EXISTS (SELECT 1 FROM matches WHERE id = p_match_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Match not found'
    );
  END IF;

  -- Delete related match interactions first
  DELETE FROM match_interactions
  WHERE match_id = p_match_id;
  
  GET DIAGNOSTICS v_interactions_deleted = ROW_COUNT;

  -- Delete related notifications
  DELETE FROM notifications
  WHERE related_entity_id = p_match_id
    AND related_entity_type = 'match';

  GET DIAGNOSTICS v_notifications_deleted = ROW_COUNT;

  -- Delete the match
  DELETE FROM matches WHERE id = p_match_id;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  IF v_deleted_count > 0 THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Match deleted successfully',
      'notifications_deleted', v_notifications_deleted,
      'interactions_deleted', v_interactions_deleted
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Failed to delete match'
    );
  END IF;
END;
$$;

-- Grant execute permission to authenticated users with admin role
GRANT EXECUTE ON FUNCTION delete_match(uuid) TO authenticated;

-- Add comment
COMMENT ON FUNCTION delete_match IS 'Deletes a match and all related notifications and interactions. Admin only.';