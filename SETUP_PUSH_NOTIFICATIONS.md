# Push Notifications Setup - Final Step

The database migrations have been applied, but you need to configure the service role key for push notifications to work.

## Step 1: Get your Service Role Key

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/loeaypczgpbgruzwkgjh
2. Click on **Settings** (gear icon) in the left sidebar
3. Click on **API**
4. Copy the **service_role** key (NOT the anon key!)
   - It's labeled as "service_role" and marked as "secret"
   - This is a JWT token that starts with `eyJ...`

## Step 2: Set the Service Role Key in Database

1. In your Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Paste this SQL (replace `YOUR_SERVICE_ROLE_KEY` with the actual key from Step 1):

```sql
SELECT private.set_service_key('YOUR_SERVICE_ROLE_KEY_HERE');
```

4. Click **Run** or press `Cmd/Ctrl + Enter`

You should see a success message.

## Step 3: Test Push Notifications

Now when you create a match from the admin panel, it will automatically:
1. Create the match in the database
2. Insert an in-app notification
3. Send a push notification to both users

### To test:
1. Make sure a user has subscribed to push notifications (Settings → Notifications → Enable)
2. Create a match for that user from Admin → Clients → [Select User] → Suggest Matches
3. The user should receive a push notification immediately

### Debugging:
- Check the browser console for any errors
- Check Supabase → Edge Functions → notify → Logs
- Check that the user has push enabled in notification_preferences table

## Note
You only need to do this setup **once**. The service role key will be stored securely in the database and used for all future push notifications.
