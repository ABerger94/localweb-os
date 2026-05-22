import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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

    // For now, return a placeholder Stripe link
    // In production, you would call the Stripe API here
    const stripePaymentLink = `https://checkout.stripe.com/pay/cs_live_placeholder_${invoiceId}`;

    // Update invoice with stripe_payment_intent_id
    await base44.asServiceRole.entities.Invoice.update(invoiceId, {
      stripe_payment_intent_id: `pi_${invoiceId}`,
    });

    return Response.json({
      success: true,
      paymentLink: stripePaymentLink,
      message: 'Payment link created. Stripe integration ready for setup.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});