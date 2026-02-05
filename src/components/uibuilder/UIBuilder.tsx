/**
 * UI Builder Main Component
 * Drag-and-drop interface for building dynamic annotation UIs
 */

import { useState, useReducer, useCallback } from 'react';
import { Save, Eye, Undo, Redo, Code, Download, Upload } from 'lucide-react';
import { Button } from '../common';
import { UIConfiguration, UIBuilderState, UIBuilderAction, PipelineMode, Widget } from '../../types/uiBuilder';
import { WidgetToolbox } from './WidgetToolbox';
import { CanvasArea } from './CanvasArea';
import { PropertyPanel } from './PropertyPanel';
import { PreviewPanel } from './PreviewPanel';

interface UIBuilderProps {
  projectId: string;
  initialConfiguration?: UIConfiguration;
  onSave: (configuration: UIConfiguration) => Promise<void>;
  onCancel?: () => void;
}

// Reducer for UI Builder state management
function uiBuilderReducer(state: UIBuilderState, action: UIBuilderAction): UIBuilderState {
  switch (action.type) {
    case 'ADD_WIDGET': {
      const newConfig = {
        ...state.configuration,
        widgets: [...state.configuration.widgets, action.widget],
      };
      return {
        ...state,
        configuration: newConfig,
        selectedWidget: action.widget,
        isDirty: true,
        history: [...state.history.slice(0, state.historyIndex + 1), newConfig],
        historyIndex: state.historyIndex + 1,
      };
    }

    case 'UPDATE_WIDGET': {
      const newConfig = {
        ...state.configuration,
        widgets: state.configuration.widgets.map((w) =>
          w.id === action.widgetId ? { ...w, ...action.updates } : w
        ),
      };
      return {
        ...state,
        configuration: newConfig,
        selectedWidget:
          state.selectedWidget?.id === action.widgetId
            ? { ...state.selectedWidget, ...action.updates }
            : state.selectedWidget,
        isDirty: true,
        history: [...state.history.slice(0, state.historyIndex + 1), newConfig],
        historyIndex: state.historyIndex + 1,
      };
    }

    case 'DELETE_WIDGET': {
      const newConfig = {
        ...state.configuration,
        widgets: state.configuration.widgets.filter((w) => w.id !== action.widgetId),
      };
      return {
        ...state,
        configuration: newConfig,
        selectedWidget: state.selectedWidget?.id === action.widgetId ? null : state.selectedWidget,
        isDirty: true,
        history: [...state.history.slice(0, state.historyIndex + 1), newConfig],
        historyIndex: state.historyIndex + 1,
      };
    }

    case 'SELECT_WIDGET': {
      const widget = action.widgetId
        ? state.configuration.widgets.find((w) => w.id === action.widgetId) || null
        : null;
      return {
        ...state,
        selectedWidget: widget,
      };
    }

    case 'MOVE_WIDGET': {
      return {
        ...state,
        configuration: {
          ...state.configuration,
          widgets: state.configuration.widgets.map((w) =>
            w.id === action.widgetId ? { ...w, position: action.position } : w
          ),
        },
        isDirty: true,
      };
    }

    case 'RESIZE_WIDGET': {
      return {
        ...state,
        configuration: {
          ...state.configuration,
          widgets: state.configuration.widgets.map((w) =>
            w.id === action.widgetId ? { ...w, size: action.size } : w
          ),
        },
        isDirty: true,
      };
    }

    case 'UNDO': {
      if (state.historyIndex > 0) {
        const newIndex = state.historyIndex - 1;
        return {
          ...state,
          configuration: state.history[newIndex],
          historyIndex: newIndex,
          isDirty: true,
        };
      }
      return state;
    }

    case 'REDO': {
      if (state.historyIndex < state.history.length - 1) {
        const newIndex = state.historyIndex + 1;
        return {
          ...state,
          configuration: state.history[newIndex],
          historyIndex: newIndex,
          isDirty: true,
        };
      }
      return state;
    }

    case 'SET_PREVIEW_MODE': {
      return {
        ...state,
        previewMode: action.mode,
      };
    }

    case 'LOAD_CONFIGURATION': {
      return {
        ...state,
        configuration: action.configuration,
        history: [action.configuration],
        historyIndex: 0,
        isDirty: false,
        selectedWidget: null,
      };
    }

    default:
      return state;
  }
}

export const UIBuilder: React.FC<UIBuilderProps> = ({
  projectId,
  initialConfiguration,
  onSave,
  onCancel,
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [showCodeView, setShowCodeView] = useState(false);

  const initialState: UIBuilderState = {
    configuration: initialConfiguration || {
      id: `ui-config-${Date.now()}`,
      name: 'New UI Configuration',
      version: 1,
      projectId,
      pipelineMode: 'ANNOTATION',
      fileType: 'TEXT',
      layout: {
        type: 'two-column',
        columns: 2,
        gap: 16,
      },
      widgets: [],
    },
    selectedWidget: null,
    draggedWidget: null,
    clipboard: null,
    history: [initialConfiguration || ({} as UIConfiguration)],
    historyIndex: 0,
    isDirty: false,
    previewMode: 'ANNOTATION',
  };

  const [state, dispatch] = useReducer(uiBuilderReducer, initialState);

  const handleSave = useCallback(async () => {
    try {
      await onSave(state.configuration);
      dispatch({ type: 'LOAD_CONFIGURATION', configuration: state.configuration });
    } catch (error) {
      console.error('Failed to save UI configuration:', error);
    }
  }, [state.configuration, onSave]);

  const handleExport = useCallback(() => {
    const dataStr = JSON.stringify(state.configuration, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ui-config-${state.configuration.name.replace(/\s+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [state.configuration]);

  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target?.result as string) as UIConfiguration;
          dispatch({ type: 'LOAD_CONFIGURATION', configuration: config });
        } catch (error) {
          console.error('Failed to import configuration:', error);
        }
      };
      reader.readAsText(file);
    }
  }, []);

  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">UI Builder</h1>
          <div className="flex items-center gap-2 pl-4 border-l">
            <Button
              onClick={() => dispatch({ type: 'UNDO' })}
              disabled={!canUndo}
              variant="secondary"
              size="sm"
              title="Undo"
            >
              <Undo size={16} />
            </Button>
            <Button
              onClick={() => dispatch({ type: 'REDO' })}
              disabled={!canRedo}
              variant="secondary"
              size="sm"
              title="Redo"
            >
              <Redo size={16} />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={state.previewMode}
            onChange={(e) =>
              dispatch({ type: 'SET_PREVIEW_MODE', mode: e.target.value as PipelineMode })
            }
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="ANNOTATION">Annotation Mode</option>
            <option value="REVIEW">Review Mode</option>
            <option value="QUALITY_CHECK">Quality Check Mode</option>
          </select>

          <Button
            onClick={() => setShowPreview(!showPreview)}
            variant="secondary"
            size="sm"
          >
            <Eye size={16} className="mr-1" />
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>

          <Button
            onClick={() => setShowCodeView(!showCodeView)}
            variant="secondary"
            size="sm"
          >
            <Code size={16} className="mr-1" />
            JSON
          </Button>

          <div className="border-l pl-2 ml-2 flex gap-2">
            <label>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              <Button as="span" variant="secondary" size="sm">
                <Upload size={16} className="mr-1" />
                Import
              </Button>
            </label>

            <Button onClick={handleExport} variant="secondary" size="sm">
              <Download size={16} className="mr-1" />
              Export
            </Button>
          </div>

          <div className="border-l pl-2 ml-2 flex gap-2">
            {onCancel && (
              <Button onClick={onCancel} variant="secondary">
                Cancel
              </Button>
            )}
            <Button
              onClick={handleSave}
              variant="primary"
              disabled={!state.isDirty}
            >
              <Save size={16} className="mr-1" />
              Save Configuration
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Widget Toolbox */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <WidgetToolbox
            onAddWidget={(widget) => dispatch({ type: 'ADD_WIDGET', widget })}
          />
        </div>

        {/* Center - Canvas Area */}
        <div className="flex-1 overflow-auto p-4">
          {showCodeView ? (
            <div className="h-full bg-gray-900 rounded-lg p-4">
              <pre className="text-green-400 text-sm font-mono overflow-auto h-full">
                {JSON.stringify(state.configuration, null, 2)}
              </pre>
            </div>
          ) : (
            <CanvasArea
              configuration={state.configuration}
              selectedWidget={state.selectedWidget}
              onSelectWidget={(widgetId) => dispatch({ type: 'SELECT_WIDGET', widgetId })}
              onUpdateWidget={(widgetId, updates) =>
                dispatch({ type: 'UPDATE_WIDGET', widgetId, updates })
              }
              onDeleteWidget={(widgetId) => dispatch({ type: 'DELETE_WIDGET', widgetId })}
              onMoveWidget={(widgetId, position) =>
                dispatch({ type: 'MOVE_WIDGET', widgetId, position })
              }
              onResizeWidget={(widgetId, size) =>
                dispatch({ type: 'RESIZE_WIDGET', widgetId, size })
              }
            />
          )}
        </div>

        {/* Right Panel - Properties or Preview */}
        {showPreview ? (
          <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
            <PreviewPanel
              configuration={state.configuration}
              pipelineMode={state.previewMode}
            />
          </div>
        ) : (
          state.selectedWidget && (
            <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
              <PropertyPanel
                widget={state.selectedWidget}
                onUpdate={(updates) =>
                  dispatch({
                    type: 'UPDATE_WIDGET',
                    widgetId: state.selectedWidget!.id,
                    updates,
                  })
                }
                onDelete={() =>
                  dispatch({ type: 'DELETE_WIDGET', widgetId: state.selectedWidget!.id })
                }
              />
            </div>
          )
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-gray-100 border-t border-gray-200 px-4 py-2 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <span>Widgets: {state.configuration.widgets.length}</span>
          <span>Layout: {state.configuration.layout.type}</span>
          <span>File Type: {state.configuration.fileType}</span>
        </div>
        <div className="flex items-center gap-4">
          {state.isDirty && <span className="text-orange-600">● Unsaved changes</span>}
          <span>Version: {state.configuration.version}</span>
        </div>
      </div>
    </div>
  );
};
