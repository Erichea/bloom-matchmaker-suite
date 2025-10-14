-- Create table for personal match status tracking
-- This allows each user to privately track their personal perception of where each match stands
-- No synchronization between users - purely for personal organization

CREATE TABLE IF NOT EXISTS match_status_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('to_discuss', 'chatting', 'date_planned', 'dating', 'ended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one status entry per user per match
  UNIQUE(user_id, match_id)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_match_status_tracking_user_id ON match_status_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_match_status_tracking_match_id ON match_status_tracking(match_id);
CREATE INDEX IF NOT EXISTS idx_match_status_tracking_status ON match_status_tracking(status);

-- Enable RLS
ALTER TABLE match_status_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - users can only manage their own match status tracking
CREATE POLICY "Users can manage their own match status tracking" ON match_status_tracking
  FOR ALL USING (auth.uid() = user_id);

-- Function to automatically create default status for new mutual matches
CREATE OR REPLACE FUNCTION create_default_match_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create default status for mutual matches (both_accepted)
  IF NEW.match_status = 'both_accepted' THEN
    -- Insert default 'to_discuss' status for both users
    INSERT INTO match_status_tracking (user_id, match_id, status)
    SELECT
      profile_1.user_id,
      NEW.id,
      'to_discuss'
    FROM profiles profile_1
    WHERE profile_1.id = NEW.profile_1_id
    ON CONFLICT (user_id, match_id) DO NOTHING;

    INSERT INTO match_status_tracking (user_id, match_id, status)
    SELECT
      profile_2.user_id,
      NEW.id,
      'to_discuss'
    FROM profiles profile_2
    WHERE profile_2.id = NEW.profile_2_id
    ON CONFLICT (user_id, match_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically assign default status to new mutual matches
DROP TRIGGER IF EXISTS on_match_create_default_status ON matches;
CREATE TRIGGER on_match_create_default_status
  AFTER INSERT OR UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION create_default_match_status();

-- Helper function to get matches with their personal status
CREATE OR REPLACE FUNCTION get_matches_with_personal_status(
  p_user_id UUID
)
RETURNS TABLE (
  match_id UUID,
  match_data JSONB,
  personal_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    to_jsonb(m) - 'profile_1' - 'profile_2' ||
    jsonb_build_object(
      'profile_1', row_to_json(m.profile_1),
      'profile_2', row_to_json(m.profile_2)
    ) as match_data,
    COALESCE(mst.status, 'to_discuss') as personal_status
  FROM matches m
  JOIN profiles p1 ON m.profile_1_id = p1.id
  JOIN profiles p2 ON m.profile_2_id = p2.id
  LEFT JOIN match_status_tracking mst ON m.id = mst.match_id AND mst.user_id = p_user_id
  WHERE
    m.match_status = 'both_accepted'
    AND (p1.user_id = p_user_id OR p2.user_id = p_user_id)
    AND p1.deleted_at IS NULL
    AND p2.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;