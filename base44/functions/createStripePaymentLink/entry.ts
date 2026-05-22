import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@17.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user first
    const user = await base44.auth.me();
    if (!user) {
      console.error('No authenticated user');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('Payment request from user:', user.email);

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { invoiceId, amount, clientEmail, clientName } = body;

    if (!invoiceId || !amount || !clientEmail) {
      console.error('Missing required fields:', { invoiceId, amount, clientEmail });
      return Response.json(
        { error: 'Missing required fields: invoiceId, amount, clientEmail' },
        { status: 400 }
      );
    }

    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
    const publishableKey = Deno.env.get('STRIPE_PUBLISHABLE_KEY');
    
    if (!stripeSecret || !publishableKey) {
      console.error('Stripe keys not configured');
      return Response.json(
        { error: 'Stripe not configured. Please set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY in environment variables.' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecret);

    // Create PaymentIntent for embedded payment
    console.log('Creating PaymentIntent for amount:', amount);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        invoiceId,
        type: 'invoice_payment',
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });
    console.log('PaymentIntent created:', paymentIntent.id);

    // Update invoice with Stripe payment intent ID
    console.log('Updating invoice:', invoiceId);
    await base44.asServiceRole.entities.Invoice.update(invoiceId, {
      stripe_payment_intent_id: paymentIntent.id,
    });

    const responseData = {
      success: true,
      clientSecret: paymentIntent.client_secret,
      publishableKey: publishableKey,
      message: 'Payment intent created successfully',
    };
    
    console.log('Returning response:', responseData);
    return Response.json(responseData);
  } catch (error) {
    console.error('Stripe payment error:', error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});