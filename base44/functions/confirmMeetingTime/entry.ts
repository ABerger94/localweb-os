import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { checklistId, confirmedBy, meetingType } = await req.json();

    if (!checklistId || !confirmedBy) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get checklist and client
    const checklists = await base44.entities.OnboardingChecklist.filter({ id: checklistId });
    const checklist = checklists[0];
    
    if (!checklist) {
      return Response.json({ error: 'Checklist not found' }, { status: 404 });
    }
    
    const clients = await base44.entities.Client.filter({ id: checklist.client_id });
    const client = clients[0];

    // Determine which fields to use based on meeting type
    const historyField = meetingType === 'welcome' ? 'welcome_call_history' : 'meeting_proposal_history';
    const confirmedField = meetingType === 'welcome' ? 'welcome_call_confirmed' : 'strategy_meeting_confirmed';
    const heldField = meetingType === 'welcome' ? 'welcome_call_scheduled' : 'strategy_meeting_held';
    const dateField = meetingType === 'welcome' ? 'welcome_call_date' : 'strategy_meeting_date';

    // Update meeting proposal history to mark latest as confirmed
    let history = [];
    if (checklist[historyField]) {
      try {
        history = JSON.parse(checklist[historyField]);
        // Mark the latest proposal as confirmed
        if (history.length > 0) {
          history[history.length - 1].confirmed = true;
        }
      } catch {
        history = [];
      }
    }

    // Update checklist
    await base44.entities.OnboardingChecklist.update(checklistId, {
      [confirmedField]: true,
      [heldField]: true,
      [historyField]: JSON.stringify(history),
    });

    // Send confirmation emails
    const meetingLabel = meetingType === 'welcome' ? 'Welcome Call' : 'Strategy Meeting';
    const meetingDate = checklist[dateField];
    
    if (confirmedBy === 'agency') {
      // Agency confirmed - notify client
      await base44.integrations.Core.SendEmail({
        to: client.contact_email,
        subject: `${meetingLabel} Confirmed! ✅`,
        body: `Hi ${client.contact_name || 'there'},\n\nGreat news! Your ${meetingLabel.toLowerCase()} has been confirmed for:\n\n📅 ${new Date(meetingDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}\n\nWe're looking forward to speaking with you!\n\nBest regards,\nLocal Web Connect`,
      });
    } else {
      // Client confirmed - notify agency (use service role to list admins)
      const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
      for (const admin of admins) {
        await base44.integrations.Core.SendEmail({
          to: admin.email,
          subject: `${meetingLabel} Confirmed - ${client.business_name}`,
          body: `Hi ${admin.full_name || 'there'},\n\n${client.contact_name} has confirmed the ${meetingLabel.toLowerCase()} for:\n\n📅 ${new Date(meetingDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}\n\nThe onboarding checklist has been updated.\n\nBest regards,\nLocal Web Connect`,
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});