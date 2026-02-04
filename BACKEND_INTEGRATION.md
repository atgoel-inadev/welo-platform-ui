# Welo Platform Backend Integration Guide

## Overview
This document describes the integration of the welo-platform-ui frontend with the welo-platform NestJS backend services, specifically focusing on the **Project Management Service** integration.

## Architecture Changes

### Before (Supabase)
```
welo-platform-ui → Supabase (PostgreSQL + Auth + Storage)
```

### After (Microservices)
```
welo-platform-ui → Backend Microservices
                   ├── Project Management (Port 3004)
                   ├── Task Management (Port 3003)
                   ├── Workflow Engine (Port 3007)
                   └── Auth Service (Port 3002)
```

## Integration Status

### ✅ Completed - Phase 1: Project Management Integration

#### 1. API Client Layer (`src/lib/apiClient.ts`)
- **Purpose**: Centralized HTTP client for backend communication
- **Features**:
  - Axios-based HTTP client with interceptors
  - Automatic JWT token injection
  - Global error handling
  - 401 redirect to login
  - Request/response type safety
- **Instances Created**:
  - `projectManagementApi` (Port 3004)
  - `taskManagementApi` (Port 3003)
  - `workflowEngineApi` (Port 3007)
  - `authServiceApi` (Port 3002)

#### 2. Project Service (`src/services/projectService.ts`)
- **Purpose**: Abstraction layer for Project Management API
- **Endpoints Integrated**:
  - `GET /projects` - Fetch projects with pagination and filters
  - `GET /projects/:id` - Fetch single project
  - `POST /projects` - Create project
  - `PATCH /projects/:id` - Update project
  - `DELETE /projects/:id` - Soft delete project
  - `POST /projects/:id/clone` - Clone project
  - `GET /customers` - Fetch customers (workspaces)
  - `POST /customers` - Create customer

#### 3. Redux Integration
**Updated Files**:
- `src/store/projectsSlice.ts` - All async thunks now use `projectService`
- `src/store/customersSlice.ts` - Uses `projectService.fetchCustomers()`

**Key Changes**:
- Removed all `supabase` imports
- Replaced Supabase queries with REST API calls
- Maintained identical state management structure
- Preserved all Redux actions and reducers

#### 4. Environment Configuration
**New Files**:
- `.env` - Local development configuration
- `.env.example` - Template for environment variables

**Variables**:
```env
VITE_PROJECT_MANAGEMENT_URL=http://localhost:3004/api/v1
VITE_TASK_MANAGEMENT_URL=http://localhost:3003/api/v1
VITE_WORKFLOW_ENGINE_URL=http://localhost:3007/api/v1
VITE_AUTH_SERVICE_URL=http://localhost:3002/api/v1
```

## Data Transformation

### Frontend → Backend DTO Mapping

#### Create Project
**Frontend (`CreateProjectInput`)**:
```typescript
{
  name: string;
  description?: string;
  customer_id: string;
  project_type: ProjectType;
  annotation_questions?: any[];
  workflow_config?: WorkflowConfiguration;
  quality_threshold?: number;
}
```

**Backend (`CreateProjectDto`)**:
```typescript
{
  name: string;
  customerId: string;
  description?: string;
  projectType: string;
  createdBy: string;
  annotationSchema?: any;
  qualityThresholds?: any;
  workflowRules?: any;
  uiConfiguration?: any;
  supportedFileTypes?: string[];
}
```

**Transformation Logic** (in `projectService.createProject()`):
```typescript
const dto: CreateProjectDto = {
  name: input.name,
  customerId: input.customer_id,
  description: input.description,
  projectType: input.project_type,
  createdBy: userId,
  annotationSchema: input.annotation_questions,
  qualityThresholds: {
    qualityThreshold: input.quality_threshold,
  },
  workflowRules: input.workflow_config,
  uiConfiguration: {},
  supportedFileTypes: [],
};
```

## Component Compatibility

### No Changes Required
The following components continue to work without modification:
- `CreateProject.tsx` - Uses Redux actions, unaware of backend change
- `EditProject.tsx` - Uses Redux actions
- `ProjectsList.tsx` - Uses Redux actions
- `OpsDashboard.tsx` - Uses Redux state

**Why?** The Redux layer abstracts the data source, so components don't need to know whether data comes from Supabase or REST API.

## Testing the Integration

### 1. Start Backend Services
```bash
cd c:\Workspace\wELO\welo-platform

# Start Project Management service
npm run start:dev project-management
```

**Expected**: Service runs on `http://localhost:3004`

### 2. Start Frontend
```bash
cd c:\Workspace\wELO\welo-platform-ui
npm run dev
```

**Expected**: UI runs on `http://localhost:5173`

### 3. Test Project CRUD
1. Navigate to `/ops/projects`
2. Click "Create Project"
3. Fill in project details
4. Submit and verify:
   - Network tab shows POST to `http://localhost:3004/api/v1/projects`
   - Project appears in the list
5. Edit the project
   - Verify PATCH request
6. Clone the project
   - Verify POST to `/projects/:id/clone`

### 4. Monitor API Calls
**Chrome DevTools → Network Tab**:
- All requests should go to `localhost:3004` (not Supabase)
- Verify 200 status codes
- Check request/response payloads

## Known Limitations & TODOs

### 🚧 Not Yet Implemented

#### 1. Authentication Integration
**Current State**: Auth still uses Supabase
**Required**:
- Implement Auth Service backend (Port 3002)
- Update `src/hooks/useAuth.ts` to use backend API
- Update `src/store/authSlice.ts`
- Implement JWT token storage and refresh logic

#### 2. Project Statistics
**Current State**: `fetchProjectStatistics()` returns mock data
**Required**:
- Backend endpoint: `GET /batches/:id/statistics`
- Update `projectService` to call real endpoint

#### 3. File Upload & Storage
**Current State**: File URLs are stored but not managed
**Required**:
- S3 integration in backend
- Signed URL generation
- File upload endpoint

#### 4. Batch Management
**Status**: Backend ready, UI not yet integrated
**Required**:
- Create `batchService.ts`
- Update Redux with batch management
- Implement batch creation/upload UI

### 🔍 Data Structure Mismatches

#### Issue: Backend uses different field names
**Example**:
- Frontend: `customer_id`
- Backend: `customerId`

**Solution**: Transformation layer in `projectService.ts` handles conversion

#### Issue: Nested customer data
**Frontend expects**:
```typescript
{
  id: string;
  name: string;
  customer: {
    id: string;
    name: string;
  }
}
```

**Backend may return**:
```typescript
{
  id: string;
  name: string;
  customerId: string;
}
```

**TODO**: Verify backend includes customer data in project responses or update frontend to fetch separately.

## Migration Checklist

### Phase 1: Project Management ✅
- [x] Create API client
- [x] Create project service
- [x] Update projectsSlice
- [x] Update customersSlice
- [x] Add environment variables
- [x] Test CRUD operations

### Phase 2: Task Management (Next)
- [ ] Create task service
- [ ] Update tasksSlice
- [ ] Update annotator components
- [ ] Update reviewer components
- [ ] Test task assignment flow

### Phase 3: Workflow Engine
- [ ] Create workflow service
- [ ] Integrate XState visualization
- [ ] Update workflow builder
- [ ] Test state transitions

### Phase 4: Authentication
- [ ] Implement backend auth service
- [ ] Update authSlice
- [ ] Update login/signup pages
- [ ] Implement JWT refresh
- [ ] Test RBAC

### Phase 5: Remove Supabase
- [ ] Remove `@supabase/supabase-js` dependency
- [ ] Delete `src/lib/supabase.ts`
- [ ] Remove Supabase environment variables
- [ ] Update all remaining Supabase references

## Debugging Tips

### Issue: API calls fail with 404
**Check**:
1. Backend service is running: `http://localhost:3004/health`
2. Correct port in `.env`
3. API endpoint exists in backend

### Issue: CORS errors
**Solution**: Backend already has CORS enabled in `main.ts`:
```typescript
app.enableCors({
  origin: ['http://localhost:5173'],
  credentials: true,
});
```

### Issue: 401 Unauthorized
**Cause**: Auth token not set or expired
**Solution**: 
1. Implement auth service
2. Set token: `projectManagementApi.setToken(token)`

### Issue: TypeScript errors
**Common causes**:
- Backend response shape differs from frontend types
- Missing fields in DTO transformation
**Solution**: Add console.log in service layer to inspect actual API responses

## Best Practices

### 1. Always Use Service Layer
❌ **Wrong**:
```typescript
// In component
const response = await projectManagementApi.get('/projects');
```

✅ **Correct**:
```typescript
// In component
dispatch(fetchProjects());

// Service handles the API call
```

### 2. Handle Errors Gracefully
```typescript
try {
  await dispatch(createProject({ input, userId })).unwrap();
  navigate('/ops/projects');
} catch (error) {
  console.error('Failed to create project:', error);
  // Show toast notification
}
```

### 3. Type Safety
- Always define TypeScript interfaces for API requests/responses
- Use generics in API client: `api.get<Project[]>(...)`

### 4. Loading States
- Redux slices already handle loading states
- Components should show loading spinners

## Performance Considerations

### Pagination
- Backend supports `page` and `limit` query params
- Frontend Redux already tracks pagination state
- Default: 10 items per page

### Caching
- Redux state acts as client-side cache
- Avoid redundant API calls
- Use `currentProject` from Redux instead of re-fetching

### Optimistic Updates
- Consider implementing optimistic updates for better UX
- Example: Update Redux state immediately, revert on API error

## Next Steps

1. **Complete Task Management Integration**
   - Follow same pattern as Project Management
   - Create `taskService.ts`
   - Update task-related Redux slices

2. **Test End-to-End Workflow**
   - Create project → Upload batch → Assign tasks → Annotate → Review

3. **Implement Authentication**
   - Critical for production deployment
   - Implement JWT token management

4. **Add Error Handling UI**
   - Toast notifications for errors
   - Retry mechanisms
   - Offline detection

5. **Performance Monitoring**
   - Add API call logging
   - Monitor response times
   - Optimize slow endpoints

## Resources

- **Backend API Docs**: [UI_INTEGRATION_CONTEXT.md](../welo-platform/DESIGNdOCS/UI_INTEGRATION_CONTEXT.md)
- **Backend Services**: `c:\Workspace\wELO\welo-platform\apps\`
- **API Testing**: Use Postman or Thunder Client to test endpoints directly

## Support

For questions or issues:
1. Check backend service logs
2. Inspect network requests in DevTools
3. Verify environment variables
4. Test API endpoints directly with curl/Postman

---

**Last Updated**: February 4, 2026  
**Integration Status**: Phase 1 Complete (Project Management)  
**Next Phase**: Task Management Integration
