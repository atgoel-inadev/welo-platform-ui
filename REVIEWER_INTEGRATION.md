# Reviewer Integration - Backend API

This document describes the integration of the reviewer workflow with the Task Management backend service.

## Overview

The reviewer workflow enables reviewers to:
- View tasks that require review (status: PENDING_REVIEW)
- Compare annotations from multiple annotators
- View consensus data and agreement scores
- Approve, reject, or request revisions for annotations
- Rate annotation quality

## Service Layer Extensions

### New Methods in taskService.ts

```typescript
// Reviewer-specific methods
getTasksForReview(userId, filters?): Promise<Task[]>
getTaskAnnotations(taskId): Promise<TaskAnnotation[]>
getTaskConsensus(taskId): Promise<ConsensusData>
submitReview(taskId, dto: ReviewSubmitDto): Promise<void>

// Helper methods
approveAnnotation(taskId, annotationId, feedback?, qualityScore?)
rejectAnnotation(taskId, annotationId, feedback, qualityScore?)
requestRevision(taskId, annotationId, feedback)
getTaskQualityMetrics(taskId): Promise<TaskStatistics>
```

### New Interfaces

```typescript
interface TaskAnnotation {
  id: string;
  taskId: string;
  assignmentId: string;
  userId: string;
  userName?: string;
  annotationData: any;
  responses: AnnotationResponse[];
  timeSpent: number;
  confidenceScore?: number;
  submittedAt: string;
  reviewStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
  reviewFeedback?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

interface ReviewSubmitDto {
  annotationId: string;
  decision: 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
  feedback?: string;
  qualityScore?: number;
  tags?: string[];
}

interface ConsensusData {
  taskId: string;
  totalAnnotations: number;
  requiredAnnotations: number;
  consensusReached: boolean;
  consensusScore: number;
  agreedResponses: Record<string, any>;
  disagreedResponses: Record<string, any[]>;
  annotationComparison: Array<{
    annotationId: string;
    userId: string;
    responses: Record<string, any>;
    agreement: number;
  }>;
}
```

## Updated Components

### 1. ReviewQueue.tsx

**Changes:**
- ✅ Removed Supabase dependencies
- ✅ Uses `taskService.getTasksForReview(userId, filters)`
- ✅ Proper Task interface typing
- ✅ Status filtering (PENDING_REVIEW, IN_PROGRESS)
- ✅ Shows consensus requirements and completion counts
- ✅ Error state handling

**Usage:**
```typescript
const [tasks, setTasks] = useState<Task[]>([]);
const [error, setError] = useState<string | null>(null);

const loadTasks = async () => {
  const tasksData = await taskService.getTasksForReview(userId, {
    status: 'PENDING_REVIEW'
  });
  setTasks(tasksData);
};
```

### 2. ReviewTask.tsx

**Changes:**
- ✅ Removed Supabase dependencies
- ✅ Uses `taskService.getTaskDetails(taskId)`
- ✅ Uses `taskService.getTaskAnnotations(taskId)` for all submissions
- ✅ Uses helper methods: `approveAnnotation`, `rejectAnnotation`, `requestRevision`
- ✅ Task properties accessed directly (fileUrl, fileType, fileMetadata)
- ✅ Annotation properties updated (id, userName, userId)

**Key Methods:**
```typescript
// Load task and annotations
const taskData = await taskService.getTaskDetails(taskId);
const annotationsData = await taskService.getTaskAnnotations(taskId);

// Approve
await taskService.approveAnnotation(taskId, annotationId, feedback, qualityScore);

// Reject
await taskService.rejectAnnotation(taskId, annotationId, feedback, qualityScore);

// Request Revision
await taskService.requestRevision(taskId, annotationId, feedback);
```

## API Endpoints

### Get Tasks for Review
```
GET /api/v1/tasks?taskType=REVIEW&status=PENDING_REVIEW
```

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [Task],
    "total": 10,
    "page": 1,
    "limit": 10
  }
}
```

### Get Task Annotations
```
GET /api/v1/tasks/:taskId/annotations
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "annotation-uuid",
      "taskId": "task-uuid",
      "userId": "user-uuid",
      "userName": "John Doe",
      "annotationData": {...},
      "responses": [...],
      "timeSpent": 120,
      "confidenceScore": 0.95,
      "submittedAt": "2026-02-04T10:00:00Z",
      "reviewStatus": "PENDING"
    }
  ]
}
```

### Submit Review
```
POST /api/v1/tasks/:taskId/review
```

**Request:**
```json
{
  "annotationId": "annotation-uuid",
  "decision": "APPROVED",
  "feedback": "Good quality annotation",
  "qualityScore": 9.5,
  "tags": ["high-quality", "accurate"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Review submitted successfully"
}
```

### Get Consensus Data
```
GET /api/v1/tasks/:taskId/consensus
```

**Response:**
```json
{
  "success": true,
  "data": {
    "taskId": "task-uuid",
    "totalAnnotations": 3,
    "requiredAnnotations": 3,
    "consensusReached": true,
    "consensusScore": 0.87,
    "agreedResponses": {
      "question1": "answer",
      "question2": "answer"
    },
    "disagreedResponses": {
      "question3": ["answer1", "answer2", "answer3"]
    },
    "annotationComparison": [...]
  }
}
```

## Workflow

### 1. Reviewer Views Queue
```
User navigates to /review/queue
  ↓
Component loads
  ↓
taskService.getTasksForReview(userId, { status: 'PENDING_REVIEW' })
  ↓
Display tasks with:
  - File type badge
  - Annotation count (3/3 completed)
  - Consensus requirement indicator
  - Priority level
  - Last updated time
```

### 2. Reviewer Opens Task
```
User clicks "Review" button
  ↓
Navigate to /review/task/:taskId
  ↓
taskService.getTaskDetails(taskId) - Load file and questions
taskService.getTaskAnnotations(taskId) - Load all annotations
  ↓
Display:
  - File viewer (left panel)
  - Annotations comparison (right panel)
  - Consensus view / Individual view toggle
```

### 3. Review Modes

**Individual View:**
- Tabs for each annotator
- View each annotation separately
- Compare responses side-by-side

**Consensus View:**
- Aggregated responses
- Agreement percentage per question
- Highlight agreed vs disagreed responses
- Consensus score indicator

### 4. Submit Review Decision

**Approve:**
```typescript
await taskService.approveAnnotation(
  taskId,
  annotationId,
  'Excellent annotation, clear and accurate',
  9.5 // quality score
);
```

**Reject:**
```typescript
await taskService.rejectAnnotation(
  taskId,
  annotationId,
  'Annotation does not follow guidelines',
  3.0
);
```

**Request Revision:**
```typescript
await taskService.requestRevision(
  taskId,
  annotationId,
  'Please review question 3 - answer is unclear'
);
```

## Task Status Flow

```
Annotator submits task
  ↓
Task status: PENDING_REVIEW
  ↓
Reviewer pulls task
  ↓
Task status: IN_PROGRESS (review)
  ↓
Reviewer submits decision
  ↓
Task status: APPROVED / REJECTED / (back to annotator for revision)
```

## Consensus Logic

When `task.requiresConsensus = true`:

1. **Collect Annotations**: Multiple annotators submit annotations
2. **Calculate Agreement**: Compare responses across annotators
3. **Consensus Score**: Percentage of agreed responses
4. **Decision**: 
   - If consensus reached (score >= threshold): AUTO-APPROVE
   - If consensus not reached: REVIEWER REQUIRED
5. **Display**: Show agreement analysis to reviewer

## Quality Metrics

Tracked per annotation:
- **Time Spent**: Duration of annotation (seconds)
- **Confidence Score**: Annotator's self-reported confidence (0-1)
- **Quality Score**: Reviewer's quality rating (0-10)
- **Agreement Score**: How well it aligns with other annotations
- **Review Status**: PENDING → APPROVED/REJECTED/NEEDS_REVISION

## Integration Status

### ✅ Completed
- Service layer methods for reviewer operations
- ReviewQueue component using backend API
- ReviewTask component using backend API
- Type-safe interfaces (Task, TaskAnnotation, ReviewSubmitDto)
- Error handling and loading states
- Consensus view support
- Individual annotation view

### ⚠️ TODOs
- [ ] Replace hardcoded userId with auth context
- [ ] Implement actual consensus calculation endpoint
- [ ] Add quality score input UI
- [ ] Add annotation tags UI
- [ ] Implement Redux state management for reviewer (optional)
- [ ] Add keyboard shortcuts for review decisions
- [ ] Add annotation comparison side-by-side view

### 🔮 Future Enhancements
- Bulk review actions (approve/reject multiple)
- Review history/audit log
- Reviewer performance metrics
- Inter-rater reliability (IRR) calculations
- Automated consensus detection
- Machine learning quality predictions

## Testing

### 1. Start Backend Services
```bash
cd welo-platform
docker-compose up task-management workflow-engine postgres
```

### 2. Create Test Data
```bash
# Create tasks with multiple annotations
# Set task.requiresConsensus = true for consensus tasks
# Set task.totalAssignmentsRequired = 3
```

### 3. Test Workflow
1. Navigate to `/review/queue`
2. Verify tasks with status PENDING_REVIEW are shown
3. Click "Review" on a task
4. Toggle between Consensus View and Individual View
5. Select annotations to compare
6. Provide feedback
7. Approve/Reject/Request Revision
8. Verify return to queue
9. Check task status updated in backend

## Troubleshooting

**No tasks in queue:**
- Verify tasks have status = PENDING_REVIEW
- Check taskType filter in API call
- Ensure annotations are submitted by annotators

**Annotations not loading:**
- Verify `/tasks/:id/annotations` endpoint exists
- Check task has completedAssignments > 0
- Verify annotation data structure matches interface

**Review submission fails:**
- Check annotationId is valid
- Verify feedback provided for REJECTED/NEEDS_REVISION
- Ensure reviewer has proper permissions

## Related Documentation

- [Task Integration](./TASK_INTEGRATION.md) - Annotator workflow
- [Backend Integration](./BACKEND_INTEGRATION.md) - Project Management
- [Workflow System](./WORKFLOW_SYSTEM_DOCUMENTATION.md) - XState workflows

---

**Status: Complete** ✅
**Last Updated: February 4, 2026**
