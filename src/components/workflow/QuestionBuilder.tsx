import { useState } from 'react';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';
import { Question, QuestionType } from '../../types/workflow';
import { FormInput, Button } from '../common';

interface QuestionBuilderProps {
  nodeId: string;
  questions: Question[];
  onSave: (questions: Partial<Question>[]) => void;
  onClose: () => void;
}

const questionTypeOptions: { value: QuestionType; label: string; description: string }[] = [
  { value: 'multiple_choice', label: 'Multiple Choice', description: 'Select from predefined options' },
  { value: 'text_input', label: 'Text Input', description: 'Free-form text response' },
  { value: 'boolean', label: 'Yes/No', description: 'Simple yes or no question' },
  { value: 'rating', label: 'Rating', description: 'Rate on a scale' },
  { value: 'scale', label: 'Scale', description: 'Slider or numeric scale' },
  { value: 'annotation', label: 'Annotation', description: 'Mark regions on images/videos' },
  { value: 'file_upload', label: 'File Upload', description: 'Upload files or images' },
];

export const QuestionBuilder = ({ questions: initialQuestions, onSave, onClose }: QuestionBuilderProps) => {
  const [questions, setQuestions] = useState<Partial<Question>[]>(
    initialQuestions.length > 0
      ? initialQuestions
      : [
          {
            question_type: 'text_input',
            question_text: '',
            options: [],
            validation_rules: {},
            annotation_config: {},
            order_index: 0,
            is_required: true,
          },
        ]
  );

  const [editingIndex, setEditingIndex] = useState<number>(0);

  const currentQuestion = questions[editingIndex];

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_type: 'text_input',
        question_text: '',
        options: [],
        validation_rules: {},
        annotation_config: {},
        order_index: questions.length,
        is_required: true,
      },
    ]);
    setEditingIndex(questions.length);
  };

  const deleteQuestion = (index: number) => {
    if (questions.length === 1) {
      alert('You must have at least one question');
      return;
    }
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
    setEditingIndex(Math.min(editingIndex, newQuestions.length - 1));
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setQuestions(newQuestions);
  };

  const handleSave = () => {
    const hasInvalidQuestions = questions.some(
      (q) => !q.question_text || q.question_text.trim() === ''
    );

    if (hasInvalidQuestions) {
      alert('All questions must have question text');
      return;
    }

    onSave(questions);
  };

  const renderQuestionTypeConfig = () => {
    if (!currentQuestion) return null;

    switch (currentQuestion.question_type) {
      case 'multiple_choice':
        return (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Options</label>
            {(currentQuestion.options || []).map((option: string, idx: number) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...(currentQuestion.options || [])];
                    newOptions[idx] = e.target.value;
                    updateQuestion(editingIndex, { options: newOptions });
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  placeholder={`Option ${idx + 1}`}
                />
                <button
                  onClick={() => {
                    const newOptions = (currentQuestion.options || []).filter((_, i) => i !== idx);
                    updateQuestion(editingIndex, { options: newOptions });
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                updateQuestion(editingIndex, {
                  options: [...(currentQuestion.options || []), ''],
                });
              }}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Option
            </button>
          </div>
        );

      case 'rating':
      case 'scale':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Minimum Value"
                type="number"
                value={currentQuestion.validation_rules?.min_value || 1}
                onChange={(e) => {
                  updateQuestion(editingIndex, {
                    validation_rules: {
                      ...currentQuestion.validation_rules,
                      min_value: parseInt(e.target.value),
                    },
                  });
                }}
              />
              <FormInput
                label="Maximum Value"
                type="number"
                value={currentQuestion.validation_rules?.max_value || 5}
                onChange={(e) => {
                  updateQuestion(editingIndex, {
                    validation_rules: {
                      ...currentQuestion.validation_rules,
                      max_value: parseInt(e.target.value),
                    },
                  });
                }}
              />
            </div>
          </div>
        );

      case 'annotation':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Annotation Types
              </label>
              <div className="space-y-2">
                {['point', 'rectangle', 'polygon', 'text', 'timestamp'].map((type) => (
                  <label key={type} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(currentQuestion.annotation_config?.annotation_types || []).includes(type as any)}
                      onChange={(e) => {
                        const types = currentQuestion.annotation_config?.annotation_types || [];
                        const newTypes = e.target.checked
                          ? [...types, type]
                          : types.filter((t) => t !== type);
                        updateQuestion(editingIndex, {
                          annotation_config: {
                            ...currentQuestion.annotation_config,
                            annotation_types: newTypes as ('point' | 'rectangle' | 'polygon' | 'text' | 'timestamp')[],
                          },
                        });
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Min Annotations"
                type="number"
                value={currentQuestion.annotation_config?.min_annotations || 0}
                onChange={(e) => {
                  updateQuestion(editingIndex, {
                    annotation_config: {
                      ...currentQuestion.annotation_config,
                      min_annotations: parseInt(e.target.value),
                    },
                  });
                }}
              />
              <FormInput
                label="Max Annotations"
                type="number"
                value={currentQuestion.annotation_config?.max_annotations || 999}
                onChange={(e) => {
                  updateQuestion(editingIndex, {
                    annotation_config: {
                      ...currentQuestion.annotation_config,
                      max_annotations: parseInt(e.target.value),
                    },
                  });
                }}
              />
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={currentQuestion.annotation_config?.require_notes || false}
                  onChange={(e) => {
                    updateQuestion(editingIndex, {
                      annotation_config: {
                        ...currentQuestion.annotation_config,
                        require_notes: e.target.checked,
                      },
                    });
                  }}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Require notes for each annotation</span>
              </label>
            </div>
          </div>
        );

      case 'text_input':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Min Length"
                type="number"
                value={currentQuestion.validation_rules?.min_length || 0}
                onChange={(e) => {
                  updateQuestion(editingIndex, {
                    validation_rules: {
                      ...currentQuestion.validation_rules,
                      min_length: parseInt(e.target.value),
                    },
                  });
                }}
              />
              <FormInput
                label="Max Length"
                type="number"
                value={currentQuestion.validation_rules?.max_length || 1000}
                onChange={(e) => {
                  updateQuestion(editingIndex, {
                    validation_rules: {
                      ...currentQuestion.validation_rules,
                      max_length: parseInt(e.target.value),
                    },
                  });
                }}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Question Builder</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-64 border-r border-gray-200 overflow-y-auto bg-gray-50">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Questions</h3>
                <button
                  onClick={addQuestion}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Add question"
                >
                  <Plus className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <div className="space-y-2">
                {questions.map((q, idx) => (
                  <div
                    key={idx}
                    onClick={() => setEditingIndex(idx)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      editingIndex === idx
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : 'bg-white border-2 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-600 mb-1">
                          {questionTypeOptions.find((t) => t.value === q.question_type)?.label}
                        </div>
                        <div className="text-sm text-gray-900 truncate">
                          {q.question_text || 'Untitled Question'}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteQuestion(idx);
                        }}
                        className="p-1 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-3 h-3 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {currentQuestion && (
              <div className="max-w-2xl space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Type
                  </label>
                  <select
                    value={currentQuestion.question_type}
                    onChange={(e) =>
                      updateQuestion(editingIndex, {
                        question_type: e.target.value as QuestionType,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {questionTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} - {option.description}
                      </option>
                    ))}
                  </select>
                </div>

                <FormInput
                  label="Question Text"
                  value={currentQuestion.question_text || ''}
                  onChange={(e) =>
                    updateQuestion(editingIndex, { question_text: e.target.value })
                  }
                  placeholder="Enter your question here..."
                  required
                />

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={currentQuestion.is_required}
                      onChange={(e) =>
                        updateQuestion(editingIndex, { is_required: e.target.checked })
                      }
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Required question</span>
                  </label>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    Question Configuration
                  </h3>
                  {renderQuestionTypeConfig()}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Questions
          </Button>
        </div>
      </div>
    </div>
  );
};
