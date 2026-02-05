/**
 * Canvas Area Component
 * Main editing canvas for positioning and arranging widgets
 */

import { useRef, useState, useCallback } from 'react';
import { Trash2, Copy, Move } from 'lucide-react';
import { UIConfiguration, Widget, Position, Size } from '../../types/uiBuilder';

interface CanvasAreaProps {
  configuration: UIConfiguration;
  selectedWidget: Widget | null;
  onSelectWidget: (widgetId: string | null) => void;
  onUpdateWidget: (widgetId: string, updates: Partial<Widget>) => void;
  onDeleteWidget: (widgetId: string) => void;
  onMoveWidget: (widgetId: string, position: Position) => void;
  onResizeWidget: (widgetId: string, size: Size) => void;
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({
  configuration,
  selectedWidget,
  onSelectWidget,
  onUpdateWidget,
  onDeleteWidget,
  onMoveWidget,
  onResizeWidget,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingWidget, setDraggingWidget] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, widget: Widget) => {
      if (e.button !== 0) return; // Only left click

      e.stopPropagation();
      onSelectWidget(widget.id);

      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setDraggingWidget(widget.id);
    },
    [onSelectWidget]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggingWidget || !canvasRef.current) return;

      const canvasRect = canvasRef.current.getBoundingClientRect();
      const newX = e.clientX - canvasRect.left - dragOffset.x;
      const newY = e.clientY - canvasRect.top - dragOffset.y;

      onMoveWidget(draggingWidget, {
        x: Math.max(0, Math.min(newX, canvasRect.width - 100)),
        y: Math.max(0, Math.min(newY, canvasRect.height - 50)),
      });
    },
    [draggingWidget, dragOffset, onMoveWidget]
  );

  const handleMouseUp = useCallback(() => {
    setDraggingWidget(null);
  }, []);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onSelectWidget(null);
      }
    },
    [onSelectWidget]
  );

  const getWidgetStyle = (widget: Widget): React.CSSProperties => {
    return {
      position: 'absolute',
      left: `${widget.position.x}px`,
      top: `${widget.position.y}px`,
      width: `${widget.size.width}px`,
      minHeight: `${widget.size.height}px`,
      border: selectedWidget?.id === widget.id ? '2px solid #3B82F6' : '1px solid #E5E7EB',
      borderRadius: '4px',
      backgroundColor: 'white',
      padding: '12px',
      cursor: draggingWidget === widget.id ? 'grabbing' : 'grab',
      boxShadow: selectedWidget?.id === widget.id 
        ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      transition: draggingWidget === widget.id ? 'none' : 'all 0.2s',
      ...widget.style,
    };
  };

  const renderWidgetPreview = (widget: Widget) => {
    switch (widget.type) {
      case 'FILE_VIEWER':
        return (
          <div className="flex items-center justify-center h-full bg-gray-50 rounded">
            <span className="text-gray-400 text-sm">File Viewer Area</span>
          </div>
        );

      case 'TEXT_INPUT':
        return (
          <div>
            {widget.label && (
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
          </div>
        );

      case 'SELECT':
      case 'MULTI_SELECT':
        return (
          <div>
            {widget.label && (
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {widget.label}
                {widget.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            <select disabled className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
              <option>{widget.placeholder || 'Select option...'}</option>
            </select>
          </div>
        );

      case 'RADIO_GROUP':
        return (
          <div>
            {widget.label && (
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {widget.label}
                {widget.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center">
                  <input type="radio" disabled className="mr-2" />
                  <span className="text-sm text-gray-600">Option {i}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'CHECKBOX':
        return (
          <div className="flex items-center">
            <input type="checkbox" disabled className="mr-2" />
            <label className="text-sm font-medium text-gray-700">
              {widget.label || 'Checkbox label'}
            </label>
          </div>
        );

      case 'RATING':
        return (
          <div>
            {widget.label && (
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {widget.label}
              </label>
            )}
            <div className="flex gap-1">
              {Array.from({ length: (widget as any).maxRating || 5 }).map((_, i) => (
                <span key={i} className="text-2xl text-gray-300">★</span>
              ))}
            </div>
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
          </div>
        );

      case 'DATE_PICKER':
        return (
          <div>
            {widget.label && (
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {widget.label}
              </label>
            )}
            <input
              type="date"
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>
        );

      case 'INSTRUCTION_TEXT':
        return (
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded">
            <span className="text-blue-600">ℹ</span>
            <p className="text-sm text-gray-700">{(widget as any).content || 'Instructions...'}</p>
          </div>
        );

      case 'DIVIDER':
        return <hr className="border-gray-300" />;

      case 'SPACER':
        return <div className="bg-gray-100 rounded" style={{ height: (widget as any).height || 20 }} />;

      default:
        return (
          <div className="text-sm text-gray-500 text-center py-4">
            {widget.type} widget
          </div>
        );
    }
  };

  const sortedWidgets = [...configuration.widgets].sort((a, b) => a.order - b.order);

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full bg-white rounded-lg border-2 border-dashed border-gray-300 overflow-auto"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleCanvasClick}
      style={{ minHeight: '800px' }}
    >
      {/* Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #f0f0f0 1px, transparent 1px),
            linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />

      {/* Widgets */}
      {sortedWidgets.map((widget) => (
        <div
          key={widget.id}
          style={getWidgetStyle(widget)}
          onMouseDown={(e) => handleMouseDown(e, widget)}
        >
          {/* Widget Controls */}
          {selectedWidget?.id === widget.id && (
            <div className="absolute -top-8 right-0 flex gap-1 bg-white border border-gray-200 rounded-md shadow-sm p-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Copy functionality
                }}
                className="p-1 hover:bg-gray-100 rounded"
                title="Copy"
              >
                <Copy size={14} className="text-gray-600" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteWidget(widget.id);
                }}
                className="p-1 hover:bg-red-50 rounded"
                title="Delete"
              >
                <Trash2 size={14} className="text-red-600" />
              </button>
            </div>
          )}

          {/* Widget Content */}
          <div className="pointer-events-none">
            {renderWidgetPreview(widget)}
          </div>

          {/* Widget Label Badge */}
          <div className="absolute -top-5 left-0 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-t">
            {widget.type}
          </div>
        </div>
      ))}

      {/* Empty State */}
      {sortedWidgets.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <Move size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No widgets yet</p>
            <p className="text-sm mt-2">Click a widget from the left panel to add it to the canvas</p>
          </div>
        </div>
      )}
    </div>
  );
};
