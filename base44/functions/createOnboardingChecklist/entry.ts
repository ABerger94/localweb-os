import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { event, data } = await req.json();

    if (!data?.id) {
      return Response.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Create onboarding checklist for new client
    await base44.asServiceRole.entities.OnboardingChecklist.create({
      client_id: data.id,
      welcome_email_sent: false,
      portal_access_granted: false,
      welcome_call_scheduled: false,
      brand_assets_collected: false,
      business_goals_documented: false,
      questionnaire_completed: false,
      strategy_meeting_held: false,
      project_plan_created: false,
      communication_channels_set: false,
      first_project_created: false,
      initial_invoice_sent: false,
      retainer_agreement_signed: false,
    });

    return Response.json({ success: true, message: 'Onboarding checklist created' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});