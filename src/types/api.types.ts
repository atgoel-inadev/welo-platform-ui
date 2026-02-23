/**
 * Canonical API types — single source of truth for all backend-facing interfaces.
 *
 * Rules:
 *  1. Every value here MUST match the backend enum/entity exactly (same casing, same values).
 *  2. Do NOT redefine types that are auto-generated in src/generated/ — import from there instead.
 *  3. When the backend adds a new field, update here first, then fix any TypeScript errors.
 *
 * Alignment reference:
 *  - Enums  → welo-platform/libs/common/src/enums/index.ts
 *  - Tasks  → welo-platform/apps/task-management/src/task/task.entity.ts
 *  - Assignments → welo-platform/apps/task-management/src/assignment/assignment.entity.ts
 *  - Comments   → welo-platform/libs/common/src/entities/comment.entity.ts
 */

// ── Enum-aligned literal types ────────────────────────────────────────────

/** Matches backend TaskStatus enum exactly */
export type TaskStatusValue =
  | 'QUEUED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'SKIPPED';

/** Matches backend TaskType enum exactly */
export type TaskTypeValue = 'ANNOTATION' | 'REVIEW' | 'VALIDATION' | 'CONSENSUS';

/** Matches backend AssignmentStatus enum exactly */
export type AssignmentStatusValue =
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'REASSIGNED';

/** Matches backend AssignmentMethod enum exactly */
export type AssignmentMethodValue = 'AUTOMATIC' | 'MANUAL' | 'CLAIMED';

/** Matches backend WorkflowStage enum exactly */
export type WorkflowStageValue = 'ANNOTATION' | 'REVIEW' | 'VALIDATION' | 'CONSENSUS';

/** Matches backend FileType values used in task entities */
export type FileTypeValue =
  | 'CSV'
  | 'TXT'
  | 'IMAGE'
  | 'VIDEO'
  | 'AUDIO'
  | 'PDF'
  | 'JSON'
  | 'HTML'
  | 'MARKDOWN';

export type BatchStatusValue = 'CREATED' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'EXPORTED';

// ── Shared pagination wrapper ─────────────────────────────────────────────

export interface BackendEnvelope<T> {
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

// ── Task ──────────────────────────────────────────────────────────────────

export interface Task {
  id: string;
  batchId: string;
  projectId: string;
  workflowId: string;
  externalId: string;
  taskType: TaskTypeValue;
  status: TaskStatusValue;
  priority: number;
  dueDate?: string;
  fileType?: FileTypeValue;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileMetadata?: Record<string, unknown>;
  dataPayload: {
    sourceData: unknown;
    references?: unknown[];
    context?: unknown;
  };
  estimatedDuration?: number;
  actualDuration?: number;
  requiresConsensus: boolean;
  totalAssignmentsRequired: number;
  completedAssignments: number;
  assignmentId?: string;
  assignedAt?: string;
  currentReviewLevel?: number;
  maxReviewLevel?: number;
  consensusScore?: number;
  consensusReached?: boolean;
  createdAt: string;
  updatedAt: string;
  assignments?: Assignment[];
}

// ── Assignment ────────────────────────────────────────────────────────────

export interface Assignment {
  id: string;
  taskId: string;
  userId: string;
  workflowStage: WorkflowStageValue;
  status: AssignmentStatusValue;
  assignedAt: string;
  startedAt?: string;
  completedAt?: string;
  expiresAt: string;
  assignmentMethod: AssignmentMethodValue;
  isPrimary?: boolean;
  assignmentOrder?: number;
  task?: Task;
}

// ── Task Comment ──────────────────────────────────────────────────────────

export interface TaskComment {
  id: string;
  entityType: string;
  entityId: string;
  userId: string;
  parentCommentId: string | null;
  content: string;
  isResolved: boolean;
  resolvedAt: string | null;
  resolvedBy: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  replies?: TaskComment[];
}

// ── Task Statistics ───────────────────────────────────────────────────────

export interface TaskStatistics {
  taskId: string;
  totalAnnotations: number;
  completedAnnotations: number;
  averageConfidenceScore: number;
  averageTimeSpent: number;
  consensusScore?: number;
  consensusReached: boolean;
  currentReviewLevel: number;
  reviewsApproved: number;
  reviewsRejected: number;
  qualityScore?: number;
}

// ── Task Annotation / Review ──────────────────────────────────────────────

export interface AnnotationResponse {
  questionId: string;
  response: unknown;
  timeSpent?: number;
  confidenceScore?: number;
}

export interface TaskAnnotation {
  id: string;
  taskId: string;
  assignmentId: string;
  userId: string;
  userName?: string;
  annotationData: unknown;
  responses: AnnotationResponse[];
  timeSpent: number;
  confidenceScore?: number;
  submittedAt: string;
  reviewStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
  reviewFeedback?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

// ── Task request DTOs ─────────────────────────────────────────────────────

export interface TaskFilterDto {
  batchId?: string;
  projectId?: string;
  status?: TaskStatusValue;
  priority?: number;
  assignedTo?: string;
  taskType?: TaskTypeValue;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface GetNextTaskDto {
  userId: string;
  queueId?: string;
  taskType?: TaskTypeValue;
  projectId?: string;
}

export interface SubmitTaskDto {
  assignmentId: string;
  annotationData: unknown;
  confidenceScore?: number;
  timeSpent?: number;
  responses?: AnnotationResponse[];
}

export interface UpdateTaskStatusDto {
  status: TaskStatusValue;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface ReviewSubmitDto {
  annotationId: string;
  decision: 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
  feedback?: string;
  qualityScore?: number;
  tags?: string[];
}

// ── Batch ─────────────────────────────────────────────────────────────────

export interface Batch {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  priority: number;
  totalTasks: number;
  completedTasks: number;
  status: BatchStatusValue;
  createdAt: string;
  updatedAt: string;
}

// ── Time analytics ────────────────────────────────────────────────────────

export interface TimeAnalyticsQueryDto {
  projectId?: string;
  batchId?: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
}

export interface AnnotatorMetric {
  userId: string;
  totalTasks: number;
  totalTimeSpent: number;
  averageTimePerTask: number;
}

export interface ReviewerMetric {
  userId: string;
  totalReviews: number;
  totalTimeSpent: number;
  averageTimePerReview: number;
}

export interface TaskTimeMetric {
  taskId: string;
  estimatedDuration: number;
  actualDuration: number;
  efficiency: number;
}

export interface TimeAnalytics {
  summary: {
    totalAnnotators: number;
    totalReviewers: number;
    totalAnnotationTime: number;
    totalReviewTime: number;
    averageAnnotationTime: number;
    averageReviewTime: number;
  };
  annotatorMetrics: AnnotatorMetric[];
  reviewerMetrics: ReviewerMetric[];
  taskMetrics: TaskTimeMetric[];
}
