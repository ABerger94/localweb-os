import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const projects = await base44.asServiceRole.entities.Project.list();
    const clients = await base44.asServiceRole.entities.Client.list();

    return Response.json({ projects, clients });
  } catch (error) {
    console.error('getAdminProjects error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});