import { usePageHeaderContext } from '@/contexts/PageHeaderContext';
import { Button } from '@/components/ui/button';
import { ChevronRight } from '@/components/icons';
import { StatusTag } from '@/components/StatusTag';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const TITLE_STYLE: React.CSSProperties = {
  fontFamily: "'VT323', monospace",
  fontSize: '22px',
  textTransform: 'uppercase',
  lineHeight: 1,
  letterSpacing: '0.5px',
};

const BREADCRUMB_STYLE: React.CSSProperties = {
  fontFamily: "'VT323', monospace",
  fontSize: '22px',
  textTransform: 'uppercase',
  lineHeight: 1,
  letterSpacing: '0.5px',
};

export function PageHeader() {
  const { config } = usePageHeaderContext();

  if (!config) return null;

  const hasBreadcrumbs = config.breadcrumbs && config.breadcrumbs.length > 0;

  return (
    <div
      className="sticky top-0 z-40 flex-shrink-0 bg-[hsl(224,30%,10%)] text-foreground scanline-header"
      style={{ borderBottom: '3px groove hsl(var(--border-groove))' }}
    >
      <div className={`container mx-auto flex items-center justify-between gap-4 h-[52px] ${config.containerClassName || 'max-w-7xl'}`}>
        {/* Left: Breadcrumbs + Title */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {hasBreadcrumbs ? (
            <div className="flex items-center gap-1.5">
              {config.breadcrumbs!.map((crumb, i) => {
                const isLast = i === config.breadcrumbs!.length - 1;
                return (
                  <span key={i} className="flex items-center gap-1.5">
                    {i > 0 && (
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                    {crumb.onClick ? (
                      <button
                        onClick={crumb.onClick}
                        className="text-muted-foreground hover:text-foreground transition-colors truncate"
                        style={BREADCRUMB_STYLE}
                      >
                        {crumb.label}
                      </button>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span
                          className={isLast ? "text-foreground truncate" : "text-muted-foreground truncate"}
                          style={TITLE_STYLE}
                        >
                          {crumb.label}
                        </span>
                        {crumb.badge && (
                          <StatusTag variant={crumb.badgeVariant || 'positive'}>{crumb.badge}</StatusTag>
                        )}
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          ) : (
            <span className="text-foreground truncate" style={TITLE_STYLE}>
              {config.title}
            </span>
          )}
          {config.leftExtra && config.leftExtra}
        </div>

        {/* Right: Action Buttons */}
        {(config.rightExtra || (config.actions && config.actions.length > 0)) && (
          <div className="flex items-center gap-3 flex-shrink-0">
            {config.rightExtra}
            {config.actions?.map((action, i) => {
              const btn = (
                <Button
                  key={i}
                  variant={action.variant || 'outline'}
                  size="sm"
                  onClick={action.onClick}
                  disabled={action.disabled || action.loading}
                  className={`groove-btn !h-8 ${action.className ?? ''}`}
                  style={{ fontFamily: "'VT323', monospace", fontSize: '16px', fontWeight: 'bold' }}
                >
                  {action.icon}
                  {action.hideLabel ? (
                    <span className="hidden sm:inline sm:ml-1.5" style={{ fontFamily: "'VT323', monospace", fontSize: '16px', fontWeight: 'bold' }}>{action.label}</span>
                  ) : (
                    action.label && <span className="ml-1.5" style={{ fontFamily: "'VT323', monospace", fontSize: '16px', fontWeight: 'bold' }}>{action.label}</span>
                  )}
                </Button>
              );

              if (action.tooltip && action.disabled) {
                return (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <span tabIndex={0} className="cursor-not-allowed">{btn}</span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[240px]">
                      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px' }}>{action.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return btn;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
