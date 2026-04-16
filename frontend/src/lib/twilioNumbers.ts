import { supabase } from '@/integrations/supabase/client';

export interface TwilioPhoneNumber {
  sid: string;
  phone_number: string;
  friendly_name: string;
  sms_url?: string | null;
  capabilities?: {
    sms: boolean;
    voice: boolean;
    mms: boolean;
  };
}

type FetchTwilioPhoneNumbersParams =
  | { clientId: string; accountSid?: never; authToken?: never }
  | { clientId?: never; accountSid: string; authToken: string };

function normalizeTwilioNumbers(value: unknown): TwilioPhoneNumber[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item: any) => ({
      sid: item?.sid || '',
      phone_number: item?.phone_number || item?.phoneNumber || '',
      friendly_name: item?.friendly_name || item?.friendlyName || '',
      sms_url: item?.sms_url || item?.smsUrl || null,
      capabilities: item?.capabilities
        ? {
            sms: Boolean(item.capabilities.sms),
            voice: Boolean(item.capabilities.voice),
            mms: Boolean(item.capabilities.mms),
          }
        : undefined,
    }))
    .filter((item) => Boolean(item.phone_number));
}

export async function fetchTwilioPhoneNumbers(
  params: FetchTwilioPhoneNumbersParams
): Promise<TwilioPhoneNumber[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('No active session');
  }

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const payload = 'clientId' in params
    ? { client_id: params.clientId }
    : { account_sid: params.accountSid, auth_token: params.authToken };

  const response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/twilio-list-numbers`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify(payload),
    }
  );

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result?.error || 'Failed to fetch Twilio numbers');
  }

  return normalizeTwilioNumbers(result?.numbers ?? result?.phone_numbers);
}
