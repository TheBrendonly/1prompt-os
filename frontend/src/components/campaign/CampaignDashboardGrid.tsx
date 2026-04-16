import React, { useCallback, useMemo, useState } from 'react';
import { useCreatorMode } from '@/hooks/useCreatorMode';
import {
  GridLayout,
  useContainerWidth,
  verticalCompactor,
  type LayoutItem,
  type Layout,
} from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CampaignChartRenderer } from '@/components/campaign/CampaignChartRenderer';
import { Edit, GripVertical, Pencil, Save, Trash2 } from '@/components/icons';

const FONT = { fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' } as const;
const COLS = 4;
const ROW_HEIGHT = 26;
const GRID_MARGIN: [number, number] = [12, 12];

interface DashboardWidget {
  id: string;
  title: string;
  friendly_name?: string;
  widget_type: string;
  width?: string;
  config: any;
  sort_order: number;
  color?: string;
}

interface CampaignDashboardGridProps {
  widgets: DashboardWidget[];
  getStatValue: (widget: DashboardWidget) => string | number;
  getChartData: (widget: DashboardWidget) => any;
  onEditWidget: (widget: DashboardWidget) => void;
  onRenameSeparator: (widgetId: string, newName: string) => void;
  onDeleteSeparator: (widgetId: string) => void;
  onReorder: (widgets: DashboardWidget[]) => void | Promise<void>;
}

function getWidgetSize(widget: DashboardWidget): { w: number; h: number } {
  if (widget.widget_type === 'separator') return { w: COLS, h: 1 };
  if (widget.widget_type === 'number_card') return { w: 1, h: 4 };
  const chartW = widget.width === 'half' ? 2 : COLS;
  return { w: chartW, h: 8 };
}

function widgetsToLayout(widgets: DashboardWidget[]): LayoutItem[] {
  return widgets
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((widget) => {
      const { w, h } = getWidgetSize(widget);
      const slot = widget.sort_order;
      return {
        i: widget.id,
        x: slot % COLS,
        y: Math.floor(slot / COLS),
        w,
        h,
        isResizable: false,
      };
    });
}

function layoutToSortOrders(layout: Layout): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of layout) {
    map.set(item.i, item.y * COLS + item.x);
  }
  return map;
}

function SeparatorWidget({
  widget,
  onRename,
  onDelete,
}: {
  widget: DashboardWidget;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(widget.friendly_name || widget.title);
  const [showActions, setShowActions] = useState(false);

  const handleSave = () => {
    const trimmed = draft.trim();
    if (trimmed) onRename(widget.id, trimmed);
    setEditing(false);
  };

  const displayName = widget.friendly_name || widget.title;

  if (editing) {
    return (
      <div className="flex items-center gap-2 py-1 h-full">
        <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0 cursor-grab" />
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') setEditing(false);
          }}
          autoFocus
          className="ibm-spacing-allow !h-8 max-w-[200px] uppercase"
          style={{ ...FONT, fontWeight: 500, letterSpacing: '2px' }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        />
        <Button
          size="sm"
          className="!h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={(e) => {
            e.stopPropagation();
            handleSave();
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Save className="h-3.5 w-3.5 mr-1" />
          Save
        </Button>
        <div className="flex-1 border-t border-dashed border-border" />
      </div>
    );
  }

  return (
    <div
      className="relative flex items-center gap-2"
      style={{ height: '25px' }}
      onMouseLeave={() => setShowActions(false)}
    >
      <span
        style={{ ...FONT, fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase' }}
        className="ibm-spacing-allow grid-drag-handle cursor-grab active:cursor-grabbing text-muted-foreground whitespace-nowrap"
        onMouseEnter={() => setShowActions(true)}
      >
        {displayName}
      </span>
      <div
        className={`flex-1 border-t border-dashed border-border transition-[margin] duration-150 ${showActions ? 'mr-[72px]' : 'mr-0'}`}
      />
      <div
        className="absolute right-0 top-1/2 h-8 w-[72px] -translate-y-1/2"
        onMouseEnter={() => setShowActions(true)}
      />
      <div
        className={`absolute right-0 top-1/2 z-10 flex -translate-y-1/2 items-center gap-1 transition-opacity duration-150 ${showActions ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onMouseEnter={() => setShowActions(true)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDraft(displayName);
            setEditing(true);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="separator-action groove-btn !h-8 !w-8 !p-0 !min-h-[32px] !min-w-[32px] flex items-center justify-center bg-muted/50 cursor-pointer"
          title="Rename section"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(widget.id);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="separator-action groove-btn groove-btn-destructive !h-8 !w-8 !p-0 !min-h-[32px] !min-w-[32px] flex items-center justify-center cursor-pointer"
          title="Delete section"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function WidgetCard({
  widget,
  value,
  chartData,
  onEdit,
}: {
  widget: DashboardWidget;
  value: string | number;
  chartData: any;
  onEdit: () => void;
}) {
  const { cb } = useCreatorMode();
  const color = widget.color || '#3b82f6';
  const displayName = widget.friendly_name || widget.title;
  const isChart = widget.widget_type !== 'number_card';

  return (
    <div
      className="stat-cell relative h-full flex flex-col"
      style={{ borderTop: `3px solid ${color}`, padding: '12px 16px' }}
    >
      <div className="flex items-center justify-between mb-2">
        <div
          style={{ fontSize: '13px', textTransform: 'capitalize' }}
          className="font-medium text-muted-foreground"
        >
          {displayName}
        </div>
        <div className="flex items-center gap-1">
          <button
            className="h-7 w-7 p-0 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            title="Edit metric"
          >
            <Edit className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="border-t border-dashed border-border -mx-4 mb-0" />
      {isChart ? (
        <div className="flex-1 min-h-0 pt-2">
          <CampaignChartRenderer widgetType={widget.widget_type} chartData={chartData} color={color} />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div
            style={{
              fontSize: '45px',
              fontFamily: "'VT323', monospace",
              lineHeight: 1,
              marginTop: '5px',
            }}
            className={`font-light ${cb}`}
          >
            {value}
          </div>
        </div>
      )}
    </div>
  );
}

export function CampaignDashboardGrid({
  widgets,
  getStatValue,
  getChartData,
  onEditWidget,
  onRenameSeparator,
  onDeleteSeparator,
  onReorder,
}: CampaignDashboardGridProps) {
  const { width, containerRef, mounted } = useContainerWidth({ initialWidth: 1200 });
  const isDraggingRef = React.useRef(false);

  const layout = useMemo(() => widgetsToLayout(widgets), [widgets]);

  const handleLayoutChange = useCallback(
    (newLayout: Layout) => {
      // Only process layout changes that result from an actual drag operation.
      // Without this guard, the grid fires onLayoutChange on every render/recompute,
      // which creates a feedback loop: new sort_orders → new layout → onLayoutChange → repeat.
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;

      const sortOrders = layoutToSortOrders(newLayout);
      let hasChanged = false;

      const updatedWidgets = widgets.map((w) => {
        const newOrder = sortOrders.get(w.id);
        if (newOrder !== undefined && newOrder !== w.sort_order) {
          hasChanged = true;
          return { ...w, sort_order: newOrder };
        }
        return w;
      });

      if (hasChanged) {
        void onReorder(updatedWidgets);
      }
    },
    [widgets, onReorder]
  );

  return (
    <div ref={containerRef}>
      {mounted && (
        <GridLayout
          width={width}
          layout={layout}
          gridConfig={{
            cols: COLS,
            rowHeight: ROW_HEIGHT,
            margin: GRID_MARGIN,
            containerPadding: [0, 0],
          }}
          dragConfig={{
            enabled: true,
            handle: '.grid-drag-handle',
            cancel: 'button, input, textarea, select',
          }}
          resizeConfig={{
            enabled: false,
          }}
          compactor={verticalCompactor}
          autoSize
          onDragStop={() => {
            isDraggingRef.current = true;
          }}
          onLayoutChange={handleLayoutChange}
          className="campaign-rgl-grid"
        >
          {widgets.map((widget) => {
            const isSeparator = widget.widget_type === 'separator';

            return (
              <div
                key={widget.id}
                className={isSeparator ? '' : 'grid-drag-handle cursor-grab active:cursor-grabbing'}
              >
                {isSeparator ? (
                  <SeparatorWidget
                    widget={widget}
                    onRename={onRenameSeparator}
                    onDelete={onDeleteSeparator}
                  />
                ) : (
                  <WidgetCard
                    widget={widget}
                    value={getStatValue(widget)}
                    chartData={getChartData(widget)}
                    onEdit={() => onEditWidget(widget)}
                  />
                )}
              </div>
            );
          })}
        </GridLayout>
      )}
    </div>
  );
}
