# Visual Workflow Builder & Dynamic Question System Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Components](#components)
4. [Database Schema](#database-schema)
5. [State Management](#state-management)
6. [Node Types](#node-types)
7. [Question Types](#question-types)
8. [Integration with PixiJS](#integration-with-pixijs)
9. [Workflow Templates](#workflow-templates)
10. [Usage Guide](#usage-guide)
11. [API Reference](#api-reference)
12. [Best Practices](#best-practices)

---

## Overview

The Visual Workflow Builder is a comprehensive system that allows Project Managers and Administrators to create dynamic annotation workflows using a drag-and-drop interface. The system features:

- **Visual Flow Designer**: Built with React Flow for creating question sequences and logic flows
- **Dynamic Question Builder**: Create questions of various types with validation rules
- **PixiJS Integration**: Seamless annotation capabilities for images and videos
- **Workflow Templates**: Pre-built templates for common use cases
- **Real-time Validation**: Client-side validation for responses
- **Version Control**: Track workflow changes over time

### Key Features

✅ Drag-and-drop workflow builder
✅ 7 question types (multiple choice, text, rating, annotation, etc.)
✅ Branching logic with decision nodes
✅ Conditional transitions
✅ Annotation tools integrated with PixiJS
✅ Pre-built templates
✅ Version tracking
✅ Role-based access control

---

## Architecture

### Layer Separation

The system maintains clear separation between:

1. **Workflow Logic Layer (React Flow)**
   - Node management
   - Edge connections
   - State transitions
   - Guard conditions
   - Workflow persistence

2. **Rendering Layer (PixiJS)**
   - File display (images, videos)
   - Interactive annotations
   - Marker placement
   - Coordinate tracking
   - Visual feedback

### Technology Stack

- **Frontend**: React 18 + TypeScript
- **State Management**: Zustand (workflows) + Redux Toolkit (app state)
- **Workflow Engine**: React Flow
- **Rendering**: PixiJS
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS

---

## Components

### Core Components

#### 1. WorkflowBuilder
Main canvas for creating workflows with React Flow.

**Location**: `src/components/workflow/WorkflowBuilder.tsx`

**Features**:
- Drag-and-drop node placement
- Visual edge connections
- Real-time canvas updates
- Auto-save functionality
- Mini-map navigation
- Background grid with snapping

**Usage**:
```tsx
import { WorkflowBuilder } from '@/components/workflow';

<WorkflowBuilder />
```

#### 2. WorkflowToolbar
Sidebar with draggable node types.

**Location**: `src/components/workflow/WorkflowToolbar.tsx`

**Node Types Available**:
- Start Node (green)
- Question Node (blue)
- Decision Node (purple)
- Condition Node (orange)
- End Node (red)

#### 3. WorkflowSidebar
Property editor for selected nodes.

**Location**: `src/components/workflow/WorkflowSidebar.tsx`

**Features**:
- Edit node labels
- Configure questions
- Set conditions
- Manage node properties

#### 4. QuestionBuilder
Modal interface for creating and editing questions.

**Location**: `src/components/workflow/QuestionBuilder.tsx`

**Features**:
- Multi-question management
- Type-specific configuration
- Validation rule setup
- Annotation settings
- Question reordering

#### 5. WorkflowAnnotationTask
Runtime component for executing workflows.

**Location**: `src/components/workflow/WorkflowAnnotationTask.tsx`

**Features**:
- Question progression
- Response collection
- Real-time validation
- Annotation capture
- Progress tracking

---

## Database Schema

### Tables

#### `workflows`
Main workflow configuration table.

```sql
CREATE TABLE workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id),
  name text NOT NULL,
  description text,
  flow_data jsonb NOT NULL,
  status text CHECK (status IN ('draft', 'active', 'archived')),
  version integer DEFAULT 1,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### `workflow_nodes`
Individual nodes within workflows.

```sql
CREATE TABLE workflow_nodes (
  id uuid PRIMARY KEY,
  workflow_id uuid REFERENCES workflows(id),
  node_id text NOT NULL,
  node_type text CHECK (node_type IN ('start', 'question', 'decision', 'condition', 'end')),
  label text NOT NULL,
  config jsonb DEFAULT '{}',
  position_x numeric,
  position_y numeric,
  created_at timestamptz DEFAULT now()
);
```

#### `questions`
Question definitions for workflow nodes.

```sql
CREATE TABLE questions (
  id uuid PRIMARY KEY,
  workflow_node_id uuid REFERENCES workflow_nodes(id),
  question_type text CHECK (question_type IN (
    'multiple_choice', 'text_input', 'file_upload',
    'annotation', 'rating', 'boolean', 'scale'
  )),
  question_text text NOT NULL,
  options jsonb DEFAULT '[]',
  validation_rules jsonb DEFAULT '{}',
  annotation_config jsonb DEFAULT '{}',
  order_index integer DEFAULT 0,
  is_required boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

#### `workflow_transitions`
Edges/connections between nodes.

```sql
CREATE TABLE workflow_transitions (
  id uuid PRIMARY KEY,
  workflow_id uuid REFERENCES workflows(id),
  source_node_id text NOT NULL,
  target_node_id text NOT NULL,
  condition jsonb DEFAULT '{}',
  label text,
  created_at timestamptz DEFAULT now()
);
```

#### `workflow_responses`
User responses to workflow questions.

```sql
CREATE TABLE workflow_responses (
  id uuid PRIMARY KEY,
  workflow_id uuid REFERENCES workflows(id),
  task_id uuid REFERENCES tasks(id),
  user_id uuid REFERENCES users(id),
  question_id uuid REFERENCES questions(id),
  response_data jsonb NOT NULL,
  annotations jsonb DEFAULT '[]',
  submitted_at timestamptz DEFAULT now()
);
```

#### `workflow_templates`
Pre-built workflow templates.

```sql
CREATE TABLE workflow_templates (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  template_data jsonb NOT NULL,
  is_public boolean DEFAULT true,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);
```

---

## State Management

### Zustand Store

**Location**: `src/store/workflowStore.ts`

#### State Structure

```typescript
interface WorkflowState {
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  isLoading: boolean;
  error: string | null;
}
```

#### Key Actions

- `setNodes(nodes)` - Update all nodes
- `setEdges(edges)` - Update all edges
- `onNodesChange(changes)` - Handle node changes
- `onEdgesChange(changes)` - Handle edge changes
- `onConnect(connection)` - Create new connection
- `addNode(type, position)` - Add new node
- `deleteNode(nodeId)` - Remove node
- `updateNode(nodeId, data)` - Update node data
- `selectNode(node)` - Select node for editing
- `loadWorkflows(projectId)` - Load workflows
- `loadWorkflow(workflowId)` - Load specific workflow
- `createWorkflow(data)` - Create new workflow
- `updateWorkflow(id, updates)` - Update workflow
- `deleteWorkflow(id)` - Delete workflow
- `saveWorkflowData()` - Save current workflow

#### Usage Example

```typescript
import { useWorkflowStore } from '@/store/workflowStore';

function MyComponent() {
  const { nodes, addNode, saveWorkflowData } = useWorkflowStore();

  const handleAddQuestion = () => {
    addNode('question', { x: 250, y: 150 });
  };

  return (
    <button onClick={handleAddQuestion}>Add Question Node</button>
  );
}
```

---

## Node Types

### 1. Start Node
Entry point of the workflow.

**Type**: `start`
**Color**: Green
**Handles**: Output only (bottom)

**Data Structure**:
```typescript
interface StartNodeData {
  label: string;
}
```

### 2. Question Node
Contains one or more questions for users to answer.

**Type**: `question`
**Color**: Blue
**Handles**: Input (top) + Output (bottom)

**Data Structure**:
```typescript
interface QuestionNodeData {
  label: string;
  questions: Question[];
  onEdit?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
}
```

### 3. Decision Node
Branching logic based on conditions.

**Type**: `decision`
**Color**: Purple
**Handles**: Input (top) + Two outputs (bottom: true/false)

**Data Structure**:
```typescript
interface DecisionNodeData {
  label: string;
  condition: string;
  onEdit?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
}
```

**Example Conditions**:
- `answer === 'yes'`
- `rating > 3`
- `annotations.length >= 5`

### 4. Condition Node
Evaluate complex expressions.

**Type**: `condition`
**Color**: Orange
**Handles**: Input (top) + Output (bottom)

**Data Structure**:
```typescript
interface ConditionNodeData {
  label: string;
  expression: string;
  onEdit?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
}
```

**Example Expressions**:
- `rating > 3 && feedback !== ''`
- `sentiment === 'positive' || quality >= 4`

### 5. End Node
Termination point of workflow.

**Type**: `end`
**Color**: Red
**Handles**: Input only (top)

**Data Structure**:
```typescript
interface EndNodeData {
  label: string;
  message?: string;
}
```

---

## Question Types

### 1. Multiple Choice
Select one option from a list.

**Type**: `multiple_choice`

**Configuration**:
```typescript
{
  question_type: 'multiple_choice',
  question_text: 'What is the main topic?',
  options: ['Option A', 'Option B', 'Option C'],
  is_required: true
}
```

### 2. Text Input
Free-form text response.

**Type**: `text_input`

**Configuration**:
```typescript
{
  question_type: 'text_input',
  question_text: 'Describe the image',
  validation_rules: {
    min_length: 10,
    max_length: 500
  },
  is_required: true
}
```

### 3. Boolean (Yes/No)
Simple binary choice.

**Type**: `boolean`

**Configuration**:
```typescript
{
  question_type: 'boolean',
  question_text: 'Is the image clear?',
  is_required: true
}
```

### 4. Rating
Numeric rating scale.

**Type**: `rating`

**Configuration**:
```typescript
{
  question_type: 'rating',
  question_text: 'Rate the quality',
  validation_rules: {
    min_value: 1,
    max_value: 5
  },
  is_required: true
}
```

### 5. Scale
Slider for numeric values.

**Type**: `scale`

**Configuration**:
```typescript
{
  question_type: 'scale',
  question_text: 'How confident are you?',
  validation_rules: {
    min_value: 0,
    max_value: 100
  },
  is_required: true
}
```

### 6. Annotation
Mark regions on images/videos using PixiJS.

**Type**: `annotation`

**Configuration**:
```typescript
{
  question_type: 'annotation',
  question_text: 'Mark all faces in the image',
  annotation_config: {
    annotation_types: ['rectangle', 'polygon', 'point'],
    min_annotations: 1,
    max_annotations: 999,
    allowed_labels: ['Face', 'Profile', 'Group'],
    require_notes: true
  },
  is_required: true
}
```

### 7. File Upload
Upload files or images.

**Type**: `file_upload`

**Configuration**:
```typescript
{
  question_type: 'file_upload',
  question_text: 'Upload reference image',
  validation_rules: {
    // File validation rules
  },
  is_required: false
}
```

---

## Integration with PixiJS

### Annotation Question Type

When a workflow contains annotation-type questions, the system integrates with existing PixiJS renderers:

#### FileViewer Component
The `FileViewer` component handles:
- Image/video rendering via PixiJS
- Interactive annotation tools
- Coordinate tracking
- Annotation data capture

#### Supported Annotation Types

1. **Point**: Single coordinate marking
2. **Rectangle**: Bounding boxes
3. **Polygon**: Multi-point shapes
4. **Text**: Text labels with position
5. **Timestamp**: Video timeline markers

#### Example Integration

```typescript
<WorkflowAnnotationTask
  file={{
    id: 'file-1',
    name: 'image.jpg',
    type: FileType.IMAGE,
    url: '/path/to/image.jpg',
    size: 12345,
    mimeType: 'image/jpeg'
  }}
  questions={workflowQuestions}
  onSubmit={(responses, annotations) => {
    // Handle submission
    console.log('Responses:', responses);
    console.log('Annotations:', annotations);
  }}
/>
```

---

## Workflow Templates

### Available Templates

Pre-built templates are available in `src/services/workflowTemplates.ts`:

1. **Simple Image Annotation** (`simple-image-annotation`)
   - Basic bounding box annotation
   - Quality rating
   - Category: `image_annotation`

2. **Video Content Review** (`video-review`)
   - Content classification
   - Timestamp annotations
   - Approval/rejection flow
   - Category: `video_review`

3. **Data Validation Workflow** (`data-validation`)
   - Completeness check
   - Accuracy rating
   - Branching logic
   - Category: `data_validation`

4. **Text Sentiment Analysis** (`sentiment-analysis`)
   - Sentiment classification
   - Confidence rating
   - Topic extraction
   - Category: `text_analysis`

### Using Templates

```typescript
import { getTemplateById, workflowTemplates } from '@/services/workflowTemplates';

// Get specific template
const template = getTemplateById('simple-image-annotation');

// Load template into workflow
if (template) {
  setNodes(template.nodes);
  setEdges(template.edges);
}

// List all templates
workflowTemplates.forEach(template => {
  console.log(template.name, template.description);
});
```

---

## Usage Guide

### Creating a Workflow

1. **Navigate to Workflow Management**
   - As Project Manager: `/ops/workflows`
   - As Admin: `/ops/workflows`

2. **Create New Workflow**
   - Click "Create Workflow" button
   - Enter workflow name and description
   - Select associated project
   - Click "Create"

3. **Build Workflow**
   - Drag nodes from toolbar to canvas
   - Connect nodes by dragging from one handle to another
   - Click nodes to edit properties
   - Add questions to Question nodes

4. **Configure Questions**
   - Select a Question node
   - Click "Add Questions" or "Edit Questions"
   - Choose question type
   - Enter question text
   - Configure type-specific options
   - Set validation rules
   - Save questions

5. **Add Decision Logic**
   - Add Decision or Condition nodes
   - Enter condition expressions
   - Connect true/false paths

6. **Save Workflow**
   - Click "Save Workflow" button
   - Workflow auto-saves to database
   - Version number increments

### Executing a Workflow

1. **Assign to Task**
   - In project management, assign workflow to batch/task
   - Workflow becomes active for annotators

2. **Complete Workflow**
   - Annotator opens task
   - `WorkflowAnnotationTask` component renders
   - Questions appear one by one
   - User provides answers
   - For annotation questions, FileViewer renders
   - User can skip or submit responses
   - Progress tracked visually

3. **View Responses**
   - Managers can view all responses
   - Responses stored in `workflow_responses` table
   - Annotations captured with coordinates

---

## API Reference

### Workflow Store API

#### `loadWorkflows(projectId?: string)`
Load all workflows, optionally filtered by project.

**Returns**: `Promise<void>`

#### `createWorkflow(data: Partial<Workflow>)`
Create a new workflow.

**Parameters**:
- `data.name` (required) - Workflow name
- `data.description` - Description
- `data.project_id` (required) - Associated project
- `data.status` - draft | active | archived

**Returns**: `Promise<Workflow | null>`

#### `updateWorkflow(id: string, updates: Partial<Workflow>)`
Update existing workflow.

**Parameters**:
- `id` - Workflow UUID
- `updates` - Fields to update

**Returns**: `Promise<void>`

#### `saveWorkflowData()`
Save current nodes and edges to database.

**Returns**: `Promise<void>`

#### `addNode(type: string, position: {x: number, y: number})`
Add new node to canvas.

**Parameters**:
- `type` - start | question | decision | condition | end
- `position` - Canvas coordinates

**Returns**: `void`

---

## Best Practices

### Workflow Design

1. **Start with Templates**
   - Use pre-built templates as starting points
   - Customize for your specific needs
   - Save custom workflows as new templates

2. **Keep Workflows Simple**
   - Aim for 3-7 nodes
   - Avoid deep nesting
   - Use clear, descriptive labels

3. **Validate Early**
   - Add validation rules to questions
   - Use required fields appropriately
   - Provide clear error messages

4. **Test Before Activation**
   - Keep workflows in draft mode during development
   - Test with sample data
   - Get feedback from annotators
   - Only activate when ready

### Question Design

1. **Clear Question Text**
   - Be specific and unambiguous
   - Avoid jargon
   - Provide examples when helpful

2. **Appropriate Question Types**
   - Use multiple choice for predefined options
   - Use text input for open-ended responses
   - Use annotation for spatial data
   - Use ratings for subjective assessments

3. **Validation Rules**
   - Set realistic min/max values
   - Don't over-validate
   - Allow for edge cases
   - Test validation with real users

### Performance

1. **Limit Questions Per Node**
   - Max 5 questions per node
   - Split complex forms into multiple nodes
   - Show progress indicators

2. **Optimize Annotations**
   - Set reasonable min/max annotation counts
   - Consider file size for images/videos
   - Lazy load annotation data

3. **Version Control**
   - Increment versions for significant changes
   - Keep history of old versions
   - Document changes in description

---

## Security & Permissions

### Row Level Security

All workflow tables have RLS enabled:

- **Admins**: Full access to all workflows
- **Project Managers**: Can create and edit workflows for their projects
- **Annotators**: Can view active workflows and submit responses
- **Reviewers**: Can view workflows and all responses

### Access Control

Workflows respect role-based access:

```typescript
// Only PROJECT_MANAGER and ADMIN can access
<ProtectedRoute allowedRoles={[UserRole.PROJECT_MANAGER, UserRole.ADMIN]}>
  <WorkflowManagement />
</ProtectedRoute>
```

---

## Troubleshooting

### Common Issues

#### Nodes Not Connecting
- Check that handles are compatible (output → input)
- Ensure nodes are close enough
- Verify React Flow is initialized

#### Questions Not Saving
- Check validation rules are met
- Ensure question text is provided
- Verify database connection

#### Annotations Not Appearing
- Confirm FileViewer is rendered
- Check annotation config is correct
- Verify PixiJS initialization

#### Workflow Not Loading
- Check workflow ID is valid
- Verify user permissions
- Check browser console for errors

---

## Future Enhancements

### Planned Features

- [ ] Workflow templates marketplace
- [ ] Advanced condition builder UI
- [ ] Workflow analytics dashboard
- [ ] A/B testing for workflows
- [ ] Workflow versioning with rollback
- [ ] Export/import workflows
- [ ] Workflow duplication
- [ ] Real-time collaboration
- [ ] Workflow simulation/preview mode
- [ ] Custom node types

---

## Support

For questions or issues:

1. Check this documentation
2. Review code comments
3. Check database schema
4. Test with example workflows
5. Review browser console errors

---

**Last Updated**: 2026-02-03
**Version**: 1.0.0
**Status**: Production Ready ✅
