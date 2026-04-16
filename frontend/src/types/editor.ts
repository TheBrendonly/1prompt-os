export interface Padding {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface Creative {
  id: string;
  format: '1:1' | '4:5' | '9:16';
  imageUrl: string;
  title: string;
  subtitle: string;
  ctaText: string;
  description?: string;
  logo?: string;
  name?: string;
}

export interface SectionProperties {
  [key: string]: any;
  padding?: Padding;
  backgroundColor?: string;
}

export interface PageSection {
  id: string;
  type: 'header' | 'tabNavigation' | 'voiceAISection' | 'textAISection' | 'formAISection';
  visible: boolean;
  properties: SectionProperties;
}

export interface CanvasState {
  pageId: string;
  pageTitle: string;
  slug: string;
  clientId: string;
  sections: PageSection[];
  isPublished: boolean;
  activeTab?: 'voice-ai' | 'text-ai' | 'form-ai';
}
