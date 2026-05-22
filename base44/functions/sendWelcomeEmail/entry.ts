import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clientId, checklistId, customSubject, customBody } = await req.json();

    // Get client info
    const client = await base44.entities.Client.get(clientId);
    if (!client) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    const to = client.contact_email;
    const subject = customSubject || `Welcome to Local Web Connect - ${client.business_name}`;
    const body = customBody || `Hi ${client.contact_name || 'there'},

Welcome to Local Web Connect! We're excited to work with you.

Your client portal is ready for you to access. You can log in to:
- Track your projects
- View invoices and payments
- Complete your onboarding checklist
- Submit support tickets

If you have any questions, please don't hesitate to reach out.

Best regards,
Local Web Connect Team`;

    // Validate input
    if (!to || !subject || !body) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Send email using Base44 integration
    await base44.integrations.Core.SendEmail({
      to,
      subject,
      body,
    });

    // Update checklist to mark email as sent
    await base44.entities.OnboardingChecklist.update(checklistId, {
      welcome_email_sent: true,
    });

    return Response.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});