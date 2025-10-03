# Push Notifications with NotificationAPI

This document describes the push notification implementation using NotificationAPI.

## Overview

The app uses **NotificationAPI** for web push notifications (Android, iOS PWA 16.4+, Desktop). The existing in-app notification panel remains as the source of truth/history, while push notifications provide real-time delivery.

## Architecture

```
┌─────────────────┐
│  Client Side    │
│  - Service      │
│  - Worker       │
│  - UI           │
└────────┬────────┘
         │
         ├─ Supabase Edge Function
         │  (notify)
         │
         └─ NotificationAPI
            (Push delivery)
```

### Components

1. **Client Library** (`src/lib/notifications/index.ts`)
   - `isPushSupported()` - Detects push support, handles iOS PWA requirements
   - `registerServiceWorker()` - Registers `/sw.js`
   - `ensurePermission()` - Requests permission (never auto-prompts!)
   - `subscribeUser()` - Registers device with NotificationAPI
   - `unsubscribeUser()` - Cleanup on logout
   - `sendTestPush()` - Testing helper

2. **Service Worker** (`public/sw.js`)
   - Handles `push` events from NotificationAPI
   - Displays notifications with title, body, icon, badge
   - `notificationclick` handler for navigation
   - Version: 1.0.0 (update for cache busting)

3. **Edge Function** (`supabase/functions/notify/index.ts`)
   - `GET /notify?action=get-config` - Returns VAPID key
   - `POST /notify` with `action=subscribe` - Registers user
   - `POST /notify` with `action=unsubscribe` - Unregisters user
   - `POST /notify` with `action=send` - Sends notification via NotificationAPI

4. **Database** (`notification_preferences` table)
   - Stores user preferences for push/email/SMS
   - Granular control: match, profile, message, system notifications
   - One row per user

5. **UI** (`src/pages/NotificationSettings.tsx`)
   - Settings page for managing notifications
   - iOS PWA detection and guidance
   - Enable/disable push with proper permission flow
   - Test notification button (dev mode)

## Setup Instructions

### 1. NotificationAPI Account

1. Sign up at https://www.notificationapi.com
2. Create a new project
3. Note your **Client ID** and **Secret Key**
4. Generate VAPID keys or use NotificationAPI's default

### 2. Environment Variables

Create/update these files:

**.env** (Server-side, for Edge Functions):
```bash
# NotificationAPI credentials
NOTIFICATION_API_CLIENT_ID=your_client_id_here
NOTIFICATION_API_SECRET=your_secret_key_here

# VAPID keys for Web Push
VAPID_PUBLIC_KEY=your_public_vapid_key
VAPID_PRIVATE_KEY=your_private_vapid_key # Optional if using NotificationAPI's
```

**.env.local** (Client-side, if needed):
```bash
# Currently no client-side config needed
# All auth happens server-side via Edge Functions
```

### 3. NotificationAPI Templates

Create these notification templates in your NotificationAPI dashboard:

#### Template: `match.new`
**Purpose**: New match notification
**Variables**:
- `{{matchName}}` - Name of the match
- `{{matchPhoto}}` - Match photo URL
- `{{url}}` - Deep link to match page

**Example Web Push**:
- Title: "New Match!"
- Body: "You matched with {{matchName}}"
- Icon: `{{matchPhoto}}`
- URL: `{{url}}`

#### Template: `profile.approved`
**Purpose**: Profile approval notification
**Variables**:
- `{{profileName}}` - User's name
- `{{url}}` - Deep link to dashboard

**Example Web Push**:
- Title: "Profile Approved!"
- Body: "Your profile has been approved. Start matching!"
- URL: `{{url}}`

#### Template: `profile.update`
**Purpose**: Profile update notification (admin)
**Variables**:
- `{{clientName}}` - Client name
- `{{url}}` - Deep link to profile

**Example Web Push**:
- Title: "Profile Updated"
- Body: "{{clientName}} updated their profile"
- URL: `{{url}}`

#### Template: `test.push`
**Purpose**: Testing notifications
**Variables**:
- `{{title}}` - Test title
- `{{message}}` - Test message
- `{{url}}` - Test URL

### 4. Database Migration

Run the migration:
```bash
npx supabase db push
```

This creates the `notification_preferences` table.

### 5. Deploy Edge Function

```bash
npx supabase functions deploy notify
```

Set environment variables:
```bash
npx supabase secrets set NOTIFICATION_API_CLIENT_ID=xxx
npx supabase secrets set NOTIFICATION_API_SECRET=xxx
npx supabase secrets set VAPID_PUBLIC_KEY=xxx
```

### 6. Add Service Worker Icons

Ensure these files exist in `/public`:
- `icon-192.png` - Notification icon (192x192)
- `badge-72.png` - Badge icon (72x72, monochrome)

## Usage

### Enabling Push Notifications

Users navigate to **Settings > Notifications** and click "Enable push notifications". The app will:

1. Check if push is supported (browser, iOS PWA status)
2. Request notification permission (only when clicked, never auto)
3. Register service worker
4. Subscribe to push with NotificationAPI
5. Save preferences to database

**Important**: Never auto-prompt for notifications on page load!

### Sending Notifications

When creating a notification in your code:

```typescript
// 1. Insert into notifications table (for in-app panel)
const { data: notification } = await supabase
  .from("notifications")
  .insert({
    user_id: userId,
    user_type: "client",
    notification_type: "match",
    title: "New Match!",
    description: `You matched with ${matchName}`,
    redirect_url: `/matches/${matchId}`,
    icon_type: "match",
    priority: "high"
  })
  .select()
  .single();

// 2. Send push notification via NotificationAPI
await supabase.functions.invoke("notify", {
  body: {
    action: "send",
    userId: userId,
    templateId: "match.new",
    payload: {
      matchName: matchName,
      matchPhoto: matchPhoto,
      url: `${origin}/matches/${matchId}`
    },
    channels: ["push"] // Can also include "email"
  }
});
```

### Automatic Push on Notification Insert

For automatic push when inserting notifications, create a database trigger:

```sql
CREATE OR REPLACE FUNCTION notify_via_push()
RETURNS TRIGGER AS $$
BEGIN
  -- Call Edge Function to send push
  PERFORM
    net.http_post(
      url := current_setting('app.supabase_functions_url') || '/notify',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object(
        'action', 'send',
        'userId', NEW.user_id,
        'templateId', get_template_id(NEW.notification_type),
        'payload', jsonb_build_object(
          'title', NEW.title,
          'message', NEW.description,
          'url', NEW.redirect_url
        ),
        'channels', ARRAY['push']
      )
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Platform Support

### ✅ Supported
- **Android Chrome**: Full support (installed PWA or browser)
- **Android Firefox**: Full support
- **Desktop Chrome/Edge**: Full support
- **Desktop Firefox**: Full support
- **iOS 16.4+ Safari (PWA)**: Requires "Add to Home Screen"

### ❌ Not Supported
- **iOS Safari (browser)**: Push not available in browser
- **iOS < 16.4**: No push support
- **Old browsers**: IE, old Chrome versions

### iOS Special Handling

The app detects iOS and checks for PWA installation. If not installed, it shows:
1. Instructions to tap Share button
2. "Add to Home Screen" guidance
3. Disables the enable button until installed

## Testing

### Manual Test
1. Navigate to **Settings > Notifications**
2. Enable push notifications
3. Click "Send Test Notification" (dev mode only)
4. Check that notification appears

### Platform Testing Checklist
- [ ] Android Chrome (browser)
- [ ] Android Chrome (PWA)
- [ ] Desktop Chrome
- [ ] Desktop Firefox
- [ ] iOS 16.4+ (PWA only)

### Debugging

**Service Worker**:
```javascript
// In browser console
navigator.serviceWorker.getRegistration().then(reg => console.log(reg));
```

**Push Subscription**:
```javascript
navigator.serviceWorker.ready.then(reg =>
  reg.pushManager.getSubscription().then(sub => console.log(sub))
);
```

**Check Logs**:
- Client: Browser DevTools Console
- Service Worker: Application > Service Workers > Console
- Edge Function: Supabase Dashboard > Edge Functions > Logs

## Troubleshooting

### "Push not supported"
- Check browser compatibility
- On iOS: Ensure app is installed as PWA
- Check `isPushSupported()` return value

### "Permission denied"
- User previously blocked notifications
- Must reset in browser settings
- Show guidance in UI

### "Subscription failed"
- Check VAPID keys are correct
- Verify Edge Function is deployed
- Check network tab for errors

### "Notifications not arriving"
- Verify user is subscribed: check `notification_preferences` table
- Check NotificationAPI dashboard for delivery status
- Test with `sendTestPush()`

## API Reference

### Client Library

```typescript
// Check if push is supported
const { supported, reason, requiresPWA } = isPushSupported();

// Subscribe to push
const result = await subscribeUser({
  userId: "user-uuid",
  channels: ["push"]
});

// Unsubscribe
await unsubscribeUser("user-uuid");

// Send test
await sendTestPush("user-uuid");

// Check status
const permission = getPermissionStatus(); // "granted" | "denied" | "default"
const subscribed = await isSubscribed(); // boolean
```

### Edge Function

```typescript
// Get VAPID config
POST /notify
{
  "action": "get-config"
}

// Subscribe user
POST /notify
{
  "action": "subscribe",
  "userId": "user-uuid",
  "subscription": {...}, // PushSubscription JSON
  "channels": ["push"]
}

// Send notification
POST /notify
{
  "action": "send",
  "userId": "user-uuid",
  "templateId": "match.new",
  "payload": {
    "matchName": "Jane",
    "url": "/matches/123"
  },
  "channels": ["push", "email"]
}
```

## Security Notes

- **Server keys never exposed**: NotificationAPI secret only in Edge Function
- **VAPID private key**: Server-side only
- **User validation**: Edge Function validates Supabase JWT
- **RLS policies**: Users can only manage their own preferences

## Future Enhancements

- [ ] Email notifications (NotificationAPI supports this)
- [ ] SMS notifications
- [ ] Notification scheduling
- [ ] Delivery analytics
- [ ] A/B testing notification copy
- [ ] Rich notifications with images
- [ ] Action buttons in notifications

## Resources

- [NotificationAPI Docs](https://www.notificationapi.com/docs)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [iOS Web Push](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
