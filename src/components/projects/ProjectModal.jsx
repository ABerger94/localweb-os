import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RoadmapManager from "./RoadmapManager";

const STATUSES = ["Not Started", "In Progress", "Review", "Approved", "Delivered"];

export default function ProjectModal({ project, clients, open, onClose }) {
  const qc = useQueryClient();
  const isNew = !project?.id;
  const [activeTab, setActiveTab] = useState("details");

  const [form, setForm] = useState({
    client_id: "",
    project_name: "",
    description: "",
    scope_description: "",
    due_date: "",
    deliverable_url: "",
    status: "Not Started",
    feedback: "",
    roadmap: [],
  });

  useEffect(() => {
    if (project) {
      let roadmapData = [];
      if (project.roadmap) {
        try {
          roadmapData = typeof project.roadmap === "string" ? JSON.parse(project.roadmap) : project.roadmap;
        } catch {
          roadmapData = [];
        }
      }
      setForm({
        client_id: project.client_id || "",
        project_name: project.project_name || "",
        description: project.description || "",
        scope_description: project.scope_description || "",
        due_date: project.due_date || "",
        deliverable_url: project.deliverable_url || "",
        status: project.status || "Not Started",
        feedback: project.feedback || "",
        roadmap: roadmapData,
      });
    } else {
      setForm({ client_id: "", project_name: "", description: "", scope_description: "", due_date: "", deliverable_url: "", status: "Not Started", feedback: "", roadmap: [] });
    }
  }, [project]);

  useEffect(() => {
    if (!open) {
      setActiveTab("details");
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: (data) =>
      isNew ? base44.entities.Project.create(data) : base44.entities.Project.update(project.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-projects"] });
      onClose();
    },
  });

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target?.value ?? e }));

  const handleRoadmapChange = (updatedRoadmap) => {
    setForm((f) => ({ ...f, roadmap: updatedRoadmap }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...form,
      roadmap: JSON.stringify(form.roadmap),
    };
    mutation.mutate(submitData);
  };

  // Only allow closing via explicit user action, not prop changes
  const handleOpenChange = (newOpen) => {
    if (!newOpen) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>{isNew ? "New Project" : `Edit — ${project?.project_name}`}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2" onClick={(e) => e.stopPropagation()}>
          <div className="space-y-1">
            <Label>Client *</Label>
            <Select value={form.client_id} onValueChange={(v) => setForm((f) => ({ ...f, client_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Select client..." /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.business_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Project Name *</Label>
            <Input value={form.project_name} onChange={set("project_name")} required />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea rows={3} value={form.description} onChange={set("description")} />
              </div>

              <div className="space-y-1">
                <Label>Scope Description</Label>
                <Textarea
                  rows={4}
                  value={form.scope_description}
                  onChange={set("scope_description")}
                  placeholder="Detailed project scope, deliverables, and requirements..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Due Date</Label>
              <Input type="date" value={form.due_date} onChange={set("due_date")} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Deliverable URL</Label>
            <Input type="url" value={form.deliverable_url} onChange={set("deliverable_url")} placeholder="https://..." />
          </div>

              <div className="space-y-1">
                <Label>Client Feedback / Notes</Label>
                <Textarea rows={3} value={form.feedback} onChange={set("feedback")} />
              </div>
            </TabsContent>

            <TabsContent value="roadmap" className="mt-4">
              <RoadmapManager roadmap={form.roadmap} onChange={handleRoadmapChange} />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : isNew ? "Create Project" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}