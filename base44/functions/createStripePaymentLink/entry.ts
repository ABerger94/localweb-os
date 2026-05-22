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

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Invoice Payment - ${clientName || 'Client'}`,
              description: `Invoice ${invoiceId}`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/client-portal/invoices?payment=success`,
      cancel_url: `${req.headers.get('origin')}/client-portal/invoices?payment=cancelled`,
      customer_email: clientEmail,
      metadata: {
        invoiceId,
        type: 'invoice_payment',
      },
    });

    // Update invoice with Stripe payment intent ID
    await base44.asServiceRole.entities.Invoice.update(invoiceId, {
      stripe_payment_intent_id: session.payment_intent as string,
    });

    return Response.json({
      success: true,
      paymentLink: session.url,
      message: 'Payment link created successfully',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});