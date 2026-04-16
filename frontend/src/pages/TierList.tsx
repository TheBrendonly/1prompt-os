import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  // @ts-ignore
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { usePageHeader } from '@/contexts/PageHeaderContext';
import { Plus, Trash2, GripVertical } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface TierItem {
  id: string;
  label: string;
  color?: string;
}

type TierKey = 'S' | 'A' | 'B' | 'C' | 'D';

const TIER_CONFIG: { key: TierKey; color: string; bg: string }[] = [
  { key: 'S', color: '#E88B8B', bg: 'rgba(232, 139, 139, 0.15)' },
  { key: 'A', color: '#E8B88B', bg: 'rgba(232, 184, 139, 0.15)' },
  { key: 'B', color: '#E8E08B', bg: 'rgba(232, 224, 139, 0.15)' },
  { key: 'C', color: '#E8E8A0', bg: 'rgba(232, 232, 160, 0.15)' },
  { key: 'D', color: '#A0E8A0', bg: 'rgba(160, 232, 160, 0.15)' },
];

const UNRANKED_KEY = 'unranked';

function DroppableTierRow({ tierKey, children }: { tierKey: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `tier-${tierKey}` });
  return (
    <div
      ref={setNodeRef}
      className="flex-1 min-h-[80px] flex flex-wrap items-center gap-2 p-3 transition-colors"
      style={{
        background: isOver ? 'hsl(var(--accent) / 0.3)' : 'transparent',
      }}
    >
      {children}
    </div>
  );
}

function DraggableItem({ item, isDragOverlay }: { item: TierItem; isDragOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
    data: { item },
  });

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      {...(isDragOverlay ? {} : listeners)}
      {...(isDragOverlay ? {} : attributes)}
      className="relative flex items-center gap-2 px-3 py-2 border border-border cursor-grab active:cursor-grabbing select-none"
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '13px',
        background: item.color || 'hsl(var(--card))',
        color: item.color ? '#111' : 'hsl(var(--card-foreground))',
        opacity: isDragging && !isDragOverlay ? 0.3 : 1,
        minWidth: '100px',
      }}
    >
      <GripVertical className="h-3 w-3 flex-shrink-0" style={{ opacity: 0.5 }} />
      <span className="truncate">{item.label}</span>
    </div>
  );
}

export default function TierList() {
  const [tiers, setTiers] = useState<Record<TierKey | 'unranked', TierItem[]>>({
    S: [],
    A: [],
    B: [],
    C: [],
    D: [],
    unranked: [],
  });
  const [activeItem, setActiveItem] = useState<TierItem | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemColor, setNewItemColor] = useState('#4a9eff');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const findItemTier = useCallback((itemId: string): string | null => {
    for (const [tierKey, items] of Object.entries(tiers)) {
      if (items.find((i) => i.id === itemId)) return tierKey;
    }
    return null;
  }, [tiers]);

  const handleDragStart = (event: DragStartEvent) => {
    const item = event.active.data.current?.item as TierItem;
    setActiveItem(item || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = event;
    if (!over) return;

    const sourceTier = findItemTier(String(active.id));
    if (!sourceTier) return;

    // Determine target tier from droppable id
    let targetTier: string | null = null;
    const overId = String(over.id);
    if (overId.startsWith('tier-')) {
      targetTier = overId.replace('tier-', '');
    } else {
      // Dropped on another item — find which tier that item is in
      targetTier = findItemTier(overId);
    }
    if (!targetTier || sourceTier === targetTier) return;

    const item = tiers[sourceTier as keyof typeof tiers].find((i) => i.id === String(active.id));
    if (!item) return;

    setTiers((prev) => ({
      ...prev,
      [sourceTier]: prev[sourceTier as keyof typeof prev].filter((i) => i.id !== item.id),
      [targetTier!]: [...prev[targetTier as keyof typeof prev], item],
    }));
  };

  const handleAddItem = () => {
    if (!newItemLabel.trim()) return;
    const newItem: TierItem = {
      id: `item-${Date.now()}`,
      label: newItemLabel.trim(),
      color: newItemColor,
    };
    setTiers((prev) => ({ ...prev, unranked: [...prev.unranked, newItem] }));
    setNewItemLabel('');
    setAddDialogOpen(false);
  };

  const handleRemoveItem = (itemId: string) => {
    setTiers((prev) => {
      const updated = { ...prev };
      for (const key of Object.keys(updated) as (TierKey | 'unranked')[]) {
        updated[key] = updated[key].filter((i) => i.id !== itemId);
      }
      return updated;
    });
  };

  usePageHeader({ title: 'Tier List' });

  return (
    <>
      <div className="container mx-auto max-w-7xl pt-6 pb-12 px-6">
        <div className="flex items-center justify-between mb-6">
          <p className="field-text text-muted-foreground">
            Drag and drop items between tiers to rank them.
          </p>
          <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="border-2 border-border" style={{ borderStyle: 'groove' }}>
            {TIER_CONFIG.map((tier) => (
              <div
                key={tier.key}
                className="flex border-b border-border last:border-b-0"
                style={{ minHeight: '90px' }}
              >
                {/* Tier Label */}
                <div
                  className="relative flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{
                    width: '90px',
                    background: tier.color,
                    borderRight: '2px solid hsl(var(--border))',
                  }}
                >
                  {/* Scanlines overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
                    }}
                  />
                  <span
                    className="relative z-10 font-bold"
                    style={{
                      fontFamily: "'VT323', monospace",
                      fontSize: '64px',
                      lineHeight: 1,
                      color: '#111',
                    }}
                  >
                    {tier.key}
                  </span>
                </div>

                {/* Droppable Row */}
                <DroppableTierRow tierKey={tier.key}>
                  {tiers[tier.key].map((item) => (
                    <div key={item.id} className="relative group">
                      <DraggableItem item={item} />
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ fontSize: '10px' }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </DroppableTierRow>
              </div>
            ))}
          </div>

          {/* Unranked Pool */}
          <div className="mt-6 border-2 border-border" style={{ borderStyle: 'groove' }}>
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card">
              <span
                style={{
                  fontFamily: "'VT323', monospace",
                  fontSize: '22px',
                  textTransform: 'uppercase',
                }}
              >
                Unranked
              </span>
            </div>
            <DroppableTierRow tierKey={UNRANKED_KEY}>
              {tiers.unranked.length === 0 && (
                <span className="field-text text-muted-foreground italic px-2">
                  Add items and drag them into tiers above
                </span>
              )}
              {tiers.unranked.map((item) => (
                <div key={item.id} className="relative group">
                  <DraggableItem item={item} />
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ fontSize: '10px' }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </DroppableTierRow>
          </div>

          <DragOverlay dropAnimation={null}>
            {activeItem ? <DraggableItem item={activeItem} isDragOverlay /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Add Item Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'VT323', monospace", fontSize: '22px' }}>
              ADD ITEM
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="field-text">Name</Label>
              <Input
                value={newItemLabel}
                onChange={(e) => setNewItemLabel(e.target.value)}
                placeholder="Enter item name..."
                className="field-text mt-1"
                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
              />
            </div>
            <div>
              <Label className="field-text">Color</Label>
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="color"
                  value={newItemColor}
                  onChange={(e) => setNewItemColor(e.target.value)}
                  className="h-8 w-8 cursor-pointer border border-border"
                />
                <Input
                  value={newItemColor}
                  onChange={(e) => setNewItemColor(e.target.value)}
                  className="field-text flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddItem} disabled={!newItemLabel.trim()}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
