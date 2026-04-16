import React, { useState } from 'react';

const FONT = { fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' };

export const SchemaNode: React.FC<{ label: string; value: any; depth?: number }> = ({ label, value, depth = 0 }) => {
  const [expanded, setExpanded] = useState(depth < 3);
  const [textExpanded, setTextExpanded] = useState(false);

  if (value === null || value === undefined) {
    return (
      <div className="flex items-center gap-2 py-1" style={{ paddingLeft: `${depth * 16}px` }}>
        <span className="text-muted-foreground" style={FONT}>T</span>
        <span className="text-foreground font-medium" style={FONT}>{label}</span>
        <span className="text-muted-foreground" style={FONT}>null</span>
      </div>
    );
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    const keys = Object.keys(value);
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 py-1 hover:bg-muted/30 w-full text-left transition-colors"
          style={{ paddingLeft: `${depth * 16}px` }}
        >
          <span className="text-accent-foreground" style={FONT}>⛁</span>
          <span className="text-foreground font-medium" style={FONT}>{label}</span>
        </button>
        {expanded && keys.map(key => (
          <SchemaNode key={key} label={key} value={value[key]} depth={depth + 1} />
        ))}
      </div>
    );
  }

  if (Array.isArray(value)) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 py-1 hover:bg-muted/30 w-full text-left transition-colors"
          style={{ paddingLeft: `${depth * 16}px` }}
        >
          <span className="text-accent-foreground" style={FONT}>⛁</span>
          <span className="text-foreground font-medium" style={FONT}>{label}</span>
          <span className="text-muted-foreground" style={{ ...FONT, fontSize: '11px' }}>({value.length})</span>
        </button>
        {expanded && value.map((item, i) => (
          <SchemaNode key={i} label={`[${i}]`} value={item} depth={depth + 1} />
        ))}
      </div>
    );
  }

  const strValue = String(value);
  const isLong = strValue.length > 200;

  if (isLong) {
    return (
      <div style={{ paddingLeft: `${depth * 16}px` }} className="py-1">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground shrink-0" style={FONT}>T</span>
          <span className="text-foreground font-medium shrink-0" style={FONT}>{label}</span>
          <span className="text-muted-foreground" style={{ ...FONT, fontSize: '11px' }}>({strValue.length.toLocaleString()} chars)</span>
          <button onClick={() => setTextExpanded(!textExpanded)} className="text-primary hover:underline shrink-0" style={{ ...FONT, fontSize: '11px' }}>
            {textExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
        {textExpanded ? (
          <pre className="text-muted-foreground mt-1 p-2 bg-muted/20 groove-border overflow-auto max-h-[400px]" style={{ ...FONT, fontSize: '12px', lineHeight: '1.5', whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginLeft: '16px' }}>
            {strValue}
          </pre>
        ) : (
          <div className="text-muted-foreground break-all mt-0.5" style={{ ...FONT, marginLeft: '16px' }}>
            {strValue.substring(0, 200)}…
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 py-1" style={{ paddingLeft: `${depth * 16}px` }}>
      <span className="text-muted-foreground shrink-0" style={FONT}>T</span>
      <span className="text-foreground font-medium shrink-0" style={FONT}>{label}</span>
      <span className="text-muted-foreground break-all" style={FONT}>{strValue}</span>
    </div>
  );
};
