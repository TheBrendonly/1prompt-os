import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PageSection } from '@/types/editor';
import HeaderSection from '@/components/editor/sections/HeaderSection';
import VoiceAISection from '@/components/editor/sections/VoiceAISection';
import TextAISection from '@/components/editor/sections/TextAISection';
import FormAISection from '@/components/editor/sections/FormAISection';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DemoPage {
  id: string;
  client_id: string;
  slug: string;
  title: string;
  sections: PageSection[];
  is_published: boolean;
}

interface FormSubmitData {
  name: string;
  email: string;
  phone: string;
}

export default function PublicDemoPage() {
  const { slug } = useParams();
  const { toast } = useToast();
  const [demoPage, setDemoPage] = useState<DemoPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'voice-ai' | 'text-ai' | 'form-ai'>('voice-ai');
  const [clientId, setClientId] = useState<string>('');
  const [formUserData, setFormUserData] = useState<FormSubmitData | null>(null);

  // Handle form submission - switch to text-ai tab with user data
  const handleFormSubmitSuccess = (userData: FormSubmitData) => {
    setFormUserData(userData);
    setActiveTab('text-ai');
  };

  useEffect(() => {
    if (slug) {
      fetchDemoPage();
    }
  }, [slug]);

  const fetchDemoPage = async () => {
    try {
      const { data, error} = await supabase
        .from('demo_pages')
        .select('id, client_id, slug, title, sections, published_sections, is_published, text_ai_webhook_url, voice_phone_number, voice_phone_country_code, phone_call_webhook_url, form_ai_webhook_url')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      
      // Use published_sections for public view (fall back to sections if published_sections is empty)
      const sectionsData = (data as any).published_sections || data.sections;
      let parsedSections = typeof sectionsData === 'string' 
        ? JSON.parse(sectionsData) 
        : sectionsData;
      
      // Ensure webhook URLs from columns are merged into sections as fallback
      if (parsedSections && Array.isArray(parsedSections)) {
        parsedSections = parsedSections.map((section: any) => {
          if (section.type === 'textAISection' && !section.properties?.webhookUrl && data.text_ai_webhook_url) {
            return {
              ...section,
              properties: { ...section.properties, webhookUrl: data.text_ai_webhook_url }
            };
          }
          if (section.type === 'voiceAISection') {
            const props = section.properties || {};
            return {
              ...section,
              properties: {
                ...props,
                phoneNumber: props.phoneNumber || data.voice_phone_number,
                countryCode: props.countryCode || data.voice_phone_country_code,
                webhookUrl: props.webhookUrl || data.phone_call_webhook_url,
              }
            };
          }
          if (section.type === 'formAISection' && !section.properties?.webhookUrl && data.form_ai_webhook_url) {
            return {
              ...section,
              properties: { ...section.properties, webhookUrl: data.form_ai_webhook_url }
            };
          }
          return section;
        });
      }
      
      setDemoPage({
        ...data,
        sections: parsedSections || []
      } as DemoPage);
      setClientId(data.client_id);
    } catch (error: any) {
      console.error('Error fetching demo page:', error);
      toast({
        title: 'Error',
        description: 'Demo page not found or is not published',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!demoPage) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Demo Page Not Found</h1>
          <p className="text-muted-foreground">This demo page doesn't exist or is not published yet.</p>
        </div>
      </div>
    );
  }

  const headerSection = demoPage.sections.find(s => s.type === 'header');
  const voiceSection = demoPage.sections.find(s => s.type === 'voiceAISection');
  const textSection = demoPage.sections.find(s => s.type === 'textAISection');
  const formSection = demoPage.sections.find(s => s.type === 'formAISection');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      {headerSection && headerSection.visible && (
        <HeaderSection
          section={headerSection}
          isSelected={false}
          isEditor={false}
          onSelect={() => {}}
          onUpdateProperty={() => {}}
        />
      )}

      {/* Tab Navigation */}
      <div className="border-b border-border bg-background">
        <div className="container max-w-6xl mx-auto px-4">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="h-auto bg-transparent p-0 border-0 flex justify-center w-full">
              <TabsTrigger
                value="voice-ai"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3"
              >
                Voice AI
              </TabsTrigger>
              <TabsTrigger
                value="text-ai"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3"
              >
                Text AI
              </TabsTrigger>
              <TabsTrigger
                value="form-ai"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3"
              >
                Form AI
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content Sections */}
      {activeTab === 'voice-ai' && voiceSection && voiceSection.visible && (
        <VoiceAISection
          section={voiceSection}
          isSelected={false}
          isEditor={false}
          onSelect={() => {}}
          onUpdateProperty={() => {}}
        />
      )}
      {activeTab === 'text-ai' && textSection && textSection.visible && (
        <TextAISection
          section={textSection}
          isSelected={false}
          isEditor={false}
          onSelect={() => {}}
          onUpdateProperty={() => {}}
          clientId={clientId}
          formUserData={formUserData}
        />
      )}
      {activeTab === 'form-ai' && formSection && formSection.visible && (
        <FormAISection
          section={formSection}
          isSelected={false}
          isEditor={false}
          onSelect={() => {}}
          onUpdateProperty={() => {}}
          onFormSubmitSuccess={handleFormSubmitSuccess}
        />
      )}
    </div>
  );
}
