/**
 * UI Builder Main Component
 * Enterprise-grade drag-and-drop interface for building annotation UIs
 */

import { useState, useReducer, useCallback } from 'react';
import {
  Save, Eye, Undo, Redo, Code, Download, Upload,
  LayoutTemplate, ArrowLeft, Check, AlertTriangle,
  PanelRightClose, List, SplitSquareVertical,
  Columns2, Columns3, LayoutGrid, AlignVerticalSpaceAround, AlignHorizontalSpaceAround,
} from 'lucide-react';
import { UIConfiguration, UIBuilderState, UIBuilderAction, PipelineMode, Widget, UITemplate } from '../../types/uiBuilder';
import { WidgetToolbox } from './WidgetToolbox.tsx';
import { CanvasArea } from './CanvasArea.tsx';
import { PropertyPanel } from './PropertyPanel.tsx';
import { PreviewPanel } from './PreviewPanel.tsx';
import { uiTemplates } from './templates';

interface UIBuilderProps {
  projectId: string;
  projectName?: string;
  projectFileType?: string;
  initialConfiguration?: UIConfiguration;
  onSave: (configuration: UIConfiguration) => Promise<void>;
  onCancel?: () => void;
}

// Build default initial configuration
function buildDefaultConfig(projectId: string, fileType?: string): UIConfiguration {
  return {
    id: `ui-config-${Date.now()}`,
    name: 'Annotation Interface',
    version: 1,
    projectId,
    pipelineMode: 'ANNOTATION',
    fileType: (fileType as any) || 'TEXT',
    responseType: 'STRUCTURED',
    layout: {
      type: 'flex-vertical',
      columns: 1,
      gap: 16,
      maxWidth: 800,
    },
    widgets: [],
    renderMode: 'paginated',
  };
}

// Normalize widget orders to ensure sequential unique values
function normalizeWidgetOrders(config: UIConfiguration): UIConfiguration {
  const sortedWidgets = [...config.widgets].sort((a, b) => a.order - b.order);
  const normalizedWidgets = sortedWidgets.map((widget, index) => ({
    ...widget,
    order: index,
  }));
  return { ...config, widgets: normalizedWidgets };
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
  projectName,
  projectFileType,
  initialConfiguration,
  onSave,
  onCancel,
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [showCodeView, setShowCodeView] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const defaultConfig = buildDefaultConfig(projectId, projectFileType);

  // If we got an initial config, merge with defaults and apply projectFileType override
  const normalizedInitialConfig = initialConfiguration
    ? normalizeWidgetOrders({
        ...defaultConfig,
        ...initialConfiguration,
        fileType: (projectFileType as any) || initialConfiguration.fileType || defaultConfig.fileType,
        layout: initialConfiguration.layout && typeof initialConfiguration.layout === 'object'
          ? initialConfiguration.layout
          : defaultConfig.layout,
        widgets: (initialConfiguration.widgets || []).map((w: any, i: number) => ({
          ...w,
          order: w.order ?? i,
          required: w.required ?? false,
          hidden: w.hidden ?? false,
          sizePreset: w.sizePreset || 'medium',
          // Normalize string options to { id, label, value } objects
          options: Array.isArray(w.options)
            ? w.options.map((o: any) =>
                typeof o === 'string' ? { id: o, label: o, value: o } : o,
              )
            : w.options,
        })),
      })
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
      setSaving(true);
      await onSave(state.configuration);
      dispatch({ type: 'LOAD_CONFIGURATION', configuration: state.configuration });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (error: any) {
      console.error('Failed to save UI configuration:', error);
      setSaveError(error?.message || 'Failed to save configuration');
      setTimeout(() => setSaveError(null), 4000);
    } finally {
      setSaving(false);
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
    event.target.value = '';
  }, []);

  const handleLoadTemplate = useCallback((template: UITemplate) => {
    dispatch({ type: 'LOAD_TEMPLATE', template });
    setShowTemplates(false);
  }, []);

  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;
  const canSave = state.isDirty || state.configuration.widgets.length > 0;

  /* Layout icons map for toolbar */
  const layoutOptions: { value: string; label: string; icon: React.ReactNode }[] = [
    { value: 'flex-vertical', label: 'Vertical', icon: <AlignVerticalSpaceAround size={14} /> },
    { value: 'flex-horizontal', label: 'Horizontal', icon: <AlignHorizontalSpaceAround size={14} /> },
    { value: 'grid', label: 'Grid', icon: <LayoutGrid size={14} /> },
    { value: 'two-column', label: '2 Col', icon: <Columns2 size={14} /> },
    { value: 'three-column', label: '3 Col', icon: <Columns3 size={14} /> },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* ─── Top Toolbar ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200/80 flex-shrink-0">
        {/* Primary row */}
        <div className="h-14 px-4 flex items-center justify-between">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-3 min-w-0">
            {onCancel && (
              <button
                onClick={onCancel}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  defaultValue={state.configuration.name}
                  key={state.configuration.id}
                  onBlur={(e) => {
                    if (e.target.value !== state.configuration.name) {
                      dispatch({ type: 'UPDATE_CONFIG_METADATA', updates: { name: e.target.value } });
                    }
                  }}
                  className="text-sm font-semibold text-slate-800 bg-transparent border-0 border-b border-transparent
                             hover:border-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-0
                             px-1 py-0.5 w-52 truncate transition-colors"
                  placeholder="Configuration name…"
                />
                {state.isDirty && (
                  <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber-400" title="Unsaved changes" />
                )}
              </div>
              {projectName && (
                <p className="text-[11px] text-slate-400 pl-1 truncate">
                  {projectName} · {projectFileType || state.configuration.fileType}
                </p>
              )}
            </div>
          </div>

          {/* Center: Undo/Redo + Layout */}
          <div className="flex items-center gap-1">
            {/* Undo/Redo */}
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden mr-2">
              <button
                onClick={() => dispatch({ type: 'UNDO' })}
                disabled={!canUndo}
                className="p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Undo"
              >
                <Undo size={15} />
              </button>
              <div className="w-px h-5 bg-slate-200" />
              <button
                onClick={() => dispatch({ type: 'REDO' })}
                disabled={!canRedo}
                className="p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Redo"
              >
                <Redo size={15} />
              </button>
            </div>

            {/* Layout selector */}
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
              {layoutOptions.map((lo) => (
                <button
                  key={lo.value}
                  onClick={() =>
                    dispatch({
                      type: 'UPDATE_CONFIG_METADATA',
                      updates: { layout: { ...state.configuration.layout, type: lo.value as any } },
                    })
                  }
                  className={`p-2 transition-colors ${
                    state.configuration.layout.type === lo.value
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                  }`}
                  title={lo.label}
                >
                  {lo.icon}
                </button>
              ))}
            </div>

            {/* Render mode toggle: Paginated vs All */}
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden ml-2">
              <button
                onClick={() =>
                  dispatch({
                    type: 'UPDATE_CONFIG_METADATA',
                    updates: { renderMode: 'paginated' },
                  })
                }
                className={`p-2 transition-colors ${
                  (state.configuration.renderMode || 'paginated') === 'paginated'
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                }`}
                title="Paginated (one question at a time)"
              >
                <SplitSquareVertical size={14} />
              </button>
              <div className="w-px h-5 bg-slate-200" />
              <button
                onClick={() =>
                  dispatch({
                    type: 'UPDATE_CONFIG_METADATA',
                    updates: { renderMode: 'all' },
                  })
                }
                className={`p-2 transition-colors ${
                  state.configuration.renderMode === 'all'
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                }`}
                title="All questions (scrollable)"
              >
                <List size={14} />
              </button>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5">
            {/* Mode selector */}
            <select
              value={state.previewMode}
              onChange={(e) =>
                dispatch({ type: 'SET_PREVIEW_MODE', mode: e.target.value as PipelineMode })
              }
              className="h-8 pl-2.5 pr-7 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-600
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 appearance-none
                         bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20width%3d%2212%22%20height%3d%2212%22%20viewBox%3d%220%200%2024%2024%22%20fill%3d%22none%22%20stroke%3d%22%239ca3af%22%20stroke-width%3d%222%22%3e%3cpath%20d%3d%22m6%209%206%206%206-6%22%3e%3c%2fpath%3e%3c%2fsvg%3e')] bg-no-repeat bg-[right_6px_center]"
            >
              <option value="ANNOTATION">Annotation</option>
              <option value="REVIEW">Review</option>
              <option value="QUALITY_CHECK">QA</option>
            </select>

            <div className="w-px h-5 bg-slate-200 mx-1" />

            {/* Templates */}
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="h-8 px-2.5 flex items-center gap-1.5 text-xs font-medium border border-slate-200 rounded-lg
                         text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <LayoutTemplate size={14} />
              <span className="hidden xl:inline">Templates</span>
            </button>

            {/* Preview toggle */}
            <button
              onClick={() => { setShowPreview(!showPreview); setShowCodeView(false); }}
              className={`h-8 px-2.5 flex items-center gap-1.5 text-xs font-medium border rounded-lg transition-colors ${
                showPreview
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {showPreview ? <PanelRightClose size={14} /> : <Eye size={14} />}
              <span className="hidden xl:inline">{showPreview ? 'Close' : 'Preview'}</span>
            </button>

            {/* JSON toggle */}
            <button
              onClick={() => { setShowCodeView(!showCodeView); setShowPreview(false); }}
              className={`h-8 px-2.5 flex items-center gap-1.5 text-xs font-medium border rounded-lg transition-colors ${
                showCodeView
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Code size={14} />
              <span className="hidden xl:inline">JSON</span>
            </button>

            <div className="w-px h-5 bg-slate-200 mx-1" />

            {/* Import */}
            <label className="cursor-pointer">
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              <span className="inline-flex items-center h-8 px-2.5 text-xs font-medium border border-slate-200 rounded-lg
                               text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer gap-1.5">
                <Upload size={14} />
                <span className="hidden xl:inline">Import</span>
              </span>
            </label>

            {/* Export */}
            <button
              onClick={handleExport}
              className="h-8 px-2.5 flex items-center gap-1.5 text-xs font-medium border border-slate-200 rounded-lg
                         text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Download size={14} />
              <span className="hidden xl:inline">Export</span>
            </button>

            <div className="w-px h-5 bg-slate-200 mx-1" />

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={!canSave || saving}
              className="h-8 px-4 flex items-center gap-1.5 text-xs font-semibold rounded-lg transition-all
                         bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800
                         disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-indigo-200"
            >
              {saving ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : saveSuccess ? (
                <Check size={14} />
              ) : (
                <Save size={14} />
              )}
              {saveSuccess ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Save feedback toasts ─────────────────────────────────────────── */}
      {saveError && (
        <div className="mx-4 mt-2 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex-shrink-0">
          <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
          <span className="truncate">Save failed: {saveError}</span>
        </div>
      )}

      {/* ─── Templates modal ──────────────────────────────────────────────── */}
      {showTemplates && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowTemplates(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[75vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Templates</h2>
                <p className="text-xs text-slate-500 mt-0.5">Choose a template to quickly scaffold your UI</p>
              </div>
              <button
                onClick={() => setShowTemplates(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {uiTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleLoadTemplate(template)}
                    className="text-left p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-300
                               hover:bg-indigo-50/40 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${getCategoryColor(template.category)}`}>
                        {getCategoryEmoji(template.category)}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800 group-hover:text-indigo-700">{template.name}</h3>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">{template.category}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-2">{template.description}</p>
                    <span className="text-[10px] text-slate-400">{template.configuration.widgets.length} widgets</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Widget Toolbox */}
        <div className="w-[260px] bg-white border-r border-slate-200/80 overflow-y-auto flex-shrink-0">
          <WidgetToolbox
            onAddWidget={(widget: Widget) => dispatch({ type: 'ADD_WIDGET', widget })}
          />
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 overflow-auto">
          {showCodeView ? (
            <div className="h-full bg-[#0f172a] p-5">
              <pre className="text-emerald-400 text-xs font-mono leading-relaxed overflow-auto h-full">
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
          <div className="w-[440px] bg-white border-l border-slate-200/80 overflow-y-auto flex-shrink-0">
            <PreviewPanel
              configuration={state.configuration}
              pipelineMode={state.previewMode}
            />
          </div>
        ) : (
          state.selectedWidget && (
            <div className="w-[340px] bg-white border-l border-slate-200/80 overflow-y-auto flex-shrink-0">
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

      {/* ─── Status Bar ───────────────────────────────────────────────────── */}
      <div className="h-7 bg-white border-t border-slate-200/80 px-4 flex items-center justify-between text-[11px] text-slate-500 flex-shrink-0 select-none">
        <div className="flex items-center gap-4">
          <span>{state.configuration.widgets.length} widget{state.configuration.widgets.length !== 1 ? 's' : ''}</span>
          <span className="text-slate-300">·</span>
          <span className="capitalize">{state.configuration.layout.type.replace(/-/g, ' ')}</span>
          <span className="text-slate-300">·</span>
          <span>{state.configuration.fileType}</span>
          <span className="text-slate-300">·</span>
          <span>{state.previewMode}</span>
        </div>
        <div className="flex items-center gap-3">
          {state.isDirty && (
            <span className="flex items-center gap-1 text-amber-600">
              <span className="w-1 h-1 rounded-full bg-amber-500" />
              Unsaved
            </span>
          )}
          {!state.isDirty && state.configuration.widgets.length > 0 && (
            <span className="flex items-center gap-1 text-emerald-600">
              <Check size={10} />
              Up to date
            </span>
          )}
          <span className="text-slate-400">v{state.configuration.version}</span>
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
