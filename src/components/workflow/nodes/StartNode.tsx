import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Play } from 'lucide-react';
import { StartNodeData } from '../../../types/workflow';

export const StartNode = memo(({ data }: NodeProps<StartNodeData>) => {
  return (
    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg p-4 min-w-[180px] border-2 border-green-400">
      <div className="flex items-center gap-2 text-white">
        <Play className="w-5 h-5" fill="white" />
        <div className="font-semibold">{data.label}</div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-green-400 border-2 border-white"
      />
    </div>
  );
});

StartNode.displayName = 'StartNode';
