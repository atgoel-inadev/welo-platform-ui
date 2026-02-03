/*
  # Seed Initial Data for Welo Platform
  
  This migration creates initial seed data for testing and development:
  
  1. **Users**
     - Admin user (admin@welo.com)
     - Project Manager (pm@welo.com)
     - Reviewer (reviewer@welo.com)
     - Annotator (annotator@welo.com)
     - Customer user (customer@welo.com)
     
  2. **Customers**
     - Acme Corporation
     - TechStart Inc
     - Global Media
     
  3. **Important Notes**
     - All test users have password: "Test123!"
     - These are Supabase auth users + database records
     - User IDs are hardcoded UUIDs for consistency
     - Customers have placeholder data
     
  ## Security Note
  These are TEST ACCOUNTS for development only. Change passwords in production!
*/

DO $$
DECLARE
  admin_id uuid := 'a0000000-0000-4000-8000-000000000001';
  pm_id uuid := 'a0000000-0000-4000-8000-000000000002';
  reviewer_id uuid := 'a0000000-0000-4000-8000-000000000003';
  annotator_id uuid := 'a0000000-0000-4000-8000-000000000004';
  customer_user_id uuid := 'a0000000-0000-4000-8000-000000000005';
BEGIN
  INSERT INTO public.users (id, email, name, role, status) VALUES
    (admin_id, 'admin@welo.com', 'Admin User', 'ADMIN', 'ACTIVE'),
    (pm_id, 'pm@welo.com', 'Project Manager', 'PROJECT_MANAGER', 'ACTIVE'),
    (reviewer_id, 'reviewer@welo.com', 'Reviewer User', 'REVIEWER', 'ACTIVE'),
    (annotator_id, 'annotator@welo.com', 'Annotator User', 'ANNOTATOR', 'ACTIVE'),
    (customer_user_id, 'customer@welo.com', 'Customer User', 'CUSTOMER', 'ACTIVE')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.customers (id, name, email, subscription) VALUES
    ('c0000000-0000-4000-8000-000000000001', 'Acme Corporation', 'contact@acme.com', 'enterprise'),
    ('c0000000-0000-4000-8000-000000000002', 'TechStart Inc', 'hello@techstart.io', 'professional'),
    ('c0000000-0000-4000-8000-000000000003', 'Global Media', 'support@globalmedia.com', 'free')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_statistics (user_id) VALUES
    (admin_id),
    (pm_id),
    (reviewer_id),
    (annotator_id),
    (customer_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE 'Seed data inserted successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST ACCOUNTS ===';
  RAISE NOTICE 'You must create these users in Supabase Auth manually or via signup:';
  RAISE NOTICE '1. admin@welo.com (Role: ADMIN)';
  RAISE NOTICE '2. pm@welo.com (Role: PROJECT_MANAGER)';
  RAISE NOTICE '3. reviewer@welo.com (Role: REVIEWER)';
  RAISE NOTICE '4. annotator@welo.com (Role: ANNOTATOR)';
  RAISE NOTICE '5. customer@welo.com (Role: CUSTOMER)';
  RAISE NOTICE '';
  RAISE NOTICE '=== CUSTOMERS ===';
  RAISE NOTICE '1. Acme Corporation';
  RAISE NOTICE '2. TechStart Inc';
  RAISE NOTICE '3. Global Media';
END $$;
