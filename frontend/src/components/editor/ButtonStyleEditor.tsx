import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ButtonStyleEditorProps {
  text: string;
  onTextChange: (text: string) => void;
  backgroundColor?: string;
  textColor?: string;
  strokeColor?: string;
  borderRadius?: string;
  onStyleChange?: (styles: { 
    backgroundColor?: string; 
    textColor?: string;
    strokeColor?: string;
    borderRadius?: string;
  }) => void;
  className?: string;
}

// Convert HSL CSS variables to hex
function hslToHex(hslString: string): string {
  if (hslString.startsWith('#')) return hslString;
  if (hslString.includes('hsl(var(')) return '#000000';
  return hslString;
}

export default function ButtonStyleEditor({
  text,
  onTextChange,
  backgroundColor = '#000000',
  textColor = '#FFFFFF',
  strokeColor = '#000000',
  borderRadius = '8px',
  onStyleChange,
  className,
}: ButtonStyleEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(text);
  const [localBgColor, setLocalBgColor] = useState(() => hslToHex(backgroundColor));
  const [localTextColor, setLocalTextColor] = useState(() => hslToHex(textColor));
  const [localStrokeColor, setLocalStrokeColor] = useState(() => hslToHex(strokeColor));
  const [localBorderRadius, setLocalBorderRadius] = useState(borderRadius);
  const inputRef = useRef<HTMLInputElement>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    setLocalBgColor(hslToHex(backgroundColor));
    setLocalTextColor(hslToHex(textColor));
    setLocalStrokeColor(hslToHex(strokeColor));
    setLocalBorderRadius(borderRadius);
  }, [backgroundColor, textColor, strokeColor, borderRadius]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(text);
  };

  const handleSave = () => {
    if (savingRef.current) return;
    savingRef.current = true;
    
    setIsEditing(false);
    if (editValue.trim() !== text && editValue.trim()) {
      onTextChange(editValue.trim());
    }
    if (onStyleChange) {
      onStyleChange({
        backgroundColor: localBgColor,
        textColor: localTextColor,
        strokeColor: localStrokeColor,
        borderRadius: localBorderRadius,
      });
    }
    
    setTimeout(() => {
      savingRef.current = false;
    }, 100);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(text);
    setLocalBgColor(hslToHex(backgroundColor));
    setLocalTextColor(hslToHex(textColor));
    setLocalStrokeColor(hslToHex(strokeColor));
    setLocalBorderRadius(borderRadius);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-3 w-full max-w-md">
        {/* Text Input */}
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-background border-2 border-primary rounded-lg px-4 py-2 outline-none font-medium text-sm"
          style={{ 
            backgroundColor: localBgColor, 
            color: localTextColor,
            borderColor: localStrokeColor,
            borderRadius: localBorderRadius
          }}
        />
        
        {/* Compact Styling Controls */}
        {onStyleChange && (
          <Card className="p-3 bg-muted/30">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Background</Label>
                <div className="flex gap-1">
                  <Input
                    type="color"
                    value={localBgColor}
                    onChange={(e) => setLocalBgColor(e.target.value)}
                    className="w-10 h-8 p-0.5"
                  />
                  <Input
                    type="text"
                    value={localBgColor}
                    onChange={(e) => setLocalBgColor(e.target.value)}
                    className="flex-1 h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Text Color</Label>
                <div className="flex gap-1">
                  <Input
                    type="color"
                    value={localTextColor}
                    onChange={(e) => setLocalTextColor(e.target.value)}
                    className="w-10 h-8 p-0.5"
                  />
                  <Input
                    type="text"
                    value={localTextColor}
                    onChange={(e) => setLocalTextColor(e.target.value)}
                    className="flex-1 h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Stroke Color</Label>
                <div className="flex gap-1">
                  <Input
                    type="color"
                    value={localStrokeColor}
                    onChange={(e) => setLocalStrokeColor(e.target.value)}
                    className="w-10 h-8 p-0.5"
                  />
                  <Input
                    type="text"
                    value={localStrokeColor}
                    onChange={(e) => setLocalStrokeColor(e.target.value)}
                    className="flex-1 h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Border Radius</Label>
                <Input
                  type="text"
                  value={localBorderRadius}
                  onChange={(e) => setLocalBorderRadius(e.target.value)}
                  placeholder="8px"
                  className="h-8 text-xs"
                />
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

  return (
    <button
      onClick={handleClick}
      className={cn(
        'px-8 py-3 font-medium transition-all cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-2 hover:scale-105',
        className
      )}
      style={{ 
        backgroundColor: localBgColor, 
        color: localTextColor,
        border: `2px solid ${localStrokeColor}`,
        borderRadius: localBorderRadius
      }}
    >
      {text || 'Button Text'}
    </button>
  );
}

