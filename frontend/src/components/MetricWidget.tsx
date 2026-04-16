import React from 'react';
import { useCreatorMode } from '@/hooks/useCreatorMode';
import { MetricEditPopover } from './MetricEditPopover';
type LucideIcon = React.FC<React.SVGProps<SVGSVGElement> & { size?: number | string }>;

interface MetricWidgetProps {
  clientId: string;
  name: string;
  value: string | number | null | undefined;
  color: string;
  Icon: LucideIcon;
  metricId?: string;
  isCustom?: boolean;
  onColorChange: (color: string) => void;
  onDelete: () => void;
}

// HSL helpers
const hexToHsl = (hex: string) => {
  try {
    let c = (hex || '').replace('#', '');
    if (c.length === 3) c = c.split('').map(ch => ch + ch).join('');
    if (c.length !== 6) return { h: 217, s: 91, l: 60 };
    const r = parseInt(c.substring(0, 2), 16) / 255;
    const g = parseInt(c.substring(2, 4), 16) / 255;
    const b = parseInt(c.substring(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h = h / 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  } catch {
    return { h: 217, s: 91, l: 60 };
  }
};

const hslA = (hex: string, a: number) => {
  const { h, s, l } = hexToHsl(hex);
  return `hsl(${h} ${s}% ${l}% / ${a})`;
};

export function MetricWidget({
  clientId,
  name,
  value,
  color,
  Icon,
  metricId,
  isCustom = false,
  onColorChange,
  onDelete
}: MetricWidgetProps) {
  const { cb, cbHeavy } = useCreatorMode();
  const displayValue = value !== undefined && value !== null ? String(value) : 'N/A';

  return (
    <div 
      className="p-4 relative"
      style={{ 
        position: 'relative',
        backgroundColor: hslA(color, 0.08),
        border: `1px solid ${hslA(color, 0.4)}`,
        borderTop: `3px solid ${hslA(color, 0.8)}`,
      }}
    >
      <MetricEditPopover
        clientId={clientId}
        metricName={name}
        metricId={metricId}
        currentColor={color}
        isCustom={isCustom}
        onColorChange={onColorChange}
        onDelete={onDelete}
      />
      <div className="flex items-center gap-3">
        <div 
          className="p-2" 
          style={{ backgroundColor: hslA(color, 0.15) }}
        >
          <Icon 
            className="w-5 h-5 text-muted-foreground" 
          />
        </div>
        <div 
          className="text-muted-foreground"
          style={{ 
            fontFamily: "'IBM Plex Mono', monospace", 
            fontSize: '9px', 
            fontWeight: 500, 
            letterSpacing: '2px', 
            textTransform: 'uppercase' as const,
          }}
        >
          {name}
        </div>
      </div>
      <div className="-mx-4 my-3" style={{ borderBottom: '1px dashed hsl(var(--border))' }} />
      <div 
        className={`text-foreground ${cbHeavy}`}
        style={{ 
          fontFamily: "'VT323', monospace", 
          fontSize: '40px', 
          fontWeight: 400, 
          letterSpacing: '1px',
          lineHeight: 1 
        }}
      >
        {displayValue}
      </div>
    </div>
  );
}
