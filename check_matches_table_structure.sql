-- Check the matches table structure to see if it has deleted_at or any other fields we're missing
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'matches'
ORDER BY ordinal_position;

-- Check if our specific match has any unexpected values
SELECT *
FROM matches
WHERE id = 'e2985566-1d3d-49a6-82fb-6ef01315246c';
