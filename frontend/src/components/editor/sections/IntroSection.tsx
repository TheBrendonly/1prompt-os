import { PageSection } from '@/types/editor';

interface SectionProps {
  section: PageSection;
  isSelected: boolean;
  isEditor: boolean;
  onSelect: () => void;
  onUpdateProperty: (key: string, value: any) => void;
}

export default function IntroSection({ section, isSelected, isEditor, onSelect, onUpdateProperty }: SectionProps) {
  const props = section.properties;
  const padding = props.padding || { top: 60, bottom: 40, left: 40, right: 40 };

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
        <h1 
          className="text-4xl md:text-5xl font-bold tracking-tight"
          contentEditable={isEditor && isSelected}
          suppressContentEditableWarning
          onBlur={(e) => isEditor && onUpdateProperty('heading', e.currentTarget.textContent)}
        >
          {props.heading || 'Welcome to Our AI Demo'}
        </h1>
        <p 
          className="text-xl text-muted-foreground max-w-3xl mx-auto"
          contentEditable={isEditor && isSelected}
          suppressContentEditableWarning
          onBlur={(e) => isEditor && onUpdateProperty('subheading', e.currentTarget.textContent)}
        >
          {props.subheading || 'Experience the capabilities of our AI agents'}
        </p>
      </div>
    </div>
  );
}
