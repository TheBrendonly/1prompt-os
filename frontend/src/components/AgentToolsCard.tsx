import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusTag } from '@/components/StatusTag';
import { toast } from 'sonner';
import { Wrench, ChevronDown, ChevronUp, Loader2, Trash2, Save, Plus, RefreshCw, ExternalLink, Copy, Globe } from '@/components/icons';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ToolParam {
  id: string;
  type: string;
  value_type: string;
  description: string;
  dynamic_variable: string;
  constant_value: string;
  enum: string[] | null;
  is_system_provided: boolean;
  required: boolean;
}

interface ToolData {
  tool_id: string;
  name?: string;
  error?: boolean;
  tool_config?: {
    type: string;
    name: string;
    description: string;
    api_schema?: {
      url: string;
      method: string;
      query_params_schema?: ToolParam[];
      request_body_schema?: {
        id: string;
        type: string;
        description: string;
        properties?: ToolParam[];
      };
    };
    response_timeout_secs?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface AgentToolsCardProps {
  callEdgeFunction: (action: string, extraParams?: Record<string, unknown>) => Promise<any>;
  agentId: string | null;
  toolIds: string[];
  onToolIdsChange: (toolIds: string[]) => void;
}

// Normalize dict-or-array params from ElevenLabs API into array format
function normalizeParams(params: unknown): ToolParam[] {
  if (Array.isArray(params)) return params;
  if (params && typeof params === 'object') {
    return Object.entries(params).map(([key, val]: [string, any]) => ({
      id: key,
      ...val,
    }));
  }
  return [];
}

const TOOL_METHOD_COLORS: Record<string, string> = {
  GET: 'text-green-400',
  POST: 'text-blue-400',
  PUT: 'text-amber-400',
  PATCH: 'text-amber-400',
  DELETE: 'text-red-400',
};

export const AgentToolsCard: React.FC<AgentToolsCardProps> = ({
  callEdgeFunction,
  agentId,
  toolIds,
  onToolIdsChange,
}) => {
  const [tools, setTools] = useState<ToolData[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [editingTool, setEditingTool] = useState<string | null>(null);
  const [editedConfigs, setEditedConfigs] = useState<Record<string, any>>({});
  const [savingTool, setSavingTool] = useState<string | null>(null);
  const [deletingTool, setDeletingTool] = useState<string | null>(null);

  const fetchTools = useCallback(async () => {
    if (!agentId || toolIds.length === 0) return;
    setLoading(true);
    try {
      const data = await callEdgeFunction('list-tools');
      setTools(data.tools || []);
    } catch (err) {
      console.error('Failed to fetch tools:', err);
      toast.error('Failed to load agent tools');
    } finally {
      setLoading(false);
    }
  }, [callEdgeFunction, agentId, toolIds]);

  useEffect(() => {
    if (agentId && toolIds.length > 0) fetchTools();
  }, [agentId, toolIds.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEditStart = (tool: ToolData) => {
    const config = tool.tool_config || {};
    setEditedConfigs(prev => ({
      ...prev,
      [tool.tool_id]: JSON.parse(JSON.stringify(config)),
    }));
    setEditingTool(tool.tool_id);
  };

  const handleEditCancel = (toolId: string) => {
    setEditingTool(null);
    setEditedConfigs(prev => {
      const copy = { ...prev };
      delete copy[toolId];
      return copy;
    });
  };

  const handleSaveTool = async (toolId: string) => {
    const config = editedConfigs[toolId];
    if (!config) return;
    setSavingTool(toolId);
    try {
      await callEdgeFunction('update-tool', { toolId, toolConfig: config });
      toast.success(`Tool "${config.name}" updated successfully`);
      setEditingTool(null);
      await fetchTools();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update tool');
    } finally {
      setSavingTool(null);
    }
  };

  const handleDeleteTool = async (toolId: string) => {
    setDeletingTool(toolId);
    try {
      const data = await callEdgeFunction('delete-tool', { toolId });
      toast.success('Tool deleted successfully');
      onToolIdsChange(data.toolIds || []);
      setTools(prev => prev.filter(t => t.tool_id !== toolId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete tool');
    } finally {
      setDeletingTool(null);
    }
  };

  const updateEditedField = (toolId: string, path: string[], value: unknown) => {
    setEditedConfigs(prev => {
      const config = JSON.parse(JSON.stringify(prev[toolId] || {}));
      let obj = config;
      for (let i = 0; i < path.length - 1; i++) {
        if (!obj[path[i]]) obj[path[i]] = {};
        obj = obj[path[i]];
      }
      obj[path[path.length - 1]] = value;
      return { ...prev, [toolId]: config };
    });
  };

  const updateBodyParam = (toolId: string, paramIndex: number, field: string, value: string) => {
    setEditedConfigs(prev => {
      const config = JSON.parse(JSON.stringify(prev[toolId] || {}));
      if (config.api_schema?.request_body_schema?.properties?.[paramIndex]) {
        config.api_schema.request_body_schema.properties[paramIndex][field] = value;
      }
      return { ...prev, [toolId]: config };
    });
  };

  const renderToolView = (tool: ToolData) => {
    const config = tool.tool_config;
    if (!config || tool.error) {
      return (
        <div className="text-sm text-muted-foreground italic">
          Tool data unavailable (may have been deleted from ElevenLabs)
        </div>
      );
    }

    const schema = config.api_schema;
    const method = schema?.method || 'POST';
    const bodyParams = normalizeParams(schema?.request_body_schema?.properties);
    const queryParams = normalizeParams(schema?.query_params_schema);

    return (
      <div className="space-y-3">
        {/* Endpoint */}
        <div className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-2 font-mono text-sm">
          <span className={`font-bold ${TOOL_METHOD_COLORS[method] || 'text-foreground'}`}>
            {method}
          </span>
          <span className="text-muted-foreground truncate">{schema?.url}</span>
        </div>

        {/* Description */}
        <div>
          <Label className="text-xs text-muted-foreground">Description</Label>
          <p className="text-sm mt-0.5">{config.description}</p>
        </div>

        {/* Query Params */}
        {queryParams.length > 0 && (
          <div>
            <Label className="text-xs text-muted-foreground">Query Parameters</Label>
            <div className="mt-1 space-y-1">
              {queryParams.map((p: ToolParam, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="font-mono text-xs">{p.id}</Badge>
                  <span className="text-muted-foreground">=</span>
                  <span className="font-mono text-xs">{p.constant_value || p.value_type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Body Params */}
        {bodyParams.length > 0 && (
          <div>
            <Label className="text-xs text-muted-foreground">Body Parameters ({bodyParams.length})</Label>
            <div className="mt-1 space-y-1.5">
              {bodyParams.map((p: ToolParam, i: number) => (
                <div key={i} className="flex items-start gap-2 text-sm bg-muted/30 rounded px-2 py-1.5">
                  <Badge variant="outline" className="font-mono text-xs shrink-0 mt-0.5">{p.id}</Badge>
                  <span className="text-muted-foreground text-xs">{p.description}</span>
                  {p.required && <Badge className="text-[10px] h-4 shrink-0 bg-primary/20 text-primary border-0">required</Badge>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeout */}
        <div className="text-xs text-muted-foreground">
          Timeout: {config.response_timeout_secs || 30}s
        </div>
      </div>
    );
  };

  const renderToolEdit = (tool: ToolData) => {
    const config = editedConfigs[tool.tool_id];
    if (!config) return null;

    const bodyParams = normalizeParams(config.api_schema?.request_body_schema?.properties);

    return (
      <div className="space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <Label className="text-xs">Tool Name</Label>
          <Input
            value={config.name || ''}
            onChange={(e) => updateEditedField(tool.tool_id, ['name'], e.target.value)}
            className="h-8 text-sm font-mono"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label className="text-xs">Description</Label>
          <Textarea
            value={config.description || ''}
            onChange={(e) => updateEditedField(tool.tool_id, ['description'], e.target.value)}
            className="min-h-[80px] text-sm"
          />
        </div>

        {/* URL */}
        <div className="space-y-1.5">
          <Label className="text-xs">Webhook URL</Label>
          <Input
            value={config.api_schema?.url || ''}
            onChange={(e) => updateEditedField(tool.tool_id, ['api_schema', 'url'], e.target.value)}
            className="h-8 text-sm font-mono"
          />
        </div>

        {/* Method + Timeout */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Method</Label>
            <Select
              value={config.api_schema?.method || 'POST'}
              onValueChange={(v) => updateEditedField(tool.tool_id, ['api_schema', 'method'], v)}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Timeout (sec)</Label>
            <Input
              type="number"
              value={config.response_timeout_secs || 30}
              onChange={(e) => updateEditedField(tool.tool_id, ['response_timeout_secs'], parseInt(e.target.value) || 30)}
              className="h-8 text-sm"
            />
          </div>
        </div>

        {/* Body Schema Description */}
        <div className="space-y-1.5">
          <Label className="text-xs">Body Schema Description</Label>
          <Textarea
            value={config.api_schema?.request_body_schema?.description || ''}
            onChange={(e) => updateEditedField(tool.tool_id, ['api_schema', 'request_body_schema', 'description'], e.target.value)}
            className="min-h-[60px] text-sm"
          />
        </div>

        {/* Body Parameters */}
        {bodyParams.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs">Body Parameters</Label>
            {bodyParams.map((p: ToolParam, i: number) => (
              <div key={i} className="border border-border rounded-md p-3 space-y-2 bg-muted/20">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Parameter ID</Label>
                    <Input
                      value={p.id}
                      onChange={(e) => updateBodyParam(tool.tool_id, i, 'id', e.target.value)}
                      className="h-7 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Type</Label>
                    <Input
                      value={p.type}
                      onChange={(e) => updateBodyParam(tool.tool_id, i, 'type', e.target.value)}
                      className="h-7 text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Description</Label>
                  <Textarea
                    value={p.description}
                    onChange={(e) => updateBodyParam(tool.tool_id, i, 'description', e.target.value)}
                    className="min-h-[40px] text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => handleSaveTool(tool.tool_id)}
            disabled={savingTool === tool.tool_id}
            className="h-8 gap-1.5"
          >
            {savingTool === tool.tool_id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Save Changes
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEditCancel(tool.tool_id)}
            className="h-8"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Agent Tools
            </CardTitle>
            <CardDescription>
              Webhook tools auto-configured for booking, contacts & appointments. All synced with ElevenLabs.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusTag variant={toolIds.length > 0 ? 'positive' : 'negative'}>
              {toolIds.length} Tool{toolIds.length !== 1 ? 's' : ''} Active
            </StatusTag>
            {toolIds.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={fetchTools}
                disabled={loading}
                className="h-7 w-7 p-0"
                title="Refresh tools from ElevenLabs"
              >
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && tools.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading tools from ElevenLabs...</span>
          </div>
        ) : tools.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Wrench className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Tools will be auto-created when you deploy your agent.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tools.map((tool) => {
              const config = tool.tool_config;
              const isExpanded = expandedTool === tool.tool_id;
              const isEditing = editingTool === tool.tool_id;
              const method = config?.api_schema?.method || 'POST';
              const queryParamsNorm = normalizeParams(config?.api_schema?.query_params_schema);
              const functionType = queryParamsNorm.find(
                (p: ToolParam) => p.id === 'functionType'
              )?.constant_value;

              return (
                <Collapsible
                  key={tool.tool_id}
                  open={isExpanded}
                  onOpenChange={(open) => {
                    setExpandedTool(open ? tool.tool_id : null);
                    if (!open && isEditing) handleEditCancel(tool.tool_id);
                  }}
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-card hover:bg-muted/50 cursor-pointer transition-colors">
                      <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-xs font-bold ${TOOL_METHOD_COLORS[method] || ''}`}>
                            {method}
                          </span>
                          <span className="text-sm font-medium truncate">
                            {config?.name || tool.tool_id}
                          </span>
                        </div>
                        {functionType && (
                          <span className="text-xs text-muted-foreground font-mono">{functionType}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          title="Copy Tool ID"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(tool.tool_id);
                            toast.success('Tool ID copied');
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-1 px-3 py-3 border border-border border-t-0 rounded-b-lg bg-muted/10">
                      {/* Tool ID tag */}
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {tool.tool_id}
                        </Badge>
                      </div>

                      {isEditing ? renderToolEdit(tool) : renderToolView(tool)}

                      {/* Action bar when not editing */}
                      {!isEditing && !tool.error && (
                        <>
                          <Separator className="my-3" />
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditStart(tool)}
                              className="h-7 text-xs gap-1"
                            >
                              <Wrench className="h-3 w-3" /> Edit Tool
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                                  disabled={deletingTool === tool.tool_id}
                                >
                                  {deletingTool === tool.tool_id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3 w-3" />
                                  )}
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Tool?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete "{config?.name}" from ElevenLabs and unlink it from the agent.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteTool(tool.tool_id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete Tool
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
