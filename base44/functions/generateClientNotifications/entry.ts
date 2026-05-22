import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find client associated with this user
    const clients = await base44.entities.Client.list();
    const client = clients.find(c => c.user_email?.toLowerCase() === user.email?.toLowerCase());

    if (!client) {
      return Response.json({ notifications: [] });
    }

    const notifications = [];
    const today = new Date();

    // Fetch related data
    const invoices = await base44.entities.Invoice.filter({ client_id: client.id });
    const retainers = await base44.entities.Retainer.filter({ client_id: client.id });
    const projects = await base44.entities.Project.filter({ client_id: client.id });
    const tickets = await base44.entities.MaintenanceTicket.filter({ client_id: client.id });
    const checklists = await base44.entities.OnboardingChecklist.filter({ client_id: client.id });
    const checklist = checklists[0];

    // Invoice notifications
    invoices.forEach(inv => {
      const dueDate = new Date(inv.due_date);
      const daysUntilDue = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));

      if (inv.status === 'Pending' && daysUntilDue <= 3 && daysUntilDue >= 0) {
        notifications.push({
          id: `inv_due_${inv.id}`,
          type: 'invoice_due',
          title: 'Invoice Due Soon',
          message: `Invoice ${inv.invoice_number} ($${inv.amount}) is due on ${dueDate.toLocaleDateString()}`,
          priority: daysUntilDue <= 1 ? 'high' : 'medium',
          created_date: inv.created_date,
          read: inv.status === 'Paid',
          action_url: '/client-portal/invoices',
        });
      }

      if (inv.status === 'Overdue' || (inv.status === 'Pending' && daysUntilDue < 0)) {
        notifications.push({
          id: `inv_overdue_${inv.id}`,
          type: 'invoice_overdue',
          title: 'Invoice Overdue',
          message: `Invoice ${inv.invoice_number} ($${inv.amount}) is overdue. Please pay as soon as possible.`,
          priority: 'high',
          created_date: inv.created_date,
          read: false,
          action_url: '/client-portal/invoices',
        });
      }
    });

    // Retainer billing notifications
    retainers.filter(r => r.status === 'Active').forEach(ret => {
      const nextBilling = new Date(ret.next_billing_date);
      const daysUntilBilling = Math.floor((nextBilling - today) / (1000 * 60 * 60 * 24));

      if (daysUntilBilling <= 5 && daysUntilBilling >= 0) {
        notifications.push({
          id: `ret_billing_${ret.id}`,
          type: 'retainer_billing',
          title: 'Upcoming Retainer Billing',
          message: `Your ${ret.description} billing of $${ret.monthly_amount} is scheduled for ${nextBilling.toLocaleDateString()}`,
          priority: daysUntilBilling <= 2 ? 'medium' : 'low',
          created_date: ret.created_date,
          read: false,
          action_url: '/client-portal/retainers',
        });
      }
    });

    // Project update notifications
    projects.filter(p => p.status === 'Review' || p.status === 'Delivered').forEach(proj => {
      notifications.push({
        id: `proj_update_${proj.id}`,
        type: 'project_update',
        title: 'Project Ready for Review',
        message: `${proj.project_name} is ready for your review. ${proj.feedback ? 'Feedback received.' : ''}`,
        priority: 'medium',
        created_date: proj.updated_date,
        read: false,
        action_url: '/client-portal/projects',
      });
    });

    // Support ticket notifications
    tickets.filter(t => t.status === 'Resolved' || t.response_notes).forEach(ticket => {
      notifications.push({
        id: `ticket_resp_${ticket.id}`,
        type: 'ticket_response',
        title: 'Ticket Update',
        message: `Your ticket "${ticket.title}" has been updated. Status: ${ticket.status}`,
        priority: ticket.status === 'Resolved' ? 'medium' : 'low',
        created_date: ticket.updated_date,
        read: false,
        action_url: '/client-portal/support',
      });
    });

    // Onboarding action items
    if (checklist) {
      const pendingItems = [];
      
      if (!checklist.questionnaire_completed) pendingItems.push('complete the onboarding questionnaire');
      if (!checklist.brand_assets_collected) pendingItems.push('upload your brand assets');
      if (!checklist.business_goals_documented) pendingItems.push('share your business goals');
      if (!checklist.strategy_meeting_date && !checklist.strategy_meeting_held) pendingItems.push('schedule your strategy meeting');
      if (!checklist.initial_invoice_sent) pendingItems.push('review your setup invoice');
      if (!checklist.retainer_agreement_signed) pendingItems.push('sign your retainer agreement');

      if (pendingItems.length > 0) {
        const firstItem = pendingItems[0];
        const remaining = pendingItems.length - 1;
        
        notifications.push({
          id: `onboard_action_${client.id}`,
          type: 'onboarding_action',
          title: 'Onboarding Action Required',
          message: `Please ${firstItem}${remaining > 0 ? ` and ${remaining} other item(s)` : ''} to continue your onboarding.`,
          priority: 'high',
          created_date: checklist.created_date,
          read: false,
          action_url: '/client-portal/onboarding',
        });
      }
    }

    // Sort by priority and date
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    notifications.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.created_date) - new Date(a.created_date);
    });

    return Response.json({ notifications });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});