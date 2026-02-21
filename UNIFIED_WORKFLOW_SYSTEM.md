# Unified Workflow Management System

## Overview
The Welo Platform now features a **unified, comprehensive workflow configuration system** that eliminates the previous dual-system confusion and provides complete control over annotation workflows.

## Problem Addressed
Previously, the platform had **two separate workflow management approaches**:
1. **Visual Node-Based Builder** (WorkflowManagement.tsx) - Complex visual workflow editor with nodes and edges
2. **Simple Configuration Form** (Project Settings) - Basic review levels and assignment rules

This created confusion and inconsistency. Users couldn't configure advanced workflow requirements like:
- Multiple annotation stages with different teams
- Stage-specific annotator/reviewer counts
- Rework limits before automatic reassignment
- Quality gates and thresholds

## Solution: WorkflowConfigEditor Component

### New Comprehensive Component
**Location:** `src/components/workflow/WorkflowConfigEditor.tsx`

A single, reusable component that provides complete workflow configuration including:

1. **Workflow Stages** (Primary Feature)
   - Stage name and type (ANNOTATION, REVIEW, QA, APPROVAL)
   - Number of annotators per stage
   - Number of reviewers per stage
   - Max rework attempts before reassignment
   - Consensus requirements and thresholds
   - Auto-assignment controls
   - Team restrictions (allowed users)

2. **Assignment Configuration**
   - Queue strategy (FIFO, Priority, Skill-based)
   - Assignment expiration hours
   - Max tasks per user
   - Global rework limit before reassignment

3. **Quality Control**
   - Enable/disable quality gates
   - Minimum quality score threshold
   - Automatic rework triggers

4. **Review Levels** (Legacy Support)
   - Maintained for backward compatibility
   - Available in "Advanced" section
   - Gradually migrate to stage-based approach

### Enhanced Data Model

#### WorkflowStage Interface
```typescript
interface WorkflowStage {
  id: string;
  name: string;
  type: 'ANNOTATION' | 'REVIEW' | 'QA' | 'APPROVAL';
  annotators_count: number;
  reviewers_count: number;
  max_rework_attempts: number;
  require_consensus: boolean;
  consensus_threshold: number;
  auto_assign: boolean;
  allowed_users?: string[];
}
```

#### ExtendedWorkflowConfiguration
```typescript
interface ExtendedWorkflowConfiguration extends WorkflowConfiguration {
  stages: WorkflowStage[];
  global_max_rework_before_reassignment: number;
  enable_quality_gates: boolean;
  minimum_quality_score: number;
}
```

## Implementation

### 1. Updated Type Definitions
**File:** `src/types/index.ts`

Added `WorkflowStage` interface and extended `WorkflowConfiguration` with:
- `stages?: WorkflowStage[]`
- `global_max_rework_before_reassignment?: number`
- `enable_quality_gates?: boolean`
- `minimum_quality_score?: number`

### 2. Component Integration

#### EditProject.tsx
- Replaced complex, inline workflow configuration UI with `WorkflowConfigEditor`
- Updated formData to use `workflow_config` object
- Simplified state management

#### CreateProject.tsx
- Replaced Step 2 (Workflow Configuration) with `WorkflowConfigEditor`
- Updated FormData interface to use `workflow_config`
- Streamlined project creation flow

### 3. Exported Components
**File:** `src/components/workflow/index.ts`

```typescript
export { WorkflowConfigEditor } from './WorkflowConfigEditor';
export type { WorkflowStage, ExtendedWorkflowConfiguration } from './WorkflowConfigEditor';
```

## Usage Examples

### Example 1: Simple Single-Stage Workflow
```typescript
const simpleWorkflow: ExtendedWorkflowConfiguration = {
  stages: [
    {
      id: '1',
      name: 'Annotation',
      type: 'ANNOTATION',
      annotators_count: 1,
      reviewers_count: 0,
      max_rework_attempts: 3,
      require_consensus: false,
      consensus_threshold: 0.8,
      auto_assign: true,
    }
  ],
  review_levels: [],
  enable_multi_annotator: false,
  annotators_per_task: 1,
  consensus_threshold: 0.8,
  queue_strategy: 'FIFO',
  assignment_expiration_hours: 24,
  max_tasks_per_annotator: 10,
  global_max_rework_before_reassignment: 5,
  enable_quality_gates: false,
  minimum_quality_score: 0.8,
};
```

### Example 2: Multi-Stage with Quality Gates
```typescript
const complexWorkflow: ExtendedWorkflowConfiguration = {
  stages: [
    {
      id: '1',
      name: 'Initial Annotation',
      type: 'ANNOTATION',
      annotators_count: 3, // Multi-annotator consensus
      reviewers_count: 0,
      max_rework_attempts: 2,
      require_consensus: true,
      consensus_threshold: 0.85,
      auto_assign: true,
    },
    {
      id: '2',
      name: 'L1 Review',
      type: 'REVIEW',
      annotators_count: 0,
      reviewers_count: 1,
      max_rework_attempts: 3,
      require_consensus: false,
      consensus_threshold: 0.8,
      auto_assign: true,
    },
    {
      id: '3',
      name: 'Final QA',
      type: 'QA',
      annotators_count: 0,
      reviewers_count: 1,
      max_rework_attempts: 1,
      require_consensus: false,
      consensus_threshold: 0.8,
      auto_assign: false, // Manual assignment for QA
    }
  ],
  review_levels: [], // Using stages instead
  enable_multi_annotator: true,
  annotators_per_task: 3,
  consensus_threshold: 0.85,
  queue_strategy: 'SKILL_BASED',
  assignment_expiration_hours: 48,
  max_tasks_per_annotator: 5,
  global_max_rework_before_reassignment: 5,
  enable_quality_gates: true,
  minimum_quality_score: 0.9, // 90% quality threshold
};
```

## UI Features

### Collapsible Sections
All configuration sections are collapsible for better UX:
1. **Workflow Stages** - Expanded by default
2. **Assignment Configuration** - Expanded by default
3. **Quality Control** - Expanded by default
4. **Advanced: Review Levels** - Collapsed by default (legacy)

### Stage Management
- Add unlimited stages
- Each stage fully configurable
- Remove stages with confirmation
- Visual indicators for stage type (annotation, review, QA, approval)
- Inline help text for all fields

### Validation
- Number of annotators: 0-10
- Number of reviewers: 0-10
- Max rework attempts: 1-10
- Consensus threshold: 50%-100% (slider)
- Quality score: 0%-100% (slider)
- Assignment expiration: 1-168 hours

## Backend Integration Requirements

To fully support this unified workflow system, the backend services need to:

### 1. Update Project Entity
**File:** `apps/project-management/src/projects/project.entity.ts`

Ensure `workflow_config` column can store extended configuration:
```typescript
@Column({ type: 'jsonb', nullable: false })
workflow_config: {
  stages?: Array<{
    id: string;
    name: string;
    type: 'ANNOTATION' | 'REVIEW' | 'QA' | 'APPROVAL';
    annotators_count: number;
    reviewers_count: number;
    max_rework_attempts: number;
    require_consensus: boolean;
    consensus_threshold: number;
    auto_assign: boolean;
    allowed_users?: string[];
  }>;
  review_levels: Array<any>;
  enable_multi_annotator: boolean;
  annotators_per_task: number;
  consensus_threshold: number;
  queue_strategy: string;
  assignment_expiration_hours: number;
  max_tasks_per_annotator: number;
  global_max_rework_before_reassignment?: number;
  enable_quality_gates?: boolean;
  minimum_quality_score?: number;
};
```

### 2. Workflow Engine Integration
**Service:** `apps/workflow-engine`

The workflow engine should:
- Process stage-based workflows
- Enforce stage-specific rework limits
- Apply quality gates when enabled
- Handle consensus requirements per stage
- Support auto-assignment per stage
- Track stage transitions in workflow state

### 3. Task Assignment Logic
**Service:** `apps/task-management`

Update assignment logic to:
- Respect stage-specific annotator/reviewer counts
- Enforce max rework attempts per stage
- Trigger reassignment when limits exceeded
- Apply quality score thresholds
- Use queue strategy from configuration

## Migration Path

### Phase 1: ✅ Frontend Complete
- [x] Create WorkflowConfigEditor component
- [x] Update types to support extended configuration
- [x] Integrate into EditProject.tsx
- [x] Integrate into CreateProject.tsx
- [x] Export from workflow component library

### Phase 2: Backend Updates (TODO)
- [ ] Update Project entity workflow_config type
- [ ] Validate extended workflow configuration in DTOs
- [ ] Add database migration if needed
- [ ] Update API documentation

### Phase 3: Workflow Engine (TODO)
- [ ] Implement stage-based workflow processing
- [ ] Add rework limit enforcement
- [ ] Implement quality gate checks
- [ ] Support per-stage consensus rules
- [ ] Update XState workflow definitions

### Phase 4: Deprecate Legacy System (FUTURE)
- [ ] Mark visual workflow builder as deprecated
- [ ] Migrate existing visual workflows to stage-based configuration
- [ ] Remove WorkflowManagement visual builder
- [ ] Update documentation

## Benefits

### For Users
1. **Single Source of Truth** - One place to configure all workflow aspects
2. **Complete Control** - Configure every aspect of annotation workflow
3. **Better UX** - Collapsible sections, inline help, validation
4. **Flexibility** - Support simple to complex workflows with same UI

### For Developers
1. **Code Reusability** - One component used everywhere
2. **Maintainability** - Changes in one place affect all usage
3. **Type Safety** - Strong TypeScript interfaces
4. **Testability** - Isolated component easy to test

### For Operations
1. **Consistency** - Same workflow configuration everywhere
2. **Auditability** - Complete workflow config in one object
3. **Scalability** - Unlimited stages and complexity
4. **Quality Assurance** - Built-in quality gates and thresholds

## Next Steps

1. **Test the UI** - Create/edit projects with various workflow configurations
2. **Backend Integration** - Update services to process stage-based workflows
3. **Workflow Engine** - Implement XState machines for stage processing
4. **Documentation** - Update user guides with new workflow features
5. **Training** - Train ops managers on new comprehensive workflow system

## Related Files

### Frontend
- `src/components/workflow/WorkflowConfigEditor.tsx` - Main component
- `src/types/index.ts` - Type definitions
- `src/pages/ops/EditProject.tsx` - Edit project integration
- `src/pages/ops/CreateProject.tsx` - Create project integration

### Backend (To Update)
- `apps/project-management/src/projects/project.entity.ts`
- `apps/workflow-engine/src/workflows/`
- `apps/task-management/src/tasks/assignment.service.ts`

---

**Status:** ✅ Frontend Implementation Complete  
**Next:** Backend Integration Required  
**Version:** 1.0.0  
**Date:** 2026-02-04
