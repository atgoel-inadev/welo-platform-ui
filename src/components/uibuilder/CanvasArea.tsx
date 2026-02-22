/**
 * Canvas Area Component - Improved with Flex/Grid Layout
 * Main editing canvas for positioning and arranging widgets
 */

import { useState, useCallback } from 'react';
import { Trash2, MoveUp, MoveDown, ChevronRight } from 'lucide-react';
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
      if (e.target === e.currentTarget) {
        onSelectWidget(null);
      }
    },
    [onSelectWidget]
  );

  const handleMoveUp = useCallback(
    (widget: Widget) => {
      // Work with sorted widgets to get the actual visual order
      const sortedWidgets = [...configuration.widgets].sort((a, b) => a.order - b.order);
      const currentIndex = sortedWidgets.findIndex((w) => w.id === widget.id);
      
      if (currentIndex > 0) {
        const prevWidget = sortedWidgets[currentIndex - 1];
        // Swap order values
        onUpdateWidget(widget.id, { order: prevWidget.order });
        onUpdateWidget(prevWidget.id, { order: widget.order });
      }
    },
    [configuration.widgets, onUpdateWidget]
  );

  const handleMoveDown = useCallback(
    (widget: Widget) => {
      // Work with sorted widgets to get the actual visual order
      const sortedWidgets = [...configuration.widgets].sort((a, b) => a.order - b.order);
      const currentIndex = sortedWidgets.findIndex((w) => w.id === widget.id);
      
      if (currentIndex < sortedWidgets.length - 1) {
        const nextWidget = sortedWidgets[currentIndex + 1];
        // Swap order values
        onUpdateWidget(widget.id, { order: nextWidget.order });
        onUpdateWidget(nextWidget.id, { order: widget.order });
      }
    },
    [configuration.widgets, onUpdateWidget]
  );

  const getContainerStyle = (): React.CSSProperties => {
    const layout = configuration.layout;
    
    switch (layout.type) {
      case 'grid':
        return {
          display: 'grid',
          gridTemplateColumns: `repeat(${layout.columns || 2}, 1fr)`,
          gap: `${layout.gap || 16}px`,
          maxWidth: `${layout.maxWidth || 1200}px`,
          margin: '0 auto',
        };
      case 'flex-vertical':
        return {
          display: 'flex',
          flexDirection: 'column',
          gap: `${layout.gap || 16}px`,
          maxWidth: `${layout.maxWidth || 800}px`,
          margin: '0 auto',
        };
      case 'flex-horizontal':
        return {
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: `${layout.gap || 16}px`,
          maxWidth: `${layout.maxWidth || 1200}px`,
          margin: '0 auto',
        };
      case 'two-column':
        return {
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: `${layout.gap || 16}px`,
          maxWidth: `${layout.maxWidth || 1200}px`,
          margin: '0 auto',
        };
      case 'three-column':
        return {
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: `${layout.gap || 16}px`,
          maxWidth: `${layout.maxWidth || 1200}px`,
          margin: '0 auto',
        };
      default:
        return {
          display: 'flex',
          flexDirection: 'column',
          gap: `${layout.gap || 16}px`,
          maxWidth: `${layout.maxWidth || 800}px`,
          margin: '0 auto',
        };
    }
  };

  const getWidgetStyle = (widget: Widget): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      border: selectedWidget?.id === widget.id ? '2px solid #3B82F6' : '1px solid #E5E7EB',
      borderRadius: '8px',
      backgroundColor: 'white',
      padding: '16px',
      minHeight: '60px',
      boxShadow: selectedWidget?.id === widget.id 
        ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        : hoveredWidget === widget.id
        ? '0 2px 4px rgba(0, 0, 0, 0.08)'
        : '0 1px 2px rgba(0, 0, 0, 0.05)',
      cursor: 'pointer',
      transition: 'all 0.2s',
      position: 'relative',
      ...widget.style,
    };

    // Apply size preset
    if (widget.sizePreset) {
      switch (widget.sizePreset) {
        case 'small':
          baseStyle.width = '300px';
          baseStyle.maxWidth = '100%';
          break;
        case 'medium':
          baseStyle.width = '500px';
          baseStyle.maxWidth = '100%';
          break;
        case 'large':
          baseStyle.width = '700px';
          baseStyle.maxWidth = '100%';
          break;
        case 'full-width':
          baseStyle.width = '100%';
          baseStyle.gridColumn = 'span 1 / -1'; // Span all columns in grid
          break;
        case 'custom':
          baseStyle.width = `${widget.size.width}px`;
          baseStyle.minHeight = `${widget.size.height}px`;
          break;
      }
    }

    return baseStyle;
  };

  const renderWidgetPreview = (widget: Widget) => {
    switch (widget.type) {
      case 'FILE_VIEWER':
        return (
          <div className="flex items-center justify-center h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded border-2 border-dashed border-gray-300">
            <div className="text-center">
              <div className="text-4xl mb-2">📁</div>
              <span className="text-gray-600 font-medium">File Viewer Area</span>
              <p className="text-xs text-gray-500 mt-1">File content will be displayed here</p>
            </div>
          </div>
        );

      case 'QUESTION':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">Question Widget</div>
                <div className="text-xs text-gray-400">
                  {(widget as QuestionWidget).renderMode === 'paginated' ? '📄 Paginated' : '📋 All Questions'}
                </div>
              </div>
              {(widget as QuestionWidget).showProgress && (
                <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  Question 1 of {'{N}'}
                </div>
              )}
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="font-medium text-gray-900 mb-3">
                Example: What is the sentiment of this text? <span className="text-red-500">*</span>
              </div>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="radio" className="mr-2" disabled />
                  <span className="text-sm">Positive</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" className="mr-2" disabled />
                  <span className="text-sm">Negative</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" className="mr-2" disabled />
                  <span className="text-sm">Neutral</span>
                </label>
              </div>
            </div>
            {(widget as QuestionWidget).showNavigation && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                <button className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md" disabled>
                  Previous
                </button>
                <button className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md flex items-center gap-2" disabled>
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        );

      case 'TEXT_INPUT':
        return (
          <div>
            {widget.label && (
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {widget.label}
                {widget.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            <input
              type="text"
              placeholder={widget.placeholder || 'Enter text...'}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
            {widget.helpText && <p className="text-xs text-gray-500 mt-1">{widget.helpText}</p>}
          </div>
        );

      case 'TEXTAREA':
        return (
          <div>
            {widget.label && (
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {widget.label}
                {widget.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            <textarea
              placeholder={widget.placeholder || 'Enter text...'}
              disabled
              rows={(widget as any).rows || 4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 resize-none"
            />
            {widget.helpText && <p className="text-xs text-gray-500 mt-1">{widget.helpText}</p>}
          </div>
        );

      case 'SELECT':
      case 'MULTI_SELECT':
        return (
          <div>
            {widget.label && (
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {widget.label}
                {widget.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            <select disabled className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
              <option>{widget.placeholder || 'Select option...'}</option>
            </select>
            {widget.helpText && <p className="text-xs text-gray-500 mt-1">{widget.helpText}</p>}
          </div>
        );

      case 'RADIO_GROUP':
        return (
          <div>
            {widget.label && (
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {widget.label}
                {widget.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center">
                  <input type="radio" disabled className="mr-2" />
                  <span className="text-sm text-gray-700">Option {i}</span>
                </div>
              ))}
            </div>
            {widget.helpText && <p className="text-xs text-gray-500 mt-2">{widget.helpText}</p>}
          </div>
        );

      case 'CHECKBOX':
        return (
          <div className="flex items-center">
            <input type="checkbox" disabled className="mr-2" />
            <label className="text-sm font-medium text-gray-700">
              {widget.label || 'Checkbox label'}
              {widget.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
        );

      case 'RATING':
        return (
          <div>
            {widget.label && (
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {widget.label}
                {widget.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            <div className="flex gap-1">
              {Array.from({ length: (widget as any).maxRating || 5 }).map((_, i) => (
                <span key={i} className="text-2xl text-yellow-400">★</span>
              ))}
            </div>
            {widget.helpText && <p className="text-xs text-gray-500 mt-1">{widget.helpText}</p>}
          </div>
        );

      case 'SLIDER':
        return (
          <div>
            {widget.label && (
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {widget.label}
              </label>
            )}
            <input
              type="range"
              disabled
              className="w-full"
              min={(widget as any).min || 0}
              max={(widget as any).max || 100}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{(widget as any).min || 0}</span>
              <span>{(widget as any).max || 100}</span>
            </div>
            {widget.helpText && <p className="text-xs text-gray-500 mt-1">{widget.helpText}</p>}
          </div>
        );

      case 'DATE_PICKER':
        return (
          <div>
            {widget.label && (
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {widget.label}
                {widget.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            <input
              type="date"
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
            {widget.helpText && <p className="text-xs text-gray-500 mt-1">{widget.helpText}</p>}
          </div>
        );

      case 'INSTRUCTION_TEXT':
        return (
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-blue-600 text-xl">ℹ️</span>
            <div className="flex-1">
              <p className="text-sm text-gray-700">{(widget as any).content || 'Instructions...'}</p>
            </div>
          </div>
        );

      case 'DIVIDER':
        return <div className="w-full h-px bg-gray-300"></div>;

      case 'SPACER':
        return <div style={{ height: `${(widget as any).height || 20}px` }} className="bg-gray-50"></div>;

      default:
        return (
          <div className="text-sm text-gray-500 italic">
            Unknown widget type: {widget.type}
          </div>
        );
    }
  };

  const sortedWidgets = [...configuration.widgets].sort((a, b) => a.order - b.order);

  if (sortedWidgets.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-white rounded-lg border-2 border-dashed border-gray-300" onClick={handleCanvasClick}>
        <div className="text-center">
          <div className="text-6xl mb-4">🎨</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Empty Canvas</h3>
          <p className="text-sm text-gray-500 max-w-sm">
            Add widgets from the left panel to start building your annotation interface.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-gray-50 p-8" onClick={handleCanvasClick}>
      <div style={getContainerStyle()}>
        {sortedWidgets.map((widget, index) => (
          <div
            key={widget.id}
            style={getWidgetStyle(widget)}
            onClick={(e) => {
              e.stopPropagation();
              onSelectWidget(widget.id);
            }}
            onMouseEnter={() => setHoveredWidget(widget.id)}
            onMouseLeave={() => setHoveredWidget(null)}
            className="group"
          >
            {/* Widget Controls */}
            {(selectedWidget?.id === widget.id || hoveredWidget === widget.id) && (
              <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                {index > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveUp(widget);
                    }}
                    className="p-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50"
                    title="Move up"
                  >
                    <MoveUp size={14} />
                  </button>
                )}
                {index < sortedWidgets.length - 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveDown(widget);
                    }}
                    className="p-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50"
                    title="Move down"
                  >
                    <MoveDown size={14} />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteWidget(widget.id);
                  }}
                  className="p-1.5 bg-white border border-red-300 rounded hover:bg-red-50 text-red-600"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}

            {/* Widget Badge */}
            {selectedWidget?.id === widget.id && (
              <div className="absolute -top-3 left-3 px-2 py-0.5 bg-blue-600 text-white text-xs font-medium rounded-full">
                {widget.type.replace('_', ' ')}
              </div>
            )}

            {/* Widget Content */}
            {renderWidgetPreview(widget)}
          </div>
        ))}
      </div>
    </div>
  );
};
