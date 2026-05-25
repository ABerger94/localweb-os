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

Welcome aboard! I'm excited to work with you.

You now have access to the client portal where you can:
- View the projects I am working on for you and their progress
- Track invoices and further monthly payments
- Submit support tickets for your apps/sites
- Complete your onboarding questionnaire

If you have any questions, ideas, etc. - don't hesitate to reach out.

You can login to your client portal/account by signing up with your email at https://local-web-connect.base44.app/client-portal. Once signed up, you can login and access the portal.

Best regards,
Alek`;

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