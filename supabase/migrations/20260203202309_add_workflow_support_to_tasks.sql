/*
  # Add Workflow Support to Existing Tasks

  ## Changes
  1. Add workflow_id column to tasks table to link tasks with workflows
  2. Add indexes for better query performance
  3. Create function to pull next task from queue (FIFO)
  4. Create function to get consensus data across multiple annotations

  ## Notes
  - Tasks can now be linked to visual workflows for dynamic questionnaires
  - Maintains backward compatibility with existing task structure
*/

-- Add workflow_id to tasks if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'workflow_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN workflow_id uuid REFERENCES workflows(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_tasks_workflow_id ON tasks(workflow_id);
  END IF;
END $$;

-- Function to pull next available task from queue for an annotator
CREATE OR REPLACE FUNCTION pull_next_task(
  p_user_id uuid,
  p_project_id uuid DEFAULT NULL
)
RETURNS TABLE (
  task_id uuid,
  project_id uuid,
  workflow_id uuid,
  file_url text,
  file_type text,
  priority integer
) AS $$
DECLARE
  v_task_id uuid;
  v_max_tasks integer;
  v_current_tasks integer;
BEGIN
  -- Get max tasks allowed per annotator from project settings
  SELECT COALESCE(max_annotators_per_task, 10) INTO v_max_tasks
  FROM projects
  WHERE id = p_project_id OR p_project_id IS NULL
  LIMIT 1;

  -- Count current active assignments for this user
  SELECT COUNT(*) INTO v_current_tasks
  FROM assignments
  WHERE user_id = p_user_id
    AND status IN ('ASSIGNED', 'IN_PROGRESS')
    AND (p_project_id IS NULL OR EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = assignments.task_id
      AND t.project_id = p_project_id
    ));

  -- Check if user has reached max tasks
  IF v_current_tasks >= v_max_tasks THEN
    RETURN;
  END IF;

  -- Find next available task
  SELECT t.id INTO v_task_id
  FROM tasks t
  LEFT JOIN task_files tf ON tf.task_id = t.id
  WHERE t.status = 'QUEUED'
    AND (p_project_id IS NULL OR t.project_id = p_project_id)
    AND NOT EXISTS (
      SELECT 1 FROM assignments a
      WHERE a.task_id = t.id
      AND a.user_id = p_user_id
    )
  ORDER BY t.priority DESC, t.created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_task_id IS NOT NULL THEN
    -- Update task status
    UPDATE tasks t
    SET status = 'ASSIGNED'
    WHERE t.id = v_task_id;

    -- Create assignment
    INSERT INTO assignments (task_id, user_id, status, assigned_at)
    VALUES (v_task_id, p_user_id, 'ASSIGNED', now());

    -- Return task details
    RETURN QUERY
    SELECT t.id, t.project_id, t.workflow_id, COALESCE(tf.file_url, ''), COALESCE(tf.file_type::text, 'text'), t.priority
    FROM tasks t
    LEFT JOIN task_files tf ON tf.task_id = t.id
    WHERE t.id = v_task_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all annotations for a task (for consensus view)
CREATE OR REPLACE FUNCTION get_task_annotations_for_review(p_task_id uuid)
RETURNS TABLE (
  annotation_id uuid,
  user_id uuid,
  user_name text,
  user_email text,
  responses jsonb,
  time_spent integer,
  submitted_at timestamptz,
  review_status text,
  review_feedback text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.user_id,
    u.name,
    u.email,
    jsonb_object_agg(ar.question_id, ar.answer) as responses,
    a.time_spent,
    a.submitted_at,
    r.decision::text,
    r.feedback
  FROM annotations a
  INNER JOIN users u ON u.id = a.user_id
  LEFT JOIN annotation_responses ar ON ar.annotation_id = a.id
  LEFT JOIN reviews r ON r.annotation_id = a.id
  WHERE a.task_id = p_task_id
    AND a.is_draft = false
  GROUP BY a.id, a.user_id, u.name, u.email, a.time_spent, a.submitted_at, r.decision, r.feedback
  ORDER BY a.submitted_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate inter-annotator agreement
CREATE OR REPLACE FUNCTION calculate_agreement_score(p_task_id uuid)
RETURNS numeric AS $$
DECLARE
  v_total_questions integer;
  v_agreement_count integer;
  v_score numeric;
BEGIN
  -- Count total questions answered
  SELECT COUNT(DISTINCT question_id) INTO v_total_questions
  FROM annotation_responses ar
  INNER JOIN annotations a ON a.id = ar.annotation_id
  WHERE a.task_id = p_task_id
    AND a.is_draft = false;

  IF v_total_questions = 0 THEN
    RETURN 0;
  END IF;

  -- Count questions where all annotators agree
  SELECT COUNT(*) INTO v_agreement_count
  FROM (
    SELECT ar.question_id
    FROM annotation_responses ar
    INNER JOIN annotations a ON a.id = ar.annotation_id
    WHERE a.task_id = p_task_id
      AND a.is_draft = false
    GROUP BY ar.question_id
    HAVING COUNT(DISTINCT ar.answer) = 1
  ) agreed_questions;

  v_score := (v_agreement_count::numeric / v_total_questions::numeric) * 100;
  RETURN ROUND(v_score, 2);
END;
$$ LANGUAGE plpgsql;
