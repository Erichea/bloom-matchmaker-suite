-- Set app origin configuration for push notifications
-- This is used by notification triggers to construct full URLs

-- IMPORTANT: Update this to your production domain after deploying
-- For now using a placeholder that works for testing
-- You'll need to run this SQL manually after deployment:
-- ALTER DATABASE postgres SET app.origin = 'https://your-production-domain.com';

-- Comment about the configuration system:
-- The triggers will try to use current_setting('app.origin') and fall back to localhost
-- This allows development to work without configuration
