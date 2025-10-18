# Supabase Setup Guide for RedOnion

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in the details:
   - **Name**: RedOnion
   - **Database Password**: Choose a strong password
   - **Region**: Choose the closest region to your users
5. Click "Create new project"

## Step 2: Get Your API Keys

1. Once your project is created, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

## Step 3: Update Environment Variables

1. Open the `.env.local` file in the project root
2. Replace the placeholder values with your actual Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Step 4: Set Up Authentication

1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider (it should be enabled by default)
3. Configure email templates if needed

### Configure Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Add the following URLs to **Redirect URLs**:
   - Development: `http://localhost:3000/auth/callback`
   - Production: `https://yourdomain.com/auth/callback`
3. Click **Save**

> **Important**: The auth callback URL is required for:
> - Email confirmation links (when users sign up with email/password)
> - OAuth authentication (Google, etc.)
> - Password reset links

## Step 5: Create Admin User

You need to create your admin user in Supabase:

1. Go to **Authentication** → **Users** in your Supabase dashboard
2. Click **Add user** → **Create new user**
3. Enter your admin credentials:
   - **Email**: `gabrielaramis01@gmail.com`
   - **Password**: `admin123`
   - **Auto Confirm User**: Enable this option
4. Click **Create user**

## Step 6: Optional - Create Test Client User

To test the client dashboard:

1. Go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter test client credentials:
   - **Email**: `cliente@test.com`
   - **Password**: `client123`
   - **Auto Confirm User**: Enable this option
4. Click **Create user**

## Step 7: Optional - Set Up User Metadata for Roles

If you want to use user metadata for role management:

1. Go to **SQL Editor** in Supabase
2. Run this SQL to add role metadata to your admin user:

```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'gabrielaramis01@gmail.com';
```

## Step 8: Test the Application

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`
3. Click the RedOnion logo in the header
4. Log in with your admin credentials:
   - Email: `gabrielaramis01@gmail.com`
   - Password: `admin123`

## How It Works

### Authentication Flow

#### Email/Password Login
1. **Login**: User enters credentials on `/login` page
2. **Verification**: Supabase verifies credentials
3. **Role Check**: System checks if user is admin (email match or metadata)
4. **Redirect**:
   - Admin users → `/dashboard/admin`
   - Client users → `/dashboard/client/panel`

#### Email/Password Signup with Confirmation
1. **Signup**: User registers on `/signup` page
2. **Email Sent**: Supabase sends confirmation email with a link
3. **Click Link**: User clicks the confirmation link in their email
4. **Callback**: Link redirects to `/auth/callback` with auth code
5. **Session Creation**: Callback exchanges code for session
6. **User Plan**: Creates default "Sin Plan" entry in user_plans table
7. **Redirect**: Routes user to appropriate dashboard based on role

#### OAuth Login (Google)
1. **OAuth Start**: User clicks "Continue with Google" button
2. **Google Auth**: User authenticates with Google
3. **Callback**: Google redirects to `/auth/callback` with auth code
4. **Session Creation**: Callback exchanges code for session
5. **User Plan**: Creates default "Sin Plan" entry if new user
6. **Redirect**: Routes user to appropriate dashboard based on role

### Admin Dashboard Features

- View all clients
- Manage projects
- Access to analytics and reports
- Full system control

### Client Dashboard Features

- View personal projects
- Track project progress
- Communicate with team
- Limited to their own data

## Security Notes

- Never commit `.env.local` to version control (already in `.gitignore`)
- Use strong passwords for production
- Enable Row Level Security (RLS) in Supabase for production
- Consider adding two-factor authentication for admin users

## Troubleshooting

### "Invalid API key" error
- Check that your `.env.local` file has the correct values
- Restart your development server after updating environment variables

### Can't log in
- Verify the user exists in Supabase Authentication dashboard
- Check that "Auto Confirm User" is enabled
- Check browser console for detailed error messages

### Redirects not working
- Clear your browser cookies
- Check middleware configuration in `src/middleware.ts`

## Next Steps for Production

1. **Set up Row Level Security (RLS)** in Supabase
2. **Create database tables** for projects, clients, etc.
3. **Implement real data fetching** instead of mock data
4. **Add proper error handling** and loading states
5. **Set up email templates** for password reset, etc.
6. **Configure production environment variables**
