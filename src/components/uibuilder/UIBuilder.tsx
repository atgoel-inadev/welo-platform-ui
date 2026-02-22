/**
 * UI Builder Main Component
 * Drag-and-drop interface for building dynamic annotation UIs
 */

import { useState, useReducer, useCallback } from 'react';
import { Save, Eye, Undo, Redo, Code, Download, Upload, LayoutTemplate } from 'lucide-react';
import { Button } from '../common';
import { UIConfiguration, UIBuilderState, UIBuilderAction, PipelineMode, Widget, UITemplate } from '../../types/uiBuilder';
import { WidgetToolbox } from './WidgetToolbox.tsx';
import { CanvasArea } from './CanvasArea.tsx';
import { PropertyPanel } from './PropertyPanel.tsx';
import { PreviewPanel } from './PreviewPanel.tsx';
import { uiTemplates } from './templates';

interface UIBuilderProps {
  projectId: string;
  initialConfiguration?: UIConfiguration;
  onSave: (configuration: UIConfiguration) => Promise<void>;
  onCancel?: () => void;
}

// Build default initial configuration
function buildDefaultConfig(projectId: string): UIConfiguration {
  return {
    id: `ui-config-${Date.now()}`,
    name: 'New UI Configuration',
    version: 1,
    projectId,
    pipelineMode: 'ANNOTATION',
    fileType: 'TEXT',
    layout: {
      type: 'flex-vertical',
      columns: 1,
      gap: 16,
      maxWidth: 800,
    },
    widgets: [],
  };
}

// Normalize widget orders to ensure sequential unique values
function normalizeWidgetOrders(config: UIConfiguration): UIConfiguration {
  const sortedWidgets = [...config.widgets].sort((a, b) => a.order - b.order);
  const normalizedWidgets = sortedWidgets.map((widget, index) => ({
    ...widget,
    order: index,
  }));
  
  return {
    ...config,
    widgets: normalizedWidgets,
  };
}

// Reducer for UI Builder state management
function uiBuilderReducer(state: UIBuilderState, action: UIBuilderAction): UIBuilderState {
  switch (action.type) {
    case 'ADD_WIDGET': {
      // Calculate next order value based on existing widgets
      const maxOrder = state.configuration.widgets.length > 0
        ? Math.max(...state.configuration.widgets.map(w => w.order))
        : -1;
      
      const widgetWithOrder = {
        ...action.widget,
        order: maxOrder + 1,
      };
      
      const newConfig = {
        ...state.configuration,
        widgets: [...state.configuration.widgets, widgetWithOrder],
      } as UIConfiguration;
      return {
        ...state,
        configuration: newConfig,
        selectedWidget: widgetWithOrder,
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
      } as UIConfiguration;
      return {
        ...state,
        configuration: newConfig,
        selectedWidget:
          state.selectedWidget?.id === action.widgetId
            ? ({ ...state.selectedWidget, ...action.updates } as Widget)
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
      } as UIConfiguration;
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
          isDirty: newIndex > 0,
          selectedWidget: null,
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
          selectedWidget: null,
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
      const normalizedConfig = normalizeWidgetOrders(action.configuration);
      return {
        ...state,
        configuration: normalizedConfig,
        history: [normalizedConfig],
        historyIndex: 0,
        isDirty: false,
        selectedWidget: null,
      };
    }

    case 'UPDATE_CONFIG_METADATA': {
      const newConfig = {
        ...state.configuration,
        ...action.updates,
      } as UIConfiguration;
      return {
        ...state,
        configuration: newConfig,
        isDirty: true,
        history: [...state.history.slice(0, state.historyIndex + 1), newConfig],
        historyIndex: state.historyIndex + 1,
      };
    }

    case 'LOAD_TEMPLATE': {
      const templateConfig: UIConfiguration = {
        ...action.template.configuration,
        id: `ui-config-${Date.now()}`,
        projectId: state.configuration.projectId,
        version: 1,
      };
      const normalizedConfig = normalizeWidgetOrders(templateConfig);
      return {
        ...state,
        configuration: normalizedConfig,
        history: [normalizedConfig],
        historyIndex: 0,
        isDirty: true,
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
  const [showTemplates, setShowTemplates] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const defaultConfig = buildDefaultConfig(projectId);
  
  // Normalize initial configuration to ensure widget orders are sequential
  const normalizedInitialConfig = initialConfiguration 
    ? normalizeWidgetOrders(initialConfiguration)
    : defaultConfig;

  const initialState: UIBuilderState = {
    configuration: normalizedInitialConfig,
    selectedWidget: null,
    draggedWidget: null,
    clipboard: null,
    history: [normalizedInitialConfig],
    historyIndex: 0,
    isDirty: false,
    previewMode: 'ANNOTATION',
  };

  const [state, dispatch] = useReducer(uiBuilderReducer, initialState);

  const handleSave = useCallback(async () => {
    try {
      setSaveError(null);
      setSaveSuccess(false);
      await onSave(state.configuration);
      dispatch({ type: 'LOAD_CONFIGURATION', configuration: state.configuration });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error('Failed to save UI configuration:', error);
      setSaveError(error?.message || 'Failed to save configuration');
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
    // Reset input so the same file can be imported again
    event.target.value = '';
  }, []);

  const handleLoadTemplate = useCallback((template: UITemplate) => {
    dispatch({ type: 'LOAD_TEMPLATE', template });
    setShowTemplates(false);
  }, []);

  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;
  // Allow saving if dirty OR if there are widgets (new config with content)
  const canSave = state.isDirty || state.configuration.widgets.length > 0;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
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

        <div className="flex items-center gap-2 flex-wrap">
          {/* Config name editor */}
          <input
            type="text"
            defaultValue={state.configuration.name}
            key={state.configuration.id}
            onBlur={(e) => {
              if (e.target.value !== state.configuration.name) {
                dispatch({ type: 'UPDATE_CONFIG_METADATA', updates: { name: e.target.value } });
              }
            }}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
            placeholder="Configuration name..."
          />

          {/* File type */}
          <select
            value={state.configuration.fileType}
            onChange={(e) =>
              dispatch({ type: 'UPDATE_CONFIG_METADATA', updates: { fileType: e.target.value as any } })
            }
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
          >
            <option value="TEXT">Text</option>
            <option value="MARKDOWN">Markdown</option>
            <option value="IMAGE">Image</option>
            <option value="AUDIO">Audio</option>
            <option value="VIDEO">Video</option>
            <option value="CSV">CSV</option>
            <option value="PDF">PDF</option>
          </select>

          {/* Layout type */}
          <select
            value={state.configuration.layout.type}
            onChange={(e) =>
              dispatch({ 
                type: 'UPDATE_CONFIG_METADATA', 
                updates: { 
                  layout: { 
                    ...state.configuration.layout, 
                    type: e.target.value as any 
                  } 
                } 
              })
            }
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
            title="Layout Type"
          >
            <option value="flex-vertical">Vertical (Stacked)</option>
            <option value="flex-horizontal">Horizontal (Wrapped)</option>
            <option value="grid">Grid</option>
            <option value="two-column">Two Columns</option>
            <option value="three-column">Three Columns</option>
          </select>

          {/* Preview mode */}
          <select
            value={state.previewMode}
            onChange={(e) =>
              dispatch({ type: 'SET_PREVIEW_MODE', mode: e.target.value as PipelineMode })
            }
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
          >
            <option value="ANNOTATION">Annotation Mode</option>
            <option value="REVIEW">Review Mode</option>
            <option value="QUALITY_CHECK">Quality Check Mode</option>
          </select>

          <Button
            onClick={() => setShowTemplates(!showTemplates)}
            variant="secondary"
            size="sm"
          >
            <LayoutTemplate size={16} className="mr-1" />
            Templates
          </Button>

          <Button
            onClick={() => { setShowPreview(!showPreview); setShowCodeView(false); }}
            variant={showPreview ? 'primary' : 'secondary'}
            size="sm"
          >
            <Eye size={16} className="mr-1" />
            {showPreview ? 'Hide' : 'Preview'}
          </Button>

          <Button
            onClick={() => { setShowCodeView(!showCodeView); setShowPreview(false); }}
            variant={showCodeView ? 'primary' : 'secondary'}
            size="sm"
          >
            <Code size={16} className="mr-1" />
            JSON
          </Button>

          <div className="border-l pl-2 ml-2 flex gap-2">
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              <span className="inline-flex items-center px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer text-gray-700">
                <Upload size={16} className="mr-1" />
                Import
              </span>
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
              disabled={!canSave}
            >
              <Save size={16} className="mr-1" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Save feedback */}
      {saveError && (
        <div className="mx-4 mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex-shrink-0">
          Save failed: {saveError}
        </div>
      )}
      {saveSuccess && (
        <div className="mx-4 mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700 flex-shrink-0">
          Configuration saved successfully!
        </div>
      )}

      {/* Templates Overlay */}
      {showTemplates && (
        <div className="absolute inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center" onClick={() => setShowTemplates(false)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Choose a Template</h2>
              <button onClick={() => setShowTemplates(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">×</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uiTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleLoadTemplate(template)}
                  className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${getCategoryColor(template.category)}`}>
                      {getCategoryEmoji(template.category)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">{template.name}</h3>
                      <span className="text-xs text-gray-500 capitalize">{template.category}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{template.description}</p>
                  <div className="mt-3 text-xs text-gray-400">
                    {template.configuration.widgets.length} widgets
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Widget Toolbox */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
          <WidgetToolbox
            onAddWidget={(widget: Widget) => dispatch({ type: 'ADD_WIDGET', widget })}
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
              onSelectWidget={(widgetId: string | null) => dispatch({ type: 'SELECT_WIDGET', widgetId })}
              onUpdateWidget={(widgetId: string, updates: Partial<Widget>) =>
                dispatch({ type: 'UPDATE_WIDGET', widgetId, updates })
              }
              onDeleteWidget={(widgetId: string) => dispatch({ type: 'DELETE_WIDGET', widgetId })}
              onMoveWidget={(widgetId: string, position: { x: number; y: number }) =>
                dispatch({ type: 'MOVE_WIDGET', widgetId, position })
              }
              onResizeWidget={(widgetId: string, size: { width: number; height: number }) =>
                dispatch({ type: 'RESIZE_WIDGET', widgetId, size })
              }
            />
          )}
        </div>

        {/* Right Panel - Properties or Preview */}
        {showPreview ? (
          <div className="w-[480px] bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0">
            <PreviewPanel
              configuration={state.configuration}
              pipelineMode={state.previewMode}
            />
          </div>
        ) : (
          state.selectedWidget && (
            <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0">
              <PropertyPanel
                widget={state.selectedWidget}
                onUpdate={(updates: Partial<Widget>) =>
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
      <div className="bg-gray-100 border-t border-gray-200 px-4 py-2 flex items-center justify-between text-sm text-gray-600 flex-shrink-0">
        <div className="flex items-center gap-4">
          <span>Widgets: {state.configuration.widgets.length}</span>
          <span>Layout: {state.configuration.layout.type}</span>
          <span>File Type: {state.configuration.fileType}</span>
          <span>Mode: {state.previewMode}</span>
        </div>
        <div className="flex items-center gap-4">
          {state.isDirty && <span className="text-orange-600 font-medium">● Unsaved changes</span>}
          {!state.isDirty && state.configuration.widgets.length > 0 && (
            <span className="text-green-600">✓ Saved</span>
          )}
          <span>Version: {state.configuration.version}</span>
        </div>
      </div>
    </div>
  );
};

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    text: 'bg-blue-100 text-blue-600',
    image: 'bg-green-100 text-green-600',
    audio: 'bg-purple-100 text-purple-600',
    video: 'bg-red-100 text-red-600',
    'multi-modal': 'bg-orange-100 text-orange-600',
  };
  return colors[category] || 'bg-gray-100 text-gray-600';
}

function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    text: '📝',
    image: '🖼️',
    audio: '🎵',
    video: '🎬',
    'multi-modal': '🔀',
  };
  return emojis[category] || '📋';
}
