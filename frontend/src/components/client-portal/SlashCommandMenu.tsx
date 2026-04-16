import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  Heading1, 
  Heading2, 
  Heading3, 
  Type, 
  List, 
  ListOrdered,
  Image,
  TextCursorInput,
  CheckSquare,
  Minus,
  MoveVertical
} from '@/components/icons';

export type BlockType = 
  | 'heading1' 
  | 'heading2' 
  | 'heading3' 
  | 'paragraph' 
  | 'bullet_list'
  | 'numbered_list'
  | 'image'
  | 'text_input'
  | 'checkbox'
  | 'divider'
  | 'spacer';

interface CommandOption {
  type: BlockType;
  label: string;
  description: string;
  icon: React.ElementType;
  category: 'text' | 'media' | 'input' | 'layout';
}

const commandOptions: CommandOption[] = [
  { type: 'heading1', label: 'Heading 1', description: 'Large section heading', icon: Heading1, category: 'text' },
  { type: 'heading2', label: 'Heading 2', description: 'Medium section heading', icon: Heading2, category: 'text' },
  { type: 'heading3', label: 'Heading 3', description: 'Small section heading', icon: Heading3, category: 'text' },
  { type: 'paragraph', label: 'Paragraph', description: 'Plain text', icon: Type, category: 'text' },
  { type: 'bullet_list', label: 'Bullet List', description: 'Unordered list', icon: List, category: 'text' },
  { type: 'numbered_list', label: 'Numbered List', description: 'Ordered list', icon: ListOrdered, category: 'text' },
  { type: 'image', label: 'Image', description: 'Add an image', icon: Image, category: 'media' },
  { type: 'text_input', label: 'Text Input', description: 'Form text field', icon: TextCursorInput, category: 'input' },
  { type: 'checkbox', label: 'Checkbox', description: 'Checkable item', icon: CheckSquare, category: 'input' },
  { type: 'divider', label: 'Divider', description: 'Horizontal line', icon: Minus, category: 'layout' },
  { type: 'spacer', label: 'Spacer', description: 'Add vertical space', icon: MoveVertical, category: 'layout' },
];

interface SlashCommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: BlockType) => void;
  position: { top: number; left: number };
  filter: string;
}

const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({
  isOpen,
  onClose,
  onSelect,
  position,
  filter
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  const filteredOptions = commandOptions.filter(option =>
    option.label.toLowerCase().includes(filter.toLowerCase()) ||
    option.description.toLowerCase().includes(filter.toLowerCase())
  );

  // Adjust position to stay within viewport
  useEffect(() => {
    if (menuRef.current && isOpen) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let left = position.left;
      let top = position.top;
      
      if (left + rect.width > viewportWidth - 20) {
        left = viewportWidth - rect.width - 20;
      }
      if (left < 20) left = 20;
      
      if (top + rect.height > viewportHeight - 20) {
        top = position.top - rect.height - 10;
      }
      
      setAdjustedPosition({ top, left });
    }
  }, [position, isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filter]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          e.stopPropagation();
          if (filteredOptions[selectedIndex]) {
            onSelect(filteredOptions[selectedIndex].type);
          }
          break;
        case 'Escape':
          e.preventDefault();
          e.stopPropagation();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, selectedIndex, filteredOptions, onSelect, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Use timeout to prevent immediate closing
    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const categories = ['text', 'media', 'input', 'layout'] as const;
  const groupedOptions = categories.reduce((acc, category) => {
    acc[category] = filteredOptions.filter(opt => opt.category === category);
    return acc;
  }, {} as Record<string, CommandOption[]>);

  const categoryLabels: Record<string, string> = {
    text: 'Text',
    media: 'Media',
    input: 'Form Inputs',
    layout: 'Layout'
  };

  let globalIndex = -1;

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] w-72 max-h-80 overflow-y-auto bg-popover border border-border rounded-lg shadow-xl"
      style={{ top: adjustedPosition.top, left: adjustedPosition.left }}
      onClick={handleClick}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="p-2">
        <p className="text-xs font-medium text-muted-foreground mb-2 px-2">
          {filter ? `Searching: ${filter}` : 'Add a block'}
        </p>
        
        {filteredOptions.length === 0 ? (
          <p className="text-sm text-muted-foreground px-2 py-4 text-center">
            No blocks found
          </p>
        ) : (
          categories.map(category => {
            const options = groupedOptions[category];
            if (options.length === 0) return null;
            
            return (
              <div key={category} className="mb-2">
                <p className="text-xs font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wide">
                  {categoryLabels[category]}
                </p>
                {options.map(option => {
                  globalIndex++;
                  const isSelected = globalIndex === selectedIndex;
                  const Icon = option.icon;
                  const currentIndex = globalIndex;
                  
                  return (
                    <button
                      key={option.type}
                      className={cn(
                        "w-full flex items-center gap-3 px-2 py-2 rounded-md text-left transition-colors",
                        isSelected ? "bg-accent" : "hover:bg-muted"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(option.type);
                      }}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{option.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{option.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SlashCommandMenu;