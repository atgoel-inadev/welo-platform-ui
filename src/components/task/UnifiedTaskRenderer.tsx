import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Loader2, AlertCircle, Send, ChevronLeft, ChevronRight,
  CheckCircle, Clock, FileText, Info, AlertTriangle, XCircle,
} from 'lucide-react';
import { FileViewer } from '../FileViewer';
import AnnotationReviewWidget from './AnnotationReviewWidget';
import {
  taskRenderingService,
  TaskRenderConfig,
  SaveAnnotationDto,
  SaveReviewDto,
} from '../../services/taskRenderingService';
import {
  annotationQaService,
  AnnotationQaRecord,
  QcCheckResult,
} from '../../services/annotationQaService';
import { pluginService, Plugin, PluginResult, PluginFailBehavior } from '../../services/pluginService';

// ─── Plugin state per question ────────────────────────────────────────────────
interface QuestionPluginState {
  status: 'idle' | 'running' | PluginResult;
  message?: string;
  behavior?: PluginFailBehavior;
  overrideReason?: string;
  acknowledged?: boolean;
}

interface UnifiedTaskRendererProps {
  taskId: string;
  viewType: 'annotator' | 'reviewer';
  userId: string;
}

// ─── Internal types ───────────────────────────────────────────────────────────
interface QuestionOption {
  label: string;
  value: string;
}

interface Question {
  id: string;
  text: string;
  description?: string;
  /** Normalised type derived from widget type */
  type: string;
  options?: QuestionOption[];
  required?: boolean;
  // Widget-specific extras
  maxRating?: number;
  sliderMin?: number;
  sliderMax?: number;
  sliderStep?: number;
  marks?: Array<{ value: number; label: string }>;
  rows?: number;
  inputType?: string;
  checkboxLabel?: string;
  minDate?: string;
  maxDate?: string;
}

interface InstructionItem {
  id: string;
  content: string;
  variant: 'info' | 'warning' | 'success' | 'error';
  order: number;
}

// ─── Widget-type helpers ──────────────────────────────────────────────────────
const QUESTION_WIDGET_TYPES = new Set([
  'QUESTION', // Generic question widget container
  'TEXT_INPUT', 'TEXTAREA', 'SELECT', 'MULTI_SELECT',
  'RADIO_GROUP', 'CHECKBOX', 'RATING', 'SLIDER', 'DATE_PICKER',
]);

function widgetToQuestion(w: any): Question {
  const typeMap: Record<string, string> = {
    TEXT_INPUT: 'text',
    TEXTAREA: 'textarea',
    SELECT: 'single_select',
    MULTI_SELECT: 'multi_select',
    RADIO_GROUP: 'single_select',
    CHECKBOX: 'checkbox',
    RATING: 'rating',
    SLIDER: 'slider',
    DATE_PICKER: 'date',
  };
  const options: QuestionOption[] = (w.options || []).map((o: any) =>
    typeof o === 'string' ? { label: o, value: o } : { label: o.label || o.value, value: o.value || o.id }
  );
  return {
    id: w.id,
    text: w.label || 'Question',
    description: w.helpText || w.placeholder,
    type: typeMap[w.type] || 'text',
    options: options.length > 0 ? options : undefined,
    required: w.required !== false,
    maxRating: w.maxRating,
    sliderMin: w.min,
    sliderMax: w.max,
    sliderStep: w.step,
    marks: w.marks,
    rows: w.rows,
    inputType: w.inputType,
    checkboxLabel: w.checkboxLabel,
    minDate: w.minDate,
    maxDate: w.maxDate,
  };
}

function normalizeLegacyQuestion(q: any): Question {
  const options: QuestionOption[] | undefined = Array.isArray(q.options)
    ? q.options.map((o: any) => typeof o === 'string' ? { label: o, value: o } : { label: o.label || o.value, value: o.value || o.id })
    : undefined;
  
  // Map API questionType to internal type format
  const typeMap: Record<string, string> = {
    'TEXT': 'text',
    'TEXTAREA': 'textarea',
    'SINGLE_SELECT': 'single_select',
    'MULTI_SELECT': 'multi_select',
    'CHECKBOX': 'checkbox',
    'RATING': 'rating',
    'SLIDER': 'slider',
    'DATE': 'date',
    'BOOLEAN': 'boolean',
  };
  
  const normalizedType = q.questionType ? typeMap[q.questionType.toUpperCase()] || q.questionType.toLowerCase() : q.type;
  
  return {
    id: q.id,
    text: q.question || q.text || 'Question',
    description: q.description,
    type: normalizedType || 'text',
    options,
    required: q.required !== false,
  };
}

// ─── Question Widget ──────────────────────────────────────────────────────────
const QuestionWidget: React.FC<{
  question: Question;
  value: any;
  onChange: (v: any) => void;
  disabled?: boolean;
}> = ({ question, value, onChange, disabled = false }) => {
  const opts = question.options || [];

  switch (question.type) {
    case 'text':
      return (
        <input
          type={question.inputType || 'text'}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter your response..."
          disabled={disabled}
        />
      );

    case 'textarea':
      return (
        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition"
          rows={question.rows || 4}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter your response..."
          disabled={disabled}
        />
      );

    case 'single_select':
      return (
        <div className="space-y-2">
          {opts.map((option) => (
            <label
              key={option.value}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                value === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <input
                type="radio"
                name={question.id}
                value={option.value}
                checked={value === option.value}
                onChange={() => !disabled && onChange(option.value)}
                className="sr-only"
                disabled={disabled}
              />
              <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                value === option.value ? 'border-blue-500 bg-blue-500' : 'border-gray-400'
              }`}>
                {value === option.value && (
                  <span className="block w-2 h-2 rounded-full bg-white m-auto mt-0.5" />
                )}
              </span>
              <span className="text-sm font-medium">{option.label}</span>
            </label>
          ))}
        </div>
      );

    case 'multi_select':
      return (
        <div className="space-y-2">
          {opts.map((option) => {
            const selected = Array.isArray(value) && value.includes(option.value);
            return (
              <label
                key={option.value}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selected
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) => {
                    if (disabled) return;
                    const cur = Array.isArray(value) ? value : [];
                    onChange(e.target.checked ? [...cur, option.value] : cur.filter((v) => v !== option.value));
                  }}
                  className="sr-only"
                  disabled={disabled}
                />
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

    case 'rating': {
      const maxR = question.maxRating || 5;
      return (
        <div className="flex gap-3 flex-wrap">
          {Array.from({ length: maxR }, (_, i) => i + 1).map((rating) => (
            <button
              key={rating}
              type="button"
              disabled={disabled}
              className={`w-12 h-12 rounded-xl border-2 font-bold text-base transition-all ${
                value === rating
                  ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-700'
              } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              onClick={() => !disabled && onChange(rating)}
            >
              {rating}
            </button>
          ))}
        </div>
      );
    }

    case 'slider': {
      const min = question.sliderMin ?? 0;
      const max = question.sliderMax ?? 100;
      const step = question.sliderStep ?? 1;
      const sliderVal = value ?? min;
      return (
        <div className="space-y-3 px-1">
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={sliderVal}
              onChange={(e) => !disabled && onChange(Number(e.target.value))}
              className="flex-1 accent-blue-600 h-2"
              disabled={disabled}
            />
            <span className="w-14 text-center font-bold text-lg text-blue-700 bg-blue-50 border border-blue-200 rounded-lg py-1">
              {sliderVal}
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>{min}</span>
            {question.marks && question.marks.map((m) => (
              <span key={m.value} className="text-center text-gray-500">{m.label}</span>
            ))}
            <span>{max}</span>
          </div>
        </div>
      );
    }

    case 'date':
      return (
        <input
          type="date"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          min={question.minDate}
          max={question.maxDate}
          disabled={disabled}
        />
      );

    case 'checkbox':
      return (
        <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
          value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}>
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => !disabled && onChange(e.target.checked)}
            className="sr-only"
            disabled={disabled}
          />
          <span className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center ${
            value ? 'border-blue-500 bg-blue-500' : 'border-gray-400'
          }`}>
            {value && <span className="text-white text-xs font-bold">✓</span>}
          </span>
          <span className="text-sm font-medium text-gray-700">
            {question.checkboxLabel || question.text}
          </span>
        </label>
      );

    case 'boolean':
      return (
        <div className="flex gap-4">
          {[{ label: 'Yes', val: true }, { label: 'No', val: false }].map(({ label, val }) => (
            <label
              key={label}
              className={`flex items-center gap-3 px-6 py-3 rounded-lg border-2 cursor-pointer transition-all ${
                value === val
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <input
                type="radio"
                name={question.id}
                checked={value === val}
                onChange={() => !disabled && onChange(val)}
                className="sr-only"
                disabled={disabled}
              />
              <span className="font-medium">{label}</span>
            </label>
          ))}
        </div>
      );

    default:
      return (
        <input
          type="text"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Enter your response..."
        />
      );
  }
};

// ─── Instruction Banner ───────────────────────────────────────────────────────
const InstructionBanner: React.FC<{ item: InstructionItem }> = ({ item }) => {
  const styles = {
    info:    { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-800',   icon: <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" /> },
    warning: { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-800',  icon: <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" /> },
    success: { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-800',  icon: <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" /> },
    error:   { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-800',    icon: <XCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" /> },
  };
  const s = styles[item.variant] || styles.info;
  return (
    <div className={`flex gap-2 p-3 rounded-lg border ${s.bg} ${s.border} ${s.text} text-sm mb-3`}>
      {s.icon}
      <span>{item.content}</span>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const UnifiedTaskRenderer: React.FC<UnifiedTaskRendererProps> = ({
  taskId,
  viewType,
  userId,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<TaskRenderConfig | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [annotationQaRecord, setAnnotationQaRecord] = useState<AnnotationQaRecord | null>(null);

  // Sequential question navigation
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());

  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Plugin validation state per question
  const [questionPluginState, setQuestionPluginState] = useState<Record<string, QuestionPluginState>>({});

  useEffect(() => {
    loadTaskConfig();
  }, [taskId, userId]);

  useEffect(() => {
    const timer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadTaskConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[UnifiedTaskRenderer] Loading config for task:', taskId, 'user:', userId);
      const renderConfig = await taskRenderingService.getTaskRenderConfig(taskId, userId);
      console.log('[UnifiedTaskRenderer] Config loaded:', renderConfig);
      setConfig(renderConfig);

      if (renderConfig.annotationResponses?.length) {
        const existing: Record<string, any> = {};
        renderConfig.annotationResponses.forEach((ar: any) => {
          existing[ar.questionId] = ar.response;
        });
        setFormData(existing);
        setAnsweredQuestions(new Set(Object.keys(existing)));
      }
    } catch (err: any) {
      console.error('[UnifiedTaskRenderer] Error loading config:', err);
      setError(err.message || 'Failed to load task configuration');
    } finally {
      setLoading(false);
    }
  };

  // ── Derive questions from uiConfiguration.widgets (preferred) or annotationQuestions (fallback) ──
  const questions: Question[] = useMemo(() => {
    console.log('[UnifiedTaskRenderer] Full config:', config);
    console.log('[UnifiedTaskRenderer] uiConfiguration:', config?.uiConfiguration);
    
    // Handle nested configuration structure
    const uiConfig = config?.uiConfiguration as any;
    const widgets = uiConfig?.widgets || uiConfig?.configuration?.widgets;
    
    console.log('[UnifiedTaskRenderer] Deriving questions from widgets:', widgets);
    if (Array.isArray(widgets) && widgets.length > 0) {
      // Check if there's a QUESTION widget - if yes, use annotationQuestions
      const questionWidget = widgets.find((w: any) => w.type === 'QUESTION' && !w.hidden);
      console.log('[UnifiedTaskRenderer] Found QUESTION widget:', questionWidget);
      if (questionWidget && config?.annotationQuestions) {
        console.log('[UnifiedTaskRenderer] Using annotationQuestions:', config.annotationQuestions);
        return config.annotationQuestions.map(normalizeLegacyQuestion);
      }
      
      // Otherwise, derive questions from individual question widgets
      return widgets
        .filter((w: any) => QUESTION_WIDGET_TYPES.has(w.type) && w.type !== 'QUESTION' && !w.hidden)
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
        .map(widgetToQuestion);
    }
    // Fallback to flat annotationQuestions from backend
    console.log('[UnifiedTaskRenderer] Fallback to annotationQuestions:', config?.annotationQuestions);
    return (config?.annotationQuestions || []).map(normalizeLegacyQuestion);
  }, [config]);

  // Instruction text widgets to display in the questions panel
  const instructions: InstructionItem[] = useMemo(() => {
    const uiConfig = config?.uiConfiguration as any;
    const widgets = uiConfig?.widgets || uiConfig?.configuration?.widgets;
    if (!Array.isArray(widgets)) return [];
    return widgets
      .filter((w: any) => w.type === 'INSTRUCTION_TEXT' && !w.hidden)
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
      .map((w: any) => ({
        id: w.id,
        content: w.content || '',
        variant: (w.variant as InstructionItem['variant']) || 'info',
        order: w.order ?? 0,
      }));
  }, [config]);

  // Derive visible widgets in order (for layout rendering)
  const visibleWidgets = useMemo(() => {
    const uiConfig = config?.uiConfiguration as any;
    const widgets = uiConfig?.widgets || uiConfig?.configuration?.widgets;
    if (!Array.isArray(widgets)) return [];
    const visible = widgets
      .filter((w: any) => !w.hidden)
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
    console.log('[UnifiedTaskRenderer] Visible widgets:', visible);
    return visible;
  }, [config]);

  // Extract layout configuration
  const layout = useMemo(() => {
    const uiConfig = config?.uiConfiguration as any;
    const actualConfig = uiConfig?.configuration || uiConfig;
    const layoutConfig = {
      type: actualConfig?.layout?.type || 'flex-horizontal',
      gap: actualConfig?.layout?.gap || 16,
      columns: actualConfig?.layout?.columns || 2,
      maxWidth: actualConfig?.layout?.maxWidth || 1200,
    };
    console.log('[UnifiedTaskRenderer] Layout config:', layoutConfig);
    return layoutConfig;
  }, [config]);

  const handleQuestionResponse = useCallback((questionId: string, response: any) => {
    setFormData((prev) => ({ ...prev, [questionId]: response }));
    setAnsweredQuestions((prev) => {
      const next = new Set(prev);
      const empty = response === null || response === '' ||
        (Array.isArray(response) && response.length === 0) || response === undefined;
      if (!empty) next.add(questionId); else next.delete(questionId);
      return next;
    });
  }, []);

  // Run all active plugins for a question (called on blur / navigate away)
  const runPluginsForQuestion = useCallback(async (questionId: string) => {
    if (!config) return;
    const answer = formData[questionId];
    const isEmpty = answer === undefined || answer === null || answer === '' || (Array.isArray(answer) && answer.length === 0);
    if (isEmpty) return;

    const plugins: Plugin[] = (config as any).plugins ?? [];
    const activePlugins = plugins.filter(
      (p) => p.enabled && !p.isDraft && p.trigger === 'ON_BLUR' &&
        (p.questionBindings.length === 0 || p.questionBindings.includes(questionId)),
    );
    if (activePlugins.length === 0) return;

    setQuestionPluginState((prev) => ({
      ...prev,
      [questionId]: { status: 'running' },
    }));

    for (const plugin of activePlugins) {
      const question = questions.find((q) => q.id === questionId);
      try {
        const result = await pluginService.executePlugin(config.taskId, {
          pluginId: plugin.id,
          projectId: config.projectId,
          questionId,
          questionText: question?.text ?? '',
          questionType: question?.type ?? 'text',
          answerValue: answer,
        });

        setQuestionPluginState((prev) => ({
          ...prev,
          [questionId]: {
            status: result.result,
            message: result.message,
            behavior: result.onFailBehavior as PluginFailBehavior,
          },
        }));

        // HARD_BLOCK: clear the answer to force re-entry
        if (result.result === 'FAIL' && result.onFailBehavior === 'HARD_BLOCK') {
          setFormData((prev) => {
            const next = { ...prev };
            delete next[questionId];
            return next;
          });
          setAnsweredQuestions((prev) => {
            const next = new Set(prev);
            next.delete(questionId);
            return next;
          });
          break;
        }
      } catch {
        setQuestionPluginState((prev) => ({
          ...prev,
          [questionId]: { status: 'ERROR', message: 'Validation service unavailable' },
        }));
      }
    }

    // Auto-dismiss PASS after 2s
    setTimeout(() => {
      setQuestionPluginState((prev) => {
        if (prev[questionId]?.status === 'PASS') {
          const next = { ...prev };
          delete next[questionId];
          return next;
        }
        return prev;
      });
    }, 2000);
  }, [config, formData, questions]);

  const currentQuestion = questions[currentQuestionIdx];
  const isFirst = currentQuestionIdx === 0;
  const isLast = currentQuestionIdx === questions.length - 1;
  const currentValue = currentQuestion ? formData[currentQuestion.id] : undefined;
  const isCurrentAnswered = currentQuestion ? answeredQuestions.has(currentQuestion.id) : false;
  const canProceed = !currentQuestion?.required || isCurrentAnswered;

  // Derive render mode from UI configuration
  const renderMode: 'paginated' | 'all' = (config?.uiConfiguration as any)?.renderMode || 'paginated';

  const handleNext = () => {
    if (currentQuestion) runPluginsForQuestion(currentQuestion.id);
    if (!isLast) setCurrentQuestionIdx((i) => i + 1);
  };
  const handlePrev = () => {
    if (currentQuestion) runPluginsForQuestion(currentQuestion.id);
    if (!isFirst) setCurrentQuestionIdx((i) => i - 1);
  };

  const validateAnnotationForm = (): boolean => {
    const required = questions.filter((q) => q.required !== false);
    for (const q of required) {
      const v = formData[q.id];
      const empty = v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
      if (empty) {
        alert(`Please answer: ${q.text}`);
        const idx = questions.findIndex((x) => x.id === q.id);
        if (idx !== -1) setCurrentQuestionIdx(idx);
        return false;
      }
    }
    return true;
  };

  const handleSubmitAnnotation = async () => {
    if (!validateAnnotationForm()) return;

    // Plugin submit guard
    for (const [questionId, ps] of Object.entries(questionPluginState)) {
      if (ps.status === 'running') {
        alert('A validation is still running. Please wait.');
        return;
      }
      if (ps.status === 'FAIL' && ps.behavior === 'HARD_BLOCK') {
        const idx = questions.findIndex((q) => q.id === questionId);
        if (idx !== -1) setCurrentQuestionIdx(idx);
        alert('Please correct the answer flagged as invalid before submitting.');
        return;
      }
      if (ps.status === 'WARN' && !ps.acknowledged) {
        const idx = questions.findIndex((q) => q.id === questionId);
        if (idx !== -1) setCurrentQuestionIdx(idx);
        alert('Please acknowledge all warnings before submitting.');
        return;
      }
      if (ps.status === 'FAIL' && ps.behavior === 'SOFT_WARN' && !ps.overrideReason?.trim()) {
        const idx = questions.findIndex((q) => q.id === questionId);
        if (idx !== -1) setCurrentQuestionIdx(idx);
        alert('Please provide an override reason for all failed validations before submitting.');
        return;
      }
    }
    try {
      setSubmitting(true);

      // Submit to annotation-qa-service: records annotation + triggers gold comparison & quality rules
      try {
        const qaRecord = await annotationQaService.submitAnnotation(taskId, {
          annotationData: formData,
          timeSpent: elapsedSeconds,
          isDraft: false,
        });
        setAnnotationQaRecord(qaRecord);
      } catch (qaErr) {
        // QA pipeline failure is non-blocking — log and continue
        console.warn('Annotation QA service unavailable:', qaErr);
      }

      // Submit to task rendering service (updates workflow engine state)
      const annotationData: SaveAnnotationDto = {
        responses: Object.entries(formData).map(([questionId, response]) => ({ questionId, response })),
        timeSpent: elapsedSeconds,
      };
      await taskRenderingService.saveAnnotation(taskId, userId, annotationData);

      setSubmitted(true);
    } catch (err: any) {
      alert(err.message || 'Failed to save annotation');
    } finally {
      setSubmitting(false);
    }
  };

  // Review state
  const [reviewDecision, setReviewDecision] = useState<'approved' | 'rejected' | 'needs_revision' | null>(null);
  const [reviewComments, setReviewComments] = useState('');
  const [qualityScore, setQualityScore] = useState<number>(0);

  const handleSubmitReview = async (decision: 'approved' | 'rejected' | 'needs_revision') => {
    try {
      setSubmitting(true);

      const decisionMap = {
        approved: 'APPROVE',
        rejected: 'REJECT',
        needs_revision: 'REQUEST_REVISION',
      } as const;

      // Submit to annotation-qa-service: records reviewer score + triggers state decision
      const annotationId = config?.previousAnnotations?.[0]?.id;
      if (annotationId) {
        try {
          await annotationQaService.submitReview(taskId, {
            annotationId,
            score: qualityScore,
            decision: decisionMap[decision],
            feedback: reviewComments || undefined,
            timeSpent: elapsedSeconds,
          });
        } catch (qaErr) {
          console.warn('Annotation QA review service unavailable:', qaErr);
        }
      }

      // Submit to task rendering service (updates workflow engine state)
      const reviewData: SaveReviewDto = {
        decision,
        comments: reviewComments || undefined,
        qualityScore: qualityScore || undefined,
        timeSpent: elapsedSeconds,
      };
      await taskRenderingService.saveReview(taskId, userId, reviewData);

      setReviewDecision(decision);
      setSubmitted(true);
    } catch (err: any) {
      alert(err.message || 'Failed to save review');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-gray-600 font-medium">Loading task...</p>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !config) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={40} />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Task</h3>
          <p className="text-red-700 mb-5 text-sm">{error || 'Task configuration not found'}</p>
          <button
            className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // ── Submitted ──────────────────────────────────────────────────────────────
  if (submitted) {
    const qcResult = annotationQaRecord?.qcResult;
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <div className="text-center max-w-md w-full">
          <CheckCircle className="text-green-500 mx-auto mb-4" size={56} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {viewType === 'annotator' ? 'Annotation Submitted!' : `Review ${reviewDecision?.replace('_', ' ')}!`}
          </h2>
          <p className="text-gray-600 mb-5">
            {viewType === 'annotator'
              ? 'Your annotation has been saved successfully.'
              : 'Your review decision has been recorded.'}
          </p>

          {/* Auto-QC result panel (annotator view only) */}
          {viewType === 'annotator' && qcResult && (
            <div className={`rounded-xl border p-4 mb-5 text-left ${
              qcResult.passed ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                {qcResult.passed
                  ? <CheckCircle size={18} className="text-green-600" />
                  : <AlertCircle size={18} className="text-amber-600" />}
                <span className={`font-semibold text-sm ${qcResult.passed ? 'text-green-800' : 'text-amber-800'}`}>
                  Auto Quality Check: {qcResult.passed ? 'Passed' : 'Needs Review'}
                </span>
                <span className={`ml-auto text-sm font-bold ${qcResult.passed ? 'text-green-700' : 'text-amber-700'}`}>
                  {Math.round(qcResult.overallScore * 100)}%
                </span>
              </div>
              {qcResult.goldComparisonScore !== undefined && (
                <p className="text-xs text-gray-600 mb-2">
                  Gold standard similarity: <strong>{Math.round(qcResult.goldComparisonScore * 100)}%</strong>
                </p>
              )}
              {qcResult.checks.length > 0 && (
                <div className="space-y-1">
                  {qcResult.checks.map((check: QcCheckResult, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {check.passed
                        ? <CheckCircle size={12} className="text-green-500 flex-shrink-0" />
                        : <AlertCircle size={12} className={`flex-shrink-0 ${check.severity === 'ERROR' ? 'text-red-500' : 'text-amber-500'}`} />}
                      <span className="text-gray-700">{check.ruleName}</span>
                      {check.message && <span className="text-gray-400 ml-auto truncate max-w-[120px]">{check.message}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              onClick={() => navigate(viewType === 'annotator' ? '/annotate/queue' : '/review/queue')}
            >
              Next Task
            </button>
            <button
              className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              onClick={() => navigate(-1)}
            >
              Back to Queue
            </button>
          </div>
        </div>
      </div>
    );
  }

  const fileUrl = config.taskData?.fileUrls?.[0];

  // ── Widget renderer helper ──
  const renderWidgetByType = (widget: any) => {
    switch (widget.type) {
      case 'FILE_VIEWER':
        return (
          <div key={widget.id} className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ 
            width: widget.sizePreset === 'full-width' ? '100%' : `${widget.size?.width || 800}px`,
            height: `${widget.size?.height || 600}px`,
          }}>
            {fileUrl ? (
              <FileViewer
                fileUrl={fileUrl}
                fileType={config.taskData?.fileType}
                metadata={config.taskData?.fileMetadata}
                width={widget.size?.width || 800}
                height={widget.size?.height || 600}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <FileText size={40} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No media file</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'TEXTAREA':
        const textareaValue = formData[widget.id] || widget.placeholder || '';
        return (
          <div key={widget.id} className="bg-white rounded-lg shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {widget.label}
            </label>
            <textarea
              value={textareaValue}
              onChange={(e) => setFormData({ ...formData, [widget.id]: e.target.value })}
              placeholder={widget.placeholder}
              rows={widget.rows || 4}
              disabled={widget.disabled || true}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        );

      case 'INSTRUCTION_TEXT':
        const instruction = instructions.find(i => i.id === widget.id);
        return instruction ? (
          <div key={widget.id}>
            <InstructionBanner item={instruction} />
          </div>
        ) : null;

      case 'QUESTION':
        // Render the question interface at this widget's position
        return renderQuestionInterface(widget);

      default:
        return null;
    }
  };

  // ── Question interface renderer ──
  const renderQuestionInterface = (widget: any) => {
    if (questions.length === 0) {
      return (
        <div key={widget.id} className="bg-white rounded-lg shadow-sm p-12">
          <div className="text-center text-gray-400">
            <FileText size={40} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">No questions configured</p>
            <p className="text-xs mt-1">This task has no questions to answer.</p>
          </div>
        </div>
      );
    }

    return (
      <div key={widget.id} className="bg-white rounded-lg shadow-sm">
        {renderMode === 'paginated' ? (
          <div className="flex flex-col">
            {/* Progress bar */}
            <div className="bg-white border-b border-gray-200 px-6 py-3">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                <span className="font-medium">
                  Question {currentQuestionIdx + 1} of {questions.length}
                </span>
                <span>{Math.round(((currentQuestionIdx + 1) / questions.length) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIdx + 1) / questions.length) * 100}%` }}
                />
              </div>
              {/* Question navigation dots */}
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {questions.map((q, i) => {
                  const ps = questionPluginState[q.id];
                  const hasFail = ps?.status === 'FAIL';
                  const hasWarn = ps?.status === 'WARN' && !ps.acknowledged;
                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        if (currentQuestion) runPluginsForQuestion(currentQuestion.id);
                        setCurrentQuestionIdx(i);
                      }}
                      className={`w-6 h-6 rounded-full text-xs font-semibold transition-all ${
                        i === currentQuestionIdx
                          ? 'bg-blue-600 text-white scale-110 shadow-sm'
                          : hasFail
                          ? 'bg-red-500 text-white'
                          : hasWarn
                          ? 'bg-amber-400 text-white'
                          : answeredQuestions.has(q.id)
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                      }`}
                      title={`Q${i + 1}: ${q.text}`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current question */}
            <div className="p-6">
              {currentQuestion && (
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                  <div className="mb-5">
                    <div className="flex items-start gap-2 mb-1">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex-shrink-0 mt-0.5">
                        {currentQuestionIdx + 1}
                      </span>
                      <h3 className="text-base font-semibold text-gray-900 leading-snug">
                        {currentQuestion.text}
                        {currentQuestion.required !== false && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </h3>
                    </div>
                    {currentQuestion.description && (
                      <p className="text-sm text-gray-500 mt-1.5 ml-8">
                        {currentQuestion.description}
                      </p>
                    )}
                  </div>
                  <div className="ml-8">
                    <QuestionWidget
                      question={currentQuestion}
                      value={currentValue}
                      onChange={(v) => handleQuestionResponse(currentQuestion.id, v)}
                      disabled={questionPluginState[currentQuestion.id]?.status === 'running'}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
              <button
                onClick={handlePrev}
                disabled={isFirst}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={18} /> Previous
              </button>

              <div className="text-sm">
                {isCurrentAnswered ? (
                  <span className="text-green-600 font-medium flex items-center gap-1">
                    <CheckCircle size={14} /> Answered
                  </span>
                ) : currentQuestion?.required !== false ? (
                  <span className="text-amber-600 text-xs font-medium">Required</span>
                ) : (
                  <span className="text-gray-400 text-xs">Optional</span>
                )}
              </div>

              {isLast ? (
                <button
                  onClick={handleSubmitAnnotation}
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-60 transition shadow-sm"
                >
                  {submitting ? (
                    <><Loader2 className="animate-spin" size={16} /> Submitting...</>
                  ) : (
                    <><Send size={16} /> Submit Annotation</>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={!canProceed}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next <ChevronRight size={18} />
                </button>
              )}
            </div>
          </div>
        ) : (
          // All-at-once mode
          <div className="p-6 space-y-4">
            {questions.map((q, i) => {
              const qValue = formData[q.id];
              const ps = questionPluginState[q.id];
              return (
                <div key={q.id} className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                  <div className="mb-5">
                    <div className="flex items-start gap-2 mb-1">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <h3 className="text-base font-semibold text-gray-900 leading-snug">
                        {q.text}
                        {q.required !== false && <span className="text-red-500 ml-1">*</span>}
                      </h3>
                    </div>
                    {q.description && (
                      <p className="text-sm text-gray-500 mt-1.5 ml-8">{q.description}</p>
                    )}
                  </div>
                  <div className="ml-8">
                    <QuestionWidget
                      question={q}
                      value={qValue}
                      onChange={(v) => handleQuestionResponse(q.id, v)}
                      disabled={ps?.status === 'running'}
                    />
                  </div>
                </div>
              );
            })}
            {/* Submit button for all-at-once mode */}
            <div className="pt-4">
              <button
                onClick={handleSubmitAnnotation}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-60 transition shadow-sm"
              >
                {submitting ? (
                  <><Loader2 className="animate-spin" size={16} /> Submitting...</>
                ) : (
                  <><Send size={16} /> Submit Annotation</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // ANNOTATOR VIEW
  // ══════════════════════════════════════════════════════════════════════════
  if (viewType === 'annotator') {
    const containerStyle = layout.type === 'flex-vertical'
      ? { display: 'flex', flexDirection: 'column' as const, gap: `${layout.gap}px`, maxWidth: `${layout.maxWidth}px`, margin: '0 auto' }
      : { display: 'grid', gridTemplateColumns: `repeat(${layout.columns}, 1fr)`, gap: `${layout.gap}px`, maxWidth: `${layout.maxWidth}px`, margin: '0 auto' };

    return (
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="font-bold text-gray-900 text-sm">
                {config.taskData?.name || `Task ${config.taskId}`}
              </h1>
              <p className="text-xs text-gray-500">ID: {config.taskId}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
              <Clock size={14} />
              <span className="font-mono font-medium">{formatTime(elapsedSeconds)}</span>
            </div>
            <div className="text-sm text-gray-500">
              {answeredQuestions.size}/{questions.length} answered
            </div>
          </div>
        </div>

        {/* Dynamic layout based on configuration */}
        <div className="flex-1 overflow-y-auto p-6">
          <div style={containerStyle}>
            {/* Render all widgets in order (including QUESTION widget at its position) */}
            {visibleWidgets.map(widget => renderWidgetByType(widget))}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // REVIEWER VIEW
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="font-bold text-gray-900 text-sm">
              {config.taskData?.name || `Task ${config.taskId}`} — Review
            </h1>
            <p className="text-xs text-gray-500">
              Review level {config.taskData?.currentReviewLevel || 1}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
            <Clock size={14} />
            <span className="font-mono font-medium">{formatTime(elapsedSeconds)}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Media (fixed) */}
        <div className="w-2/5 border-r border-gray-200 bg-white flex flex-col overflow-hidden flex-shrink-0">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <span className="text-sm font-semibold text-gray-700">Task Media</span>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {fileUrl ? (
              <FileViewer 
                fileUrl={fileUrl} 
                fileType={config.taskData?.fileType}
                metadata={config.taskData?.fileMetadata}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <FileText size={40} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No media file</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Review panels */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Annotator responses */}
          <div className="p-4">
            <AnnotationReviewWidget
              annotations={config.previousAnnotations || []}
              questions={config.annotationQuestions}
            />
          </div>

          {/* Review form */}
          <div className="p-4 border-t border-gray-200 bg-white mx-4 mb-4 rounded-xl shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-4">Review Decision</h2>

            {/* Quality score */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Quality Score
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={qualityScore}
                  onChange={(e) => setQualityScore(parseInt(e.target.value))}
                  className="flex-1 accent-blue-600"
                />
                <span className={`w-12 text-center font-bold text-lg ${
                  qualityScore >= 80 ? 'text-green-600' : qualityScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>{qualityScore}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>Poor (0)</span>
                <span>Excellent (100)</span>
              </div>
            </div>

            {/* Comments */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Review Comments
              </label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                rows={3}
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                placeholder="Provide feedback on the annotation quality (optional)..."
              />
            </div>

            {/* Decision buttons */}
            <div className="flex gap-3">
              <button
                disabled={submitting}
                onClick={() => handleSubmitReview('approved')}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold text-sm transition flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                Approve
              </button>
              <button
                disabled={submitting}
                onClick={() => handleSubmitReview('needs_revision')}
                className="flex-1 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 font-semibold text-sm transition"
              >
                Needs Revision
              </button>
              <button
                disabled={submitting}
                onClick={() => handleSubmitReview('rejected')}
                className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold text-sm transition"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedTaskRenderer;
