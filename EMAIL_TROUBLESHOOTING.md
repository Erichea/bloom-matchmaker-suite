# Email Delivery Troubleshooting Guide

## Current Issue
You're not receiving verification emails after signup. This is a common issue with Supabase's default email provider.

## Immediate Solutions

### 1. Check Supabase Dashboard Email Settings
1. Go to your Supabase dashboard
2. Navigate to **Authentication > Settings**
3. Check if email confirmation is required
4. Look at email templates and SMTP settings

### 2. Temporary Fix: Disable Email Confirmation
To bypass email verification temporarily:

1. Go to Supabase Dashboard > Authentication > Settings
2. **Turn OFF** "Enable email confirmations"
3. Users will be automatically confirmed after signup

### 3. Configure Custom SMTP (Recommended)
Supabase's default email provider has limitations. Set up your own:

1. **Gmail SMTP**:
   - SMTP Server: smtp.gmail.com
   - Port: 587
   - Use App Password (not regular password)

2. **SendGrid** (Free tier available):
   - More reliable delivery
   - Better analytics

3. **Resend** (Modern alternative):
   - Developer-friendly
   - Good free tier

## Debug Information
Check browser console for these logs:
- Signup response details
- User confirmation status
- Email delivery status

## Quick Test
Try these email addresses to test:
- Your primary email
- Gmail address
- Different email provider

## Current App Behavior
- Signup creates account ✅
- Email should contain 6-digit code
- User enters code to verify
- After verification, can sign in

## If Emails Still Don't Work
1. **Disable email confirmation** in Supabase settings
2. Users can sign in immediately after signup
3. Set up proper SMTP later

## Need Immediate Access?
If you need to test the app right now:
1. Disable email confirmation in Supabase
2. Sign up normally
3. Sign in immediately (no verification needed)