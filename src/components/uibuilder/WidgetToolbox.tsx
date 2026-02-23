/**
 * Widget Toolbox Component
 * Clean, categorised widget library with click-to-add
 */

import { useState } from 'react';
import {
  FileText,
  Image,
  Video,
  Music,
  CheckSquare,
  Circle,
  AlignLeft,
  Star,
  Sliders,
  Calendar,
  Info,
  Minus,
  Box,
  Type,
  List,
  HelpCircle,
  Search,
  X,
  Plus,
} from 'lucide-react';
import { Widget, WidgetDefinition } from '../../types/uiBuilder';

interface WidgetToolboxProps {
  onAddWidget: (widget: Widget) => void;
}

const widgetDefinitions: WidgetDefinition[] = [
  {
    type: 'FILE_VIEWER',
    name: 'File Viewer',
    description: 'Display uploaded file content',
    icon: 'FileText',
    category: 'media',
    defaultConfig: {
      size: { width: 800, height: 600 },
      position: { x: 0, y: 0 },
      sizePreset: 'full-width',
    },
    configSchema: {},
  },
  {
    type: 'QUESTION',
    name: 'Question Widget',
    description: 'Renders questions from project config',
    icon: 'HelpCircle',
    category: 'input',
    defaultConfig: {
      size: { width: 600, height: 400 },
      position: { x: 0, y: 0 },
      sizePreset: 'large',
      renderMode: 'paginated',
      showProgress: true,
      showNavigation: true,
    },
    configSchema: {},
  },
  {
    type: 'TEXT_INPUT',
    name: 'Text Input',
    description: 'Single-line text field',
    icon: 'Type',
    category: 'input',
    defaultConfig: {
      size: { width: 400, height: 40 },
      position: { x: 0, y: 0 },
      sizePreset: 'medium',
    },
    configSchema: {},
  },
  {
    type: 'TEXTAREA',
    name: 'Text Area',
    description: 'Multi-line text field',
    icon: 'AlignLeft',
    category: 'input',
    defaultConfig: {
      size: { width: 400, height: 120 },
      position: { x: 0, y: 0 },
      sizePreset: 'medium',
      rows: 4,
    },
    configSchema: {},
  },
  {
    type: 'SELECT',
    name: 'Dropdown',
    description: 'Single selection dropdown',
    icon: 'List',
    category: 'input',
    defaultConfig: {
      size: { width: 300, height: 40 },
      position: { x: 0, y: 0 },
      sizePreset: 'medium',
      options: [],
    },
    configSchema: {},
  },
  {
    type: 'MULTI_SELECT',
    name: 'Multi Select',
    description: 'Multiple selection checkboxes',
    icon: 'CheckSquare',
    category: 'input',
    defaultConfig: {
      size: { width: 300, height: 40 },
      position: { x: 0, y: 0 },
      sizePreset: 'medium',
      options: [],
    },
    configSchema: {},
  },
  {
    type: 'RADIO_GROUP',
    name: 'Radio Group',
    description: 'Radio button selection',
    icon: 'Circle',
    category: 'input',
    defaultConfig: {
      size: { width: 300, height: 120 },
      position: { x: 0, y: 0 },
      sizePreset: 'medium',
      options: [],
      layout: 'vertical',
    },
    configSchema: {},
  },
  {
    type: 'CHECKBOX',
    name: 'Checkbox',
    description: 'Single checkbox toggle',
    icon: 'CheckSquare',
    category: 'input',
    defaultConfig: {
      size: { width: 300, height: 40 },
      position: { x: 0, y: 0 },
      sizePreset: 'small',
    },
    configSchema: {},
  },
  {
    type: 'RATING',
    name: 'Rating',
    description: 'Star-based rating input',
    icon: 'Star',
    category: 'input',
    defaultConfig: {
      size: { width: 200, height: 40 },
      position: { x: 0, y: 0 },
      sizePreset: 'small',
      maxRating: 5,
      icon: 'star',
    },
    configSchema: {},
  },
  {
    type: 'SLIDER',
    name: 'Slider',
    description: 'Numeric range slider',
    icon: 'Sliders',
    category: 'input',
    defaultConfig: {
      size: { width: 300, height: 60 },
      position: { x: 0, y: 0 },
      sizePreset: 'medium',
      min: 0,
      max: 100,
      step: 1,
    },
    configSchema: {},
  },
  {
    type: 'DATE_PICKER',
    name: 'Date Picker',
    description: 'Date / time selection',
    icon: 'Calendar',
    category: 'input',
    defaultConfig: {
      size: { width: 300, height: 40 },
      position: { x: 0, y: 0 },
      sizePreset: 'medium',
    },
    configSchema: {},
  },
  {
    type: 'INSTRUCTION_TEXT',
    name: 'Instructions',
    description: 'Informational text block',
    icon: 'Info',
    category: 'display',
    defaultConfig: {
      size: { width: 600, height: 60 },
      position: { x: 0, y: 0 },
      sizePreset: 'full-width',
      content: 'Enter instructions here...',
    },
    configSchema: {},
  },
  {
    type: 'DIVIDER',
    name: 'Divider',
    description: 'Horizontal separator',
    icon: 'Minus',
    category: 'layout',
    defaultConfig: {
      size: { width: 600, height: 2 },
      position: { x: 0, y: 0 },
    },
    configSchema: {},
  },
  {
    type: 'SPACER',
    name: 'Spacer',
    description: 'Vertical spacing',
    icon: 'Box',
    category: 'layout',
    defaultConfig: {
      size: { width: 600, height: 20 },
      position: { x: 0, y: 0 },
    },
    configSchema: {},
  },
  {
    type: 'CONTAINER',
    name: 'Container',
    description: 'Group widgets together',
    icon: 'Box',
    category: 'layout',
    defaultConfig: {
      size: { width: 600, height: 300 },
      position: { x: 0, y: 0 },
      children: [],
      layout: 'vertical',
    },
    configSchema: {},
  },
];

const iconComponents: Record<string, any> = {
  FileText, Image, Video, Music, CheckSquare, Circle, AlignLeft,
  Star, Sliders, Calendar, Info, Minus, Box, Type, List, HelpCircle,
};

const categoryMeta: Record<string, { label: string; color: string }> = {
  media: { label: 'Media', color: 'text-violet-600 bg-violet-50' },
  input: { label: 'Input', color: 'text-blue-600 bg-blue-50' },
  display: { label: 'Display', color: 'text-amber-600 bg-amber-50' },
  layout: { label: 'Layout', color: 'text-emerald-600 bg-emerald-50' },
};

export const WidgetToolbox: React.FC<WidgetToolboxProps> = ({ onAddWidget }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'media', label: 'Media' },
    { id: 'input', label: 'Input' },
    { id: 'display', label: 'Display' },
    { id: 'layout', label: 'Layout' },
  ];

  const filtered = widgetDefinitions.filter((w) => {
    const matchCategory = selectedCategory === 'all' || w.category === selectedCategory;
    const matchSearch =
      !search ||
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.description.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleAddWidget = (definition: WidgetDefinition) => {
    const newWidget: Widget = {
      id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: definition.type,
      label: definition.name,
      required: false,
      disabled: false,
      hidden: false,
      order: 0,
      ...(definition.defaultConfig as any),
    };
    onAddWidget(newWidget);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Widgets</h2>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search widgets…"
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg
                       placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-1">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                selectedCategory === c.id
                  ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Widget list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <div className="space-y-1">
          {filtered.map((widget) => {
            const IconComponent = iconComponents[widget.icon] || FileText;
            const cat = categoryMeta[widget.category] || { label: widget.category, color: 'text-slate-500 bg-slate-50' };
            return (
              <button
                key={widget.type}
                onClick={() => handleAddWidget(widget)}
                className="w-full px-3 py-2.5 rounded-lg border border-transparent hover:border-slate-200 hover:bg-slate-50
                           transition-all text-left group flex items-center gap-3"
                title={widget.description}
              >
                <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${cat.color}`}>
                  <IconComponent size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-700 group-hover:text-slate-900 truncate">{widget.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{widget.description}</p>
                </div>
                <Plus
                  size={14}
                  className="text-slate-300 group-hover:text-indigo-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all"
                />
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-8">
              <p className="text-xs text-slate-400">No widgets match your search.</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer tip */}
      <div className="px-4 py-2.5 border-t border-slate-100 flex-shrink-0">
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Click a widget to add it to the canvas. Configure properties in the right panel.
        </p>
      </div>
    </div>
  );
};
