# Client Signup Guide

## Overview

Clients can now register themselves without needing Google OAuth! They have two options:
1. ✅ **Email/Password Registration** - Create account with email and password
2. ✅ **Google OAuth** - Sign up with Google account

## How It Works

### Client Registration Flow:

1. **Client goes to login page** (`/login`)
2. **Clicks "Crear Cuenta"** link at the bottom
3. **Fills out signup form** (`/signup`)
   - Full Name
   - Email
   - Password (min 6 characters)
   - Confirm Password
   - Accept terms & conditions
4. **System creates account**
   - Role automatically set to "client"
   - Account created in Supabase
5. **Client is redirected**
   - Depending on email confirmation settings

## 🎯 Signup Page Features

### Form Fields:
- ✅ **Nombre Completo** - Stored in user metadata
- ✅ **Correo Electrónico** - Unique email required
- ✅ **Contraseña** - Minimum 6 characters
- ✅ **Confirmar Contraseña** - Must match password
- ✅ **Terms & Conditions** - Required checkbox

### Validation:
- ✅ All fields required
- ✅ Passwords must match
- ✅ Minimum 6 character password
- ✅ Valid email format
- ✅ Terms acceptance required

### Registration Options:
- ✅ Email/Password signup
- ✅ Google OAuth signup
- ✅ Link to login if already have account

## 📧 Email Confirmation Setup

By default, Supabase may require email confirmation. Here's how to configure it:

### Option 1: Disable Email Confirmation (Development)

1. Go to: https://supabase.com/dashboard/project/wahbclijcunielcwczzp/auth/providers
2. Scroll down to **Email Auth Provider**
3. Find **Enable email confirmations**
4. Toggle it **OFF** (disabled)
5. Click **Save**

**Result:** Users can login immediately after signup

### Option 2: Enable Email Confirmation (Production - Recommended)

1. Keep **Enable email confirmations** turned **ON**
2. Configure email template:
   - Go to **Authentication** → **Email Templates**
   - Customize "Confirm signup" template
3. Set redirect URL:
   - Go to **Authentication** → **URL Configuration**
   - Add: `http://localhost:3000/auth/callback`

**Result:** Users receive confirmation email before they can login

## 🔐 Security Features

### Default User Role:
All signups are automatically assigned **"client"** role:
```javascript
options: {
  data: {
    full_name: fullName,
    role: "client", // Automatic client role
  },
}
```

### Only Admins Can Be Admins:
- Admin role is NOT available during signup
- Only you can assign admin role manually in Supabase
- This prevents unauthorized admin access

### Password Requirements:
- Minimum 6 characters
- Stored securely (hashed) by Supabase
- Cannot be retrieved, only reset

## 👥 Managing Signups

### View New Signups:
1. Go to Supabase Dashboard
2. **Authentication** → **Users**
3. See all registered users
4. Check their registration date, email, and metadata

### Manually Verify a User:
If email confirmation is enabled and user didn't receive email:
1. Go to **Authentication** → **Users**
2. Click on the user
3. Find **Email Confirmed At**
4. Click **Edit** and set current timestamp
5. User can now login

### Change User Role:
To make a client an admin:
1. Go to **Authentication** → **Users**
2. Click on the user
3. Scroll to **User Metadata**
4. Click **Edit**
5. Add or change:
   ```json
   {
     "role": "admin"
   }
   ```
6. Save - user is now admin!

## 🚀 Testing Signup

### Test Email/Password Signup:

1. **Go to signup page:**
   ```
   http://localhost:3000/signup
   ```

2. **Fill in the form:**
   - Name: Test Client
   - Email: testclient@example.com
   - Password: test123
   - Confirm: test123
   - Check terms box

3. **Click "Crear Cuenta"**

4. **Check result:**
   - If email confirmation disabled → Redirected to client dashboard
   - If email confirmation enabled → Check email for confirmation link

5. **Verify in Supabase:**
   - Go to Authentication → Users
   - You should see the new user!

### Test Google Signup:

1. Click "Registrarse con Google"
2. Select Google account
3. Redirected to client dashboard
4. User created automatically in Supabase

## 🎨 Page Locations

### Signup Page:
- **URL:** `/signup`
- **File:** `src/app/signup/page.tsx`
- **Access:** Public (anyone can access)

### Link on Login:
- Bottom of login form
- Text: "¿No tienes una cuenta? **Crear Cuenta**"

### Link on Signup:
- Bottom of signup form
- Text: "¿Ya tienes una cuenta? **Iniciar Sesión**"

## 🔧 Customization Options

### Add More Fields:

Edit `src/app/signup/page.tsx` to add fields like:
- Company name
- Phone number
- Job title
- Country

Example:
```typescript
const [companyName, setCompanyName] = useState("");

// In the form:
<input
  type="text"
  value={companyName}
  onChange={(e) => setCompanyName(e.target.value)}
  placeholder="Nombre de la empresa"
/>

// In signup options:
options: {
  data: {
    full_name: fullName,
    company_name: companyName,
    role: "client",
  },
}
```

### Change Password Requirements:

In `src/app/signup/page.tsx`:
```typescript
// Change minimum length
if (password.length < 8) {
  setError("La contraseña debe tener al menos 8 caracteres");
  return;
}

// Add complexity check
if (!/[A-Z]/.test(password)) {
  setError("La contraseña debe incluir al menos una mayúscula");
  return;
}
```

### Custom Success Message:

Instead of alert, create a success screen:
```typescript
const [success, setSuccess] = useState(false);

// After signup:
setSuccess(true);

// Show success message instead of form
```

## 📊 User Data Storage

When a client signs up, this data is stored:

### In auth.users:
- Email
- Encrypted password
- Created timestamp
- Confirmation status

### In user_metadata:
- full_name (from signup form)
- role: "client"
- Any other custom fields you add

### Access User Data in Dashboard:
```typescript
const { data: { user } } = await supabase.auth.getUser();

console.log(user?.email);              // Email
console.log(user?.user_metadata?.full_name);  // Full name
console.log(user?.user_metadata?.role);       // "client"
```

## ⚠️ Common Issues

### "User already registered"
- Email is already in use
- Client needs to login or reset password
- Check in Supabase if user exists

### "Email confirmation required"
- Email confirmation is enabled
- User needs to check email
- Or disable email confirmation in Supabase

### Passwords don't match
- Client needs to retype password
- Validation runs before submission

### Can't access signup page
- Check URL is `/signup`
- Make sure middleware is configured
- Clear browser cache

## 🎉 Summary

**Clients can now:**
- ✅ Register with email/password
- ✅ Register with Google
- ✅ Choose their own credentials
- ✅ Access client dashboard immediately (if email confirmation disabled)
- ✅ Reset their password if forgotten

**You (Admin) can:**
- ✅ View all signups in Supabase
- ✅ Control email confirmation settings
- ✅ Manually verify users if needed
- ✅ Change user roles
- ✅ Manage all user accounts

**Security:**
- ✅ All signups default to "client" role
- ✅ Admin access must be granted manually
- ✅ Passwords securely hashed
- ✅ Email validation
- ✅ Terms acceptance required

Your authentication system is now complete! 🚀
