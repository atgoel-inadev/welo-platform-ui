/**
 * Property Panel Component
 * Clean, collapsible configuration panel for selected widget properties
 */

import { useState } from 'react';
import { Trash2, Plus, X, ChevronDown, ChevronRight, Settings2, Sliders, Move } from 'lucide-react';
import { Widget, WidgetOption } from '../../types/uiBuilder';

interface PropertyPanelProps {
  widget: Widget;
  onUpdate: (updates: Partial<Widget>) => void;
  onDelete: () => void;
}

/* ── Shared small components ──────────────────────────────────────────────── */

const SectionHeader: React.FC<{
  title: string;
  icon?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}> = ({ title, icon, open, onToggle }) => (
  <button
    onClick={onToggle}
    className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:bg-slate-100/80 transition-colors"
  >
    <span className="flex items-center gap-2">
      {icon}
      {title}
    </span>
    {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
  </button>
);

const Field: React.FC<{
  label: string;
  children: React.ReactNode;
  hint?: string;
}> = ({ label, children, hint }) => (
  <div>
    <label className="block text-[11px] font-medium text-slate-600 mb-1">{label}</label>
    {children}
    {hint && <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>}
  </div>
);

const inputClass =
  'w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all';

const selectClass =
  'w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 ' +
  'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all';

/* ── Main Panel ───────────────────────────────────────────────────────────── */

export const PropertyPanel: React.FC<PropertyPanelProps> = ({ widget, onUpdate, onDelete }) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basic: true,
    type: true,
    position: false,
  });

  const toggle = (key: string) => setOpenSections((s) => ({ ...s, [key]: !s[key] }));

  /* ── Basic props ─────────────────────────────────────────────────────── */
  const renderBasicProperties = () => (
    <div className="px-4 py-3 space-y-3">
      <Field label="Size Preset">
        <select
          value={widget.sizePreset || 'medium'}
          onChange={(e) => onUpdate({ sizePreset: e.target.value as any })}
          className={selectClass}
        >
          <option value="small">Small (280 px)</option>
          <option value="medium">Medium (480 px)</option>
          <option value="large">Large (full)</option>
          <option value="full-width">Full Width</option>
          <option value="custom">Custom</option>
        </select>
      </Field>

      {widget.sizePreset === 'custom' && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Width (px)">
            <input
              type="number"
              value={widget.size.width}
              onChange={(e) => onUpdate({ size: { ...widget.size, width: parseInt(e.target.value) } })}
              min={50}
              className={inputClass}
            />
          </Field>
          <Field label="Height (px)">
            <input
              type="number"
              value={widget.size.height}
              onChange={(e) => onUpdate({ size: { ...widget.size, height: parseInt(e.target.value) } })}
              min={30}
              className={inputClass}
            />
          </Field>
        </div>
      )}

      <Field label="Label">
        <input
          type="text"
          value={widget.label || ''}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="Label…"
          className={inputClass}
        />
      </Field>

      {!['INSTRUCTION_TEXT', 'DIVIDER', 'SPACER'].includes(widget.type) && (
        <>
          <Field label="Placeholder">
            <input
              type="text"
              value={widget.placeholder || ''}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              placeholder="Placeholder…"
              className={inputClass}
            />
          </Field>

          <Field label="Help Text">
            <textarea
              value={widget.helpText || ''}
              onChange={(e) => onUpdate({ helpText: e.target.value })}
              rows={2}
              placeholder="Additional help…"
              className={inputClass + ' resize-none'}
            />
          </Field>
        </>
      )}

      <div className="flex items-center gap-4 pt-1">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={widget.required || false}
            onChange={(e) => onUpdate({ required: e.target.checked })}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
          />
          <span className="text-[11px] text-slate-600">Required</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={widget.disabled || false}
            onChange={(e) => onUpdate({ disabled: e.target.checked })}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
          />
          <span className="text-[11px] text-slate-600">Disabled</span>
        </label>
      </div>
    </div>
  );

  /* ── Type-specific props ─────────────────────────────────────────────── */
  const renderTypeSpecificProperties = () => {
    switch (widget.type) {
      case 'TEXT_INPUT':
        return (
          <div className="px-4 py-3 space-y-3">
            <Field label="Input Type">
              <select
                value={(widget as any).inputType || 'text'}
                onChange={(e) => onUpdate({ inputType: e.target.value } as any)}
                className={selectClass}
              >
                <option value="text">Text</option>
                <option value="email">Email</option>
                <option value="url">URL</option>
                <option value="tel">Phone</option>
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Min Length">
                <input type="number" value={(widget as any).minLength || ''} onChange={(e) => onUpdate({ minLength: parseInt(e.target.value) } as any)} className={inputClass} />
              </Field>
              <Field label="Max Length">
                <input type="number" value={(widget as any).maxLength || ''} onChange={(e) => onUpdate({ maxLength: parseInt(e.target.value) } as any)} className={inputClass} />
              </Field>
            </div>
          </div>
        );

      case 'QUESTION':
        return (
          <div className="px-4 py-3 space-y-3">
            <Field label="Render Mode" hint="How questions are displayed to annotators">
              <select
                value={(widget as any).renderMode || 'paginated'}
                onChange={(e) => onUpdate({ renderMode: e.target.value } as any)}
                className={selectClass}
              >
                <option value="paginated">Paginated</option>
                <option value="all">All at once</option>
              </select>
            </Field>

            {(widget as any).renderMode === 'paginated' && (
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={(widget as any).showProgress !== false} onChange={(e) => onUpdate({ showProgress: e.target.checked } as any)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5" />
                  <span className="text-[11px] text-slate-600">Show progress indicator</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={(widget as any).showNavigation !== false} onChange={(e) => onUpdate({ showNavigation: e.target.checked } as any)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5" />
                  <span className="text-[11px] text-slate-600">Show navigation buttons</span>
                </label>
              </div>
            )}

            <div className="p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-lg">
              <p className="text-[10px] text-slate-600 leading-relaxed">
                <strong className="text-indigo-600">Note:</strong> Questions are pulled from the project's annotationQuestions configuration.
              </p>
            </div>
          </div>
        );

      case 'TEXTAREA':
        return (
          <div className="px-4 py-3 space-y-3">
            <Field label="Rows">
              <input type="number" value={(widget as any).rows || 4} onChange={(e) => onUpdate({ rows: parseInt(e.target.value) } as any)} min={2} max={20} className={inputClass} />
            </Field>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={(widget as any).showCharCount || false} onChange={(e) => onUpdate({ showCharCount: e.target.checked } as any)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5" />
              <span className="text-[11px] text-slate-600">Show character count</span>
            </label>
          </div>
        );

      case 'SELECT':
      case 'MULTI_SELECT':
      case 'RADIO_GROUP':
        return (
          <div className="px-4 py-3">
            <OptionsEditor widget={widget} onUpdate={onUpdate} />
          </div>
        );

      case 'RATING':
        return (
          <div className="px-4 py-3 space-y-3">
            <Field label="Max Rating">
              <input type="number" value={(widget as any).maxRating || 5} onChange={(e) => onUpdate({ maxRating: parseInt(e.target.value) } as any)} min={3} max={10} className={inputClass} />
            </Field>
            <Field label="Icon">
              <select value={(widget as any).icon || 'star'} onChange={(e) => onUpdate({ icon: e.target.value } as any)} className={selectClass}>
                <option value="star">Star</option>
                <option value="heart">Heart</option>
                <option value="thumb">Thumb</option>
                <option value="emoji">Emoji</option>
              </select>
            </Field>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={(widget as any).allowHalf || false} onChange={(e) => onUpdate({ allowHalf: e.target.checked } as any)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5" />
              <span className="text-[11px] text-slate-600">Allow half ratings</span>
            </label>
          </div>
        );

      case 'SLIDER':
        return (
          <div className="px-4 py-3 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <Field label="Min">
                <input type="number" value={(widget as any).min || 0} onChange={(e) => onUpdate({ min: parseInt(e.target.value) } as any)} className={inputClass} />
              </Field>
              <Field label="Max">
                <input type="number" value={(widget as any).max || 100} onChange={(e) => onUpdate({ max: parseInt(e.target.value) } as any)} className={inputClass} />
              </Field>
              <Field label="Step">
                <input type="number" value={(widget as any).step || 1} onChange={(e) => onUpdate({ step: parseInt(e.target.value) } as any)} className={inputClass} />
              </Field>
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={(widget as any).showValue || false} onChange={(e) => onUpdate({ showValue: e.target.checked } as any)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5" />
              <span className="text-[11px] text-slate-600">Show current value</span>
            </label>
          </div>
        );

      case 'INSTRUCTION_TEXT':
        return (
          <div className="px-4 py-3 space-y-3">
            <Field label="Content">
              <textarea
                value={(widget as any).content || ''}
                onChange={(e) => onUpdate({ content: e.target.value } as any)}
                rows={4}
                placeholder="Enter instruction text…"
                className={inputClass + ' resize-none font-mono'}
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Format">
                <select value={(widget as any).format || 'text'} onChange={(e) => onUpdate({ format: e.target.value } as any)} className={selectClass}>
                  <option value="text">Plain Text</option>
                  <option value="markdown">Markdown</option>
                  <option value="html">HTML</option>
                </select>
              </Field>
              <Field label="Variant">
                <select value={(widget as any).variant || 'info'} onChange={(e) => onUpdate({ variant: e.target.value } as any)} className={selectClass}>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="success">Success</option>
                  <option value="error">Error</option>
                </select>
              </Field>
            </div>
          </div>
        );

      case 'FILE_VIEWER':
        return (
          <div className="px-4 py-3 space-y-3">
            <Field label="File Type">
              <select value={(widget as any).fileType || 'TEXT'} onChange={(e) => onUpdate({ fileType: e.target.value } as any)} className={selectClass}>
                <option value="TEXT">Text</option>
                <option value="MARKDOWN">Markdown</option>
                <option value="HTML">HTML</option>
                <option value="IMAGE">Image</option>
                <option value="VIDEO">Video</option>
                <option value="AUDIO">Audio</option>
                <option value="CSV">CSV</option>
                <option value="PDF">PDF</option>
              </select>
            </Field>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={(widget as any).allowFullscreen || false} onChange={(e) => onUpdate({ allowFullscreen: e.target.checked } as any)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5" />
              <span className="text-[11px] text-slate-600">Allow fullscreen</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={(widget as any).showControls || false} onChange={(e) => onUpdate({ showControls: e.target.checked } as any)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5" />
              <span className="text-[11px] text-slate-600">Show controls</span>
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  /* ── Position & size ─────────────────────────────────────────────────── */
  const renderPositionAndSize = () => (
    <div className="px-4 py-3 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Field label="X">
          <input type="number" value={widget.position.x} onChange={(e) => onUpdate({ position: { ...widget.position, x: parseInt(e.target.value) || 0 } })} className={inputClass} />
        </Field>
        <Field label="Y">
          <input type="number" value={widget.position.y} onChange={(e) => onUpdate({ position: { ...widget.position, y: parseInt(e.target.value) || 0 } })} className={inputClass} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Width">
          <input type="number" value={widget.size.width} onChange={(e) => onUpdate({ size: { ...widget.size, width: parseInt(e.target.value) || 100 } })} min={100} className={inputClass} />
        </Field>
        <Field label="Height">
          <input type="number" value={widget.size.height} onChange={(e) => onUpdate({ size: { ...widget.size, height: parseInt(e.target.value) || 40 } })} min={40} className={inputClass} />
        </Field>
      </div>
      <Field label="Display Order" hint="Lower numbers appear first">
        <input type="number" value={widget.order} onChange={(e) => onUpdate({ order: parseInt(e.target.value) || 0 })} className={inputClass} />
      </Field>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-600 rounded-md">
            {widget.type.replace(/_/g, ' ')}
          </span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1 truncate">ID: {widget.id.substring(0, 16)}…</p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Basic Properties */}
        <SectionHeader
          title="Properties"
          icon={<Settings2 size={11} />}
          open={openSections.basic}
          onToggle={() => toggle('basic')}
        />
        {openSections.basic && renderBasicProperties()}

        {/* Type-Specific */}
        <SectionHeader
          title="Type Settings"
          icon={<Sliders size={11} />}
          open={openSections.type}
          onToggle={() => toggle('type')}
        />
        {openSections.type && renderTypeSpecificProperties()}

        {/* Position & Size */}
        <SectionHeader
          title="Position & Size"
          icon={<Move size={11} />}
          open={openSections.position}
          onToggle={() => toggle('position')}
        />
        {openSections.position && renderPositionAndSize()}
      </div>

      {/* Delete */}
      <div className="px-4 py-3 border-t border-slate-100 flex-shrink-0">
        <button
          onClick={onDelete}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100
                     border border-red-200 rounded-lg transition-colors"
        >
          <Trash2 size={13} />
          Delete Widget
        </button>
      </div>
    </div>
  );
};

/* ── Options Editor (SELECT / MULTI_SELECT / RADIO_GROUP) ─────────────────── */

const OptionsEditor: React.FC<{ widget: Widget; onUpdate: (u: Partial<Widget>) => void }> = ({
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
    onUpdate({ options: options.filter((_: any, i: number) => i !== index) } as any);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-600">Options</span>
        <button
          onClick={addOption}
          className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-700 font-medium"
        >
          <Plus size={12} /> Add
        </button>
      </div>

      <div className="space-y-1.5 max-h-52 overflow-y-auto">
        {options.map((option: WidgetOption, index: number) => (
          <div key={option.id} className="flex items-center gap-1.5 p-1.5 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex-1 space-y-1">
              <input
                type="text"
                value={option.label}
                onChange={(e) => updateOption(index, { label: e.target.value })}
                placeholder="Label"
                className="w-full px-2 py-1 text-[11px] border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
              <input
                type="text"
                value={option.value}
                onChange={(e) => updateOption(index, { value: e.target.value })}
                placeholder="Value"
                className="w-full px-2 py-1 text-[11px] border border-slate-200 rounded bg-white text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <button
              onClick={() => deleteOption(index)}
              className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>

      {options.length === 0 && (
        <p className="text-[10px] text-slate-400 text-center py-3">No options yet. Click "Add" above.</p>
      )}
    </div>
  );
};
