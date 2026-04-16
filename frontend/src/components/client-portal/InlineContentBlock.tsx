import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { GripVertical, Trash2 } from '@/components/icons';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { BlockType } from './SlashCommandMenu';

export interface ContentBlock {
  id: string;
  type: BlockType;
  content: string;
  styles?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    fontSize?: string;
    textAlign?: 'left' | 'center' | 'right';
  };
  config?: {
    label?: string;
    placeholder?: string;
    required?: boolean;
    options?: string[];
    imageUrl?: string;
  };
}

interface InlineContentBlockProps {
  block: ContentBlock;
  isEditing: boolean;
  onUpdate: (block: ContentBlock) => void;
  onDelete: () => void;
  onKeyDown: (e: React.KeyboardEvent, blockId: string) => void;
  onFocus: () => void;
  formData?: Record<string, any>;
  onFormDataChange?: (key: string, value: any) => void;
}

const InlineContentBlock: React.FC<InlineContentBlockProps> = ({
  block,
  isEditing,
  onUpdate,
  onDelete,
  onKeyDown,
  onFocus,
  formData = {},
  onFormDataChange
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const newContent = e.currentTarget.textContent || '';
    onUpdate({ ...block, content: newContent });
  };

  const handleConfigChange = (key: string, value: any) => {
    onUpdate({
      ...block,
      config: { ...block.config, [key]: value }
    });
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleKeyDownLocal = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    onKeyDown(e, block.id);
  };

  const renderEditableContent = () => {
    const commonEditableProps = {
      ref: contentRef,
      contentEditable: isEditing,
      suppressContentEditableWarning: true,
      onInput: handleContentChange,
      onKeyDown: handleKeyDownLocal,
      onFocus: onFocus,
      onClick: handleClick,
    };

    switch (block.type) {
      case 'heading1':
        return (
          <div
            {...commonEditableProps}
            className={cn(
              "text-2xl font-bold outline-none focus:bg-muted/30 rounded px-1 -mx-1",
              !block.content && isEditing && "text-muted-foreground"
            )}
            style={{
              fontWeight: block.styles?.bold ? 'bold' : undefined,
              fontStyle: block.styles?.italic ? 'italic' : undefined,
              textDecoration: block.styles?.underline ? 'underline' : undefined,
              textAlign: block.styles?.textAlign,
            }}
            data-placeholder="Heading 1"
          >
            {block.content || (isEditing ? '' : 'Heading 1')}
          </div>
        );

      case 'heading2':
        return (
          <div
            {...commonEditableProps}
            className={cn(
              "text-xl font-semibold outline-none focus:bg-muted/30 rounded px-1 -mx-1",
              !block.content && isEditing && "text-muted-foreground"
            )}
            style={{ textAlign: block.styles?.textAlign }}
            data-placeholder="Heading 2"
          >
            {block.content || (isEditing ? '' : 'Heading 2')}
          </div>
        );

      case 'heading3':
        return (
          <div
            {...commonEditableProps}
            className={cn(
              "text-lg font-medium outline-none focus:bg-muted/30 rounded px-1 -mx-1",
              !block.content && isEditing && "text-muted-foreground"
            )}
            style={{ textAlign: block.styles?.textAlign }}
            data-placeholder="Heading 3"
          >
            {block.content || (isEditing ? '' : 'Heading 3')}
          </div>
        );

      case 'paragraph':
        return (
          <div
            {...commonEditableProps}
            className={cn(
              "text-sm outline-none focus:bg-muted/30 rounded px-1 -mx-1 min-h-[1.5em]",
              !block.content && isEditing && "text-muted-foreground"
            )}
            style={{
              fontWeight: block.styles?.bold ? 'bold' : undefined,
              fontStyle: block.styles?.italic ? 'italic' : undefined,
              textDecoration: block.styles?.underline ? 'underline' : undefined,
              fontSize: block.styles?.fontSize,
              textAlign: block.styles?.textAlign,
            }}
            data-placeholder="Type / for commands..."
          >
            {block.content || (isEditing ? '' : '')}
          </div>
        );

      case 'bullet_list':
        return (
          <div className="flex items-start gap-2" onClick={handleClick}>
            <span className="text-muted-foreground mt-1">•</span>
            <div
              {...commonEditableProps}
              className={cn(
                "text-sm outline-none focus:bg-muted/30 rounded px-1 -mx-1 flex-1 min-h-[1.5em]",
                !block.content && isEditing && "text-muted-foreground"
              )}
              data-placeholder="List item..."
            >
              {block.content}
            </div>
          </div>
        );

      case 'numbered_list':
        return (
          <div className="flex items-start gap-2" onClick={handleClick}>
            <span className="text-muted-foreground mt-1 w-4 text-right">1.</span>
            <div
              {...commonEditableProps}
              className={cn(
                "text-sm outline-none focus:bg-muted/30 rounded px-1 -mx-1 flex-1 min-h-[1.5em]",
                !block.content && isEditing && "text-muted-foreground"
              )}
              data-placeholder="List item..."
            >
              {block.content}
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="space-y-2" onClick={handleClick}>
            {block.config?.imageUrl ? (
              <img src={block.config.imageUrl} alt="" className="max-w-full rounded-lg" />
            ) : isEditing ? (
              <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center">
                <Input
                  type="url"
                  placeholder="Paste image URL..."
                  value={block.config?.imageUrl || ''}
                  onChange={(e) => handleConfigChange('imageUrl', e.target.value)}
                  onClick={handleClick}
                  className="max-w-md mx-auto"
                />
              </div>
            ) : (
              <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center text-muted-foreground">
                No image set
              </div>
            )}
          </div>
        );

      case 'text_input':
        return (
          <div className="space-y-2" onClick={handleClick}>
            {isEditing ? (
              <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-dashed">
                <Input
                  placeholder="Field label"
                  value={block.config?.label || ''}
                  onChange={(e) => handleConfigChange('label', e.target.value)}
                  onClick={handleClick}
                  className="font-medium"
                />
                <Input
                  placeholder="Placeholder text"
                  value={block.config?.placeholder || ''}
                  onChange={(e) => handleConfigChange('placeholder', e.target.value)}
                  onClick={handleClick}
                  className="text-muted-foreground"
                />
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`required-${block.id}`}
                    checked={block.config?.required || false}
                    onCheckedChange={(checked) => handleConfigChange('required', checked)}
                  />
                  <Label htmlFor={`required-${block.id}`} className="text-sm">Required field</Label>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>{block.config?.label || 'Text Field'}{block.config?.required && ' *'}</Label>
                <Input
                  placeholder={block.config?.placeholder || 'Enter text...'}
                  value={formData[block.id] || ''}
                  onChange={(e) => onFormDataChange?.(block.id, e.target.value)}
                  onClick={handleClick}
                />
              </div>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-2" onClick={handleClick}>
            {isEditing ? (
              <div className="p-3 bg-muted/30 rounded-lg border border-dashed">
                <Input
                  placeholder="Checkbox label"
                  value={block.config?.label || ''}
                  onChange={(e) => handleConfigChange('label', e.target.value)}
                  onClick={handleClick}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`checkbox-${block.id}`}
                  checked={formData[block.id] || false}
                  onCheckedChange={(checked) => onFormDataChange?.(block.id, checked)}
                />
                <Label htmlFor={`checkbox-${block.id}`} className="cursor-pointer">
                  {block.config?.label || 'Checkbox'}
                </Label>
              </div>
            )}
          </div>
        );

      case 'divider':
        return <hr className="border-t border-border my-2" onClick={handleClick} />;

      case 'spacer':
        return <div className="h-8" onClick={handleClick} />;

      default:
        return (
          <div className="text-sm text-muted-foreground" onClick={handleClick}>
            Unsupported block type: {block.type}
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        "group relative py-1",
        isEditing && "hover:bg-muted/30 rounded-lg transition-colors"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Hover actions for editing mode */}
      {isEditing && isHovered && (
        <div className="absolute -left-8 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-1 hover:bg-muted rounded cursor-grab" onClick={handleClick}>
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Delete button on hover */}
      {isEditing && isHovered && (
        <div className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {renderEditableContent()}
    </div>
  );
};

export default InlineContentBlock;