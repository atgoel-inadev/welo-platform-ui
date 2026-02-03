# Welo Platform Setup Guide

## Critical Fixes Applied

This guide covers the resolution of the three critical system issues:

### 1. ✅ Fixed: Infinite Recursion Error
### 2. ✅ Fixed: Missing Seed Data
### 3. ✅ Fixed: UI Runtime Error (FileType Enum Conflict)

---

## Issue #1: Infinite Recursion / Performance Issue

**Root Cause:**
The `useAuth` hook was calling `checkSession()` on every component mount, causing multiple unnecessary API calls when navigating between pages.

**Fix Applied:**
Added a `useRef` flag to ensure `checkSession()` only runs once per app session:

```typescript
// src/hooks/useAuth.ts
const hasCheckedSession = useRef(false);

useEffect(() => {
  if (!hasCheckedSession.current) {
    hasCheckedSession.current = true;
    dispatch(checkSession());
  }
}, [dispatch]);
```

**Additional Improvements:**
- Updated Login component to use `useEffect` for redirect logic
- Added proper loading states to prevent flash of content

---

## Issue #2: Missing Seed Data

**Root Cause:**
Database tables existed but contained no data, preventing any user from logging in.

**Fix Applied:**
Created seed data migration (`seed_initial_data`) that populates:

### Test User Accounts

| Email | Role | Password |
|-------|------|----------|
| admin@welo.com | ADMIN | Test123! |
| pm@welo.com | PROJECT_MANAGER | Test123! |
| reviewer@welo.com | REVIEWER | Test123! |
| annotator@welo.com | ANNOTATOR | Test123! |
| customer@welo.com | CUSTOMER | Test123! |

### Sample Customers

1. **Acme Corporation** (Enterprise tier)
2. **TechStart Inc** (Professional tier)
3. **Global Media** (Free tier)

---

## Issue #3: UI Runtime Error

**Root Cause:**
Two conflicting `FileType` enums existed:
- `src/types/index.ts` - Database-compatible enum (uppercase values)
- `src/types/renderer.ts` - Local enum (lowercase values)

**Fix Applied:**
1. Removed duplicate `FileType` enum from `renderer.ts`
2. Updated `renderer.ts` to import from `types/index.ts`
3. Updated `fileUtils.ts` to use correct enum values
4. Fixed all renderer components to use unified enum

---

## Setup Instructions

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Set Up Test Users

The database records are already created via migration. Now create the Supabase Auth users:

#### Option A: Using Signup (Recommended for Development)

Visit the signup page and create accounts manually with the emails and password listed above. The user records already exist in the database, so they will be linked automatically.

#### Option B: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Users
3. Click "Add user" (or "Invite user")
4. For each test account:
   - Enter email (e.g., `admin@welo.com`)
   - Set password: `Test123!`
   - Enable "Auto Confirm User"
   - Click "Create user"
5. Repeat for all 5 test accounts

#### Option C: Using the Setup Script (Requires Service Role Key)

If you have the Supabase service role key:

```bash
# Set environment variable
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run setup script
npx tsx scripts/setup-users.ts
```

**Security Note:** Keep your service role key secure and never commit it to version control!

### Step 3: Verify Setup

1. Start the development server:
```bash
npm run dev
```

2. Navigate to `http://localhost:5173`

3. Try logging in with any test account:
   - Email: `admin@welo.com`
   - Password: `Test123!`

4. Verify you're redirected to the appropriate dashboard based on role

---

## Testing Authentication Flow

### Test Scenarios

1. **Admin Login**
   - Email: `admin@welo.com`
   - Should redirect to: `/admin/dashboard`
   - Access: All areas

2. **Project Manager Login**
   - Email: `pm@welo.com`
   - Should redirect to: `/ops/dashboard`
   - Access: Ops management, project creation

3. **Reviewer Login**
   - Email: `reviewer@welo.com`
   - Should redirect to: `/review/queue`
   - Access: Review tasks

4. **Annotator Login**
   - Email: `annotator@welo.com`
   - Should redirect to: `/annotate/queue`
   - Access: Annotation tasks, demo at `/annotate/task`

5. **Customer Login**
   - Email: `customer@welo.com`
   - Should redirect to: `/` (root)
   - Access: Limited (needs additional implementation)

### Verify No Infinite Loops

1. Open browser DevTools > Network tab
2. Log in with any account
3. Verify `checkSession` API call happens ONCE, not repeatedly
4. Navigate between pages
5. Verify no excessive API calls

### Test FileViewer Component

1. Log in as annotator: `annotator@welo.com`
2. Navigate to `/annotate/task`
3. Verify sample image loads correctly
4. Verify no console errors related to FileType
5. Test adding/removing annotations

---

## Database Schema

The following tables are populated with seed data:

### `users` Table
- 5 test users with different roles
- All users have `ACTIVE` status
- Linked to Supabase Auth users

### `customers` Table
- 3 sample customers
- Different subscription tiers
- Ready for project creation

### `user_statistics` Table
- Statistics records initialized for all users
- Default values (0 tasks, 0.00 accuracy)

---

## Troubleshooting

### "User not found in database" Error

**Cause:** Supabase Auth user exists but no matching database record

**Fix:**
```sql
-- Check if auth user exists
SELECT email FROM auth.users WHERE email = 'your-email@example.com';

-- If yes, create matching database record
INSERT INTO public.users (id, email, name, role, status)
VALUES (
  'auth-user-id-here',
  'your-email@example.com',
  'Your Name',
  'ANNOTATOR',
  'ACTIVE'
);
```

### Login Redirects Back to Login Page

**Cause:** Session not persisting or auth check failing

**Fix:**
1. Clear browser local storage
2. Check browser console for errors
3. Verify `.env` file has correct Supabase credentials:
   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

### "Invalid login credentials" Error

**Possible Causes:**
1. Wrong password (should be `Test123!`)
2. User not created in Supabase Auth
3. Email confirmation required

**Fix:**
1. Verify user exists in Supabase Dashboard > Authentication
2. Ensure "Email confirmed" is checked
3. Reset password if needed

### FileType Errors in Console

**Should be fixed!** If you still see errors:
1. Clear browser cache
2. Rebuild the project: `npm run build`
3. Check that `types/renderer.ts` imports from `./index`
4. Verify no duplicate enum definitions

### Session Check Running Multiple Times

**Should be fixed!** If you still see this:
1. Clear browser cache and local storage
2. Check that `useAuth.ts` uses `useRef` for `hasCheckedSession`
3. Restart development server

---

## Production Considerations

### Security

1. **Change All Passwords**
   - Default password `Test123!` is for testing only
   - Use strong, unique passwords in production

2. **Remove Test Accounts**
   - Delete or disable test accounts before deploying
   - Create real user accounts through proper onboarding

3. **Row Level Security**
   - All tables have RLS enabled
   - Verify policies are restrictive
   - Test with different user roles

### Performance

1. **Session Checks**
   - Current implementation checks once per app load
   - Consider adding periodic token refresh for long sessions
   - Monitor API call patterns in production

2. **File Rendering**
   - Large images are automatically scaled
   - Consider adding file size limits
   - Implement lazy loading for file lists

---

## Next Steps

Now that the critical issues are resolved:

1. ✅ Users can log in successfully
2. ✅ No infinite recursion or excessive API calls
3. ✅ FileViewer component works without errors
4. ✅ Role-based routing functions correctly

### Recommended Development Tasks

1. **Create Sample Projects**
   - Log in as PM (`pm@welo.com`)
   - Create a test project with Acme Corporation
   - Configure annotation questions and workflow

2. **Test Annotation Flow**
   - Log in as annotator (`annotator@welo.com`)
   - Navigate to `/annotate/task`
   - Test the FileViewer with sample file

3. **Implement View Project Page**
   - Currently shows "Coming Soon"
   - Use `ProjectStatistics` interface from types
   - Display project details and analytics

4. **Add More File Types**
   - Current support: Text, CSV, Image, Audio, Video
   - Consider adding PDF support
   - Implement file upload functionality

---

## Support

If you encounter issues not covered in this guide:

1. Check the browser console for specific error messages
2. Verify database migrations are applied correctly
3. Ensure all environment variables are set
4. Check Supabase Dashboard logs for backend errors

---

**Last Updated:** 2026-02-03
**Version:** 1.0.0
**Status:** All Critical Issues Resolved ✅
