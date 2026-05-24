import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Calendar, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const MILESTONE_STATUSES = ["Planned", "In Progress", "Completed", "On Hold"];

const statusIcons = {
  "Planned": null,
  "In Progress": Clock,
  "Completed": CheckCircle2,
  "On Hold": Clock,
};

const statusColors = {
  "Planned": "bg-slate-100 text-slate-700",
  "In Progress": "bg-blue-100 text-blue-700",
  "Completed": "bg-green-100 text-green-700",
  "On Hold": "bg-amber-100 text-amber-700",
};

export default function RoadmapManager({ roadmap = [], onChange }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    status: "Planned",
  });

  const milestones = Array.isArray(roadmap) ? roadmap : [];

  const handleAddClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(null);
    setFormData({ title: "", description: "", due_date: "", status: "Planned" });
    setShowForm(true);
  };

  const handleEditClick = (e, milestone) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(milestone.id);
    setFormData({
      title: milestone.title,
      description: milestone.description || "",
      due_date: milestone.due_date || "",
      status: milestone.status || "Planned",
    });
    setShowForm(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!formData.title.trim()) return;

    let updated;
    if (editingId) {
      updated = milestones.map((m) =>
        m.id === editingId ? { ...formData, id: m.id } : m
      );
    } else {
      updated = [...milestones, { ...formData, id: Date.now().toString() }];
    }

    onChange(updated);
    setShowForm(false);
    setFormData({ title: "", description: "", due_date: "", status: "Planned" });
  };

  const handleCancel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowForm(false);
    setEditingId(null);
    setFormData({ title: "", description: "", due_date: "", status: "Planned" });
  };

  const handleDelete = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = milestones.filter((m) => m.id !== id);
    onChange(updated);
  };

  return (
    <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Project Roadmap</h3>
        <Button size="sm" onClick={handleAddClick}>
          <Plus className="w-4 h-4 mr-1" /> Add Milestone
        </Button>
      </div>

      {showForm && (
        <Card onClick={(e) => e.stopPropagation()}>
          <CardContent className="pt-4">
            <form onSubmit={handleSave} className="space-y-3" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-1">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Design Phase Complete"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this milestone"
                  rows={2}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => setFormData({ ...formData, status: v })}
                  >
                    <SelectTrigger onClick={(e) => e.stopPropagation()}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MILESTONE_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" size="sm">
                  {editingId ? "Update" : "Add"} Milestone
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {milestones.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          <p className="text-sm">No roadmap milestones yet. Add your first milestone to track progress.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {milestones.map((m) => {
            const Icon = statusIcons[m.status];
            return (
              <Card key={m.id} onClick={(e) => e.stopPropagation()}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-medium">{m.title}</h4>
                        <Badge className={statusColors[m.status]}>
                          {Icon && <Icon className="w-3 h-3 mr-1" />}
                          {m.status}
                        </Badge>
                      </div>
                      {m.description && (
                        <p className="text-sm text-muted-foreground mb-2">{m.description}</p>
                      )}
                      {m.due_date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          Due: {new Date(m.due_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => handleEditClick(e, m)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => handleDelete(e, m.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}