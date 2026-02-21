# Visual Workflow Builder - User Guide

## Overview
The enhanced Visual Workflow Builder is a drag-and-drop interface for creating annotation workflows with user allocation capabilities. Build complex annotation pipelines by dragging workflow stages from the left sidebar and configuring them with team members in the right sidebar.

## Features

### 🎨 Drag-and-Drop Interface
- **Left Sidebar**: Component library with workflow stages and flow control nodes
- **Canvas**: Infinite canvas with zoom, pan, and grid snapping
- **Right Sidebar**: Detailed configuration panel for selected nodes
- **MiniMap**: Bird's-eye view navigation

### 👥 User Allocation
- Assign project team members to specific workflow stages
- Separate allocation for Annotators, Reviewers, and QA Reviewers
- Visual indication of assigned users per stage
- Auto-suggest available team members based on role

### 🔄 Workflow Stages

#### 1. **Annotation Stage** (Blue)
Configure annotation tasks with multi-annotator support:
- **Annotators**: Assign multiple annotators from project team
- **Consensus**: Enable/disable consensus requirement
- **Consensus Threshold**: Set agreement percentage (50-100%)
- **Max Rework Attempts**: Limit rework cycles before reassignment

**Use Cases:**
- Initial data annotation
- Multi-annotator consensus workflows
- Parallel annotation tasks

#### 2. **Review Stage** (Purple)
Set up quality review processes:
- **Reviewers**: Assign reviewers from project team
- **Review Level**: L1, L2, or L3 review designation
- **Max Rework Attempts**: Control rework cycles
- **Reject Handle**: Red handle on right to route rejected tasks back

**Use Cases:**
- Quality control checkpoints
- Multi-level review pipelines
- Expert validation stages

#### 3. **QA Stage** (Green)
Final quality assurance:
- **QA Reviewers**: Assign dedicated QA team members
- **Quality Threshold**: Set minimum quality score (0-100%)
- **Auto-assign**: Enable/disable automatic task assignment
- **Fail Handle**: Red handle to route failed tasks for correction

**Use Cases:**
- Final quality gates
- Client delivery validation
- Compliance checks

### 🎛️ Flow Control Nodes

#### Start Node (Emerald)
- Entry point for workflow
- Marks beginning of annotation process
- Only one Start node recommended

#### Question Node (Cyan)
- Collect user responses
- Configure multiple questions per node
- Support various question types (text, multi-select, rating, etc.)

#### Decision Node (Amber)
- Branch workflow based on conditions
- Define boolean expressions
- True/False routing with color-coded handles

#### Condition Node (Orange)
- Evaluate JavaScript expressions
- Complex conditional logic
- Multi-path routing

#### End Node (Red)
- Completion point for workflow
- Custom completion message
- Multiple end nodes supported for different outcomes

## How to Use

### Creating a Workflow

1. **Navigate to Workflow Management**
   - Go to Operations Manager → Workflow Management
   - Click "Create Workflow"

2. **Fill Workflow Details**
   - **Name**: Descriptive workflow name
   - **Description**: Purpose and scope
   - **Project**: Select target project (required)

3. **Build Workflow on Canvas**
   - Drag components from left sidebar onto canvas
   - Drop at desired position
   - Nodes auto-snap to grid for alignment

### Connecting Nodes

1. **Create Connections**
   - Hover over node to reveal connection handles
   - Drag from output handle (bottom/right) to input handle (top)
   - Connections are auto-animated and styled

2. **Handle Types**
   - **Standard (Blue/Purple/Green)**: Normal flow progression
   - **Reject/Fail (Red)**: Rework or rejection paths
   - **Conditional**: True/False branches

### Configuring Stages

1. **Select Stage Node**
   - Click on any stage node to open right sidebar
   - Sidebar title changes to "Stage Configuration"

2. **Set Stage Name**
   - Enter descriptive name (e.g., "Initial Annotation", "L1 Review")

3. **Assign Team Members**
   - View allocated users in "Annotators" or "Reviewers" section
   - Select from dropdown to add available team members
   - Click trash icon to remove assigned users
   - Only team members with appropriate roles appear in dropdown

4. **Configure Stage Options**
   
   **For Annotation Stages:**
   - ☑️ Require Consensus: Enable multi-annotator agreement
   - 🎚️ Consensus Threshold: Slider from 50% to 100%
   - 🔢 Max Rework Attempts: Number input (1-10)

   **For Review Stages:**
   - 📊 Review Level: L1, L2, or L3
   - 🔢 Max Rework Attempts: Number input (1-10)

   **For QA Stages:**
   - 🎯 Quality Threshold: Slider from 0% to 100%
   - ⚡ Auto-assign Tasks: Checkbox for automatic assignment

### Saving Workflows

1. Click "Save Workflow" button (top right)
2. Workflow version increments automatically
3. Success notification appears
4. Flow data includes all nodes, edges, and configurations

## Example Workflows

### Example 1: Simple Annotation → Review
```
[Start] → [Annotation Stage] → [Review Stage] → [End]
           ↓ (Alice, Bob)        ↓ (Carol)
           Consensus: 80%         Level: L1
           Rework: 3              Rework: 2
```

**Setup:**
1. Drag Start, Annotation Stage, Review Stage, End onto canvas
2. Connect them in sequence
3. Select Annotation Stage:
   - Name: "Initial Annotation"
   - Assign: Alice, Bob
   - Enable Consensus: ✓
   - Threshold: 80%
   - Max Rework: 3
4. Select Review Stage:
   - Name: "Quality Review"
   - Assign: Carol
   - Level: L1
   - Max Rework: 2

### Example 2: Multi-Level Review Pipeline
```
                          ┌─[L1 Review]─→[L2 Review]─→[QA]─→[End: Approved]
                          │   (Dana)       (Emily)     (Frank)
[Start]─→[Annotation]─────┤                             ↓ FAIL
           (Alice, Bob,   │                           [Rework]
            Charlie)      └─[Reject]──────────────────────┘
          Consensus: 85%
```

**Setup:**
1. Create annotation stage with 3 annotators, 85% consensus
2. Add L1 Review with Dana
3. Add L2 Review with Emily
4. Add QA Stage with Frank, 95% quality threshold
5. Connect QA fail handle back to Annotation for rework
6. Add End node for approved tasks

### Example 3: Conditional Routing Based on Quality
```
[Start]─→[Annotation]─→[Quality Check]─┬─HIGH→[L1 Review]→[End]
           (Team A)      (Condition)    │
                                        └─LOW→[Enhanced Review]→[QA]→[End]
                                               (Senior Team)    (Expert)
```

**Setup:**
1. Use Condition node to evaluate quality score
2. Route high-quality work through standard review
3. Route low-quality work through enhanced review + QA
4. Configure different teams for each path

## User Allocation Best Practices

### Team Size Guidelines
- **Annotation**: 1-5 annotators per stage
- **Review**: 1-2 reviewers per level
- **QA**: 1 reviewer (dedicated QA specialist)

### Consensus Settings
- **Low Complexity**: 60-70% threshold with 2 annotators
- **Medium Complexity**: 75-85% threshold with 3 annotators
- **High Complexity**: 90-100% threshold with 3+ annotators

### Rework Limits
- **Annotation**: 2-3 attempts (avoid infinite loops)
- **Review**: 2-4 attempts (allow for clarification)
- **QA**: 1-2 attempts (final validation)

### Team Assignment Strategy
1. **Skill-based**: Assign experts to complex stages
2. **Load Balancing**: Distribute work across team
3. **Specialization**: Dedicated reviewers per content type
4. **Training**: Pair junior with senior annotators

## Keyboard Shortcuts

- **Delete**: Delete selected node
- **Ctrl/Cmd + Z**: Undo last change
- **Ctrl/Cmd + S**: Save workflow
- **Scroll**: Zoom in/out on canvas
- **Drag Canvas**: Pan around workflow
- **Click + Drag**: Multi-select nodes

## Sidebar Sections

### Left Sidebar (Component Library)
**Workflow Stages**
- Annotation Stage (Blue)
- Review Stage (Purple)
- QA Stage (Green)

**Flow Control**
- Start (Emerald)
- Question (Cyan)
- Decision (Amber)
- Condition (Orange)
- End (Red)

**Quick Tips**
- Drag workflow stages to build annotation pipeline
- Click a stage to assign users from project team
- Connect stages to define workflow order
- Use flow control for conditional logic

### Right Sidebar (Configuration Panel)
**Header**
- Stage Configuration / Node Properties title
- Close button (X)

**Node Info**
- Node Type display
- Unique ID

**Configuration Sections** (varies by node type)
- Stage Name / Node Label
- User Allocation (for stage nodes)
  - Annotators list + Add dropdown
  - Reviewers list + Add dropdown
  - QA Reviewers list + Add dropdown
- Stage Options
  - Consensus settings
  - Quality thresholds
  - Rework limits
  - Auto-assign toggles
- Help Text (color-coded info boxes)

## Visual Indicators

### Node Border Colors
- **Blue**: Annotation Stage
- **Purple**: Review Stage
- **Green**: QA Stage
- **Emerald**: Start
- **Cyan**: Question
- **Amber**: Decision
- **Orange**: Condition
- **Red**: End

### Connection Handle Colors
- **Blue/Purple/Green**: Standard flow (matches node color)
- **Red**: Rejection/Fail/Rework path

### Status Indicators
- **User Count**: Shows number of assigned users
- **Consensus Badge**: Displays consensus percentage
- **Quality Badge**: Shows quality threshold
- **Rework Limit**: Displays max attempts

## Technical Details

### Data Structure
Each stage node stores:
```typescript
{
  id: string;              // Unique identifier
  type: string;            // Node type
  position: { x, y };      // Canvas position
  data: {
    label: string;         // Display name
    
    // For Annotation Stage
    annotators?: string[];           // User IDs
    requireConsensus?: boolean;
    consensusThreshold?: number;     // 0.0 - 1.0
    maxReworkAttempts?: number;
    
    // For Review Stage
    reviewers?: string[];            // User IDs
    reviewLevel?: 1 | 2 | 3;
    maxReworkAttempts?: number;
    
    // For QA Stage
    qaReviewers?: string[];          // User IDs
    qualityThreshold?: number;       // 0.0 - 1.0
    autoAssign?: boolean;
  }
}
```

### Saved Workflow Format
```json
{
  "id": "workflow-123",
  "name": "Image Annotation Pipeline",
  "project_id": "project-456",
  "version": 5,
  "flow_data": {
    "nodes": [...],
    "edges": [...]
  }
}
```

## Troubleshooting

### No team members appear in dropdown
**Cause**: Project has no assigned team members
**Solution**: Go to Project → Team and assign annotators/reviewers

### Cannot connect two nodes
**Cause**: Incompatible handle types or circular dependency
**Solution**: Use correct handle types; avoid loops

### Stage shows "No annotators assigned"
**Cause**: No users selected in configuration
**Solution**: Click stage, select users from dropdown in right sidebar

### Workflow won't save
**Cause**: No project selected or network error
**Solution**: Ensure workflow has project_id; check network connection

### Drag-and-drop not working
**Cause**: Browser compatibility or missing event handlers
**Solution**: Use modern browser (Chrome, Firefox, Edge); refresh page

## Integration with Project Management

### Workflow ↔ Project Link
- Each workflow belongs to one project
- Workflows access project's team members
- Team roles determine which users appear in stage dropdowns
- Annotators appear for Annotation stages
- Reviewers appear for Review and QA stages

### Team Member Roles
- **ANNOTATOR**: Can be assigned to Annotation stages
- **REVIEWER**: Can be assigned to Review and QA stages
- **PROJECT_MANAGER**: Can create and edit workflows
- **ADMIN**: Full access to all workflows

## Future Enhancements

### Planned Features
- [ ] Workflow templates library
- [ ] Copy/paste nodes
- [ ] Multi-select bulk operations
- [ ] Workflow validation and error detection
- [ ] Simulation mode (test workflow execution)
- [ ] Export workflow as image
- [ ] Workflow versioning and comparison
- [ ] Real-time collaboration
- [ ] Workflow metrics and analytics

---

**Version**: 1.0.0  
**Last Updated**: February 2026  
**Status**: ✅ Production Ready
