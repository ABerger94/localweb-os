import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, clientId, retainerAmount, description } = await req.json();

    if (!projectId || !clientId || !retainerAmount) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the project to verify it
    const project = await base44.asServiceRole.entities.Project.get(projectId);

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    // Update client pipeline to active_retainer
    await base44.asServiceRole.entities.Client.update(clientId, {
      pipeline_stage: 'Active Retainer',
      status: 'Active',
    });

    // Create retainer record
    const today = new Date();
    const nextMonthDate = new Date(today);
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);

    const retainer = await base44.asServiceRole.entities.Retainer.create({
      client_id: clientId,
      monthly_amount: retainerAmount,
      start_date: today.toISOString().split('T')[0],
      billing_cycle: 'monthly',
      status: 'Active',
      description: description || 'Website Maintenance & Hosting',
      next_billing_date: nextMonthDate.toISOString().split('T')[0],
    });

    // Generate first invoice
    const invoiceNumber = `INV-${Date.now()}`;
    const invoice = await base44.asServiceRole.entities.Invoice.create({
      client_id: clientId,
      invoice_number: invoiceNumber,
      amount: retainerAmount,
      invoice_type: 'retainer',
      status: 'Pending',
      due_date: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      description: description || 'Website Maintenance & Hosting - First Month',
    });

    return Response.json({
      success: true,
      retainer: retainer,
      invoice: invoice,
      message: 'Retainer and invoice created successfully',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});