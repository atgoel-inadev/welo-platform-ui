import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface AnnotationResponse {
  questionId: string;
  response: any;
}

export interface SaveAnnotationDto {
  responses: AnnotationResponse[];
  extraWidgetData?: Record<string, any>;
}

export interface SaveReviewDto {
  decision: 'approved' | 'rejected' | 'needs_revision';
  comments?: string;
  qualityScore?: number;
  extraWidgetData?: Record<string, any>;
}

export interface TaskRenderConfig {
  taskId: string;
  projectId: string;
  viewType: 'annotator' | 'reviewer';
  taskData: {
    id: string;
    name: string;
    description: string;
    fileUrls: string[];
    metadata: Record<string, any>;
    currentReviewLevel: number;
    status: string;
  };
  uiConfiguration: any;
  annotationQuestions: any[];
  previousAnnotations: any[] | null;
  annotationResponses: any[];
  extraWidgetData: Record<string, any>;
  reviewData: any[];
}

export interface AnnotationHistory {
  taskId: string;
  annotationResponses: any[];
  extraWidgetData: Record<string, any>;
  reviewData: any[];
  annotations: any[];
}

/**
 * Task Rendering Service
 * API client for task rendering endpoints
 */
export class TaskRenderingService {
  private static instance: TaskRenderingService;

  private constructor() {}

  static getInstance(): TaskRenderingService {
    if (!TaskRenderingService.instance) {
      TaskRenderingService.instance = new TaskRenderingService();
    }
    return TaskRenderingService.instance;
  }

  /**
   * Get task render configuration
   * Returns complete configuration for rendering task UI
   * 
   * @param taskId - Task ID
   * @param userId - User ID (temporary, should come from auth token)
   */
  async getTaskRenderConfig(taskId: string, userId: string): Promise<TaskRenderConfig> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/tasks/${taskId}/render-config`,
        {
          params: { userId },
          headers: {
            'Content-Type': 'application/json',
            // TODO: Add auth token
            // 'Authorization': `Bearer ${getAuthToken()}`,
          },
        },
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to get task render config:', error);
      throw new Error(error.response?.data?.message || 'Failed to load task configuration');
    }
  }

  /**
   * Save annotation response
   * Saves annotator responses to annotation questions + extra widget data
   * 
   * @param taskId - Task ID
   * @param userId - User ID (temporary)
   * @param data - Annotation data
   */
  async saveAnnotation(taskId: string, userId: string, data: SaveAnnotationDto): Promise<void> {
    try {
      await axios.post(
        `${API_BASE_URL}/tasks/${taskId}/annotation`,
        data,
        {
          params: { userId },
          headers: {
            'Content-Type': 'application/json',
            // TODO: Add auth token
            // 'Authorization': `Bearer ${getAuthToken()}`,
          },
        },
      );
    } catch (error: any) {
      console.error('Failed to save annotation:', error);
      throw new Error(error.response?.data?.message || 'Failed to save annotation');
    }
  }

  /**
   * Save review decision
   * Saves reviewer decision + quality score + review widget data
   * 
   * @param taskId - Task ID
   * @param userId - User ID (temporary)
   * @param data - Review data
   */
  async saveReview(taskId: string, userId: string, data: SaveReviewDto): Promise<void> {
    try {
      await axios.post(
        `${API_BASE_URL}/tasks/${taskId}/review`,
        data,
        {
          params: { userId },
          headers: {
            'Content-Type': 'application/json',
            // TODO: Add auth token
            // 'Authorization': `Bearer ${getAuthToken()}`,
          },
        },
      );
    } catch (error: any) {
      console.error('Failed to save review:', error);
      throw new Error(error.response?.data?.message || 'Failed to save review');
    }
  }

  /**
   * Get annotation history
   * Returns complete history of annotations and reviews for audit/tracking
   * 
   * @param taskId - Task ID
   */
  async getAnnotationHistory(taskId: string): Promise<AnnotationHistory> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/tasks/${taskId}/annotation-history`,
        {
          headers: {
            'Content-Type': 'application/json',
            // TODO: Add auth token
            // 'Authorization': `Bearer ${getAuthToken()}`,
          },
        },
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to get annotation history:', error);
      throw new Error(error.response?.data?.message || 'Failed to load annotation history');
    }
  }
}

// Export singleton instance
export const taskRenderingService = TaskRenderingService.getInstance();
