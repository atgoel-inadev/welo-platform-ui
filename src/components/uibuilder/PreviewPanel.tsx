/**
 * Preview Panel Component
 * Mirrors the exact visual style of UnifiedTaskRenderer so
 * what you see here is what annotators/reviewers will see.
 */

import React, { useState } from 'react';
import { UIConfiguration, PipelineMode, Widget } from '../../types/uiBuilder';
import {
  FileText, Image, Music, Video, FileSpreadsheet, File,
  ChevronRight, ChevronLeft, Send, Eye, CheckCircle, Info, AlertTriangle,
} from 'lucide-react';

interface PreviewPanelProps {
  configuration: UIConfiguration;
  pipelineMode: PipelineMode;
}

/* ─── Mock File Viewer ───────────────────────────────────────────────────── */

const MockFileViewer: React.FC<{ fileType: string }> = ({ fileType }) => {
  const ft = (fileType || 'TEXT').toUpperCase();
  switch (ft) {
    case 'IMAGE':
      return (
        <div className="flex flex-col items-center justify-center h-40 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-dashed border-gray-300">
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
              <div key={i} className="flex-1 bg-green-400 rounded-sm" style={{ height: `${25 + Math.abs(Math.sin(i * 0.4)) * 60}%`, opacity: 0.7 + (i % 3) * 0.1 }} />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-white text-xs cursor-pointer">▶</span>
            <div className="flex-1 bg-gray-700 rounded-full h-1.5"><div className="bg-green-400 h-full rounded-full w-1/3" /></div>
            <span className="text-gray-400 text-xs">1:24 / 3:45</span>
          </div>
        </div>
      );
    case 'VIDEO':
      return (
        <div className="bg-black rounded-lg overflow-hidden">
          <div className="flex items-center justify-center h-32 bg-gray-900"><Video size={40} className="text-gray-600" /></div>
          <div className="bg-gray-800 px-3 py-2 flex items-center gap-3">
            <span className="text-white text-xs cursor-pointer">▶</span>
            <div className="flex-1 bg-gray-600 rounded-full h-1"><div className="bg-blue-400 h-full rounded-full w-1/4" /></div>
            <span className="text-gray-400 text-xs">0:45 / 3:12</span>
          </div>
        </div>
      );
    case 'CSV':
      return (
        <div>
          <div className="flex items-center gap-2 mb-2"><FileSpreadsheet size={14} className="text-green-600" /><span className="text-xs text-gray-600">sample-data.csv</span></div>
          <table className="w-full text-xs border-collapse border border-gray-200 rounded">
            <thead><tr className="bg-gray-100">{['ID', 'Name', 'Category', 'Value'].map((h) => <th key={h} className="border border-gray-200 px-2 py-1 text-left font-medium text-gray-700">{h}</th>)}</tr></thead>
            <tbody>{[['001', 'Sample A', 'Type 1', '95'], ['002', 'Sample B', 'Type 2', '78']].map((row, i) => <tr key={i} className="hover:bg-gray-50">{row.map((c, j) => <td key={j} className="border border-gray-200 px-2 py-1 text-gray-700">{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
    case 'PDF':
      return (
        <div className="flex flex-col items-center justify-center h-36 bg-red-50 rounded-lg border border-red-200">
          <File size={32} className="text-red-400 mb-1" /><p className="text-sm text-gray-600 font-medium">PDF Document</p><p className="text-xs text-gray-400 mt-1">Page 1 of 12</p>
        </div>
      );
    default:
      return (
        <div className="bg-white rounded border border-gray-200 p-3">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100"><FileText size={12} className="text-gray-400" /><span className="text-xs text-gray-400">sample-content.txt</span></div>
          <p className="text-sm text-gray-700 leading-relaxed">This is a sample text document for annotation preview. The actual content from the task file will appear here when an annotator views a real task.</p>
          <p className="text-sm text-gray-500 leading-relaxed mt-2 italic">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
        </div>
      );
  }
};

/* ─── Mock Widget — matches UnifiedTaskRenderer QuestionWidget exactly ──── */

const MockWidget: React.FC<{ widget: Widget; value: any; onChange: (v: any) => void }> = ({
  widget, value, onChange,
}) => {
  const opts: { id: string; label: string; value: string }[] = ((widget as any).options || []).map((o: any) =>
    typeof o === 'string' ? { id: o, label: o, value: o } : o,
  );

  switch (widget.type) {
    case 'TEXT_INPUT':
      return (
        <input
          type={(widget as any).inputType || 'text'}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={widget.placeholder || 'Enter your response...'}
        />
      );

    case 'TEXTAREA':
      return (
        <div>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition text-sm"
            rows={(widget as any).rows || 4}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={widget.placeholder || 'Enter your response...'}
          />
          {(widget as any).showCharCount && (
            <p className="text-xs text-gray-400 mt-1 text-right">{(value || '').length} chars</p>
          )}
        </div>
      );

    case 'SELECT':
    case 'RADIO_GROUP':
      return (
        <div className="space-y-2">
          {opts.map((option) => (
            <label
              key={option.id}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                value === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input type="radio" name={`preview-${widget.id}`} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} className="sr-only" />
              <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                value === option.value ? 'border-blue-500 bg-blue-500' : 'border-gray-400'
              }`}>
                {value === option.value && <span className="block w-2 h-2 rounded-full bg-white" />}
              </span>
              <span className="text-sm font-medium">{option.label}</span>
            </label>
          ))}
        </div>
      );

    case 'MULTI_SELECT':
      return (
        <div className="space-y-2">
          {opts.map((option) => {
            const selected = Array.isArray(value) && value.includes(option.value);
            return (
              <label
                key={option.id}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input type="checkbox" checked={selected} onChange={(e) => {
                  const cur = Array.isArray(value) ? value : [];
                  onChange(e.target.checked ? [...cur, option.value] : cur.filter((v: any) => v !== option.value));
                }} className="sr-only" />
                <span className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                  selected ? 'border-blue-500 bg-blue-500' : 'border-gray-400'
                }`}>
                  {selected && <span className="text-white text-xs">✓</span>}
                </span>
                <span className="text-sm font-medium">{option.label}</span>
              </label>
            );
          })}
        </div>
      );

    case 'CHECKBOX':
      return (
        <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
          value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        }`}>
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
          <span className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center ${
            value ? 'border-blue-500 bg-blue-500' : 'border-gray-400'
          }`}>
            {value && <span className="text-white text-xs font-bold">✓</span>}
          </span>
          <span className="text-sm font-medium text-gray-700">{(widget as any).checkboxLabel || widget.label}</span>
        </label>
      );

    case 'RATING': {
      const maxR = (widget as any).maxRating || 5;
      return (
        <div className="flex gap-3 flex-wrap">
          {Array.from({ length: maxR }, (_, i) => i + 1).map((rating) => (
            <button
              key={rating}
              type="button"
              className={`w-12 h-12 rounded-xl border-2 font-bold text-base transition-all ${
                value === rating
                  ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-700'
              } cursor-pointer`}
              onClick={() => onChange(rating)}
            >
              {rating}
            </button>
          ))}
        </div>
      );
    }

    case 'SLIDER': {
      const min = (widget as any).min ?? 0;
      const max = (widget as any).max ?? 100;
      const step = (widget as any).step ?? 1;
      const sliderVal = value ?? min;
      return (
        <div className="space-y-3 px-1">
          <div className="flex items-center gap-4">
            <input type="range" min={min} max={max} step={step} value={sliderVal}
              onChange={(e) => onChange(Number(e.target.value))} className="flex-1 accent-blue-600 h-2" />
            <span className="w-14 text-center font-bold text-lg text-blue-700 bg-blue-50 border border-blue-200 rounded-lg py-1">
              {sliderVal}
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-400"><span>{min}</span><span>{max}</span></div>
        </div>
      );
    }

    case 'DATE_PICKER':
      return (
        <input
          type={(widget as any).includeTime ? 'datetime-local' : 'date'}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
          value={value || ''} onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'INSTRUCTION_TEXT': {
      const variant = (widget as any).variant || 'info';
      const styles: Record<string, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
        info:    { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-800',   icon: <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" /> },
        warning: { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-800',  icon: <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" /> },
        success: { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-800',  icon: <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" /> },
        error:   { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-800',    icon: <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" /> },
      };
      const s = styles[variant] || styles.info;
      return (
        <div className={`flex gap-2 p-3 rounded-lg border ${s.bg} ${s.border} ${s.text} text-sm`}>
          {s.icon}
          <span>{(widget as any).content || 'Instructions text...'}</span>
        </div>
      );
    }

    case 'DIVIDER':
      return <hr className="border-gray-200" />;
    case 'SPACER':
      return <div style={{ height: (widget as any).height || 16 }} />;
    case 'FILE_VIEWER':
      return null;
    default:
      return <div className="p-2 bg-gray-100 rounded text-xs text-gray-500 italic">[{widget.type}] — {widget.label || 'Unnamed widget'}</div>;
  }
};

/* ─── Main Preview Panel ─────────────────────────────────────────────────── */

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ configuration, pipelineMode }) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());

  const handleChange = (widgetId: string, val: any) => {
    setFormData((prev) => ({ ...prev, [widgetId]: val }));
    setAnsweredQuestions((prev) => {
      const next = new Set(prev);
      const empty = val === null || val === '' || val === undefined || (Array.isArray(val) && val.length === 0);
      if (!empty) next.add(widgetId); else next.delete(widgetId);
      return next;
    });
  };

  const sortedWidgets = [...configuration.widgets]
    .filter((w) => !w.hidden)
    .filter((w) => { if (!w.pipelineModes || w.pipelineModes.length === 0) return true; return w.pipelineModes.includes(pipelineMode); })
    .sort((a, b) => a.order - b.order);

  const fileViewer = sortedWidgets.find((w) => w.type === 'FILE_VIEWER');
  const instructionWidgets = sortedWidgets.filter((w) => w.type === 'INSTRUCTION_TEXT');
  const questionWidgets = sortedWidgets.filter((w) => w.type !== 'FILE_VIEWER' && w.type !== 'INSTRUCTION_TEXT' && w.type !== 'DIVIDER' && w.type !== 'SPACER');
  const total = questionWidgets.length;
  const isLast = currentIdx >= total - 1;
  const isFirst = currentIdx === 0;
  const current = questionWidgets[currentIdx];
  const isCurrentAnswered = current ? answeredQuestions.has(current.id) : false;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Top bar — matches UnifiedTaskRenderer top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          <Eye size={14} className="text-blue-600" />
          <div>
            <h2 className="font-bold text-gray-900 text-xs">Annotator Preview</h2>
            <p className="text-[10px] text-gray-500">
              {pipelineMode} · {configuration.fileType} · {configuration.widgets.length} widget{configuration.widgets.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="text-[10px] text-gray-500">
          {answeredQuestions.size}/{total} answered
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {configuration.widgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText size={28} className="text-gray-400 mx-auto mb-2 opacity-50" />
            <p className="text-gray-600 font-medium text-sm">No widgets configured</p>
            <p className="text-gray-400 text-xs mt-1">Add widgets from the left panel to see a preview</p>
          </div>
        ) : (
          <>
            {/* File Viewer section — mimics the left panel of the annotator view */}
            {fileViewer && (
              <div className="bg-white border-b border-gray-200">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <FileText size={12} className="text-gray-500" />
                    <span className="text-xs font-semibold text-gray-700">Task Media</span>
                  </div>
                </div>
                <div className="p-4">
                  <MockFileViewer fileType={(fileViewer as any).fileType || configuration.fileType} />
                </div>
              </div>
            )}

            {/* Questions section — mimics the right panel */}
            {questionWidgets.length > 0 && (
              <div className="flex flex-col flex-1">
                {/* Progress bar + question dots — exact match */}
                <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex-shrink-0">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1.5">
                    <span className="font-medium">Question {currentIdx + 1} of {total}</span>
                    <span>{Math.round(((currentIdx + 1) / total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${((currentIdx + 1) / total) * 100}%` }} />
                  </div>
                  {/* Clickable question dots */}
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {questionWidgets.map((q, i) => (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIdx(i)}
                        className={`w-5 h-5 rounded-full text-[10px] font-semibold transition-all ${
                          i === currentIdx
                            ? 'bg-blue-600 text-white scale-110 shadow-sm'
                            : answeredQuestions.has(q.id)
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                        }`}
                        title={`Q${i + 1}: ${q.label || 'Question'}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Instructions (shown on first question) */}
                {instructionWidgets.length > 0 && currentIdx === 0 && (
                  <div className="px-4 pt-3 flex-shrink-0">
                    {instructionWidgets.map((iw) => (
                      <div key={iw.id} className="mb-2">
                        <MockWidget widget={iw} value={null} onChange={() => {}} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Current question card — exact match to UnifiedTaskRenderer */}
                <div className="flex-1 overflow-y-auto p-4">
                  {current && (
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                      <div className="mb-4">
                        <div className="flex items-start gap-2 mb-1">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex-shrink-0 mt-0.5">
                            {currentIdx + 1}
                          </span>
                          <h3 className="text-sm font-semibold text-gray-900 leading-snug">
                            {current.label || 'Question'}
                            {current.required !== false && <span className="text-red-500 ml-1">*</span>}
                          </h3>
                        </div>
                        {(current.helpText || current.placeholder) && (
                          <p className="text-xs text-gray-500 mt-1 ml-8">
                            {current.helpText || current.placeholder}
                          </p>
                        )}
                      </div>
                      <div className="ml-8">
                        <MockWidget
                          widget={current}
                          value={formData[current.id]}
                          onChange={(v) => handleChange(current.id, v)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation footer — exact match */}
                <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
                  <button
                    onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                    disabled={isFirst}
                    className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>

                  <div className="text-xs">
                    {isCurrentAnswered ? (
                      <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle size={12} /> Answered</span>
                    ) : current?.required !== false ? (
                      <span className="text-amber-600 text-[10px] font-medium">Required</span>
                    ) : (
                      <span className="text-gray-400 text-[10px]">Optional</span>
                    )}
                  </div>

                  {isLast ? (
                    <button
                      onClick={() => alert('Preview: Annotation would be submitted here!')}
                      className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-semibold transition shadow-sm"
                    >
                      <Send size={12} /> Submit Annotation
                    </button>
                  ) : (
                    <button
                      onClick={() => setCurrentIdx((i) => Math.min(total - 1, i + 1))}
                      className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium transition"
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
