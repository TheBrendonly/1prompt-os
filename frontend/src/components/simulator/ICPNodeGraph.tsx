import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

// ICP profile type matching database schema
export interface ICPProfile {
  id?: string;
  name: string;
  description?: string;
  persona_count: number;
  min_messages: number;
  max_messages: number;
  age_min: number;
  age_max: number;
  gender: 'male' | 'female' | 'any';
  location: string;
  behaviors: string[];
  first_message_sender: 'inbound' | 'engagement' | 'outreach_response' | 'custom';
  first_message_detail: string;
  form_fields: string;
  outreach_message: string;
  lead_trigger: string;
  lead_knowledge: string;
  concerns: string;
  scenario_items: string[];
  test_booking: boolean;
  test_cancellation: boolean;
  test_reschedule: boolean;
  booking_count: number;
  cancel_reschedule_count: number;
  sort_order: number;
}

interface ICPNodeGraphProps {
  icps: ICPProfile[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  simulationName?: string;
}

// Generate a unique color for each ICP based on index
const ICP_COLORS = [
  { main: 'hsl(210, 70%, 55%)', glow: 'hsl(210, 70%, 55% / 0.3)', light: 'hsl(210, 70%, 55% / 0.1)' },
  { main: 'hsl(150, 60%, 45%)', glow: 'hsl(150, 60%, 45% / 0.3)', light: 'hsl(150, 60%, 45% / 0.1)' },
  { main: 'hsl(30, 80%, 55%)',  glow: 'hsl(30, 80%, 55% / 0.3)',  light: 'hsl(30, 80%, 55% / 0.1)' },
  { main: 'hsl(280, 60%, 55%)', glow: 'hsl(280, 60%, 55% / 0.3)', light: 'hsl(280, 60%, 55% / 0.1)' },
  { main: 'hsl(0, 65%, 55%)',   glow: 'hsl(0, 65%, 55% / 0.3)',   light: 'hsl(0, 65%, 55% / 0.1)' },
];

function getICPColor(index: number) {
  return ICP_COLORS[index % ICP_COLORS.length];
}

export function ICPNodeGraph({ icps, selectedIndex, onSelect, simulationName }: ICPNodeGraphProps) {
  // Calculate node positions in a constellation layout around a center point
  const layout = useMemo(() => {
    const cx = 250;
    const cy = 180;
    const radius = 120;
    const count = icps.length;

    if (count === 0) return { center: { x: cx, y: cy }, nodes: [] };

    // Start from top (-90deg) and distribute evenly
    const nodes = icps.map((icp, i) => {
      const angle = (-Math.PI / 2) + (2 * Math.PI * i / count);
      return {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
        icp,
        index: i,
      };
    });

    return { center: { x: cx, y: cy }, nodes };
  }, [icps]);

  const totalPersonas = icps.reduce((sum, icp) => sum + icp.persona_count, 0);

  if (icps.length === 0) {
    return (
      <div className="groove-border bg-card p-8 text-center">
        <p className="text-muted-foreground field-text">No ICP profiles generated yet.</p>
      </div>
    );
  }

  return (
    <div className="groove-border bg-card overflow-hidden">
      {/* SVG constellation */}
      <div className="relative" style={{ height: '360px' }}>
        <svg
          viewBox="0 0 500 360"
          className="w-full h-full"
          style={{ imageRendering: 'auto' }}
        >
          {/* Connection lines from center to each node */}
          {layout.nodes.map((node, i) => {
            const color = getICPColor(i);
            const isSelected = selectedIndex === i;
            return (
              <line
                key={`line-${i}`}
                x1={layout.center.x}
                y1={layout.center.y}
                x2={node.x}
                y2={node.y}
                stroke={isSelected ? color.main : 'hsl(var(--border))'}
                strokeWidth={isSelected ? 2 : 1}
                strokeDasharray={isSelected ? 'none' : '4,4'}
                opacity={isSelected ? 1 : 0.5}
              />
            );
          })}

          {/* Cross-connections between adjacent nodes (constellation effect) */}
          {layout.nodes.length > 2 && layout.nodes.map((node, i) => {
            const next = layout.nodes[(i + 1) % layout.nodes.length];
            return (
              <line
                key={`cross-${i}`}
                x1={node.x}
                y1={node.y}
                x2={next.x}
                y2={next.y}
                stroke="hsl(var(--border))"
                strokeWidth={0.5}
                strokeDasharray="2,6"
                opacity={0.3}
              />
            );
          })}

          {/* Center node (simulation hub) */}
          <g>
            <circle
              cx={layout.center.x}
              cy={layout.center.y}
              r={28}
              fill="hsl(var(--card))"
              stroke="hsl(var(--foreground))"
              strokeWidth={2}
            />
            <text
              x={layout.center.x}
              y={layout.center.y - 4}
              textAnchor="middle"
              fill="hsl(var(--foreground))"
              style={{ fontFamily: "'VT323', monospace", fontSize: '14px' }}
            >
              SIM
            </text>
            <text
              x={layout.center.x}
              y={layout.center.y + 10}
              textAnchor="middle"
              fill="hsl(var(--muted-foreground))"
              style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px' }}
            >
              {totalPersonas} total
            </text>
          </g>

          {/* ICP nodes */}
          {layout.nodes.map((node, i) => {
            const color = getICPColor(i);
            const isSelected = selectedIndex === i;
            const nodeRadius = isSelected ? 36 : 30;

            return (
              <g
                key={`node-${i}`}
                onClick={() => onSelect(i)}
                className="cursor-pointer"
                role="button"
                tabIndex={0}
              >
                {/* Glow ring on selected */}
                {isSelected && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={nodeRadius + 6}
                    fill="none"
                    stroke={color.main}
                    strokeWidth={1}
                    opacity={0.4}
                  />
                )}

                {/* Node background */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={nodeRadius}
                  fill={isSelected ? color.light : 'hsl(var(--card))'}
                  stroke={isSelected ? color.main : 'hsl(var(--border))'}
                  strokeWidth={isSelected ? 2 : 1}
                />

                {/* ICP label */}
                <text
                  x={node.x}
                  y={node.y - 6}
                  textAnchor="middle"
                  fill={isSelected ? color.main : 'hsl(var(--foreground))'}
                  style={{ fontFamily: "'VT323', monospace", fontSize: '13px' }}
                >
                  ICP {i + 1}
                </text>

                {/* Persona count */}
                <text
                  x={node.x}
                  y={node.y + 8}
                  textAnchor="middle"
                  fill="hsl(var(--muted-foreground))"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px' }}
                >
                  {node.icp.persona_count}p
                </text>

                {/* Small persona dots around the node */}
                {Array.from({ length: Math.min(node.icp.persona_count, 5) }).map((_, pi) => {
                  const dotAngle = (-Math.PI / 2) + (2 * Math.PI * pi / Math.min(node.icp.persona_count, 5));
                  const dotRadius = nodeRadius + 14;
                  const dx = node.x + dotRadius * Math.cos(dotAngle);
                  const dy = node.y + dotRadius * Math.sin(dotAngle);
                  return (
                    <circle
                      key={`dot-${i}-${pi}`}
                      cx={dx}
                      cy={dy}
                      r={3}
                      fill={isSelected ? color.main : 'hsl(var(--muted-foreground))'}
                      opacity={isSelected ? 0.8 : 0.3}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      {/* ICP name labels below graph */}
      <div className="px-4 pb-4 flex flex-wrap gap-2 justify-center">
        {icps.map((icp, i) => {
          const color = getICPColor(i);
          const isSelected = selectedIndex === i;
          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              className={cn(
                "px-3 py-1.5 groove-border transition-colors field-text",
                isSelected ? "bg-card" : "bg-card hover:bg-muted/50"
              )}
              style={isSelected ? {
                borderColor: color.main,
                boxShadow: `inset 0 0 0 1px ${color.glow}`,
              } : undefined}
            >
              <span
                className="inline-block w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: color.main }}
              />
              <span className={isSelected ? '' : 'text-muted-foreground'}>
                {icp.name || `ICP ${i + 1}`}
              </span>
              <span className="text-muted-foreground ml-1.5">({icp.persona_count})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
