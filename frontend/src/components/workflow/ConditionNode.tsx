import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Filter } from '@/components/icons';
import type { ConditionNodeData } from '@/types/workflow';

function ConditionNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as ConditionNodeData;
  return (
    <div
      className={`min-w-[220px] groove-border bg-card transition-colors ${
        selected ? 'border-2' : ''
      }`}
      style={{ borderColor: selected ? 'hsl(var(--warning))' : undefined }}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-warning !border-2 !border-card"
      />

      {/* Header */}
      <div
        className="px-3 py-1.5 flex items-center gap-2"
        style={{
          background: 'hsl(var(--warning))',
          color: 'hsl(var(--warning-foreground))',
          fontFamily: "'VT323', monospace",
          fontSize: '18px',
          letterSpacing: '0.06em',
        }}
      >
        <Filter className="w-4 h-4" />
        <span className="uppercase">Condition</span>
      </div>

      {/* Body */}
      <div className="px-3 py-2">
        <div
          className="text-foreground font-medium"
          style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }}
        >
          {nodeData.label || 'Condition'}
        </div>
        {nodeData.description ? (
          <div
            className="text-muted-foreground mt-1"
            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px' }}
          >
            {nodeData.description}
          </div>
        ) : nodeData.field ? (
          <div
            className="text-muted-foreground mt-1"
            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px' }}
          >
            {nodeData.field} {nodeData.operator} {nodeData.value}
          </div>
        ) : null}
      </div>

      {/* True / False output handles */}
      <div className="flex justify-between px-3 pb-1">
        <span className="text-success capitalize" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }}>{nodeData.trueLabel || 'True'}</span>
        <span className="text-destructive capitalize" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }}>{nodeData.falseLabel || 'False'}</span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="!w-3 !h-3 !bg-success !border-2 !border-card"
        style={{ left: '30%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="!w-3 !h-3 !bg-destructive !border-2 !border-card"
        style={{ left: '70%' }}
      />
    </div>
  );
}

export default memo(ConditionNode);
