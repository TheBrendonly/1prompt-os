import { useDraggable } from '@dnd-kit/core';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Type, 
  AlignLeft, 
  MousePointer,
  Image, 
  Circle, 
  ImageIcon,
  GripVertical,
  ChevronDown,
  ChevronRight
} from '@/components/icons';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from 'react';

interface DraggableComponentLibraryProps {
  onAddComponent: (componentType: string) => void;
}

function DraggableComponent({ id, type, label, description, icon: Icon }: any) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
    data: { type: type }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="flex items-center gap-3 p-3 rounded-md border border-border bg-background hover:bg-primary/5 hover:border-primary/50 cursor-grab active:cursor-grabbing transition-colors"
    >
      <div className="flex items-center justify-center h-8 w-8 rounded bg-primary/10 flex-shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground truncate">{description}</div>
      </div>
      <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
    </div>
  );
}

export default function DraggableComponentLibrary({ onAddComponent }: DraggableComponentLibraryProps) {
  const [componentsOpen, setComponentsOpen] = useState(true);

  const components = [
    { id: 'drag-title', type: 'title', icon: Type, label: 'Title', description: 'Large heading text' },
    { id: 'drag-subtitle', type: 'subtitle', icon: Type, label: 'Subtitle', description: 'Medium heading text' },
    { id: 'drag-paragraph', type: 'paragraph', icon: AlignLeft, label: 'Paragraph', description: 'Body text content' },
    { id: 'drag-button', type: 'button', icon: MousePointer, label: 'Button', description: 'Call-to-action button' },
    { id: 'drag-creative', type: 'creative', icon: Image, label: 'Creative', description: 'Ad creative card' },
    { id: 'drag-icon', type: 'icon', icon: Circle, label: 'Icon', description: 'Icon element' },
    { id: 'drag-logo', type: 'logo', icon: ImageIcon, label: 'Logo', description: 'Logo image' },
  ];

  return (
    <Collapsible open={componentsOpen} onOpenChange={setComponentsOpen} className="border-b">
      <CollapsibleTrigger className="flex items-center gap-2 w-full hover:bg-muted/50 p-3">
        {componentsOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <span className="text-sm font-semibold">Components</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3 space-y-2">
        {components.map((component) => (
          <DraggableComponent key={component.id} {...component} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
