import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, User, Building, Database } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { formatInTimeZone } from 'date-fns-tz';

interface SubmitReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  clientId: string;
}

const SubmitReportDialog: React.FC<SubmitReportDialogProps> = ({ 
  open, 
  onOpenChange, 
  campaignId, 
  clientId 
}) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const reportData = {
    accountId: user?.id || 'N/A',
    clientId: clientId,
    campaignId: campaignId,
    timestamp: new Date().toISOString(),
    userEmail: user?.email || 'N/A'
  };

  const reportText = `Support Report Details:
Account ID: ${reportData.accountId}
Client ID: ${reportData.clientId}
Campaign ID: ${reportData.campaignId}
User Email: ${reportData.userEmail}
Report Generated: ${reportData.timestamp}

Please provide this information when contacting support.`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      toast({
        title: "Copied to clipboard",
        description: "Report details have been copied. You can now paste them when contacting support.",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please manually copy the text above.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Submit Support Report
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 p-6">
          <p className="text-sm text-muted-foreground">
            Copy these details to include when contacting support for faster assistance:
          </p>
          
          <Card className="bg-gray-50">
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-gray-700">Account ID</span>
                  </div>
                  <div className="text-sm font-mono bg-white px-3 py-2 rounded border break-all">
                    {reportData.accountId}
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-gray-700">Client ID</span>
                  </div>
                  <div className="text-sm font-mono bg-white px-3 py-2 rounded border break-all">
                    {reportData.clientId}
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2 sm:col-span-2">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-gray-700">Campaign ID</span>
                  </div>
                  <div className="text-sm font-mono bg-white px-3 py-2 rounded border break-all">
                    {reportData.campaignId}
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div>
                    <span className="font-medium">Email:</span> {reportData.userEmail}
                  </div>
                  <div className="text-right">
                    <span className="font-medium">Generated:</span> {formatInTimeZone(new Date(reportData.timestamp), 'America/New_York', 'MMM d, yyyy h:mm a zzz')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Button 
            onClick={copyToClipboard} 
            className="w-full flex items-center justify-center gap-2 h-11"
          >
            <Copy className="w-4 h-4" />
            Copy to Clipboard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubmitReportDialog;