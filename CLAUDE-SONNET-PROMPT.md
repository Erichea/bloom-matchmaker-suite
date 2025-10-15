# Claude Sonnet 4.5 Prompt for PWA Logout Issue

## Context
I'm working on a React + TypeScript PWA app with Supabase authentication. I have a critical logout persistence issue where users remain logged in after closing and reopening the PWA, despite implementing comprehensive logout cleanup mechanisms.

## Problem Details
**Issue**: PWA logout doesn't persist across app restarts. When users log out and close/reopen the PWA, they're automatically logged back in.

**Current Implementation**: I've already implemented multiple layers of logout cleanup including localStorage clearing, service worker cache deletion, IndexedDB cleanup, and a logout state persistence mechanism, but the issue persists.

## What I Need You To Do

1. **Analyze the current logout implementation** in these key files:
   - `src/hooks/useAuth.tsx` - Auth context with logout logic and session management
   - `src/pages/LogoutPage.tsx` - Logout page with comprehensive cleanup
   - `src/integrations/supabase/client.ts` - Supabase client configuration

2. **Identify the root cause** of why Supabase sessions are still being restored on PWA restart despite all cleanup mechanisms

3. **Implement a robust solution** that ensures logout state persists across PWA restarts

## Current Implementation Status

### ✅ Already Implemented:
- Complete localStorage/sessionStorage cleanup for Supabase auth keys
- Service worker cache clearing
- IndexedDB database deletion
- Logout state persistence using `bloom_user_logged_out` flag
- Auth initialization that checks logout flag before session restoration
- Double logout (auth context + direct Supabase call)
- Comprehensive logging for debugging

### 🔍 Key Issue:
The logout state persistence mechanism (`bloom_user_logged_out` flag) may not be preventing Supabase's automatic session restoration properly. Supabase client is configured with `persistSession: true` and `autoRefreshToken: true`.

## Technical Environment
- **Stack**: React + TypeScript + Vite
- **Auth**: Supabase with localStorage persistence
- **PWA**: Vite PWA plugin with service worker
- **Storage**: localStorage, sessionStorage, IndexedDB

## Investigation Approach

Please follow this systematic approach:

1. **First**: Read and analyze the current implementation in the three key files mentioned above
2. **Identify**: Why the logout state persistence isn't working - is it timing, Supabase configuration, or PWA-specific behavior?
3. **Design**: A robust solution that accounts for PWA persistence behavior
4. **Implement**: The fix with proper error handling and logging
5. **Test**: Ensure the solution works for both normal browser and PWA contexts

## Requirements for the Solution

- Must work in PWA environment (not just regular browser)
- Must persist logout state across complete app closures
- Must not interfere with normal login flow
- Must handle edge cases (network issues, storage failures, etc.)
- Should be backwards compatible
- Must include comprehensive logging for debugging

## Expected Outcome
After implementing your solution:
1. User logs out → All auth data cleared, logout state saved
2. User closes PWA completely
3. User reopens PWA → User remains logged out (no automatic session restoration)
4. User must manually log in again to access protected areas

## Debugging Information
I've created a detailed troubleshooting guide in `TROUBLESHOOTING-PWA-LOGOUT.md` with current implementation status, debugging steps performed, and potential root causes.

Please read that file first, then analyze the code and implement a comprehensive solution.

## Notes
- This is a production app, so please be careful with breaking changes
- The Supabase configuration is currently set to persist sessions by default
- PWA behavior can differ from regular browser behavior in terms of storage persistence
- Feel free to suggest architectural changes if needed, but prefer minimal invasive solutions

Please start by reading the troubleshooting guide and then examining the current implementation.