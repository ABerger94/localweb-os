import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // This function should only be called by admin or via scheduled automation
    if (!user || user.role !== 'admin') {
      return Response.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get all active retainers
    const retainers = await base44.asServiceRole.entities.Retainer.filter({
      status: 'Active',
    });

    const today = new Date();
    const invoicesCreated = [];

    for (const retainer of retainers) {
      // Check if next_billing_date is today or in the past
      const nextBillingDate = new Date(retainer.next_billing_date);

      if (nextBillingDate <= today) {
        // Generate unique invoice number
        const invoiceNumber = `RET-${retainer.id.substring(0, 8)}-${Date.now()}`;

        // Create new invoice
        const invoice = await base44.asServiceRole.entities.Invoice.create({
          client_id: retainer.client_id,
          invoice_number: invoiceNumber,
          amount: retainer.monthly_amount,
          invoice_type: 'retainer',
          status: 'Pending',
          due_date: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          description: `${retainer.description} - Monthly Retainer`,
        });

        invoicesCreated.push({
          invoiceId: invoice.id,
          clientId: retainer.client_id,
          amount: retainer.monthly_amount,
        });

        // Update retainer's next_billing_date
        let nextDate = new Date(nextBillingDate);

        // Add one billing cycle
        if (retainer.billing_cycle === 'monthly') {
          nextDate.setMonth(nextDate.getMonth() + 1);
        } else if (retainer.billing_cycle === 'quarterly') {
          nextDate.setMonth(nextDate.getMonth() + 3);
        } else if (retainer.billing_cycle === 'annual') {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        }

        await base44.asServiceRole.entities.Retainer.update(retainer.id, {
          next_billing_date: nextDate.toISOString().split('T')[0],
        });
      }
    }

    return Response.json({
      success: true,
      invoicesCreated: invoicesCreated.length,
      invoices: invoicesCreated,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});