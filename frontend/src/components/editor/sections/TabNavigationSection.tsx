import { PageSection } from '@/types/editor';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';

interface SectionProps {
  section: PageSection;
  isSelected: boolean;
  isEditor: boolean;
  onSelect: () => void;
  onUpdateProperty: (key: string, value: any) => void;
  activeTab?: 'voice-ai' | 'text-ai' | 'form-ai';
  onTabChange?: (tab: 'voice-ai' | 'text-ai' | 'form-ai') => void;
  tabs?: Array<{ id: string; label: string }>;
  onTabRename?: (tabId: string, newLabel: string) => void;
}

export default function TabNavigationSection({ 
  section, 
  isSelected, 
  isEditor, 
  onSelect,
  activeTab = 'voice-ai',
  onTabChange,
  tabs = [
    { id: 'voice-ai', label: 'Voice AI' },
    { id: 'text-ai', label: 'Text AI' },
    { id: 'form-ai', label: 'Form AI' }
  ],
  onTabRename
}: SectionProps) {
  const [editingTab, setEditingTab] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const handleTabClick = (tab: 'voice-ai' | 'text-ai' | 'form-ai') => {
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const handleDoubleClick = (tab: { id: string; label: string }) => {
    if (isEditor) {
      setEditingTab(tab.id);
      setEditLabel(tab.label);
    }
  };

  const handleRename = (tabId: string) => {
    if (onTabRename && editLabel.trim()) {
      onTabRename(tabId, editLabel.trim());
    }
    setEditingTab(null);
  };

  return (
    <div
      onClick={isEditor ? onSelect : undefined}
      className={`
        border-b border-border bg-background
        ${isEditor && isSelected ? 'ring-2 ring-primary' : ''}
        ${isEditor ? 'cursor-pointer hover:ring-1 hover:ring-muted-foreground' : ''}
      `}
    >
      <div className="container max-w-6xl mx-auto px-4">
        <Tabs value={activeTab} onValueChange={(value) => handleTabClick(value as any)}>
          <TabsList className="h-auto bg-transparent p-0 border-0 flex justify-center w-full">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                onDoubleClick={() => handleDoubleClick(tab)}
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3"
              >
                {editingTab === tab.id ? (
                  <input
                    type="text"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    onBlur={() => handleRename(tab.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(tab.id);
                      if (e.key === 'Escape') setEditingTab(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-transparent border-none outline-none text-sm font-medium w-24"
                    autoFocus
                  />
                ) : (
                  tab.label
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
