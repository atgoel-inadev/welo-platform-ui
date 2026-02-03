import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file manually
const envPath = join(__dirname, '..', '.env');
const envContent = readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const testUsers = [
  {
    email: 'admin@welo.com',
    password: 'Test123!',
    name: 'Admin User',
    role: 'ADMIN'
  },
  {
    email: 'pm@welo.com',
    password: 'Test123!',
    name: 'Project Manager',
    role: 'PROJECT_MANAGER'
  },
  {
    email: 'reviewer@welo.com',
    password: 'Test123!',
    name: 'Reviewer User',
    role: 'REVIEWER'
  },
  {
    email: 'annotator@welo.com',
    password: 'Test123!',
    name: 'Annotator User',
    role: 'ANNOTATOR'
  },
  {
    email: 'customer@welo.com',
    password: 'Test123!',
    name: 'Customer User',
    role: 'CUSTOMER'
  }
];

async function createTestUsers() {
  console.log('🚀 Creating test users...\n');

  for (const user of testUsers) {
    console.log(`Creating: ${user.email} (${user.role})`);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            name: user.name,
            role: user.role
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          console.log(`  ⚠️  User already exists`);
        } else {
          console.log(`  ❌ Error: ${error.message}`);
        }
      } else if (data.user) {
        console.log(`  ✅ Created successfully`);

        // Update the users table with role
        const { error: updateError } = await supabase
          .from('users')
          .update({
            name: user.name,
            role: user.role
          })
          .eq('id', data.user.id);

        if (updateError) {
          console.log(`  ⚠️  Role update failed: ${updateError.message}`);
        }
      }
    } catch (err) {
      console.log(`  ❌ Unexpected error:`, err.message);
    }
  }

  console.log('\n✨ Setup complete!\n');
  console.log('=== TEST ACCOUNTS ===');
  console.log('Password for all: Test123!\n');
  testUsers.forEach(u => console.log(`${u.email.padEnd(25)} - ${u.role}`));
}

createTestUsers().catch(console.error);
