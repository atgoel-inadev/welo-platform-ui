#!/usr/bin/env node

/**
 * Quick Start Script for RBAC Authentication Testing
 * 
 * This script helps you quickly test the authentication system
 * by providing test credentials and making sample API calls.
 */

const axios = require('axios');

const AUTH_SERVICE_URL = 'http://localhost:3002/api/v1/auth';

// Test accounts
const testAccounts = [
  {
    email: 'admin@welo.com',
    password: 'admin123',
    role: 'ADMIN',
    description: 'Full system access',
  },
  {
    email: 'ops@welo.com',
    password: 'ops123',
    role: 'OPS_MANAGER',
    description: 'Project and workflow management',
  },
  {
    email: 'annotator@welo.com',
    password: 'annotator123',
    role: 'ANNOTATOR',
    description: 'Task annotation',
  },
  {
    email: 'reviewer@welo.com',
    password: 'reviewer123',
    role: 'REVIEWER',
    description: 'Annotation review',
  },
  {
    email: 'customer@welo.com',
    password: 'customer123',
    role: 'CUSTOMER',
    description: 'View projects and reports',
  },
];

async function testLogin(email, password) {
  try {
    console.log(`\n🔐 Testing login for: ${email}`);
    
    const response = await axios.post(`${AUTH_SERVICE_URL}/login`, {
      email,
      password,
    });

    if (response.data.success) {
      const { user, accessToken } = response.data.data;
      console.log('✅ Login successful!');
      console.log(`   User: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Permissions: ${user.permissions.slice(0, 5).join(', ')}${user.permissions.length > 5 ? '...' : ''}`);
      console.log(`   Token: ${accessToken.substring(0, 20)}...`);
      
      return response.data.data;
    }
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testGetCurrentUser(accessToken) {
  try {
    console.log('\n👤 Testing /auth/me endpoint...');
    
    const response = await axios.get(`${AUTH_SERVICE_URL}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.data.success) {
      const user = response.data.data;
      console.log('✅ User profile retrieved!');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Status: ${user.status}`);
    }
  } catch (error) {
    console.error('❌ Get current user failed:', error.response?.data?.message || error.message);
  }
}

async function testSessionValidation(accessToken) {
  try {
    console.log('\n✓ Testing session validation...');
    
    const response = await axios.get(`${AUTH_SERVICE_URL}/session`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.data.success) {
      console.log('✅ Session is valid!');
      console.log(`   Valid: ${response.data.data.valid}`);
    }
  } catch (error) {
    console.error('❌ Session validation failed:', error.response?.data?.message || error.message);
  }
}

async function testRefreshToken(refreshToken) {
  try {
    console.log('\n🔄 Testing token refresh...');
    
    const response = await axios.post(`${AUTH_SERVICE_URL}/refresh`, {
      refreshToken,
    });

    if (response.data.success) {
      console.log('✅ Token refreshed successfully!');
      const newToken = response.data.data.accessToken;
      console.log(`   New Token: ${newToken.substring(0, 20)}...`);
      return newToken;
    }
  } catch (error) {
    console.error('❌ Token refresh failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testLogout(accessToken) {
  try {
    console.log('\n🚪 Testing logout...');
    
    const response = await axios.post(`${AUTH_SERVICE_URL}/logout`, {}, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.data.success) {
      console.log('✅ Logout successful!');
    }
  } catch (error) {
    console.error('❌ Logout failed:', error.response?.data?.message || error.message);
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   WELO PLATFORM - RBAC AUTHENTICATION TEST SUITE');
  console.log('═══════════════════════════════════════════════════════════════');
  
  console.log('\n📋 Available Test Accounts:');
  testAccounts.forEach((account, index) => {
    console.log(`   ${index + 1}. ${account.role.padEnd(15)} - ${account.email.padEnd(25)} - ${account.description}`);
  });

  console.log('\n🚀 Starting Authentication Tests...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Test with Admin account
  const account = testAccounts[0]; // Admin
  const loginData = await testLogin(account.email, account.password);
  
  if (loginData) {
    const { accessToken, refreshToken } = loginData;
    
    // Test protected endpoints
    await testGetCurrentUser(accessToken);
    await testSessionValidation(accessToken);
    
    // Test token refresh
    const newToken = await testRefreshToken(refreshToken);
    
    // Test logout
    if (newToken) {
      await testLogout(newToken);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('   TEST SUITE COMPLETED');
  console.log('═══════════════════════════════════════════════════════════════');
  
  console.log('\n📚 Next Steps:');
  console.log('   1. Open http://localhost:5173/login in your browser');
  console.log('   2. Login with any test account from the list above');
  console.log('   3. You will be redirected to the role-appropriate dashboard');
  console.log('   4. Try accessing unauthorized routes to test access control');
  
  console.log('\n💡 Tips:');
  console.log('   - Admin has access to all routes');
  console.log('   - Each role has specific permissions and routes');
  console.log('   - Check RBAC_AUTH_IMPLEMENTATION.md for detailed documentation');
  console.log('');
}

// Check if auth service is running
async function checkService() {
  try {
    await axios.get(`${AUTH_SERVICE_URL.replace('/auth', '')}/health`).catch(() => {
      // Try without health endpoint
      return axios.get(AUTH_SERVICE_URL.replace('/api/v1/auth', ''));
    });
    return true;
  } catch (error) {
    console.error('❌ Auth Service is not running!');
    console.log('\n📝 To start the service:');
    console.log('   cd welo-platform');
    console.log('   npm run start:dev auth-service');
    console.log('');
    return false;
  }
}

checkService().then(isRunning => {
  if (isRunning) {
    main().catch(console.error);
  }
});
