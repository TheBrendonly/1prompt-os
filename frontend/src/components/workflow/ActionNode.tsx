import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Webhook } from '@/components/icons';
import type { WebhookActionData } from '@/types/workflow';

function ActionNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as WebhookActionData;
  return (
    <div
      className={`min-w-[220px] groove-border bg-card transition-colors ${
        selected ? 'border-2' : ''
      }`}
      style={{ borderColor: selected ? 'hsl(var(--cyan-accent))' : undefined }}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-primary !border-2 !border-card"
      />

      {/* Header */}
      <div
        className="px-3 py-1.5 flex items-center gap-2"
        style={{
          background: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
          fontFamily: "'VT323', monospace",
          fontSize: '18px',
          letterSpacing: '0.06em',
        }}
      >
        <Webhook className="w-4 h-4" />
        <span className="uppercase">Webhook</span>
      </div>

      {/* Body */}
      <div className="px-3 py-2">
        <div
          className="text-foreground font-medium"
          style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }}
        >
          {nodeData.label || 'Webhook Action'}
        </div>
        {nodeData.url && (
          <div
            className="text-muted-foreground mt-1 truncate max-w-[200px]"
            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px' }}
          >
            {nodeData.method} {nodeData.url}
          </div>
        )}
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-primary !border-2 !border-card"
      />
    </div>
  );
}

export default memo(ActionNode);
