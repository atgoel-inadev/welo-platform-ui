import { annotationQaApi } from '../lib/apiClient';

// ─── Request DTOs ─────────────────────────────────────────────────────────────

export interface SubmitAnnotationQaDto {
  /** Map of questionId → response value */
  annotationData: Record<string, any>;
  confidenceScore?: number;
  /** Elapsed time in seconds */
  timeSpent?: number;
  /** Save as draft (skip QC pipeline) */
  isDraft?: boolean;
}

export interface SubmitReviewQaDto {
  annotationId: string;
  /** Quality score 0-100 */
  score: number;
  decision: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION';
  feedback?: string;
  /** Individual issue notes from question-level scoring */
  issues?: string[];
  /** Elapsed time in seconds */
  timeSpent?: number;
}

// ─── Response Types ───────────────────────────────────────────────────────────

export interface QcCheckResult {
  ruleName: string;
  ruleType: string;
  passed: boolean;
  score: number;
  message?: string;
  severity: 'ERROR' | 'WARNING';
}

export interface QcResult {
  passed: boolean;
  overallScore: number;
  goldComparisonScore?: number;
  checks: QcCheckResult[];
}

export interface AnnotationQaRecord {
  id: string;
  taskId: string;
  annotationData: Record<string, any>;
  confidenceScore?: number;
  timeSpent?: number;
  isDraft: boolean;
  /** Present on non-draft submissions after QC runs */
  qcResult?: QcResult;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewQaRecord {
  id: string;
  taskId: string;
  annotationId: string;
  score: number;
  decision: string;
  feedback?: string;
  /** Weighted overall score: reviewer 60% + auto-QC 40% */
  overallScore: number;
  autoQcScore?: number;
  createdAt: string;
}

export interface QaSummary {
  taskId: string;
  annotation?: AnnotationQaRecord;
  qcChecks?: any[];
  reviews?: ReviewQaRecord[];
  stateDecision?: {
    status: string;
    overallScore: number;
    requiresEscalation: boolean;
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

class AnnotationQaService {
  /**
   * Submit an annotation to the QA pipeline.
   * Triggers automated quality checks (gold comparison + rule engine).
   */
  async submitAnnotation(
    taskId: string,
    dto: SubmitAnnotationQaDto,
  ): Promise<AnnotationQaRecord> {
    return annotationQaApi.post<AnnotationQaRecord>(`/tasks/${taskId}/annotations`, dto);
  }

  /**
   * Get all annotations submitted for a task (via QA service).
   */
  async getAnnotations(taskId: string): Promise<AnnotationQaRecord[]> {
    const result = await annotationQaApi.get<AnnotationQaRecord[] | { data: AnnotationQaRecord[] }>(
      `/tasks/${taskId}/annotations`,
    );
    return Array.isArray(result) ? result : (result as any).data ?? [];
  }

  /**
   * Get version history for a specific annotation.
   */
  async getAnnotationHistory(annotationId: string): Promise<any[]> {
    const result = await annotationQaApi.get<any[]>(`/annotations/${annotationId}/history`);
    return Array.isArray(result) ? result : [];
  }

  /**
   * Submit a reviewer decision for an annotation.
   * The backend computes overallScore = reviewScore*0.6 + autoQcScore*0.4
   * and fires XState events (TASK_APPROVED / TASK_REJECTED / TASK_ESCALATED).
   */
  async submitReview(taskId: string, dto: SubmitReviewQaDto): Promise<ReviewQaRecord> {
    return annotationQaApi.post<ReviewQaRecord>(`/tasks/${taskId}/reviews`, dto);
  }

  /**
   * Get all review records for a task.
   */
  async getReviews(taskId: string): Promise<ReviewQaRecord[]> {
    const result = await annotationQaApi.get<ReviewQaRecord[] | { data: ReviewQaRecord[] }>(
      `/tasks/${taskId}/reviews`,
    );
    return Array.isArray(result) ? result : (result as any).data ?? [];
  }

  /**
   * Get the full QA summary for a task (annotations, QC checks, reviews, state decision).
   * Useful for the reviewer view to pre-load auto-QC results.
   */
  async getQaSummary(taskId: string): Promise<QaSummary> {
    return annotationQaApi.get<QaSummary>(`/tasks/${taskId}/qa-summary`);
  }

  /**
   * Get quality check records for a task.
   */
  async getQualityChecks(taskId: string): Promise<any[]> {
    const result = await annotationQaApi.get<any[]>(`/tasks/${taskId}/quality-checks`);
    return Array.isArray(result) ? result : [];
  }
}

export const annotationQaService = new AnnotationQaService();
