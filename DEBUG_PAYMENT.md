# Payment Debug Checklist

## Step 1: Check if the `user_plans` table exists in Supabase

1. Go to your Supabase Dashboard
2. Click on "SQL Editor" in the left sidebar
3. Run this query:

```sql
SELECT * FROM user_plans;
```

**Expected Result:** You should see the table with columns: id, user_id, plan_name, plan_tier, etc.

**If you get an error** "relation 'user_plans' does not exist":
- The table hasn't been created yet
- Go to SQL Editor → New Query
- Copy the entire contents of `supabase/user_plans.sql`
- Paste and click "Run"

---

## Step 2: Check Webhook Logs

### If deployed (Vercel/etc):
1. Go to your deployment dashboard
2. Navigate to "Logs" or "Functions"
3. Look for logs from the `/api/webhook/mercadopago` endpoint
4. Search for these messages after your payment:

**Success indicators:**
```
📥 Webhook received: {...}
💳 Payment data: {...}
💾 Attempting to upsert user_plan for user...
✅ Payment approved for user [userId], plan [planTier]
✅ Upserted data: {...}
```

**Error indicators:**
```
❌ Error upserting user_plan: {...}
❌ Error details: {...}
❌ Attempted data: {...}
```

### If running locally:
Check your terminal/console where the dev server is running for the same messages.

---

## Step 3: Verify Data in Supabase

After making a payment, run this query in Supabase SQL Editor:

```sql
SELECT
  user_id,
  plan_name,
  plan_tier,
  status,
  billing_type,
  price,
  subscription_start,
  subscription_end,
  created_at
FROM user_plans
ORDER BY created_at DESC
LIMIT 5;
```

**What to check:**
- [ ] Is there a row for your user_id?
- [ ] Is `status` = 'active'?
- [ ] Is `plan_name` correct?
- [ ] Is `subscription_end` in the future?

**If NO data appears:**
- The webhook didn't insert the data
- Check webhook logs for errors
- Verify webhook URL is configured in MercadoPago

**If data exists but status is NOT 'active':**
```sql
UPDATE user_plans
SET status = 'active'
WHERE user_id = 'your-user-id-here';
```

---

## Step 4: Check Your User ID

You need to know your user ID to verify the data. Run this in your browser console when logged in:

```javascript
// Open browser console (F12)
// Go to your dashboard
// Run this:
const supabase = (await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')).createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
);
const { data: { user } } = await supabase.auth.getUser();
console.log('My User ID:', user.id);
```

**OR** check in Supabase Dashboard:
1. Go to Authentication → Users
2. Find your email
3. Copy the UUID (that's your user_id)

---

## Step 5: Check MercadoPago Webhook Configuration

1. Go to your MercadoPago Dashboard
2. Navigate to "Your integrations" → "Webhooks"
3. Verify:
   - [ ] Webhook URL is set to: `https://your-domain.com/api/webhook/mercadopago`
   - [ ] Events selected: "Payment" and "Subscription"
   - [ ] Status is "Active"

---

## Step 6: Manual Database Insert (Temporary Test)

If the webhook isn't working, you can manually insert data to test the dashboard:

```sql
-- Replace with YOUR actual user_id
INSERT INTO user_plans (
  user_id,
  plan_name,
  plan_tier,
  billing_type,
  price,
  status,
  subscription_id,
  subscription_start,
  subscription_end,
  billing_frequency,
  billing_period
) VALUES (
  'YOUR-USER-ID-HERE',  -- Replace this!
  'Plan Test',
  'test',
  'monthly',
  16.00,
  'active',
  'test-subscription-123',
  NOW(),
  NOW() + INTERVAL '1 month',
  1,
  'months'
);
```

After running this, refresh your dashboards and see if they show the plan.

---

## Step 7: Check API Endpoints

### Test Subscription Details API:
Open in browser (replace USER_ID):
```
https://your-domain.com/api/subscription/details?userId=USER_ID
```

**Expected response:**
```json
{
  "subscription": {
    "id": "...",
    "planName": "Plan Test",
    "status": "active",
    ...
  }
}
```

### Test Admin Users API:
Open browser console when logged in as admin:
```javascript
fetch('/api/admin/users', {
  headers: {
    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session.access_token}`
  }
}).then(r => r.json()).then(console.log)
```

---

## Common Issues & Solutions

### Issue: Webhook never receives the payment
**Solution:**
- Verify webhook URL is correct in MercadoPago
- Check if your server is accessible from internet (not localhost)
- Use ngrok if testing locally: `ngrok http 3000`

### Issue: Webhook receives but returns error 500
**Solution:**
- Check `SUPABASE_SERVICE_ROLE_KEY` is set in environment variables
- Verify `user_plans` table exists
- Check webhook logs for specific error details

### Issue: Data exists but dashboard shows "No plan"
**Solution:**
- Hard refresh the page (Ctrl+Shift+R)
- Check browser console for API errors
- Verify user_id matches in auth and user_plans table

### Issue: Admin panel doesn't show clients
**Solution:**
- Verify your email is in `ADMIN_EMAILS` array (`src/defs/admins.ts`)
- Check `/api/admin/users` returns data
- Look for console errors in browser

---

## Quick Test Commands

Run these in Supabase SQL Editor to diagnose:

```sql
-- Check if table exists
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'user_plans';

-- Count total plans
SELECT COUNT(*) as total_plans FROM user_plans;

-- See all plans
SELECT * FROM user_plans;

-- Check specific user (replace ID)
SELECT * FROM user_plans WHERE user_id = 'your-user-id';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'user_plans';
```

---

## Next Steps

After going through these checks, let me know:
1. Does the `user_plans` table exist?
2. What do the webhook logs show?
3. Is there data in the `user_plans` table for your user?
4. What does the subscription API return?

This will help me identify exactly where the issue is!
