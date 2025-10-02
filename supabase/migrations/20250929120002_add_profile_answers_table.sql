-- Create profile_answers table
CREATE TABLE IF NOT EXISTS profile_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    answer JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, question_id)
);

-- Add RLS policies
ALTER TABLE profile_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own answers"
    ON profile_answers
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own answers"
    ON profile_answers
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own answers"
    ON profile_answers
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON profile_answers
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();