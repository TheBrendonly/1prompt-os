import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  ChevronDown
} from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FloatingToolbarProps {
  isVisible: boolean;
  position: { top: number; left: number };
  onFormat: (format: 'bold' | 'italic' | 'underline') => void;
  onAlign: (align: 'left' | 'center' | 'right') => void;
  onFontSize: (size: string) => void;
  currentFormats: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
  };
}

const fontSizes = [
  { label: 'Small', value: '0.875rem' },
  { label: 'Normal', value: '1rem' },
  { label: 'Large', value: '1.125rem' },
  { label: 'Extra Large', value: '1.25rem' },
];

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  isVisible,
  position,
  onFormat,
  onAlign,
  onFontSize,
  currentFormats
}) => {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useEffect(() => {
    if (toolbarRef.current && isVisible) {
      const rect = toolbarRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      
      let left = position.left;
      if (left + rect.width > viewportWidth - 20) {
        left = viewportWidth - rect.width - 20;
      }
      if (left < 20) left = 20;

      // Position above the selection
      let top = position.top - 50;
      if (top < 10) top = position.top + 30; // If too close to top, position below

      setAdjustedPosition({ top, left });
    }
  }, [position, isVisible]);

  if (!isVisible) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <div
      ref={toolbarRef}
      className="fixed z-[9999] flex items-center gap-1 p-1 bg-popover border border-border rounded-lg shadow-lg"
      style={{ top: adjustedPosition.top, left: adjustedPosition.left }}
      onClick={handleClick}
      onMouseDown={(e) => e.preventDefault()}
    >
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8", currentFormats.bold && "bg-accent")}
        onMouseDown={(e) => {
          e.preventDefault();
          onFormat('bold');
        }}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8", currentFormats.italic && "bg-accent")}
        onMouseDown={(e) => {
          e.preventDefault();
          onFormat('italic');
        }}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8", currentFormats.underline && "bg-accent")}
        onMouseDown={(e) => {
          e.preventDefault();
          onFormat('underline');
        }}
      >
        <Underline className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 gap-1 px-2">
            <span className="text-xs">Size</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent onClick={handleClick}>
          {fontSizes.map(size => (
            <DropdownMenuItem key={size.value} onClick={() => onFontSize(size.value)}>
              {size.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-px h-6 bg-border mx-1" />

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onMouseDown={(e) => {
          e.preventDefault();
          onAlign('left');
        }}
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onMouseDown={(e) => {
          e.preventDefault();
          onAlign('center');
        }}
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onMouseDown={(e) => {
          e.preventDefault();
          onAlign('right');
        }}
      >
        <AlignRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default FloatingToolbar;