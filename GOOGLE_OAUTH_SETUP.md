# Google OAuth Setup Guide

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - Choose **External** user type
   - Fill in app information:
     - App name: RedOnion
     - User support email: your email
     - Developer contact: your email
   - Add scopes: `email` and `profile`
   - Save and continue
6. Back in **Create OAuth client ID**:
   - Application type: **Web application**
   - Name: RedOnion Web Client
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - Your production URL when deploying
   - Authorized redirect URIs:
     - `https://xmwvvwsmgvevganxompc.supabase.co/auth/v1/callback`
   - Click **Create**
7. Copy the **Client ID** and **Client Secret**

## Step 2: Configure Google OAuth in Supabase

1. Open your Supabase dashboard: https://supabase.com/dashboard/project/xmwvvwsmgvevganxompc
2. Go to **Authentication** → **Providers**
3. Find **Google** in the list and click to enable it
4. Paste your Google OAuth credentials:
   - **Client ID**: [your Google client ID]
   - **Client Secret**: [your Google client secret]
5. Copy the **Callback URL** shown (should be: `https://xmwvvwsmgvevganxompc.supabase.co/auth/v1/callback`)
6. Click **Save**

## Step 3: Update Google Cloud Console with Callback URL

1. Go back to Google Cloud Console
2. Edit your OAuth client
3. Make sure the Authorized redirect URIs includes:
   - `https://xmwvvwsmgvevganxompc.supabase.co/auth/v1/callback`
4. Save changes

## Step 4: Test Google OAuth

1. Restart your development server if running
2. Go to login page
3. Click "Google" button
4. You should be redirected to Google login
5. After successful login, you'll be redirected back to your dashboard

## Important Notes

- First-time Google login users will be created automatically in Supabase
- By default, Google sign-ins will be regular clients (not admins)
- You can manually change user role in Supabase if needed
- For production, add your production domain to authorized origins and redirect URIs
