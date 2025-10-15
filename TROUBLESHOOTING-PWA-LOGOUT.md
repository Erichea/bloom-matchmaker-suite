# PWA Logout Persistence Issue - Troubleshooting Guide

## Problem Statement
Users log out of the PWA app successfully, but when they close and reopen the app, they are automatically logged back in. The session persists across app restarts despite implementing various logout cleanup mechanisms.

## Current Implementation Status

### ✅ What's Already Implemented:

1. **Logout Page Enhancement** (`src/pages/LogoutPage.tsx`):
   - Double logout (auth context + direct Supabase call)
   - Service worker cache clearing
   - IndexedDB database deletion
   - 300ms delay for complete cleanup

2. **Auth Context Enhancement** (`src/hooks/useAuth.tsx`):
   - Complete localStorage cleanup for Supabase auth keys
   - sessionStorage cleanup
   - App-specific cache clearing
   - Logout state persistence mechanism
   - Auth initialization checks for logout flag

3. **Supabase Configuration** (`src/integrations/supabase/client.ts`):
   ```typescript
   auth: {
     storage: localStorage,
     persistSession: true,
     autoRefreshToken: true,
   }
   ```

4. **Logout State Persistence**:
   - Sets `bloom_user_logged_out = true` in both localStorage and sessionStorage
   - Auth initialization checks for this flag before session restoration
   - Automatically clears flag on successful login

### 🔍 Current Issue:
Despite all cleanup mechanisms, Supabase client library is still restoring sessions from localStorage when the PWA restarts. The logout flag mechanism may not be working as expected.

## Files to Investigate

### Primary Files:
- `src/hooks/useAuth.tsx` - Auth context with logout logic
- `src/pages/LogoutPage.tsx` - Logout page implementation
- `src/integrations/supabase/client.ts` - Supabase client configuration

### Related Files:
- `src/App.tsx` - Route configuration
- `src/components/ProtectedRoute.tsx` - Route protection logic

## Debugging Steps Performed

1. ✅ Verified localStorage clearing during logout
2. ✅ Added comprehensive logging to auth initialization
3. ✅ Implemented logout state persistence
4. ✅ Enhanced cleanup mechanisms
5. ❓ **Still experiencing session restoration on PWA restart**

## Potential Root Causes

1. **Supabase Client Timing**: Supabase might be initializing and restoring session before our logout check runs
2. **PWA Cache Issues**: Service worker or other PWA mechanisms might be caching auth data
3. **Browser Storage Persistence**: Some browsers might persist data differently in PWA mode
4. **Auth Initialization Race Condition**: The logout flag check might not be preventing session restoration properly
5. **Service Worker Precaching**: PWA might be precaching auth-related resources

## Required Solution

The goal is to ensure that when a user logs out of the PWA, they remain logged out even after completely closing and reopening the app.

### Expected Behavior:
1. User logs out → All auth data cleared
2. User closes PWA app
3. User reopens PWA app → User remains logged out
4. User must manually log in again

### Current Behavior:
1. User logs out → Appears logged out
2. User closes PWA app
3. User reopens PWA app → User is automatically logged back in

## Technical Context

- **Framework**: React + TypeScript
- **Auth**: Supabase
- **PWA**: Vite PWA plugin
- **Storage**: localStorage, sessionStorage, IndexedDB
- **Deployment**: Production PWA

## Console Logs to Monitor

During logout and app restart, look for:
- "Starting logout process..."
- "Attempting to sign out..."
- "Cleared X Supabase auth keys from localStorage"
- "Cleared X Supabase auth keys from sessionStorage"
- "Logout completed, navigating to home..."
- "Initializing auth..."
- "Logout state check: { hasLoggedOut: true/false }"
- "User previously logged out, keeping logged out state"
- "Cleaned up restored Supabase auth keys: X"

## Next Steps for Troubleshooting

1. **Verify Logout Flag**: Check if `bloom_user_logged_out` flag is actually being set and checked
2. **Timing Analysis**: Ensure logout check happens before Supabase session restoration
3. **Alternative Storage**: Consider using different storage mechanism for logout state
4. **Supabase Configuration**: Possibly modify Supabase client auth settings
5. **Complete Reset**: Consider more aggressive session invalidation approach