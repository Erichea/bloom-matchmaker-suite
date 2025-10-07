// Test script to verify NotificationAPI edge function and database triggers
// Run with: node test_notification.js

const SUPABASE_URL = 'https://loeaypczgpbgruzwkgjh.supabase.co';
const SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY_HERE'; // ⚠️ REPLACE THIS

console.log('='.repeat(60));
console.log('Testing NotificationAPI Edge Function');
console.log('='.repeat(60));

const testEdgeFunction = async () => {
  console.log('\n1️⃣  Testing direct edge function call...\n');

  const payload = {
    userId: 'hello.eric@outlook.fr',
    matchName: 'Test Match',
    icon: 'https://bloom-matchmaker-suite.lovable.app/icon-192.png',
    url: 'https://bloom-matchmaker-suite.lovable.app/client/dashboard'
  };

  console.log('📤 Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/notificationapi-new_match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify(payload)
    });

    console.log(`\n📥 Response: ${response.status} ${response.statusText}`);

    const result = await response.json();
    console.log('📄 Body:', JSON.stringify(result, null, 2));

    if (response.ok && result.success) {
      console.log('\n✅ Edge function is working!');
      console.log('   Check NotificationAPI dashboard to verify notification was sent.');
      return true;
    } else {
      console.log('\n❌ Edge function failed!');
      console.log('   Check edge function logs in Supabase Dashboard → Edge Functions');
      return false;
    }
  } catch (error) {
    console.error('\n❌ Request failed:', error.message);
    console.log('\n🔍 Troubleshooting:');
    console.log('   1. Update SERVICE_ROLE_KEY in this file');
    console.log('   2. Verify edge function is deployed: supabase functions list');
    console.log('   3. Check edge function logs in Supabase Dashboard');
    return false;
  }
};

const checkDatabaseSetup = async () => {
  console.log('\n2️⃣  Checking database setup...\n');

  console.log('Run these SQL queries in Supabase SQL Editor:\n');

  console.log('-- Check if pg_net extension is enabled:');
  console.log("SELECT * FROM pg_extension WHERE extname = 'pg_net';\n");

  console.log('-- Check if service key is configured:');
  console.log("SELECT key FROM private.config WHERE key = 'service_role_key';\n");

  console.log('-- Check if triggers exist:');
  console.log("SELECT trigger_name, event_manipulation, event_object_table");
  console.log("FROM information_schema.triggers");
  console.log("WHERE trigger_name IN ('trigger_notify_new_match', 'trigger_notify_mutual_match');\n");

  console.log('-- Test notification function directly:');
  console.log("-- (Replace with actual user_id from your profiles table)");
  console.log("SELECT test_new_match_notification('00000000-0000-0000-0000-000000000000'::uuid, 'Test');");
};

// Run tests
(async () => {
  const edgeFunctionWorks = await testEdgeFunction();

  if (edgeFunctionWorks) {
    console.log('\n' + '='.repeat(60));
    console.log('Next Steps:');
    console.log('='.repeat(60));
    checkDatabaseSetup();
    console.log('\n📝 If triggers still not working after database checks:');
    console.log('   - Check database logs: Dashboard → Database → Logs');
    console.log('   - Look for RAISE LOG/WARNING messages from triggers');
    console.log('   - Verify service key is set: SELECT private.set_service_key(\'YOUR_KEY\');');
  }
})().catch(console.error);