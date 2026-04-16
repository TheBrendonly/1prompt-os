import React, { useEffect, useState } from 'react';
import { useSubscription, SubscriptionStatus } from '@/hooks/useSubscription';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CreditCard, X } from '@/components/icons';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

interface SubscriptionGateProps {
  children: React.ReactNode;
  type: 'agency' | 'client';
  allowedRoute?: boolean;
}

const SubscriptionGate: React.FC<SubscriptionGateProps> = ({ children, type, allowedRoute }) => {
  const { clientStatus, refetch } = useSubscription();
  const { clientId } = useParams<{ clientId: string }>();
  const { user } = useAuth();
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentWindowOpened, setPaymentWindowOpened] = useState(false);
  const [dismissed, setDismissed] = useState(false);


  let status: SubscriptionStatus = 'free';
  if (clientId) {
    status = clientStatus(clientId);
  }

  useEffect(() => {
    setDismissed(false);
    setPaymentWindowOpened(false);
  }, [clientId, status]);

  if (type === 'agency' || allowedRoute) return <>{children}</>;
  if (status === 'active' || status === 'grace_period') return <>{children}</>;
  // 'locked', 'cancelled', 'free' → show gate below

  const handleManageBilling = async () => {
    if (!clientId) return;
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

  const handleSubscribe = async () => {
    if (!clientId) return;

    const paymentWindow = window.open('', '_blank', 'noopener,noreferrer');

    try {
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          type: 'client',
          client_id: clientId,
          return_url: window.location.href,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (!data?.url) throw new Error('No checkout URL returned');

      if (paymentWindow) {
        paymentWindow.location.href = data.url;
      } else {
        window.location.href = data.url;
      }

      setPaymentWindowOpened(true);
      setDismissed(false);
    } catch (err: any) {
      paymentWindow?.close();
      toast.error(err.message || 'Failed to start checkout');
    }
  };

  const handleConfirmPayment = async () => {
    if (!clientId) return;
    setCheckingPayment(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        toast.error('Your session is not ready yet. Please try again in a moment.');
        return;
      }

      const { data: userData, error: authError } = await supabase.auth.getUser(accessToken);
      if (authError || !userData.user) {
        toast.error('We could not verify your session right now. Please try again.');
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-client-subscription', {
        body: { client_id: clientId },
      });

      if (error) {
        const errorMsg = typeof error === 'object' && 'message' in error ? error.message : String(error);
        const isAuthError =
          errorMsg.includes('401') || errorMsg.includes('Unauthorized') ||
          errorMsg.includes('403') || errorMsg.includes('Forbidden') ||
          errorMsg.includes('non-2xx');
        if (isAuthError) {
          toast.error('Session verification is temporarily unavailable. Please try again.');
          return;
        }
        throw error;
      }

      if (data?.subscribed) {
        toast.success('Subscription activated! Sub-account unlocked.');
        await refetch();
        window.location.reload();
      } else {
        toast.error('No active subscription found. Please complete payment first.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to verify subscription');
    } finally {
      setCheckingPayment(false);
    }
  };

  // LOCKED: full-page message, no blurred content
  if (status === 'locked') {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border border-destructive/30 bg-card p-8 text-center shadow-lg">
          <CreditCard className="mx-auto mb-4 h-10 w-10 text-destructive" />
          <h2 className="mb-2 text-xl font-semibold text-foreground">
            Payment Declined
          </h2>
          <p className="mb-6 text-muted-foreground">
            Your payment method was declined after multiple attempts. Please update your payment method to restore access to this sub-account.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={handleManageBilling} className="w-full" size="lg">
              Update Payment Method
            </Button>
            <button
              onClick={handleConfirmPayment}
              disabled={checkingPayment}
              className="inline-flex items-center justify-center rounded-md bg-transparent px-6 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {checkingPayment ? 'Verifying...' : "I've already updated — check now"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CANCELLED / FREE: blurred overlay with subscribe option
  return (
    <div className="relative min-h-[400px]">
      <div className="filter blur-sm pointer-events-none select-none opacity-50">
        {children}
      </div>
      {!dismissed && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md rounded-lg border border-border bg-card p-8 text-center shadow-lg">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => setDismissed(true)}
              className="absolute right-3 top-3 h-8 w-8 !bg-muted !border-border hover:!bg-accent"
              title="Close"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>

            <CreditCard className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold text-foreground">
              {status === 'cancelled' ? 'Subscription Cancelled' : 'Subscription Required'}
            </h2>
            <p className="mb-4 text-muted-foreground">
              {status === 'cancelled'
                ? 'Your subscription for this sub-account has been cancelled. Resubscribe to regain access.'
                : 'This sub-account requires a $10/month subscription to unlock all features.'}
            </p>
            <div className="flex flex-col gap-2">
              {!paymentWindowOpened ? (
                <button
                  onClick={handleSubscribe}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Subscribe — $10/mo
                </button>
              ) : (
                <>
                  <button
                    onClick={handleConfirmPayment}
                    disabled={checkingPayment}
                    className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {checkingPayment ? 'Verifying...' : "I've Completed Payment"}
                  </button>
                  <button
                    onClick={handleSubscribe}
                    className="inline-flex items-center justify-center rounded-md bg-transparent px-6 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Reopen Payment Page
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionGate;
