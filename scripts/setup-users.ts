import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const testUsers = [
  {
    id: 'a0000000-0000-4000-8000-000000000001',
    email: 'admin@welo.com',
    password: 'Test123!',
    role: 'ADMIN',
    name: 'Admin User'
  },
  {
    id: 'a0000000-0000-4000-8000-000000000002',
    email: 'pm@welo.com',
    password: 'Test123!',
    role: 'PROJECT_MANAGER',
    name: 'Project Manager'
  },
  {
    id: 'a0000000-0000-4000-8000-000000000003',
    email: 'reviewer@welo.com',
    password: 'Test123!',
    role: 'REVIEWER',
    name: 'Reviewer User'
  },
  {
    id: 'a0000000-0000-4000-8000-000000000004',
    email: 'annotator@welo.com',
    password: 'Test123!',
    role: 'ANNOTATOR',
    name: 'Annotator User'
  },
  {
    id: 'a0000000-0000-4000-8000-000000000005',
    email: 'customer@welo.com',
    password: 'Test123!',
    role: 'CUSTOMER',
    name: 'Customer User'
  }
];

async function setupUsers() {
  console.log('🚀 Setting up test users in Supabase Auth...\n');

  for (const user of testUsers) {
    console.log(`Creating user: ${user.email} (${user.role})`);

    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          name: user.name,
          role: user.role
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          console.log(`  ⚠️  User already exists: ${user.email}`);
        } else {
          console.error(`  ❌ Error: ${error.message}`);
        }
      } else if (data.user) {
        console.log(`  ✅ Created: ${user.email} (ID: ${data.user.id})`);

        await supabase
          .from('users')
          .update({
            id: data.user.id,
            email: user.email,
            name: user.name,
            role: user.role
          })
          .eq('email', user.email);
      }
    } catch (err) {
      console.error(`  ❌ Unexpected error for ${user.email}:`, err);
    }
  }

  console.log('\n✨ User setup complete!\n');
  console.log('=== TEST ACCOUNTS ===');
  console.log('All users have password: Test123!\n');
  testUsers.forEach(user => {
    console.log(`${user.email} - ${user.role}`);
  });
  console.log('\nYou can now log in with any of these accounts.');
}

setupUsers().catch(console.error);
