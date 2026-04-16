
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Rocket } from '@/components/icons';

interface CampaignFormProps {
  campaignName: string;
  setCampaignName: (name: string) => void;
  reactivationNotes: string;
  setReactivationNotes: (notes: string) => void;
  isLoading: boolean;
}

const CampaignForm: React.FC<CampaignFormProps> = ({ 
  campaignName, 
  setCampaignName, 
  reactivationNotes, 
  setReactivationNotes, 
  isLoading 
}) => {

  return (
    <div className="material-surface p-8 animate-fade-in">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Rocket className="w-6 h-6 text-primary" />
          <h2 className="text-lg font-semibold text-on-surface">Campaign Configuration</h2>
        </div>
        <p className="text-on-surface-variant">Configure your reactivation campaign details</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="campaign-name" className="text-sm font-medium text-on-surface">
            Campaign Name *
          </Label>
          <Input
            id="campaign-name"
            type="text"
            placeholder="Enter campaign name..."
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            className="material-input"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reactivation-notes" className="text-sm font-medium text-on-surface">
            Reactivation Notes *
          </Label>
          <Textarea
            id="reactivation-notes"
            placeholder="Describe what this reactivation campaign is about..."
            value={reactivationNotes}
            onChange={(e) => setReactivationNotes(e.target.value)}
            className="material-input min-h-[120px] resize-none"
            disabled={isLoading}
          />
          <p className="text-xs text-on-surface-variant">
            These notes will be sent along with your CSV data to help context the campaign
          </p>
        </div>
      </div>
    </div>
  );
};

export default CampaignForm;
