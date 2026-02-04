# Task Management Backend Integration

This document outlines the integration of the Task Management backend service (port 3003) with the frontend annotator workflow.

## Overview

The Task Management integration enables annotators to:
- Pull tasks from the queue or receive assigned tasks
- View task files (images, text, CSV, videos, audio, PDFs)
- Submit annotations based on project-specific annotation questions
- Skip tasks with reasons
- Save drafts (via task status updates)
- Track task progress and time spent

## Architecture

### Service Layer

**File:** `src/services/taskService.ts`

The TaskService provides a clean abstraction over the Task Management backend API:

```typescript
class TaskService {
  // Core annotator operations
  getMyTasks(userId, status): Promise<Assignment[]>
  pullNextTask(dto: GetNextTaskDto): Promise<Task | null>
  getTaskDetails(taskId): Promise<Task>
  submitTask(taskId, dto: SubmitTaskDto): Promise<void>
  updateTaskStatus(taskId, dto: UpdateTaskStatusDto): Promise<void>
  skipTask(taskId, reason): Promise<void>
  
  // Additional operations
  listTasks(filters: TaskFilterDto): Promise<PaginatedResponse<Task>>
  assignTask(taskId, userId): Promise<void>
}
```

### Redux State Management

**File:** `src/store/tasksSlice.ts`

Redux slice for managing task state with async thunks:

```typescript
// State
interface TasksState {
  myTasks: Assignment[];
  currentTask: Task | null;
  loading: boolean;
  pulling: boolean;
  submitting: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
}

// Async Thunks
fetchMyTasks({ userId, status })
pullNextTask({ userId, queueId?, taskType?, projectId? })
fetchTaskDetails(taskId)
submitAnnotation({ taskId, dto })
updateTaskStatus({ taskId, status, reason? })
skipTask({ taskId, reason })
listTasks(filters)

// Actions
clearError()
clearCurrentTask()
setCurrentTask(task)
```

### UI Components

**1. TaskQueue.tsx** - Task queue interface
- Displays list of assigned tasks
- "Pull Next Task" button to claim tasks from queue
- Shows task metadata (file type, assigned time, status)
- Navigate to annotation view

**2. AnnotateTask.tsx** - Annotation interface
- Split-screen: file viewer (left) + annotation form (right)
- Question-by-question navigation
- Progress bar
- Save draft functionality
- Submit annotation when complete
- Skip task option

## Backend API Integration

### Base Configuration

**File:** `.env`
```
VITE_TASK_MANAGEMENT_URL=http://localhost:3003/api/v1
```

### API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/tasks` | GET | List tasks with filters |
| `/tasks/:id` | GET | Get task details |
| `/tasks/next` | POST | Pull next available task |
| `/tasks/:id/submit` | POST | Submit annotation |
| `/tasks/:id/status` | PATCH | Update task status (draft, skip) |

### Request/Response Structure

All backend responses follow this format:
```typescript
{
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
```

### Data Models

**Task Interface:**
```typescript
interface Task {
  id: string;
  batchId: string;
  projectId: string;
  workflowId: string;
  taskType: 'ANNOTATION' | 'REVIEW' | 'VALIDATION';
  status: TaskStatus;
  priority: number;
  dueDate?: string;
  
  // File information
  fileType?: 'CSV' | 'TXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'PDF' | 'JSON' | 'HTML' | 'MARKDOWN';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileMetadata?: any;
  
  // Task payload
  dataPayload: {
    sourceData: any;
    references?: any[];
    context?: any;
    annotationQuestions?: any[]; // Project-specific annotation schema
  };
  
  // Metadata
  estimatedDuration?: number;
  actualDuration?: number;
  requiresConsensus: boolean;
  totalAssignmentsRequired: number;
  completedAssignments: number;
  createdAt: string;
  updatedAt: string;
}
```

**Assignment Interface:**
```typescript
interface Assignment {
  id: string;
  taskId: string;
  userId: string;
  workflowStage: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'RELEASED';
  assignedAt: string;
  startedAt?: string;
  completedAt?: string;
  expiresAt: string;
  assignmentMethod: 'MANUAL' | 'AUTOMATIC' | 'CLAIMED';
  task?: Task; // Populated when fetching assignments
}
```

**AnnotationResponse Interface:**
```typescript
interface AnnotationResponse {
  questionId: string;
  response: any;
  timeSpent?: number; // seconds
  confidenceScore?: number; // 0-1
}
```

## Annotator Workflow

### 1. Task Queue (Pull Model)

```typescript
// Component: TaskQueue.tsx
// Load assigned tasks
dispatch(fetchMyTasks({ userId, status: 'ASSIGNED' }));

// Pull next task from queue
dispatch(pullNextTask({ userId, projectId?: string }));
```

### 2. View Task & Annotate

```typescript
// Component: AnnotateTask.tsx
// Load task details
dispatch(fetchTaskDetails(taskId));

// Task includes:
// - fileUrl, fileType for rendering
// - dataPayload.annotationQuestions for form generation
```

### 3. Save Draft

```typescript
// Update task status to IN_PROGRESS with metadata
await taskService.updateTaskStatus(taskId, {
  status: 'IN_PROGRESS',
  metadata: { draft: responseData }
});
```

### 4. Submit Annotation

```typescript
// Submit completed annotation
await dispatch(submitAnnotation({
  taskId,
  dto: {
    assignmentId: userId, // TODO: Use real assignment ID
    annotationData: Object.fromEntries(responses),
    timeSpent: seconds,
    responses: [
      { questionId: '1', response: 'answer', timeSpent: 30, confidenceScore: 0.9 },
      // ...
    ]
  }
}));
```

### 5. Skip Task

```typescript
// Skip task with reason
await dispatch(skipTask({ taskId, reason: 'File corrupted' }));
```

## File Rendering

**Component:** `FileViewer.tsx`

The FileViewer component renders different file types based on `task.fileType`:

| File Type | Rendering Method |
|-----------|------------------|
| IMAGE | `<img>` tag |
| VIDEO | `<video>` tag |
| AUDIO | `<audio>` tag |
| CSV | Parsed into table |
| TXT/MARKDOWN | Syntax-highlighted text |
| PDF | PDF.js viewer |
| JSON | Formatted JSON viewer |
| HTML | Sandboxed iframe |

Props:
```typescript
<FileViewer 
  fileUrl={task.fileUrl}
  fileType={task.fileType}
  metadata={task.fileMetadata}
/>
```

## Question Rendering

**Component:** `QuestionRenderer.tsx`

Dynamically renders annotation questions from `task.dataPayload.annotationQuestions`:

```typescript
interface AnnotationQuestion {
  id: string;
  question_text: string;
  question_type: 'text' | 'multiple_choice' | 'checkbox' | 'rating' | 'boolean';
  is_required: boolean;
  options?: string[]; // For multiple_choice, checkbox
  metadata?: any;
}
```

## Integration Checklist

### ✅ Completed

- [x] TaskService with all backend API calls
- [x] Redux tasksSlice with async thunks
- [x] TaskQueue.tsx using Redux
- [x] AnnotateTask.tsx using taskService
- [x] API client with authentication
- [x] Environment configuration
- [x] TypeScript types and interfaces
- [x] Error handling and loading states

### ⚠️ TODO (Authentication Required)

- [ ] Replace hardcoded userId with real user from auth context
- [ ] Implement proper assignment ID tracking
- [ ] Add token refresh logic to API client
- [ ] Handle 401 Unauthorized errors gracefully

### 📝 Future Enhancements

- [ ] Implement annotation draft persistence (localStorage)
- [ ] Add task timer with auto-save
- [ ] Implement consensus view for multi-annotator tasks
- [ ] Add annotation history/audit log
- [ ] Implement file download functionality
- [ ] Add keyboard shortcuts for navigation
- [ ] Implement offline mode with sync

## Testing Guide

### 1. Start Backend Services

```bash
cd welo-platform
docker-compose up task-management postgres
```

### 2. Verify API Endpoints

```bash
# Get next task
curl -X POST http://localhost:3003/api/v1/tasks/next \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user"}'

# Get my tasks
curl http://localhost:3003/api/v1/tasks?userId=test-user&status=ASSIGNED
```

### 3. Start Frontend

```bash
cd welo-platform-ui
npm run dev
```

### 4. Test Annotator Flow

1. Navigate to `/annotate/queue`
2. Click "Pull Next Task"
3. Verify task loads with file rendering
4. Fill out annotation questions
5. Save draft (verify status update)
6. Submit annotation
7. Verify return to queue

### 5. Verify Redux State

Use Redux DevTools extension to inspect:
- `state.tasks.myTasks` - assigned tasks
- `state.tasks.currentTask` - active task
- `state.tasks.loading` - loading states
- `state.tasks.error` - error messages

## Error Handling

### Common Errors

**1. No tasks available**
```typescript
// Error: "No tasks available in the queue"
// Solution: Ops Manager needs to create and queue tasks
```

**2. Authentication error**
```typescript
// Error: 401 Unauthorized
// Solution: Ensure valid JWT token in localStorage
```

**3. File not found**
```typescript
// Error: Failed to load file
// Solution: Verify fileUrl is valid and accessible
```

**4. Task expired**
```typescript
// Error: Assignment has expired
// Solution: Pull a new task from queue
```

## Performance Considerations

1. **File Caching**: Large media files should be cached locally
2. **Lazy Loading**: Only load task details when needed
3. **Debouncing**: Debounce draft saves to avoid excessive API calls
4. **Pagination**: Use pagination for task lists (default: 10 per page)
5. **Memoization**: Use React.memo for FileViewer to prevent re-renders

## Security Notes

1. **File URLs**: Should be signed/temporary URLs from backend
2. **XSS Prevention**: Sanitize HTML content before rendering
3. **CORS**: Task Management service must allow frontend origin
4. **Authentication**: All API calls include JWT token
5. **Rate Limiting**: Backend should implement rate limiting

## Related Documentation

- [Backend Integration Guide](./BACKEND_INTEGRATION.md)
- [API Specification](../welo-platform/DESIGNdOCS/API%20Specification.md)
- [Workflow System Documentation](./WORKFLOW_SYSTEM_DOCUMENTATION.md)
- [Renderer Documentation](./RENDERER_DOCUMENTATION.md)

## Support

For issues or questions:
1. Check TypeScript errors in VS Code
2. Review Redux DevTools for state issues
3. Check browser console for API errors
4. Review backend logs for service errors
