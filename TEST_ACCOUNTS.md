# Test Accounts Quick Reference

## 🔑 Login Credentials

All accounts use the same password: **Test123!**

### Administrator Account
- **Email:** admin@welo.com
- **Password:** Test123!
- **Role:** ADMIN
- **Access:** Full system access
- **Default Route:** `/admin/dashboard`

### Project Manager Account
- **Email:** pm@welo.com
- **Password:** Test123!
- **Role:** PROJECT_MANAGER
- **Access:** Ops management, project creation
- **Default Route:** `/ops/dashboard`

### Reviewer Account
- **Email:** reviewer@welo.com
- **Password:** Test123!
- **Role:** REVIEWER
- **Access:** Review queue, task review
- **Default Route:** `/review/queue`

### Annotator Account
- **Email:** annotator@welo.com
- **Password:** Test123!
- **Role:** ANNOTATOR
- **Access:** Annotation tasks, task history
- **Default Route:** `/annotate/queue`
- **Demo:** `/annotate/task` - FileViewer demo

### Customer Account
- **Email:** customer@welo.com
- **Password:** Test123!
- **Role:** CUSTOMER
- **Access:** Limited (needs implementation)
- **Default Route:** `/`

---

## 🏢 Sample Customers

### Acme Corporation
- **ID:** c0000000-0000-4000-8000-000000000001
- **Email:** contact@acme.com
- **Tier:** Enterprise
- **Use:** Test project creation

### TechStart Inc
- **ID:** c0000000-0000-4000-8000-000000000002
- **Email:** hello@techstart.io
- **Tier:** Professional
- **Use:** Mid-tier testing

### Global Media
- **ID:** c0000000-0000-4000-8000-000000000003
- **Email:** support@globalmedia.com
- **Tier:** Free
- **Use:** Basic tier testing

---

## 🚀 Quick Start

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open browser:**
   ```
   http://localhost:5173
   ```

3. **Login with any account above**

4. **Test role-based features**

---

## ⚠️ Security Notice

These are **TEST ACCOUNTS ONLY** for development and testing purposes.

**Before Production:**
- ✅ Change all passwords
- ✅ Remove or disable test accounts
- ✅ Use strong, unique passwords
- ✅ Enable 2FA for admin accounts
- ✅ Implement proper user onboarding

---

## 📝 Notes

- First time login may require creating the Supabase Auth user
- See `SETUP_GUIDE.md` for setup instructions
- All accounts have RLS policies applied
- Statistics tracking is initialized for all users
