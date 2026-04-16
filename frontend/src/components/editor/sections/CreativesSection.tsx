import { PageSection, Creative } from '@/types/editor';
import { Carousel } from '@/components/Carousel';
import { Button } from '@/components/ui/button';
import { Plus } from '@/components/icons';

interface SectionProps {
  section: PageSection;
  isSelected: boolean;
  isEditor: boolean;
  onSelect: () => void;
  onUpdateProperty: (key: string, value: any) => void;
}

export default function CreativesSection({ section, isSelected, isEditor, onSelect, onUpdateProperty }: SectionProps) {
  const props = section.properties;
  const padding = props.padding || { top: 60, bottom: 60, left: 40, right: 40 };
  const creatives = props.creatives || [];

  const renderCreative = (creative: Creative, index: number) => {
    const getAspectRatioStyle = () => {
      switch (creative.format) {
        case '4:5': return { paddingBottom: '125%' };
        case '9:16': return { paddingBottom: '177.78%' };
        default: return { paddingBottom: '100%' };
      }
    };
    const aspectRatioStyle = getAspectRatioStyle();
    
    return (
      <div key={creative.id} className="bg-card rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
        {/* Ad Header */}
        <div className="p-3 flex items-start gap-2.5 border-b">
          <div className="w-9 h-9 rounded-full bg-muted overflow-hidden flex-shrink-0">
            {(creative.logo || props.companyPageLogo) && (
              <img 
                src={creative.logo || props.companyPageLogo} 
                alt="Page logo"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">
              {creative.name || props.companyPageName || "Business"}
            </h3>
            <p className="text-xs text-muted-foreground">Sponsored</p>
          </div>
        </div>

        {/* Ad Description */}
        {creative.description && (
          <div className="px-3 py-2.5">
            <p className="text-sm leading-snug line-clamp-3">{creative.description}</p>
          </div>
        )}

        {/* Ad Media */}
        <div className="relative bg-muted w-full">
          <div style={aspectRatioStyle} className="w-full" />
          <div className="absolute inset-0">
            <img
              src={creative.imageUrl}
              alt={creative.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Ad Footer */}
        <div className="p-3 bg-muted/50 border-t">
          {creative.subtitle && (
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-medium truncate">
              {creative.subtitle}
            </p>
          )}
          <Button className="w-full" size="sm">
            {creative.ctaText || "Learn More"}
          </Button>
        </div>
      </div>
    );
  };

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
      <div className="container max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 
            className="text-3xl font-bold"
            contentEditable={isEditor && isSelected}
            suppressContentEditableWarning
            onBlur={(e) => isEditor && onUpdateProperty('heading', e.currentTarget.textContent)}
          >
            {props.heading || 'Ad Creative Previews'}
          </h2>
          <p 
            className="text-muted-foreground"
            contentEditable={isEditor && isSelected}
            suppressContentEditableWarning
            onBlur={(e) => isEditor && onUpdateProperty('subheading', e.currentTarget.textContent)}
          >
            {props.subheading || 'Here you can see how your ads on Meta will look like'}
          </p>
        </div>

        {creatives.length > 0 ? (
          <Carousel itemsPerView={4}>
            {creatives.map((creative: Creative, index: number) => renderCreative(creative, index))}
          </Carousel>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed">
            <p className="text-muted-foreground mb-4">No creatives added yet</p>
            {isEditor && (
              <p className="text-sm text-muted-foreground">
                Use the properties panel to add creatives
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
