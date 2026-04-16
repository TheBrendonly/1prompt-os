export const DASHBOARD_GRID_COLUMNS = 4;

export interface DashboardGridWidget {
  id: string;
  widget_type: string;
  width?: string;
  sort_order: number;
}

export interface DashboardGridLayout<T extends DashboardGridWidget> {
  widget: T;
  span: number;
  slot: number;
  endSlot: number;
}

export type DashboardGridCell<T extends DashboardGridWidget> =
  | {
      type: 'widget';
      key: string;
      slot: number;
      span: number;
      widget: T;
    }
  | {
      type: 'empty';
      key: string;
      slot: number;
      span: 1;
    };

export function getDashboardWidgetSpan(widget: DashboardGridWidget): number {
  if (widget.widget_type === 'separator') return DASHBOARD_GRID_COLUMNS;
  if (widget.widget_type !== 'number_card') {
    return widget.width === 'half' ? 2 : DASHBOARD_GRID_COLUMNS;
  }
  return 1;
}

export function getNextFittingDashboardSlot(start: number, span: number): number {
  if (span >= DASHBOARD_GRID_COLUMNS) {
    return Math.ceil(start / DASHBOARD_GRID_COLUMNS) * DASHBOARD_GRID_COLUMNS;
  }

  const rowStart = Math.floor(start / DASHBOARD_GRID_COLUMNS) * DASHBOARD_GRID_COLUMNS;
  const columnOffset = start - rowStart;

  if (columnOffset + span <= DASHBOARD_GRID_COLUMNS) {
    return start;
  }

  return rowStart + DASHBOARD_GRID_COLUMNS;
}

export function normalizeDashboardGrid<T extends DashboardGridWidget>(widgets: T[]): DashboardGridLayout<T>[] {
  let nextAvailableSlot = 0;

  return [...widgets]
    .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id))
    .map((widget) => {
      const span = getDashboardWidgetSpan(widget);
      const slot = getNextFittingDashboardSlot(Math.max(widget.sort_order, nextAvailableSlot), span);

      nextAvailableSlot = slot + span;

      return {
        widget,
        span,
        slot,
        endSlot: slot + span,
      };
    });
}

export function toNormalizedDashboardWidgets<T extends DashboardGridWidget>(widgets: T[]): T[] {
  return normalizeDashboardGrid(widgets).map(({ widget, slot }) => ({
    ...widget,
    sort_order: slot,
  }));
}

export function buildDashboardGridCells<T extends DashboardGridWidget>(
  layouts: DashboardGridLayout<T>[],
  options?: { extraTrailingRows?: number }
): DashboardGridCell<T>[] {
  const startSlotMap = new Map(layouts.map((layout) => [layout.slot, layout] as const));
  const occupiedContinuationSlots = new Set<number>();

  layouts.forEach((layout) => {
    for (let slot = layout.slot + 1; slot < layout.endSlot; slot += 1) {
      occupiedContinuationSlots.add(slot);
    }
  });

  const maxEndSlot = layouts.reduce((max, layout) => Math.max(max, layout.endSlot), 0);
  const extraTrailingRows = options?.extraTrailingRows ?? 0;
  const lastWidgetRow = Math.ceil(maxEndSlot / DASHBOARD_GRID_COLUMNS);
  const totalSlots = (lastWidgetRow + extraTrailingRows) * DASHBOARD_GRID_COLUMNS;

  // Build a set of rows that contain at least one widget
  const rowsWithWidgets = new Set<number>();
  layouts.forEach((layout) => {
    for (let s = layout.slot; s < layout.endSlot; s++) {
      rowsWithWidgets.add(Math.floor(s / DASHBOARD_GRID_COLUMNS));
    }
  });
  // Extra trailing rows (during drag) are always included
  for (let r = lastWidgetRow; r < lastWidgetRow + extraTrailingRows; r++) {
    rowsWithWidgets.add(r);
  }

  const cells: DashboardGridCell<T>[] = [];

  for (let slot = 0; slot < totalSlots; slot += 1) {
    const row = Math.floor(slot / DASHBOARD_GRID_COLUMNS);

    // Skip entire rows that have no widgets (and aren't trailing drag rows)
    if (!rowsWithWidgets.has(row)) continue;

    const layout = startSlotMap.get(slot);

    if (layout) {
      cells.push({
        type: 'widget',
        key: layout.widget.id,
        slot,
        span: layout.span,
        widget: layout.widget,
      });
      slot += layout.span - 1;
      continue;
    }

    if (occupiedContinuationSlots.has(slot)) continue;

    cells.push({
      type: 'empty',
      key: `empty-${slot}`,
      slot,
      span: 1,
    });
  }

  return cells;
}

export function moveDashboardWidgetToSlot<T extends DashboardGridWidget>(
  widgets: T[],
  activeId: string,
  targetSlot: number
): T[] {
  const normalizedWidgets = toNormalizedDashboardWidgets(widgets);
  const activeWidget = normalizedWidgets.find((widget) => widget.id === activeId);

  if (!activeWidget) {
    return normalizedWidgets;
  }

  const reorderedWidgets = [
    ...normalizedWidgets.filter((widget) => widget.id !== activeId),
    { ...activeWidget, sort_order: targetSlot },
  ].sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    if (a.id === activeId) return -1;
    if (b.id === activeId) return 1;
    return a.id.localeCompare(b.id);
  });

  return toNormalizedDashboardWidgets(reorderedWidgets);
}

export function getNextDashboardWidgetSlot<T extends DashboardGridWidget>(widgets: T[]): number {
  return normalizeDashboardGrid(widgets).reduce((max, layout) => Math.max(max, layout.endSlot), 0);
}