import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone } from '@/components/icons';
import { usePageHeader } from '@/contexts/PageHeaderContext';

// Cache-busting version - increment this when templates are updated
const TEMPLATE_VERSION = 'v4';

// Retell Agent templates data - only Retell templates for Voice AI Rep
const RETELL_TEMPLATES = [
  {
    name: 'Inbound Voice Agent',
    files: [
      { name: 'Inbound_Voice_Agent.json', path: `/retell-agents/Inbound_Voice_Agent.json?${TEMPLATE_VERSION}` }
    ]
  },
  {
    name: 'Outbound Voice Agent',
    files: [
      { name: 'Outbound_Voice_Agent.json', path: `/retell-agents/Outbound_Voice_Agent.json?${TEMPLATE_VERSION}` }
    ]
  }
];

export default function VoiceAIRepTemplates() {
  usePageHeader({
    title: 'Voice Setter',
    breadcrumbs: [
      { label: 'Voice Setter' },
      { label: 'Templates' },
    ],
  });
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl">
        <div className="space-y-6">

          {/* Retell Templates */}
          <Card className="material-surface scroll-mt-6">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Retell Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                {RETELL_TEMPLATES.map((template, templateIndex) => (
                  <div 
                    key={template.name} 
                    className={templateIndex < RETELL_TEMPLATES.length - 1 ? "border-b border-border" : ""}
                  >
                    {/* Template Header */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-muted/30">
                      <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="font-medium">{template.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {template.files.length} Template{template.files.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    {/* Files */}
                    <div className="divide-y divide-border/50">
                      {template.files.map((file) => (
                        <div 
                          key={file.name}
                          className="px-4 py-2 pl-12 bg-background flex items-center justify-between"
                        >
                          <span className="text-sm text-muted-foreground">{file.name}</span>
                          <a 
                            href={file.path}
                            download={file.name}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
