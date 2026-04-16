import React from 'react';
import { Outlet, useParams, useLocation } from 'react-router-dom';
import SubscriptionGate from './SubscriptionGate';
import { useSubscription } from '@/hooks/useSubscription';
import { PaymentFailedBanner } from './PaymentFailedBanner';

// Routes that are always accessible regardless of subscription
const FREE_ROUTES = [
  '/templates',
  '/settings',
  '/account-settings',
  '/manage-clients',
  '/create-client',
];

export const SubscriptionGatedOutlet: React.FC = () => {
  const location = useLocation();
  const { clientId } = useParams<{ clientId: string }>();
  const { clientStatus, loading } = useSubscription();

  // Check if current route is free
  const isFreeRoute = FREE_ROUTES.some(route =>
    location.pathname.endsWith(route)
  );

  // While loading or on free routes, render without gating
  if (loading || isFreeRoute) {
    return <Outlet key={clientId} />;
  }

  const status = clientId ? clientStatus(clientId) : 'active';

  // Grace period: show banner but keep accessible
  if (status === 'grace_period') {
    return (
      <>
        <PaymentFailedBanner />
        <Outlet key={clientId} />
      </>
    );
  }

  // Active: render normally
  if (status === 'active') {
    return <Outlet key={clientId} />;
  }

  // Locked: show banner + gate
  if (status === 'locked') {
    return (
      <>
        <PaymentFailedBanner />
        <SubscriptionGate type="client">
          <Outlet key={clientId} />
        </SubscriptionGate>
      </>
    );
  }

  // Cancelled/free: show gate
  return (
    <SubscriptionGate type="client">
      <Outlet key={clientId} />
    </SubscriptionGate>
  );
};
