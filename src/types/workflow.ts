import { Node, Edge } from 'reactflow';

export type WorkflowStatus = 'draft' | 'active' | 'archived';

export type NodeType = 'start' | 'question' | 'decision' | 'condition' | 'end';

export type QuestionType =
  | 'multiple_choice'
  | 'text_input'
  | 'file_upload'
  | 'annotation'
  | 'rating'
  | 'boolean'
  | 'scale';

export interface Workflow {
  id: string;
  project_id: string;
  name: string;
  description: string;
  flow_data: {
    nodes: Node[];
    edges: Edge[];
  };
  status: WorkflowStatus;
  version: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowNode {
  id: string;
  workflow_id: string;
  node_id: string;
  node_type: NodeType;
  label: string;
  config: Record<string, any>;
  position_x: number;
  position_y: number;
  created_at: string;
}

export interface Question {
  id: string;
  workflow_node_id: string;
  question_type: QuestionType;
  question_text: string;
  options: any[];
  validation_rules: ValidationRules;
  annotation_config: AnnotationConfig;
  order_index: number;
  is_required: boolean;
  created_at: string;
}

export interface ValidationRules {
  min_length?: number;
  max_length?: number;
  pattern?: string;
  min_value?: number;
  max_value?: number;
  required?: boolean;
  custom?: string;
}

export interface AnnotationConfig {
  annotation_types?: ('point' | 'rectangle' | 'polygon' | 'text' | 'timestamp')[];
  min_annotations?: number;
  max_annotations?: number;
  allowed_labels?: string[];
  require_notes?: boolean;
}

export interface WorkflowTransition {
  id: string;
  workflow_id: string;
  source_node_id: string;
  target_node_id: string;
  condition: TransitionCondition;
  label: string;
  created_at: string;
}

export interface TransitionCondition {
  type?: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'always';
  field?: string;
  value?: any;
  operator?: 'and' | 'or';
  conditions?: TransitionCondition[];
}

export interface WorkflowResponse {
  id: string;
  workflow_id: string;
  task_id: string;
  user_id: string;
  question_id: string;
  response_data: any;
  annotations: any[];
  submitted_at: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template_data: {
    nodes: Node[];
    edges: Edge[];
    questions: Partial<Question>[];
  };
  is_public: boolean;
  created_by: string;
  created_at: string;
}

export interface QuestionNodeData {
  label: string;
  questions: Question[];
  onEdit?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
}

export interface DecisionNodeData {
  label: string;
  condition: string;
  onEdit?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
}

export interface ConditionNodeData {
  label: string;
  expression: string;
  onEdit?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
}

export interface EndNodeData {
  label: string;
  message?: string;
}

export interface StartNodeData {
  label: string;
}

export type CustomNodeData =
  | QuestionNodeData
  | DecisionNodeData
  | ConditionNodeData
  | EndNodeData
  | StartNodeData;
