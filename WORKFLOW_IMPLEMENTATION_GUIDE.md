# Visual Workflow Builder Implementation Guide

## 🎯 Quick Start

### Access the Workflow Builder

1. **Login as Project Manager or Admin**
   - PM: `pm@welo.com` / `Test123!`
   - Admin: `admin@welo.com` / `Test123!`

2. **Navigate to Workflows**
   - Click "Workflows" in the sidebar
   - URL: `/ops/workflows`

3. **Create Your First Workflow**
   - Click "Create Workflow"
   - Enter name, description, and select project
   - Click "Create Workflow"

---

## 🏗️ Architecture Overview

### Clear Separation of Concerns

```
┌─────────────────────────────────────────────────────┐
│           WORKFLOW LOGIC LAYER (React Flow)         │
├─────────────────────────────────────────────────────┤
│  • Node Management (Start, Question, Decision...)   │
│  • Edge Connections & Transitions                   │
│  • State Management (Zustand)                       │
│  • Guard Conditions & Branching                     │
│  • Workflow Persistence (Supabase)                  │
└─────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────┐
│         RENDERING LAYER (PixiJS)                    │
├─────────────────────────────────────────────────────┤
│  • File Display (Images, Videos)                    │
│  • Interactive Annotations                          │
│  • Marker Placement                                 │
│  • Coordinate Tracking                              │
│  • Visual Feedback                                  │
└─────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Workflow Engine | React Flow | Node graph visualization |
| State Management | Zustand | Workflow state |
| App State | Redux Toolkit | Global app state |
| Rendering | PixiJS | Image/video annotation |
| Database | Supabase | Persistence & RLS |
| UI Components | React + Tailwind | Interface |
| Type Safety | TypeScript | Type checking |

---

## 📦 Component Structure

```
src/
├── components/
│   └── workflow/
│       ├── nodes/
│       │   ├── StartNode.tsx          # Green entry node
│       │   ├── QuestionNode.tsx       # Blue question node
│       │   ├── DecisionNode.tsx       # Purple branching node
│       │   ├── ConditionNode.tsx      # Orange condition node
│       │   ├── EndNode.tsx            # Red termination node
│       │   └── index.ts
│       ├── WorkflowBuilder.tsx        # Main canvas component
│       ├── WorkflowToolbar.tsx        # Draggable node palette
│       ├── WorkflowSidebar.tsx        # Property editor
│       ├── QuestionBuilder.tsx        # Question config modal
│       ├── WorkflowAnnotationTask.tsx # Runtime execution
│       └── index.ts
├── pages/
│   └── ops/
│       └── WorkflowManagement.tsx     # Main workflow page
├── store/
│   └── workflowStore.ts               # Zustand state
├── types/
│   └── workflow.ts                    # TypeScript types
└── services/
    └── workflowTemplates.ts           # Pre-built templates
```

---

## 🎨 Node Types Reference

### 1. Start Node (Green)
**Purpose**: Entry point of workflow
**Handles**: Output only (bottom)
**Usage**: Place one at the beginning

### 2. Question Node (Blue)
**Purpose**: Ask questions to users
**Handles**: Input (top) + Output (bottom)
**Features**:
- Multiple questions per node
- 7 question types
- Validation rules
- Required/optional flags

### 3. Decision Node (Purple)
**Purpose**: Branch based on conditions
**Handles**: Input (top) + Two outputs (true/false)
**Features**:
- JavaScript expression evaluation
- True path (green handle)
- False path (red handle)

### 4. Condition Node (Orange)
**Purpose**: Evaluate complex expressions
**Handles**: Input (top) + Output (bottom)
**Features**:
- Multi-condition logic
- AND/OR operators
- Custom expressions

### 5. End Node (Red)
**Purpose**: Terminate workflow
**Handles**: Input only (top)
**Features**:
- Completion message
- Multiple end points allowed

---

## 💡 Question Types

### Quick Reference Table

| Type | Use Case | Configuration |
|------|----------|---------------|
| **multiple_choice** | Select from options | `options: string[]` |
| **text_input** | Free text | `min_length`, `max_length` |
| **boolean** | Yes/No | Simple toggle |
| **rating** | Numeric rating | `min_value`, `max_value` |
| **scale** | Slider | `min_value`, `max_value` |
| **annotation** | Mark regions | `annotation_types`, `min/max annotations` |
| **file_upload** | Upload files | File validation rules |

### Question Configuration Examples

#### Multiple Choice
```typescript
{
  question_type: 'multiple_choice',
  question_text: 'What is the main object?',
  options: ['Car', 'Person', 'Building', 'Other'],
  is_required: true
}
```

#### Text Input with Validation
```typescript
{
  question_type: 'text_input',
  question_text: 'Describe what you see',
  validation_rules: {
    min_length: 20,
    max_length: 500
  },
  is_required: true
}
```

#### Annotation (PixiJS Integration)
```typescript
{
  question_type: 'annotation',
  question_text: 'Mark all faces in the image',
  annotation_config: {
    annotation_types: ['rectangle', 'polygon'],
    min_annotations: 1,
    max_annotations: 999,
    allowed_labels: ['Face', 'Profile'],
    require_notes: true
  },
  is_required: true
}
```

---

## 🔄 Workflow Creation Steps

### Step-by-Step Tutorial

#### 1. Create Workflow
```
Navigate to /ops/workflows
↓
Click "Create Workflow"
↓
Fill form (name, description, project)
↓
Click "Create Workflow"
```

#### 2. Build Flow
```
Drag "Start" node to canvas
↓
Drag "Question" node below it
↓
Connect Start → Question (drag from handle)
↓
Click Question node to edit
↓
Click "Add Questions"
```

#### 3. Configure Questions
```
Select question type
↓
Enter question text
↓
Configure type-specific settings
↓
Add validation rules
↓
Click "Save Questions"
```

#### 4. Add Logic (Optional)
```
Add Decision node
↓
Enter condition (e.g., "rating > 3")
↓
Connect to different paths
↓
Add End nodes for each path
```

#### 5. Save & Activate
```
Click "Save Workflow"
↓
Change status to "active"
↓
Assign to project batches
```

---

## 🎯 Pre-built Templates

### Available Templates

#### 1. Simple Image Annotation
**Category**: Image Annotation
**Use Case**: Basic bounding box annotation with quality rating

**Workflow**:
```
Start
  ↓
Image Annotation (rectangle/polygon)
  ↓
Quality Rating (1-5)
  ↓
End
```

#### 2. Video Content Review
**Category**: Video Review
**Use Case**: Content classification with approval flow

**Workflow**:
```
Start
  ↓
Content Classification
  ↓
Timestamp Annotations
  ↓
Quality Decision (rating >= 3)
  ├─ True → Approved
  └─ False → Rejection Reason → Needs Review
```

#### 3. Data Validation
**Category**: Data Validation
**Use Case**: Check completeness and accuracy

**Workflow**:
```
Start
  ↓
Completeness Check (boolean)
  ↓
Decision (complete?)
  ├─ True → Accuracy Rating → Validated
  └─ False → List Missing Data → Incomplete
```

#### 4. Sentiment Analysis
**Category**: Text Analysis
**Use Case**: Analyze and categorize text sentiment

**Workflow**:
```
Start
  ↓
Sentiment Classification
  ↓
Key Topics Extraction
  ↓
End
```

### Using Templates

```typescript
import { getTemplateById } from '@/services/workflowTemplates';

const template = getTemplateById('simple-image-annotation');
setNodes(template.nodes);
setEdges(template.edges);
```

---

## 🔗 PixiJS Integration

### How Annotation Questions Work

1. **Question Node with Annotation Type**
   - User creates question with `type: 'annotation'`
   - Configures annotation settings (types, min/max, labels)

2. **Runtime Rendering**
   - `WorkflowAnnotationTask` component detects annotation question
   - Renders `FileViewer` component with PixiJS
   - User can draw annotations on image/video

3. **Data Capture**
   - Annotations stored with coordinates
   - Notes attached to each annotation
   - Saved to `workflow_responses` table

### Annotation Types Supported

| Type | Description | Use Case |
|------|-------------|----------|
| **point** | Single coordinate | Mark specific locations |
| **rectangle** | Bounding boxes | Object detection |
| **polygon** | Multi-point shapes | Irregular objects |
| **text** | Text labels | Add descriptions |
| **timestamp** | Video markers | Mark video segments |

### Example: Image Annotation Question

```tsx
<WorkflowAnnotationTask
  file={{
    id: 'img-1',
    name: 'photo.jpg',
    type: FileType.IMAGE,
    url: '/images/photo.jpg',
    size: 156789,
    mimeType: 'image/jpeg'
  }}
  questions={[
    {
      id: 'q1',
      question_type: 'annotation',
      question_text: 'Mark all vehicles',
      annotation_config: {
        annotation_types: ['rectangle'],
        min_annotations: 1,
        allowed_labels: ['Car', 'Truck', 'Bus'],
        require_notes: false
      },
      is_required: true
    }
  ]}
  onSubmit={(responses, annotations) => {
    // responses = { q1: ... }
    // annotations = [{ type: 'rectangle', position: {...}, label: 'Car', ... }]
  }}
/>
```

---

## 💾 Database Schema Quick Reference

### Key Tables

#### workflows
```sql
- id (uuid)
- project_id (uuid → projects)
- name (text)
- flow_data (jsonb) -- nodes & edges
- status (draft | active | archived)
- version (int)
```

#### questions
```sql
- id (uuid)
- workflow_node_id (uuid → workflow_nodes)
- question_type (enum)
- question_text (text)
- options (jsonb)
- validation_rules (jsonb)
- annotation_config (jsonb)
- is_required (boolean)
```

#### workflow_responses
```sql
- id (uuid)
- workflow_id (uuid)
- user_id (uuid)
- question_id (uuid)
- response_data (jsonb)
- annotations (jsonb)
- submitted_at (timestamptz)
```

---

## 🔒 Security & Permissions

### Row Level Security

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to all workflows |
| **Project Manager** | Create/edit workflows for their projects |
| **Annotator** | View active workflows, submit responses |
| **Reviewer** | View workflows and all responses |

### Access Control

```typescript
// Only PM and Admin can access
<ProtectedRoute allowedRoles={[UserRole.PROJECT_MANAGER, UserRole.ADMIN]}>
  <WorkflowManagement />
</ProtectedRoute>
```

---

## 🚀 Usage Examples

### Example 1: Simple Workflow

**Goal**: Rate image quality

```typescript
// 1. Create workflow
const workflow = await createWorkflow({
  name: 'Image Quality Check',
  project_id: 'project-id',
  status: 'draft'
});

// 2. Add nodes programmatically (or via UI)
addNode('start', { x: 250, y: 50 });
addNode('question', { x: 200, y: 150 });
addNode('end', { x: 250, y: 300 });

// 3. Configure question node
updateNode('question-1', {
  label: 'Quality Rating',
  questions: [{
    question_type: 'rating',
    question_text: 'Rate image quality',
    validation_rules: { min_value: 1, max_value: 5 },
    is_required: true
  }]
});

// 4. Connect nodes
onConnect({ source: 'start-1', target: 'question-1' });
onConnect({ source: 'question-1', target: 'end-1' });

// 5. Save
await saveWorkflowData();
```

### Example 2: Branching Workflow

**Goal**: Approve or reject based on rating

```typescript
// Add decision node
addNode('decision', { x: 200, y: 200 });

// Configure decision
updateNode('decision-1', {
  label: 'Quality Check',
  condition: 'rating >= 3'
});

// Connect true path (approved)
onConnect({
  source: 'decision-1',
  sourceHandle: 'true',
  target: 'end-approved'
});

// Connect false path (rejected)
onConnect({
  source: 'decision-1',
  sourceHandle: 'false',
  target: 'end-rejected'
});
```

---

## 🧪 Testing Your Workflow

### Test Checklist

- [ ] All nodes are connected
- [ ] Start node is present
- [ ] At least one End node
- [ ] Questions have text
- [ ] Required questions marked
- [ ] Validation rules set
- [ ] Decision conditions valid
- [ ] Workflow saves successfully
- [ ] Status set to "active"
- [ ] Assigned to project/batch

### Manual Testing Steps

1. **Create test workflow**
2. **Add all node types**
3. **Configure questions**
4. **Save workflow**
5. **Load workflow in new session**
6. **Execute workflow as annotator**
7. **Submit responses**
8. **Verify data in database**

---

## 📊 Performance Tips

### Optimization Best Practices

1. **Limit Questions Per Node**
   - Max 5 questions per node
   - Split into multiple nodes if needed

2. **Efficient Annotations**
   - Set realistic min/max counts
   - Don't require excessive annotations
   - Use appropriate annotation types

3. **Caching**
   - Workflows cached in Zustand store
   - Nodes/edges updated reactively
   - Minimize database calls

4. **Bundle Size**
   - React Flow adds ~200KB
   - PixiJS already included
   - Consider code splitting for large apps

---

## 🐛 Troubleshooting

### Common Issues & Solutions

#### Nodes Not Connecting
**Problem**: Can't connect two nodes
**Solution**:
- Ensure output → input direction
- Check handles are visible
- Verify nodes are compatible types

#### Questions Not Saving
**Problem**: Questions disappear after save
**Solution**:
- Check all required fields filled
- Verify question text is not empty
- Check browser console for errors

#### Workflow Not Loading
**Problem**: Blank canvas when opening workflow
**Solution**:
- Check workflow ID in URL
- Verify user has permissions
- Check browser console
- Verify database connection

#### Annotations Not Working
**Problem**: Can't add annotations to images
**Solution**:
- Ensure question type is 'annotation'
- Verify FileViewer is rendered
- Check annotation config
- Verify PixiJS initialized

---

## 📚 Additional Resources

### Documentation Files
- `WORKFLOW_SYSTEM_DOCUMENTATION.md` - Complete technical docs
- `RENDERER_DOCUMENTATION.md` - PixiJS renderer docs
- `SETUP_GUIDE.md` - System setup guide
- `TEST_ACCOUNTS.md` - Test account credentials

### Code Examples
- `src/services/workflowTemplates.ts` - Template examples
- `src/components/workflow/` - Component implementations
- `src/store/workflowStore.ts` - State management

### Database
- Check Supabase Dashboard for schema
- View RLS policies in Database > Policies
- Test queries in SQL Editor

---

## 🎓 Learning Path

### For Project Managers

1. **Basics** (15 min)
   - Create simple workflow
   - Add 2-3 question nodes
   - Save and test

2. **Intermediate** (30 min)
   - Use decision nodes
   - Add branching logic
   - Configure annotations

3. **Advanced** (1 hour)
   - Create from templates
   - Complex branching
   - Custom validation rules

### For Developers

1. **Basics** (30 min)
   - Review architecture
   - Understand component structure
   - Read Zustand store

2. **Intermediate** (1 hour)
   - Create custom node type
   - Add new question type
   - Modify validation logic

3. **Advanced** (2+ hours)
   - Extend workflow engine
   - Add custom renderers
   - Implement analytics

---

## ✅ Build Status

**Last Build**: Successful ✅
**Bundle Size**: 901.20 KB (269.62 KB gzipped)
**Modules**: 2490
**Build Time**: 18.18s

---

## 📞 Support

**Issues?** Check these in order:
1. Browser console errors
2. Network tab (failed requests)
3. Supabase logs
4. This documentation
5. Code comments

---

**Version**: 1.0.0
**Status**: Production Ready ✅
**Last Updated**: 2026-02-03
