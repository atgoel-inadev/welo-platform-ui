/**
 * ReviewSplitScreen Component
 *
 * Split-screen view for reviewers to compare gold answers vs annotator answers.
 *
 * Layout:
 * ┌─────────────────────────────────────────────────────┐
 * │  Header: Task info + Timer                          │
 * ├─────────────┬───────────────────────────────────────┤
 * │             │  ┌──────────────┬──────────────────┐  │
 * │  Media      │  │ Gold Answer  │ Annotator Answer  │  │
 * │  (Fixed)    │  │              │                   │  │
 * │             │  └──────────────┴──────────────────┘  │
 * │             │  Review Form + Decision                │
 * └─────────────┴───────────────────────────────────────┘
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Loader2, AlertCircle, CheckCircle, XCircle, Clock,
  ChevronLeft, FileText, Shield, User, Star, MessageSquare,
  ThumbsUp, ThumbsDown, RotateCcw, ChevronDown, ChevronRight,
} from 'lucide-react';
import { FileViewer } from '../FileViewer';
import { taskRenderingService, TaskRenderConfig, SaveReviewDto } from '../../services/taskRenderingService';

interface ReviewSplitScreenProps {
  taskId: string;
  userId: string;
}

interface QuestionScore {
  questionId: string;
  score: number; // 0-5
  note?: string;
}

interface Question {
  id: string;
  text: string;
  description?: string;
  type: string;
  options?: string[];
  required?: boolean;
}

interface Annotation {
  id: string;
  annotatorId: string;
  annotatorName: string;
  responses: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: string;
  isGold?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function formatValue(val: any): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (Array.isArray(val)) return val.join(', ');
  if (typeof val === 'object') return JSON.stringify(val, null, 2);
  return String(val);
}

/** Compute whether two values match */
function valuesMatch(a: any, b: any): boolean | null {
  if (a === undefined || a === null || b === undefined || b === null) return null;
  if (Array.isArray(a) && Array.isArray(b)) {
    return JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
  }
  return JSON.stringify(a) === JSON.stringify(b);
}

// ─── Answer Cell ─────────────────────────────────────────────────────────────
const AnswerCell: React.FC<{
  value: any;
  match?: boolean | null;
  isGold?: boolean;
}> = ({ value, match, isGold }) => {
  const formatted = formatValue(value);
  const isEmpty = value === null || value === undefined || value === '';
  const bgColor = isGold
    ? 'bg-amber-50 border-amber-200'
    : match === true
    ? 'bg-green-50 border-green-200'
    : match === false
    ? 'bg-red-50 border-red-200'
    : 'bg-white border-gray-200';

  return (
    <div className={`border rounded-lg p-3 text-sm leading-relaxed ${bgColor}`}>
      {isEmpty ? (
        <span className="text-gray-400 italic text-xs">Not answered</span>
      ) : (
        <span className={isGold ? 'text-amber-900' : 'text-gray-800'}>{formatted}</span>
      )}
      {match !== null && match !== undefined && !isGold && (
        <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${match ? 'text-green-600' : 'text-red-600'}`}>
          {match ? <CheckCircle size={12} /> : <XCircle size={12} />}
          {match ? 'Matches gold standard' : 'Differs from gold standard'}
        </div>
      )}
    </div>
  );
};

// ─── Star Score Input ─────────────────────────────────────────────────────────
const StarScoreInput: React.FC<{
  value: number;
  onChange: (v: number) => void;
  label?: string;
}> = ({ value, onChange, label }) => (
  <div>
    {label && <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>}
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(value === i ? 0 : i)}
          className={`transition-colors ${i <= value ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`}
        >
          <Star size={20} fill={i <= value ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  </div>
);

// ─── Question Comparison Row ──────────────────────────────────────────────────
const QuestionComparisonRow: React.FC<{
  question: Question;
  goldAnswer: any;
  annotatorAnswer: any;
  score: QuestionScore | undefined;
  onScoreChange: (score: QuestionScore) => void;
  expanded: boolean;
  onToggle: () => void;
  index: number;
}> = ({ question, goldAnswer, annotatorAnswer, score, onScoreChange, expanded, onToggle, index }) => {
  const match = goldAnswer !== undefined ? valuesMatch(goldAnswer, annotatorAnswer) : null;

  return (
    <div className={`border rounded-xl overflow-hidden ${
      match === false ? 'border-red-200' : match === true ? 'border-green-200' : 'border-gray-200'
    }`}>
      {/* Row header */}
      <button
        className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition ${
          match === false ? 'bg-red-50' : match === true ? 'bg-green-50' : 'bg-gray-50'
        }`}
        onClick={onToggle}
      >
        <span className="w-6 h-6 rounded-full bg-gray-700 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
          {index + 1}
        </span>
        <span className="flex-1 text-sm font-medium text-gray-800 text-left line-clamp-1">
          {question.text}
          {question.required !== false && <span className="text-red-500 ml-1">*</span>}
        </span>
        <div className="flex items-center gap-2 flex-shrink-0">
          {match === true && <CheckCircle size={16} className="text-green-500" />}
          {match === false && <XCircle size={16} className="text-red-500" />}
          {score && score.score > 0 && (
            <span className="text-xs text-yellow-500 font-medium">{score.score}/5 ★</span>
          )}
          {expanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="bg-white">
          <div className="grid grid-cols-2 divide-x divide-gray-100">
            {/* Gold answer */}
            <div className="p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Shield size={12} className="text-amber-500" />
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Gold Standard</span>
              </div>
              <AnswerCell value={goldAnswer} isGold={true} />
            </div>

            {/* Annotator answer */}
            <div className="p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <User size={12} className="text-blue-500" />
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Annotator Answer</span>
              </div>
              <AnswerCell value={annotatorAnswer} match={goldAnswer !== undefined ? match : undefined} />
            </div>
          </div>

          {/* Per-question score */}
          <div className="px-4 pb-4 border-t border-gray-100 pt-3 flex items-center gap-6">
            <StarScoreInput
              value={score?.score || 0}
              onChange={(v) => onScoreChange({ questionId: question.id, score: v, note: score?.note })}
              label="Question Score"
            />
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Note (optional)</label>
              <input
                type="text"
                value={score?.note || ''}
                onChange={(e) => onScoreChange({ questionId: question.id, score: score?.score || 0, note: e.target.value })}
                placeholder="Add a note about this answer..."
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ReviewSplitScreen: React.FC<ReviewSplitScreenProps> = ({ taskId, userId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<TaskRenderConfig | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitDecision, setSubmitDecision] = useState<string>('');

  // Review form state
  const [questionScores, setQuestionScores] = useState<Record<string, QuestionScore>>({});
  const [overallScore, setOverallScore] = useState(0);
  const [comments, setComments] = useState('');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  // Timer
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    loadConfig();
  }, [taskId]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const cfg = await taskRenderingService.getTaskRenderConfig(taskId, userId);
      setConfig(cfg);

      // Expand all questions by default
      const questions = cfg.annotationQuestions || [];
      setExpandedQuestions(new Set(questions.map((q: Question) => q.id)));
    } catch (err: any) {
      setError(err.message || 'Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (score: QuestionScore) => {
    setQuestionScores((prev) => ({ ...prev, [score.questionId]: score }));
  };

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const handleSubmitReview = async (decision: 'approved' | 'rejected' | 'needs_revision') => {
    try {
      setSubmitting(true);

      // Compute quality score from individual scores if overall not set
      const scoredCount = Object.values(questionScores).filter((s) => s.score > 0).length;
      const avgScore = scoredCount > 0
        ? Math.round(
            (Object.values(questionScores).reduce((acc, s) => acc + s.score, 0) / scoredCount) * 20
          )
        : overallScore;

      const reviewData: SaveReviewDto = {
        decision,
        comments: comments || undefined,
        qualityScore: avgScore || overallScore || undefined,
        extraWidgetData: {
          questionScores,
          timeSpentSeconds: elapsed,
          reviewedAt: new Date().toISOString(),
        },
      };

      await taskRenderingService.saveReview(taskId, userId, reviewData);
      setSubmitDecision(decision);
      setSubmitted(true);
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-gray-600 font-medium">Loading review...</p>
        </div>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error || !config) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={40} />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Review</h3>
          <p className="text-red-700 mb-5 text-sm">{error}</p>
          <button className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // ── Submitted ────────────────────────────────────────────────────────────────
  if (submitted) {
    const isApproved = submitDecision === 'approved';
    const isRejected = submitDecision === 'rejected';
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isApproved ? 'bg-green-100' : isRejected ? 'bg-red-100' : 'bg-amber-100'
          }`}>
            {isApproved ? (
              <ThumbsUp size={36} className="text-green-600" />
            ) : isRejected ? (
              <ThumbsDown size={36} className="text-red-600" />
            ) : (
              <RotateCcw size={36} className="text-amber-600" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Submitted</h2>
          <p className="text-gray-600 mb-2 capitalize">Decision: <strong>{submitDecision.replace('_', ' ')}</strong></p>
          {overallScore > 0 && <p className="text-gray-500 text-sm mb-6">Quality Score: {overallScore}/100</p>}
          <div className="flex gap-3 justify-center">
            <button className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium" onClick={() => navigate('/reviewer/queue')}>
              Next Review
            </button>
            <button className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium" onClick={() => navigate(-1)}>
              Back to Queue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main View ────────────────────────────────────────────────────────────────
  const questions: Question[] = config.annotationQuestions || [];
  const annotations: Annotation[] = config.previousAnnotations || [];
  const goldAnnotation = annotations.find((a) => a.isGold) || null;
  const annotatorAnnotations = annotations.filter((a) => !a.isGold);
  const primaryAnnotation = annotatorAnnotations[0] || null;
  const fileUrl = config.taskData?.fileUrls?.[0];

  // Compute match stats
  let matchCount = 0, mismatchCount = 0;
  if (goldAnnotation && primaryAnnotation) {
    questions.forEach((q) => {
      const m = valuesMatch(goldAnnotation.responses?.[q.id], primaryAnnotation.responses?.[q.id]);
      if (m === true) matchCount++;
      else if (m === false) mismatchCount++;
    });
  }

  const scoredQuestions = Object.values(questionScores).filter((s) => s.score > 0).length;
  const avgQuestionScore = scoredQuestions > 0
    ? (Object.values(questionScores).reduce((a, s) => a + s.score, 0) / scoredQuestions).toFixed(1)
    : null;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="font-bold text-gray-900 text-sm">
              {config.taskData?.name || `Task ${config.taskId}`}
              <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                Review L{config.taskData?.currentReviewLevel || 1}
              </span>
            </h1>
            <p className="text-xs text-gray-500">ID: {config.taskId}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Match stats */}
          {goldAnnotation && (
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-green-600 font-medium">
                <CheckCircle size={12} /> {matchCount} match
              </span>
              <span className="flex items-center gap-1 text-red-600 font-medium">
                <XCircle size={12} /> {mismatchCount} differ
              </span>
            </div>
          )}
          {avgQuestionScore && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-medium">
              Avg: {avgQuestionScore}/5 ★
            </span>
          )}
          <div className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
            <Clock size={14} />
            <span className="font-mono font-medium">{formatTime(elapsed)}</span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT: Fixed media ── */}
        <div className="w-2/5 border-r border-gray-200 bg-white flex flex-col flex-shrink-0 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">Task Media</span>
              </div>
              {config.taskData?.status && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
                  {config.taskData.status}
                </span>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {fileUrl ? (
              <FileViewer fileUrl={fileUrl} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <FileText size={40} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No media file attached</p>
                </div>
              </div>
            )}
          </div>

          {/* Annotator info card */}
          {primaryAnnotation && (
            <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 flex-shrink-0">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <User size={12} />
                <span className="font-medium">{primaryAnnotation.annotatorName || 'Annotator'}</span>
                <span>·</span>
                <span>{formatTimestamp(primaryAnnotation.createdAt)}</span>
              </div>
              {annotations.length > 1 && (
                <p className="text-xs text-gray-400 mt-0.5">{annotations.length} annotation{annotations.length > 1 ? 's' : ''} total</p>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT: Comparison + Review form ── */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* ── Split header ── */}
          {questions.length > 0 && (
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-2">
              <div className="grid grid-cols-2 divide-x divide-gray-200 text-center text-xs font-semibold uppercase tracking-wide">
                <div className="px-4 py-1 flex items-center justify-center gap-1.5 text-amber-600">
                  <Shield size={12} /> Gold Standard Answer
                </div>
                <div className="px-4 py-1 flex items-center justify-center gap-1.5 text-blue-600">
                  <User size={12} /> Annotator Answer
                </div>
              </div>
            </div>
          )}

          {/* ── Question comparison ── */}
          <div className="p-4 space-y-3 flex-1">
            {questions.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                <p>No questions configured for this task.</p>
              </div>
            ) : (
              questions.map((question, i) => (
                <QuestionComparisonRow
                  key={question.id}
                  question={question}
                  goldAnswer={goldAnnotation?.responses?.[question.id]}
                  annotatorAnswer={primaryAnnotation?.responses?.[question.id]}
                  score={questionScores[question.id]}
                  onScoreChange={handleScoreChange}
                  expanded={expandedQuestions.has(question.id)}
                  onToggle={() => toggleQuestion(question.id)}
                  index={i}
                />
              ))
            )}

            {/* No annotations yet */}
            {annotations.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                <AlertCircle className="text-yellow-500 mx-auto mb-2" size={28} />
                <p className="text-yellow-800 font-medium">No annotations submitted yet</p>
                <p className="text-yellow-600 text-sm mt-1">This task has not been annotated yet.</p>
              </div>
            )}
          </div>

          {/* ── Review Decision Form ── */}
          <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4 shadow-lg">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare size={16} className="text-blue-600" />
              Review Decision
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Overall quality score */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Overall Quality Score</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={overallScore}
                    onChange={(e) => setOverallScore(parseInt(e.target.value))}
                    className="flex-1 accent-blue-600"
                  />
                  <span className={`w-10 text-center font-bold text-base ${
                    overallScore >= 80 ? 'text-green-600' : overallScore >= 60 ? 'text-yellow-600' : overallScore > 0 ? 'text-red-600' : 'text-gray-400'
                  }`}>{overallScore}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>Poor</span>
                  <span>Excellent</span>
                </div>
                {avgQuestionScore && (
                  <p className="text-xs text-gray-500 mt-1">
                    Per-question avg: <strong>{avgQuestionScore}/5</strong>
                    {' '}({scoredQuestions}/{questions.length} scored)
                  </p>
                )}
              </div>

              {/* Comments */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Review Comments</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Provide specific feedback for the annotator..."
                />
              </div>
            </div>

            {/* Decision buttons */}
            <div className="flex gap-3">
              <button
                disabled={submitting}
                onClick={() => handleSubmitReview('approved')}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 font-bold text-sm transition flex items-center justify-center gap-2 shadow-sm"
              >
                {submitting ? <Loader2 className="animate-spin" size={16} /> : <ThumbsUp size={16} />}
                Approve
              </button>
              <button
                disabled={submitting}
                onClick={() => handleSubmitReview('needs_revision')}
                className="flex-1 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50 font-bold text-sm transition flex items-center justify-center gap-2 shadow-sm"
              >
                <RotateCcw size={16} /> Needs Revision
              </button>
              <button
                disabled={submitting}
                onClick={() => handleSubmitReview('rejected')}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 font-bold text-sm transition flex items-center justify-center gap-2 shadow-sm"
              >
                <ThumbsDown size={16} /> Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewSplitScreen;
