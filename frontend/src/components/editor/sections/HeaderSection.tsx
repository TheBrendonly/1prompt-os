import { PageSection } from '@/types/editor';

interface SectionProps {
  section: PageSection;
  isSelected: boolean;
  isEditor: boolean;
  onSelect: () => void;
  onUpdateProperty: (key: string, value: any) => void;
}

export default function HeaderSection({ section, isSelected, isEditor, onSelect }: SectionProps) {
  const props = section.properties;
  const padding = props.padding || { top: 20, bottom: 20, left: 40, right: 40 };

  return (
    <header
      onClick={isEditor ? onSelect : undefined}
      className={`
        sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm
        ${isEditor && isSelected ? 'ring-2 ring-primary' : ''}
        ${isEditor ? 'cursor-pointer hover:ring-1 hover:ring-muted-foreground' : ''}
      `}
    >
      <div className="container flex h-16 items-center justify-center px-8">
        {props.logoUrl ? (
          <img 
            src={props.logoUrl} 
            alt="Logo" 
            className="h-10 w-auto object-contain max-w-[200px]"
          />
        ) : (
          <div className="h-10 w-32 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
            {isEditor ? 'Upload Logo' : 'Logo'}
          </div>
        )}
      </div>
    </header>
  );
}
