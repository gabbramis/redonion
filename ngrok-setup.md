# ngrok Setup for MercadoPago Testing

## Installation

### Option 1: Download ngrok (Recommended)
1. Go to https://ngrok.com/download
2. Download ngrok for Windows
3. Extract the .exe file to your project folder or add to PATH
4. (Optional) Sign up for free account at https://dashboard.ngrok.com/signup
5. (Optional) Run: `ngrok config add-authtoken YOUR_TOKEN`

### Option 2: Use Chocolatey
```bash
choco install ngrok
```

### Option 3: Use Scoop
```bash
scoop install ngrok
```

## Quick Start

1. **Start your Next.js dev server** (in terminal 1):
   ```bash
   npm run dev
   ```

2. **Start ngrok** (in terminal 2):
   ```bash
   ngrok http 3000
   ```

   Or if you downloaded the .exe to project folder:
   ```bash
   .\ngrok.exe http 3000
   ```

3. **Copy the HTTPS URL** from ngrok output:
   ```
   Forwarding https://xxxx-xx-xx-xx-xx.ngrok-free.app -> http://localhost:3000
   ```

4. **Configure MercadoPago webhook**:
   - Go to: https://www.mercadopago.com.uy
   - Profile → "Tus integraciones" → "Notificaciones"
   - Enter webhook URL: `https://your-ngrok-url.ngrok-free.app/api/webhook/mercadopago`
   - Check "Payments" option
   - Save

5. **Test payment flow**:
   - Go to http://localhost:3000/dashboard/client
   - Select a plan
   - Click "Proceder al Pago"
   - Use test card: 4509 9535 6623 3704

## Important Notes

- Keep both terminals running during testing
- ngrok URL changes each time you restart (free version)
- Update MercadoPago webhook URL if ngrok restarts
- Check terminal logs for webhook notifications

## Troubleshooting

If webhook doesn't receive notifications:
1. Verify ngrok is running
2. Check the URL is correct in MercadoPago dashboard
3. Look for webhook logs in your dev server terminal
4. Test webhook manually: `curl -X POST https://your-ngrok-url/api/webhook/mercadopago -d '{"test":"data"}'`
