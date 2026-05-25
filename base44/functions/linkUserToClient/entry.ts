import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// When a client has a user_email set, find the matching user and set their client_id
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await req.json();

    // Support both direct call and entity automation payload
    const client_id = body.client_id || body.event?.entity_id;
    const user_email = body.user_email || body.data?.user_email;

    if (!user_email || !client_id) {
      return Response.json({ error: 'client_id and user_email are required' }, { status: 400 });
    }

    const users = await base44.asServiceRole.entities.User.filter({ email: user_email.toLowerCase().trim() });

    if (users.length === 0) {
      // User doesn't exist yet — invite them
      await base44.users.inviteUser(user_email.toLowerCase().trim(), 'user');
      return Response.json({ success: true, status: 'invited', message: 'User invited — client_id will be set after they register' });
    }

    const targetUser = users[0];
    await base44.asServiceRole.entities.User.update(targetUser.id, { client_id });

    return Response.json({ success: true, status: 'linked', user_id: targetUser.id });
  } catch (error) {
    console.error(error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});