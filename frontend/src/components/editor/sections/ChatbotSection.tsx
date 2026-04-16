import { PageSection } from '@/types/editor';
import { useEffect } from 'react';

interface SectionProps {
  section: PageSection;
  isSelected: boolean;
  isEditor: boolean;
  onSelect: () => void;
  onUpdateProperty: (key: string, value: any) => void;
}

export default function ChatbotSection({ section, isSelected, isEditor, onSelect, onUpdateProperty }: SectionProps) {
  const props = section.properties;
  const padding = props.padding || { top: 60, bottom: 60, left: 40, right: 40 };

  useEffect(() => {
    if (!isEditor && props.chatWidgetCode) {
      const container = document.getElementById(`chat-widget-${section.id}`);
      if (container) {
        container.innerHTML = '';
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = props.chatWidgetCode;
        
        const scripts = tempDiv.querySelectorAll('script');
        scripts.forEach((script) => {
          const newScript = document.createElement('script');
          if (script.src) {
            newScript.src = script.src;
          } else {
            newScript.textContent = script.textContent;
          }
          Array.from(script.attributes).forEach((attr) => {
            newScript.setAttribute(attr.name, attr.value);
          });
          container.appendChild(newScript);
        });
        
        const nonScriptElements = tempDiv.querySelectorAll(':not(script)');
        nonScriptElements.forEach((element) => {
          container.appendChild(element.cloneNode(true));
        });
      }
    }
  }, [props.chatWidgetCode, isEditor, section.id]);

  return (
    <div
      onClick={isEditor ? onSelect : undefined}
      className={`
        ${isEditor && isSelected ? 'ring-2 ring-primary' : ''}
        ${isEditor ? 'cursor-pointer hover:ring-1 hover:ring-muted-foreground' : ''}
      `}
      style={{
        paddingTop: `${padding.top}px`,
        paddingBottom: `${padding.bottom}px`,
        paddingLeft: `${padding.left}px`,
        paddingRight: `${padding.right}px`,
      }}
    >
      <div className="container max-w-6xl mx-auto text-center space-y-4">
        <h2 
          className="text-3xl font-bold"
          contentEditable={isEditor && isSelected}
          suppressContentEditableWarning
          onBlur={(e) => isEditor && onUpdateProperty('heading', e.currentTarget.textContent)}
        >
          {props.heading || 'AI Chatbot Demo'}
        </h2>
        <p 
          className="text-muted-foreground max-w-2xl mx-auto"
          contentEditable={isEditor && isSelected}
          suppressContentEditableWarning
          onBlur={(e) => isEditor && onUpdateProperty('subheading', e.currentTarget.textContent)}
        >
          {props.subheading || 'Here you can test your text AI sales rep'}
        </p>
        {isEditor ? (
          <div className="py-12 bg-muted/30 rounded-lg border-2 border-dashed">
            <p className="text-sm text-muted-foreground">
              Chat widget will appear here when published
            </p>
          </div>
        ) : (
          <div id={`chat-widget-${section.id}`}></div>
        )}
      </div>
    </div>
  );
}
