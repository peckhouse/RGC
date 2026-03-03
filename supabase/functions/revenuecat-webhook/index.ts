import {serve} from 'https://deno.land/std@0.168.0/http/server.ts';
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  // 1. Verify auth
  const auth = req.headers.get('Authorization');
  if (auth !== `Bearer ${Deno.env.get('RC_WEBHOOK_SECRET')}`) {
    return new Response('Unauthorized', {status: 401});
  }

  const body = await req.json();
  const {event} = body;
  const userId: string = event.app_user_id;
  const eventType: string = event.type;

  // 2. Map event → tier
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  let update: Record<string, unknown> = {};

  if (['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION'].includes(eventType)) {
    const isLifetime = (event.product_id as string)?.includes('lifetime');
    update = {
      subscription_tier: isLifetime ? 'lifetime' : 'pro',
      subscription_expires_at: isLifetime
        ? null
        : event.expiration_at_ms
          ? new Date(event.expiration_at_ms).toISOString()
          : null,
      subscription_platform: event.store === 'APP_STORE' ? 'ios' : 'android',
    };
  } else if (['EXPIRATION', 'CANCELLATION'].includes(eventType)) {
    update = {subscription_tier: 'free', subscription_expires_at: null};
  }

  if (Object.keys(update).length > 0) {
    await supabase.from('profiles').update(update).eq('id', userId);
  }

  return new Response('ok', {status: 200});
});
