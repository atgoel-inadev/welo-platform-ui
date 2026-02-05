/**
 * Dynamic UI Renderer Component
 * Renders annotation UI based on configuration schema
 */

import { useState, useEffect } from 'react';
import { UIConfiguration, Widget, PipelineMode, FileType } from '../../types/uiBuilder';
import { FileViewer } from '../FileViewer';
import { Button } from '../common';

interface DynamicUIRendererProps {
  configuration: UIConfiguration;
  pipelineMode: PipelineMode;
  fileData: any;
  fileType: FileType;
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void;
  readOnly?: boolean;
}

export const DynamicUIRenderer: React.FC<DynamicUIRendererProps> = ({
  configuration,
  pipelineMode,
  fileData,
  fileType,
  initialData = {},
  onSubmit,
  readOnly = false,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  // Filter widgets based on pipeline mode
  const visibleWidgets = configuration.widgets
    .filter((widget) => {
      if (!widget.pipelineModes || widget.pipelineModes.length === 0) return true;
      return widget.pipelineModes.includes(pipelineMode);
    })
    .filter((widget) => !widget.hidden)
    .filter((widget) => {
      // Check conditional display
      if (!widget.conditionalDisplay || widget.conditionalDisplay.length === 0) return true;
      return widget.conditionalDisplay.every((condition) => {
        const fieldValue = formData[condition.field];
        switch (condition.operator) {
          case 'equals':
            return fieldValue === condition.value;
          case 'notEquals':
            return fieldValue !== condition.value;
          case 'contains':
            return String(fieldValue).includes(condition.value);
          case 'greaterThan':
            return Number(fieldValue) > Number(condition.value);
          case 'lessThan':
            return Number(fieldValue) < Number(condition.value);
          case 'in':
            return Array.isArray(condition.value) && condition.value.includes(fieldValue);
          default:
            return true;
        }
      });
    })
    .sort((a, b) => a.order - b.order);

  const handleChange = (widgetId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [widgetId]: value }));
    // Clear error for this field
    if (errors[widgetId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[widgetId];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    visibleWidgets.forEach((widget) => {
      if (widget.required && !formData[widget.id]) {
        newErrors[widget.id] = `${widget.label || widget.type} is required`;
      }

      // Run validation rules
      if (widget.validation && formData[widget.id]) {
        widget.validation.forEach((rule) => {
          const value = formData[widget.id];
          let isValid = true;

          switch (rule.type) {
            case 'required':
              isValid = !!value;
              break;
            case 'minLength':
              isValid = String(value).length >= rule.value;
              break;
            case 'maxLength':
              isValid = String(value).length <= rule.value;
              break;
            case 'min':
              isValid = Number(value) >= rule.value;
              break;
            case 'max':
              isValid = Number(value) <= rule.value;
              break;
            case 'pattern':
              isValid = new RegExp(rule.value).test(String(value));
              break;
          }

          if (!isValid) {
            newErrors[widget.id] = rule.message;
          }
        });
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const renderWidget = (widget: Widget) => {
    const value = formData[widget.id];
    const error = errors[widget.id];
    const isDisabled = widget.disabled || readOnly;

    const commonProps = {
      disabled: isDisabled,
      style: widget.style,
    };

    switch (widget.type) {
      case 'FILE_VIEWER':
        return (
          <div className="mb-6">
            <FileViewer
              fileType={fileType.toLowerCase() as any}
              fileUrl={typeof fileData === 'string' ? fileData : ''}
            />
          </div>
        );

      case 'TEXT_INPUT':
        return (
          <div className="mb-4">
            {widget.label && (
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {widget.label}
                {widget.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            <input
              type={(widget as any).inputType || 'text'}
              value={value || ''}
              onChange={(e) => handleChange(widget.id, e.target.value)}
              placeholder={widget.placeholder}
              className={`w-full px-3 py-2 border rounded-md ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              {...commonProps}
            />
            {widget.helpText && !error && (
              <p className="text-xs text-gray-500 mt-1">{widget.helpText}</p>
            )}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        );

      case 'TEXTAREA':
        return (
          <div className="mb-4">
            {widget.label && (
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {widget.label}
                {widget.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            <textarea
              value={value || ''}
              onChange={(e) => handleChange(widget.id, e.target.value)}
              placeholder={widget.placeholder}
              rows={(widget as any).rows || 4}
              className={`w-full px-3 py-2 border rounded-md ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              {...commonProps}
            />
            {(widget as any).showCharCount && value && (
              <p className="text-xs text-gray-500 mt-1">{value.length} characters</p>
            )}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        );

      case 'SELECT':
        return (
          <div className="mb-4">
            {widget.label && (
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {widget.label}
                {widget.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            <select
              value={value || ''}
              onChange={(e) => handleChange(widget.id, e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              {...commonProps}
            >
              <option value="">{widget.placeholder || 'Select an option...'}</option>
              {(widget as any).options?.map((option: any) => (
                <option key={option.id} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        );

      case 'MULTI_SELECT':
        return (
          <div className="mb-4">
            {widget.label && (
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {widget.label}
                {widget.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            <div className="space-y-2">
              {(widget as any).options?.map((option: any) => (
                <label key={option.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={Array.isArray(value) && value.includes(option.value)}
                    onChange={(e) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      const newValues = e.target.checked
                        ? [...currentValues, option.value]
                        : currentValues.filter((v) => v !== option.value);
                      handleChange(widget.id, newValues);
                    }}
                    disabled={isDisabled}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        );

      case 'RADIO_GROUP':
        return (
          <div className="mb-4">
            {widget.label && (
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {widget.label}
                {widget.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            <div className="space-y-2">
              {(widget as any).options?.map((option: any) => (
                <label key={option.id} className="flex items-center">
                  <input
                    type="radio"
                    name={widget.id}
                    checked={value === option.value}
                    onChange={() => handleChange(widget.id, option.value)}
                    disabled={isDisabled}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        );

      case 'CHECKBOX':
        return (
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={value || false}
                onChange={(e) => handleChange(widget.id, e.target.checked)}
                disabled={isDisabled}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">
                {widget.label || (widget as any).checkboxLabel}
              </span>
            </label>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        );

      case 'RATING':
        return (
          <div className="mb-4">
            {widget.label && (
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {widget.label}
              </label>
            )}
            <div className="flex gap-1">
              {Array.from({ length: (widget as any).maxRating || 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleChange(widget.id, i + 1)}
                  disabled={isDisabled}
                  className={`text-3xl ${
                    value >= i + 1 ? 'text-yellow-400' : 'text-gray-300'
                  } hover:text-yellow-400 transition-colors`}
                >
                  ★
                </button>
              ))}
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        );

      case 'SLIDER':
        return (
          <div className="mb-4">
            {widget.label && (
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {widget.label}
              </label>
            )}
            <input
              type="range"
              value={value || (widget as any).min || 0}
              onChange={(e) => handleChange(widget.id, parseInt(e.target.value))}
              min={(widget as any).min || 0}
              max={(widget as any).max || 100}
              step={(widget as any).step || 1}
              disabled={isDisabled}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{(widget as any).min || 0}</span>
              {(widget as any).showValue && <span className="font-medium">{value || 0}</span>}
              <span>{(widget as any).max || 100}</span>
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        );

      case 'DATE_PICKER':
        return (
          <div className="mb-4">
            {widget.label && (
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {widget.label}
                {widget.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            <input
              type={(widget as any).includeTime ? 'datetime-local' : 'date'}
              value={value || ''}
              onChange={(e) => handleChange(widget.id, e.target.value)}
              min={(widget as any).minDate}
              max={(widget as any).maxDate}
              className={`w-full px-3 py-2 border rounded-md ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              {...commonProps}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        );

      case 'INSTRUCTION_TEXT':
        const variantStyles: Record<string, string> = {
          info: 'bg-blue-50 border-blue-200 text-blue-800',
          warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          success: 'bg-green-50 border-green-200 text-green-800',
          error: 'bg-red-50 border-red-200 text-red-800',
        };
        const variant = (widget as any).variant || 'info';
        return (
          <div
            className={`mb-4 p-4 border rounded-md ${
              variantStyles[variant] || variantStyles.info
            }`}
          >
            <p className="text-sm">{(widget as any).content}</p>
          </div>
        );

      case 'DIVIDER':
        return <hr className="my-6 border-gray-300" />;

      case 'SPACER':
        return <div style={{ height: (widget as any).height || 20 }} />;

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Render widgets */}
      {visibleWidgets.map((widget) => (
        <div key={widget.id}>{renderWidget(widget)}</div>
      ))}

      {/* Submit Button */}
      {!readOnly && (
        <div className="pt-4 border-t border-gray-200">
          <Button type="submit" variant="primary" className="w-full">
            {pipelineMode === 'ANNOTATION' ? 'Submit Annotation' : 'Submit Review'}
          </Button>
        </div>
      )}
    </form>
  );
};
