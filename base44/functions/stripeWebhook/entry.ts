import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@17.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!stripeSecret || !webhookSecret) {
      return Response.json(
        { error: 'Stripe not configured. Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET.' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecret);
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return Response.json({ error: 'Missing Stripe signature' }, { status: 400 });
    }

    const body = await req.text();
    
    // Verify webhook signature BEFORE any auth checks
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      return Response.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }

    // Handle payment success
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const invoiceId = session.metadata?.invoiceId;

      if (invoiceId) {
        try {
          // Update invoice to Paid
          await base44.asServiceRole.entities.Invoice.update(invoiceId, {
            status: 'Paid',
            paid_date: new Date().toISOString().split('T')[0],
            stripe_payment_intent_id: session.payment_intent as string,
          });

          console.log(`Invoice ${invoiceId} marked as paid via Stripe webhook`);
        } catch (err) {
          console.error(`Failed to update invoice ${invoiceId}:`, err);
        }
      }
    }

    return Response.json({ received: true, eventId: event.id });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});