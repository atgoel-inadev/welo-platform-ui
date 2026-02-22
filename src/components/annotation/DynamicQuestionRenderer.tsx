/**
 * Dynamic Question Renderer
 * Renders questions from project configuration with pagination support
 */

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface Question {
  id: string;
  text: string;
  type: 'single_select' | 'multi_select' | 'text' | 'textarea' | 'rating' | 'slider' | 'number';
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  maxRating?: number;
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
}

interface DynamicQuestionRendererProps {
  questions: Question[];
  responses: Record<string, any>;
  renderMode?: 'all' | 'paginated';
  showProgress?: boolean;
  showNavigation?: boolean;
  onChange: (questionId: string, value: any) => void;
  onComplete?: () => void;
}

export const DynamicQuestionRenderer: React.FC<DynamicQuestionRendererProps> = ({
  questions,
  responses,
  renderMode = 'paginated',
  showProgress = true,
  showNavigation = true,
  onChange,
  onComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!questions || questions.length === 0) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-center text-gray-600">
          No questions configured for this project.
        </p>
      </div>
    );
  }

  const renderQuestion = (question: Question) => {
    const value = responses[question.id];

    switch (question.type) {
      case 'single_select':
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <label
                key={option.value}
                className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => onChange(question.id, e.target.value)}
                  className="mr-3 w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-900">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'multi_select':
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <label
                key={option.value}
                className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  value={option.value}
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onChange={(e) => {
                    const current = Array.isArray(value) ? value : [];
                    const updated = e.target.checked
                      ? [...current, option.value]
                      : current.filter((v) => v !== option.value);
                    onChange(question.id, updated);
                  }}
                  className="mr-3 w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-900">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(question.id, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your answer..."
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(question.id, e.target.value)}
            rows={question.rows || 4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Enter your answer..."
          />
        );

      case 'rating':
        return (
          <div className="flex gap-2">
            {Array.from({ length: question.maxRating || 5 }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onChange(question.id, i + 1)}
                className={`text-3xl transition-colors ${
                  value && i < value ? 'text-yellow-400' : 'text-gray-300'
                }`}
              >
                ★
              </button>
            ))}
            {value && <span className="ml-2 text-sm text-gray-600 self-center">({value}/{question.maxRating || 5})</span>}
          </div>
        );

      case 'slider':
        return (
          <div>
            <input
              type="range"
              min={question.min || 0}
              max={question.max || 100}
              step={question.step || 1}
              value={value || question.min || 0}
              onChange={(e) => onChange(question.id, parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>{question.min || 0}</span>
              <span className="font-medium">{value || question.min || 0}</span>
              <span>{question.max || 100}</span>
            </div>
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(question.id, parseFloat(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter a number..."
            min={question.min}
            max={question.max}
            step={question.step}
          />
        );

      default:
        return <p className="text-sm text-gray-500">Unsupported question type: {question.type}</p>;
    }
  };

  if (renderMode === 'all') {
    // Render all questions at once
    return (
      <div className="space-y-6">
        {questions.map((question, index) => (
          <div key={question.id} className="p-6 bg-white border border-gray-200 rounded-lg">
            <div className="mb-4">
              <div className="flex items-start justify-between">
                <label className="block text-base font-medium text-gray-900">
                  {index + 1}. {question.text}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </label>
              </div>
            </div>
            {renderQuestion(question)}
          </div>
        ))}
        {onComplete && (
          <button
            onClick={onComplete}
            className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Complete All Questions
          </button>
        )}
      </div>
    );
  }

  // Paginated mode - one question at a time
  const currentQuestion = questions[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === questions.length - 1;

  const handlePrevious = () => {
    if (!isFirst) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = () => {
    if (isLast && onComplete) {
      onComplete();
    } else if (!isLast) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const isCurrentAnswered = () => {
    const value = responses[currentQuestion.id];
    if (!currentQuestion.required) return true;
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && value !== '';
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      {showProgress && (
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-700">
            Question {currentIndex + 1} of {questions.length}
          </div>
          <div className="flex gap-1">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentIndex
                    ? 'bg-blue-600'
                    : responses[questions[i].id]
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Current question */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg">
        <div className="mb-4">
          <label className="block text-lg font-medium text-gray-900">
            {currentQuestion.text}
            {currentQuestion.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        </div>
        {renderQuestion(currentQuestion)}
      </div>

      {/* Navigation buttons */}
      {showNavigation && (
        <div className="flex justify-between items-center pt-4">
          <button
            onClick={handlePrevious}
            disabled={isFirst}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={!isCurrentAnswered()}
            className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLast ? 'Complete' : 'Next'}
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
