-- Helper function to debug completion calculation for a user
-- Usage: SELECT * FROM debug_questionnaire_completion('user-id-here');

CREATE OR REPLACE FUNCTION debug_questionnaire_completion(p_user_id UUID)
RETURNS TABLE(
  question_id TEXT,
  answer JSONB,
  has_answer BOOLEAN,
  answer_length INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pa.question_id,
    pa.answer,
    (pa.answer IS NOT NULL AND pa.answer::text != '' AND pa.answer::text != '""' AND pa.answer::text != '[]') as has_answer,
    CASE
      WHEN pa.answer IS NULL THEN 0
      WHEN jsonb_typeof(pa.answer) = 'array' THEN jsonb_array_length(pa.answer)
      WHEN jsonb_typeof(pa.answer) = 'string' THEN length(pa.answer::text)
      ELSE 1
    END as answer_length
  FROM profile_answers pa
  WHERE pa.user_id = p_user_id
  ORDER BY pa.question_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;