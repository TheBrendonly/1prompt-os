import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from '@/components/icons';

const CreateCampaignButton = () => {
  const navigate = useNavigate();

  return (
    <Button 
      onClick={() => navigate('/create')} 
      className="flex items-center gap-2"
    >
      <Plus className="w-4 h-4" />
      New Campaign
    </Button>
  );
};

export default CreateCampaignButton;