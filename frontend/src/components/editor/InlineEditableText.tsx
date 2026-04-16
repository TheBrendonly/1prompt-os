import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface InlineEditableTextProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  isEditor?: boolean;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'button' | 'div';
}

export default function InlineEditableText({
  value,
  onChange,
  className,
  placeholder = 'Click to edit',
  isEditor = true,
  as: Component = 'div' as any,
}: InlineEditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = (e: React.MouseEvent) => {
    if (isEditor) {
      e.stopPropagation();
      setIsEditing(true);
      setEditValue(value);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue.trim() && editValue !== value) {
      onChange(editValue.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(value);
    }
  };

  if (isEditing && isEditor) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          'bg-transparent border-2 border-primary rounded px-2 outline-none w-full',
          className
        )}
        placeholder={placeholder}
      />
    );
  }

  return (
    <Component
      onClick={handleClick}
      className={cn(
        isEditor && 'cursor-text hover:bg-primary/5 rounded px-2 -mx-2 transition-colors',
        !value && 'text-muted-foreground italic',
        className
      )}
      style={{ cursor: isEditor ? 'text' : 'default' }}
    >
      {value || placeholder}
    </Component>
  );
}
