import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clientId } = await req.json();

    const client = await base44.entities.Client.get(clientId);
    if (!client) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get checklist to identify what's pending
    const checklists = await base44.asServiceRole.entities.OnboardingChecklist.filter({ client_id: clientId });
    const checklist = checklists[0];

    const pendingItems = [];
    if (checklist) {
      if (!checklist.questionnaire_completed) pendingItems.push('Complete the onboarding questionnaire');
      if (!checklist.brand_assets_collected) pendingItems.push('Upload your brand assets (logo, colors, fonts)');
      if (!checklist.business_goals_documented) pendingItems.push('Share your business goals and target audience');
      if (!checklist.strategy_meeting_date && !checklist.strategy_meeting_held) pendingItems.push('Schedule your strategy meeting');
      if (!checklist.initial_invoice_sent) pendingItems.push('Review your setup invoice');
      if (!checklist.retainer_agreement_signed) pendingItems.push('Sign your retainer agreement');
    }

    const pendingList = pendingItems.length > 0
      ? pendingItems.map(item => `• ${item}`).join('\n')
      : '• Complete any remaining onboarding steps';

    const subject = `Action Required: Complete Your Onboarding – ${client.business_name}`;
    const body = `Hi ${client.contact_name || 'there'},

Just a friendly nudge — you still have a few onboarding steps to complete so we can get started on your project!

Here's what's still pending:
${pendingList}

You can log in to your client portal to complete these steps:
https://local-web-connect.base44.app/client-portal

If you have any questions or need help, feel free to reply to this email.

Best regards,
Alek
Local Web Connect`;

    await base44.integrations.Core.SendEmail({
      to: client.contact_email,
      subject,
      body,
      from_name: 'Local Web Connect',
    });

    console.log(`Onboarding reminder sent to ${client.contact_email}`);
    return Response.json({ success: true, message: 'Reminder sent successfully' });
  } catch (error) {
    console.error('Error sending onboarding reminder:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});