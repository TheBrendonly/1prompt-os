import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Zap } from '@/components/icons';
import type { TriggerNodeData } from '@/types/workflow';

function TriggerNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as TriggerNodeData;
  return (
    <div
      className={`min-w-[220px] groove-border bg-card transition-colors ${
        selected ? 'border-2 border-success' : ''
      }`}
      style={{ borderColor: selected ? 'hsl(var(--success))' : undefined }}
    >
      {/* Header */}
      <div
        className="px-3 py-1.5 flex items-center gap-2"
        style={{
          background: 'hsl(var(--success))',
          color: 'hsl(var(--success-foreground))',
          fontFamily: "'VT323', monospace",
          fontSize: '18px',
          letterSpacing: '0.06em',
        }}
      >
        <Zap className="w-4 h-4" />
        <span className="uppercase">Trigger</span>
      </div>

      {/* Body */}
      <div className="px-3 py-2">
        <div
          className="text-foreground font-medium"
          style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }}
        >
          {nodeData.label || 'Select Trigger'}
        </div>
        {nodeData.description && (
          <div
            className="text-muted-foreground mt-1"
            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px' }}
          >
            {nodeData.description}
          </div>
        )}
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-success !border-2 !border-card"
      />
    </div>
  );
}

export default memo(TriggerNode);
