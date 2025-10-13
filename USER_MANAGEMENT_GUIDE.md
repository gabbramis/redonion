# User Management in Supabase - Complete Guide

## 🔍 Where Are Your Users Stored?

### Short Answer:
**NO, you don't need to create a users table!** Supabase automatically manages users in a special authentication schema.

### Where to Find Your Users:

1. **Go to your Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/wahbclijcunielcwczzp

2. **Navigate to Authentication → Users**
   - In the left sidebar, click **Authentication**
   - Then click **Users**
   - You'll see ALL your users here!

3. **What You'll See:**
   - Email addresses
   - Provider (email, google, etc.)
   - Created date
   - Last sign in
   - User ID (UUID)
   - Confirmation status

## 📊 User Data Structure

Supabase stores users in the `auth.users` table (managed automatically):

```sql
auth.users
├── id (UUID)                    # Unique user ID
├── email                        # User email
├── encrypted_password           # Hashed password
├── email_confirmed_at           # Email verification timestamp
├── created_at                   # Account creation date
├── updated_at                   # Last update
├── last_sign_in_at             # Last login time
├── raw_user_meta_data          # Custom data (role, name, etc.)
├── raw_app_meta_data           # App-specific data
└── provider                     # Auth method (email, google, etc.)
```

## 🎯 Do You Need a Custom Users Table?

### You DON'T need a custom table if you only need:
- ✅ Email
- ✅ Password authentication
- ✅ OAuth authentication
- ✅ Basic user identification
- ✅ Role (can use metadata)

### You SHOULD create a custom table if you need:
- 📝 User profiles (bio, avatar, phone)
- 📊 Additional user data (company, address, preferences)
- 💼 Client-specific information (contract details, billing info)
- 📈 User activity tracking
- 🔗 Relationships with other tables (projects, invoices, etc.)

## 🛠️ Current Setup (What You Have Now)

Your current implementation uses:

1. **auth.users** - Built-in Supabase table
   - Stores: email, password, OAuth data
   - Managed automatically
   - No SQL needed

2. **User Metadata** - For storing role
   ```javascript
   user.user_metadata.role // "admin" or "client"
   ```

3. **Email-based Admin Check**
   ```javascript
   user.email === "gabrielaramis01@gmail.com" // is admin
   ```

This is **PERFECT** for your current needs! ✅

## 📱 How to View and Manage Users

### View All Users:
1. Supabase Dashboard → Authentication → Users
2. See all users, their emails, and login methods

### View User Details:
1. Click on any user in the list
2. See full user information
3. View metadata
4. See login history

### Manually Add a User:
1. Authentication → Users
2. Click "Add user" → "Create new user"
3. Enter email and password
4. Toggle "Auto Confirm User" (recommended)
5. Click "Create user"

### Edit User Role:
1. Click on a user
2. Scroll to "User Metadata"
3. Click "Edit"
4. Add:
   ```json
   {
     "role": "admin"
   }
   ```
5. Save

### Delete a User:
1. Click on a user
2. Click "Delete user"
3. Confirm deletion

## 🔮 When to Create a Custom Profiles Table

### Example: If you want to store client profiles

**Create a profiles table:**

```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  company_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);
```

**Auto-create profile when user signs up:**

```sql
-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

## 🎯 Recommended Approach for Your Project

### Phase 1 (Current - Working Perfect! ✅)
- Use built-in `auth.users`
- Store role in metadata
- Email-based admin check
- **No custom tables needed**

### Phase 2 (When you need more features)
Create `profiles` table for:
- Client company information
- Contact details
- Profile pictures
- Custom settings

Create `projects` table for:
- Client projects
- Project details
- Status tracking
- Assigned to users

Create `messages` table for:
- Client-admin communication
- Support tickets
- Notifications

## 📊 Example: Querying Users in Your Code

### Get current user:
```typescript
const { data: { user } } = await supabase.auth.getUser()
console.log(user?.email)
console.log(user?.id)
console.log(user?.user_metadata?.role)
```

### Get all users (admin only):
```typescript
// Note: This requires admin privileges
const { data: { users } } = await supabase.auth.admin.listUsers()
```

### Check if user is admin:
```typescript
const isAdmin = user?.email === "gabrielaramis01@gmail.com" ||
                user?.user_metadata?.role === "admin"
```

## 🔒 Security Best Practices

1. **Don't expose auth.users directly**
   - It's in a protected schema
   - Only accessible via Supabase Auth API

2. **Use Row Level Security (RLS)**
   - When you create custom tables
   - Prevents unauthorized access

3. **Store sensitive data securely**
   - Never store passwords yourself (Supabase handles it)
   - Use metadata for non-sensitive info
   - Use custom tables for sensitive client data

## 📋 Quick Reference

| What You Need | Where It's Stored | Action Required |
|---------------|-------------------|-----------------|
| User email | `auth.users` | ✅ Automatic |
| User password | `auth.users` | ✅ Automatic |
| OAuth data | `auth.users` | ✅ Automatic |
| User role | `auth.users.user_metadata` | ✅ Already set up |
| User ID | `auth.users.id` | ✅ Automatic |
| Login history | `auth.users` | ✅ Automatic |
| Client profile | Need custom table | 🔄 Future phase |
| Projects | Need custom table | 🔄 Future phase |
| Messages | Need custom table | 🔄 Future phase |

## 🎉 Summary

**For now, you're all set!**

- ✅ Users are automatically stored in `auth.users`
- ✅ View them in: Dashboard → Authentication → Users
- ✅ No custom tables needed yet
- ✅ Role management working via metadata
- ✅ Everything is secure and scalable

**Create custom tables when you need:**
- Client profile information
- Project management
- Invoicing
- File uploads
- Custom features

Until then, the built-in authentication is perfect! 🚀
