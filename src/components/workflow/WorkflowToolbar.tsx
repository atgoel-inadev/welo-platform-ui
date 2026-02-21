import { Play, HelpCircle, GitBranch, Filter, CheckCircle, Users, Eye, ShieldCheck } from 'lucide-react';

const stageNodeTypes = [
  {
    type: 'annotationStage',
    label: 'Annotation Stage',
    icon: Users,
    color: 'bg-blue-100 border-blue-400 text-blue-700',
    description: 'Annotators work on tasks',
  },
  {
    type: 'reviewStage',
    label: 'Review Stage',
    icon: Eye,
    color: 'bg-purple-100 border-purple-400 text-purple-700',
    description: 'Reviewers check quality',
  },
  {
    type: 'qaStage',
    label: 'QA Stage',
    icon: ShieldCheck,
    color: 'bg-green-100 border-green-400 text-green-700',
    description: 'Final quality assurance',
  },
];

const flowNodeTypes = [
  {
    type: 'start',
    label: 'Start',
    icon: Play,
    color: 'bg-emerald-100 border-emerald-300 text-emerald-700',
    description: 'Entry point of workflow',
  },
  {
    type: 'question',
    label: 'Question',
    icon: HelpCircle,
    color: 'bg-cyan-100 border-cyan-300 text-cyan-700',
    description: 'Ask questions to users',
  },
  {
    type: 'decision',
    label: 'Decision',
    icon: GitBranch,
    color: 'bg-amber-100 border-amber-300 text-amber-700',
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
    <div className="w-72 bg-white border-r border-gray-200 p-4 overflow-y-auto">
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Workflow Components</h3>
        <p className="text-xs text-gray-600">
          Drag and drop components onto the canvas to build your workflow
        </p>
      </div>

      {/* Workflow Stages Section */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
          Workflow Stages
        </h4>
        <div className="space-y-3">
          {stageNodeTypes.map((node) => {
            const Icon = node.icon;
            return (
              <div
                key={node.type}
                draggable
                onDragStart={(e) => onDragStart(e, node.type)}
                className={`${node.color} border-2 rounded-lg p-3 cursor-move hover:shadow-md transition-all hover:scale-105`}
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
      </div>

      {/* Flow Control Section */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
          Flow Control
        </h4>
        <div className="space-y-3">
          {flowNodeTypes.map((node) => {
            const Icon = node.icon;
            return (
              <div
                key={node.type}
                draggable
                onDragStart={(e) => onDragStart(e, node.type)}
                className={`${node.color} border-2 rounded-lg p-3 cursor-move hover:shadow-md transition-all hover:scale-105`}
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
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Quick Tips</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Drag workflow stages to build annotation pipeline</li>
          <li>• Click a stage to assign users from project team</li>
          <li>• Connect stages to define workflow order</li>
          <li>• Use flow control for conditional logic</li>
        </ul>
      </div>
    </div>
  );
};
