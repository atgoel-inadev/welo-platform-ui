import { supabase } from '../lib/supabase';

export interface TaskWithFiles {
  id: string;
  project_id: string;
  workflow_id: string | null;
  status: string;
  priority: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  file_url?: string;
  file_type?: string;
  file_metadata?: Record<string, any>;
}

export interface AnnotationResponse {
  question_id: string;
  answer: any;
  time_spent?: number;
  confidence?: number;
}

export interface TaskAnnotation {
  annotation_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  responses: Record<string, any>;
  time_spent: number;
  submitted_at: string;
  review_status: string | null;
  review_feedback: string | null;
}

export const taskService = {
  async getMyTasks() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('assignments')
      .select(`
        id,
        status,
        assigned_at,
        started_at,
        task:tasks (
          id,
          project_id,
          workflow_id,
          status,
          priority,
          metadata,
          file:task_files (
            file_url,
            file_type,
            file_metadata
          )
        )
      `)
      .eq('user_id', user.id)
      .in('status', ['ASSIGNED', 'IN_PROGRESS'])
      .order('assigned_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  async pullNextTask(projectId?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.rpc('pull_next_task', {
      p_user_id: user.id,
      p_project_id: projectId || null
    });

    if (error) throw error;
    return data?.[0] || null;
  },

  async getTaskDetails(taskId: string) {
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select(`
        *,
        workflow:workflows (
          id,
          name,
          flow_data,
          status
        ),
        file:task_files (
          file_url,
          file_type,
          file_metadata
        ),
        project:projects (
          id,
          name,
          project_type,
          annotation_questions
        )
      `)
      .eq('id', taskId)
      .single();

    if (taskError) throw taskError;
    return task;
  },

  async getWorkflowQuestions(workflowId: string) {
    const { data, error } = await supabase
      .from('workflow_nodes')
      .select(`
        id,
        node_id,
        node_type,
        label,
        config,
        questions (
          id,
          question_type,
          question_text,
          options,
          validation_rules,
          annotation_config,
          order_index,
          is_required
        )
      `)
      .eq('workflow_id', workflowId)
      .eq('node_type', 'question')
      .order('position_y', { ascending: true });

    if (error) throw error;

    const questions = data?.flatMap(node =>
      (node.questions || []).map((q: any) => ({
        ...q,
        node_id: node.node_id,
        node_label: node.label
      }))
    ) || [];

    return questions.sort((a, b) => a.order_index - b.order_index);
  },

  async startTask(taskId: string, assignmentId: string) {
    const { error: assignmentError } = await supabase
      .from('assignments')
      .update({
        status: 'IN_PROGRESS',
        started_at: new Date().toISOString()
      })
      .eq('id', assignmentId);

    if (assignmentError) throw assignmentError;

    const { error: taskError } = await supabase
      .from('tasks')
      .update({ status: 'IN_PROGRESS' })
      .eq('id', taskId);

    if (taskError) throw taskError;
  },

  async submitAnnotation(
    taskId: string,
    assignmentId: string,
    responses: AnnotationResponse[],
    timeSpent: number
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: annotation, error: annotationError } = await supabase
      .from('annotations')
      .insert({
        task_id: taskId,
        user_id: user.id,
        assignment_id: assignmentId,
        time_spent: timeSpent,
        is_draft: false,
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (annotationError) throw annotationError;

    const responsesData = responses.map(r => ({
      annotation_id: annotation.id,
      question_id: r.question_id,
      answer: r.answer,
      time_spent: r.time_spent || 0,
      confidence: r.confidence
    }));

    const { error: responsesError } = await supabase
      .from('annotation_responses')
      .insert(responsesData);

    if (responsesError) throw responsesError;

    const { error: assignmentError } = await supabase
      .from('assignments')
      .update({
        status: 'SUBMITTED',
        completed_at: new Date().toISOString()
      })
      .eq('id', assignmentId);

    if (assignmentError) throw assignmentError;

    const { error: taskError } = await supabase
      .from('tasks')
      .update({ status: 'PENDING_REVIEW' })
      .eq('id', taskId);

    if (taskError) throw taskError;

    return annotation;
  },

  async saveDraft(
    taskId: string,
    assignmentId: string,
    responses: AnnotationResponse[]
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: existingDraft } = await supabase
      .from('annotations')
      .select('id')
      .eq('task_id', taskId)
      .eq('user_id', user.id)
      .eq('is_draft', true)
      .maybeSingle();

    if (existingDraft) {
      await supabase
        .from('annotation_responses')
        .delete()
        .eq('annotation_id', existingDraft.id);

      const responsesData = responses.map(r => ({
        annotation_id: existingDraft.id,
        question_id: r.question_id,
        answer: r.answer
      }));

      const { error } = await supabase
        .from('annotation_responses')
        .insert(responsesData);

      if (error) throw error;
      return existingDraft;
    } else {
      const { data: annotation, error: annotationError } = await supabase
        .from('annotations')
        .insert({
          task_id: taskId,
          user_id: user.id,
          assignment_id: assignmentId,
          time_spent: 0,
          is_draft: true
        })
        .select()
        .single();

      if (annotationError) throw annotationError;

      const responsesData = responses.map(r => ({
        annotation_id: annotation.id,
        question_id: r.question_id,
        answer: r.answer
      }));

      const { error: responsesError } = await supabase
        .from('annotation_responses')
        .insert(responsesData);

      if (responsesError) throw responsesError;
      return annotation;
    }
  },

  async getTaskAnnotations(taskId: string): Promise<TaskAnnotation[]> {
    const { data, error } = await supabase.rpc('get_task_annotations_for_review', {
      p_task_id: taskId
    });

    if (error) throw error;
    return data || [];
  },

  async submitReview(
    taskId: string,
    annotationId: string,
    status: 'APPROVED' | 'REJECTED' | 'NEEDS_REWORK',
    feedback: string,
    qualityScore?: number
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('reviews')
      .insert({
        task_id: taskId,
        annotation_id: annotationId,
        reviewer_id: user.id,
        decision: status,
        feedback,
        review_level: 1
      });

    if (error) throw error;

    if (status === 'APPROVED') {
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ status: 'APPROVED' })
        .eq('id', taskId);

      if (taskError) throw taskError;
    } else if (status === 'REJECTED') {
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ status: 'REJECTED' })
        .eq('id', taskId);

      if (taskError) throw taskError;
    }
  },

  async getTasksForReview(reviewerId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        id,
        project_id,
        workflow_id,
        status,
        priority,
        metadata,
        created_at,
        updated_at,
        file:task_files (
          file_url,
          file_type,
          file_metadata
        ),
        project:projects (
          id,
          name,
          project_type
        ),
        annotations:annotations (
          id,
          user_id,
          submitted_at
        )
      `)
      .in('status', ['PENDING_REVIEW', 'IN_REVIEW'])
      .order('priority', { ascending: false })
      .order('updated_at', { ascending: true });

    if (error) throw error;
    return data;
  }
};
