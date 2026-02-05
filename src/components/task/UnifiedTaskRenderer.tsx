import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Save, Send } from 'lucide-react';
import FileViewer from '../FileViewer';
import AnnotationReviewWidget from './AnnotationReviewWidget';
import { 
  taskRenderingService, 
  TaskRenderConfig,
  SaveAnnotationDto,
  SaveReviewDto 
} from '../../services/taskRenderingService';

interface UnifiedTaskRendererProps {
  taskId: string;
  viewType: 'annotator' | 'reviewer';
  userId: string; // TODO: Get from auth context
}

/**
 * UnifiedTaskRenderer
 * 
 * Universal component for rendering both annotator and reviewer views
 * Dynamically loads configuration from backend and renders appropriate UI
 * 
 * Features:
 * - Loads task render configuration dynamically
 * - Renders mandatory widgets (FILE_VIEWER + QUESTIONS or ANNOTATION_REVIEW)
 * - Renders extra configured widgets
 * - Handles form submission to appropriate endpoint
 * - Separates business data from configured data
 */
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
  const [extraWidgetData, setExtraWidgetData] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  // Load task render configuration
  useEffect(() => {
    loadTaskConfig();
  }, [taskId, userId]);

  const loadTaskConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const renderConfig = await taskRenderingService.getTaskRenderConfig(taskId, userId);
      setConfig(renderConfig);

      // Pre-fill form data with existing responses (for editing)
      if (renderConfig.annotationResponses) {
        const existingResponses: Record<string, any> = {};
        renderConfig.annotationResponses.forEach((ar: any) => {
          existingResponses[ar.questionId] = ar.response;
        });
        setFormData(existingResponses);
      }

      // Pre-fill extra widget data
      if (renderConfig.extraWidgetData) {
        setExtraWidgetData(renderConfig.extraWidgetData);
      }
    } catch (err: any) {
      console.error('Failed to load task config:', err);
      setError(err.message || 'Failed to load task configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionResponse = (questionId: string, response: any) => {
    setFormData((prev) => ({
      ...prev,
      [questionId]: response,
    }));
  };

  const handleExtraWidgetChange = (widgetId: string, data: any) => {
    setExtraWidgetData((prev) => ({
      ...prev,
      [widgetId]: data,
    }));
  };

  const validateAnnotationForm = (): boolean => {
    if (!config) return false;

    // Check all required questions are answered
    const requiredQuestions = config.annotationQuestions.filter(
      (q: any) => q.required !== false,
    );

    for (const question of requiredQuestions) {
      if (!formData[question.id] || formData[question.id] === '') {
        alert(`Please answer the required question: ${question.text}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmitAnnotation = async () => {
    if (!validateAnnotationForm()) return;

    try {
      setSubmitting(true);

      // Prepare annotation data
      const annotationData: SaveAnnotationDto = {
        responses: Object.entries(formData).map(([questionId, response]) => ({
          questionId,
          response,
        })),
        extraWidgetData: Object.keys(extraWidgetData).length > 0 ? extraWidgetData : undefined,
      };

      await taskRenderingService.saveAnnotation(taskId, userId, annotationData);

      alert('Annotation saved successfully!');
      navigate('/annotator/tasks'); // Navigate back to task list
    } catch (err: any) {
      console.error('Failed to save annotation:', err);
      alert(err.message || 'Failed to save annotation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReview = async (decision: 'approved' | 'rejected' | 'needs_revision') => {
    try {
      setSubmitting(true);

      // Prepare review data
      const reviewData: SaveReviewDto = {
        decision,
        comments: formData.comments || undefined,
        qualityScore: formData.qualityScore || undefined,
        extraWidgetData: Object.keys(extraWidgetData).length > 0 ? extraWidgetData : undefined,
      };

      await taskRenderingService.saveReview(taskId, userId, reviewData);

      alert(`Review submitted: ${decision}`);
      navigate('/reviewer/tasks'); // Navigate back to task list
    } catch (err: any) {
      console.error('Failed to save review:', err);
      alert(err.message || 'Failed to save review');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestionWidget = (question: any) => {
    const value = formData[question.id] || '';

    switch (question.type) {
      case 'text':
        return (
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            value={value}
            onChange={(e) => handleQuestionResponse(question.id, e.target.value)}
            placeholder="Enter your response..."
          />
        );

      case 'single_select':
        return (
          <select
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={value}
            onChange={(e) => handleQuestionResponse(question.id, e.target.value)}
          >
            <option value="">-- Select an option --</option>
            {question.options?.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'multi_select':
        return (
          <div className="space-y-2">
            {question.options?.map((option: string) => (
              <label key={option} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 rounded"
                  checked={(value as string[])?.includes(option) || false}
                  onChange={(e) => {
                    const currentValues = (value as string[]) || [];
                    const newValues = e.target.checked
                      ? [...currentValues, option]
                      : currentValues.filter((v) => v !== option);
                    handleQuestionResponse(question.id, newValues);
                  }}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      case 'rating':
        return (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                  value === rating
                    ? 'border-blue-600 bg-blue-100 text-blue-700'
                    : 'border-gray-300 hover:border-blue-300'
                }`}
                onClick={() => handleQuestionResponse(question.id, rating)}
              >
                {rating}
              </button>
            ))}
          </div>
        );

      case 'boolean':
        return (
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name={question.id}
                checked={value === true}
                onChange={() => handleQuestionResponse(question.id, true)}
              />
              <span>Yes</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name={question.id}
                checked={value === false}
                onChange={() => handleQuestionResponse(question.id, false)}
              />
              <span>No</span>
            </label>
          </div>
        );

      default:
        return (
          <input
            type="text"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={value}
            onChange={(e) => handleQuestionResponse(question.id, e.target.value)}
          />
        );
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-gray-600">Loading task...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !config) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="text-red-600" size={24} />
            <h3 className="text-lg font-semibold text-red-900">Error Loading Task</h3>
          </div>
          <p className="text-red-700 mb-4">{error || 'Failed to load task configuration'}</p>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="unified-task-renderer max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{config.taskData.name}</h1>
        {config.taskData.description && (
          <p className="text-gray-600">{config.taskData.description}</p>
        )}
        <div className="flex gap-4 mt-2 text-sm text-gray-500">
          <span>Task ID: {config.taskId}</span>
          <span>Status: {config.taskData.status}</span>
          <span>View: {viewType}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: File Viewer (Mandatory) */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Task Files</h2>
            <FileViewer files={config.taskData.fileUrls} />
          </div>

          {/* Extra widgets in left column (if configured) */}
          {/* TODO: Render extra widgets based on layout configuration */}
        </div>

        {/* Right Column: Questions or Review */}
        <div className="space-y-6">
          {viewType === 'annotator' ? (
            /* Annotator View: Questions Widget (Mandatory) */
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Annotation Questions</h2>
              <div className="space-y-6">
                {config.annotationQuestions.map((question: any) => (
                  <div key={question.id} className="space-y-2">
                    <label className="block font-medium text-gray-700">
                      {question.text}
                      {question.required !== false && (
                        <span className="text-red-600 ml-1">*</span>
                      )}
                    </label>
                    {question.description && (
                      <p className="text-sm text-gray-500">{question.description}</p>
                    )}
                    {renderQuestionWidget(question)}
                  </div>
                ))}
              </div>

              {/* Submit Button */}
              <div className="mt-6 pt-6 border-t">
                <button
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSubmitAnnotation}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Submit Annotation
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Reviewer View: Annotation Review Widget (Mandatory) + Review Form */
            <>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <AnnotationReviewWidget
                  annotations={config.previousAnnotations || []}
                  questions={config.annotationQuestions}
                />
              </div>

              {/* Review Decision Form */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">Review Decision</h2>

                <div className="space-y-4">
                  {/* Quality Score */}
                  <div>
                    <label className="block font-medium text-gray-700 mb-2">
                      Quality Score (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={formData.qualityScore || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          qualityScore: parseInt(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>

                  {/* Comments */}
                  <div>
                    <label className="block font-medium text-gray-700 mb-2">
                      Review Comments
                    </label>
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={4}
                      value={formData.comments || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          comments: e.target.value,
                        }))
                      }
                      placeholder="Provide feedback on the annotation quality..."
                    />
                  </div>

                  {/* Decision Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      onClick={() => handleSubmitReview('approved')}
                      disabled={submitting}
                    >
                      Approve
                    </button>
                    <button
                      className="flex-1 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                      onClick={() => handleSubmitReview('needs_revision')}
                      disabled={submitting}
                    >
                      Needs Revision
                    </button>
                    <button
                      className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                      onClick={() => handleSubmitReview('rejected')}
                      disabled={submitting}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedTaskRenderer;
