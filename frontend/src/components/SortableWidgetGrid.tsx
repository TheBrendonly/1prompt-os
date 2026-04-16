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
import { DashboardWidgetRenderer, type DashboardWidgetData } from './DashboardWidgetRenderer';

interface SortableWidgetGridProps {
  widgets: DashboardWidgetData[];
  resolveValue: (name: string) => string | number | null | undefined;
  resolveTimeSeriesData?: (name: string) => Array<{ date: string; count: number }> | null;
  onReorder: (reordered: DashboardWidgetData[]) => void;
  onEdit: (widget: DashboardWidgetData) => void;
}

function SortableWidgetItem({
  widget,
  resolveValue,
  resolveTimeSeriesData,
  onEdit,
}: {
  widget: DashboardWidgetData;
  resolveValue: (name: string) => string | number | null | undefined;
  resolveTimeSeriesData?: (name: string) => Array<{ date: string; count: number }> | null;
  onEdit: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transform ? transition : undefined,
    opacity: isDragging ? 0.4 : 1,
    cursor: 'grab',
  };

  const widthClass = widget.width === 'full' ? 'col-span-2' : 'col-span-1';

  return (
    <div ref={setNodeRef} style={style} className={widthClass} data-widget-id={widget.id} {...attributes} {...listeners}>
      <DashboardWidgetRenderer
        widget={widget}
        resolveValue={resolveValue}
        resolveTimeSeriesData={resolveTimeSeriesData}
        onEdit={onEdit}
      />
    </div>
  );
}

export function SortableWidgetGrid({
  widgets,
  resolveValue,
  resolveTimeSeriesData,
  onReorder,
  onEdit,
}: SortableWidgetGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragWidth, setDragWidth] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    setActiveId(id);
    const el = document.querySelector(`[data-widget-id="${id}"]`) as HTMLElement | null;
    if (el) {
      setDragWidth(el.getBoundingClientRect().width);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setDragWidth(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = widgets.findIndex((w) => w.id === active.id);
    const newIndex = widgets.findIndex((w) => w.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...widgets];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    onReorder(reordered);
  };

  const activeWidget = activeId ? widgets.find((w) => w.id === activeId) : null;

  if (widgets.length === 0) return null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 gap-6">
          {widgets.map((widget) => (
            <SortableWidgetItem
              key={widget.id}
              widget={widget}
              resolveValue={resolveValue}
              resolveTimeSeriesData={resolveTimeSeriesData}
              onEdit={() => onEdit(widget)}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={null}>
        {activeWidget ? (
          <div style={dragWidth ? { width: dragWidth } : undefined}>
            <DashboardWidgetRenderer
              widget={activeWidget}
              resolveValue={resolveValue}
              resolveTimeSeriesData={resolveTimeSeriesData}
              onEdit={() => {}}
              isDragging
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
