# Annotator & Reviewer Portal Implementation

This document describes the complete implementation of the Annotator and Reviewer portals for the document annotation and review system.

## Overview

The implementation includes two main portals:

1. **Annotator Portal**: Allows annotators to pull tasks from a FIFO queue, view files, answer questions, and submit annotations
2. **Reviewer Portal**: Enables reviewers to view submitted annotations, compare responses from multiple annotators, and approve/reject submissions

## Database Schema

### New Tables

The following database structure was added via migration `add_workflow_support_to_tasks`:

- **workflow_id column on tasks**: Links tasks to visual workflows for dynamic questionnaires
- **Database functions**:
  - `pull_next_task()`: Assigns the next available task from the queue (FIFO) to an annotator
  - `get_task_annotations_for_review()`: Retrieves all annotations for a task with user info and review status
  - `calculate_agreement_score()`: Calculates inter-annotator agreement percentage

### Existing Tables Used

- **tasks**: Stores annotation tasks with file references and status
- **task_files**: Contains file URLs and metadata
- **assignments**: Tracks task assignments to users
- **annotations**: Stores submitted annotations
- **annotation_responses**: Individual question responses
- **reviews**: Review decisions and feedback
- **workflows**: Visual workflow definitions
- **workflow_nodes**: Workflow steps/questions
- **questions**: Question definitions with types and validation

## File Structure

### Services

**`src/services/taskService.ts`**
- `getMyTasks()`: Fetches assigned tasks for the current user
- `pullNextTask()`: Pulls next task from queue using FIFO strategy
- `getTaskDetails()`: Gets full task info including workflow and files
- `getWorkflowQuestions()`: Retrieves questions from a workflow
- `startTask()`: Marks task as in progress
- `submitAnnotation()`: Submits completed annotation with responses
- `saveDraft()`: Saves work in progress
- `getTaskAnnotations()`: Gets all annotations for review
- `submitReview()`: Submits review decision (approve/reject/needs work)
- `getTasksForReview()`: Gets tasks pending review

### Annotator Portal Pages

**`src/pages/annotator/TaskQueue.tsx`**
- Displays assigned tasks in a list
- "Pull Next Task" button to get tasks from the queue
- Shows task status, file type, and assignment time
- Allows continuing in-progress tasks

**`src/pages/annotator/AnnotateTask.tsx`**
- Split-screen interface:
  - Left: File viewer (supports images, videos, audio, text, CSV, PDF)
  - Right: Question interface with navigation
- Progress indicator showing completion percentage
- Question navigation (Previous/Next buttons)
- Timer showing time spent
- Save Draft functionality
- Submit button with validation
- Prevents submission if required questions are unanswered

### Reviewer Portal Pages

**`src/pages/reviewer/ReviewQueue.tsx`**
- Lists tasks pending review
- Filters: All, Pending, In Review
- Shows annotation count per task
- Displays project info and priority
- Quick access to review each task

**`src/pages/reviewer/ReviewTask.tsx`**
- Two view modes:
  - **Consensus View**: Shows aggregated responses with agreement percentages
  - **Individual View**: Shows each annotator's responses separately
- Split-screen interface:
  - Left: File viewer
  - Right: Annotation responses
- Agreement score visualization (color-coded: green ≥80%, yellow ≥50%, red <50%)
- Side-by-side comparison of multiple annotators
- Feedback textarea for reviewer comments
- Three action buttons:
  - Approve: Marks annotation as approved
  - Request Revision: Sends back for rework
  - Reject: Rejects the annotation

### Components

**`src/components/annotator/QuestionRenderer.tsx`**
Renders different question types with appropriate UI:
- **Multiple Choice**: Radio buttons or checkboxes (single/multi-select)
- **Text Input**: Short input or textarea based on length
- **Rating**: Star rating system
- **Boolean**: Yes/No buttons with color coding
- **Scale**: Slider with min/max labels

## Routing

Updated `src/App.tsx` with new routes:

### Annotator Routes (role: ANNOTATOR)
- `/annotate/queue` - Task queue page
- `/annotate/task/:taskId` - Annotation interface
- `/annotate/history` - Coming soon
- `/annotate/dashboard` - Coming soon

### Reviewer Routes (role: REVIEWER)
- `/review/queue` - Review queue page
- `/review/task/:taskId` - Review interface
- `/review/history` - Coming soon

## Features Implemented

### Annotator Portal Features

1. **Task Queue System**
   - FIFO queue for fair task distribution
   - Pull next available task automatically
   - View all assigned tasks
   - Continue in-progress tasks
   - Respects max tasks per annotator limit

2. **File Viewing**
   - Integrated with existing PixiJS-based FileViewer
   - Supports: images, videos, audio, text, CSV, PDF, JSON
   - Full-screen file display

3. **Question Interface**
   - Dynamic question rendering based on workflow or project questions
   - Multiple question types supported
   - Required field validation
   - Progress tracking
   - Question navigation

4. **Draft Saving**
   - Auto-save capability
   - Resume from where you left off
   - Prevents data loss

5. **Time Tracking**
   - Tracks time spent on task
   - Records time per question
   - Displays elapsed time in UI

6. **Submission**
   - Validates all required questions
   - Submits responses atomically
   - Updates task status to PENDING_REVIEW
   - Records submission timestamp

### Reviewer Portal Features

1. **Review Queue**
   - Lists tasks pending review
   - Filter by status
   - Shows annotator count
   - Priority indicators
   - Quick navigation to review

2. **Consensus View**
   - Aggregates responses from multiple annotators
   - Calculates agreement percentage
   - Visual indicators for agreement levels
   - Most common answer highlighted
   - Individual responses listed below

3. **Individual View**
   - Tab navigation between annotators
   - Full response details per annotator
   - Time spent information
   - Submission timestamps

4. **Review Actions**
   - Approve: Marks task as approved
   - Reject: Marks task as rejected (requires feedback)
   - Request Revision: Sends back for rework (requires feedback)
   - Feedback field for all decisions

5. **Agreement Scoring**
   - Automatic calculation of inter-annotator agreement
   - Color-coded visualization
   - Question-by-question breakdown

## Security

All database operations use Row Level Security (RLS):

- Annotators can only see their assigned tasks and queued tasks
- Annotators can only submit annotations for their assignments
- Reviewers can view all tasks pending review
- Reviewers can only review tasks in PENDING_REVIEW status
- Users can only view their own drafts
- Project managers and admins have full access

## Workflow Integration

The system integrates with the existing visual workflow builder:

1. Tasks can be linked to workflows via `workflow_id`
2. Questions are pulled from workflow nodes of type "question"
3. Questions maintain order based on workflow node positions
4. Falls back to project-level annotation questions if no workflow

## API Usage

### For Annotators

javascript
// Get my assigned tasks
const tasks = await taskService.getMyTasks();

// Pull next task from queue
const task = await taskService.pullNextTask(projectId);

// Get task details
const taskDetails = await taskService.getTaskDetails(taskId);

// Submit annotation
await taskService.submitAnnotation(
  taskId,
  assignmentId,
  responses,
  timeSpent
);


### For Reviewers

javascript
// Get tasks for review
const tasks = await taskService.getTasksForReview(userId);

// Get all annotations for a task
const annotations = await taskService.getTaskAnnotations(taskId);

// Submit review
await taskService.submitReview(
  taskId,
  annotationId,
  'APPROVED',
  feedback
);


## Question Types Supported

1. **multiple_choice**: Single or multi-select options
2. **text_input**: Short text or long text (textarea)
3. **rating**: Star rating (configurable max)
4. **boolean**: Yes/No selection
5. **scale**: Slider with min/max values
6. **annotation**: (Future) Drawing annotations on files
7. **file_upload**: (Future) Upload additional files

## Task Status Flow

```
QUEUED → ASSIGNED → IN_PROGRESS → PENDING_REVIEW → APPROVED/REJECTED
```

## Next Steps / Future Enhancements

1. **Annotation Drawing Tools**: Visual annotations (bounding boxes, polygons, points)
2. **Multi-level Review**: Support for multiple review levels
3. **Task History**: View completed tasks and annotations
4. **Performance Dashboard**: Annotator statistics and metrics
5. **Batch Upload**: Bulk task creation from CSV/JSON
6. **Quality Metrics**: Track annotator accuracy and speed
7. **Auto-assignment**: Skill-based task assignment
8. **Notification System**: Alerts for new tasks and reviews
9. **Export**: Export annotations in various formats
10. **Collaboration**: Real-time collaboration features

## Testing

To test the implementation:

1. **Create Test Users**:
   - Annotator role: `annotator@welo.com` (password: Test123!)
   - Reviewer role: `reviewer@welo.com` (password: Test123!)

2. **Create a Project** (as Project Manager):
   - Add annotation questions
   - Configure workflow if needed

3. **Create Tasks** (as Project Manager):
   - Upload files via task creation interface
   - Link to project/workflow

4. **Test Annotator Flow**:
   - Login as annotator
   - Pull task from queue
   - View file and answer questions
   - Submit annotation

5. **Test Reviewer Flow**:
   - Login as reviewer
   - View task in review queue
   - Compare annotations
   - Approve or reject

## Build Status

Build completed successfully with no errors.
Project is ready for deployment and testing.
