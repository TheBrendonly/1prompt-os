import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, Phone, ArrowRight } from '@/components/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusTag } from '@/components/StatusTag';
import { usePageHeader } from '@/contexts/PageHeaderContext';
const DebugAIReps = () => {
  const {
    clientId
  } = useParams<{
    clientId: string;
  }>();
  const navigate = useNavigate();

  usePageHeader({ title: 'Debug AI Reps' });
  const debugOptions = [{
    id: 'text-ai-rep',
    title: 'Text AI Rep',
    description: 'Debug issues with your Text AI Rep across WhatsApp, SMS, Instagram, and other messaging channels',
    icon: MessageSquare,
    path: `/client/${clientId}/debug-ai-reps/text`,
    comingSoon: false
  }];
  return <div className="h-full overflow-auto bg-background">
      <div className="container mx-auto max-w-4xl py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-bold text-foreground mb-2 text-lg">Debug AI Reps</h1>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Step-by-step guides to help you identify and fix issues with your AI Representatives.
            Select which AI Rep you want to debug.
          </p>
        </div>

        {/* Debug Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {debugOptions.map(option => {
          const Icon = option.icon;
          return <Card 
            key={option.id} 
            className={`material-surface transition-all duration-200 ${
              option.comingSoon 
                ? 'opacity-50 cursor-not-allowed' 
                : 'cursor-pointer hover:shadow-lg hover:border-primary/50 group'
            }`} 
            onClick={() => !option.comingSoon && navigate(option.path)}
          >
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg transition-colors ${
                      option.comingSoon 
                        ? 'bg-muted' 
                        : 'bg-primary/10 group-hover:bg-primary/20'
                    }`}>
                      <Icon className={`h-12 w-12 ${option.comingSoon ? 'text-muted-foreground' : 'text-primary'}`} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {option.title}
                        {option.comingSoon ? (
                          <StatusTag variant="neutral">Coming Soon</StatusTag>
                        ) : (
                          <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {option.description}
                  </CardDescription>
                </CardContent>
              </Card>;
        })}
        </div>

        {/* Info Box */}
        <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-sm text-foreground">
            <strong>Why use this guide?</strong> This debugging guide helps you identify exactly where an issue is occurring in your AI Rep workflow. 
            Instead of saying "my AI rep is not replying," you'll be able to pinpoint the exact workflow step that's causing the problem, 
            making it much easier for our support team to help you resolve it quickly.
          </p>
        </div>
      </div>
    </div>;
};
export default DebugAIReps;