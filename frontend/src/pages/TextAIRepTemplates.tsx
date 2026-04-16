import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download } from '@/components/icons';
import { usePageHeader } from '@/contexts/PageHeaderContext';

// n8n Workflow templates data - only n8n templates for Text AI Rep
const N8N_WORKFLOW_FOLDERS = [
  {
    name: 'Text Engine',
    files: [
      { name: 'Text_Engine.json', path: '/workflows/text-engine/Text_Engine.json' }
    ]
  },
  {
    name: 'Voice Sales Rep',
    files: [
      { name: 'Get_Lead_Details.json', path: '/workflows/voice-sales-rep/Get_Lead_Details.json' },
      { name: 'Make_Outbound_Call.json', path: '/workflows/voice-sales-rep/Make_Outbound_Call.json' },
      { name: 'Appointment_Booking_Functions.json', path: '/workflows/voice-sales-rep/Appointment_Booking_Functions.json' }
    ]
  },
  {
    name: 'Knowledgebase Automation',
    files: [
      { name: 'Update_Knowledgebase.json', path: '/workflows/knowledgebase-automation/Update_Knowledgebase.json' }
    ]
  },
  {
    name: 'Database Reactivation',
    files: [
      { name: 'Launch_Campaign.json', path: '/workflows/database-reactivation/Launch_Campaign.json' }
    ]
  }
];

export default function TextAIRepTemplates() {
  usePageHeader({
    title: 'Text Setter',
    breadcrumbs: [
      { label: 'Text Setter' },
      { label: 'Templates' },
    ],
  });
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl">
        <div className="space-y-6">

          {/* n8n Templates */}
          <Card className="material-surface scroll-mt-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Download className="w-5 h-5" />
                n8n Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                {N8N_WORKFLOW_FOLDERS.map((folder, folderIndex) => (
                  <div 
                    key={folder.name} 
                    className={folderIndex < N8N_WORKFLOW_FOLDERS.length - 1 ? "border-b border-border" : ""}
                  >
                    {/* Folder Header */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-muted/30">
                      <svg className="h-5 w-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                      </svg>
                      <span className="font-medium">{folder.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {folder.files.length} Workflow{folder.files.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    {/* Files */}
                    <div className="divide-y divide-border/50">
                      {folder.files.map((file) => (
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
