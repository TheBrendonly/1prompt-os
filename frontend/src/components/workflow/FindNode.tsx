import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Search } from '@/components/icons';
import type { FindContactActionData } from '@/types/workflow';

function FindNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as FindContactActionData;
  return (
    <div
      className={`min-w-[220px] groove-border bg-card transition-colors ${
        selected ? 'border-2' : ''
      }`}
      style={{ borderColor: selected ? 'hsl(190, 80%, 50%)' : undefined }}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !border-2 !border-card"
        style={{ background: 'hsl(190, 80%, 50%)' }}
      />

      {/* Header */}
      <div
        className="px-3 py-1.5 flex items-center gap-2"
        style={{
          background: 'hsl(190, 80%, 50%)',
          color: '#000',
          fontFamily: "'VT323', monospace",
          fontSize: '18px',
          letterSpacing: '0.06em',
        }}
      >
        <Search className="w-4 h-4" />
        <span className="uppercase">Find Lead</span>
      </div>

      {/* Body */}
      <div className="px-3 py-2">
        <div
          className="text-foreground font-medium"
          style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }}
        >
          {nodeData.label || 'Find Lead'}
        </div>
        {nodeData.description ? (
          <div
            className="text-muted-foreground mt-1"
            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px' }}
          >
            {nodeData.description}
          </div>
        ) : nodeData.contactIdMapping ? (
          <div
            className="text-muted-foreground mt-1 truncate max-w-[200px]"
            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px' }}
          >
            ID: {nodeData.contactIdMapping}
          </div>
        ) : null}
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !border-2 !border-card"
        style={{ background: 'hsl(190, 80%, 50%)' }}
      />
    </div>
  );
}

export default memo(FindNode);
