# Supabase & Custom API Audit Report

**Date:** February 4, 2026  
**Scope:** Complete UI codebase analysis for Supabase dependencies and non-existent backend APIs

---

## Executive Summary

### Status Overview
- ✅ **Annotator Workflow:** 90% migrated (Supabase removed)
- ✅ **Reviewer Workflow:** 90% migrated (Supabase removed)
- ✅ **Project Management:** 75% migrated (partial Supabase removal)
- ❌ **Authentication:** 0% migrated (full Supabase dependency)
- ❌ **Workflow Management:** 0% migrated (full Supabase dependency)
- ✅ **Admin Dashboard:** Static only (no API calls)

### Critical Issues
1. **Authentication** is completely dependent on Supabase
2. **Workflow Store** uses Supabase for all CRUD operations
3. **ProjectsSlice** has mixed Supabase/Backend API code (corrupted during migration)
4. No workflow service layer exists to integrate with Workflow Engine backend

---

## 🔴 CRITICAL: Supabase Dependencies

### 1. Authentication System (authSlice.ts)
**Status:** ⚠️ **BLOCKING ISSUE - 100% Supabase dependent**

**File:** `src/store/authSlice.ts`

**Supabase Usage:**
```typescript
// Line 2: Import
import { supabase } from '../lib/supabase';

// Line 27-28: Sign In
const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
  email, password
});

// Line 34-37: Get User from Supabase DB
const { data: userData, error: userError } = await supabase
  .from('users')
  .select('*')
  .eq('email', email)

// Line 55-56: Sign Up
const { data: authData, error: authError } = await supabase.auth.signUp({
  email, password
});

// Line 63-73: Insert User Record
const { data: userData, error: userError } = await supabase
  .from('users')
  .insert([...])
  .select()

// Line 88: Sign Out
const { error } = await supabase.auth.signOut();

// Line 102: Check Session
const sessionPromise = supabase.auth.getSession();

// Line 113-116: Get User Profile
const userPromise = supabase
  .from('users')
  .select('*')
  .eq('id', session.user.id)
```

**Required Backend Integration:**
- Auth Service (Port 3002) - Currently **27.5% complete**
- Endpoints needed:
  - `POST /auth/login`
  - `POST /auth/register`
  - `POST /auth/logout`
  - `POST /auth/refresh`
  - `GET /auth/me`
  - `GET /auth/session`

**Impact:** 🚨 **BLOCKER - All authenticated features broken without this**

---

### 2. Workflow Management Store (workflowStore.ts)
**Status:** ⚠️ **HIGH PRIORITY - 100% Supabase dependent**

**File:** `src/store/workflowStore.ts`

**Supabase Usage:**
```typescript
// Line 5: Import
import { supabase } from '../lib/supabase';

// Line 113: List Workflows
let query = supabase.from('workflows').select('*');

// Line 133-136: Get Workflow by ID
const { data, error } = await supabase
  .from('workflows')
  .select('*')
  .eq('id', workflowId)

// Line 156-165: Create Workflow
const { data: userData } = await supabase.auth.getUser();
const { data, error } = await supabase
  .from('workflows')
  .insert({...})
  .select()

// Line 187-190: Update Workflow
const { error } = await supabase
  .from('workflows')
  .update(updates)
  .eq('id', workflowId)

// Line 213-216: Delete Workflow
const { error } = await supabase
  .from('workflows')
  .delete()
  .eq('id', workflowId)

// Line 245-249: Save Workflow Data
const { error } = await supabase
  .from('workflows')
  .update({...})
  .eq('id', currentWorkflow.id)
```

**Required Backend Integration:**
- Workflow Engine (Port 3007) - Currently **95% complete**
- Backend endpoints **EXIST** but not integrated:
  - `GET /workflows`
  - `GET /workflows/:id`
  - `POST /workflows`
  - `PATCH /workflows/:id`
  - `DELETE /workflows/:id`
  - `POST /workflows/:id/publish`
  - `GET /workflows/:id/instances`

**Impact:** 🟡 **HIGH - Workflow builder cannot save/load workflows**

---

### 3. Projects Slice (projectsSlice.ts)
**Status:** 🔴 **CORRUPTED - Mixed Supabase/Backend code**

**File:** `src/store/projectsSlice.ts`

**Issues Found:**
```typescript
// Lines 77-85: createProject - CORRUPTED CODE
export const createProject = createAsyncThunk(
  'projects/createProject',
  async ({ input, userId }: { input: CreateProjectInput; userId: string }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase          // ❌ SUPABASE
        .from('projects')
        .insert([...])
        project = await projectService.createProject(input, userId);  // ❌ SYNTAX ERROR
      return pject = createAsyncThunk(                // ❌ CORRUPTED

// Lines 90-101: updateProject - CORRUPTED CODE  
      const { data, error } = await supabase          // ❌ SUPABASE
        .from('projects')
        .update(input)
      const project = await projectService.updateProject(id, input);  // ❌ MIXED CODE
      return pr as Error;                             // ❌ SYNTAX ERROR

// Lines 122-141: cloneProject - CORRUPTED CODE
      const { data: originalProject, error: fetchError } = await supabase  // ❌ SUPABASE
        .from('projects')
      await projectService.deleteProject(projectId);  // ❌ WRONG METHOD CALL
      const { data: clonedProject, error: createError } = await supabase  // ❌ SUPABASE
        .from('projects')
        .insert([...])
      const project = await projectService.cloneProject(projectId, newName, false);  // ❌ MIXED CODE
```

**Root Cause:** Incomplete migration - old Supabase code not fully replaced

**Impact:** 🔴 **CRITICAL - Project creation/update will fail at runtime**

---

## 🟡 Missing Backend Services

### 1. Workflow Service Layer
**Status:** ❌ **DOES NOT EXIST**

**Required File:** `src/services/workflowService.ts`

**Needed Methods:**
```typescript
class WorkflowService {
  // Should integrate with Workflow Engine (port 3007)
  fetchWorkflows(filters?: WorkflowFilterDto): Promise<PaginatedResponse<Workflow>>
  fetchWorkflowById(id: string): Promise<Workflow>
  createWorkflow(input: CreateWorkflowDto): Promise<Workflow>
  updateWorkflow(id: string, input: UpdateWorkflowDto): Promise<Workflow>
  deleteWorkflow(id: string): Promise<void>
  publishWorkflow(id: string): Promise<Workflow>
  getWorkflowInstances(workflowId: string): Promise<WorkflowInstance[]>
  createWorkflowInstance(workflowId: string, taskId: string): Promise<WorkflowInstance>
  sendWorkflowEvent(instanceId: string, event: WorkflowEvent): Promise<WorkflowInstance>
}
```

**Backend Availability:** ✅ Workflow Engine endpoints **EXIST** (95% complete)

**Impact:** 🟡 **HIGH - Cannot use backend workflow features**

---

### 2. Auth Service Layer
**Status:** ❌ **DOES NOT EXIST**

**Required File:** `src/services/authService.ts`

**Needed Methods:**
```typescript
class AuthService {
  // Should integrate with Auth Service (port 3002)
  login(email: string, password: string): Promise<AuthResponse>
  register(input: RegisterDto): Promise<AuthResponse>
  logout(): Promise<void>
  refreshToken(): Promise<TokenResponse>
  getCurrentUser(): Promise<User>
  checkSession(): Promise<Session>
  updateProfile(input: UpdateProfileDto): Promise<User>
  changePassword(oldPassword: string, newPassword: string): Promise<void>
}
```

**Backend Availability:** ⚠️ Auth Service **27.5% complete** (needs implementation)

**Impact:** 🔴 **CRITICAL - Authentication completely broken**

---

## 📋 Custom/Non-Backend API Calls

### 1. File Renderers (Direct Fetch)
**Files:**
- `src/renderers/TextRenderer.ts` (line 41)
- `src/renderers/CSVRenderer.ts` (line 32)

**Code:**
```typescript
const response = await fetch(file.url);
```

**Status:** ✅ **OK - This is correct** (direct file downloads from URLs)

**Explanation:** Files are stored externally (S3, CDN) and fetched directly by browser

---

### 2. Supabase Library Import
**File:** `src/lib/supabase.ts`

**Code:**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {...});
```

**Status:** ❌ **TO BE REMOVED** (after auth/workflow migration)

**Dependencies:** Used by `authSlice.ts` and `workflowStore.ts`

---

## 🎯 Integration Status by Feature

| Feature | Component | Backend Service | Status | Priority |
|---------|-----------|-----------------|--------|----------|
| **Authentication** | authSlice.ts | Auth Service (3002) | ❌ 0% | 🔴 CRITICAL |
| **Project CRUD** | projectsSlice.ts | Project Mgmt (3004) | ⚠️ 50% (corrupted) | 🔴 HIGH |
| **Customer CRUD** | customersSlice.ts | Project Mgmt (3004) | ✅ 100% | ✅ Complete |
| **Task Queue** | TaskQueue.tsx | Task Mgmt (3003) | ✅ 90% | 🟡 Auth needed |
| **Annotate Task** | AnnotateTask.tsx | Task Mgmt (3003) | ✅ 90% | 🟡 Auth needed |
| **Review Queue** | ReviewQueue.tsx | Task Mgmt (3003) | ✅ 90% | 🟡 Auth needed |
| **Review Task** | ReviewTask.tsx | Task Mgmt (3003) | ✅ 90% | 🟡 Auth needed |
| **Workflow Builder** | workflowStore.ts | Workflow Engine (3007) | ❌ 0% | 🔴 HIGH |
| **Admin Dashboard** | AdminDashboard.tsx | N/A (static) | ✅ 100% | ✅ Complete |
| **Ops Dashboard** | OpsDashboard.tsx | Project Mgmt (3004) | ✅ 100% | ✅ Complete |

---

## 🚨 Blocking Issues Summary

### Priority 1: CRITICAL (Blocks All Features)
1. **Authentication System** - authSlice.ts completely dependent on Supabase
   - No user login/logout
   - No JWT token management
   - No session handling
   - **Action:** Create authService.ts + integrate Auth Service backend

### Priority 2: HIGH (Breaks Core Functionality)
2. **Project Management Corruption** - projectsSlice.ts has mixed/broken code
   - Project creation fails
   - Project update fails
   - Project cloning fails
   - **Action:** Fix projectsSlice.ts to use projectService only

3. **Workflow Management** - workflowStore.ts 100% Supabase dependent
   - Cannot save workflows
   - Cannot load workflows
   - Workflow builder unusable
   - **Action:** Create workflowService.ts + migrate workflowStore

### Priority 3: MEDIUM (User Experience)
4. **Hardcoded User IDs** - Multiple components use placeholders
   - `TaskQueue.tsx`: `userId = 'current-user-id'`
   - `AnnotateTask.tsx`: `userId = 'current-user-id'`
   - `ReviewQueue.tsx`: `userId = 'reviewer-user-id'`
   - **Action:** Replace with `useAppSelector(state => state.auth.user?.id)`

---

## 📊 Code Quality Issues

### 1. Corrupted Code in projectsSlice.ts
**Lines 73-141** contain syntax errors and mixed code:
- Incomplete Supabase removal
- Mixed old/new code paths
- Syntax errors (`project = await`, `return pject =`, `return pr as Error`)
- Wrong method calls (`projectService.deleteProject` in clone function)

**Risk Level:** 🔴 **CRITICAL - Will cause runtime errors**

### 2. Missing Error Handling
Several components have basic error handling:
- Alert boxes instead of proper UI error states
- No retry mechanisms
- No offline handling

**Risk Level:** 🟡 **MEDIUM - Poor UX**

### 3. Inconsistent Auth Patterns
- Some components check `user` from Redux
- Some use hardcoded userId
- No centralized auth HOC/hook

**Risk Level:** 🟡 **MEDIUM - Maintenance issue**

---

## ✅ Successfully Migrated Components

### Task Management (3 Components)
1. ✅ **TaskQueue.tsx** - Uses Redux + taskService
2. ✅ **AnnotateTask.tsx** - Uses taskService methods
3. ✅ **ReviewQueue.tsx** - Uses taskService.getTasksForReview
4. ✅ **ReviewTask.tsx** - Uses taskService review methods

### Service Layers Created
1. ✅ **taskService.ts** - Complete Task Management API integration (257 lines)
   - Annotator methods
   - Reviewer methods
   - All DTOs and interfaces

2. ✅ **projectService.ts** - Project Management API integration
   - Project CRUD
   - Customer CRUD
   - Clone operations

### Redux Slices Created
1. ✅ **tasksSlice.ts** - Task state management (298 lines)
2. ✅ **customersSlice.ts** - Customer state management

---

## 🔧 Recommended Remediation Plan

### Phase 1: Fix Corrupted Code (Immediate)
**Duration:** 2-4 hours

1. **Fix projectsSlice.ts**
   - Remove all Supabase code from createProject, updateProject, cloneProject
   - Use projectService methods exclusively
   - Fix syntax errors
   - Test all project operations

### Phase 2: Auth Service Integration (Critical Path)
**Duration:** 1-2 days

1. **Create authService.ts**
   - Integrate Auth Service backend (port 3002)
   - Implement login, register, logout, refresh, getUser
   - Handle JWT token storage/refresh

2. **Migrate authSlice.ts**
   - Replace all Supabase.auth calls with authService
   - Remove Supabase.from('users') queries
   - Update Redux state management

3. **Update All Components**
   - Replace hardcoded userId with real user from auth state
   - Add proper authentication checks
   - Implement protected routes

### Phase 3: Workflow Service Integration (High Priority)
**Duration:** 1 day

1. **Create workflowService.ts**
   - Integrate Workflow Engine backend (port 3007)
   - Implement all workflow CRUD operations
   - Add instance management methods

2. **Migrate workflowStore.ts**
   - Replace all Supabase calls with workflowService
   - Keep Zustand store structure
   - Update error handling

3. **Test Workflow Builder**
   - Verify save/load operations
   - Test publish functionality
   - Validate instance creation

### Phase 4: Cleanup (Final)
**Duration:** 2-4 hours

1. **Remove Supabase Dependencies**
   - Delete `src/lib/supabase.ts`
   - Remove `@supabase/supabase-js` from package.json
   - Remove VITE_SUPABASE_* env variables

2. **Update Documentation**
   - Mark Supabase as fully removed
   - Update BACKEND_INTEGRATION.md
   - Create AUTH_INTEGRATION.md

---

## 📝 Backend Service Status

| Service | Port | Status | Endpoints Available |
|---------|------|--------|---------------------|
| Auth Service | 3002 | ⚠️ 27.5% | Partial - needs completion |
| Task Management | 3003 | ✅ 100% | All endpoints ready |
| Project Management | 3004 | ✅ 100% | All endpoints ready |
| Workflow Engine | 3007 | ✅ 95% | All core endpoints ready |

---

## 🎯 Success Criteria

### Definition of Done
- [ ] Zero Supabase imports in codebase
- [ ] All auth operations use Auth Service backend
- [ ] All workflow operations use Workflow Engine backend
- [ ] All project operations use projectService only
- [ ] No hardcoded user IDs
- [ ] No syntax errors in Redux slices
- [ ] All TypeScript compilation passes
- [ ] Integration tests pass
- [ ] Documentation updated

### Testing Checklist
- [ ] User can login/logout
- [ ] User can create/edit projects
- [ ] User can create/edit workflows
- [ ] Annotator can pull/submit tasks
- [ ] Reviewer can approve/reject annotations
- [ ] All features work end-to-end

---

## 📞 Next Steps

### Immediate Actions (Today)
1. ✅ **URGENT:** Fix projectsSlice.ts corruption
2. ✅ **HIGH:** Create authService.ts skeleton
3. ✅ **HIGH:** Create workflowService.ts skeleton

### This Week
4. Complete Auth Service backend implementation (backend team)
5. Migrate authSlice.ts to use authService
6. Migrate workflowStore.ts to use workflowService
7. Replace all hardcoded userId references

### Next Week
8. End-to-end testing
9. Remove Supabase dependencies
10. Update documentation
11. Deploy to staging

---

**Report Generated:** February 4, 2026  
**Analyst:** AI Code Reviewer  
**Status:** 🔴 **Critical Issues Found - Immediate Action Required**
