import { Zap, Webhook, Filter, Search, Clock, UserPlus, UserCheck, Bot, MessageSquareText, CheckCircle, MessageSquare, Hourglass, Users, Layers, Trash2 } from '@/components/icons';
import type { WorkflowNodeData, TriggerNodeData, WebhookActionData, ConditionNodeData, FindContactActionData, DelayActionData, CreateContactActionData, UpdateContactActionData, SendSmsActionData, WaitForReplyActionData } from '@/types/workflow';

export type NodeExecutionStatus = 'idle' | 'processing' | 'completed' | 'failed' | 'skipped' | 'cancelled';

const fieldStyle = { fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' } as const;
const headerStyle = {
  fontFamily: "'VT323', monospace",
  fontSize: '18px',
  letterSpacing: '0.06em',
} as const;

interface StaticWorkflowNodeProps {
  nodeType: string;
  data: WorkflowNodeData;
  selected: boolean;
  executionStatus?: NodeExecutionStatus;
  highlighted?: boolean;
  leadCount?: number;
  onClick: () => void;
  onBadgeClick?: () => void;
  onDelete?: () => void;
}

export default function StaticWorkflowNode({ nodeType, data, selected, executionStatus = 'idle', highlighted = false, leadCount, onClick, onBadgeClick, onDelete }: StaticWorkflowNodeProps) {
  const getHeaderConfig = () => {
    const grey = { bg: 'hsl(var(--border-groove))', fg: 'hsl(var(--foreground))', accent: 'hsl(var(--muted-foreground))' };
    switch (nodeType) {
      case 'trigger': return { ...grey, bg: 'hsl(var(--success))', fg: 'hsl(var(--success-foreground))', icon: <Zap className="w-4 h-4" />, title: (data as any).headerTitle || 'Trigger', accent: 'hsl(var(--success))' };
      case 'action': return { ...grey, icon: <Webhook className="w-4 h-4" />, title: 'Webhook' };
      case 'condition': return { ...grey, icon: <Filter className="w-4 h-4" />, title: 'Condition' };
      case 'find': return { ...grey, icon: <Search className="w-4 h-4" />, title: 'Find Lead' };
      case 'delay': return { ...grey, icon: <Clock className="w-4 h-4" />, title: 'Delay' };
      case 'create_contact': return { ...grey, icon: <UserPlus className="w-4 h-4" />, title: 'New Lead' };
      case 'update_contact': return { ...grey, icon: <UserCheck className="w-4 h-4" />, title: 'Update Lead' };
      case 'text_setter': return { ...grey, bg: 'hsl(228 60% 50%)', fg: 'hsl(0 0% 100%)', icon: <Bot className="w-4 h-4" />, title: 'Text Setter', accent: 'hsl(228 60% 50%)' };
      case 'follow_up': return { ...grey, icon: <Clock className="w-4 h-4" />, title: (data as any).headerTitle || 'Follow-Up Delay' };
      case 'end': return { ...grey, bg: 'hsl(var(--destructive))', fg: 'hsl(var(--destructive-foreground))', icon: <CheckCircle className="w-4 h-4" />, title: 'End', accent: 'hsl(var(--destructive))' };
      case 'send_sms': return { ...grey, bg: 'hsl(var(--primary))', fg: 'hsl(var(--primary-foreground))', icon: <MessageSquare className="w-4 h-4" />, title: 'Send SMS', accent: 'hsl(var(--primary))' };
      case 'engage': return { ...grey, bg: 'hsl(228 60% 50%)', fg: 'hsl(0 0% 100%)', icon: <MessageSquareText className="w-4 h-4" />, title: 'Engagement', accent: 'hsl(228 60% 50%)' };
      case 'drip': return { ...grey, icon: <Layers className="w-4 h-4" />, title: 'Drip' };
      case 'wait_for_reply': return { ...grey, bg: 'hsl(190, 80%, 50%)', fg: '#000', icon: <Hourglass className="w-4 h-4" />, title: 'Wait for Reply', accent: 'hsl(190, 80%, 50%)' };
      default: return { ...grey, icon: <Zap className="w-4 h-4" />, title: 'Unknown' };
    }
  };

  const config = getHeaderConfig();

  const getStatusStyles = (): React.CSSProperties => {
    switch (executionStatus) {
      case 'processing':
        return {
          border: '1.5px solid hsl(var(--warning))',
          boxShadow: '0 0 8px 0 hsl(var(--warning) / 0.6), inset 0 0 6px 0 hsl(var(--warning) / 0.15)',
        };
      case 'completed':
        return {
          border: '1.5px solid hsl(var(--success))',
          boxShadow: '0 0 8px 0 hsl(var(--success) / 0.6), inset 0 0 6px 0 hsl(var(--success) / 0.15)',
        };
      case 'failed':
        return {
          border: '1.5px solid hsl(var(--destructive))',
          boxShadow: '0 0 8px 0 hsl(var(--destructive) / 0.6), inset 0 0 6px 0 hsl(var(--destructive) / 0.15)',
        };
      case 'cancelled':
        return {
          border: '1.5px solid hsl(var(--destructive))',
          boxShadow: '0 0 8px 0 hsl(var(--destructive) / 0.6), inset 0 0 6px 0 hsl(var(--destructive) / 0.15)',
        };
      case 'skipped':
        return { opacity: 0.5 };
      default:
        return selected ? { border: `1.5px solid ${config.accent}`, boxShadow: `0 0 8px 0 ${config.accent}40, inset 0 0 6px 0 ${config.accent}15` } : {};
    }
  };

  const getStatusBadge = () => {
    switch (executionStatus) {
      case 'processing':
        return (
          <span className="absolute -top-2 -right-2 w-5 h-5 rounded-none bg-warning flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-warning-foreground animate-spin">
              <rect x="11" y="1" width="2" height="5" rx="1" />
              <rect x="11" y="18" width="2" height="5" rx="1" />
              <rect x="1" y="11" width="5" height="2" rx="1" />
              <rect x="18" y="11" width="5" height="2" rx="1" />
              <rect x="4.22" y="3.51" width="2" height="5" rx="1" transform="rotate(-45 5.22 6.01)" />
              <rect x="17.78" y="15.49" width="2" height="5" rx="1" transform="rotate(-45 18.78 17.99)" />
              <rect x="3.51" y="17.78" width="5" height="2" rx="1" transform="rotate(-45 6.01 18.78)" />
              <rect x="15.49" y="4.22" width="5" height="2" rx="1" transform="rotate(-45 17.99 5.22)" />
            </svg>
          </span>
        );
      case 'completed':
        return (
          <span className="absolute -top-2 -right-2 w-5 h-5 rounded-none bg-success flex items-center justify-center">
            <svg viewBox="0 0 16 15" fill="currentColor" shapeRendering="crispEdges" className="w-3 h-3 text-success-foreground">
              <rect x="1" y="5" width="3" height="3" />
              <rect x="3" y="7" width="3" height="3" />
              <rect x="5" y="9" width="3" height="3" />
              <rect x="7" y="7" width="3" height="3" />
              <rect x="9" y="5" width="3" height="3" />
              <rect x="11" y="3" width="3" height="3" />
            </svg>
          </span>
        );
      case 'failed':
      case 'cancelled':
        return (
          <span className="absolute -top-2 -right-2 w-5 h-5 rounded-none bg-destructive flex items-center justify-center">
            <svg viewBox="0 0 16 16" fill="currentColor" shapeRendering="crispEdges" className="w-3 h-3 text-destructive-foreground">
              <rect x="2" y="4" width="3" height="3" />
              <rect x="4" y="6" width="3" height="3" />
              <rect x="6" y="8" width="3" height="3" />
              <rect x="11" y="4" width="3" height="3" />
              <rect x="9" y="6" width="3" height="3" />
              <rect x="7" y="8" width="3" height="3" />
              <rect x="4" y="10" width="3" height="3" />
              <rect x="2" y="12" width="3" height="3" />
              <rect x="9" y="10" width="3" height="3" />
              <rect x="11" y="12" width="3" height="3" />
            </svg>
          </span>
        );
      default:
        return null;
    }
  };

  const renderBody = () => {
    switch (nodeType) {
      case 'trigger': {
        const d = data as TriggerNodeData;
        return (
          <>
            <div className="text-foreground" style={fieldStyle}>{d.label || 'Select Trigger'}</div>
            {d.description && <div className="text-muted-foreground mt-1" style={fieldStyle}>{d.description}</div>}
          </>
        );
      }
      case 'action': {
        const d = data as WebhookActionData;
        return (
          <>
            <div className="text-foreground" style={fieldStyle}>{d.label || 'Webhook Action'}</div>
            {d.url ? (
              <div className="text-muted-foreground mt-1 truncate" style={fieldStyle}>{d.method} {d.url}</div>
            ) : d.description ? (
              <div className="text-muted-foreground mt-1" style={{ ...fieldStyle, whiteSpace: 'normal', lineHeight: '1.4' }}>{d.description}</div>
            ) : null}
          </>
        );
      }
      case 'condition': {
        const d = data as ConditionNodeData;
        return (
          <>
            <div className="text-foreground" style={fieldStyle}>{d.label || 'Condition'}</div>
            {d.description && <div className="text-muted-foreground mt-1" style={{ ...fieldStyle, whiteSpace: 'normal', lineHeight: '1.4' }}>{d.description}</div>}
          </>
        );
      }
      case 'find': {
        const d = data as FindContactActionData;
        return (
          <>
            <div className="text-foreground" style={fieldStyle}>{d.label || 'Find Lead'}</div>
            {d.description && <div className="text-muted-foreground mt-1" style={{ ...fieldStyle, whiteSpace: 'normal', lineHeight: '1.4' }}>{d.description}</div>}
          </>
        );
      }
      case 'delay': {
        const d = data as DelayActionData;
        const summary = d.description
          ? d.description
          : d.delayMode === 'duration'
          ? `Wait ${d.delayValue} ${d.delayUnit}`
          : d.waitUntil ? `Until ${d.waitUntil}` : 'Configure delay...';
        return (
          <>
            <div className="text-foreground" style={fieldStyle}>{d.label || 'Delay'}</div>
            <div className="text-muted-foreground mt-1" style={{ ...fieldStyle, whiteSpace: 'normal', lineHeight: '1.4' }}>{summary}</div>
          </>
        );
      }
      case 'create_contact': {
        const d = data as CreateContactActionData;
        return (
          <>
            <div className="text-foreground" style={fieldStyle}>{d.label || 'Create Lead'}</div>
            {d.description && <div className="text-muted-foreground mt-1" style={{ ...fieldStyle, whiteSpace: 'normal', lineHeight: '1.4' }}>{d.description}</div>}
          </>
        );
      }
      case 'update_contact': {
        const d = data as UpdateContactActionData;
        return (
          <>
            <div className="text-foreground" style={fieldStyle}>{d.label || 'Update Lead'}</div>
            {d.description && <div className="text-muted-foreground mt-1" style={{ ...fieldStyle, whiteSpace: 'normal', lineHeight: '1.4' }}>{d.description}</div>}
          </>
        );
      }
      case 'text_setter': {
        const d = data as any;
        return (
          <>
            <div className="text-foreground" style={fieldStyle}>{d.label || nodeType}</div>
            {d.description && <div className="text-muted-foreground mt-1" style={{ ...fieldStyle, whiteSpace: 'normal', lineHeight: '1.4' }}>{d.description}</div>}
          </>
        );
      }
      case 'follow_up': {
        const d = data as any;
        return (
          <>
            <div className="text-foreground" style={fieldStyle}>{d.label || nodeType}</div>
            {d.description && <div className="text-muted-foreground mt-1" style={{ ...fieldStyle, whiteSpace: 'normal', lineHeight: '1.4' }}>{d.description}</div>}
          </>
        );
      }
      case 'send_sms': {
        const d = data as SendSmsActionData;
        return (
          <>
            <div className="text-foreground" style={fieldStyle}>{d.label || 'Send SMS'}</div>
            {d.description && <div className="text-muted-foreground mt-1" style={{ ...fieldStyle, whiteSpace: 'normal', lineHeight: '1.4' }}>{d.description}</div>}
          </>
        );
      }
      case 'engage': {
        const d = data as any;
        return (
          <>
            <div className="text-foreground" style={fieldStyle}>{d.label || 'Engage'}</div>
            {d.description && <div className="text-muted-foreground mt-1" style={{ ...fieldStyle, whiteSpace: 'normal', lineHeight: '1.4' }}>{d.description}</div>}
          </>
        );
      }
      case 'drip': {
        const d = data as any;
        return (
          <>
            <div className="text-foreground" style={fieldStyle}>{d.label || 'Drip'}</div>
            {d.description && <div className="text-muted-foreground mt-1" style={{ ...fieldStyle, whiteSpace: 'normal', lineHeight: '1.4' }}>{d.description}</div>}
          </>
        );
      }
      case 'wait_for_reply': {
        const d = data as WaitForReplyActionData;
        return (
          <>
            <div className="text-foreground" style={fieldStyle}>{d.label || 'Wait for Reply'}</div>
            {d.description && <div className="text-muted-foreground mt-1" style={{ ...fieldStyle, whiteSpace: 'normal', lineHeight: '1.4' }}>{d.description}</div>}
          </>
        );
      }
      case 'end': {
        const d = data as any;
        return (
          <>
            {d.description && <div className="text-muted-foreground" style={{ ...fieldStyle, whiteSpace: 'normal', lineHeight: '1.4' }}>{d.description}</div>}
          </>
        );
      }
      default: return null;
    }
  };

  return (
    <div
      data-workflow-interactive
      className={`w-[260px] bg-card cursor-pointer hover:brightness-110 relative pointer-events-auto ${(highlighted || executionStatus === 'processing' || executionStatus === 'completed' || executionStatus === 'failed' || executionStatus === 'cancelled') ? '' : 'groove-border'}`}
      style={{
        transition: 'box-shadow 0.4s ease, opacity 0.3s ease, border-color 0.3s ease',
        borderRadius: 0,
        ...(highlighted && executionStatus === 'processing' ? {
          border: '1.5px solid hsl(var(--warning))',
          boxShadow: '0 0 12px hsl(var(--warning) / 0.4), 0 0 4px hsl(var(--warning) / 0.3), inset 0 0 16px hsl(var(--warning) / 0.2)',
        } : (executionStatus === 'failed' || executionStatus === 'cancelled') ? getStatusStyles()
        : highlighted ? {
          border: '1.5px solid hsl(142 71% 45%)',
          boxShadow: '0 0 12px rgba(34, 197, 94, 0.3), 0 0 4px rgba(34, 197, 94, 0.3), inset 0 0 16px hsl(142 71% 45% / 0.2)',
        } : getStatusStyles()),
      }}
      onClick={onClick}
    >
      {getStatusBadge()}

      {/* Header */}
      <div
        className="px-3 py-1.5 flex items-center gap-2"
        style={{ background: config.bg, color: config.fg, borderBottom: '1px solid hsl(var(--border))', ...headerStyle }}
      >
        <span>{config.icon}</span>
        <span className="uppercase flex-1">{config.title}</span>
        {onDelete && (
          <button
            data-workflow-interactive
            className="groove-btn groove-btn-destructive !h-8 !w-8 !p-0 !min-h-[32px] !min-w-[32px] flex items-center justify-center ml-auto"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="px-3 py-2">{renderBody()}</div>

      {/* Lead count badge */}
      {leadCount != null && leadCount > 0 && (
        <div
          data-workflow-interactive
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-none cursor-pointer hover:brightness-125 transition-all"
          style={{
            background: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '11px',
            fontWeight: 500,
            zIndex: 10,
          }}
          onClick={(e) => {
            e.stopPropagation();
            onBadgeClick?.();
          }}
        >
          <Users className="w-3 h-3" />
          <span>{leadCount}</span>
        </div>
      )}

      {/* Condition branch labels removed from node — shown on branches instead */}
    </div>
  );
}
