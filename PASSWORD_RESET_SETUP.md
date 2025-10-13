# Password Reset Setup Guide

## Step 1: Configure Email Templates in Supabase

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/xmwvvwsmgvevganxompc
2. Navigate to **Authentication** → **Email Templates**
3. Find **Reset Password** template
4. Update the template if needed (the default one should work)

## Step 2: Configure Site URL in Supabase

1. In Supabase dashboard, go to **Authentication** → **URL Configuration**
2. Set the **Site URL** to:
   - Development: `http://localhost:3000`
   - Production: Your production URL (e.g., `https://yourdomain.com`)
3. Add **Redirect URLs** (one per line):
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/update-password`
   - Your production URLs when deploying
4. Click **Save**

## How Password Reset Works

### User Flow:
1. User clicks "¿Olvidaste tu contraseña?" on login page
2. User enters their email on `/reset-password` page
3. System sends password reset email via Supabase
4. User clicks link in email
5. User is redirected to `/update-password` page
6. User enters new password (must match confirmation)
7. Password is updated in Supabase
8. User is redirected to login page

### Email Configuration:
- Emails are sent from Supabase's default email service
- For production, configure your own SMTP provider in Supabase
- Go to **Project Settings** → **Auth** → **SMTP Settings**

## Testing Password Reset

1. Make sure you have a user created in Supabase
2. Go to `http://localhost:3000/login`
3. Click "¿Olvidaste tu contraseña?"
4. Enter the user's email
5. Check your email inbox (including spam folder)
6. Click the reset link in the email
7. Enter a new password (min 6 characters)
8. Confirm the password
9. You should be redirected to login with the new password

## Troubleshooting

### Not receiving emails?
- Check Supabase Email Rate Limits in dashboard
- Check spam/junk folder
- For production, set up custom SMTP (Supabase free tier has email limits)
- Enable email confirmations in Supabase Auth settings

### "Invalid or expired link" error?
- Reset links expire after 1 hour by default
- Request a new reset link
- Check that the URL configuration in Supabase is correct

### Password not updating?
- Ensure password meets minimum requirements (6+ characters)
- Check browser console for detailed error messages
- Verify the user is logged in when updating password

## Security Notes

- Reset links expire after 1 hour
- Old password becomes invalid immediately after reset
- Only one active reset link per user
- Rate limiting prevents abuse (max 4 requests per hour per email)

## Customizing Email Templates

To customize the reset email:
1. Go to **Authentication** → **Email Templates** in Supabase
2. Click on **Reset Password**
3. Edit the template HTML/text
4. Available variables:
   - `{{ .ConfirmationURL }}` - The reset link
   - `{{ .SiteURL }}` - Your site URL
   - `{{ .Token }}` - The reset token
5. Click **Save**
