import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface RichInlineEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p';
  fontSize?: string;
  color?: string;
  onStyleChange?: (styles: { fontSize?: string; color?: string }) => void;
  multiline?: boolean;
}

// Convert HSL CSS variables to hex
function hslToHex(hslString: string): string {
  if (hslString.startsWith('#')) return hslString;
  if (hslString.includes('hsl(var(')) return '#000000';
  return hslString;
}

export default function RichInlineEditor({
  value,
  onChange,
  className,
  placeholder = 'Click to edit',
  as: Component = 'div' as any,
  fontSize = '16px',
  color = '#000000',
  onStyleChange,
  multiline = false,
}: RichInlineEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [localFontSize, setLocalFontSize] = useState(fontSize);
  const [localColor, setLocalColor] = useState(() => hslToHex(color));
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => {
    setLocalFontSize(fontSize);
    setLocalColor(hslToHex(color));
  }, [fontSize, color]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (!multiline) {
        (inputRef.current as HTMLInputElement).select();
      } else {
        // Auto-resize textarea
        const textarea = inputRef.current as HTMLTextAreaElement;
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      }
    }
  }, [isEditing, multiline]);

  // Auto-resize textarea on content change
  useEffect(() => {
    if (isEditing && multiline && inputRef.current) {
      const textarea = inputRef.current as HTMLTextAreaElement;
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }, [editValue, isEditing, multiline]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(value);
  };

  const handleSave = () => {
    setIsEditing(false);
    if (editValue.trim() !== value && editValue.trim()) {
      onChange(editValue.trim());
    }
    if (onStyleChange) {
      onStyleChange({
        fontSize: localFontSize,
        color: localColor,
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(value);
    setLocalFontSize(fontSize);
    setLocalColor(hslToHex(color));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-3 w-full">
        {/* Text Input */}
        {multiline ? (
          <textarea
            ref={inputRef as any}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              'bg-background border-2 border-primary rounded-lg px-4 py-2 outline-none w-full resize-none overflow-hidden text-sm',
              className
            )}
            placeholder={placeholder}
            style={{ 
              fontSize: localFontSize, 
              color: localColor,
              minHeight: '80px'
            }}
          />
        ) : (
          <input
            ref={inputRef as any}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              'bg-background border-2 border-primary rounded-lg px-4 py-2 outline-none w-full text-sm',
              className
            )}
            placeholder={placeholder}
            style={{ fontSize: localFontSize, color: localColor }}
          />
        )}

        {/* Compact Styling Controls */}
        {onStyleChange && (
          <Card className="p-3 bg-muted/30">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Font Size</Label>
                <Select value={localFontSize} onValueChange={setLocalFontSize}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12px">12px</SelectItem>
                    <SelectItem value="14px">14px</SelectItem>
                    <SelectItem value="16px">16px</SelectItem>
                    <SelectItem value="20px">20px</SelectItem>
                    <SelectItem value="24px">24px</SelectItem>
                    <SelectItem value="32px">32px</SelectItem>
                    <SelectItem value="48px">48px</SelectItem>
                    <SelectItem value="64px">64px</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Color</Label>
                <div className="flex gap-1">
                  <Input
                    type="color"
                    value={localColor}
                    onChange={(e) => setLocalColor(e.target.value)}
                    className="w-10 h-8 p-0.5"
                  />
                  <Input
                    type="text"
                    value={localColor}
                    onChange={(e) => setLocalColor(e.target.value)}
                    className="flex-1 h-8 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-center mt-3 pt-3 border-t">
              <Button onClick={handleCancel} variant="outline" size="sm">
                Cancel
              </Button>
              <Button onClick={handleSave} size="sm">
                Save
              </Button>
            </div>
          </Card>
        )}
      </div>
    );
  }

  const displayText = value || placeholder;
  const isPlaceholder = !value;

  if (multiline) {
    return (
      <div
        onClick={handleClick}
        className={cn(
          'cursor-pointer hover:bg-primary/5 rounded-lg px-4 py-3 transition-all border-2 border-transparent hover:border-primary/20 whitespace-pre-wrap',
          isPlaceholder && 'text-muted-foreground italic',
          className
        )}
        style={{ fontSize: localFontSize, color: isPlaceholder ? undefined : localColor }}
      >
        {displayText}
      </div>
    );
  }

  return (
    <Component
      onClick={handleClick}
      className={cn(
        'cursor-pointer hover:bg-primary/5 rounded-lg px-4 py-3 transition-all border-2 border-transparent hover:border-primary/20',
        isPlaceholder && 'text-muted-foreground italic',
        className
      )}
      style={{ fontSize: localFontSize, color: isPlaceholder ? undefined : localColor }}
    >
      {displayText}
    </Component>
  );
}

