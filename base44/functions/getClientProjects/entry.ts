import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { client_id } = await req.json().catch(() => ({}));

    // Verify the requesting user actually owns this client_id
    const allowedClientId = user.client_id || null;

    // Admins can request any client_id; regular users can only request their own
    const targetClientId = user.role === 'admin' ? client_id : allowedClientId;

    if (!targetClientId) {
      return Response.json({ projects: [], assets: [] });
    }

    const [projects, assets] = await Promise.all([
      base44.asServiceRole.entities.Project.filter({ client_id: targetClientId }),
      base44.asServiceRole.entities.DesignAsset.filter({ client_id: targetClientId }),
    ]);

    return Response.json({ projects, assets });
  } catch (error) {
    console.error('getClientProjects error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});