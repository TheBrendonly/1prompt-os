import { CanvasState, PageSection } from '@/types/editor';
import HeaderSection from './sections/HeaderSection';
import TabNavigationSection from './sections/TabNavigationSection';
import VoiceAISection from './sections/VoiceAISection';
import TextAISection from './sections/TextAISection';
import FormAISection from './sections/FormAISection';
import { useDroppable } from '@dnd-kit/core';
interface EditorCanvasProps {
  canvasState: CanvasState;
  selectedElement: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateSection: (sectionId: string, updates: Partial<PageSection>) => void;
  onUpdateProperty: (sectionId: string, key: string, value: any) => void;
  onTabChange: (tab: 'voice-ai' | 'text-ai' | 'form-ai') => void;
}
export default function EditorCanvas({
  canvasState,
  selectedElement,
  onSelectElement,
  onUpdateSection,
  onUpdateProperty,
  onTabChange
}: EditorCanvasProps) {
  const {
    setNodeRef
  } = useDroppable({
    id: 'canvas-drop-zone'
  });
  const activeTab = canvasState.activeTab || 'voice-ai';
  const renderSection = (section: PageSection) => {
    if (!section.visible) return null;
    const isSelected = selectedElement === section.id;
    const commonProps = {
      section,
      isSelected,
      isEditor: true,
      onSelect: () => onSelectElement(section.id),
      onUpdateProperty: (key: string, value: any) => onUpdateProperty(section.id, key, value)
    };
    switch (section.type) {
      case 'header':
        return <HeaderSection key={section.id} {...commonProps} />;
      case 'voiceAISection':
        return activeTab === 'voice-ai' ? <VoiceAISection key={section.id} {...commonProps} /> : null;
      case 'textAISection':
        return activeTab === 'text-ai' ? <TextAISection key={section.id} {...commonProps} clientId={canvasState.clientId} /> : null;
      case 'formAISection':
        return activeTab === 'form-ai' ? <FormAISection key={section.id} {...commonProps} /> : null;
      default:
        return null;
    }
  };
  return <div ref={setNodeRef} className="w-full" onClick={e => {
    if (e.target === e.currentTarget) {
      onSelectElement(null);
    }
  }}>
      <div className="max-w-6xl mx-auto p-0 m-0">
        {canvasState.sections.map(section => renderSection(section))}
      </div>
    </div>;
}