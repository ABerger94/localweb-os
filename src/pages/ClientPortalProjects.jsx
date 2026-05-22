import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import Sidebar from "@/components/shared/Sidebar";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bell } from "lucide-react";
import ClientNotificationPanel from "@/components/client/ClientNotificationPanel";

const navigationItems = [
  { label: "Dashboard", href: "/client-portal", icon: null },
  { label: "Projects", href: "/client-portal/projects", icon: null },
  { label: "Invoices", href: "/client-portal/invoices", icon: null },
  { label: "Retainers", href: "/client-portal/retainers", icon: null },
  { label: "Support Tickets", href: "/client-portal/support", icon: null },
  { label: "Account", href: "/client-portal/account", icon: null },
];

export default function ClientPortalProjects() {
  const [currentClient, setCurrentClient] = useState(null);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list(),
  });

  useEffect(() => {
    async function loadUser() {
      const user = await base44.auth.me();
      const client = clients.find((c) => c.user_email === user.email);
      setCurrentClient(client);
    }
    if (clients.length > 0) loadUser();
  }, [clients]);

  if (!currentClient) return null;

  const clientProjects = projects.filter((p) => p.client_id === currentClient.id);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar items={navigationItems} isClientPortal />

      <div className="flex-1 lg:ml-64">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <PageHeader
              title="Your Projects"
              description="View the status of your website projects"
              className="flex-1"
            />
            <ClientNotificationPanel />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {clientProjects.map((project) => (
              <Card key={project.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">
                      {project.project_name}
                    </h3>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {project.description}
                      </p>
                    )}
                    <div className="flex gap-3 mt-4">
                      <StatusBadge status={project.status} />
                      {project.due_date && (
                        <span className="text-xs text-muted-foreground">
                          Due: {new Date(project.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button asChild variant="outline">
                    <Link to={`/client-portal/projects/${project.id}`}>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}