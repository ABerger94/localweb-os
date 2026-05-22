import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import Sidebar from "@/components/shared/Sidebar";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";

const navigationItems = [
  { label: "Dashboard", href: "/", icon: null },
  { label: "Clients", href: "/clients", icon: null },
  { label: "Projects", href: "/projects", icon: null },
  { label: "Invoices", href: "/invoices", icon: null },
  { label: "Retainers", href: "/retainers", icon: null },
  { label: "Designer", href: "/designer", icon: null },
];

export default function Projects() {
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const getClientName = (clientId) => {
    return clients.find((c) => c.id === clientId)?.business_name || "Unknown";
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar items={navigationItems} />

      <div className="flex-1 lg:ml-64">
        <div className="p-4 sm:p-6 lg:p-8">
          <PageHeader
            title="Projects"
            description="Track all client projects"
            actionLabel="New Project"
            actionIcon={Plus}
          />

          <div className="grid grid-cols-1 gap-4">
            {projects.map((project) => (
              <Card key={project.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground">
                      {project.project_name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getClientName(project.client_id)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {project.description}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <StatusBadge status={project.status} />
                      {project.due_date && (
                        <span className="text-xs text-muted-foreground">
                          Due: {new Date(project.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}