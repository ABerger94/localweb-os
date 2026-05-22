import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import Sidebar from "@/components/shared/Sidebar";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import ProjectModal from "@/components/projects/ProjectModal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";

const navigationItems = [
  { label: "Dashboard", href: "/", icon: null },
  { label: "Clients", href: "/clients", icon: null },
  { label: "Onboarding", href: "/onboarding", icon: null },
  { label: "Projects", href: "/projects", icon: null },
  { label: "Invoices", href: "/invoices", icon: null },
  { label: "Retainers", href: "/retainers", icon: null },
  { label: "Support Tickets", href: "/support", icon: null },
  { label: "Designer", href: "/designer", icon: null },
  { label: "QR Code", href: "/qr-code", icon: null },
];

const STATUS_OPTIONS = ["All", "Not Started", "In Progress", "Review", "Approved", "Delivered"];

export default function Projects() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editProject, setEditProject] = useState(null);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Project.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  const clientName = (id) => clients.find((c) => c.id === id)?.business_name || "Unknown";

  const filtered = projects.filter((p) => {
    const matchSearch =
      p.project_name.toLowerCase().includes(search.toLowerCase()) ||
      clientName(p.client_id).toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openNew = () => { setEditProject(null); setModalOpen(true); };
  const openEdit = (p) => { setEditProject(p); setModalOpen(true); };
  const handleDelete = (id) => { if (confirm("Delete this project?")) deleteMutation.mutate(id); };

  // Auto-create retainer workflow
  const createRetainerWorkflow = async (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const retainerAmount = prompt("Enter monthly retainer amount:", "299");
    if (!retainerAmount) return;
    const description = prompt("Retainer description:", "Website Maintenance & Hosting");
    await base44.functions.invoke("createProjectRetainerWorkflow", {
      projectId,
      clientId: project.client_id,
      retainerAmount: parseFloat(retainerAmount),
      description,
    });
    qc.invalidateQueries({ queryKey: ["projects", "retainers", "clients"] });
  };

  const statusCounts = STATUS_OPTIONS.slice(1).reduce((acc, s) => {
    acc[s] = projects.filter((p) => p.status === s).length;
    return acc;
  }, {});

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
            action={openNew}
          />

          {/* Summary counts */}
          <div className="flex flex-wrap gap-2 mb-6">
            {STATUS_OPTIONS.slice(1).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? "All" : s)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                  statusFilter === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50"
                }`}
              >
                {s} ({statusCounts[s] || 0})
              </button>
            ))}
          </div>

          {/* Search + filter bar */}
          <div className="flex gap-3 mb-6 flex-wrap">
            <Input
              placeholder="Search projects or clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Projects list */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-sm">No projects found.</p>
              <Button className="mt-4" onClick={openNew}>
                <Plus className="w-4 h-4 mr-2" /> Create your first project
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filtered.map((project) => (
                <Card key={project.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold text-foreground">{project.project_name}</h3>
                        <StatusBadge status={project.status} />
                      </div>
                      <p className="text-sm text-primary font-medium mt-1">{clientName(project.client_id)}</p>
                      {project.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                        {project.due_date && (
                          <span>Due: <span className="text-foreground font-medium">{new Date(project.due_date).toLocaleDateString()}</span></span>
                        )}
                        {project.feedback && (
                          <span>Feedback: <span className="text-foreground">{project.feedback}</span></span>
                        )}
                      </div>
                      {project.deliverable_url && (
                        <a
                          href={project.deliverable_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3 h-3" /> View Deliverable
                        </a>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => createRetainerWorkflow(project.id)}
                        className="text-xs"
                      >
                        Convert to Retainer
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(project)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(project.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <ProjectModal
            project={editProject}
            clients={clients}
            open={modalOpen}
            onClose={() => setModalOpen(false)}
          />
        </div>
      </div>
    </div>
  );
}