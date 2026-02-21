/**
 * Preview Panel Component
 * Shows a real-time preview of the UI configuration as annotators/reviewers will see it.
 * Uses mock data so the preview works without a backend or real files.
 */

import React, { useState } from 'react';
import { UIConfiguration, PipelineMode, Widget } from '../../types/uiBuilder';
import {
  FileText, Image, Music, Video, FileSpreadsheet, File,
  Star, ChevronRight, ChevronLeft, Send,
} from 'lucide-react';

interface PreviewPanelProps {
  configuration: UIConfiguration;
  pipelineMode: PipelineMode;
}

// ─── Mock File Viewer ─────────────────────────────────────────────────────────
const MockFileViewer: React.FC<{ fileType: string }> = ({ fileType }) => {
  const ft = (fileType || 'TEXT').toUpperCase();

  switch (ft) {
    case 'IMAGE':
      return (
        <div className="flex flex-col items-center justify-center h-44 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-dashed border-gray-300">
          <Image size={40} className="text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 font-medium">Image Preview Area</p>
          <p className="text-xs text-gray-400 mt-1">Actual image loads from task file</p>
        </div>
      );

    case 'AUDIO':
      return (
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Music size={16} className="text-green-400" />
            <span className="text-white text-sm">sample-audio.mp3</span>
          </div>
          <div className="flex items-end gap-0.5 h-12 mb-3">
            {Array.from({ length: 48 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-green-400 rounded-sm"
                style={{ height: `${25 + Math.abs(Math.sin(i * 0.4)) * 60}%`, opacity: 0.7 + (i % 3) * 0.1 }}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-white text-xs cursor-pointer">▶</span>
            <div className="flex-1 bg-gray-700 rounded-full h-1.5">
              <div className="bg-green-400 h-full rounded-full w-1/3" />
            </div>
            <span className="text-gray-400 text-xs">1:24 / 3:45</span>
          </div>
        </div>
      );

    case 'VIDEO':
      return (
        <div className="bg-black rounded-lg overflow-hidden">
          <div className="flex items-center justify-center h-32 bg-gray-900">
            <Video size={40} className="text-gray-600" />
          </div>
          <div className="bg-gray-800 px-3 py-2 flex items-center gap-3">
            <span className="text-white text-xs cursor-pointer">▶</span>
            <div className="flex-1 bg-gray-600 rounded-full h-1">
              <div className="bg-blue-400 h-full rounded-full w-1/4" />
            </div>
            <span className="text-gray-400 text-xs">0:45 / 3:12</span>
          </div>
        </div>
      );

    case 'CSV':
      return (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileSpreadsheet size={14} className="text-green-600" />
            <span className="text-xs text-gray-600">sample-data.csv</span>
          </div>
          <table className="w-full text-xs border-collapse border border-gray-200 rounded">
            <thead>
              <tr className="bg-gray-100">
                {['ID', 'Name', 'Category', 'Value'].map((h) => (
                  <th key={h} className="border border-gray-200 px-2 py-1 text-left font-medium text-gray-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[['001', 'Sample A', 'Type 1', '95'], ['002', 'Sample B', 'Type 2', '78']].map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  {row.map((cell, j) => (
                    <td key={j} className="border border-gray-200 px-2 py-1 text-gray-700">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'PDF':
      return (
        <div className="flex flex-col items-center justify-center h-36 bg-red-50 rounded-lg border border-red-200">
          <File size={32} className="text-red-400 mb-1" />
          <p className="text-sm text-gray-600 font-medium">PDF Document</p>
          <p className="text-xs text-gray-400 mt-1">Page 1 of 12</p>
        </div>
      );

    default: // TEXT, MARKDOWN, HTML
      return (
        <div className="bg-white rounded border border-gray-200 p-3">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
            <FileText size={12} className="text-gray-400" />
            <span className="text-xs text-gray-400">sample-content.txt</span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            This is a sample text document for annotation preview. The actual content from the task file will appear here when an annotator views a real task.
          </p>
          <p className="text-sm text-gray-500 leading-relaxed mt-2 italic">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
        </div>
      );
  }
};

// ─── Mock Widget Renderer (interactive for preview) ───────────────────────────
const MockWidget: React.FC<{ widget: Widget; value: any; onChange: (v: any) => void }> = ({
  widget, value, onChange,
}) => {
  switch (widget.type) {
    case 'TEXT_INPUT':
      return (
        <div>
          {widget.label && (
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {widget.label}{widget.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={widget.placeholder || 'Enter text...'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {widget.helpText && <p className="text-xs text-gray-500 mt-1">{widget.helpText}</p>}
        </div>
      );

    case 'TEXTAREA':
      return (
        <div>
          {widget.label && (
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {widget.label}{widget.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={widget.placeholder || 'Enter text...'}
            rows={(widget as any).rows || 3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          {(widget as any).showCharCount && (
            <p className="text-xs text-gray-400 mt-1 text-right">{(value || '').length} chars</p>
          )}
        </div>
      );

    case 'SELECT':
      return (
        <div>
          {widget.label && (
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {widget.label}{widget.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{widget.placeholder || 'Select an option...'}</option>
            {(widget as any).options?.map((opt: any) => (
              <option key={opt.id} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      );

    case 'MULTI_SELECT':
      return (
        <div>
          {widget.label && (
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {widget.label}{widget.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          <div className="space-y-1.5">
            {(widget as any).options?.map((opt: any) => (
              <label key={opt.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(opt.value)}
                  onChange={(e) => {
                    const cur = Array.isArray(value) ? value : [];
                    onChange(e.target.checked ? [...cur, opt.value] : cur.filter((v: any) => v !== opt.value));
                  }}
                  className="rounded text-blue-600 w-4 h-4"
                />
                <span className="text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      );

    case 'RADIO_GROUP': {
      const layout = (widget as any).layout || 'vertical';
      return (
        <div>
          {widget.label && (
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {widget.label}{widget.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          <div className={layout === 'horizontal' ? 'flex flex-wrap gap-3' : 'space-y-1.5'}>
            {(widget as any).options?.map((opt: any) => (
              <label key={opt.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                <input
                  type="radio"
                  name={`preview-${widget.id}`}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={() => onChange(opt.value)}
                  className="text-blue-600 w-4 h-4"
                />
                <span className="text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      );
    }

    case 'CHECKBOX':
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => onChange(e.target.checked)}
            className="rounded text-blue-600 w-4 h-4"
          />
          <span className="text-sm font-medium text-gray-700">
            {widget.label || (widget as any).checkboxLabel}
          </span>
        </label>
      );

    case 'RATING': {
      const max = (widget as any).maxRating || 5;
      return (
        <div>
          {widget.label && (
            <label className="block text-sm font-medium text-gray-700 mb-2">{widget.label}</label>
          )}
          <div className="flex gap-1">
            {Array.from({ length: max }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onChange(i + 1)}
                className={`transition-colors ${value >= i + 1 ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`}
              >
                <Star size={22} fill={value >= i + 1 ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
          {widget.helpText && <p className="text-xs text-gray-500 mt-1">{widget.helpText}</p>}
        </div>
      );
    }

    case 'SLIDER': {
      const min = (widget as any).min ?? 0;
      const max = (widget as any).max ?? 100;
      return (
        <div>
          {widget.label && (
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {widget.label}
              {(widget as any).showValue && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold">{value ?? min}</span>
              )}
            </label>
          )}
          <input
            type="range"
            min={min}
            max={max}
            step={(widget as any).step ?? 1}
            value={value ?? min}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>{min}</span>
            <span>{max}</span>
          </div>
          {widget.helpText && <p className="text-xs text-gray-500 mt-1">{widget.helpText}</p>}
        </div>
      );
    }

    case 'DATE_PICKER':
      return (
        <div>
          {widget.label && (
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {widget.label}{widget.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          <input
            type={(widget as any).includeTime ? 'datetime-local' : 'date'}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
      );

    case 'INSTRUCTION_TEXT': {
      const variant = (widget as any).variant || 'info';
      const styles: Record<string, string> = {
        info: 'bg-blue-50 border-blue-200 text-blue-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
      };
      return (
        <div className={`p-3 border rounded-md text-sm ${styles[variant] || styles.info}`}>
          {(widget as any).content || 'Instructions text...'}
        </div>
      );
    }

    case 'DIVIDER':
      return <hr className="border-gray-200" />;

    case 'SPACER':
      return <div style={{ height: (widget as any).height || 16 }} />;

    case 'FILE_VIEWER':
      return null; // handled separately

    default:
      return (
        <div className="p-2 bg-gray-100 rounded text-xs text-gray-500 italic">
          [{widget.type}] — {widget.label || 'Unnamed widget'}
        </div>
      );
  }
};

// ─── Main Preview Panel ───────────────────────────────────────────────────────
export const PreviewPanel: React.FC<PreviewPanelProps> = ({ configuration, pipelineMode }) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [currentIdx, setCurrentIdx] = useState(0);

  const handleChange = (widgetId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [widgetId]: value }));
  };

  const sortedWidgets = [...configuration.widgets]
    .filter((w) => !w.hidden)
    .filter((w) => {
      if (!w.pipelineModes || w.pipelineModes.length === 0) return true;
      return w.pipelineModes.includes(pipelineMode);
    })
    .sort((a, b) => a.order - b.order);

  const fileViewer = sortedWidgets.find((w) => w.type === 'FILE_VIEWER');
  const questionWidgets = sortedWidgets.filter((w) => w.type !== 'FILE_VIEWER');
  const total = questionWidgets.length;
  const isLast = currentIdx >= total - 1;
  const isFirst = currentIdx === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Live Preview</h2>
            <p className="text-xs text-gray-600 mt-0.5">
              Mode: <span className="font-semibold text-blue-600">{pipelineMode}</span>
              {' · '}
              {configuration.fileType} · {configuration.widgets.length} widget{configuration.widgets.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {configuration.widgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-white rounded-full shadow flex items-center justify-center mb-4">
              <FileText size={28} className="text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">No widgets configured</p>
            <p className="text-gray-400 text-sm mt-1">Add widgets from the left panel to see a preview</p>
          </div>
        ) : (
          <>
            {/* Task header */}
            <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Task #12345 · {configuration.name}</p>
                </div>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">ASSIGNED</span>
              </div>
            </div>

            {/* File Viewer */}
            {fileViewer && (
              <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Task Media</p>
                <MockFileViewer fileType={(fileViewer as any).fileType || configuration.fileType} />
              </div>
            )}

            {/* Questions */}
            {questionWidgets.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                {/* Progress bar */}
                {total > 1 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                      <span>Question {currentIdx + 1} of {total}</span>
                      <span>{Math.round(((currentIdx + 1) / total) * 100)}% complete</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${((currentIdx + 1) / total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Widget */}
                {questionWidgets[currentIdx] && (
                  <div className="min-h-[80px]">
                    <MockWidget
                      widget={questionWidgets[currentIdx]}
                      value={formData[questionWidgets[currentIdx].id]}
                      onChange={(v) => handleChange(questionWidgets[currentIdx].id, v)}
                    />
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                    disabled={isFirst}
                    className="flex items-center gap-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>

                  {isLast ? (
                    <button
                      onClick={() => alert('Preview: Annotation would be submitted here!')}
                      className="flex items-center gap-2 px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      <Send size={14} /> Submit Annotation
                    </button>
                  ) : (
                    <button
                      onClick={() => setCurrentIdx((i) => Math.min(total - 1, i + 1))}
                      className="flex items-center gap-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Next <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-white flex-shrink-0">
        <p className="text-xs text-gray-400">
          Preview uses sample data. Real tasks load actual files from storage.
        </p>
      </div>
    </div>
  );
};
