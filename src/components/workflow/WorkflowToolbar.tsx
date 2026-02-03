import { Play, HelpCircle, GitBranch, Filter, CheckCircle } from 'lucide-react';

const nodeTypes = [
  {
    type: 'start',
    label: 'Start',
    icon: Play,
    color: 'bg-green-100 border-green-300 text-green-700',
    description: 'Entry point of workflow',
  },
  {
    type: 'question',
    label: 'Question',
    icon: HelpCircle,
    color: 'bg-blue-100 border-blue-300 text-blue-700',
    description: 'Ask questions to users',
  },
  {
    type: 'decision',
    label: 'Decision',
    icon: GitBranch,
    color: 'bg-purple-100 border-purple-300 text-purple-700',
    description: 'Branch based on conditions',
  },
  {
    type: 'condition',
    label: 'Condition',
    icon: Filter,
    color: 'bg-orange-100 border-orange-300 text-orange-700',
    description: 'Evaluate expressions',
  },
  {
    type: 'end',
    label: 'End',
    icon: CheckCircle,
    color: 'bg-red-100 border-red-300 text-red-700',
    description: 'Complete workflow',
  },
];

export const WorkflowToolbar = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Node Types</h3>
        <p className="text-xs text-gray-600">
          Drag and drop nodes onto the canvas to build your workflow
        </p>
      </div>

      <div className="space-y-3">
        {nodeTypes.map((node) => {
          const Icon = node.icon;
          return (
            <div
              key={node.type}
              draggable
              onDragStart={(e) => onDragStart(e, node.type)}
              className={`${node.color} border-2 rounded-lg p-3 cursor-move hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4" />
                <span className="font-medium text-sm">{node.label}</span>
              </div>
              <p className="text-xs opacity-75">{node.description}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Quick Tips</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Connect nodes by dragging from one handle to another</li>
          <li>• Click a node to edit its properties</li>
          <li>• Use Decision nodes for branching logic</li>
          <li>• Question nodes can contain multiple questions</li>
        </ul>
      </div>
    </div>
  );
};
