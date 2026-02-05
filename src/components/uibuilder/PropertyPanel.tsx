/**
 * Property Panel Component
 * Configuration panel for selected widget properties
 */

import { useState } from 'react';
import { Trash2, Plus, X } from 'lucide-react';
import { Widget, WidgetOption } from '../../types/uiBuilder';
import { Button, FormInput } from '../common';

interface PropertyPanelProps {
  widget: Widget;
  onUpdate: (updates: Partial<Widget>) => void;
  onDelete: () => void;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({ widget, onUpdate, onDelete }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const renderBasicProperties = () => (
    <div className="space-y-4">
      <FormInput
        label="Label"
        value={widget.label || ''}
        onChange={(e) => onUpdate({ label: e.target.value })}
        placeholder="Enter label..."
      />

      {widget.type !== 'INSTRUCTION_TEXT' && widget.type !== 'DIVIDER' && widget.type !== 'SPACER' && (
        <>
          <FormInput
            label="Placeholder"
            value={widget.placeholder || ''}
            onChange={(e) => onUpdate({ placeholder: e.target.value })}
            placeholder="Enter placeholder..."
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Help Text</label>
            <textarea
              value={widget.helpText || ''}
              onChange={(e) => onUpdate({ helpText: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="Additional help text..."
            />
          </div>
        </>
      )}

      <div className="flex items-center gap-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={widget.required || false}
            onChange={(e) => onUpdate({ required: e.target.checked })}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">Required</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={widget.disabled || false}
            onChange={(e) => onUpdate({ disabled: e.target.checked })}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">Disabled</span>
        </label>
      </div>
    </div>
  );

  const renderTypeSpecificProperties = () => {
    switch (widget.type) {
      case 'TEXT_INPUT':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Input Type</label>
              <select
                value={(widget as any).inputType || 'text'}
                onChange={(e) => onUpdate({ inputType: e.target.value } as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="text">Text</option>
                <option value="email">Email</option>
                <option value="url">URL</option>
                <option value="tel">Phone</option>
              </select>
            </div>

            <FormInput
              label="Min Length"
              type="number"
              value={(widget as any).minLength || ''}
              onChange={(e) => onUpdate({ minLength: parseInt(e.target.value) } as any)}
            />

            <FormInput
              label="Max Length"
              type="number"
              value={(widget as any).maxLength || ''}
              onChange={(e) => onUpdate({ maxLength: parseInt(e.target.value) } as any)}
            />
          </div>
        );

      case 'TEXTAREA':
        return (
          <div className="space-y-4">
            <FormInput
              label="Rows"
              type="number"
              value={(widget as any).rows || 4}
              onChange={(e) => onUpdate({ rows: parseInt(e.target.value) } as any)}
              min={2}
              max={20}
            />

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={(widget as any).showCharCount || false}
                onChange={(e) => onUpdate({ showCharCount: e.target.checked } as any)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Show character count</span>
            </label>
          </div>
        );

      case 'SELECT':
      case 'MULTI_SELECT':
      case 'RADIO_GROUP':
        return <OptionsEditor widget={widget} onUpdate={onUpdate} />;

      case 'RATING':
        return (
          <div className="space-y-4">
            <FormInput
              label="Max Rating"
              type="number"
              value={(widget as any).maxRating || 5}
              onChange={(e) => onUpdate({ maxRating: parseInt(e.target.value) } as any)}
              min={3}
              max={10}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
              <select
                value={(widget as any).icon || 'star'}
                onChange={(e) => onUpdate({ icon: e.target.value } as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="star">Star</option>
                <option value="heart">Heart</option>
                <option value="thumb">Thumb</option>
                <option value="emoji">Emoji</option>
              </select>
            </div>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={(widget as any).allowHalf || false}
                onChange={(e) => onUpdate({ allowHalf: e.target.checked } as any)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Allow half ratings</span>
            </label>
          </div>
        );

      case 'SLIDER':
        return (
          <div className="space-y-4">
            <FormInput
              label="Minimum Value"
              type="number"
              value={(widget as any).min || 0}
              onChange={(e) => onUpdate({ min: parseInt(e.target.value) } as any)}
            />

            <FormInput
              label="Maximum Value"
              type="number"
              value={(widget as any).max || 100}
              onChange={(e) => onUpdate({ max: parseInt(e.target.value) } as any)}
            />

            <FormInput
              label="Step"
              type="number"
              value={(widget as any).step || 1}
              onChange={(e) => onUpdate({ step: parseInt(e.target.value) } as any)}
            />

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={(widget as any).showValue || false}
                onChange={(e) => onUpdate({ showValue: e.target.checked } as any)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Show current value</span>
            </label>
          </div>
        );

      case 'INSTRUCTION_TEXT':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
              <textarea
                value={(widget as any).content || ''}
                onChange={(e) => onUpdate({ content: e.target.value } as any)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                placeholder="Enter instruction text..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
              <select
                value={(widget as any).format || 'text'}
                onChange={(e) => onUpdate({ format: e.target.value } as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="text">Plain Text</option>
                <option value="markdown">Markdown</option>
                <option value="html">HTML</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Variant</label>
              <select
                value={(widget as any).variant || 'info'}
                onChange={(e) => onUpdate({ variant: e.target.value } as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="success">Success</option>
                <option value="error">Error</option>
              </select>
            </div>
          </div>
        );

      case 'FILE_VIEWER':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">File Type</label>
              <select
                value={(widget as any).fileType || 'TEXT'}
                onChange={(e) => onUpdate({ fileType: e.target.value } as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="TEXT">Text</option>
                <option value="MARKDOWN">Markdown</option>
                <option value="HTML">HTML</option>
                <option value="IMAGE">Image</option>
                <option value="VIDEO">Video</option>
                <option value="AUDIO">Audio</option>
                <option value="CSV">CSV</option>
                <option value="PDF">PDF</option>
              </select>
            </div>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={(widget as any).allowFullscreen || false}
                onChange={(e) => onUpdate({ allowFullscreen: e.target.checked } as any)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Allow fullscreen</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={(widget as any).showControls || false}
                onChange={(e) => onUpdate({ showControls: e.target.checked } as any)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Show controls</span>
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  const renderPositionAndSize = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormInput
          label="X Position"
          type="number"
          value={widget.position.x}
          onChange={(e) =>
            onUpdate({ position: { ...widget.position, x: parseInt(e.target.value) || 0 } })
          }
        />

        <FormInput
          label="Y Position"
          type="number"
          value={widget.position.y}
          onChange={(e) =>
            onUpdate({ position: { ...widget.position, y: parseInt(e.target.value) || 0 } })
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormInput
          label="Width"
          type="number"
          value={widget.size.width}
          onChange={(e) =>
            onUpdate({ size: { ...widget.size, width: parseInt(e.target.value) || 100 } })
          }
          min={100}
        />

        <FormInput
          label="Height"
          type="number"
          value={widget.size.height}
          onChange={(e) =>
            onUpdate({ size: { ...widget.size, height: parseInt(e.target.value) || 40 } })
          }
          min={40}
        />
      </div>

      <FormInput
        label="Display Order"
        type="number"
        value={widget.order}
        onChange={(e) => onUpdate({ order: parseInt(e.target.value) || 0 })}
        helperText="Lower numbers appear first"
      />
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">{widget.type}</h2>
        <p className="text-sm text-gray-500 mt-1">ID: {widget.id.substring(0, 12)}...</p>
      </div>

      {/* Properties */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Basic Properties */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Basic Properties</h3>
          {renderBasicProperties()}
        </div>

        {/* Type-Specific Properties */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Type-Specific Settings</h3>
          {renderTypeSpecificProperties()}
        </div>

        {/* Position and Size */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Position & Size</h3>
          {renderPositionAndSize()}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <Button onClick={onDelete} variant="danger" className="w-full">
          <Trash2 size={16} className="mr-2" />
          Delete Widget
        </Button>
      </div>
    </div>
  );
};

// Options Editor Component for SELECT, MULTI_SELECT, RADIO_GROUP
const OptionsEditor: React.FC<{ widget: Widget; onUpdate: (updates: Partial<Widget>) => void }> = ({
  widget,
  onUpdate,
}) => {
  const options = (widget as any).options || [];

  const addOption = () => {
    const newOption: WidgetOption = {
      id: `option-${Date.now()}`,
      label: `Option ${options.length + 1}`,
      value: `option_${options.length + 1}`,
    };
    onUpdate({ options: [...options, newOption] } as any);
  };

  const updateOption = (index: number, updates: Partial<WidgetOption>) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], ...updates };
    onUpdate({ options: newOptions } as any);
  };

  const deleteOption = (index: number) => {
    const newOptions = options.filter((_: any, i: number) => i !== index);
    onUpdate({ options: newOptions } as any);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">Options</label>
        <button
          onClick={addOption}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <Plus size={16} />
          Add Option
        </button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {options.map((option: WidgetOption, index: number) => (
          <div key={option.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded border border-gray-200">
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={option.label}
                onChange={(e) => updateOption(index, { label: e.target.value })}
                placeholder="Label"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
              <input
                type="text"
                value={option.value}
                onChange={(e) => updateOption(index, { value: e.target.value })}
                placeholder="Value"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <button
              onClick={() => deleteOption(index)}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {options.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">No options yet. Click "Add Option" to create one.</p>
      )}
    </div>
  );
};
