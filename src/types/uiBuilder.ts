/**
 * UI Builder Type Definitions
 * Defines the schema and types for dynamic UI configuration
 */

export type FileType = 'TEXT' | 'MARKDOWN' | 'HTML' | 'AUDIO' | 'IMAGE' | 'VIDEO' | 'CSV' | 'PDF';

export type ResponseType = 
  | 'SINGLE_SELECT' 
  | 'MULTI_SELECT' 
  | 'FREE_TEXT' 
  | 'NUMBER' 
  | 'DATE'
  | 'RATING'
  | 'TEXTAREA'
  | 'CHECKBOX'
  | 'RADIO'
  | 'SLIDER'
  | 'MULTI_TURN';

export type WidgetType =
  | 'FILE_VIEWER'
  | 'QUESTION'
  | 'TEXT_INPUT'
  | 'SELECT'
  | 'MULTI_SELECT'
  | 'TEXTAREA'
  | 'RATING'
  | 'SLIDER'
  | 'CHECKBOX'
  | 'RADIO_GROUP'
  | 'DATE_PICKER'
  | 'INSTRUCTION_TEXT'
  | 'DIVIDER'
  | 'SPACER'
  | 'CONTAINER';

export type PipelineMode = 'ANNOTATION' | 'REVIEW' | 'QUALITY_CHECK';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface WidgetStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  margin?: number;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
  customValidator?: string; // Function name for custom validation
}

export interface ConditionalDisplay {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'in';
  value: any;
}

export interface WidgetOption {
  id: string;
  label: string;
  value: string;
  icon?: string;
  color?: string;
  description?: string;
}

export interface BaseWidget {
  id: string;
  type: WidgetType;
  label?: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  position: Position;
  size: Size;
  style?: WidgetStyle;
  validation?: ValidationRule[];
  conditionalDisplay?: ConditionalDisplay[];
  pipelineModes?: PipelineMode[]; // Which pipeline modes this widget appears in
  order: number; // Display order
}

export interface FileViewerWidget extends BaseWidget {
  type: 'FILE_VIEWER';
  fileType: FileType;
  allowFullscreen?: boolean;
  showControls?: boolean;
  autoplay?: boolean;
}

export interface TextInputWidget extends BaseWidget {
  type: 'TEXT_INPUT';
  inputType?: 'text' | 'email' | 'url' | 'tel';
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface TextAreaWidget extends BaseWidget {
  type: 'TEXTAREA';
  rows?: number;
  minLength?: number;
  maxLength?: number;
  showCharCount?: boolean;
}

export interface SelectWidget extends BaseWidget {
  type: 'SELECT';
  options: WidgetOption[];
  allowCustomOption?: boolean;
  searchable?: boolean;
}

export interface MultiSelectWidget extends BaseWidget {
  type: 'MULTI_SELECT';
  options: WidgetOption[];
  minSelections?: number;
  maxSelections?: number;
  allowCustomOption?: boolean;
}

export interface RadioGroupWidget extends BaseWidget {
  type: 'RADIO_GROUP';
  options: WidgetOption[];
  layout?: 'vertical' | 'horizontal' | 'grid';
}

export interface CheckboxWidget extends BaseWidget {
  type: 'CHECKBOX';
  checkboxLabel: string;
}

export interface RatingWidget extends BaseWidget {
  type: 'RATING';
  maxRating: number;
  allowHalf?: boolean;
  icon?: 'star' | 'heart' | 'thumb' | 'emoji';
}

export interface SliderWidget extends BaseWidget {
  type: 'SLIDER';
  min: number;
  max: number;
  step?: number;
  showValue?: boolean;
  showMarks?: boolean;
  marks?: Array<{ value: number; label: string }>;
}

export interface DatePickerWidget extends BaseWidget {
  type: 'DATE_PICKER';
  minDate?: string;
  maxDate?: string;
  format?: string;
  includeTime?: boolean;
}

export interface InstructionTextWidget extends BaseWidget {
  type: 'INSTRUCTION_TEXT';
  content: string;
  format?: 'text' | 'markdown' | 'html';
  iconName?: string;
  variant?: 'info' | 'warning' | 'success' | 'error';
}

export interface DividerWidget extends BaseWidget {
  type: 'DIVIDER';
  orientation?: 'horizontal' | 'vertical';
  thickness?: number;
}

export interface SpacerWidget extends BaseWidget {
  type: 'SPACER';
  height?: number;
}

export interface ContainerWidget extends BaseWidget {
  type: 'CONTAINER';
  children: Widget[];
  layout?: 'vertical' | 'horizontal' | 'grid';
  columns?: number;
  gap?: number;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export type Widget =
  | FileViewerWidget
  | TextInputWidget
  | TextAreaWidget
  | SelectWidget
  | MultiSelectWidget
  | RadioGroupWidget
  | CheckboxWidget
  | RatingWidget
  | SliderWidget
  | DatePickerWidget
  | InstructionTextWidget
  | DividerWidget
  | SpacerWidget
  | ContainerWidget;

export interface UIConfiguration {
  id: string;
  name: string;
  description?: string;
  version: number;
  projectId: string;
  pipelineMode: PipelineMode;
  fileType: FileType;
  layout: {
    type: 'single-column' | 'two-column' | 'three-column' | 'custom';
    columns?: number;
    gap?: number;
  };
  widgets: Widget[];
  theme?: {
    primaryColor?: string;
    backgroundColor?: string;
    fontFamily?: string;
  };
  metadata?: {
    createdBy: string;
    createdAt: string;
    updatedBy?: string;
    updatedAt?: string;
    tags?: string[];
  };
}

export interface UITemplate {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  category: 'text' | 'image' | 'audio' | 'video' | 'multi-modal';
  configuration: Omit<UIConfiguration, 'id' | 'projectId' | 'metadata'>;
}

export interface UIBuilderState {
  configuration: UIConfiguration;
  selectedWidget: Widget | null;
  draggedWidget: Widget | null;
  clipboard: Widget | null;
  history: UIConfiguration[];
  historyIndex: number;
  isDirty: boolean;
  previewMode: PipelineMode;
}

export interface WidgetDefinition {
  type: WidgetType;
  name: string;
  description: string;
  icon: string;
  category: 'input' | 'display' | 'layout' | 'media';
  defaultConfig: Partial<Widget>;
  configSchema: any; // JSON Schema for widget configuration
}

// Actions for UI Builder
export type UIBuilderAction =
  | { type: 'ADD_WIDGET'; widget: Widget }
  | { type: 'UPDATE_WIDGET'; widgetId: string; updates: Partial<Widget> }
  | { type: 'DELETE_WIDGET'; widgetId: string }
  | { type: 'SELECT_WIDGET'; widgetId: string | null }
  | { type: 'MOVE_WIDGET'; widgetId: string; position: Position }
  | { type: 'RESIZE_WIDGET'; widgetId: string; size: Size }
  | { type: 'REORDER_WIDGET'; widgetId: string; newOrder: number }
  | { type: 'COPY_WIDGET'; widgetId: string }
  | { type: 'PASTE_WIDGET' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SET_PREVIEW_MODE'; mode: PipelineMode }
  | { type: 'LOAD_CONFIGURATION'; configuration: UIConfiguration }
  | { type: 'SAVE_CONFIGURATION' }
  | { type: 'LOAD_TEMPLATE'; template: UITemplate };
