# Production Setup - Admin Client Management

## How It Will Work in Production

In production, clients will appear in your admin dashboard automatically when:

1. **A user signs up** via your signup page
2. **You assign them a plan** (either manually or automatically)
3. **They show up in admin dashboard** immediately

No test data needed - real users only!

## Current Database Structure

Your database is already set up correctly with:

✅ `user_plans` table - Stores client subscriptions
✅ `client_panel_settings` table - Stores admin configurations
✅ `media_uploads` table - Stores client uploads
✅ `dashboard_analytics` table - Stores analytics data

## How Clients Will Appear in Admin Dashboard

### Method 1: After User Signup (Recommended)

When a new user signs up and selects a plan, your app should:

```typescript
// After user signup and plan selection
const { data: { user } } = await supabase.auth.getUser();

// Insert their plan
await supabase.from('user_plans').insert({
  user_id: user.id,
  plan_tier: selectedPlan.tier, // 'basico', 'estandar', 'premium'
  plan_name: selectedPlan.name,
  billing_type: selectedPlan.billing, // 'monthly', 'annual'
  price: selectedPlan.price,
  features: selectedPlan.features,
  extras: selectedPlan.extras || [],
  status: 'active',
  start_date: new Date().toISOString(),
});
```

### Method 2: Admin Manually Adds Client

You can create a "New Client" button in admin dashboard that:

1. Creates a Supabase auth user
2. Sends them an invitation email
3. Assigns them a plan
4. They appear in the client list

## What the Admin Dashboard Shows

The admin dashboard fetches from `user_plans` table and shows:

```typescript
// For each client with a plan:
- User ID (from auth.users)
- Email (from auth.users via join)
- Plan name
- Status (active/cancelled/expired/pending)
- Registration date
```

## How to Get Client Email/Name in Production

Since `user_plans` doesn't store email (it's in `auth.users`), you have 3 options:

### Option A: Server-Side API Route (BEST for security)

Create `/app/api/admin/clients/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email !== 'gabrielaramis01@gmail.com') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch all user plans
  const { data: plans } = await supabase
    .from('user_plans')
    .select('*')
    .order('created_at', { ascending: false });

  // Get user details for each plan using admin client
  const adminClient = createClient(); // with service role key
  const clientsWithDetails = await Promise.all(
    plans.map(async (plan) => {
      const { data: { user } } = await adminClient.auth.admin.getUserById(plan.user_id);
      return {
        ...plan,
        email: user?.email,
        name: user?.user_metadata?.full_name,
      };
    })
  );

  return Response.json(clientsWithDetails);
}
```

Then in admin dashboard:
```typescript
const response = await fetch('/api/admin/clients');
const clients = await response.json();
```

### Option B: Store Email in user_metadata (SIMPLEST)

When user signs up, store their info in metadata:

```typescript
await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: name,
      company: company,
    }
  }
});
```

Then admin dashboard can access via RLS policies.

### Option C: Postgres Function (ADVANCED)

Create a Postgres function that joins auth.users:

```sql
CREATE OR REPLACE FUNCTION get_clients_with_details()
RETURNS TABLE (
  user_id uuid,
  email text,
  plan_name text,
  status text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.user_id,
    au.email,
    up.plan_name,
    up.status,
    up.created_at
  FROM user_plans up
  JOIN auth.users au ON up.user_id = au.id
  ORDER BY up.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Recommended Production Flow

### 1. User Signup
- User goes to `/signup`
- Enters email, password, name
- Selects a plan (or gets default)
- Account created in `auth.users`
- Plan created in `user_plans`

### 2. Admin Sees Client
- Admin goes to `/dashboard/admin`
- Sees all clients who have plans
- Can click "Gestionar" to configure their panel

### 3. Admin Configures Client
- Admin sets which features client sees
- Saved to `client_panel_settings`

### 4. Client Logs In
- Client sees only features admin enabled
- Settings fetched from `client_panel_settings`

## Testing Without Mess

To test with real (but temporary) users:

1. Create a test email: `testclient+1@yourdomain.com`
2. Sign up through your actual signup flow
3. Assign them a plan
4. They appear in admin dashboard
5. Delete when done testing

## Summary

**For Production:**
- ✅ Use real Supabase Auth users only
- ✅ Create server-side API for fetching client details
- ✅ No test UUIDs or fake data
- ✅ Clean, secure, scalable

**Your database is already production-ready:**
- ✅ All tables exist
- ✅ RLS policies configured
- ✅ Foreign keys enforced
- ✅ Admin control system works

**Next Steps:**
1. Run `CLEANUP_TEST_DATA.sql` to remove test data
2. Keep the admin dashboard code as-is
3. When you get real users with plans, they'll show up automatically
4. Consider adding the server-side API route for better email/name fetching

**You're all set for production!** 🚀
