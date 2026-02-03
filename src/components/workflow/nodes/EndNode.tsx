import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CheckCircle } from 'lucide-react';
import { EndNodeData } from '../../../types/workflow';

export const EndNode = memo(({ data }: NodeProps<EndNodeData>) => {
  return (
    <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-lg shadow-lg p-4 min-w-[180px] border-2 border-red-400">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-red-400 border-2 border-white"
      />

      <div className="flex items-center gap-2 text-white">
        <CheckCircle className="w-5 h-5" />
        <div>
          <div className="font-semibold">{data.label}</div>
          {data.message && (
            <div className="text-xs text-red-100 mt-1">{data.message}</div>
          )}
        </div>
      </div>
    </div>
  );
});

EndNode.displayName = 'EndNode';
