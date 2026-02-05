import React, { useState } from 'react';
import { ChevronDown, ChevronRight, User, Clock, CheckCircle } from 'lucide-react';

interface Annotation {
  id: string;
  annotatorId: string;
  annotatorName: string;
  responses: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: string;
}

interface AnnotationReviewWidgetProps {
  annotations: Annotation[];
  questions: Array<{
    id: string;
    text: string;
    type: string;
  }>;
}

/**
 * AnnotationReviewWidget
 * 
 * Displays previous annotations for reviewers to evaluate
 * Shows all annotator responses in a structured, readable format
 * 
 * Features:
 * - Collapsible annotation cards
 * - Question-response mapping
 * - Annotator information
 * - Timestamps
 */
export const AnnotationReviewWidget: React.FC<AnnotationReviewWidgetProps> = ({
  annotations,
  questions,
}) => {
  const [expandedAnnotations, setExpandedAnnotations] = useState<Set<string>>(
    new Set(annotations.map((a) => a.id)), // Expand all by default
  );

  const toggleAnnotation = (annotationId: string) => {
    setExpandedAnnotations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(annotationId)) {
        newSet.delete(annotationId);
      } else {
        newSet.add(annotationId);
      }
      return newSet;
    });
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getQuestionText = (questionId: string): string => {
    const question = questions.find((q) => q.id === questionId);
    return question?.text || questionId;
  };

  const formatResponse = (response: any): string => {
    if (typeof response === 'string') return response;
    if (typeof response === 'number') return response.toString();
    if (typeof response === 'boolean') return response ? 'Yes' : 'No';
    if (Array.isArray(response)) return response.join(', ');
    if (typeof response === 'object') return JSON.stringify(response, null, 2);
    return String(response);
  };

  if (!annotations || annotations.length === 0) {
    return (
      <div className="annotation-review-widget bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle className="text-yellow-600" size={24} />
          <h3 className="text-lg font-semibold text-gray-900">Previous Annotations</h3>
        </div>
        <p className="text-gray-600">
          No annotations have been submitted for this task yet.
        </p>
      </div>
    );
  }

  return (
    <div className="annotation-review-widget space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <CheckCircle className="text-blue-600" size={24} />
        <h3 className="text-lg font-semibold text-gray-900">
          Previous Annotations ({annotations.length})
        </h3>
      </div>

      <div className="space-y-3">
        {annotations.map((annotation, index) => {
          const isExpanded = expandedAnnotations.has(annotation.id);

          return (
            <div
              key={annotation.id}
              className="border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleAnnotation(annotation.id)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="text-gray-400" size={20} />
                  ) : (
                    <ChevronRight className="text-gray-400" size={20} />
                  )}
                  <div className="flex items-center gap-2 text-gray-700">
                    <User size={16} />
                    <span className="font-medium">
                      {annotation.annotatorName || `Annotator ${index + 1}`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock size={14} />
                  <span>{formatTimestamp(annotation.createdAt)}</span>
                </div>
              </div>

              {/* Content */}
              {isExpanded && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  <div className="space-y-4">
                    {Object.entries(annotation.responses).map(([questionId, response]) => (
                      <div key={questionId} className="bg-white p-3 rounded border border-gray-200">
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          {getQuestionText(questionId)}
                        </div>
                        <div className="text-gray-900 pl-3 border-l-2 border-blue-400">
                          {formatResponse(response)}
                        </div>
                      </div>
                    ))}

                    {/* Metadata (if exists) */}
                    {annotation.metadata && Object.keys(annotation.metadata).length > 0 && (
                      <div className="border-t pt-3 mt-3">
                        <div className="text-xs font-medium text-gray-500 mb-2">
                          Additional Data
                        </div>
                        <pre className="text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-auto max-h-32">
                          {JSON.stringify(annotation.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
        <p className="text-sm text-blue-900">
          <strong>Review Tip:</strong> Evaluate the quality and consistency of these annotations.
          Check for completeness, accuracy, and adherence to annotation guidelines.
        </p>
      </div>
    </div>
  );
};

export default AnnotationReviewWidget;
