import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { usePageHeader } from '@/contexts/PageHeaderContext';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';
import { Save, Play, X, ClipboardCheck, Undo, Redo, Power } from '@/components/icons';
import { toast as sonnerToast } from 'sonner';
import { UnsavedChangesDialog } from '@/components/UnsavedChangesDialog';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { StatusTag } from '@/components/StatusTag';
import type { Workflow, WorkflowExecution, WorkflowExecutionStep, WorkflowNodeType, WorkflowEdgeType } from '@/types/workflow';
import type { NodeExecutionStatus } from '@/components/workflow/StaticWorkflowNode';

import WorkflowCanvas, { type CanvasNode } from '@/components/workflow/WorkflowCanvas';
import WorkflowNodeConfig from '@/components/workflow/WorkflowNodeConfig';
import WorkflowExecutionLog from '@/components/workflow/WorkflowExecutionLog';
import WorkflowTestPanel from '@/components/workflow/WorkflowTestPanel';
import WorkflowExecutionDetail from '@/components/workflow/WorkflowExecutionDetail';

type RightPanel = 'config' | 'executions' | 'test' | 'execution-detail' | null;

/* ─── helpers: convert between graph (nodes+edges) ↔ tree (CanvasNode[]) ─── */

function graphToTree(gNodes: WorkflowNodeType[], gEdges: WorkflowEdgeType[]): CanvasNode[] {
  const canvasNodes: CanvasNode[] = gNodes.map(n => ({
    id: n.id,
    type: n.type as CanvasNode['type'],
    data: n.data,
    children: [],
  }));
  const map = new Map(canvasNodes.map(n => [n.id, n]));

  for (const edge of gEdges) {
    const parent = map.get(edge.source);
    if (!parent) continue;
    if (parent.type === 'condition') {
      if (edge.sourceHandle === 'true' || edge.label === 'true') {
        parent.children[0] = edge.target;
      } else {
        parent.children[1] = edge.target;
      }
    } else {
      parent.children.push(edge.target);
    }
  }
  return canvasNodes;
}

function treeToGraph(canvasNodes: CanvasNode[]): { nodes: WorkflowNodeType[]; edges: WorkflowEdgeType[] } {
  const nodes: WorkflowNodeType[] = [];
  const edges: WorkflowEdgeType[] = [];

  let yPos = 0;
  const visited = new Set<string>();
  const map = new Map(canvasNodes.map(n => [n.id, n]));

  const childIds = new Set<string>();
  canvasNodes.forEach(n => n.children.forEach(c => childIds.add(c)));
  const root = canvasNodes.find(n => !childIds.has(n.id));

  function traverse(nodeId: string, x: number) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    const node = map.get(nodeId);
    if (!node) return;

    if (node.type === 'add_followup') return;
    nodes.push({ id: node.id, type: node.type as any, position: { x, y: yPos }, data: node.data });
    yPos += 150;

    if (node.type === 'condition') {
      if (node.children[0]) {
        edges.push({ id: `e-${nanoid(6)}`, source: node.id, target: node.children[0], sourceHandle: 'true', label: 'true' });
        traverse(node.children[0], x - 200);
      }
      if (node.children[1]) {
        edges.push({ id: `e-${nanoid(6)}`, source: node.id, target: node.children[1], sourceHandle: 'false', label: 'false' });
        traverse(node.children[1], x + 200);
      }
    } else {
      node.children.forEach(childId => {
        edges.push({ id: `e-${nanoid(6)}`, source: node.id, target: childId });
        traverse(childId, x);
      });
    }
  }

  if (root) traverse(root.id, 400);
  canvasNodes.forEach(n => {
    if (!visited.has(n.id)) {
      if (n.type === 'add_followup') return;
      nodes.push({ id: n.id, type: n.type as any, position: { x: 400, y: yPos }, data: n.data });
      yPos += 150;
    }
  });

  return { nodes, edges };
}

/* ─── Editor ─── */

export default function WorkflowEditor() {
  const { clientId, workflowId } = useParams<{ clientId: string; workflowId: string }>();
  const navigate = useNavigate();

  const [canvasNodes, setCanvasNodes] = useState<CanvasNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [workflowName, setWorkflowName] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingActionId, setSavingActionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rightPanel, setRightPanel] = useState<RightPanel>(null);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);
  const [executionSteps, setExecutionSteps] = useState<WorkflowExecutionStep[]>([]);
  const [webhookMappingReference, setWebhookMappingReference] = useState<any>(null);
  const [savedCanvasSnapshot, setSavedCanvasSnapshot] = useState<string>('');
  const [pendingNavPath, setPendingNavPath] = useState<string | null>(null);
  const [showToggleActiveDialog, setShowToggleActiveDialog] = useState(false);

  // Undo/redo history
  const [history, setHistory] = useState<{ nodes: CanvasNode[]; name: string }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoRef = useRef(false);

  // Real-time execution trace
  const [nodeStatuses, setNodeStatuses] = useState<Map<string, NodeExecutionStatus>>(new Map());
  const [activeEdges, setActiveEdges] = useState<Set<string>>(new Set());
  const [tracingExecutionId, setTracingExecutionId] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasUnsavedChanges = useCallback(() => {
    return savedCanvasSnapshot !== '' && JSON.stringify(canvasNodes) !== savedCanvasSnapshot;
  }, [canvasNodes, savedCanvasSnapshot]);

  const guardedNavigate = useCallback((path: string) => {
    if (hasUnsavedChanges()) {
      setPendingNavPath(path);
    } else {
      navigate(path);
    }
  }, [hasUnsavedChanges, navigate]);

  usePageHeader({
    title: workflowName || 'Workflow Editor',
    breadcrumbs: [
      { label: 'Workflows', onClick: () => guardedNavigate(`/client/${clientId}/workflows`) },
      { label: workflowName || 'Editor', badge: workflow?.is_active ? 'ACTIVE' : 'DRAFT', badgeVariant: workflow?.is_active ? 'positive' as const : 'neutral' as const },
    ],
  }, [workflow?.is_active, guardedNavigate]);

  useEffect(() => {
    if (!workflowId) return;
    loadWorkflow();
  }, [workflowId]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  async function loadWorkflow() {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .single();

    if (error || !data) {
      toast.error('Workflow not found');
      navigate(`/client/${clientId}/workflows`);
      return;
    }

    const wf = data as Workflow;
    setWorkflow(wf);
    setWorkflowName(wf.name);
    setWebhookMappingReference((data as any).webhook_mapping_reference || null);
    const initialNodes = graphToTree(wf.nodes || [], wf.edges || []);
    setCanvasNodes(initialNodes);
    setSavedCanvasSnapshot(JSON.stringify(initialNodes));
    setHistory([{ nodes: initialNodes, name: wf.name }]);
    setHistoryIndex(0);
    setLoading(false);
  }

  // Unsaved changes guard
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      const hasUnsavedChanges = savedCanvasSnapshot && JSON.stringify(canvasNodes) !== savedCanvasSnapshot;
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [canvasNodes, savedCanvasSnapshot]);

  const pushHistory = useCallback((nodes: CanvasNode[], name?: string) => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }
    setHistory(prev => {
      const truncated = prev.slice(0, historyIndex + 1);
      const next = [...truncated, { nodes: JSON.parse(JSON.stringify(nodes)), name: name || workflowName }];
      if (next.length > 50) next.shift();
      return next;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex, workflowName]);

  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    isUndoRedoRef.current = true;
    const snapshot = history[newIndex];
    setCanvasNodes(JSON.parse(JSON.stringify(snapshot.nodes)));
    setWorkflowName(snapshot.name);
    setHistoryIndex(newIndex);
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    isUndoRedoRef.current = true;
    const snapshot = history[newIndex];
    setCanvasNodes(JSON.parse(JSON.stringify(snapshot.nodes)));
    setWorkflowName(snapshot.name);
    setHistoryIndex(newIndex);
  }, [historyIndex, history]);


  async function handleSave() {
    if (!workflowId) return;
    setSaving(true);

    const { nodes: serializedNodes, edges: serializedEdges } = treeToGraph(canvasNodes);

    const { error } = await (supabase as any)
      .from('workflows')
      .update({
        name: workflowName,
        nodes: serializedNodes,
        edges: serializedEdges,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', workflowId);

    if (error) toast.error('Failed to publish workflow');
    else {
      toast.success('Workflow published');
      setSavedCanvasSnapshot(JSON.stringify(canvasNodes));
      if (workflow) (workflow as any).is_active = true;
    }
    setSaving(false);
  }

  const saveWorkflowSnapshot = useCallback(async (nextCanvasNodes: CanvasNode[], nextWorkflowName = workflowName) => {
    if (!workflowId) return false;

    const { nodes: serializedNodes, edges: serializedEdges } = treeToGraph(nextCanvasNodes);
    const { error } = await (supabase as any)
      .from('workflows')
      .update({
        name: nextWorkflowName,
        nodes: serializedNodes,
        edges: serializedEdges,
        updated_at: new Date().toISOString(),
      })
      .eq('id', workflowId);

    if (!error) setSavedCanvasSnapshot(JSON.stringify(nextCanvasNodes));
    return !error;
  }, [workflowId, workflowName]);

  const handleSaveAction = useCallback(async (nodeId: string) => {
    setSavingActionId(nodeId);
    const ok = await saveWorkflowSnapshot(canvasNodes);
    if (ok) {
      toast.success('Action saved');
    } else {
      toast.error('Failed to save action');
    }
    setSavingActionId(null);
  }, [canvasNodes, saveWorkflowSnapshot]);

  /* ─── Real-time execution trace ─── */

  function startExecutionTrace(executionId: string) {
    clearExecutionOverlay();
    setTracingExecutionId(executionId);

    const parentChildMap = new Map<string, string[]>();
    canvasNodes.forEach(n => {
      n.children.forEach(c => {
        if (!parentChildMap.has(n.id)) parentChildMap.set(n.id, []);
        parentChildMap.get(n.id)!.push(c);
      });
    });

    const poll = async () => {
      try {
        const { data: steps } = await (supabase as any)
          .from('workflow_execution_steps')
          .select('*')
          .eq('execution_id', executionId)
          .order('started_at', { ascending: true });

        if (!steps || steps.length === 0) return;

        const newStatuses = new Map<string, NodeExecutionStatus>();
        const newEdges = new Set<string>();

        for (const step of steps as WorkflowExecutionStep[]) {
          const status = step.status as string;
          if (status === 'completed') {
            newStatuses.set(step.node_id, 'completed');
            const children = parentChildMap.get(step.node_id) || [];
            children.forEach(childId => newEdges.add(`${step.node_id}->${childId}`));
          } else if (status === 'running') {
            newStatuses.set(step.node_id, 'processing');
          } else if (status === 'failed') {
            newStatuses.set(step.node_id, 'failed');
          } else if (status === 'skipped') {
            newStatuses.set(step.node_id, 'skipped');
          }
        }

        setNodeStatuses(newStatuses);
        setActiveEdges(newEdges);

        const { data: execData } = await (supabase as any)
          .from('workflow_executions')
          .select('status')
          .eq('id', executionId)
          .single();

        if (execData && (execData.status === 'completed' || execData.status === 'failed')) {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          setTimeout(() => setActiveEdges(new Set()), 1500);

          if (execData.status === 'completed') {
            toast.success('Workflow execution completed');
          } else {
            toast.error('Workflow execution failed');
          }

          // Auto-load the execution details to show errors
          const { data: finalSteps } = await (supabase as any)
            .from('workflow_execution_steps')
            .select('*')
            .eq('execution_id', executionId)
            .order('started_at', { ascending: true });

          if (finalSteps) {
            const exec: WorkflowExecution = {
              id: executionId,
              workflow_id: workflowId!,
              client_id: clientId!,
              status: execData.status,
              trigger_type: '',
              trigger_data: {},
              started_at: new Date().toISOString(),
              completed_at: new Date().toISOString(),
              error_message: null,
            };
            setSelectedExecution(exec);
            setExecutionSteps(finalSteps as WorkflowExecutionStep[]);
            setRightPanel('execution-detail');
          }
        }
      } catch {
        // Silently handle
      }
    };

    poll();
    pollingRef.current = setInterval(poll, 800);
  }

  const handleSelectNode = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    setRightPanel('config');
  }, []);

  const handleDeselectNode = useCallback(() => {
    setSelectedNodeId(null);
    // Don't close the right panel — user uses the X button to close config
  }, []);

  const handleAddNode = useCallback((parentId: string | null, nodeType: string, data: Record<string, any>, branch?: 'true' | 'false') => {
    const newId = `${nodeType}-${nanoid(8)}`;
    const newNode: CanvasNode = {
      id: newId,
      type: nodeType as CanvasNode['type'],
      data: data as any,
      children: [],
    };

    setCanvasNodes(prev => {
      const next = [...prev, newNode];
      let result: CanvasNode[];
      if (parentId) {
        result = next.map(n => {
          if (n.id !== parentId) return n;
          const children = [...n.children];
          if (n.type === 'condition' && branch) {
            children[branch === 'true' ? 0 : 1] = newId;
          } else {
            children.push(newId);
          }
          return { ...n, children };
        });
      } else {
        result = next;
      }
      pushHistory(result);
      return result;
    });

    setSelectedNodeId(newId);
    setRightPanel('config');
  }, [pushHistory]);

  const handleNodeUpdate = useCallback((nodeId: string, newData: any) => {
    setCanvasNodes(prev => {
      const next = prev.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n);
      // Don't push every keystroke — debounced externally or on blur
      return next;
    });
  }, []);

  const handleNodeDelete = useCallback((nodeId: string) => {
    setCanvasNodes(prev => {
      const next = prev
        .filter(n => n.id !== nodeId)
        .map(n => ({
          ...n,
          children: n.children.map(c => c === nodeId ? '' : c).filter(Boolean),
        }));
      pushHistory(next);
      return next;
    });
    setSelectedNodeId(null);
    setRightPanel(null);
  }, [pushHistory]);

  const handleCloseConfig = useCallback(() => {
    // Push current state as a snapshot when closing (captures field edits)
    pushHistory(canvasNodes);
    setSelectedNodeId(null);
    setRightPanel(null);
  }, [canvasNodes, pushHistory]);

  const fakeNodes = canvasNodes.map(n => ({
    id: n.id,
    type: n.type,
    position: { x: 0, y: 0 },
    data: n.data,
  }));

  const handleSelectExecution = (execution: WorkflowExecution, steps: WorkflowExecutionStep[]) => {
    setSelectedExecution(execution);
    setExecutionSteps(steps);
    setRightPanel('execution-detail');

    const statuses = new Map<string, NodeExecutionStatus>();
    steps.forEach(s => {
      if (s.status === 'completed') statuses.set(s.node_id, 'completed');
      else if (s.status === 'running') statuses.set(s.node_id, 'processing');
      else if (s.status === 'failed') statuses.set(s.node_id, 'failed');
      else if (s.status === 'skipped') statuses.set(s.node_id, 'skipped');
    });
    setNodeStatuses(statuses);
  };

  const clearExecutionOverlay = () => {
    setSelectedExecution(null);
    setExecutionSteps([]);
    setNodeStatuses(new Map());
    setActiveEdges(new Set());
    setTracingExecutionId(null);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const handleEndExecution = useCallback(async (executionId: string) => {
    const { error } = await (supabase as any)
      .from('workflow_executions')
      .update({ status: 'failed', error_message: 'Manually stopped', completed_at: new Date().toISOString() })
      .eq('id', executionId);
    if (error) {
      sonnerToast.error('Failed to end execution');
      throw error;
    }
    setSelectedExecution(prev => prev?.id === executionId ? { ...prev, status: 'failed' as const, error_message: 'Manually stopped', completed_at: new Date().toISOString() } : prev);
    sonnerToast.success('Execution ended');
  }, []);

  const handleTestComplete = useCallback((executionId: string) => {
    startExecutionTrace(executionId);
  }, [canvasNodes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-foreground" style={{ fontFamily: "'VT323', monospace", fontSize: '22px' }}>
          LOADING WORKFLOW...
        </div>
      </div>
    );
  }

  const selectedNode = canvasNodes.find(n => n.id === selectedNodeId) || null;

  const togglePanel = (panel: 'executions' | 'test') => {
    if (rightPanel === panel || (panel === 'executions' && rightPanel === 'execution-detail')) {
      setRightPanel(null);
      clearExecutionOverlay();
    } else {
      clearExecutionOverlay();
      setRightPanel(panel);
    }
  };

  const tabBtnClass = (active: boolean) =>
    `groove-btn !h-8 px-3 flex items-center uppercase transition-colors ${active ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`;
  const tabStyle = { fontFamily: "'VT323', monospace", fontSize: '16px', letterSpacing: '0.06em' } as const;
  return (
    <div className="flex h-full overflow-hidden">
      {/* Center: Canvas area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top toolbar — flush to header */}
        <div
          className="bg-card shrink-0"
          style={{ height: 52, borderBottom: '1px solid hsl(var(--border))' }}
        >
          <div
            className={rightPanel ? "flex items-center h-full" : "container mx-auto max-w-7xl flex items-center h-full"}
            style={rightPanel ? { paddingLeft: 'max(3rem, calc((100vw - 16rem - 80rem) / 2 + 3rem))', paddingRight: 12 } : undefined}
          >
            <span
              className="text-foreground uppercase"
              style={{ fontFamily: "'VT323', monospace", fontSize: '22px' }}
            >
              Edit This Workflow
            </span>

            {tracingExecutionId && (
              <div className="flex items-center gap-2 ml-3">
                <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                <span className="text-warning uppercase" style={{ fontFamily: "'VT323', monospace", fontSize: '14px' }}>
                  LIVE
                </span>
                <button
                  onClick={clearExecutionOverlay}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-center ml-auto" style={{ gap: 12 }}>
              {/* Undo / Redo */}
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="groove-btn !h-8 !w-8 !p-0 !min-h-[32px] !min-w-[32px] flex items-center justify-center bg-muted/50 disabled:opacity-30"
                title="Undo"
              >
                <Undo className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="groove-btn !h-8 !w-8 !p-0 !min-h-[32px] !min-w-[32px] flex items-center justify-center bg-muted/50 disabled:opacity-30"
                title="Redo"
              >
                <Redo className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => togglePanel('executions')}
                className={tabBtnClass(rightPanel === 'executions' || rightPanel === 'execution-detail')}
                style={tabStyle}
              >
                <ClipboardCheck className="w-4 h-4" />
                <span className="ml-1.5">Executions</span>
              </button>
              <button
                onClick={() => togglePanel('test')}
                className={tabBtnClass(rightPanel === 'test')}
                style={tabStyle}
              >
                <Play className="w-4 h-4" />
                <span className="ml-1.5">Test</span>
              </button>
              <button
                onClick={() => setShowToggleActiveDialog(true)}
                className={`groove-btn !h-8 !w-8 !p-0 !min-h-[32px] !min-w-[32px] flex items-center justify-center ${workflow?.is_active ? 'groove-btn-destructive' : 'groove-btn-positive'}`}
                title={workflow?.is_active ? 'Disable workflow' : 'Enable workflow'}
              >
                <Power className="w-4 h-4" />
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="groove-btn groove-btn-positive !h-8 px-3 flex items-center uppercase disabled:opacity-50"
                style={tabStyle}
              >
                <Save className="w-4 h-4" />
                <span className="ml-1.5">{saving ? 'Publishing...' : 'Publish'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Static workflow canvas — no scroll */}
        <WorkflowCanvas
          nodes={canvasNodes}
          selectedNodeId={selectedNodeId}
          nodeStatuses={nodeStatuses}
          activeEdges={activeEdges}
          onSelectNode={handleSelectNode}
          onAddNode={handleAddNode}
          onDeselectNode={handleDeselectNode}
        />
      </div>

      {/* Right Panel — scrolls independently */}
      {rightPanel === 'config' && selectedNode && (
        <WorkflowNodeConfig
          nodeId={selectedNode.id}
          nodeType={selectedNode.type}
          data={selectedNode.data as any}
          allNodes={fakeNodes as any}
          onUpdate={handleNodeUpdate}
          onDelete={handleNodeDelete}
          onClose={handleCloseConfig}
          onSaveAction={selectedNode.type === 'action' || selectedNode.type === 'create_contact' || selectedNode.type === 'update_contact' ? () => handleSaveAction(selectedNode.id) : undefined}
          savingAction={savingActionId === selectedNode.id}
          clientId={clientId}
          workflowId={workflowId}
          webhookMappingReference={webhookMappingReference}
          onSaveMappingReference={async (ref: any) => {
            setWebhookMappingReference(ref);
            if (workflowId) {
              await (supabase as any)
                .from('workflows')
                .update({ webhook_mapping_reference: ref })
                .eq('id', workflowId);
            }
          }}
        />
      )}
      {rightPanel === 'executions' && workflowId && (
        <WorkflowExecutionLog
          workflowId={workflowId}
          onSelectExecution={handleSelectExecution}
          onClose={() => { clearExecutionOverlay(); setRightPanel(null); }}
        />
      )}
      {rightPanel === 'test' && workflowId && clientId && (
        <WorkflowTestPanel
          workflowId={workflowId}
          clientId={clientId}
          nodes={fakeNodes as any}
          onTestComplete={handleTestComplete}
          onClose={() => setRightPanel(null)}
        />
      )}
      {rightPanel === 'execution-detail' && selectedExecution && (
        <WorkflowExecutionDetail
          executionId={selectedExecution.id}
          executionStatus={selectedExecution.status}
          steps={executionSteps}
          onClose={() => { clearExecutionOverlay(); setRightPanel('executions'); }}
          onEndNow={selectedExecution.status === 'running' ? handleEndExecution : undefined}
        />
      )}
      <UnsavedChangesDialog
        open={!!pendingNavPath}
        onOpenChange={(open) => { if (!open) setPendingNavPath(null); }}
        onDiscard={() => {
          if (pendingNavPath) navigate(pendingNavPath);
          setPendingNavPath(null);
        }}
      />
      <DeleteConfirmDialog
        open={showToggleActiveDialog}
        onOpenChange={setShowToggleActiveDialog}
        onConfirm={async () => {
          if (!workflow) return;
          const nextActive = !workflow.is_active;
          const { error } = await (supabase as any)
            .from('workflows')
            .update({ is_active: nextActive, updated_at: new Date().toISOString() })
            .eq('id', workflow.id);
          if (error) {
            toast.error('Failed to update workflow status');
          } else {
            setWorkflow(prev => prev ? { ...prev, is_active: nextActive } : prev);
            toast.success(nextActive ? 'Workflow activated' : 'Workflow disabled');
          }
          setShowToggleActiveDialog(false);
        }}
        title={workflow?.is_active ? 'Disable Workflow' : 'Enable Workflow'}
        itemName={workflowName}
        confirmLabel={workflow?.is_active ? 'Disable' : 'Enable'}
        confirmIcon={<Power className="w-4 h-4 mr-2" />}
        description={workflow?.is_active
          ? 'This will disable the workflow. No new executions will be triggered.'
          : 'This will enable the workflow. Executions will be triggered based on your configured rules.'
        }
      />
    </div>
  );
}
