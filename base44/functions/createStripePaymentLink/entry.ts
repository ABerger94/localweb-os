import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@17.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoiceId, amount, clientEmail, clientName } = await req.json();

    if (!invoiceId || !amount || !clientEmail) {
      return Response.json(
        { error: 'Missing required fields: invoiceId, amount, clientEmail' },
        { status: 400 }
      );
    }

    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecret) {
      return Response.json(
        { error: 'Stripe not configured. Please set STRIPE_SECRET_KEY in environment variables.' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecret);

    // Create PaymentIntent for embedded payment
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: {
        invoiceId,
        type: 'invoice_payment',
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Update invoice with Stripe payment intent ID
    await base44.asServiceRole.entities.Invoice.update(invoiceId, {
      stripe_payment_intent_id: paymentIntent.id,
    });

    return Response.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      publishableKey: Deno.env.get('STRIPE_PUBLISHABLE_KEY'),
      message: 'Payment intent created successfully',
    });
  } catch (error) {
    console.error('Stripe payment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});