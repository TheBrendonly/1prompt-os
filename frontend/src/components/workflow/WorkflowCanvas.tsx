import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import type { WorkflowNodeData } from '@/types/workflow';
import StaticWorkflowNode, { type NodeExecutionStatus } from './StaticWorkflowNode';
import WorkflowAddNodeMenu from './WorkflowAddNodeMenu';
import { Plus, Minus } from '@/components/icons';
import { cn } from '@/lib/utils';

export interface CanvasNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'find' | 'delay' | 'create_contact' | 'update_contact' | 'text_setter' | 'follow_up' | 'end' | 'add_followup' | 'send_sms' | 'wait_for_reply' | 'engage' | 'drip';
  data: WorkflowNodeData;
  children: string[];
  branchLabels?: { true: string; false: string };
  mergeChildId?: string;
}

interface WorkflowCanvasProps {
  nodes: CanvasNode[];
  selectedNodeId: string | null;
  nodeStatuses?: Map<string, NodeExecutionStatus>;
  activeEdges?: Set<string>;
  highlightedNodeIds?: Set<string>;
  nodeLeadCounts?: Map<string, number>;
  readOnly?: boolean;
  onSelectNode: (nodeId: string) => void;
  onAddNode: (parentId: string | null, nodeType: string, data: Record<string, any>, branch?: 'true' | 'false') => void;
  onDeselectNode: () => void;
  onNodeBadgeClick?: (nodeId: string) => void;
  onDeleteNode?: (nodeId: string) => void;
  footerContent?: React.ReactNode;
  renderCustomNode?: (node: CanvasNode) => React.ReactNode | null;
}

const CONNECTOR_COLOR = 'hsl(var(--muted-foreground))';
const NODE_GAP = 48;

function VerticalLine({ height = NODE_GAP, active = false }: { height?: number; active?: boolean }) {
  return (
    <div className="flex justify-center relative" style={{ height }}>
      <div style={{ width: 2, height: '100%', background: CONNECTOR_COLOR, opacity: 0.4 }} />
      {active && (
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            width: 4,
            height: '100%',
            background: 'linear-gradient(to bottom, hsl(var(--warning)), hsl(var(--success)))',
            borderRadius: 2,
            animation: 'flow-pulse 1s ease-in-out infinite',
          }}
        />
      )}
    </div>
  );
}

/** Squared connector for condition branches using absolute pixel coordinates */
function ConditionBranchConnector({
  containerWidth,
  trueEdgeActive = false,
  falseEdgeActive = false,
}: {
  containerWidth: number;
  trueEdgeActive: boolean;
  falseEdgeActive: boolean;
}) {
  const halfGap = NODE_GAP / 2;
  const cx = containerWidth / 2;
  const leftX = containerWidth * 0.25;
  const rightX = containerWidth * 0.75;

  return (
    <svg width={containerWidth} height={NODE_GAP} className="overflow-visible" style={{ display: 'block' }}>
      {/* TRUE branch: center down → left → down */}
      <path
        d={`M ${cx} 0 L ${cx} ${halfGap} L ${leftX} ${halfGap} L ${leftX} ${NODE_GAP}`}
        fill="none"
        stroke={CONNECTOR_COLOR}
        strokeWidth={2}
        strokeOpacity={0.4}
      />
      {trueEdgeActive && (
        <path
          d={`M ${cx} 0 L ${cx} ${halfGap} L ${leftX} ${halfGap} L ${leftX} ${NODE_GAP}`}
          fill="none"
          stroke="url(#flow-gradient)"
          strokeWidth={4}
          className="animate-pulse"
        />
      )}
      {/* FALSE branch: center down → right → down */}
      <path
        d={`M ${cx} 0 L ${cx} ${halfGap} L ${rightX} ${halfGap} L ${rightX} ${NODE_GAP}`}
        fill="none"
        stroke={CONNECTOR_COLOR}
        strokeWidth={2}
        strokeOpacity={0.4}
      />
      {falseEdgeActive && (
        <path
          d={`M ${cx} 0 L ${cx} ${halfGap} L ${rightX} ${halfGap} L ${rightX} ${NODE_GAP}`}
          fill="none"
          stroke="url(#flow-gradient)"
          strokeWidth={4}
          className="animate-pulse"
        />
      )}
      <defs>
        <linearGradient id="flow-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--warning))" />
          <stop offset="100%" stopColor="hsl(var(--success))" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function MergeBranchConnector({
  containerWidth,
  leftActive = false,
  rightActive = false,
}: {
  containerWidth: number;
  leftActive: boolean;
  rightActive: boolean;
}) {
  const halfGap = NODE_GAP / 2;
  const cx = containerWidth / 2;
  const leftX = containerWidth * 0.25;
  const rightX = containerWidth * 0.75;

  return (
    <svg width={containerWidth} height={NODE_GAP} className="overflow-visible" style={{ display: 'block' }}>
      <path
        d={`M ${leftX} 0 L ${leftX} ${halfGap} L ${cx} ${halfGap} L ${cx} ${NODE_GAP}`}
        fill="none"
        stroke={CONNECTOR_COLOR}
        strokeWidth={2}
        strokeOpacity={0.4}
      />
      {leftActive && (
        <path
          d={`M ${leftX} 0 L ${leftX} ${halfGap} L ${cx} ${halfGap} L ${cx} ${NODE_GAP}`}
          fill="none"
          stroke="url(#merge-flow-gradient)"
          strokeWidth={4}
          className="animate-pulse"
        />
      )}
      <path
        d={`M ${rightX} 0 L ${rightX} ${halfGap} L ${cx} ${halfGap} L ${cx} ${NODE_GAP}`}
        fill="none"
        stroke={CONNECTOR_COLOR}
        strokeWidth={2}
        strokeOpacity={0.4}
      />
      {rightActive && (
        <path
          d={`M ${rightX} 0 L ${rightX} ${halfGap} L ${cx} ${halfGap} L ${cx} ${NODE_GAP}`}
          fill="none"
          stroke="url(#merge-flow-gradient)"
          strokeWidth={4}
          className="animate-pulse"
        />
      )}
      <defs>
        <linearGradient id="merge-flow-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--warning))" />
          <stop offset="100%" stopColor="hsl(var(--success))" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function WorkflowCanvas({ nodes, selectedNodeId, nodeStatuses, activeEdges, highlightedNodeIds, nodeLeadCounts, readOnly, onSelectNode, onAddNode, onDeselectNode, onNodeBadgeClick, onDeleteNode, footerContent, renderCustomNode }: WorkflowCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOrigin = useRef({ x: 0, y: 0 });

  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  const setViewportPan = useCallback((nextPan: { x: number; y: number }) => {
    panRef.current = nextPan;
    setPan(nextPan);
  }, []);

  const setViewportZoom = useCallback((nextZoom: number) => {
    zoomRef.current = nextZoom;
    setZoom(nextZoom);
  }, []);

  const setViewport = useCallback((nextZoom: number, nextPan: { x: number; y: number }) => {
    zoomRef.current = nextZoom;
    panRef.current = nextPan;
    setZoom(nextZoom);
    setPan(nextPan);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInteractive = target.closest('[data-workflow-interactive]');
    if (e.button === 1 || (e.button === 0 && !isInteractive)) {
      isPanning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY };
      panOrigin.current = { x: panRef.current.x, y: panRef.current.y };
      e.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setViewportPan({ x: panOrigin.current.x + dx, y: panOrigin.current.y + dy });
  }, [setViewportPan]);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const prevZoom = zoomRef.current;
      const nextZoom = Math.min(2, Math.max(0.3, prevZoom * Math.exp(-e.deltaY * 0.002)));
      const scale = nextZoom / prevZoom;
      const prevPan = panRef.current;
      const nextPan = {
        x: mx - scale * (mx - prevPan.x),
        y: my - scale * (my - prevPan.y),
      };
      setViewport(nextZoom, nextPan);
    } else {
      const prevPan = panRef.current;
      setViewportPan({
        x: prevPan.x - e.deltaX,
        y: prevPan.y - e.deltaY,
      });
    }
  }, [setViewport, setViewportPan]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const prevent = (e: WheelEvent) => e.preventDefault();
    el.addEventListener('wheel', prevent, { passive: false });
    return () => el.removeEventListener('wheel', prevent);
  }, []);

  const nodeMap = useMemo(() => {
    const map = new Map<string, CanvasNode>();
    nodes.forEach(n => map.set(n.id, n));
    return map;
  }, [nodes]);

  const rootIds = useMemo(() => {
    const childIds = new Set<string>();
    nodes.forEach(n => n.children.forEach(c => childIds.add(c)));
    return nodes.filter(n => !childIds.has(n.id)).map(n => n.id);
  }, [nodes]);

  const rootId = rootIds[0] || null;

  function getNodeStatus(nodeId: string): NodeExecutionStatus {
    return nodeStatuses?.get(nodeId) || 'idle';
  }

  function isEdgeActive(parentId: string, childId: string): boolean {
    return activeEdges?.has(`${parentId}->${childId}`) || false;
  }

  // Branch column width: node width (260) + horizontal gap (48)
  const BRANCH_COL_WIDTH = 260 + NODE_GAP;

  function renderNode(nodeId: string, parentId?: string): React.ReactNode {
    const node = nodeMap.get(nodeId);
    if (!node) return null;

    // Custom node rendering (e.g. add_followup button)
    if (renderCustomNode) {
      const custom = renderCustomNode(node);
      if (custom !== null) {
        const childId = node.children[0];
        const child = childId ? nodeMap.get(childId) : null;
        return (
          <div className="flex flex-col items-center pointer-events-auto" key={node.id}>
            {custom}
            {child && (
              <>
                <VerticalLine height={NODE_GAP} />
                {renderNode(child.id, node.id)}
              </>
            )}
          </div>
        );
      }
    }

    if (node.type === 'condition' && node.mergeChildId) {
      const falseChild = node.children[1] ? nodeMap.get(node.children[1]) : null;
      const mergeChild = nodeMap.get(node.mergeChildId);
      const trueEdgeActive = isEdgeActive(node.id, node.mergeChildId);
      const falseEdgeActive = node.children[1] ? isEdgeActive(node.id, node.children[1]) : false;
      const mergeEdgeActive = falseChild ? isEdgeActive(falseChild.id, node.mergeChildId) : false;
      const totalWidth = BRANCH_COL_WIDTH * 2;
      // Check if the "Existing Lead" (true branch / merge path) should be highlighted
      const existingLeadHighlighted = highlightedNodeIds?.has('eng-existing-lead') ?? false;
      const existingLeadStatus = nodeStatuses?.get('eng-existing-lead') ?? 'idle';
      const highlighted = highlightedNodeIds?.has(node.id) ?? false;
      const existingLeadCompleted = nodeStatuses?.get(node.id) === 'completed' && !highlightedNodeIds?.has(node.children[1] || '');

      return (
        <div className="flex flex-col items-center pointer-events-auto" key={node.id}>
          <StaticWorkflowNode
            nodeType={node.type}
            data={node.data}
            selected={selectedNodeId === node.id}
            executionStatus={getNodeStatus(node.id)}
            highlighted={highlightedNodeIds?.has(node.id) ?? false}
            leadCount={nodeLeadCounts?.get(node.id)}
            onClick={() => onSelectNode(node.id)}
            onBadgeClick={onNodeBadgeClick ? () => onNodeBadgeClick(node.id) : undefined}
          />
          <ConditionBranchConnector
            containerWidth={totalWidth}
            trueEdgeActive={trueEdgeActive}
            falseEdgeActive={falseEdgeActive}
          />
          <div className="flex justify-center items-stretch" style={{ gap: NODE_GAP }}>
            <div className="flex flex-col items-center flex-1" style={{ width: 260 }}>
              <span className="text-success mb-1" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', textTransform: 'capitalize' }}>
                {node.branchLabels?.true ?? 'True'}
              </span>
              {/* Full block matching Create Lead style */}
              <div className="flex flex-col flex-1 w-full">
                <div
                  data-workflow-interactive
                  className={cn("w-[260px] bg-card cursor-pointer hover:brightness-110", !existingLeadHighlighted && 'groove-border')}
                  style={{
                    borderRadius: 0,
                    ...(existingLeadHighlighted && existingLeadStatus === 'completed' ? {
                      border: '1.5px solid hsl(142 71% 45%)',
                      boxShadow: '0 0 12px rgba(34, 197, 94, 0.3), 0 0 4px rgba(34, 197, 94, 0.3), inset 0 0 16px hsl(142 71% 45% / 0.2)',
                    } : existingLeadHighlighted && existingLeadStatus === 'processing' ? {
                      border: '1.5px solid hsl(var(--warning))',
                      boxShadow: '0 0 12px hsl(var(--warning) / 0.4), 0 0 4px hsl(var(--warning) / 0.3), inset 0 0 16px hsl(var(--warning) / 0.2)',
                    } : {}),
                  }}
                  onClick={() => onSelectNode('eng-existing-lead')}
                >
                  <div
                    className="px-3 py-1.5 flex items-center gap-2"
                    style={{
                      background: 'hsl(var(--border-groove))',
                      color: 'hsl(var(--foreground))',
                      fontFamily: "'VT323', monospace",
                      fontSize: '18px',
                      letterSpacing: '0.06em',
                      borderBottom: '1px solid hsl(var(--border))',
                    }}
                  >
                    {existingLeadCompleted && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--success))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
                    <span className="uppercase">Existing Lead</span>
                  </div>
                  <div className="px-3 py-2">
                    <div className="text-foreground" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }}>Lead Found</div>
                    <div className="text-muted-foreground mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', lineHeight: '1.4' }}>Take this lead and process</div>
                  </div>
                </div>
                {/* Vertical connector line filling remaining height to match right branch */}
                <div className="flex-1 flex justify-center">
                  <div style={{ width: 2, height: '100%', background: CONNECTOR_COLOR, opacity: 0.4, minHeight: 8 }} />
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center" style={{ width: 260 }}>
              <span className="text-destructive mb-1" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', textTransform: 'capitalize' }}>
                {node.branchLabels?.false ?? 'False'}
              </span>
              {falseChild ? renderNode(falseChild.id, node.id) : (
                !readOnly && <WorkflowAddNodeMenu onAdd={(type, data) => onAddNode(node.id, type, data, 'false')} />
              )}
            </div>
          </div>
          {mergeChild && (
            <>
              <MergeBranchConnector
                containerWidth={totalWidth}
                leftActive={trueEdgeActive}
                rightActive={mergeEdgeActive}
              />
              {renderNode(mergeChild.id, node.id)}
            </>
          )}
        </div>
      );
    }

    if (node.type === 'condition' || node.type === 'follow_up') {
      const trueChild = node.children[0] ? nodeMap.get(node.children[0]) : null;
      const falseChild = node.children[1] ? nodeMap.get(node.children[1]) : null;
      const trueEdgeActive = node.children[0] ? isEdgeActive(node.id, node.children[0]) : false;
      const falseEdgeActive = node.children[1] ? isEdgeActive(node.id, node.children[1]) : false;

      // Total width = 2 branch columns + gap between them
      const totalWidth = BRANCH_COL_WIDTH * 2;

      return (
        <div className="flex flex-col items-center pointer-events-auto" key={node.id}>
          <StaticWorkflowNode
            nodeType={node.type}
            data={node.data}
            selected={selectedNodeId === node.id}
            executionStatus={getNodeStatus(node.id)}
            highlighted={highlightedNodeIds?.has(node.id) ?? false}
            leadCount={nodeLeadCounts?.get(node.id)}
            onClick={() => onSelectNode(node.id)}
            onBadgeClick={onNodeBadgeClick ? () => onNodeBadgeClick(node.id) : undefined}
          />
          <ConditionBranchConnector
            containerWidth={totalWidth}
            trueEdgeActive={trueEdgeActive}
            falseEdgeActive={falseEdgeActive}
          />
          <div className="flex justify-center" style={{ gap: NODE_GAP }}>
            <div className="flex flex-col items-center" style={{ width: 260 }}>
              <span className="text-success mb-1" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', textTransform: 'capitalize' }}>{node.branchLabels?.true ?? 'True'}</span>
              {trueChild ? renderNode(trueChild.id, node.id) : (
                !readOnly && <WorkflowAddNodeMenu onAdd={(type, data) => onAddNode(node.id, type, data, 'true')} />
              )}
            </div>
            <div className="flex flex-col items-center" style={{ width: 260 }}>
              <span className="text-destructive mb-1" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', textTransform: 'capitalize' }}>{node.branchLabels?.false ?? 'False'}</span>
              {falseChild ? renderNode(falseChild.id, node.id) : (
                !readOnly && <WorkflowAddNodeMenu onAdd={(type, data) => onAddNode(node.id, type, data, 'false')} />
              )}
            </div>
          </div>
        </div>
      );
    }

    const childId = node.children[0];
    const child = childId ? nodeMap.get(childId) : null;
    const childEdgeActive = childId ? isEdgeActive(node.id, childId) : false;

    return (
      <div className="flex flex-col items-center pointer-events-auto" key={node.id}>
        <StaticWorkflowNode
          nodeType={node.type}
          data={node.data}
          selected={selectedNodeId === node.id}
          executionStatus={getNodeStatus(node.id)}
          highlighted={highlightedNodeIds?.has(node.id) ?? false}
          leadCount={nodeLeadCounts?.get(node.id)}
          onClick={() => onSelectNode(node.id)}
          onBadgeClick={onNodeBadgeClick ? () => onNodeBadgeClick(node.id) : undefined}
        />
        {child ? (
          <>
            <VerticalLine active={childEdgeActive} />
            {renderNode(child.id, node.id)}
          </>
        ) : (
          !readOnly && (
            <>
              <VerticalLine active={childEdgeActive} />
              <WorkflowAddNodeMenu onAdd={(type, data) => onAddNode(node.id, type, data)} />
            </>
          )
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden relative select-none"
      style={{
        backgroundImage: 'radial-gradient(circle, hsl(var(--muted-foreground) / 0.15) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        backgroundPosition: `${pan.x % 20}px ${pan.y % 20}px`,
        cursor: isPanning.current ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          // Deselect node selection only (visual highlight)
        }
      }}
    >
      <div
        className="pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <div
          className="min-h-full flex flex-col items-center py-10 px-6 pointer-events-none"
          style={{ minWidth: 600 }}
        >
          {rootIds.length > 1 ? (() => {
            // Multiple roots — render side by side, then merge into shared child
            // Find the shared child (first child of the first root that all roots share)
            const firstRoot = nodeMap.get(rootIds[0]);
            const sharedChildId = firstRoot?.children[0] || null;

            return (
              <div className="flex flex-col items-center pointer-events-auto">
                <div className="flex items-start justify-center" style={{ gap: NODE_GAP }}>
                  {rootIds.map(rid => {
                    const rNode = nodeMap.get(rid);
                    if (!rNode) return null;
                    // Render the root node without its children (we'll render the shared child below)
                    const customRendered = renderCustomNode ? renderCustomNode(rNode) : null;
                    return (
                      <div key={rid} className="flex flex-col items-center">
                        {customRendered !== null ? customRendered : (
                          <StaticWorkflowNode
                            nodeType={rNode.type}
                            data={rNode.data}
                            selected={selectedNodeId === rNode.id}
                            executionStatus={getNodeStatus(rNode.id)}
                            highlighted={highlightedNodeIds?.has(rNode.id) ?? false}
                            leadCount={nodeLeadCounts?.get(rNode.id)}
                            onClick={() => onSelectNode(rNode.id)}
                            onBadgeClick={onNodeBadgeClick ? () => onNodeBadgeClick(rNode.id) : undefined}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Merge connector lines — straight from each trigger center to shared child center */}
                {(() => {
                  const svgW = rootIds.length * 260 + (rootIds.length - 1) * NODE_GAP;
                  const cx = svgW / 2;
                  const halfGap = NODE_GAP / 2;
                  return (
                    <svg width={svgW} height={NODE_GAP} className="overflow-visible" style={{ display: 'block' }}>
                      {rootIds.map((rid, i) => {
                        const nodeCenter = i * (260 + NODE_GAP) + 130;
                        return (
                          <path
                            key={rid}
                            d={`M ${nodeCenter} 0 L ${nodeCenter} ${halfGap} L ${cx} ${halfGap} L ${cx} ${NODE_GAP}`}
                            fill="none"
                            stroke={CONNECTOR_COLOR}
                            strokeWidth={2}
                            opacity={0.4}
                          />
                        );
                      })}
                    </svg>
                  );
                })()}
                {/* Render the shared child tree */}
                {sharedChildId && renderNode(sharedChildId)}
              </div>
            );
          })() : rootId ? renderNode(rootId) : (
            <div className="flex flex-col items-center gap-4 pt-20 pointer-events-auto">
              <p className="text-muted-foreground uppercase" style={{ fontFamily: "'VT323', monospace", fontSize: '28px', fontWeight: 500 }}>
                Add Trigger
              </p>
              <WorkflowAddNodeMenu triggersOnly showTriggers onAdd={(type, data) => onAddNode(null, type, data)} />
            </div>
          )}
          {footerContent && (
            <div className="pointer-events-auto mt-2 flex justify-center">
              {footerContent}
            </div>
          )}
        </div>
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-3 left-3 bg-card/80 groove-border px-2 py-1 flex items-center gap-2">
        <button
          data-workflow-interactive
          onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}
          className="text-muted-foreground hover:text-foreground"
        ><Minus className="w-3.5 h-3.5" /></button>
        <span className="text-muted-foreground" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }}>
          {Math.round(zoom * 100)}%
        </span>
        <button
          data-workflow-interactive
          onClick={() => setZoom(z => Math.min(2, z + 0.1))}
          className="text-muted-foreground hover:text-foreground"
        ><Plus className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}
