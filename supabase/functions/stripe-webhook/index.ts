/**
 * stripe-webhook — Handles Stripe subscription lifecycle events and fires
 * server-side PostHog analytics for the monetisation funnel.
 *
 * Required env vars (set in Supabase Dashboard → Edge Functions → Secrets):
 *   STRIPE_WEBHOOK_SECRET  — from Stripe Dashboard → Webhooks → signing secret
 *   POSTHOG_API_KEY        — PostHog project API key (same as VITE_POSTHOG_KEY)
 *   POSTHOG_HOST           — PostHog ingestion host (default: https://us.i.posthog.com)
 *
 * Stripe events handled:
 *   customer.subscription.created  → subscription_activated
 *   customer.subscription.deleted  → subscription_cancelled
 */

import Stripe from 'https://esm.sh/stripe@14?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-04-10',
});

const POSTHOG_HOST = Deno.env.get('POSTHOG_HOST') ?? 'https://us.i.posthog.com';
const POSTHOG_API_KEY = Deno.env.get('POSTHOG_API_KEY') ?? '';

/** Fire a PostHog server-side event for a known user. */
async function capturePostHog(
  distinctId: string,
  event: string,
  properties: Record<string, unknown>,
): Promise<void> {
  if (!POSTHOG_API_KEY) return;
  await fetch(`${POSTHOG_HOST}/capture/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: POSTHOG_API_KEY,
      distinct_id: distinctId,
      event,
      properties,
    }),
  }).catch(() => {/* swallow — analytics must not break the webhook response */});
}

/** Resolve Stripe price metadata to human-readable plan + billing_period. */
function resolvePlan(subscription: Stripe.Subscription): {
  plan: string;
  billing_period: 'monthly' | 'annual';
  revenue_cents: number;
} {
  const item = subscription.items.data[0];
  const price = item?.price;
  const interval = price?.recurring?.interval;
  const billing_period: 'monthly' | 'annual' = interval === 'year' ? 'annual' : 'monthly';

  // Use price metadata if set, otherwise infer from amount
  const planMeta = price?.metadata?.plan ?? price?.nickname ?? 'plus';
  const plan = planMeta.toLowerCase().includes('pro') ? 'pro' : 'plus';

  // revenue_cents: the MRR contribution (normalise annual to monthly)
  const unitAmount = price?.unit_amount ?? 0;
  const revenue_cents = billing_period === 'annual' ? Math.round(unitAmount / 12) : unitAmount;

  return { plan, billing_period, revenue_cents };
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!webhookSecret) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET not set');
    return new Response('Webhook secret not configured', { status: 500 });
  }

  let event: Stripe.Event;
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature') ?? '';
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error('[stripe-webhook] Signature verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  // Retrieve the Supabase user ID stored on the Stripe customer
  const getSupabaseUserId = async (customerId: string): Promise<string | null> => {
    try {
      const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
      return (customer.metadata?.supabase_user_id as string) ?? null;
    } catch {
      return null;
    }
  };

  switch (event.type) {
    case 'customer.subscription.created': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = await getSupabaseUserId(subscription.customer as string);
      if (userId) {
        const { plan, billing_period, revenue_cents } = resolvePlan(subscription);
        await capturePostHog(userId, 'subscription_activated', {
          plan,
          billing_period,
          revenue_cents,
        });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = await getSupabaseUserId(subscription.customer as string);
      if (userId) {
        const { plan } = resolvePlan(subscription);
        const startedAt = subscription.start_date * 1000;
        const tenure_days = Math.floor((Date.now() - startedAt) / 86_400_000);
        // Stripe doesn't surface a cancellation reason via webhook — capture if it ever appears
        const reason = (subscription.cancellation_details?.reason as string | undefined) ?? undefined;
        await capturePostHog(userId, 'subscription_cancelled', {
          plan,
          tenure_days,
          ...(reason ? { reason } : {}),
        });
      }
      break;
    }

    default:
      // Unhandled event — return 200 so Stripe doesn't retry
      break;
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
