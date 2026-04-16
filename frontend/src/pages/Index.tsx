import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import RealTimeDashboard from '@/components/RealTimeDashboard';
import Auth from './Auth';
import RetroLoader from '@/components/RetroLoader';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <RetroLoader />;
  }

  if (!user) {
    return <Auth />;
  }

  // Return the new real-time dashboard
  return <RealTimeDashboard />;
};

export default Index;