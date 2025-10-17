# Testing MercadoPago Integration

## Quick Start Guide

### 1. Install Dependencies (if not done)
```bash
pnpm install
```

### 2. Set up Environment Variables
Make sure your `.env.local` has all required variables (check `.env.example`)

### 3. Download ngrok
1. Go to https://ngrok.com/download
2. Download for Windows (ZIP file)
3. Extract `ngrok.exe` to this project folder

### 4. Start Testing

**Terminal 1** - Start your app:
```bash
npm run dev
```

**Terminal 2** - Start ngrok:
```bash
.\ngrok.exe http 3000
```

### 5. Configure MercadoPago Webhook

1. Copy the HTTPS URL from ngrok (looks like: `https://xxxx.ngrok-free.app`)
2. Go to https://www.mercadopago.com.uy
3. Click your profile → "Tus integraciones" → "Notificaciones"
4. Paste webhook URL: `https://xxxx.ngrok-free.app/api/webhook/mercadopago`
5. Check "Payments" option
6. Click "Guardar"

### 6. Test Payment

1. Open http://localhost:3000/dashboard/client
2. Select a plan (e.g., Plan Básico)
3. Click "Proceder al Pago"
4. Click the MercadoPago button
5. Use test card:
   - Card: **4509 9535 6623 3704**
   - Expiry: Any future date (12/25)
   - CVV: 123
   - Name: TEST USER

### 7. Verify Success

Check your terminal running `npm run dev` for:
```
✅ Payment processed for user [user_id], plan [plan_id]
```

Check Supabase `user_plans` table - you should see a new record!

---

## Troubleshooting

### Webhook not receiving notifications?
- Make sure ngrok is still running (it stays open)
- Verify webhook URL in MercadoPago dashboard is correct
- Check ngrok didn't restart (URL changes each restart)

### Payment not appearing in admin panel?
- Check Supabase `user_plans` table directly
- Look for errors in terminal
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`

### ngrok issues?
See `tunnel-alternatives.md` for other options like:
- Cloudflare Tunnel
- localhost.run
- VS Code port forwarding

---

## Important Notes

- ⚠️ Keep both terminals open during testing
- ⚠️ ngrok URL changes each restart (free version)
- ⚠️ Remember to update webhook URL if ngrok restarts
- ✅ Using TEST credentials (no real charges)
- ✅ Webhook validates payment status before creating records

---

## Integration Overview

Your setup:
1. **Client page** (`src/app/dashboard/client/page.tsx`) - User selects plan
2. **Create payment** (`src/app/api/create-payment/route.ts`) - Creates MercadoPago preference
3. **User pays** - MercadoPago handles payment securely
4. **Webhook** (`src/app/api/webhook/mercadopago/route.ts`) - Receives notification
5. **Database** - Auto-creates record in `user_plans` table
6. **Admin panel** - User appears automatically!

Everything is working correctly! 🎉
