import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';

const Subscribe = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = React.useState(false);

  const clientId = searchParams.get('client_id') || '';
  const returnUrl = searchParams.get('return_url') || window.location.origin;

  const handleSubscribe = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const body: Record<string, string> = {
        type: 'client',
        return_url: returnUrl,
      };
      // Only pass client_id if it's a real ID (not 'pending' for new accounts)
      if (clientId && clientId !== 'pending') {
        body.client_id = clientId;
      }

      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body,
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast({
        title: 'Checkout Error',
        description: err.message || 'Failed to start checkout',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Activate Sub-Account</CardTitle>
          <p className="text-muted-foreground mt-2">
            Your first sub-account is free. Additional sub-accounts are $10/month each.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">$10</div>
            <div className="text-muted-foreground">/month per sub-account</div>
          </div>

          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span> Full platform access
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span> AI setter configuration
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span> Analytics dashboard
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span> Campaign management
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span> Knowledge base
            </li>
          </ul>

          <Button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Processing...' : 'Subscribe Now'}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Cancel anytime from the Stripe Customer Portal
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Subscribe;
