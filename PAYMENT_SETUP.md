# Payment System Setup & Debugging Guide

## Issue Summary
When a client completes payment, the dashboard doesn't show their active plan. Both the client dashboard and admin panel are not reflecting the payment status properly.

## Root Causes Identified

1. **Missing Database Table**: The `user_plans` table might not exist in your Supabase database
2. **RLS Policies**: Row Level Security policies might be blocking the webhook from inserting data
3. **Silent Failures**: Webhook was failing but not providing detailed error logs

## Solution Steps

### 1. Create the `user_plans` Table in Supabase

Run the SQL script located at `supabase/user_plans.sql` in your Supabase SQL Editor:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Click "New Query"
4. Copy and paste the contents of `supabase/user_plans.sql`
5. Click "Run" to execute

This will create:
- The `user_plans` table with proper structure
- Indexes for performance
- RLS policies that allow:
  - Users to view their own plans
  - Service role (webhooks) to manage all plans
- Automatic timestamp updates

### 2. Verify Environment Variables

Make sure these variables are set in your `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Important for webhook!

# MercadoPago
MP_ACCESS_TOKEN=your_mercadopago_access_token
MP_CURRENCY=UYU
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 3. Test the Payment Flow

After setting up the database:

1. **Test a payment** (use a test plan if available)
2. **Check webhook logs** in your deployment platform (Vercel, etc.)
3. Look for these log messages:
   - `📥 Webhook received:` - Webhook was called
   - `💳 Payment data:` - Payment details received
   - `💾 Attempting to upsert user_plan for user...` - Database insert starting
   - `✅ Payment approved for user...` - Success!
   - `✅ Upserted data:` - Data successfully saved

4. **Check for errors**:
   - `❌ Error upserting user_plan:` - Database insert failed
   - `❌ Error details:` - Specific error information
   - `❌ Attempted data:` - Data that was trying to be inserted

### 4. Verify Data in Supabase

After a successful payment:

1. Go to Supabase Dashboard
2. Navigate to Table Editor
3. Open the `user_plans` table
4. Verify that a row exists with:
   - `user_id` matching the client's user ID
   - `status` = 'active'
   - `plan_name`, `plan_tier`, `billing_type` properly set
   - `subscription_start` and `subscription_end` dates

### 5. Check Dashboard Display

**Client Dashboard** (`/dashboard/client/subscription`):
- Should fetch plan from `/api/subscription/details?userId={userId}`
- Displays plan name, billing type, status, and pricing
- Shows "No active subscription" if no plan found

**Admin Panel** (`/dashboard/admin`):
- Should fetch all users with plans from `/api/admin/users`
- Displays client list with plan information
- Each client row shows their plan tier and status

### 6. Common Issues & Solutions

#### Issue: Webhook receives payment but database not updated
**Check:**
- Service role key is set correctly in environment variables
- `user_plans` table exists in Supabase
- RLS policies are correctly set up
- Check webhook logs for specific error messages

#### Issue: Dashboard shows "No active subscription"
**Check:**
- User ID matches between auth and user_plans table
- Plan status is 'active' not 'pending' or 'inactive'
- API routes are not cached (try hard refresh: Ctrl+Shift+R)

#### Issue: Admin panel doesn't show client
**Check:**
- User has an entry in `user_plans` table
- Admin email is in `ADMIN_EMAILS` array in `src/defs/admins.ts`
- API route `/api/admin/users` is not throwing errors

### 7. Debugging Tips

1. **Enable detailed logging**: The webhook now has extensive console.log statements
2. **Check Supabase logs**: Go to Supabase Dashboard > Logs > API
3. **Monitor webhook calls**: Use MercadoPago dashboard to see webhook delivery status
4. **Test locally**: Use ngrok to tunnel webhook to your local development server

### 8. Database Schema Reference

The `user_plans` table structure:

```sql
- id (UUID, Primary Key)
- user_id (UUID, References auth.users, Unique)
- plan_name (TEXT) - e.g., "Plan Básico"
- plan_tier (TEXT) - e.g., "basico", "estandar", "premium"
- billing_type (TEXT) - "monthly" or "annual"
- price (NUMERIC)
- features (JSONB)
- status (TEXT) - "active", "inactive", "cancelled", "pending"
- subscription_id (TEXT) - MercadoPago payment/subscription ID
- subscription_start (TIMESTAMP)
- subscription_end (TIMESTAMP)
- billing_frequency (INTEGER) - 1 for monthly, 12 for annual
- billing_period (TEXT) - "months" or "years"
- start_date (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## Testing Checklist

- [ ] `user_plans` table exists in Supabase
- [ ] RLS policies are enabled and correct
- [ ] Environment variables are set
- [ ] Test payment completed successfully
- [ ] Webhook received payment notification
- [ ] Database record created/updated
- [ ] Client can see their plan at `/dashboard/client/subscription`
- [ ] Admin can see client in admin panel at `/dashboard/admin`
- [ ] Plan status shows as "active"

## Need Help?

If you're still experiencing issues after following these steps:

1. Check the webhook logs for specific error messages
2. Verify the Supabase table structure matches the schema
3. Test with a fresh user account
4. Check MercadoPago webhook configuration and delivery logs
