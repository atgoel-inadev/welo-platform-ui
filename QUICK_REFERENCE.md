# Quick Reference: Backend Integration

## 🚀 Quick Start

```powershell
# Terminal 1: Backend
cd c:\Workspace\wELO\welo-platform
npm run start:dev project-management

# Terminal 2: Frontend  
cd c:\Workspace\wELO\welo-platform-ui
npm run dev
```

## 📡 API Endpoints

### Projects
| Action | Method | Endpoint |
|--------|--------|----------|
| List | GET | `/api/v1/projects?page=1&pageSize=10` |
| Get | GET | `/api/v1/projects/:id` |
| Create | POST | `/api/v1/projects` |
| Update | PATCH | `/api/v1/projects/:id` |
| Delete | DELETE | `/api/v1/projects/:id` |
| Clone | POST | `/api/v1/projects/:id/clone` |

### Customers
| Action | Method | Endpoint |
|--------|--------|----------|
| List | GET | `/api/v1/customers` |
| Create | POST | `/api/v1/customers` |

## 💻 Code Examples

### Use in Components (via Redux)
```typescript
import { useAppDispatch } from '../hooks/useRedux';
import { fetchProjects, createProject } from '../store/projectsSlice';

// In component
const dispatch = useAppDispatch();

// Fetch projects
dispatch(fetchProjects({ page: 1, limit: 10 }));

// Create project
dispatch(createProject({ input, userId }));
```

### Direct API Call (Service Layer)
```typescript
import { projectService } from '../services/projectService';

// Fetch projects
const response = await projectService.fetchProjects({
  page: 1,
  limit: 10,
  status: 'ACTIVE'
});

// Create project
const project = await projectService.createProject(input, userId);
```

## 🔧 Environment Variables

Create `.env` file:
```env
VITE_PROJECT_MANAGEMENT_URL=http://localhost:3004/api/v1
VITE_TASK_MANAGEMENT_URL=http://localhost:3003/api/v1
VITE_WORKFLOW_ENGINE_URL=http://localhost:3007/api/v1
VITE_AUTH_SERVICE_URL=http://localhost:3002/api/v1
```

## 🐛 Debugging

### Check Backend is Running
```powershell
curl http://localhost:3004/api/v1/projects
```

### Check Network Requests
1. Open Chrome DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Look for requests to `localhost:3004`

### Common Issues
| Problem | Solution |
|---------|----------|
| Network error | Check backend is running |
| CORS error | Verify origin in backend `main.ts` |
| 404 Not Found | Check endpoint path |
| Empty response | Create test data first |

## 📁 Files Modified

**Frontend:**
- `src/lib/apiClient.ts` ← New API client
- `src/services/projectService.ts` ← New service layer
- `src/store/projectsSlice.ts` ← Updated to use service
- `src/store/customersSlice.ts` ← Updated to use service

**Backend:**
- `apps/project-management/src/controllers/customer.controller.ts` ← New
- `apps/project-management/src/services/customer.service.ts` ← New
- `apps/project-management/src/controllers/project.controller.ts` ← Added clone
- `apps/project-management/src/services/project.service.ts` ← Added clone
- `apps/project-management/src/project-management.module.ts` ← Registered new endpoints

## 📚 Documentation

- [BACKEND_INTEGRATION.md](BACKEND_INTEGRATION.md) - Full integration guide
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Testing instructions
- [INTEGRATION_SUMMARY.md](INTEGRATION_SUMMARY.md) - Complete summary

## ✅ Integration Checklist

- [x] API client created
- [x] Project service implemented
- [x] Redux updated
- [x] Backend endpoints added
- [x] Environment configured
- [x] Documentation complete

## 🎯 Next Steps

1. Test the integration
2. Create test data
3. Verify all CRUD operations
4. Begin Task Management integration

---

**Status**: ✅ Complete  
**Phase**: 1 - Project Management  
**Date**: February 4, 2026
