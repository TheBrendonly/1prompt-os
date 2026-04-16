import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Edit, Eye, RefreshCw, Loader2 } from '@/components/icons';
import { MetricChartRenderer, type WebhookChartData } from './MetricChartRenderer';

interface MetricItem {
  id: string;
  name: string;
  color: string;
  prompt: string;
  is_active: boolean;
  widget_type?: string;
  widget_width?: string;
}

interface SortableMetricGridProps {
  metrics: MetricItem[];
  resolveValue: (metric: MetricItem) => string | number | null | undefined;
  resolveTimeSeriesData?: (metric: MetricItem) => Array<{ date: string; count: number }> | null;
  resolveWebhookChartData?: (metric: MetricItem) => WebhookChartData | null;
  onReorder: (reordered: MetricItem[]) => void;
  onEdit: (metric: MetricItem) => void;
  onViewMessages?: (metric: MetricItem) => void;
  onRefreshMetric?: (metric: MetricItem) => Promise<void>;
  refreshingMetricIds?: Set<string>;
}

function MetricCard({
  metric,
  value,
  timeSeriesData,
  webhookChartData,
  onEdit,
  onViewMessages,
  onRefreshMetric,
  isRefreshing,
  isDragging,
}: {
  metric: MetricItem;
  value: string | number | null | undefined;
  timeSeriesData?: Array<{ date: string; count: number }> | null;
  webhookChartData?: WebhookChartData | null;
  onEdit: () => void;
  onViewMessages?: () => void;
  onRefreshMetric?: () => void;
  isRefreshing?: boolean;
  isDragging?: boolean;
}) {
  const widgetType = metric.widget_type || 'number_card';
  const isChart = widgetType !== 'number_card';

  return (
    <div
      className={`stat-cell relative transition-shadow ${isDragging ? 'shadow-lg ring-2 ring-primary/30 opacity-90' : ''}`}
      style={{ borderTop: `3px solid ${metric.color}`, padding: '16px', minHeight: isChart ? '280px' : undefined }}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          style={{ fontSize: '13px', textTransform: 'capitalize' }}
          className="font-medium text-muted-foreground tracking-wide"
        >
          {metric.name}
        </div>
        <div className="flex items-center gap-1">
          {onRefreshMetric && (
            <button
              className="h-7 w-7 p-0 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors disabled:opacity-50"
              onClick={(e) => { e.stopPropagation(); onRefreshMetric(); }}
              title="Refresh this metric"
              disabled={isRefreshing}
            >
              {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </button>
          )}
          {onViewMessages && (
            <button
              className="h-7 w-7 p-0 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors"
              onClick={(e) => { e.stopPropagation(); onViewMessages(); }}
              title="View conversations"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          <button
            className="h-7 w-7 p-0 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            title="Edit metric"
          >
            <Edit className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="border-t border-dashed border-border -mx-4 mb-3" />
      
      {isChart ? (
        (timeSeriesData && timeSeriesData.length > 0) || webhookChartData ? (
          <MetricChartRenderer
            widgetType={widgetType}
            data={timeSeriesData || []}
            color={metric.color}
            value={value}
            webhookChartData={webhookChartData}
          />
        ) : (
          <div className="flex items-center justify-center text-muted-foreground" style={{ height: 200, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>
            {value !== undefined && value !== null
              ? <MetricChartRenderer widgetType={widgetType} data={[]} color={metric.color} value={value} />
              : 'Refresh to populate chart data'}
          </div>
        )
      ) : (
        <div style={{ fontSize: '40px', fontFamily: "'VT323', monospace", lineHeight: 1 }} className="font-light">
          {value !== undefined && value !== null ? String(value) : 'N/A'}
        </div>
      )}
    </div>
  );
}

function SortableMetricItem({
  metric,
  value,
  timeSeriesData,
  webhookChartData,
  onEdit,
  onViewMessages,
  onRefreshMetric,
  isRefreshing,
}: {
  metric: MetricItem;
  value: string | number | null | undefined;
  timeSeriesData?: Array<{ date: string; count: number }> | null;
  webhookChartData?: WebhookChartData | null;
  onEdit: () => void;
  onViewMessages?: () => void;
  onRefreshMetric?: () => void;
  isRefreshing?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: metric.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transform ? transition : undefined,
    opacity: isDragging ? 0.4 : 1,
    cursor: 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <MetricCard
        metric={metric}
        value={value}
        timeSeriesData={timeSeriesData}
        webhookChartData={webhookChartData}
        onEdit={onEdit}
        onViewMessages={onViewMessages}
        onRefreshMetric={onRefreshMetric}
        isRefreshing={isRefreshing}
      />
    </div>
  );
}

export function SortableMetricGrid({
  metrics,
  resolveValue,
  resolveTimeSeriesData,
  resolveWebhookChartData,
  onReorder,
  onEdit,
  onViewMessages,
  onRefreshMetric,
  refreshingMetricIds,
}: SortableMetricGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = metrics.findIndex((m) => m.id === active.id);
    const newIndex = metrics.findIndex((m) => m.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...metrics];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    onReorder(reordered);
  };

  const activeMetric = activeId ? metrics.find((m) => m.id === activeId) : null;

  // Split metrics into number cards and chart widgets
  const numberCards = metrics.filter(m => !m.widget_type || m.widget_type === 'number_card');
  const chartWidgets = metrics.filter(m => m.widget_type && m.widget_type !== 'number_card');

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={metrics.map((m) => m.id)} strategy={rectSortingStrategy}>
        <div className="space-y-6">
          {/* Number Cards - 4 column grid */}
          {numberCards.length > 0 && (
            <div className="grid grid-cols-4 gap-4">
              {numberCards.map((metric) => (
                <SortableMetricItem
                  key={metric.id}
                  metric={metric}
                  value={resolveValue(metric)}
                  timeSeriesData={resolveTimeSeriesData?.(metric)}
                  webhookChartData={resolveWebhookChartData?.(metric)}
                  onEdit={() => onEdit(metric)}
                  onViewMessages={onViewMessages ? () => onViewMessages(metric) : undefined}
                  onRefreshMetric={onRefreshMetric ? () => onRefreshMetric(metric) : undefined}
                  isRefreshing={refreshingMetricIds?.has(metric.id)}
                />
              ))}
            </div>
          )}

          {/* Chart Widgets - 2 column grid, below number cards */}
          {chartWidgets.length > 0 && (
            <>
              <div className="border-t border-dashed border-border" />
              <div className="grid grid-cols-2 gap-4">
                {chartWidgets.map((metric) => (
                  <div key={metric.id} className={metric.widget_width === 'full' ? 'col-span-2' : ''}>
                    <SortableMetricItem
                      metric={metric}
                      value={resolveValue(metric)}
                      timeSeriesData={resolveTimeSeriesData?.(metric)}
                      webhookChartData={resolveWebhookChartData?.(metric)}
                      onEdit={() => onEdit(metric)}
                      onViewMessages={onViewMessages ? () => onViewMessages(metric) : undefined}
                      onRefreshMetric={onRefreshMetric ? () => onRefreshMetric(metric) : undefined}
                      isRefreshing={refreshingMetricIds?.has(metric.id)}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={null}>
        {activeMetric ? (
          <MetricCard
            metric={activeMetric}
            value={resolveValue(activeMetric)}
            timeSeriesData={resolveTimeSeriesData?.(activeMetric)}
            webhookChartData={resolveWebhookChartData?.(activeMetric)}
            onEdit={() => {}}
            isDragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
