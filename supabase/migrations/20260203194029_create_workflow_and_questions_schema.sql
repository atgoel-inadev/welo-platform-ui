/*
  # Workflow Builder and Dynamic Questions Schema
  
  This migration creates the database structure for the Visual Workflow Builder
  and Dynamic Question Builder system.
  
  ## 1. New Tables
  
  ### `workflows`
  Stores workflow configurations created by project managers/admins
  - `id` (uuid, primary key)
  - `project_id` (uuid, foreign key to projects)
  - `name` (text) - Workflow name
  - `description` (text) - Workflow description
  - `flow_data` (jsonb) - React Flow nodes and edges data
  - `status` (text) - draft, active, archived
  - `version` (integer) - Version number for tracking changes
  - `created_by` (uuid, foreign key to users)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `workflow_nodes`
  Individual nodes in workflows (questions, decisions, conditions)
  - `id` (uuid, primary key)
  - `workflow_id` (uuid, foreign key to workflows)
  - `node_id` (text) - Unique identifier within workflow
  - `node_type` (text) - question, decision, condition, end
  - `label` (text) - Node display label
  - `config` (jsonb) - Node-specific configuration
  - `position_x` (numeric) - X coordinate in workflow canvas
  - `position_y` (numeric) - Y coordinate in workflow canvas
  - `created_at` (timestamptz)
  
  ### `questions`
  Question definitions used in workflow nodes
  - `id` (uuid, primary key)
  - `workflow_node_id` (uuid, foreign key to workflow_nodes)
  - `question_type` (text) - multiple_choice, text_input, file_upload, annotation, rating
  - `question_text` (text) - The actual question
  - `options` (jsonb) - For multiple choice, rating scales, etc.
  - `validation_rules` (jsonb) - Min/max length, required, etc.
  - `annotation_config` (jsonb) - For annotation-based questions
  - `order` (integer) - Order within workflow node
  - `is_required` (boolean) - Whether answer is mandatory
  - `created_at` (timestamptz)
  
  ### `workflow_transitions`
  Defines transitions between nodes (edges in React Flow)
  - `id` (uuid, primary key)
  - `workflow_id` (uuid, foreign key to workflows)
  - `source_node_id` (text) - Source node identifier
  - `target_node_id` (text) - Target node identifier
  - `condition` (jsonb) - Guard condition for transition
  - `label` (text) - Transition label
  - `created_at` (timestamptz)
  
  ### `workflow_responses`
  User responses to workflow questions
  - `id` (uuid, primary key)
  - `workflow_id` (uuid, foreign key to workflows)
  - `task_id` (uuid, foreign key to tasks)
  - `user_id` (uuid, foreign key to users)
  - `question_id` (uuid, foreign key to questions)
  - `response_data` (jsonb) - The actual response
  - `annotations` (jsonb) - Annotation data if applicable
  - `submitted_at` (timestamptz)
  
  ### `workflow_templates`
  Pre-built workflow templates
  - `id` (uuid, primary key)
  - `name` (text) - Template name
  - `description` (text) - Template description
  - `category` (text) - image_annotation, video_review, data_validation, etc.
  - `template_data` (jsonb) - Complete workflow configuration
  - `is_public` (boolean) - Available to all users
  - `created_by` (uuid, foreign key to users)
  - `created_at` (timestamptz)
  
  ## 2. Security
  
  - Enable RLS on all tables
  - Project managers can create/edit workflows for their projects
  - Admins have full access
  - Annotators can view workflows and submit responses
  - Reviewers can view workflows and responses
  
  ## 3. Indexes
  
  - Index on workflow project_id for fast lookup
  - Index on workflow status
  - Index on workflow_nodes workflow_id
  - Index on questions workflow_node_id
  - Index on workflow_responses for task/user queries
*/

-- Workflows table
CREATE TABLE IF NOT EXISTS workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  flow_data jsonb NOT NULL DEFAULT '{"nodes": [], "edges": []}'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  version integer NOT NULL DEFAULT 1,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflows_project_id ON workflows(project_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_created_by ON workflows(created_by);

-- Workflow nodes table
CREATE TABLE IF NOT EXISTS workflow_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES workflows(id) ON DELETE CASCADE NOT NULL,
  node_id text NOT NULL,
  node_type text NOT NULL CHECK (node_type IN ('question', 'decision', 'condition', 'end', 'start')),
  label text NOT NULL,
  config jsonb DEFAULT '{}'::jsonb,
  position_x numeric DEFAULT 0,
  position_y numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(workflow_id, node_id)
);

CREATE INDEX IF NOT EXISTS idx_workflow_nodes_workflow_id ON workflow_nodes(workflow_id);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_node_id uuid REFERENCES workflow_nodes(id) ON DELETE CASCADE,
  question_type text NOT NULL CHECK (question_type IN ('multiple_choice', 'text_input', 'file_upload', 'annotation', 'rating', 'boolean', 'scale')),
  question_text text NOT NULL,
  options jsonb DEFAULT '[]'::jsonb,
  validation_rules jsonb DEFAULT '{}'::jsonb,
  annotation_config jsonb DEFAULT '{}'::jsonb,
  order_index integer DEFAULT 0,
  is_required boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_questions_workflow_node_id ON questions(workflow_node_id);

-- Workflow transitions table (edges)
CREATE TABLE IF NOT EXISTS workflow_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES workflows(id) ON DELETE CASCADE NOT NULL,
  source_node_id text NOT NULL,
  target_node_id text NOT NULL,
  condition jsonb DEFAULT '{}'::jsonb,
  label text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_transitions_workflow_id ON workflow_transitions(workflow_id);

-- Workflow responses table
CREATE TABLE IF NOT EXISTS workflow_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES workflows(id) ON DELETE CASCADE NOT NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  response_data jsonb NOT NULL,
  annotations jsonb DEFAULT '[]'::jsonb,
  submitted_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_responses_workflow_id ON workflow_responses(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_responses_task_id ON workflow_responses(task_id);
CREATE INDEX IF NOT EXISTS idx_workflow_responses_user_id ON workflow_responses(user_id);

-- Workflow templates table
CREATE TABLE IF NOT EXISTS workflow_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  template_data jsonb NOT NULL,
  is_public boolean DEFAULT true,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON workflow_templates(category);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_is_public ON workflow_templates(is_public);

-- Enable Row Level Security
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workflows
CREATE POLICY "Admins can view all workflows"
  ON workflows FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

CREATE POLICY "Project managers can view their project workflows"
  ON workflows FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('PROJECT_MANAGER', 'ADMIN')
    )
    OR
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = workflows.project_id
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Annotators can view active workflows for their tasks"
  ON workflows FOR SELECT
  TO authenticated
  USING (
    workflows.status = 'active'
    AND (
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('ANNOTATOR', 'REVIEWER')
      )
    )
  );

CREATE POLICY "Project managers can create workflows"
  ON workflows FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('PROJECT_MANAGER', 'ADMIN')
    )
  );

CREATE POLICY "Creators can update their workflows"
  ON workflows FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'ADMIN'
  ))
  WITH CHECK (created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'ADMIN'
  ));

CREATE POLICY "Admins can delete workflows"
  ON workflows FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- RLS Policies for workflow_nodes
CREATE POLICY "Users can view workflow nodes if they can view the workflow"
  ON workflow_nodes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflows
      WHERE workflows.id = workflow_nodes.workflow_id
    )
  );

CREATE POLICY "Project managers can manage workflow nodes"
  ON workflow_nodes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflows
      INNER JOIN users ON users.id = auth.uid()
      WHERE workflows.id = workflow_nodes.workflow_id
      AND (workflows.created_by = auth.uid() OR users.role = 'ADMIN')
    )
  );

-- RLS Policies for questions
CREATE POLICY "Users can view questions if they can view the workflow"
  ON questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflow_nodes
      INNER JOIN workflows ON workflows.id = workflow_nodes.workflow_id
      WHERE workflow_nodes.id = questions.workflow_node_id
    )
  );

CREATE POLICY "Project managers can manage questions"
  ON questions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflow_nodes
      INNER JOIN workflows ON workflows.id = workflow_nodes.workflow_id
      INNER JOIN users ON users.id = auth.uid()
      WHERE workflow_nodes.id = questions.workflow_node_id
      AND (workflows.created_by = auth.uid() OR users.role = 'ADMIN')
    )
  );

-- RLS Policies for workflow_transitions
CREATE POLICY "Users can view transitions if they can view the workflow"
  ON workflow_transitions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflows
      WHERE workflows.id = workflow_transitions.workflow_id
    )
  );

CREATE POLICY "Project managers can manage transitions"
  ON workflow_transitions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflows
      INNER JOIN users ON users.id = auth.uid()
      WHERE workflows.id = workflow_transitions.workflow_id
      AND (workflows.created_by = auth.uid() OR users.role = 'ADMIN')
    )
  );

-- RLS Policies for workflow_responses
CREATE POLICY "Users can view their own responses"
  ON workflow_responses FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Project managers and reviewers can view all responses"
  ON workflow_responses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('PROJECT_MANAGER', 'ADMIN', 'REVIEWER')
    )
  );

CREATE POLICY "Annotators can submit responses"
  ON workflow_responses FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('ANNOTATOR', 'REVIEWER')
    )
  );

-- RLS Policies for workflow_templates
CREATE POLICY "Everyone can view public templates"
  ON workflow_templates FOR SELECT
  TO authenticated
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Project managers can create templates"
  ON workflow_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('PROJECT_MANAGER', 'ADMIN')
    )
  );

CREATE POLICY "Creators can update their templates"
  ON workflow_templates FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Add trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_workflows_updated_at'
  ) THEN
    CREATE TRIGGER update_workflows_updated_at
      BEFORE UPDATE ON workflows
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;
