import React from 'react';
import { useParams } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertTriangle } from '@/components/icons';
import { Button } from '@/components/ui/button';

export const PaymentFailedBanner: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { clientStatus } = useSubscription();

  if (!clientId) return null;

  const status = clientStatus(clientId);

  if (status !== 'grace_period' && status !== 'locked') return null;

  const handleManageBilling = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-portal', {
        body: { type: 'client', client_id: clientId, return_url: window.location.href },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      if (data?.url) window.open(data.url, '_blank');
    } catch (err: any) {
      toast.error(err.message || 'Failed to open billing portal');
    }
  };

  const isLocked = status === 'locked';

  return (
    <div className={`mx-4 mt-4 rounded-lg border p-4 flex items-center justify-between gap-4 ${
      isLocked
        ? 'bg-destructive/10 border-destructive/30 text-destructive'
        : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
    }`}>
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <div>
          <p className="font-medium text-sm">
            {isLocked
              ? 'Account Locked — Payment Failed'
              : 'Payment Failed — Action Required'}
          </p>
          <p className="text-xs opacity-80 mt-0.5">
            {isLocked
              ? 'Your account has been locked due to failed payment. Update your payment method to reactivate.'
              : 'Your recent payment failed. Please update your payment method to avoid losing access.'}
          </p>
        </div>
      </div>
      <Button
        size="sm"
        variant={isLocked ? 'destructive' : 'outline'}
        onClick={handleManageBilling}
        className="shrink-0"
      >
        Update Payment
      </Button>
    </div>
  );
};
