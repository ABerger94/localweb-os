import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { checklistId, to, subject, body } = await req.json();

    // Validate input
    if (!checklistId || !to || !subject || !body) {
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