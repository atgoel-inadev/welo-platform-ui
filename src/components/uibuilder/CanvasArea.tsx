/**
 * Canvas Area Component
 * Professional editing canvas with flex/grid layout and polished widget cards
 */

import { useState, useCallback } from 'react';
import { Trash2, GripVertical, ChevronUp, ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { UIConfiguration, Widget, QuestionWidget } from '../../types/uiBuilder';

interface CanvasAreaProps {
  configuration: UIConfiguration;
  selectedWidget: Widget | null;
  onSelectWidget: (widgetId: string | null) => void;
  onUpdateWidget: (widgetId: string, updates: Partial<Widget>) => void;
  onDeleteWidget: (widgetId: string) => void;
  onMoveWidget: (widgetId: string, position: { x: number; y: number }) => void;
  onResizeWidget: (widgetId: string, size: { width: number; height: number }) => void;
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({
  configuration,
  selectedWidget,
  onSelectWidget,
  onUpdateWidget,
  onDeleteWidget,
}) => {
  const [hoveredWidget, setHoveredWidget] = useState<string | null>(null);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onSelectWidget(null);
    },
    [onSelectWidget],
  );

  const handleMoveUp = useCallback(
    (widget: Widget) => {
      const sorted = [...configuration.widgets].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((w) => w.id === widget.id);
      if (idx > 0) {
        const prev = sorted[idx - 1];
        onUpdateWidget(widget.id, { order: prev.order });
        onUpdateWidget(prev.id, { order: widget.order });
      }
    },
    [configuration.widgets, onUpdateWidget],
  );

  const handleMoveDown = useCallback(
    (widget: Widget) => {
      const sorted = [...configuration.widgets].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((w) => w.id === widget.id);
      if (idx < sorted.length - 1) {
        const next = sorted[idx + 1];
        onUpdateWidget(widget.id, { order: next.order });
        onUpdateWidget(next.id, { order: widget.order });
      }
    },
    [configuration.widgets, onUpdateWidget],
  );

  /* ── Layout styles ──────────────────────────────────────────────────── */
  const getContainerStyle = (): React.CSSProperties => {
    const layout = configuration.layout;
    const gap = layout.gap || 12;
    const maxW = layout.maxWidth || 800;

    const base: React.CSSProperties = { margin: '0 auto', maxWidth: `${maxW}px` };

    switch (layout.type) {
      case 'grid':
        return { ...base, display: 'grid', gridTemplateColumns: `repeat(${layout.columns || 2}, 1fr)`, gap: `${gap}px` };
      case 'flex-horizontal':
        return { ...base, display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: `${gap}px`, maxWidth: `${maxW}px` };
      case 'two-column':
        return { ...base, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${gap}px` };
      case 'three-column':
        return { ...base, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: `${gap}px` };
      default:
        return { ...base, display: 'flex', flexDirection: 'column', gap: `${gap}px` };
    }
  };

  /* ── Widget card style ──────────────────────────────────────────────── */
  const isSelected = (w: Widget) => selectedWidget?.id === w.id;
  const isHovered = (w: Widget) => hoveredWidget === w.id;

  const cardClass = (widget: Widget) => {
    const sel = isSelected(widget);
    const hov = isHovered(widget);
    let cls =
      'relative rounded-xl transition-all duration-150 cursor-pointer group border bg-white';
    if (sel) cls += ' border-indigo-400 ring-2 ring-indigo-200/60 shadow-md';
    else if (hov) cls += ' border-slate-300 shadow-sm';
    else cls += ' border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)]';
    return cls;
  };

  const getWidgetPadding = (widget: Widget) => {
    if (widget.type === 'DIVIDER' || widget.type === 'SPACER') return 'px-4 py-1';
    return 'p-4';
  };

  const getSizeStyle = (widget: Widget): React.CSSProperties => {
    const s: React.CSSProperties = { minHeight: '48px' };
    if (widget.sizePreset) {
      switch (widget.sizePreset) {
        case 'small': s.width = '280px'; s.maxWidth = '100%'; break;
        case 'medium': s.width = '480px'; s.maxWidth = '100%'; break;
        case 'large': s.width = '100%'; break;
        case 'full-width': s.width = '100%'; s.gridColumn = '1 / -1'; break;
        case 'custom': s.width = `${widget.size.width}px`; s.minHeight = `${widget.size.height}px`; break;
      }
    }
    return s;
  };

  /* ── Widget previews ────────────────────────────────────────────────── */
  const renderWidgetPreview = (widget: Widget) => {
    switch (widget.type) {
      case 'FILE_VIEWER':
        return (
          <div className="flex items-center justify-center h-40 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-dashed border-slate-300">
            <div className="text-center">
              <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <span className="text-sm font-medium text-slate-600">File Viewer</span>
              <p className="text-[11px] text-slate-400 mt-1">Renders uploaded file content</p>
            </div>
          </div>
        );

      case 'QUESTION':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-indigo-500 uppercase tracking-wider">Question Widget</span>
              {(widget as QuestionWidget).showProgress && (
                <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">Q1 of N</span>
              )}
            </div>
            <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg">
              <p className="text-sm font-medium text-slate-800 mb-2.5">
                What is the sentiment? <span className="text-red-500">*</span>
              </p>
              <div className="space-y-1.5">
                {['Positive', 'Negative', 'Neutral'].map((o) => (
                  <label key={o} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-300" />
                    {o}
                  </label>
                ))}
              </div>
            </div>
            {(widget as QuestionWidget).showNavigation && (
              <div className="flex justify-between pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-400 px-3 py-1 bg-slate-50 rounded">Previous</span>
                <span className="text-[11px] text-white px-3 py-1 bg-indigo-500 rounded flex items-center gap-1">
                  Next <ChevronRight size={10} />
                </span>
              </div>
            )}
          </div>
        );

      case 'TEXT_INPUT':
        return (
          <div>
            {widget.label && (
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                {widget.label}{widget.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
            )}
            <div className="w-full h-9 px-3 flex items-center border border-slate-200 rounded-lg bg-slate-50 text-xs text-slate-400">
              {widget.placeholder || 'Enter text…'}
            </div>
            {widget.helpText && <p className="text-[10px] text-slate-400 mt-1">{widget.helpText}</p>}
          </div>
        );

      case 'TEXTAREA':
        return (
          <div>
            {widget.label && (
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                {widget.label}{widget.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
            )}
            <div className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-xs text-slate-400"
                 style={{ minHeight: `${((widget as any).rows || 3) * 20}px` }}>
              {widget.placeholder || 'Enter text…'}
            </div>
            {widget.helpText && <p className="text-[10px] text-slate-400 mt-1">{widget.helpText}</p>}
          </div>
        );

      case 'SELECT':
      case 'MULTI_SELECT':
        return (
          <div>
            {widget.label && (
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                {widget.label}{widget.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
            )}
            <div className="w-full h-9 px-3 flex items-center justify-between border border-slate-200 rounded-lg bg-slate-50 text-xs text-slate-400">
              <span>{widget.placeholder || 'Select…'}</span>
              <ChevronDown size={12} className="text-slate-400" />
            </div>
          </div>
        );

      case 'RADIO_GROUP':
        return (
          <div>
            {widget.label && (
              <label className="block text-xs font-medium text-slate-700 mb-2">
                {widget.label}{widget.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
            )}
            <div className="space-y-1.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-300" />
                  <span className="text-xs text-slate-600">Option {i}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'CHECKBOX':
        return (
          <label className="flex items-center gap-2">
            <span className="w-4 h-4 rounded border-2 border-slate-300" />
            <span className="text-xs font-medium text-slate-700">{widget.label || 'Checkbox label'}</span>
          </label>
        );

      case 'RATING':
        return (
          <div>
            {widget.label && (
              <label className="block text-xs font-medium text-slate-700 mb-1.5">{widget.label}</label>
            )}
            <div className="flex gap-0.5">
              {Array.from({ length: (widget as any).maxRating || 5 }).map((_, i) => (
                <span key={i} className="text-lg text-amber-400">★</span>
              ))}
            </div>
          </div>
        );

      case 'SLIDER':
        return (
          <div>
            {widget.label && (
              <label className="block text-xs font-medium text-slate-700 mb-1.5">{widget.label}</label>
            )}
            <div className="relative h-1.5 bg-slate-200 rounded-full mt-2">
              <div className="absolute left-0 top-0 h-full w-1/3 bg-indigo-500 rounded-full" />
              <div className="absolute left-[33%] top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-indigo-500 rounded-full shadow-sm" />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>{(widget as any).min || 0}</span>
              <span>{(widget as any).max || 100}</span>
            </div>
          </div>
        );

      case 'DATE_PICKER':
        return (
          <div>
            {widget.label && (
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                {widget.label}{widget.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
            )}
            <div className="w-full h-9 px-3 flex items-center border border-slate-200 rounded-lg bg-slate-50 text-xs text-slate-400">
              mm/dd/yyyy
            </div>
          </div>
        );

      case 'INSTRUCTION_TEXT':
        return (
          <div className="flex items-start gap-2.5 p-3 bg-blue-50/70 border border-blue-100 rounded-lg">
            <span className="text-blue-500 text-sm leading-none mt-0.5">ℹ</span>
            <p className="text-xs text-slate-600 leading-relaxed">{(widget as any).content || 'Instructions…'}</p>
          </div>
        );

      case 'DIVIDER':
        return <div className="w-full h-px bg-slate-200" />;

      case 'SPACER':
        return (
          <div
            style={{ height: `${(widget as any).height || 20}px` }}
            className="bg-slate-50 border border-dashed border-slate-200 rounded"
          />
        );

      default:
        return <div className="text-xs text-slate-400 italic">Unknown: {widget.type}</div>;
    }
  };

  const sortedWidgets = [...configuration.widgets].sort((a, b) => a.order - b.order);

  /* ── Empty state ────────────────────────────────────────────────────── */
  if (sortedWidgets.length === 0) {
    return (
      <div
        className="h-full flex items-center justify-center bg-white/50 m-3 rounded-xl border-2 border-dashed border-slate-200"
        onClick={handleCanvasClick}
      >
        <div className="text-center max-w-xs">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-700 mb-1">Empty Canvas</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Click widgets from the left panel to start building your annotation interface.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6 bg-slate-50/50" onClick={handleCanvasClick}>
      <div style={getContainerStyle()}>
        {sortedWidgets.map((widget, index) => (
          <div
            key={widget.id}
            style={getSizeStyle(widget)}
            className={cardClass(widget)}
            onClick={(e) => { e.stopPropagation(); onSelectWidget(widget.id); }}
            onMouseEnter={() => setHoveredWidget(widget.id)}
            onMouseLeave={() => setHoveredWidget(null)}
          >
            {/* Widget type badge (shown only when selected) */}
            {isSelected(widget) && (
              <div className="absolute -top-2.5 left-3 z-10">
                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold bg-indigo-600 text-white rounded-md shadow-sm">
                  {widget.type.replace(/_/g, ' ')}
                </span>
              </div>
            )}

            {/* Toolbar overlay */}
            <div
              className={`absolute top-1.5 right-1.5 z-10 flex items-center gap-0.5 transition-opacity duration-100 ${
                isSelected(widget) || isHovered(widget) ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              {index > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleMoveUp(widget); }}
                  className="p-1 rounded-md bg-white/90 border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-white shadow-sm"
                  title="Move up"
                >
                  <ChevronUp size={13} />
                </button>
              )}
              {index < sortedWidgets.length - 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleMoveDown(widget); }}
                  className="p-1 rounded-md bg-white/90 border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-white shadow-sm"
                  title="Move down"
                >
                  <ChevronDown size={13} />
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteWidget(widget.id); }}
                className="p-1 rounded-md bg-white/90 border border-red-200 text-red-400 hover:text-red-600 hover:bg-red-50 shadow-sm"
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            </div>

            {/* Grip indicator */}
            {(isSelected(widget) || isHovered(widget)) && (
              <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-40">
                <GripVertical size={12} className="text-slate-400" />
              </div>
            )}

            {/* Content */}
            <div className={getWidgetPadding(widget)}>
              {renderWidgetPreview(widget)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
