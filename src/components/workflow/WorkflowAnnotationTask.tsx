import { useState, useEffect } from 'react';
import { FileViewer } from '../FileViewer';
import { FileMetadata, Annotation } from '../../types/renderer';
import { FileType } from '../../types';
import { Question } from '../../types/workflow';
import { Button, FormInput } from '../common';
import { Save, SkipForward, ChevronRight, ChevronLeft } from 'lucide-react';

interface WorkflowAnnotationTaskProps {
  file: FileMetadata;
  questions: Question[];
  onSubmit: (responses: Record<string, any>, annotations: Annotation[]) => void;
  onSkip?: () => void;
}

export const WorkflowAnnotationTask = ({
  file,
  questions,
  onSubmit,
  onSkip,
}: WorkflowAnnotationTaskProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  const validateResponse = (question: Question, value: any): string | null => {
    if (question.is_required && (!value || value === '')) {
      return 'This question is required';
    }

    const rules = question.validation_rules;

    if (question.question_type === 'text_input' && typeof value === 'string') {
      if (rules.min_length && value.length < rules.min_length) {
        return `Minimum length is ${rules.min_length} characters`;
      }
      if (rules.max_length && value.length > rules.max_length) {
        return `Maximum length is ${rules.max_length} characters`;
      }
    }

    if (
      (question.question_type === 'rating' || question.question_type === 'scale') &&
      typeof value === 'number'
    ) {
      if (rules.min_value !== undefined && value < rules.min_value) {
        return `Minimum value is ${rules.min_value}`;
      }
      if (rules.max_value !== undefined && value > rules.max_value) {
        return `Maximum value is ${rules.max_value}`;
      }
    }

    if (question.question_type === 'annotation') {
      const questionAnnotations = annotations.filter(
        (a) => a.fileId === `question-${question.id}`
      );
      const config = question.annotation_config;

      if (config.min_annotations && questionAnnotations.length < config.min_annotations) {
        return `Minimum ${config.min_annotations} annotations required`;
      }
      if (config.max_annotations && questionAnnotations.length > config.max_annotations) {
        return `Maximum ${config.max_annotations} annotations allowed`;
      }
    }

    return null;
  };

  const handleNext = () => {
    const error = validateResponse(currentQuestion, responses[currentQuestion.id]);

    if (error) {
      setErrors({ ...errors, [currentQuestion.id]: error });
      return;
    }

    setErrors({ ...errors, [currentQuestion.id]: '' });

    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    const allValid = questions.every((q) => !validateResponse(q, responses[q.id]));

    if (!allValid) {
      alert('Please complete all required questions');
      return;
    }

    onSubmit(responses, annotations);
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    const value = responses[currentQuestion.id];
    const error = errors[currentQuestion.id];

    switch (currentQuestion.question_type) {
      case 'text_input':
        return (
          <div>
            <FormInput
              label={currentQuestion.question_text}
              value={value || ''}
              onChange={(e) =>
                setResponses({ ...responses, [currentQuestion.id]: e.target.value })
              }
              required={currentQuestion.is_required}
              error={error}
            />
          </div>
        );

      case 'multiple_choice':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {currentQuestion.question_text}
              {currentQuestion.is_required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {currentQuestion.options.map((option: string, idx: number) => (
                <label key={idx} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name={currentQuestion.id}
                    value={option}
                    checked={value === option}
                    onChange={(e) =>
                      setResponses({ ...responses, [currentQuestion.id]: e.target.value })
                    }
                    className="text-blue-600"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
        );

      case 'boolean':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {currentQuestion.question_text}
              {currentQuestion.is_required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer flex-1">
                <input
                  type="radio"
                  name={currentQuestion.id}
                  value="yes"
                  checked={value === 'yes'}
                  onChange={() =>
                    setResponses({ ...responses, [currentQuestion.id]: 'yes' })
                  }
                  className="text-blue-600"
                />
                <span className="font-medium text-gray-700">Yes</span>
              </label>
              <label className="flex items-center gap-2 p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer flex-1">
                <input
                  type="radio"
                  name={currentQuestion.id}
                  value="no"
                  checked={value === 'no'}
                  onChange={() =>
                    setResponses({ ...responses, [currentQuestion.id]: 'no' })
                  }
                  className="text-blue-600"
                />
                <span className="font-medium text-gray-700">No</span>
              </label>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
        );

      case 'rating':
      case 'scale':
        const min = currentQuestion.validation_rules.min_value || 1;
        const max = currentQuestion.validation_rules.max_value || 5;
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {currentQuestion.question_text}
              {currentQuestion.is_required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{min}</span>
              <input
                type="range"
                min={min}
                max={max}
                value={value || min}
                onChange={(e) =>
                  setResponses({
                    ...responses,
                    [currentQuestion.id]: parseInt(e.target.value),
                  })
                }
                className="flex-1"
              />
              <span className="text-sm text-gray-600">{max}</span>
              <span className="ml-4 text-lg font-semibold text-blue-600 min-w-[3rem] text-center">
                {value || min}
              </span>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
        );

      case 'annotation':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {currentQuestion.question_text}
              {currentQuestion.is_required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Instructions:</strong> Use the file viewer below to add annotations.
              </p>
              {currentQuestion.annotation_config.annotation_types && (
                <p className="text-sm text-gray-600">
                  <strong>Allowed types:</strong>{' '}
                  {currentQuestion.annotation_config.annotation_types.join(', ')}
                </p>
              )}
              {currentQuestion.annotation_config.min_annotations && (
                <p className="text-sm text-gray-600">
                  <strong>Minimum annotations:</strong>{' '}
                  {currentQuestion.annotation_config.min_annotations}
                </p>
              )}
            </div>
            {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
          </div>
        );

      default:
        return (
          <div className="text-gray-600">
            Question type "{currentQuestion.question_type}" not yet implemented
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      {currentQuestion?.question_type === 'annotation' && (
        <div className="flex-1">
          <FileViewer
            file={file}
            annotations={annotations}
            onAnnotationAdd={(annotation) => setAnnotations([...annotations, annotation])}
            onAnnotationRemove={(annotationId) =>
              setAnnotations(annotations.filter((a) => a.id !== annotationId))
            }
          />
        </div>
      )}

      <div className={currentQuestion?.question_type === 'annotation' ? 'lg:w-96' : 'flex-1'}>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="text-xs text-gray-500">
                {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{
                  width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="mb-6">{renderQuestion()}</div>

          <div className="flex items-center justify-between gap-3">
            <Button
              variant="secondary"
              onClick={handlePrevious}
              disabled={isFirstQuestion}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>

            <div className="flex gap-2">
              {onSkip && (
                <Button variant="secondary" onClick={onSkip}>
                  <SkipForward className="w-4 h-4 mr-1" />
                  Skip
                </Button>
              )}
              <Button onClick={handleNext}>
                {isLastQuestion ? (
                  <>
                    <Save className="w-4 h-4 mr-1" />
                    Submit
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
