/**
 * Widget Toolbox Component
 * Displays available widgets that can be dragged onto the canvas
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
} from 'lucide-react';
import { Widget, WidgetType, WidgetDefinition } from '../../types/uiBuilder';

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
      size: { width: 600, height: 400 },
      position: { x: 0, y: 0 },
    },
    configSchema: {},
  },
  {
    type: 'TEXT_INPUT',
    name: 'Text Input',
    description: 'Single-line text input',
    icon: 'Type',
    category: 'input',
    defaultConfig: {
      size: { width: 400, height: 40 },
      position: { x: 0, y: 0 },
    },
    configSchema: {},
  },
  {
    type: 'TEXTAREA',
    name: 'Text Area',
    description: 'Multi-line text input',
    icon: 'AlignLeft',
    category: 'input',
    defaultConfig: {
      size: { width: 400, height: 120 },
      position: { x: 0, y: 0 },
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
      options: [],
    },
    configSchema: {},
  },
  {
    type: 'MULTI_SELECT',
    name: 'Multi Select',
    description: 'Multiple selection dropdown',
    icon: 'CheckSquare',
    category: 'input',
    defaultConfig: {
      size: { width: 300, height: 40 },
      position: { x: 0, y: 0 },
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
      options: [],
      layout: 'vertical',
    },
    configSchema: {},
  },
  {
    type: 'CHECKBOX',
    name: 'Checkbox',
    description: 'Single checkbox',
    icon: 'CheckSquare',
    category: 'input',
    defaultConfig: {
      size: { width: 300, height: 40 },
      position: { x: 0, y: 0 },
    },
    configSchema: {},
  },
  {
    type: 'RATING',
    name: 'Rating',
    description: 'Star rating input',
    icon: 'Star',
    category: 'input',
    defaultConfig: {
      size: { width: 200, height: 40 },
      position: { x: 0, y: 0 },
      maxRating: 5,
      icon: 'star',
    },
    configSchema: {},
  },
  {
    type: 'SLIDER',
    name: 'Slider',
    description: 'Numeric slider input',
    icon: 'Sliders',
    category: 'input',
    defaultConfig: {
      size: { width: 300, height: 60 },
      position: { x: 0, y: 0 },
      min: 0,
      max: 100,
      step: 1,
    },
    configSchema: {},
  },
  {
    type: 'DATE_PICKER',
    name: 'Date Picker',
    description: 'Date/time selection',
    icon: 'Calendar',
    category: 'input',
    defaultConfig: {
      size: { width: 300, height: 40 },
      position: { x: 0, y: 0 },
    },
    configSchema: {},
  },
  {
    type: 'INSTRUCTION_TEXT',
    name: 'Instructions',
    description: 'Instruction or info text',
    icon: 'Info',
    category: 'display',
    defaultConfig: {
      size: { width: 600, height: 60 },
      position: { x: 0, y: 0 },
      content: 'Enter instructions here...',
    },
    configSchema: {},
  },
  {
    type: 'DIVIDER',
    name: 'Divider',
    description: 'Visual separator line',
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
    description: 'Empty space',
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
};

export const WidgetToolbox: React.FC<WidgetToolboxProps> = ({ onAddWidget }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'All Widgets' },
    { id: 'media', name: 'Media' },
    { id: 'input', name: 'Input' },
    { id: 'display', name: 'Display' },
    { id: 'layout', name: 'Layout' },
  ];

  const filteredWidgets =
    selectedCategory === 'all'
      ? widgetDefinitions
      : widgetDefinitions.filter((w) => w.category === selectedCategory);

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
      {/* Category Filter */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Widget Library</h2>
        <div className="flex flex-col gap-1">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-2 text-sm text-left rounded-md transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Widget List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {filteredWidgets.map((widget) => {
            const IconComponent = iconComponents[widget.icon] || FileText;
            return (
              <button
                key={widget.type}
                onClick={() => handleAddWidget(widget)}
                className="w-full p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer text-left group"
                title={widget.description}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-50 rounded-md group-hover:bg-blue-50 transition-colors">
                    <IconComponent size={20} className="text-gray-600 group-hover:text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-700">
                      {widget.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{widget.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-600">
          <strong>Tip:</strong> Click a widget to add it to the canvas. Configure its properties in the right panel.
        </p>
      </div>
    </div>
  );
};
