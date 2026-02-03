import { useState } from 'react';
import { CheckSquare, Square, Star } from 'lucide-react';

interface QuestionRendererProps {
  question: any;
  value: any;
  onChange: (value: any) => void;
}

export const QuestionRenderer = ({ question, value, onChange }: QuestionRendererProps) => {
  const renderQuestion = () => {
    switch (question.question_type) {
      case 'multiple_choice':
        return renderMultipleChoice();
      case 'text_input':
        return renderTextInput();
      case 'rating':
        return renderRating();
      case 'boolean':
        return renderBoolean();
      case 'scale':
        return renderScale();
      default:
        return <div className="text-gray-500">Unsupported question type: {question.question_type}</div>;
    }
  };

  const renderMultipleChoice = () => {
    const options = question.options || [];
    const isMultiSelect = question.validation_rules?.allow_multiple;

    return (
      <div className="space-y-3">
        {options.map((option: any, index: number) => {
          const optionValue = option.value || option;
          const optionLabel = option.label || option;
          const isSelected = isMultiSelect
            ? Array.isArray(value) && value.includes(optionValue)
            : value === optionValue;

          return (
            <button
              key={index}
              onClick={() => {
                if (isMultiSelect) {
                  const currentValues = Array.isArray(value) ? value : [];
                  if (currentValues.includes(optionValue)) {
                    onChange(currentValues.filter((v: any) => v !== optionValue));
                  } else {
                    onChange([...currentValues, optionValue]);
                  }
                } else {
                  onChange(optionValue);
                }
              }}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                {isMultiSelect ? (
                  isSelected ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )
                ) : (
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-blue-600' : 'border-gray-300'
                  }`}>
                    {isSelected && (
                      <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                    )}
                  </div>
                )}
                <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                  {optionLabel}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const renderTextInput = () => {
    const isLongText = question.validation_rules?.max_length > 200 || question.validation_rules?.multiline;

    return isLongText ? (
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter your response..."
        rows={6}
        maxLength={question.validation_rules?.max_length}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
      />
    ) : (
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter your response..."
        maxLength={question.validation_rules?.max_length}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    );
  };

  const renderRating = () => {
    const maxRating = question.options?.max || 5;
    const stars = Array.from({ length: maxRating }, (_, i) => i + 1);

    return (
      <div className="flex items-center gap-2">
        {stars.map((rating) => (
          <button
            key={rating}
            onClick={() => onChange(rating)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${
                rating <= (value || 0)
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        {value && (
          <span className="ml-2 text-lg font-medium text-gray-700">{value} / {maxRating}</span>
        )}
      </div>
    );
  };

  const renderBoolean = () => {
    return (
      <div className="flex gap-4">
        <button
          onClick={() => onChange(true)}
          className={`flex-1 p-4 rounded-lg border-2 transition-all ${
            value === true
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <span className={`font-medium ${value === true ? 'text-green-900' : 'text-gray-900'}`}>
            Yes
          </span>
        </button>
        <button
          onClick={() => onChange(false)}
          className={`flex-1 p-4 rounded-lg border-2 transition-all ${
            value === false
              ? 'border-red-500 bg-red-50'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <span className={`font-medium ${value === false ? 'text-red-900' : 'text-gray-900'}`}>
            No
          </span>
        </button>
      </div>
    );
  };

  const renderScale = () => {
    const min = question.options?.min || 1;
    const max = question.options?.max || 10;
    const step = question.options?.step || 1;
    const labels = question.options?.labels || {};

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{labels.min || min}</span>
          <span className="text-2xl font-bold text-blue-600">{value || min}</span>
          <span className="text-sm text-gray-600">{labels.max || max}</span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value || min}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {question.question_text}
          {question.is_required && <span className="text-red-500 ml-1">*</span>}
        </h2>
        {question.description && (
          <p className="text-gray-600 text-sm">{question.description}</p>
        )}
      </div>

      <div className="mt-6">{renderQuestion()}</div>

      {question.validation_rules?.custom_message && (
        <p className="text-sm text-gray-500 mt-2">{question.validation_rules.custom_message}</p>
      )}
    </div>
  );
};
