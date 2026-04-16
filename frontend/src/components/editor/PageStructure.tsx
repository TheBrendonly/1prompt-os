import { PageSection, CanvasState } from '@/types/editor';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Trash2, GripVertical } from '@/components/icons';
import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface PageStructureProps {
  canvasState: CanvasState;
  selectedElement: string | null;
  onSelectElement: (id: string | null) => void;
  onDeleteSection: (sectionId: string) => void;
  onRenameSection: (sectionId: string, newName: string) => void;
  activeTab: 'voice-ai' | 'text-ai' | 'form-ai';
}

export default function PageStructure({
  canvasState,
  selectedElement,
  onSelectElement,
  onDeleteSection,
  onRenameSection,
  activeTab,
}: PageStructureProps) {
  const [expandedTabs, setExpandedTabs] = useState<Record<string, boolean>>({
    'voice-ai': true,
    'text-ai': true,
    'form-ai': true,
  });
  const [editingElement, setEditingElement] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const toggleTab = (tabId: string) => {
    setExpandedTabs(prev => ({ ...prev, [tabId]: !prev[tabId] }));
  };

  const getSectionsByTab = (tab: string) => {
    return canvasState.sections.filter(section => {
      if (tab === 'voice-ai') return section.type === 'voiceAISection';
      if (tab === 'text-ai') return section.type === 'textAISection';
      if (tab === 'form-ai') return section.type === 'formAISection';
      return false;
    });
  };

  const getSectionDisplayName = (section: PageSection) => {
    if (section.properties?.customName) return section.properties.customName;
    
    switch (section.type) {
      case 'voiceAISection': return 'Voice AI Content';
      case 'textAISection': return 'Text AI Content';
      case 'formAISection': return 'Form AI Content';
      default: return section.type;
    }
  };

  const handleRename = (sectionId: string) => {
    if (editName.trim()) {
      onRenameSection(sectionId, editName.trim());
    }
    setEditingElement(null);
  };

  const tabs = [
    { id: 'voice-ai', label: 'Voice AI' },
    { id: 'text-ai', label: 'Text AI' },
    { id: 'form-ai', label: 'Form AI' },
  ];

  return (
    <Collapsible defaultOpen={true} className="border-b">
      <CollapsibleTrigger className="flex items-center gap-2 w-full hover:bg-muted/50 p-3">
        <ChevronDown className="h-4 w-4" />
        <span className="text-sm font-semibold">Page Layers</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3 space-y-1">
              {/* Header Section - Always visible */}
              <div
                className={`
                  flex items-center gap-2 p-2 rounded-md cursor-pointer
                  ${selectedElement === 'header-1' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}
                `}
                onClick={() => onSelectElement('header-1')}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm flex-1">Header</span>
              </div>

              {/* Tab Navigation - Always visible */}
              <div
                className={`
                  flex items-center gap-2 p-2 rounded-md cursor-pointer
                  ${selectedElement === 'tabs-1' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}
                `}
                onClick={() => onSelectElement('tabs-1')}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm flex-1">Tab Navigation</span>
              </div>

              {/* Each Tab and its sections */}
              {tabs.map(tab => {
                const sections = getSectionsByTab(tab.id);
                const isExpanded = expandedTabs[tab.id];
                const isActive = activeTab === tab.id;

                return (
                  <div key={tab.id} className="mb-2">
                    <div
                      className={`
                        flex items-center gap-2 p-2 rounded-md cursor-pointer
                        ${isActive ? 'bg-primary/5 font-medium' : 'hover:bg-muted'}
                      `}
                      onClick={() => toggleTab(tab.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span className="text-sm flex-1">{tab.label}</span>
                      <span className="text-xs text-muted-foreground">{sections.length}</span>
                    </div>

                    {isExpanded && (
                      <div className="ml-6 mt-1 space-y-1">
                        {sections.map(section => (
                          <div
                            key={section.id}
                            className={`
                              flex items-center gap-2 p-2 rounded-md group
                              ${selectedElement === section.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}
                            `}
                          >
                            <GripVertical className="h-3 w-3 text-muted-foreground cursor-move" />
                            
                            {editingElement === section.id ? (
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onBlur={() => handleRename(section.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleRename(section.id);
                                  if (e.key === 'Escape') setEditingElement(null);
                                }}
                                className="flex-1 bg-transparent border-none outline-none text-sm"
                                autoFocus
                              />
                            ) : (
                              <span
                                className="text-sm flex-1 cursor-pointer"
                                onClick={() => onSelectElement(section.id)}
                                onDoubleClick={() => {
                                  setEditingElement(section.id);
                                  setEditName(getSectionDisplayName(section));
                                }}
                              >
                                {getSectionDisplayName(section)}
                              </span>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSection(section.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
      </CollapsibleContent>
    </Collapsible>
  );
}
