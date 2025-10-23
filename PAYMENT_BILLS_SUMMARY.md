# Payment & Bills System - Summary of Changes

## Overview
Fixed and improved the payment tracking system to ensure that when clients pay, their plan shows up in both the client dashboard and admin panel. Also fixed the bills/payments history tab.

## Files Modified

### 1. **Webhook Enhancement** (`src/app/api/webhook/mercadopago/route.ts`)
**Changes:**
- Added detailed console logging for debugging payment processing
- Enhanced error handling with specific error details
- Fixed variable naming conflicts
- Now logs:
  - `💾 Attempting to upsert user_plan...`
  - `✅ Payment approved for user...`
  - `❌ Error details` (if any)

**Lines modified:** 72-107, 173-207

### 2. **Database Schema** (`supabase/user_plans.sql`)
**NEW FILE - Must be run in Supabase SQL Editor**
- Creates `user_plans` table to store client subscription data
- Includes proper RLS policies allowing:
  - Users to view their own plans
  - Service role (webhooks) to manage all plans
- Includes indexes for performance
- Automatic timestamp updates

**Key fields:**
- `user_id` (unique constraint - one plan per user)
- `plan_name`, `plan_tier`, `billing_type`
- `status` (active, inactive, cancelled, pending)
- `subscription_id` (MercadoPago payment/subscription ID)
- `price`, `subscription_start`, `subscription_end`

### 3. **Client Panel - No Plan Message** (`src/app/dashboard/client/panel/page.tsx`)
**Changes:**
- Added `hasActivePlan` state to check if user has an active plan
- Fetches plan status from `/api/subscription/details`
- Shows different messages:
  - **No active plan:** "No tienes un plan activo" + button to view plans
  - **Has plan but no reports:** "No hay reportes disponibles"
  - **Has plan and reports:** Shows dashboard with metrics

**Lines modified:** 10-85

### 4. **Payment History API** (`src/app/api/payments/history/route.ts`)
**Changes:**
- Fixed to handle **both** one-time payments AND subscription payments
- Now searches payments using TWO methods:
  1. By `preapproval_id` (for subscription-based recurring payments)
  2. By `external_reference` (for one-time payments with userId)
- Removes duplicate payments
- Sorts by date (most recent first)
- Added console logging for debugging

**Key improvements:**
- Before: Only fetched subscription payments, failed for one-time payments
- After: Fetches all payments regardless of payment type

**Lines modified:** 9-103

### 5. **Payments Page UI** (`src/app/dashboard/client/payments\page.tsx`)
**Changes:**
- Added button to "Ver Planes Disponibles" when no payments exist
- Better empty state message

**Lines modified:** 132-164

## How the System Works Now

### Payment Flow:
1. **Client selects a plan** → Redirected to MercadoPago
2. **Client completes payment** → MercadoPago sends webhook to your server
3. **Webhook receives payment** → Logs details and parses external_reference
4. **Webhook inserts/updates** `user_plans` table with:
   - User ID
   - Plan details (name, tier, billing type)
   - Status = 'active'
   - Subscription dates
5. **Client dashboard refreshes** → Shows active plan
6. **Admin panel refreshes** → Shows client with active plan

### Dashboard Display:
- **Client Panel** (`/dashboard/client/panel`):
  - Checks if user has active plan
  - Shows "No tienes un plan activo" if no plan
  - Shows reports if plan exists

- **Admin Panel** (`/dashboard/admin`):
  - Fetches all users with plans from `user_plans` table
  - Displays plan name, status, and price for each client

- **Payments History** (`/dashboard/client/payments`):
  - Fetches payments from MercadoPago API
  - Shows all payments (one-time + recurring)
  - Displays: date, description, amount, payment method, status

## Testing Checklist

Before making a payment, ensure:
- [ ] `user_plans` table exists in Supabase (run SQL script)
- [ ] RLS policies are enabled on `user_plans` table
- [ ] Environment variables are set (especially `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] Webhook URL is configured in MercadoPago dashboard

After making a payment, verify:
- [ ] Check webhook logs for success messages
- [ ] Verify entry in `user_plans` table in Supabase
- [ ] Client can see their plan at `/dashboard/client/subscription`
- [ ] Client panel shows reports at `/dashboard/client/panel` (if reports exist)
- [ ] Admin panel shows client at `/dashboard/admin`
- [ ] Payment appears in `/dashboard/client/payments`

## Debugging

### Check Webhook Logs
Look for these log messages (in deployment logs):
```
📥 Webhook received: {...}
💳 Payment data: {...}
💾 Attempting to upsert user_plan for user...
✅ Payment approved for user X, plan Y
✅ Upserted data: {...}
```

### Check Payment History Logs
```
💳 Fetching payment history for user: X
📋 User plan found. Subscription ID: Y
✅ Found N total payments for user X
```

### Common Issues

**Issue:** Webhook succeeds but no data in database
- Check Supabase logs for RLS policy blocks
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Ensure `user_plans` table exists

**Issue:** Payments don't show in history
- Check if user has entry in `user_plans` table
- Verify MercadoPago API access token is valid
- Check external_reference format: `userId-planId-billing`

**Issue:** Client panel shows "No plan activo" after payment
- Check if plan status is 'active' in database
- Verify subscription end date is in the future
- Refresh the page (Ctrl+Shift+R for hard refresh)

## Next Steps

1. **Run the SQL script** in Supabase to create the table
2. **Test a payment** with the test plan (Plan Test - ~16 UYU)
3. **Monitor logs** during payment to ensure everything works
4. **Verify dashboards** update correctly after payment
