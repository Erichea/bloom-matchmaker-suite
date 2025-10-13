-- Show the ACTUAL function in your database
SELECT prosrc
FROM pg_proc
WHERE proname = 'send_push_notification';
