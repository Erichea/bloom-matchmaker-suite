# Push Notification System - Current Status

## Context
We implemented and debugged a push notification system for a matchmaking PWA using NotificationAPI and Supabase. The system sends notifications for 4 types of events: new_match, mutual_match, profile_approval, and profile_update.

## Architecture

### Backend (Supabase)
- **Database Triggers**: Automatically fire on match/profile events
- **Database Function**: `send_push_notification(user_id, template_id, merge_tags)`
  - Uses `pg_net.http_post()` to call edge functions
  - Retrieves service role key from `private.config` table
  - Sends requests with proper Authorization header
- **Edge Functions**: 4 NotificationAPI edge functions deployed
  - `notificationapi-new_match`
  - `notificationapi-mutual_match`
  - `notificationapi-profile_approval`
  - `notificationapi-profile_update`
  - Each calls NotificationAPI SDK with proper userId (Supabase UUID) and mergeTags

### Frontend (React)
- **NotificationProvider**: Wraps app with NotificationAPI SDK
  - Initializes with `userId={user.id}` (Supabase UUID)
  - Includes `TokenSyncHelper` component
- **TokenSyncHelper**: Automatically re-syncs push tokens on app load
  - Retries at 1s, 3s, and 5s after mount
  - Calls `notificationAPI.setWebPushOptIn(true)` to refresh tokens
  - Only runs if user has `push_enabled: true` in DB and browser permission granted
- **NotificationSettings Page**: UI for enabling/disabling notifications
  - Toggle reflects DB preference (`push_enabled` field)
  - Calls `setWebPushOptIn(true)` when user enables
  - Updates DB preference on enable/disable

## What Works ✅

1. **Database → Edge Function Communication**:
   - `send_push_notification()` successfully calls edge functions with correct auth headers
   - Status 200 responses from edge functions
   - All 4 notification types trigger correctly

2. **Edge Function → NotificationAPI**:
   - Edge functions successfully call NotificationAPI SDK
   - Test notifications work (when sent manually)
   - Logging shows "Notification sent successfully"

3. **UI State Management**:
   - Toggle correctly shows DB preference
   - No flicker when enabling/disabling
   - State persists across page reloads

## Current Issue ⚠️

**Web Push Tokens Not Persisting**

**Symptom**:
- First notification after enabling works
- Subsequent notifications fail with: `"WEB_PUSH delivery is activated, but the user's webPushTokens is not provided"`
- Notifications work again after visiting Settings page (without toggling)

**Why Visiting Settings Works**:
- NotificationSettings page has its own `setWebPushOptIn(true)` call in useEffect
- This re-registers tokens, making next notification work
- But if user doesn't visit Settings, tokens remain lost

**Current Token Sync Strategy**:
- `TokenSyncHelper` runs on app load
- Calls `setWebPushOptIn(true)` at 1s, 3s, 5s after mount
- Should re-register tokens with NotificationAPI
- BUT: Still requires visiting Settings page for reliable delivery

**Hypothesis**:
The NotificationAPI SDK's `setWebPushOptIn(true)` call in `TokenSyncHelper` might not be:
1. Actually registering tokens (vs just setting a flag)
2. Completing before user navigates away
3. Persisting tokens on NotificationAPI's backend
4. Being called at the right time in the component lifecycle

## Debug Information

### Key Files
- `src/components/NotificationProvider.tsx` - Token sync logic
- `src/pages/NotificationSettings.tsx` - User settings UI
- `supabase/functions/notificationapi-*/index.ts` - Edge functions
- `supabase/migrations/*push*.sql` - Database setup

### Database Config
- Service role key stored in: `private.config` table with key='service_role_key'
- Notification preferences in: `notification_preferences` table
- User preference field: `push_enabled` (boolean)

### Console Logs to Check
**On app load, should see**:
```
[TokenSyncHelper] User has push enabled, syncing tokens...
[TokenSyncHelper] Browser permission: granted
[TokenSyncHelper] DB push_enabled: true
[TokenSyncHelper] Calling setWebPushOptIn(true)...
[TokenSyncHelper] ✅ Push tokens synced successfully
```

**On notification send, check edge function logs**:
- Success: `"Notification sent successfully to user: <uuid>"`
- Failure: `"WEB_PUSH delivery is activated, but the user's webPushTokens is not provided"`

### Test Commands
```bash
# Test notification from SQL
SELECT send_push_notification(
  '<user-uuid>'::uuid,
  'new_match',
  jsonb_build_object(
    'userId', '<user-uuid>',
    'matchName', 'Test User',
    'icon', 'https://bloom-matchmaker-suite.lovable.app/icon-192.png',
    'url', 'https://bloom-matchmaker-suite.lovable.app/client/dashboard'
  )
);

# Check pg_net responses
SELECT id, status_code, content FROM net._http_response ORDER BY id DESC LIMIT 5;
```

## Next Steps to Investigate

1. **Verify Token Sync is Actually Running**:
   - Check browser console on app load
   - Confirm all 3 sync attempts execute
   - Check for any errors

2. **Inspect NotificationAPI SDK Behavior**:
   - Check if `setWebPushOptIn(true)` actually registers tokens vs setting a preference
   - Look at NotificationAPI's debug logs (SDK has `debug: true`)
   - Check Network tab for requests to NotificationAPI's API

3. **Alternative Approaches to Consider**:
   - Manually manage push subscriptions using browser PushManager API
   - Store subscription endpoint in Supabase and send to NotificationAPI on each notification
   - Use NotificationAPI's REST API directly instead of SDK
   - Check if NotificationAPI has token expiration settings

4. **Verify Service Worker**:
   - Check if `/notificationapi-service-worker.js` is registered and active
   - Verify push subscription exists: `navigator.serviceWorker.getRegistration().then(r => r.pushManager.getSubscription())`
   - Check if subscription changes between app sessions

## Recent Commits
- `114fc70` - Retry token sync 3 times on app load
- `dfa514a` - Fix toggle to reflect DB preference
- `e419904` - Add auto-sync on app load
- `46d079b` - Remove auto-refresh causing UI flicker
- `76978f7` - Keep tokens registered when disabling
- `22b9cff` - Fix pg_net auth header format

## Questions for NotificationAPI Support

If issue persists, ask NotificationAPI:
1. Do webPushTokens expire? If so, what's the TTL?
2. Should `setWebPushOptIn(true)` be called on every app load?
3. Is there a way to verify if tokens are registered on their backend?
4. Does the SDK handle token refresh automatically, or do we need to?
5. Are there any known issues with tokens being lost after app close/reopen?
