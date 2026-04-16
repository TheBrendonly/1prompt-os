import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Layout, Heading, Phone, Image, MessageSquare } from '@/components/icons';
import { CanvasState, PageSection } from '@/types/editor';
import { nanoid } from 'nanoid';

interface ComponentLibraryProps {
  canvasState: CanvasState;
  onAddSection: (section: PageSection) => void;
}

export default function ComponentLibrary({ canvasState, onAddSection }: ComponentLibraryProps) {
  const addVoiceSection = () => {
    onAddSection({
      id: `voice-${nanoid(8)}`,
      type: 'voiceAISection',
      visible: true,
      properties: {
        heading: 'Voice AI Demo',
        subheading: 'Test our AI voice agent',
        phoneNumber: '',
        countryCode: '+1',
        buttonText: 'Call Now',
        padding: { top: 60, bottom: 60, left: 40, right: 40 },
        backgroundColor: 'hsl(220 13% 91%)',
      },
    });
  };

  const addFormSection = () => {
    onAddSection({
      id: `form-${nanoid(8)}`,
      type: 'formAISection',
      visible: true,
      properties: {
        heading: 'See How Your Meta Ads Will Look',
        subheading: 'Click any creative to test the lead form experience',
        companyPageName: 'Your Company',
        companyPageLogo: '',
        creatives: [],
        padding: { top: 60, bottom: 60, left: 40, right: 40 },
      },
    });
  };

  const addTextSection = () => {
    onAddSection({
      id: `text-${nanoid(8)}`,
      type: 'textAISection',
      visible: true,
      properties: {
        heading: 'Test Your Text AI',
        subheading: 'Chat with your AI agent',
        companyName: 'Your Company',
        platforms: { whatsapp: true, instagram: false, messenger: false, imessage: false },
        activePlatform: 'whatsapp',
        webhookUrl: '',
        padding: { top: 60, bottom: 60, left: 40, right: 40 },
      },
    });
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="font-semibold mb-2 text-sm">Page Structure</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          {canvasState.sections.map(section => (
            <div key={section.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
              <Layout className="h-4 w-4" />
              <span className="capitalize">{section.type.replace(/([A-Z])/g, ' $1').trim()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t">
        <h3 className="font-semibold mb-3 text-sm">Add Components</h3>
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={addVoiceSection}
          >
            <Phone className="h-4 w-4 mr-2" />
            Voice AI Section
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={addTextSection}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Text AI Section
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={addFormSection}
          >
            <Image className="h-4 w-4 mr-2" />
            Form AI Section
          </Button>
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader className="p-4">
          <CardTitle className="text-sm">Tips</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 text-xs text-muted-foreground space-y-2">
          <p>• Click any element to edit it</p>
          <p>• Type directly on text to change it</p>
          <p>• Use the properties panel to customize</p>
          <p>• Changes save automatically</p>
        </CardContent>
      </Card>
    </div>
  );
}
