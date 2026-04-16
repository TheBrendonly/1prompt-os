import React, { useRef, useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo
} from '@/components/icons';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  title: string;
  onTitleChange: (title: string) => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  title,
  onTitleChange
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);

  // Sanitize HTML content
  const sanitizeContent = (html: string): string => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a'],
      ALLOWED_ATTR: ['href', 'title', 'style'],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      KEEP_CONTENT: true
    });
  };

  // Initialize content on mount
  useEffect(() => {
    if (editorRef.current) {
      const sanitizedContent = sanitizeContent(content || '<p><br></p>');
      editorRef.current.innerHTML = sanitizedContent;
      editorRef.current.focus();
    }
  }, []);

  // Sync external content changes
  useEffect(() => {
    if (editorRef.current && content !== editorRef.current.innerHTML && document.activeElement !== editorRef.current) {
      const sanitizedContent = sanitizeContent(content || '<p><br></p>');
      editorRef.current.innerHTML = sanitizedContent;
    }
  }, [content]);

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    saveSelection();
  };

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      setSelectedRange(selection.getRangeAt(0).cloneRange());
    }
  };

  const restoreSelection = () => {
    if (selectedRange) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(selectedRange);
    }
  };

  const handleEditorChange = () => {
    if (editorRef.current) {
      const sanitizedContent = sanitizeContent(editorRef.current.innerHTML);
      onChange(sanitizedContent);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const sanitizedContent = sanitizeContent(target.innerHTML);
    onChange(sanitizedContent);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle common shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          executeCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          executeCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          executeCommand('underline');
          break;
        case 'z':
          if (e.shiftKey) {
            e.preventDefault();
            executeCommand('redo');
          } else {
            e.preventDefault();
            executeCommand('undo');
          }
          break;
      }
    }
  };

  const formatButtons = [
    { icon: Bold, command: 'bold', tooltip: 'Bold (Ctrl+B)' },
    { icon: Italic, command: 'italic', tooltip: 'Italic (Ctrl+I)' },
    { icon: Underline, command: 'underline', tooltip: 'Underline (Ctrl+U)' },
  ];

  const alignButtons = [
    { icon: AlignLeft, command: 'justifyLeft', tooltip: 'Align Left' },
    { icon: AlignCenter, command: 'justifyCenter', tooltip: 'Align Center' },
    { icon: AlignRight, command: 'justifyRight', tooltip: 'Align Right' },
  ];

  const listButtons = [
    { icon: List, command: 'insertUnorderedList', tooltip: 'Bullet List' },
    { icon: ListOrdered, command: 'insertOrderedList', tooltip: 'Numbered List' },
    { icon: Quote, command: 'formatBlock', value: 'blockquote', tooltip: 'Quote' },
  ];

  const historyButtons = [
    { icon: Undo, command: 'undo', tooltip: 'Undo (Ctrl+Z)' },
    { icon: Redo, command: 'redo', tooltip: 'Redo (Ctrl+Shift+Z)' },
  ];

  return (
    <div className="bg-background border border-border rounded-lg shadow-sm max-w-none">
      {/* Toolbar */}
      <div className="border-b border-border p-2 flex items-center gap-1 flex-wrap bg-muted/30">
        {/* Format buttons */}
        <div className="flex items-center gap-0.5">
          {formatButtons.map(({ icon: Icon, command, tooltip }) => (
            <Button
              key={command}
              size="sm"
              variant="ghost"
              onClick={() => executeCommand(command)}
              title={tooltip}
              className="h-7 w-7 p-0"
            >
              <Icon className="h-3.5 w-3.5" />
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-5 mx-1" />

        {/* Font size */}
        <select
          className="text-xs border border-border rounded px-1.5 py-1 bg-background h-7"
          onChange={(e) => executeCommand('fontSize', e.target.value)}
          defaultValue="3"
        >
          <option value="1">10px</option>
          <option value="2">12px</option>
          <option value="3">14px</option>
          <option value="4">16px</option>
          <option value="5">18px</option>
          <option value="6">24px</option>
          <option value="7">32px</option>
        </select>

        <Separator orientation="vertical" className="h-5 mx-1" />

        {/* Alignment buttons */}
        <div className="flex items-center gap-0.5">
          {alignButtons.map(({ icon: Icon, command, tooltip }) => (
            <Button
              key={command}
              size="sm"
              variant="ghost"
              onClick={() => executeCommand(command)}
              title={tooltip}
              className="h-7 w-7 p-0"
            >
              <Icon className="h-3.5 w-3.5" />
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-5 mx-1" />

        {/* List buttons */}
        <div className="flex items-center gap-0.5">
          {listButtons.map(({ icon: Icon, command, value, tooltip }) => (
            <Button
              key={command}
              size="sm"
              variant="ghost"
              onClick={() => executeCommand(command, value)}
              title={tooltip}
              className="h-7 w-7 p-0"
            >
              <Icon className="h-3.5 w-3.5" />
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-5 mx-1" />

        {/* History buttons */}
        <div className="flex items-center gap-0.5">
          {historyButtons.map(({ icon: Icon, command, tooltip }) => (
            <Button
              key={command}
              size="sm"
              variant="ghost"
              onClick={() => executeCommand(command)}
              title={tooltip}
              className="h-7 w-7 p-0"
            >
              <Icon className="h-3.5 w-3.5" />
            </Button>
          ))}
        </div>
      </div>

      {/* Title Input */}
      <div className="px-4 py-3 border-b border-border bg-background">
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Enter document title..."
          className="w-full text-lg font-semibold border-none outline-none bg-transparent placeholder:text-muted-foreground/60 focus:placeholder:text-muted-foreground/40 transition-colors"
        />
      </div>

      {/* Content Editor */}
      <div className="px-4 py-3">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onMouseUp={saveSelection}
          onKeyUp={saveSelection}
          onPaste={handlePaste}
          className="min-h-[300px] max-w-none outline-none text-sm leading-relaxed focus:ring-2 focus:ring-primary/20 rounded-lg p-3 transition-all duration-200 prose prose-sm max-w-none"
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            lineHeight: '1.75'
          }}
          suppressContentEditableWarning={true}
        />
      </div>
    </div>
  );
};
