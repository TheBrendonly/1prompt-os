import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Phone } from '@/components/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePageHeader } from '@/contexts/PageHeaderContext';

const DebugVoiceAIRep = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();

  usePageHeader({
    title: 'Debug AI Reps',
    breadcrumbs: [
      { label: 'Debug AI Reps', onClick: () => navigate(`/client/${clientId}/debug-ai-reps`) },
      { label: 'Voice AI Rep' },
    ],
  });
  return (
    <div className="h-full overflow-auto bg-background">
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <Card className="material-surface">
          <CardHeader className="text-center">
            <div className="mx-auto p-4 rounded-full bg-primary/10 w-fit mb-4">
              <Phone className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-lg">Voice AI Rep Debug Guide</CardTitle>
            <CardDescription className="text-sm mt-2">
              Coming soon! This guide will help you debug issues with your Voice AI Rep for inbound and outbound calls.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              In the meantime, if you're experiencing issues with your Voice AI Rep, please post on Skool with details about the problem you're encountering.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DebugVoiceAIRep;
