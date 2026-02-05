# UI Builder Implementation

## Overview

The UI Builder is a comprehensive system for creating dynamic, configurable annotation interfaces. It allows project managers to design custom UIs without writing code, supporting multiple file types, response formats, and workflow stages.

## Architecture

### Components

#### 1. **UIBuilder** (Main Component)
- **Location**: `src/components/uibuilder/UIBuilder.tsx`
- **Purpose**: Main orchestration component with drag-and-drop canvas
- **Features**:
  - State management using `useReducer` pattern
  - Undo/redo with history tracking
  - Three-panel layout (Toolbox | Canvas | Properties/Preview)
  - Import/export JSON configurations
  - Pipeline mode selector (ANNOTATION, REVIEW, QUALITY_CHECK)
  - Save/cancel handlers

- **State Management**:
  ```typescript
  interface UIBuilderState {
    configuration: UIConfiguration;
    selectedWidget: Widget | null;
    showPreview: boolean;
    pipelineMode: PipelineMode;
    isDirty: boolean;
    history: UIConfiguration[];
    historyIndex: number;
  }
  ```

- **Actions**:
  - `ADD_WIDGET`: Add new widget to canvas
  - `UPDATE_WIDGET`: Update widget properties
  - `DELETE_WIDGET`: Remove widget
  - `SELECT_WIDGET`: Select widget for editing
  - `MOVE_WIDGET`: Change widget position
  - `RESIZE_WIDGET`: Change widget size
  - `SET_PREVIEW`: Toggle preview mode
  - `SET_PIPELINE_MODE`: Change pipeline context
  - `IMPORT_CONFIGURATION`: Load JSON config
  - `UNDO`: Navigate history backward
  - `REDO`: Navigate history forward

#### 2. **WidgetToolbox**
- **Location**: `src/components/uibuilder/WidgetToolbox.tsx`
- **Purpose**: Provides draggable widget library
- **Features**:
  - 14 widget types organized by category
  - Categories: Media, Input, Display, Layout
  - Click-to-add functionality
  - Icon-based interface with descriptions

- **Widget Categories**:
  - **Media**: FILE_VIEWER
  - **Input**: TEXT_INPUT, TEXTAREA, SELECT, MULTI_SELECT, RADIO_GROUP, CHECKBOX, RATING, SLIDER, DATE_PICKER
  - **Display**: INSTRUCTION_TEXT
  - **Layout**: DIVIDER, SPACER, CONTAINER

#### 3. **CanvasArea**
- **Location**: `src/components/uibuilder/CanvasArea.tsx`
- **Purpose**: Main editing canvas with drag-and-drop
- **Features**:
  - Grid background for alignment
  - Mouse-based widget positioning
  - Widget previews for all types
  - Selection and deletion controls
  - Visual feedback for selected widgets
  - Empty state with instructions

#### 4. **PropertyPanel**
- **Location**: `src/components/uibuilder/PropertyPanel.tsx`
- **Purpose**: Dynamic property editor for selected widget
- **Features**:
  - Basic properties (label, placeholder, helpText, required, disabled)
  - Type-specific property editors for each widget
  - OptionsEditor sub-component for select/radio widgets
  - Position & size controls
  - Validation rule configuration
  - Delete widget action

#### 5. **PreviewPanel**
- **Location**: `src/components/uibuilder/PreviewPanel.tsx`
- **Purpose**: Live preview of UI configuration
- **Features**:
  - Real-time rendering using DynamicUIRenderer
  - Mock data for testing
  - Pipeline mode display
  - Responsive preview container

#### 6. **DynamicUIRenderer**
- **Location**: `src/components/uibuilder/DynamicUIRenderer.tsx`
- **Purpose**: Runtime renderer for configured UIs
- **Features**:
  - Parses UIConfiguration and renders functional UI
  - Handles all 14 widget types
  - Form data collection and validation
  - Conditional display logic
  - Pipeline-aware rendering
  - File viewer integration
  - Submit handlers

### Type System

**Location**: `src/types/uiBuilder.ts`

#### Core Types

```typescript
// File types supported
enum FileType {
  TEXT = 'TEXT',
  MARKDOWN = 'MARKDOWN',
  HTML = 'HTML',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  CSV = 'CSV',
  PDF = 'PDF',
}

// Response types
enum ResponseType {
  TEXT = 'TEXT',
  SINGLE_SELECT = 'SINGLE_SELECT',
  MULTI_SELECT = 'MULTI_SELECT',
  RATING = 'RATING',
  BOOLEAN = 'BOOLEAN',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  STRUCTURED = 'STRUCTURED',
}

// Pipeline modes
enum PipelineMode {
  ANNOTATION = 'ANNOTATION',
  REVIEW = 'REVIEW',
  QUALITY_CHECK = 'QUALITY_CHECK',
}

// Widget types (14 total)
type WidgetType =
  | 'FILE_VIEWER'
  | 'TEXT_INPUT'
  | 'TEXTAREA'
  | 'SELECT'
  | 'MULTI_SELECT'
  | 'RADIO_GROUP'
  | 'CHECKBOX'
  | 'RATING'
  | 'SLIDER'
  | 'DATE_PICKER'
  | 'INSTRUCTION_TEXT'
  | 'DIVIDER'
  | 'SPACER'
  | 'CONTAINER';
```

#### Widget Interfaces

Each widget type has a specific interface extending `BaseWidget`:

```typescript
interface BaseWidget {
  id: string;
  type: WidgetType;
  label?: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  validation?: ValidationRule[];
  conditionalDisplay?: ConditionalDisplay[];
  pipelineModes?: PipelineMode[];
  position: Position;
  size: Size;
  style?: React.CSSProperties;
  order: number;
}

// Example: TextInputWidget
interface TextInputWidget extends BaseWidget {
  type: 'TEXT_INPUT';
  inputType?: 'text' | 'email' | 'password' | 'url' | 'tel';
  maxLength?: number;
  minLength?: number;
  pattern?: string;
}

// Example: SelectWidget
interface SelectWidget extends BaseWidget {
  type: 'SELECT';
  options: WidgetOption[];
  allowCustomOption?: boolean;
  searchable?: boolean;
}
```

#### Configuration

```typescript
interface UIConfiguration {
  id: string;
  version: string;
  name: string;
  description?: string;
  fileType: FileType;
  responseType: ResponseType;
  widgets: Widget[];
  layout?: Layout;
  styles?: Styles;
  behaviors?: Behaviors;
  metadata?: {
    createdBy: string;
    createdAt: string;
    updatedBy?: string;
    updatedAt?: string;
    tags?: string[];
  };
}
```

## Usage

### 1. Access UI Builder

Navigate to:
- `/ops/ui-builder` - Create new UI configuration
- `/ops/projects/:projectId/ui-builder` - Create UI for specific project

Or from Ops Dashboard:
- Click "UI Builder" in Quick Actions

### 2. Build UI

1. **Select Pipeline Mode**: Choose ANNOTATION, REVIEW, or QUALITY_CHECK
2. **Add Widgets**: Click widgets from the toolbox to add them to canvas
3. **Configure Widget**: Select widget and edit properties in the property panel
4. **Position Widget**: Drag widget to desired location on canvas
5. **Set Order**: Adjust display order in properties
6. **Preview**: Toggle preview to see how UI will look to users
7. **Save**: Export as JSON or save to project

### 3. Widget Configuration Examples

#### Text Input
```typescript
{
  type: 'TEXT_INPUT',
  label: 'Enter your response',
  placeholder: 'Type here...',
  required: true,
  validation: [
    { type: 'minLength', value: 10, message: 'Must be at least 10 characters' }
  ]
}
```

#### Select Dropdown
```typescript
{
  type: 'SELECT',
  label: 'Choose a category',
  options: [
    { id: '1', label: 'Category A', value: 'cat_a' },
    { id: '2', label: 'Category B', value: 'cat_b' }
  ],
  required: true
}
```

#### Conditional Display
```typescript
{
  type: 'TEXTAREA',
  label: 'Explain your choice',
  conditionalDisplay: [
    {
      field: 'categorySelect',
      operator: 'equals',
      value: 'other'
    }
  ]
}
```

#### Pipeline-Specific Widget
```typescript
{
  type: 'RATING',
  label: 'Rate annotation quality',
  pipelineModes: ['REVIEW', 'QUALITY_CHECK'], // Only shown in review modes
  maxRating: 5
}
```

### 4. Integration with Tasks

#### Annotator View
```typescript
import { DynamicUIRenderer } from '../components/uibuilder';

<DynamicUIRenderer
  configuration={task.uiConfiguration}
  pipelineMode="ANNOTATION"
  fileData={task.fileData}
  fileType={task.fileType}
  onSubmit={handleSubmit}
/>
```

#### Reviewer View
```typescript
<DynamicUIRenderer
  configuration={task.uiConfiguration}
  pipelineMode="REVIEW"
  fileData={task.fileData}
  fileType={task.fileType}
  initialData={task.annotationData} // Show annotator's work
  readOnly={false}
  onSubmit={handleReview}
/>
```

## Features

### 1. Dynamic UI Generation
- Build UIs without writing code
- Drag-and-drop interface
- Real-time preview
- Export/import JSON configurations

### 2. Widget Library
- 14 widget types covering all common use cases
- Extensible architecture for custom widgets
- Type-specific property editors
- Icon-based selection

### 3. Conditional Logic
- Show/hide widgets based on other field values
- Multiple condition operators (equals, contains, greaterThan, etc.)
- Complex conditions with multiple rules

### 4. Validation
- Field-level validation rules
- Custom error messages
- Required field enforcement
- Pattern matching (regex)
- Min/max length and value constraints

### 5. Pipeline Awareness
- Different UIs for annotation, review, and quality check
- Widget visibility based on pipeline mode
- Context-aware labels and instructions

### 6. File Type Support
- TEXT, MARKDOWN, HTML
- IMAGE, VIDEO, AUDIO
- CSV, PDF
- Integrated file viewer component

### 7. Version Control
- Configuration history tracking
- Undo/redo functionality
- Version metadata (createdBy, updatedBy, timestamps)
- Change tracking

### 8. Import/Export
- Export to JSON
- Import from JSON
- Template sharing
- Version migration

## Backend Integration (Planned)

### API Endpoints

```typescript
// Create UI configuration
POST /api/v1/projects/:projectId/ui-configurations
Body: UIConfiguration

// List configurations for project
GET /api/v1/projects/:projectId/ui-configurations

// Get specific configuration
GET /api/v1/ui-configurations/:id

// Update configuration
PUT /api/v1/ui-configurations/:id
Body: Partial<UIConfiguration>

// Get version history
GET /api/v1/ui-configurations/:id/versions

// Create template
POST /api/v1/ui-templates
Body: UITemplate
```

### Database Schema

```sql
CREATE TABLE ui_configurations (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  version VARCHAR(20),
  name VARCHAR(255),
  description TEXT,
  file_type VARCHAR(50),
  response_type VARCHAR(50),
  widgets JSONB,
  layout JSONB,
  styles JSONB,
  behaviors JSONB,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ui_configuration_versions (
  id UUID PRIMARY KEY,
  configuration_id UUID REFERENCES ui_configurations(id),
  version VARCHAR(20),
  configuration JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ui_templates (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  file_type VARCHAR(50),
  configuration JSONB,
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Extension Points

### 1. Custom Widgets

To add a new widget type:

1. Add type to `WidgetType` union in `uiBuilder.ts`
2. Create widget interface extending `BaseWidget`
3. Add to `Widget` union type
4. Add definition to `WidgetToolbox`
5. Add rendering logic to `DynamicUIRenderer`
6. Add property editor to `PropertyPanel`

Example:
```typescript
// 1. Add type
type WidgetType = ... | 'SIGNATURE_PAD';

// 2. Create interface
interface SignaturePadWidget extends BaseWidget {
  type: 'SIGNATURE_PAD';
  strokeColor?: string;
  backgroundColor?: string;
  penWidth?: number;
}

// 3. Add to union
type Widget = ... | SignaturePadWidget;

// 4-6. Implement in components
```

### 2. Custom Validation Rules

Add custom validation types:

```typescript
type ValidationType =
  | 'custom'
  | ... existing types;

interface ValidationRule {
  type: ValidationType;
  value: any;
  message: string;
  customValidator?: (value: any) => boolean;
}
```

### 3. Custom Conditional Operators

Extend conditional display logic:

```typescript
type ConditionalOperator =
  | 'custom'
  | ... existing operators;

// In DynamicUIRenderer
case 'custom':
  return widget.conditionalDisplay.customLogic(formData);
```

## Best Practices

1. **Widget Naming**: Use descriptive IDs for widgets (e.g., `categorySelect`, `qualityRating`)
2. **Validation**: Always add validation for required fields
3. **Help Text**: Provide clear instructions for complex fields
4. **Conditional Logic**: Keep conditions simple and intuitive
5. **Pipeline Modes**: Use appropriate modes for workflow stages
6. **Testing**: Always preview UI before saving
7. **Versioning**: Document significant changes in metadata
8. **Templates**: Create templates for common patterns

## Troubleshooting

### Widget Not Showing
- Check `hidden` property
- Verify `pipelineModes` includes current mode
- Check `conditionalDisplay` logic

### Validation Not Working
- Ensure validation rules are correctly configured
- Check rule type matches field type
- Verify error messages are clear

### Preview Different from Production
- Ensure same pipeline mode
- Check if using correct file data
- Verify widget visibility conditions

## Future Enhancements

1. **PixiJS Integration**: Advanced canvas features for image annotation
2. **Multi-turn Interactions**: Support for conversational interfaces
3. **Template Library**: Pre-built UIs for common use cases
4. **Collaborative Editing**: Real-time collaboration on UI design
5. **A/B Testing**: Test different UI variants
6. **Analytics**: Track UI performance and user interactions
7. **Accessibility**: WCAG compliance and screen reader support
8. **Localization**: Multi-language UI support
9. **Mobile Optimization**: Responsive design for mobile annotators
10. **Advanced Layouts**: Grid and flexbox layout options

## Support

For questions or issues:
- Check this documentation
- Review type definitions in `uiBuilder.ts`
- Examine example configurations
- Contact platform team

---

**Last Updated**: 2024-01-20
**Version**: 1.0.0
