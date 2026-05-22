import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { checklistId, datetime, notes, proposedBy } = await req.json();

    if (!checklistId || !datetime || !proposedBy) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get checklist and client
    const checklist = await base44.entities.OnboardingChecklist.get(checklistId);
    const client = await base44.entities.Client.get(checklist.client_id);

    // Create proposal history entry
    const newProposal = {
      proposed_by: proposedBy,
      datetime: datetime,
      notes: notes || '',
      confirmed: false,
      timestamp: new Date().toISOString(),
    };

    // Get existing history or create new array
    let history = [];
    if (checklist.meeting_proposal_history) {
      try {
        history = JSON.parse(checklist.meeting_proposal_history);
      } catch {
        history = [];
      }
    }
    history.push(newProposal);

    // Update checklist with new proposal
    await base44.entities.OnboardingChecklist.update(checklistId, {
      strategy_meeting_date: datetime,
      strategy_meeting_proposed_by: proposedBy,
      strategy_meeting_confirmed: false,
      meeting_proposal_history: JSON.stringify(history),
    });

    // Send email notification
    if (proposedBy === 'agency') {
      // Agency proposed - notify client
      await base44.integrations.Core.SendEmail({
        to: client.contact_email,
        subject: 'Strategy Meeting - New Time Proposed',
        body: `Hi ${client.contact_name || 'there'},\n\nYour agency has proposed a new time for your strategy meeting:\n\n📅 ${new Date(datetime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}\n\n${notes ? `Notes: ${notes}\n\n` : ''}Please log into your client portal to confirm this time or suggest an alternative.\n\nBest regards,\nLocal Web Connect`,
      });
    } else {
      // Client proposed - notify agency admin
      const admins = await base44.entities.User.filter({ role: 'admin' });
      for (const admin of admins) {
        await base44.integrations.Core.SendEmail({
          to: admin.email,
          subject: `Strategy Meeting Request - ${client.business_name}`,
          body: `Hi ${admin.full_name || 'there'},\n\n${client.contact_name} has requested a strategy meeting time:\n\n📅 ${new Date(datetime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}\n\n${notes ? `Client notes: ${notes}\n\n` : ''}Log into the dashboard to confirm or suggest a new time.\n\nBest regards,\nLocal Web Connect`,
        });
      }
    }

    return Response.json({ success: true, history });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});