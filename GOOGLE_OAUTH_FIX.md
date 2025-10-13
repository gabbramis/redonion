# Google OAuth Redirect Fix

## Problem
Getting redirected to `http://localhost:3000/?code=...` instead of the callback handler.

## Solution

### Step 1: Supabase Configuration

1. **Go to URL Configuration:**
   - Dashboard: https://supabase.com/dashboard/project/wahbclijcunielcwczzp/auth/url-configuration

2. **Site URL (set exactly as shown):**
   ```
   http://localhost:3000
   ```

3. **Redirect URLs (add all of these):**
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/**
   http://localhost:3000/*
   ```

   Click "Add URL" for each one, then **Save**

### Step 2: Google Cloud Console Configuration

1. **Go to credentials:**
   - https://console.cloud.google.com/apis/credentials

2. **Click on your OAuth 2.0 Client ID**

3. **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   ```

   Also add (for production later):
   ```
   https://wahbclijcunielcwczzp.supabase.co
   ```

4. **Authorized redirect URIs (MUST INCLUDE BOTH):**
   ```
   https://wahbclijcunielcwczzp.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   ```

   ⚠️ **Important:** The Supabase callback MUST be first!

5. **Click Save**

### Step 3: Verify Your Supabase Provider Settings

1. **Go to Auth Providers:**
   - https://supabase.com/dashboard/project/wahbclijcunielcwczzp/auth/providers

2. **Find Google Provider**

3. **Make sure it shows:**
   - ✅ Enabled
   - ✅ Client ID filled in
   - ✅ Client Secret filled in
   - ✅ Callback URL (Copy): `https://wahbclijcunielcwczzp.supabase.co/auth/v1/callback`

4. **Click Save**

### Step 4: Clear Browser Data

1. **Clear your browser cookies** for localhost
2. **Clear browser cache**
3. **Or use Incognito/Private mode** for testing

### Step 5: Restart Dev Server

```bash
# Stop the server (Ctrl + C)
npm run dev
# Server will restart
```

## Testing Steps

1. **Go to:** http://localhost:3000/login

2. **Click "Continuar con Google"**

3. **Select your Google account**

4. **Expected flow:**
   ```
   Login page
      ↓
   Google consent screen
      ↓
   Supabase callback (processes auth code)
      ↓
   /auth/callback (your handler)
      ↓
   /dashboard/client or /dashboard/admin
   ```

## Common Issues

### Still redirecting to homepage with ?code=

**Cause:** Site URL not set correctly in Supabase

**Fix:**
- Make sure Site URL is EXACTLY: `http://localhost:3000`
- No trailing slash
- Include the http://

### "redirect_uri_mismatch" error

**Cause:** Google Cloud Console redirect URIs don't match

**Fix:**
- Add the Supabase callback URL to Google Console
- Format: `https://wahbclijcunielcwczzp.supabase.co/auth/v1/callback`

### Infinite redirect loop

**Cause:** Middleware or redirect URL conflict

**Fix:**
- Check middleware.ts config matcher
- Verify redirect URLs don't conflict

### "Invalid OAuth callback URL"

**Cause:** Callback URL not whitelisted in Supabase

**Fix:**
- Add `http://localhost:3000/auth/callback` to Redirect URLs in Supabase
- Add `http://localhost:3000/**` as a wildcard

## Correct Configuration Summary

### Supabase Auth Settings:
```
Site URL: http://localhost:3000

Redirect URLs:
- http://localhost:3000/auth/callback
- http://localhost:3000/**
- http://localhost:3000/*
```

### Google Cloud Console:
```
Authorized JavaScript origins:
- http://localhost:3000

Authorized redirect URIs:
- https://wahbclijcunielcwczzp.supabase.co/auth/v1/callback
- http://localhost:3000/auth/callback
```

### Your Code (already correct):
```typescript
// login page
const { error } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
});
```

## Production Setup (Later)

When deploying to production:

1. **Add production URLs to Supabase:**
   ```
   Site URL: https://yourdomain.com

   Redirect URLs:
   - https://yourdomain.com/auth/callback
   - https://yourdomain.com/**
   ```

2. **Add production URLs to Google Console:**
   ```
   Authorized JavaScript origins:
   - https://yourdomain.com

   Authorized redirect URIs:
   - https://wahbclijcunielcwczzp.supabase.co/auth/v1/callback
   - https://yourdomain.com/auth/callback
   ```

## Verification Checklist

- [ ] Supabase Site URL set to `http://localhost:3000`
- [ ] Supabase Redirect URLs include `/auth/callback`
- [ ] Google Console has Supabase callback URL
- [ ] Google Console has localhost callback URL
- [ ] Browser cookies cleared
- [ ] Dev server restarted
- [ ] Tested in incognito mode

## Still Not Working?

1. Check browser console for errors
2. Check Network tab for redirect chain
3. Verify Google OAuth client is for "Web application" type
4. Make sure OAuth consent screen is configured
5. Check that you're using the correct Google client ID in Supabase

## Success Indicators

When working correctly:
1. Click "Continuar con Google"
2. Google login popup/redirect
3. Brief flash of `/auth/callback` URL
4. Automatically redirect to dashboard
5. User logged in successfully

No `?code=` on homepage URL!
