import { Node, Edge } from 'reactflow';
import { Question } from '../types/workflow';

export interface WorkflowTemplateData {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: Node[];
  edges: Edge[];
  questions: Partial<Question>[];
}

export const workflowTemplates: WorkflowTemplateData[] = [
  {
    id: 'simple-image-annotation',
    name: 'Simple Image Annotation',
    description: 'Basic workflow for annotating images with bounding boxes and labels',
    category: 'image_annotation',
    nodes: [
      {
        id: 'start-1',
        type: 'start',
        position: { x: 250, y: 50 },
        data: { label: 'Start' },
      },
      {
        id: 'question-1',
        type: 'question',
        position: { x: 200, y: 150 },
        data: {
          label: 'Image Annotation',
          questions: [
            {
              question_type: 'annotation',
              question_text: 'Mark all objects of interest in the image',
              annotation_config: {
                annotation_types: ['rectangle', 'polygon'],
                min_annotations: 1,
                max_annotations: 999,
                require_notes: true,
              },
              is_required: true,
              order_index: 0,
            },
          ],
        },
      },
      {
        id: 'question-2',
        type: 'question',
        position: { x: 200, y: 300 },
        data: {
          label: 'Quality Check',
          questions: [
            {
              question_type: 'rating',
              question_text: 'Rate the image quality',
              validation_rules: { min_value: 1, max_value: 5 },
              is_required: true,
              order_index: 0,
            },
          ],
        },
      },
      {
        id: 'end-1',
        type: 'end',
        position: { x: 250, y: 450 },
        data: { label: 'Complete', message: 'Thank you for completing this annotation!' },
      },
    ],
    edges: [
      { id: 'e1', source: 'start-1', target: 'question-1', animated: true },
      { id: 'e2', source: 'question-1', target: 'question-2', animated: true },
      { id: 'e3', source: 'question-2', target: 'end-1', animated: true },
    ],
    questions: [],
  },
  {
    id: 'video-review',
    name: 'Video Content Review',
    description: 'Workflow for reviewing video content with timestamp annotations',
    category: 'video_review',
    nodes: [
      {
        id: 'start-1',
        type: 'start',
        position: { x: 250, y: 50 },
        data: { label: 'Start Review' },
      },
      {
        id: 'question-1',
        type: 'question',
        position: { x: 200, y: 150 },
        data: {
          label: 'Content Classification',
          questions: [
            {
              question_type: 'multiple_choice',
              question_text: 'What type of content is this?',
              options: ['Educational', 'Entertainment', 'News', 'Advertisement', 'Other'],
              is_required: true,
              order_index: 0,
            },
          ],
        },
      },
      {
        id: 'question-2',
        type: 'question',
        position: { x: 200, y: 300 },
        data: {
          label: 'Timestamp Annotations',
          questions: [
            {
              question_type: 'annotation',
              question_text: 'Mark any segments that require attention',
              annotation_config: {
                annotation_types: ['timestamp'],
                min_annotations: 0,
                max_annotations: 999,
                require_notes: true,
              },
              is_required: false,
              order_index: 0,
            },
          ],
        },
      },
      {
        id: 'decision-1',
        type: 'decision',
        position: { x: 200, y: 450 },
        data: {
          label: 'Quality Decision',
          condition: 'rating >= 3',
        },
      },
      {
        id: 'end-approved',
        type: 'end',
        position: { x: 100, y: 600 },
        data: { label: 'Approved', message: 'Content approved!' },
      },
      {
        id: 'question-3',
        type: 'question',
        position: { x: 350, y: 600 },
        data: {
          label: 'Rejection Reason',
          questions: [
            {
              question_type: 'text_input',
              question_text: 'Please explain why this content needs review',
              validation_rules: { min_length: 10, max_length: 500 },
              is_required: true,
              order_index: 0,
            },
          ],
        },
      },
      {
        id: 'end-review',
        type: 'end',
        position: { x: 350, y: 750 },
        data: { label: 'Needs Review', message: 'Content flagged for review' },
      },
    ],
    edges: [
      { id: 'e1', source: 'start-1', target: 'question-1', animated: true },
      { id: 'e2', source: 'question-1', target: 'question-2', animated: true },
      { id: 'e3', source: 'question-2', target: 'decision-1', animated: true },
      { id: 'e4', source: 'decision-1', target: 'end-approved', sourceHandle: 'true', animated: true },
      { id: 'e5', source: 'decision-1', target: 'question-3', sourceHandle: 'false', animated: true },
      { id: 'e6', source: 'question-3', target: 'end-review', animated: true },
    ],
    questions: [],
  },
  {
    id: 'data-validation',
    name: 'Data Validation Workflow',
    description: 'Multi-step workflow for validating data quality',
    category: 'data_validation',
    nodes: [
      {
        id: 'start-1',
        type: 'start',
        position: { x: 250, y: 50 },
        data: { label: 'Start Validation' },
      },
      {
        id: 'question-1',
        type: 'question',
        position: { x: 200, y: 150 },
        data: {
          label: 'Completeness Check',
          questions: [
            {
              question_type: 'boolean',
              question_text: 'Is all required data present?',
              is_required: true,
              order_index: 0,
            },
          ],
        },
      },
      {
        id: 'decision-1',
        type: 'decision',
        position: { x: 200, y: 280 },
        data: {
          label: 'Check Completeness',
          condition: 'answer === "yes"',
        },
      },
      {
        id: 'question-2',
        type: 'question',
        position: { x: 350, y: 400 },
        data: {
          label: 'List Missing Data',
          questions: [
            {
              question_type: 'text_input',
              question_text: 'What data is missing?',
              validation_rules: { min_length: 5 },
              is_required: true,
              order_index: 0,
            },
          ],
        },
      },
      {
        id: 'question-3',
        type: 'question',
        position: { x: 50, y: 400 },
        data: {
          label: 'Accuracy Check',
          questions: [
            {
              question_type: 'rating',
              question_text: 'Rate data accuracy',
              validation_rules: { min_value: 1, max_value: 5 },
              is_required: true,
              order_index: 0,
            },
            {
              question_type: 'text_input',
              question_text: 'Any accuracy issues to note?',
              validation_rules: { max_length: 500 },
              is_required: false,
              order_index: 1,
            },
          ],
        },
      },
      {
        id: 'end-incomplete',
        type: 'end',
        position: { x: 350, y: 550 },
        data: { label: 'Incomplete', message: 'Data marked as incomplete' },
      },
      {
        id: 'end-complete',
        type: 'end',
        position: { x: 50, y: 550 },
        data: { label: 'Validated', message: 'Data validation complete!' },
      },
    ],
    edges: [
      { id: 'e1', source: 'start-1', target: 'question-1', animated: true },
      { id: 'e2', source: 'question-1', target: 'decision-1', animated: true },
      { id: 'e3', source: 'decision-1', target: 'question-3', sourceHandle: 'true', animated: true },
      { id: 'e4', source: 'decision-1', target: 'question-2', sourceHandle: 'false', animated: true },
      { id: 'e5', source: 'question-2', target: 'end-incomplete', animated: true },
      { id: 'e6', source: 'question-3', target: 'end-complete', animated: true },
    ],
    questions: [],
  },
  {
    id: 'sentiment-analysis',
    name: 'Text Sentiment Analysis',
    description: 'Workflow for analyzing and categorizing text sentiment',
    category: 'text_analysis',
    nodes: [
      {
        id: 'start-1',
        type: 'start',
        position: { x: 250, y: 50 },
        data: { label: 'Start Analysis' },
      },
      {
        id: 'question-1',
        type: 'question',
        position: { x: 200, y: 150 },
        data: {
          label: 'Sentiment Classification',
          questions: [
            {
              question_type: 'multiple_choice',
              question_text: 'What is the overall sentiment?',
              options: ['Very Positive', 'Positive', 'Neutral', 'Negative', 'Very Negative'],
              is_required: true,
              order_index: 0,
            },
            {
              question_type: 'scale',
              question_text: 'Confidence level in your classification',
              validation_rules: { min_value: 1, max_value: 10 },
              is_required: true,
              order_index: 1,
            },
          ],
        },
      },
      {
        id: 'question-2',
        type: 'question',
        position: { x: 200, y: 320 },
        data: {
          label: 'Key Topics',
          questions: [
            {
              question_type: 'text_input',
              question_text: 'List main topics or themes (comma-separated)',
              validation_rules: { min_length: 3, max_length: 200 },
              is_required: true,
              order_index: 0,
            },
          ],
        },
      },
      {
        id: 'end-1',
        type: 'end',
        position: { x: 250, y: 470 },
        data: { label: 'Analysis Complete', message: 'Thank you for your analysis!' },
      },
    ],
    edges: [
      { id: 'e1', source: 'start-1', target: 'question-1', animated: true },
      { id: 'e2', source: 'question-1', target: 'question-2', animated: true },
      { id: 'e3', source: 'question-2', target: 'end-1', animated: true },
    ],
    questions: [],
  },
];

export const getTemplatesByCategory = (category?: string) => {
  if (!category) return workflowTemplates;
  return workflowTemplates.filter((template) => template.category === category);
};

export const getTemplateById = (id: string) => {
  return workflowTemplates.find((template) => template.id === id);
};

export const getCategories = () => {
  const categories = new Set(workflowTemplates.map((t) => t.category));
  return Array.from(categories);
};
