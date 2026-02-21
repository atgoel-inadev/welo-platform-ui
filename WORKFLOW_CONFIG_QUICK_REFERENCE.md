# Comprehensive Workflow Configuration - Quick Reference

## What Changed?

**Before:** Two separate workflow systems that were confusing and incomplete
**Now:** One unified, comprehensive workflow configuration system

## New WorkflowConfigEditor Component

### Location
```
src/components/workflow/WorkflowConfigEditor.tsx
```

### Import
```typescript
import { WorkflowConfigEditor, type ExtendedWorkflowConfiguration } from '../../components/workflow';
```

### Usage
```tsx
<WorkflowConfigEditor
  config={formData.workflow_config}
  onChange={(config) => setFormData({ ...formData, workflow_config: config })}
/>
```

## Configuration Sections

### 1. Workflow Stages ⭐ (NEW)
Configure the actual annotation pipeline:

| Field | Description | Range |
|-------|-------------|-------|
| Stage Name | Display name | Text |
| Stage Type | ANNOTATION, REVIEW, QA, APPROVAL | Select |
| Annotators Count | Number of people annotating | 0-10 |
| Reviewers Count | Number of people reviewing | 0-10 |
| Max Rework Attempts | Rework before reassignment | 1-10 |
| Require Consensus | Force agreement between annotators | Checkbox |
| Consensus Threshold | Agreement percentage | 50%-100% |
| Auto-assign | Automatic task assignment | Checkbox |

**Example Workflow:**
```
Stage 1: Initial Annotation
  - Type: ANNOTATION
  - Annotators: 3
  - Consensus: 85%
  - Rework: 2 attempts

Stage 2: L1 Review
  - Type: REVIEW
  - Reviewers: 1
  - Rework: 3 attempts

Stage 3: Final QA
  - Type: QA
  - Reviewers: 1
  - Auto-assign: OFF (manual)
```

### 2. Assignment Configuration
Control task distribution:

| Setting | Description | Range |
|---------|-------------|-------|
| Queue Strategy | FIFO / Priority / Skill-based | Select |
| Assignment Expiration | Hours before auto-release | 1-168 hours |
| Max Tasks Per User | Concurrent assignments | 1-100 |
| Global Rework Limit | Total rework before reassignment | 1-20 |

### 3. Quality Control ⭐ (NEW)
Enforce quality standards:

| Setting | Description |
|---------|-------------|
| Enable Quality Gates | Turn on/off quality checks |
| Minimum Quality Score | Tasks below this → rework (0-100%) |

### 4. Review Levels (Legacy)
Backward compatibility with old system:
- Kept in "Advanced" section
- Will be deprecated in future
- Use Workflow Stages instead

## Configuration Object Structure

```typescript
const workflowConfig: ExtendedWorkflowConfiguration = {
  // New stage-based workflow
  stages: [
    {
      id: 'stage-1',
      name: 'Initial Annotation',
      type: 'ANNOTATION',
      annotators_count: 3,
      reviewers_count: 0,
      max_rework_attempts: 2,
      require_consensus: true,
      consensus_threshold: 0.85,
      auto_assign: true,
      allowed_users: [], // Optional team restriction
    },
    // ... more stages
  ],

  // Assignment rules
  queue_strategy: 'SKILL_BASED',
  assignment_expiration_hours: 48,
  max_tasks_per_annotator: 5,
  global_max_rework_before_reassignment: 5,

  // Quality gates (NEW)
  enable_quality_gates: true,
  minimum_quality_score: 0.9,

  // Legacy fields (still supported)
  review_levels: [],
  enable_multi_annotator: true,
  annotators_per_task: 3,
  consensus_threshold: 0.85,
};
```

## Common Workflow Scenarios

### Scenario 1: Simple Single Annotator
```typescript
stages: [
  {
    name: 'Annotation',
    type: 'ANNOTATION',
    annotators_count: 1,
    reviewers_count: 0,
    max_rework_attempts: 3,
  }
]
```

### Scenario 2: Multi-Annotator Consensus
```typescript
stages: [
  {
    name: 'Annotation with Consensus',
    type: 'ANNOTATION',
    annotators_count: 3,
    reviewers_count: 0,
    require_consensus: true,
    consensus_threshold: 0.8, // 80% agreement
    max_rework_attempts: 2,
  }
]
```

### Scenario 3: Annotation → Review Pipeline
```typescript
stages: [
  {
    name: 'Annotation',
    type: 'ANNOTATION',
    annotators_count: 1,
    reviewers_count: 0,
    max_rework_attempts: 3,
  },
  {
    name: 'L1 Review',
    type: 'REVIEW',
    annotators_count: 0, // Review-only stage
    reviewers_count: 1,
    max_rework_attempts: 2,
  }
]
```

### Scenario 4: Full QA Pipeline with Quality Gates
```typescript
stages: [
  {
    name: 'Initial Annotation',
    type: 'ANNOTATION',
    annotators_count: 3,
    reviewers_count: 0,
    require_consensus: true,
    consensus_threshold: 0.85,
    max_rework_attempts: 2,
  },
  {
    name: 'L1 Review',
    type: 'REVIEW',
    annotators_count: 0,
    reviewers_count: 1,
    max_rework_attempts: 3,
  },
  {
    name: 'L2 Review',
    type: 'REVIEW',
    annotators_count: 0,
    reviewers_count: 1,
    max_rework_attempts: 2,
  },
  {
    name: 'Final QA',
    type: 'QA',
    annotators_count: 0,
    reviewers_count: 1,
    max_rework_attempts: 1,
    auto_assign: false, // Manual assignment
  }
],
enable_quality_gates: true,
minimum_quality_score: 0.95, // 95% quality required
```

## UI Behavior

### Sections
All sections are collapsible:
- **Workflow Stages** - Expanded by default (primary)
- **Assignment Configuration** - Expanded by default
- **Quality Control** - Expanded by default
- **Advanced: Review Levels** - Collapsed (legacy)

### Stage Management
- Click "Add First Stage" to start
- Click "Add Another Stage" to create pipeline
- Each stage has its own card with full configuration
- Remove button deletes stage

### Validation
- All number inputs have min/max constraints
- Sliders for percentages (consensus, quality)
- Checkboxes for boolean options
- Disabled states when not applicable

## Integration Points

### Create Project (Step 2)
```tsx
{currentStep === 2 && (
  <div className="space-y-6">
    <h2>Workflow Configuration</h2>
    <WorkflowConfigEditor
      config={formData.workflow_config}
      onChange={(config) => setFormData({ ...formData, workflow_config: config })}
    />
  </div>
)}
```

### Edit Project (Collapsible Section)
```tsx
<div className="border-t pt-6">
  <button onClick={() => toggleSection('workflow')}>
    <h3>Workflow Configuration</h3>
    {expandedSections.workflow ? <ChevronUp /> : <ChevronDown />}
  </button>

  {expandedSections.workflow && (
    <WorkflowConfigEditor
      config={formData.workflow_config}
      onChange={(config) => setFormData({ ...formData, workflow_config: config })}
    />
  )}
</div>
```

## Backend Considerations

### Database Storage
The `workflow_config` column stores entire configuration as JSONB:
```sql
workflow_config JSONB NOT NULL
```

### API Payload
When creating/updating projects:
```json
{
  "name": "My Project",
  "workflow_config": {
    "stages": [...],
    "queue_strategy": "SKILL_BASED",
    "enable_quality_gates": true,
    ...
  }
}
```

### Workflow Engine
The workflow engine will:
1. Process stages in order
2. Enforce stage-specific rework limits
3. Apply quality gates
4. Handle consensus calculations
5. Trigger reassignments when limits exceeded

## Testing Checklist

- [ ] Create project with single stage
- [ ] Create project with multi-stage pipeline
- [ ] Edit existing project workflow
- [ ] Add/remove stages dynamically
- [ ] Configure consensus requirements
- [ ] Set quality gates
- [ ] Test all queue strategies
- [ ] Verify rework limits
- [ ] Check auto-assign behavior

## Troubleshooting

**Q: Can I mix stages and review levels?**  
A: Yes, both are supported for backward compatibility. Use stages for new workflows.

**Q: What happens if I set 0 annotators and 0 reviewers?**  
A: Don't do this - each stage needs at least one annotator OR reviewer.

**Q: Can I have unlimited stages?**  
A: Yes, add as many as needed for your workflow.

**Q: How do rework limits work?**  
A: Per-stage limits + global limit. Whichever is reached first triggers reassignment.

**Q: What's the difference between stage consensus and global consensus?**  
A: Stage consensus applies to that specific stage. Global settings are fallback for backward compatibility.

---

**Quick Start:**
1. Edit or Create a project
2. Navigate to Workflow Configuration section
3. Click "Add First Stage"
4. Configure stage name, type, and team size
5. Set rework limits
6. Add more stages for review pipeline
7. Configure quality gates if needed
8. Save project

**That's it!** Your comprehensive workflow is now configured.
