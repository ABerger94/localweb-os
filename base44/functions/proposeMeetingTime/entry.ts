import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { checklistId, datetime, notes, proposedBy, meetingType } = await req.json();

    if (!checklistId || !datetime || !proposedBy) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Use service role to read and update checklist (bypasses RLS for client users)
    const checklists = await base44.asServiceRole.entities.OnboardingChecklist.filter({ id: checklistId });
    const checklist = checklists[0];
    
    if (!checklist) {
      return Response.json({ error: 'Checklist not found' }, { status: 404 });
    }
    
    const clients = await base44.asServiceRole.entities.Client.filter({ id: checklist.client_id });
    const client = clients[0];

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
    const historyField = meetingType === 'welcome' ? 'welcome_call_history' : 'meeting_proposal_history';
    if (checklist[historyField]) {
      try {
        history = JSON.parse(checklist[historyField]);
      } catch {
        history = [];
      }
    }
    history.push(newProposal);

    // Update checklist with new proposal using service role
    const updateData = {
      [meetingType === 'welcome' ? 'welcome_call_date' : 'strategy_meeting_date']: datetime,
      [meetingType === 'welcome' ? 'welcome_call_proposed_by' : 'strategy_meeting_proposed_by']: proposedBy,
      [meetingType === 'welcome' ? 'welcome_call_confirmed' : 'strategy_meeting_confirmed']: false,
      [historyField]: JSON.stringify(history),
    };
    await base44.asServiceRole.entities.OnboardingChecklist.update(checklistId, updateData);

    // Send email notification
    const meetingLabel = meetingType === 'welcome' ? 'Welcome Call' : 'Strategy Meeting';
    if (proposedBy === 'agency') {
      // Agency proposed - notify client
      try {
        await base44.integrations.Core.SendEmail({
          to: client.contact_email,
          subject: `${meetingLabel} - New Time Proposed`,
          body: `Hi ${client.contact_name || 'there'},\n\nYour agency has proposed a new time for your ${meetingLabel.toLowerCase()}:\n\n📅 ${new Date(datetime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}\n\n${notes ? `Notes: ${notes}\n\n` : ''}Please log into your client portal to confirm this time or suggest an alternative.\n\nBest regards,\nLocal Web Connect`,
        });
      } catch (emailError) {
        console.error('Failed to send email to client:', emailError.message);
      }
    } else {
      // Client proposed - always notify all admins using service role
      try {
        const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
        for (const admin of admins) {
          try {
            await base44.integrations.Core.SendEmail({
              to: admin.email,
              subject: `${meetingLabel} Request - ${client?.business_name || 'Client'}`,
              body: `Hi ${admin.full_name || 'there'},\n\n${client?.contact_name || 'A client'} has requested a ${meetingLabel.toLowerCase()} time:\n\n📅 ${new Date(datetime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}\n\n${notes ? `Client notes: ${notes}\n\n` : ''}Log into the dashboard to confirm or suggest a new time.\n\nBest regards,\nLocal Web Connect`,
            });
            console.log(`Notified admin: ${admin.email}`);
          } catch (adminEmailError) {
            console.error(`Failed to send email to admin ${admin.email}:`, adminEmailError.message);
          }
        }
      } catch (adminError) {
        console.error('Failed to notify admins:', adminError.message);
      }
    }

    return Response.json({ success: true, history });
  } catch (error) {
    console.error('proposeMeetingTime error:', error.message, error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});