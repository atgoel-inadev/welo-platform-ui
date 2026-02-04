# Backend Integration Testing Guide

## Prerequisites
- Node.js installed
- PostgreSQL running
- Both backend and frontend repos cloned

## Step 1: Setup Backend Database

```powershell
# Navigate to backend directory
cd c:\Workspace\wELO\welo-platform

# Ensure PostgreSQL is running and create database
# (Adjust credentials if needed)
psql -U postgres -c "CREATE DATABASE welo;"
```

## Step 2: Start Project Management Service

```powershell
cd c:\Workspace\wELO\welo-platform

# Install dependencies (if not done)
npm install

# Start Project Management service
npm run start:dev project-management
```

**Expected Output:**
```
[Nest] INFO [NestFactory] Starting Nest application...
[Nest] INFO [InstanceLoader] ProjectManagementModule dependencies initialized
[Nest] INFO [RoutesResolver] ProjectController {/api/v1/projects}:
[Nest] INFO [RoutesResolver] Mapped {/api/v1/projects, GET} route
[Nest] INFO [RoutesResolver] Mapped {/api/v1/projects, POST} route
[Nest] INFO [RoutesResolver] Mapped {/api/v1/projects/:id, GET} route
[Nest] INFO [RoutesResolver] Mapped {/api/v1/projects/:id, PATCH} route
[Nest] INFO [RoutesResolver] Mapped {/api/v1/projects/:id, DELETE} route
[Nest] INFO [RoutesResolver] Mapped {/api/v1/projects/:id/clone, POST} route
[Nest] INFO [RoutesResolver] CustomerController {/api/v1/customers}:
[Nest] INFO [RoutesResolver] Mapped {/api/v1/customers, GET} route
[Nest] INFO [RoutesResolver] Mapped {/api/v1/customers, POST} route
[Nest] INFO [NestApplication] Nest application successfully started
[Nest] INFO Project Management Service running on http://localhost:3004
```

## Step 3: Verify Backend is Running

```powershell
# Test health endpoint (if available)
curl http://localhost:3004/health

# Test customers endpoint
curl http://localhost:3004/api/v1/customers

# Test projects endpoint
curl http://localhost:3004/api/v1/projects
```

## Step 4: Start Frontend

```powershell
# Open new terminal
cd c:\Workspace\wELO\welo-platform-ui

# Install dependencies (if axios not installed)
npm install

# Start dev server
npm run dev
```

**Expected Output:**
```
VITE v5.4.2  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

## Step 5: Test UI Integration

### 5.1 Open Browser
Navigate to: `http://localhost:5173`

### 5.2 Test Customer Management (if accessible)
1. Should see customers list loaded from backend
2. Check browser DevTools → Network tab
3. Verify request goes to `http://localhost:3004/api/v1/customers`

### 5.3 Test Project Management
1. Navigate to `/ops/projects` (or wherever projects list is)
2. **Check Network Tab** - Should see:
   ```
   Request URL: http://localhost:3004/api/v1/projects?page=1&pageSize=10
   Status: 200 OK
   ```

3. **Click "Create Project"**
   - Fill in project details
   - Select a customer
   - Submit form

4. **Check Network Tab** - Should see:
   ```
   Request URL: http://localhost:3004/api/v1/projects
   Method: POST
   Status: 200 OK or 201 Created
   ```

5. **Verify Response**:
   ```json
   {
     "success": true,
     "data": {
       "id": "uuid-here",
       "name": "Test Project",
       "customerId": "...",
       "status": "DRAFT",
       ...
     }
   }
   ```

6. **Test Edit Project**
   - Click edit on a project
   - Modify fields
   - Save
   - Verify PATCH request to `/api/v1/projects/:id`

7. **Test Clone Project**
   - Click clone button
   - Enter new name
   - Verify POST to `/api/v1/projects/:id/clone`

## Step 6: Create Test Data

### Option A: Through UI
Use the "Create Project" form to create test projects

### Option B: Direct API Calls
```powershell
# Create a customer first
curl -X POST http://localhost:3004/api/v1/customers `
  -H "Content-Type: application/json" `
  -d '{
    "name": "Test Customer",
    "email": "test@example.com",
    "subscription": "PREMIUM"
  }'

# Create a project
curl -X POST http://localhost:3004/api/v1/projects `
  -H "Content-Type: application/json" `
  -d '{
    "name": "Test Annotation Project",
    "customerId": "CUSTOMER_ID_FROM_ABOVE",
    "description": "Test project for integration",
    "projectType": "TEXT_ANNOTATION",
    "createdBy": "test-user-id",
    "annotationSchema": {},
    "qualityThresholds": {},
    "workflowRules": {}
  }'
```

## Common Issues & Solutions

### Issue 1: "Network error - please check your connection"
**Cause**: Backend service not running or wrong URL
**Solution**: 
- Verify backend is running on port 3004
- Check `.env` file has correct URL
- Restart frontend dev server after changing `.env`

### Issue 2: CORS Error
**Cause**: Frontend origin not allowed by backend
**Solution**: 
- Check backend `main.ts` has:
  ```typescript
  app.enableCors({
    origin: ['http://localhost:5173'],
    credentials: true,
  });
  ```

### Issue 3: 404 Not Found on API calls
**Cause**: Endpoint doesn't exist or wrong path
**Solution**:
- Verify backend routes with `npm run start:dev project-management`
- Check Network tab for exact URL being called
- Ensure `/api/v1` prefix is included

### Issue 4: TypeError: Cannot read property 'data' of undefined
**Cause**: Backend response structure mismatch
**Solution**:
- Backend returns `{ success, data }` wrapper
- Service layer should extract `response.data`
- Check `projectService.ts` transformations

### Issue 5: Projects list is empty
**Cause**: No data in database
**Solution**:
- Create customers first (they're required for projects)
- Create projects through UI or API
- Check database: `SELECT * FROM projects;`

### Issue 6: "customerId is required" error
**Cause**: No customers exist in dropdown
**Solution**:
- Create customers first via `/api/v1/customers`
- Or temporarily modify backend to make customerId optional

## Debugging Tips

### 1. Enable Backend Logging
In backend `.env` or `main.ts`:
```typescript
logging: true  // in TypeORM config
```

### 2. Check Database
```powershell
psql -U postgres -d welo
\dt  # List tables
SELECT * FROM customers;
SELECT * FROM projects;
```

### 3. Monitor Network Traffic
- Open Chrome DevTools → Network tab
- Filter by "Fetch/XHR"
- Check request/response payloads
- Verify status codes

### 4. Console Logging
Add temporary logs in `projectService.ts`:
```typescript
async createProject(input, userId) {
  console.log('Creating project with:', { input, userId });
  const response = await projectManagementApi.post(...);
  console.log('Backend response:', response);
  return response.data;
}
```

### 5. Test Backend Directly
Use tools like:
- **curl** (command line)
- **Postman** (GUI)
- **Thunder Client** (VS Code extension)

Example:
```powershell
curl -X GET http://localhost:3004/api/v1/projects | ConvertFrom-Json | Format-List
```

## Success Criteria

✅ **Backend Integration Successful If:**
1. Backend service starts without errors on port 3004
2. Frontend can fetch projects list
3. Creating a project makes POST request to backend
4. New project appears in projects list immediately
5. Editing project updates via PATCH request
6. No Supabase errors in console
7. All requests show `localhost:3004` in Network tab

## Next Steps After Successful Integration

1. **Add Authentication**
   - Implement JWT token management
   - Update apiClient to use auth tokens
   - Test protected routes

2. **Integrate Task Management**
   - Create taskService.ts
   - Update task-related components
   - Test task assignment flow

3. **Add Error Notifications**
   - Implement toast/snackbar for errors
   - Show loading states
   - Handle offline scenarios

4. **Performance Optimization**
   - Implement request caching
   - Add pagination controls
   - Optimize re-renders

---

**Document Version**: 1.0  
**Last Updated**: February 4, 2026  
**Status**: Phase 1 - Project Management Integration Complete
