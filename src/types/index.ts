export enum UserRole {
  ADMIN = 'ADMIN',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  REVIEWER = 'REVIEWER',
  ANNOTATOR = 'ANNOTATOR',
  CUSTOMER = 'CUSTOMER'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

export enum ProjectStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}

export enum ProjectType {
  TEXT_ANNOTATION = 'TEXT_ANNOTATION',
  IMAGE_ANNOTATION = 'IMAGE_ANNOTATION',
  AUDIO_TRANSCRIPTION = 'AUDIO_TRANSCRIPTION',
  VIDEO_ANNOTATION = 'VIDEO_ANNOTATION',
  DATA_LABELING = 'DATA_LABELING',
  CONTENT_MODERATION = 'CONTENT_MODERATION'
}

export enum QuestionType {
  MULTI_SELECT = 'MULTI_SELECT',
  SINGLE_SELECT = 'SINGLE_SELECT',
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  RATING = 'RATING',
  MULTI_TURN = 'MULTI_TURN'
}

export enum TaskStatus {
  QUEUED = 'QUEUED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED'
}

export enum FileType {
  TEXT = 'TEXT',
  MARKDOWN = 'MARKDOWN',
  HTML = 'HTML',
  CSV = 'CSV',
  JSON = 'JSON',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  IMAGE = 'IMAGE',
  PDF = 'PDF'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  subscription_tier?: string;
  created_at: string;
  updated_at: string;
}

export interface AnnotationQuestion {
  id: string;
  type: QuestionType;
  label: string;
  description?: string;
  required: boolean;
  order: number;
  depends_on?: string;
  show_when?: Record<string, unknown>;
  options?: Array<{
    value: string;
    label: string;
    icon?: string;
  }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom_message?: string;
  };
  turns?: Array<{
    role: 'user' | 'assistant';
    label: string;
  }>;
}

export interface ReviewLevel {
  level: number;
  name: string;
  reviewers_count: number;
  require_all_approvals: boolean;
  approval_threshold?: number;
  auto_assign: boolean;
  allowed_reviewers?: string[];
}

export interface WorkflowConfiguration {
  review_levels: ReviewLevel[];
  enable_multi_annotator: boolean;
  annotators_per_task: number;
  consensus_threshold: number;
  queue_strategy: 'FIFO' | 'PRIORITY' | 'SKILL_BASED';
  assignment_expiration_hours: number;
  max_tasks_per_annotator: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  customer_id: string;
  project_type: ProjectType;
  status: ProjectStatus;
  annotation_questions: AnnotationQuestion[];
  workflow_config: WorkflowConfiguration;
  quality_threshold?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

export interface Batch {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  priority: number;
  total_tasks: number;
  completed_tasks: number;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  created_at: string;
  updated_at: string;
  project?: Project;
}

export interface Task {
  id: string;
  batch_id: string;
  file_id: string;
  priority: number;
  status: TaskStatus;
  estimated_duration?: number;
  created_at: string;
  updated_at: string;
  batch?: Batch;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  customer_id: string;
  project_type: ProjectType;
  annotation_questions: AnnotationQuestion[];
  workflow_config: WorkflowConfiguration;
  quality_threshold?: number;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  annotation_questions?: AnnotationQuestion[];
  workflow_config?: WorkflowConfiguration;
  quality_threshold?: number;
}

export interface ProjectStatistics {
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  pending_review_tasks: number;
  average_completion_time: number;
  quality_score: number;
  active_annotators: number;
}
