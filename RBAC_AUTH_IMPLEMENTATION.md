# RBAC Authentication Implementation Guide

## Overview

This document describes the implementation of Role-Based Access Control (RBAC) authentication system for the Welo Platform, with mock JSON-based user authentication ready for future Okta integration.

## Architecture

### Backend (Auth Service - Port 3002)

#### Technology Stack
- **NestJS** - Framework
- **JWT** - Token-based authentication
- **Passport.js** - Authentication middleware
- **bcrypt** - Password hashing (for production)
- **Mock JSON** - User storage (temporary, before Okta)

#### User Roles
```typescript
enum UserRole {
  ADMIN = 'ADMIN',
  OPS_MANAGER = 'OPS_MANAGER',
  ANNOTATOR = 'ANNOTATOR',
  REVIEWER = 'REVIEWER',
  CUSTOMER = 'CUSTOMER',
}
```

#### Role-Based Permissions

| Role | Permissions |
|------|------------|
| **ADMIN** | `*` (all permissions) |
| **OPS_MANAGER** | project.*, batch.*, workflow.*, task.read, task.assign, user.read |
| **ANNOTATOR** | task.read, task.claim, task.submit, annotation.* |
| **REVIEWER** | task.read, annotation.read, annotation.review, annotation.approve/reject, quality.read |
| **CUSTOMER** | project.read, batch.read, report.read, export.download |

### Mock Users

Located at: `apps/auth-service/src/auth/mock-users.json`

```json
[
  {
    "email": "admin@welo.com",
    "password": "admin123",
    "role": "ADMIN"
  },
  {
    "email": "ops@welo.com",
    "password": "ops123",
    "role": "OPS_MANAGER"
  },
  {
    "email": "annotator@welo.com",
    "password": "annotator123",
    "role": "ANNOTATOR"
  },
  {
    "email": "reviewer@welo.com",
    "password": "reviewer123",
    "role": "REVIEWER"
  },
  {
    "email": "customer@welo.com",
    "password": "customer123",
    "role": "CUSTOMER"
  }
]
```

## Backend Implementation

### Key Files

#### 1. Auth Service (`apps/auth-service/src/auth/auth.service.ts`)

Handles authentication logic:
- Login with email/password
- User registration
- Token generation (JWT)
- Token refresh
- Session validation
- Profile management

```typescript
class AuthService {
  async login(dto: LoginDto): Promise<AuthResponse>
  async register(dto: RegisterDto): Promise<AuthResponse>
  async refreshToken(refreshToken: string): Promise<AuthResponse>
  async logout(userId: string): Promise<void>
  async getCurrentUser(userId: string): Promise<UserResponse>
  async validateUser(userId: string): Promise<User | null>
}
```

#### 2. Auth Controller (`apps/auth-service/src/auth/auth.controller.ts`)

REST API endpoints:

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/auth/login` | User login | No |
| POST | `/api/v1/auth/register` | User registration | No |
| POST | `/api/v1/auth/refresh` | Refresh access token | No |
| POST | `/api/v1/auth/logout` | User logout | Yes |
| GET | `/api/v1/auth/me` | Get current user | Yes |
| GET | `/api/v1/auth/session` | Validate session | Yes |
| PATCH | `/api/v1/auth/profile` | Update profile | Yes |
| PATCH | `/api/v1/auth/password` | Change password | Yes |

#### 3. Guards

**JWT Auth Guard** (`guards/jwt-auth.guard.ts`)
- Validates JWT tokens
- Extracts user from token
- Protects routes

**Roles Guard** (`guards/roles.guard.ts`)
- Checks user role
- Enforces role-based access

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.OPS_MANAGER)
@Get('protected-route')
async protectedRoute() { }
```

**Permissions Guard** (`guards/permissions.guard.ts`)
- Checks specific permissions
- Supports wildcard (`*`) for admin

```typescript
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('project.create', 'project.update')
@Post('create-project')
async createProject() { }
```

#### 4. JWT Strategy (`strategies/jwt.strategy.ts`)

- Extracts JWT from Authorization header
- Validates token
- Attaches user to request object

## Frontend Implementation

### Key Files

#### 1. Auth Service (`src/services/authService.ts`)

Client-side authentication service:

```typescript
class AuthService {
  async login(dto: LoginDto): Promise<AuthResponse>
  async register(dto: RegisterDto): Promise<AuthResponse>
  async refreshToken(refreshToken: string): Promise<AuthResponse>
  async logout(): Promise<void>
  async getCurrentUser(): Promise<User>
  async validateSession(): Promise<SessionResponse>
  
  // Utility methods
  hasRole(user: User, requiredRoles: UserRole[]): boolean
  hasPermission(user: User, permission: string): boolean
  hasAnyPermission(user: User, permissions: string[]): boolean
  hasAllPermissions(user: User, permissions: string[]): boolean
}
```

#### 2. Auth Redux Slice (`src/store/authSlice.ts`)

State management for authentication:

```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  initialCheckDone: boolean;
}

// Thunks
export const signIn = createAsyncThunk(...)
export const signUp = createAsyncThunk(...)
export const signOut = createAsyncThunk(...)
export const checkSession = createAsyncThunk(...)
export const getCurrentUser = createAsyncThunk(...)
export const updateProfile = createAsyncThunk(...)
```

**Token Management:**
- Stores tokens in `localStorage`
- Automatically sets tokens in all API clients
- Handles token refresh on expiration
- Clears tokens on logout

#### 3. Role-Based Route Protection

**RoleBasedRoute Component** (`src/components/RoleBasedRoute.tsx`)

```tsx
<RoleBasedRoute allowedRoles={[UserRole.ADMIN, UserRole.OPS_MANAGER]}>
  <OpsDashboard />
</RoleBasedRoute>
```

**PermissionBasedRoute Component**

```tsx
<PermissionBasedRoute 
  requiredPermissions={['project.create', 'project.update']}
  requireAll={true}
>
  <CreateProject />
</PermissionBasedRoute>
```

#### 4. Role-Based Routing (`src/App.tsx`)

Routes are now protected by role:

```tsx
// Admin only
<Route path="/admin/*" element={
  <RoleBasedRoute allowedRoles={[UserRole.ADMIN]}>
    <Layout />
  </RoleBasedRoute>
}>

// Ops Manager or Admin
<Route path="/ops/*" element={
  <RoleBasedRoute allowedRoles={[UserRole.OPS_MANAGER, UserRole.ADMIN]}>
    <Layout />
  </RoleBasedRoute>
}>

// Annotator or Admin
<Route path="/annotate/*" element={
  <RoleBasedRoute allowedRoles={[UserRole.ANNOTATOR, UserRole.ADMIN]}>
    <Layout />
  </RoleBasedRoute>
}>

// Reviewer or Admin
<Route path="/review/*" element={
  <RoleBasedRoute allowedRoles={[UserRole.REVIEWER, UserRole.ADMIN]}>
    <Layout />
  </RoleBasedRoute>
}>

// Customer or Admin
<Route path="/customer/*" element={
  <RoleBasedRoute allowedRoles={[UserRole.CUSTOMER, UserRole.ADMIN]}>
    <Layout />
  </RoleBasedRoute>
}>
```

#### 5. Login with Role-Based Redirect (`src/pages/Login.tsx`)

After successful login, users are redirected based on their role:

```typescript
switch (user.role) {
  case UserRole.ADMIN:
    navigate('/admin/dashboard');
    break;
  case UserRole.OPS_MANAGER:
    navigate('/ops/dashboard');
    break;
  case UserRole.REVIEWER:
    navigate('/review/queue');
    break;
  case UserRole.ANNOTATOR:
    navigate('/annotate/queue');
    break;
  case UserRole.CUSTOMER:
    navigate('/customer/dashboard');
    break;
}
```

## API Client Integration

### Token Management

All API clients automatically receive authentication tokens:

```typescript
// Set tokens in all API clients
const setTokensInClients = (token: string) => {
  authApi.setToken(token);
  projectManagementApi.setToken(token);
  taskManagementApi.setToken(token);
  workflowEngineApi.setToken(token);
};
```

### Automatic Token Refresh

When a 401 error occurs, the system:
1. Attempts to refresh the token using `refreshToken`
2. If successful, retries the original request
3. If failed, redirects to login

## Testing

### Test Accounts

Use these accounts to test different roles:

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Admin | admin@welo.com | admin123 | Full system access |
| Ops Manager | ops@welo.com | ops123 | Project/workflow management |
| Annotator | annotator@welo.com | annotator123 | Task annotation |
| Reviewer | reviewer@welo.com | reviewer123 | Review annotations |
| Customer | customer@welo.com | customer123 | View projects/reports |

### Testing Workflow

1. **Start Backend Services:**
```bash
cd welo-platform
npm run start:dev auth-service
npm run start:dev project-management
npm run start:dev task-management
```

2. **Start Frontend:**
```bash
cd welo-platform-ui
npm run dev
```

3. **Test Login:**
   - Go to http://localhost:5173/login
   - Login with any test account
   - Verify redirect to role-appropriate dashboard

4. **Test Access Control:**
   - Try accessing unauthorized routes (should redirect to /unauthorized)
   - Verify role-based UI elements are shown/hidden

5. **Test Token Refresh:**
   - Wait for token to expire (1 hour)
   - Make an API request
   - Verify automatic token refresh

## Migration to Okta

When ready to migrate to Okta, follow these steps:

### Backend Changes

1. **Install Okta SDK:**
```bash
npm install @okta/okta-auth-js @okta/okta-sdk-nodejs
```

2. **Replace Mock Auth Service:**
   - Remove `mock-users.json`
   - Replace `auth.service.ts` login logic with Okta authentication
   - Keep JWT generation for internal token management

3. **Update Environment Variables:**
```env
OKTA_DOMAIN=your-domain.okta.com
OKTA_CLIENT_ID=your-client-id
OKTA_CLIENT_SECRET=your-client-secret
OKTA_ISSUER=https://your-domain.okta.com/oauth2/default
```

4. **Okta User Sync:**
   - Create a background job to sync users from Okta
   - Map Okta groups to application roles
   - Store role assignments in database

### Frontend Changes

1. **Install Okta React SDK:**
```bash
npm install @okta/okta-react @okta/okta-auth-js
```

2. **Replace authService.ts Login:**
```typescript
// Before: Mock login
await authService.login({ email, password })

// After: Okta login
const oktaAuth = new OktaAuth({...});
await oktaAuth.signInWithCredentials({ username, password });
```

3. **Update Token Storage:**
   - Use Okta tokens instead of custom JWT
   - Keep role/permission mapping from backend

## Security Considerations

### Current Implementation (Mock)

✅ JWT tokens with 1-hour expiration
✅ Refresh tokens with 7-day expiration
✅ Password validation (min 6 characters)
✅ Role-based access control
✅ Permission-based access control
✅ Token stored in localStorage (with HttpOnly cookie recommended for production)
⚠️ Passwords stored in plain text (mock only)

### Production Recommendations

When moving to production:

1. **Enable HTTPS** - All communication must be encrypted
2. **Use HttpOnly Cookies** - Store tokens in secure cookies instead of localStorage
3. **Implement CSRF Protection** - Use CSRF tokens for state-changing operations
4. **Add Rate Limiting** - Prevent brute force attacks
5. **Enable Password Hashing** - Use bcrypt with proper salt rounds
6. **Audit Logging** - Log all authentication events
7. **Multi-Factor Authentication** - Add MFA support via Okta
8. **Session Management** - Implement proper session invalidation

## Troubleshooting

### Common Issues

**1. 401 Unauthorized Error**
- Check if token is expired
- Verify token is being sent in Authorization header
- Check backend JWT secret matches

**2. Redirect Loop**
- Clear localStorage tokens
- Check initial session check in authSlice
- Verify redirect logic in Login component

**3. Role Access Denied**
- Verify user role in Redux state
- Check allowedRoles array in RoleBasedRoute
- Inspect user object from /auth/me endpoint

**4. Token Not Refreshing**
- Check refreshToken in localStorage
- Verify refresh endpoint is working
- Check token expiration time

## API Response Format

All auth endpoints follow standard format:

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 3600,
    "user": {
      "id": "user-123",
      "email": "user@welo.com",
      "name": "User Name",
      "role": "ANNOTATOR",
      "permissions": ["task.read", "task.submit"],
      "status": "ACTIVE",
      "createdAt": "2026-01-01T00:00:00Z"
    }
  },
  "message": "Login successful"
}
```

## Next Steps

1. ✅ **COMPLETED**: Backend Auth Service with mock JSON users
2. ✅ **COMPLETED**: Frontend authService integration
3. ✅ **COMPLETED**: Redux auth slice migration
4. ✅ **COMPLETED**: Role-based routing
5. ✅ **COMPLETED**: Real userId integration in components
6. 🔄 **TODO**: Test all role-based access scenarios
7. 🔄 **TODO**: Add integration tests
8. 🔄 **TODO**: Implement Okta migration
9. 🔄 **TODO**: Add audit logging
10. 🔄 **TODO**: Production security hardening

## Summary

The RBAC authentication system is now fully implemented with:

- ✅ Complete backend Auth Service with JWT
- ✅ 5 user roles with granular permissions
- ✅ Mock JSON user storage (Okta-ready)
- ✅ Frontend authService abstraction
- ✅ Redux state management for auth
- ✅ Role-based and permission-based route protection
- ✅ Automatic token refresh
- ✅ Real userId integration across all components
- ✅ Unauthorized page with role-based redirects

The system is production-ready for mock authentication and designed for seamless Okta integration.
