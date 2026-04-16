import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { GripVertical, Pencil, Check, X, RotateCcw, Save, Loader2, Settings } from '@/components/icons';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  useClientMenuConfig,
  DEFAULT_MENU_ITEMS,
  type MenuItemConfig,
} from '@/hooks/useClientMenuConfig';
import { cn } from '@/lib/utils';

// Primary icons (shown by default)
const PRIMARY_ICONS = [
  '▤', '◇', '⚷', '░', '↩', '♫', '⚔', '☰', '↻', '△', '□', '⛁', '⌐', '⊞',
];

// Extended icons (shown on "Show More")
const EXTENDED_ICONS = [
  '◈', '◉', '◎', '●', '○', '◐', '◑', '◒', '◓', '★', '☆', '✦', '✧',
  '⬡', '⬢', '⏣', '⎔', '⌘', '⌥', '⌬', '⏏', '⏚', '⏛', '⎈', '⌖',
  '⊕', '⊗', '⊘', '⊙', '⊚', '⊛', '⊜', '⊝', '⊡', '⊟', '⊠',
  '⋮', '⋯', '⋰', '⋱', '⊲', '⊳', '⊴', '⊵', '⊶', '⊷', '⊸', '⊹',
  '⌂', '⌃', '⌄', '⌅', '⌆', '⌇', '⌈', '⌉', '⌊', '⌋', '⌌', '⌍',
  '☐', '☑', '☒', '☓', '☔', '☕', '☖', '☗', '☘', '☙', '☚', '☛',
  '♠', '♡', '♢', '♣', '♤', '♥', '♦', '♧', '♨', '♩', '♪', '♬',
  '⚀', '⚁', '⚂', '⚃', '⚄', '⚅', '⚆', '⚇', '⚈', '⚉', '⚊', '⚋',
];

// Check if an item has been customized from its default
function isItemCustomized(item: MenuItemConfig): boolean {
  const def = DEFAULT_MENU_ITEMS.find(d => d.key === item.key);
  if (!def) return false;
  return item.label !== def.label || item.icon !== def.icon;
}

/**
 * Merged section-label: renders the label text followed by a dashed line,
 * matching the sidebar-section-label style exactly.
 */
function SortableMenuItem({
  item,
  onToggle,
  onEdit,
  isCustom,
}: {
  item: MenuItemConfig;
  onToggle: (key: string) => void;
  onEdit: (key: string) => void;
  isCustom: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isSectionLabel = item.type === 'section-label';
  const customized = !isCustom && isItemCustomized(item);

  // Section label: text + dashed line (matches sidebar-section-label)
  if (isSectionLabel) {
    return (
      <div ref={setNodeRef} style={style} className="flex items-center py-1.5">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mr-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <span
          className="sidebar-section-label shrink-0 !p-0 !m-0"
          style={{ flex: 'none', gap: '8px' }}
        >
          {item.label}
        </span>
        <div
          className="flex-1 ml-2"
          style={{ borderTop: '1px dashed hsl(var(--border))' }}
        />
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <Switch
            checked={item.visible}
            onCheckedChange={() => onToggle(item.key)}
          />
          <button
            type="button"
            onClick={() => onEdit(item.key)}
            className="groove-btn !h-8 !w-8 !p-0 !min-h-[32px] !min-w-[32px] flex items-center justify-center bg-muted/50"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Regular menu item
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-3 py-2 bg-muted/50 rounded-lg border border-border"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      {item.icon && (
        <span
          className="w-4 text-center text-foreground"
          style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px' }}
        >
          {item.icon}
        </span>
      )}
      <span
        className="uppercase"
        style={{ fontFamily: "'VT323', monospace", fontSize: '18px' }}
      >
        {item.label}
      </span>
      <div className="flex-1" />
      <div className="flex items-center gap-2 shrink-0">
        <Switch
          checked={item.visible}
          onCheckedChange={() => onToggle(item.key)}
        />
        <button
          type="button"
          onClick={() => onEdit(item.key)}
          className="groove-btn !h-8 !w-8 !p-0 !min-h-[32px] !min-w-[32px] flex items-center justify-center bg-muted/50"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function EditItemInline({
  item,
  onSave,
  onCancel,
  onReset,
  showReset,
}: {
  item: MenuItemConfig;
  onSave: (label: string, icon?: string) => void;
  onCancel: () => void;
  onReset?: () => void;
  showReset?: boolean;
}) {
  const [label, setLabel] = useState(item.label);
  const [icon, setIcon] = useState(item.icon || '');
  const [showMore, setShowMore] = useState(false);
  const isMenuItem = item.type === 'item';
  const icons = showMore ? [...PRIMARY_ICONS, ...EXTENDED_ICONS] : PRIMARY_ICONS;

  return (
    <div className="border border-primary/30 bg-card rounded-sm p-3 space-y-3">
      <div className="space-y-1.5">
        <label className="field-text text-foreground uppercase">Name</label>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="field-text"
          autoFocus
        />
      </div>
      {isMenuItem && (
        <div className="space-y-1.5">
          <label className="field-text text-foreground uppercase">Icon</label>
          <div className="flex flex-wrap gap-1">
            {icons.map((ic, idx) => (
              <button
                key={`${ic}-${idx}`}
                type="button"
                onClick={() => setIcon(ic)}
                className={cn(
                  "w-8 h-8 flex items-center justify-center border transition-colors",
                  icon === ic
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-muted-foreground"
                )}
                style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px' }}
              >
                {ic}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="field-text text-muted-foreground hover:text-foreground py-1"
          >
            {showMore ? '← Show Less' : 'Show More Icons →'}
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSave(label, isMenuItem ? icon : undefined)}
          disabled={!label.trim()}
          className="groove-btn !h-8 !px-3 flex items-center justify-center gap-1"
          style={{ fontFamily: "'VT323', monospace", fontSize: '16px' }}
        >
          <Check className="h-3.5 w-3.5" /> SAVE
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="groove-btn !h-8 !px-3 flex items-center justify-center gap-1"
          style={{ fontFamily: "'VT323', monospace", fontSize: '16px' }}
        >
          <X className="h-3.5 w-3.5" /> CANCEL
        </button>
        {showReset && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="groove-btn !h-8 !px-3 flex items-center justify-center gap-1"
            style={{ fontFamily: "'VT323', monospace", fontSize: '16px' }}
            title="Reset to default"
          >
            <RotateCcw className="h-3.5 w-3.5" /> RESET
          </button>
        )}
      </div>
    </div>
  );
}

export function ClientMenuConfigEditor({ clientId }: { clientId: string }) {
  const { menuConfig, loading, saving, saveConfig, refetch } = useClientMenuConfig(clientId);
  const [items, setItems] = useState<MenuItemConfig[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  // Build the merged default: section-labels only (no separate dividers)
  const buildMergedDefaults = (): MenuItemConfig[] => {
    // Filter out dividers from defaults; section-labels handle the visual separation
    return DEFAULT_MENU_ITEMS
      .filter(item => item.type !== 'divider')
      .map((item, idx) => ({ ...item, position: idx }));
  };

  useEffect(() => {
    if (menuConfig) {
      // Migrate: remove divider items, keep section-labels and items
      const migrated = menuConfig.filter(item => item.type !== 'divider');
      setItems(migrated.map((item, idx) => ({ ...item, position: idx })));
    } else if (!loading) {
      setItems(buildMergedDefaults());
    }
    setHasChanges(false);
    setEditingKey(null);
  }, [menuConfig, loading]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const defaultKeys = new Set(DEFAULT_MENU_ITEMS.map(d => d.key));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.key === active.id);
    const newIndex = items.findIndex((i) => i.key === over.id);
    setItems(arrayMove(items, oldIndex, newIndex));
    setHasChanges(true);
  };

  const handleToggle = (key: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, visible: !item.visible } : item
      )
    );
    setHasChanges(true);
  };

  const handleEditSave = (key: string, label: string, icon?: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.key === key
          ? { ...item, label, ...(icon !== undefined ? { icon } : {}) }
          : item
      )
    );
    setEditingKey(null);
    setHasChanges(true);
  };

  const handleResetItem = (key: string) => {
    const def = DEFAULT_MENU_ITEMS.find(d => d.key === key);
    if (!def) return;
    setItems((prev) =>
      prev.map((item) =>
        item.key === key
          ? { ...item, label: def.label, icon: def.icon }
          : item
      )
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    const success = await saveConfig(items);
    if (success) {
      toast.success('Menu configuration saved');
      setHasChanges(false);
      await refetch();
    } else {
      toast.error('Failed to save menu configuration');
    }
  };

  const handleReset = () => {
    setItems(buildMergedDefaults());
    setHasChanges(true);
    setEditingKey(null);
  };

  if (loading) return null;

  return (
    <Card className="material-surface">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Client Menu Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4 field-text">
          Configure which menu items the client can see and their order. Drag to reorder, toggle to show/hide.
          Click the edit button to rename items or change icons.
        </p>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.key)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {items.map((item) =>
                editingKey === item.key ? (
                  <EditItemInline
                    key={item.key}
                    item={item}
                    onSave={(label, icon) => handleEditSave(item.key, label, icon)}
                    onCancel={() => setEditingKey(null)}
                    onReset={() => { handleResetItem(item.key); setEditingKey(null); }}
                    showReset={!!(defaultKeys.has(item.key) && isItemCustomized(item))}
                  />
                ) : (
                  <SortableMenuItem
                    key={item.key}
                    item={item}
                    onToggle={handleToggle}
                    onEdit={(key) => setEditingKey(key)}
                    isCustom={!defaultKeys.has(item.key)}
                  />
                )
              )}
            </div>
          </SortableContext>
        </DndContext>

        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={saving}
            className="groove-btn !h-8"
            style={{ fontFamily: "'VT323', monospace", fontSize: '16px', fontWeight: 'bold' }}
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            DEFAULT LAYOUT
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium !h-8"
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Save className="h-4 w-4 mr-2" /> Save</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
