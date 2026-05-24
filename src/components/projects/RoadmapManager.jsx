import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Calendar, CheckCircle2, Circle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const MILESTONE_STATUSES = ["Planned", "In Progress", "Completed", "On Hold"];

const statusIcons = {
  "Planned": Circle,
  "In Progress": Clock,
  "Completed": CheckCircle2,
  "On Hold": Circle,
};

const statusColors = {
  "Planned": "bg-slate-100 text-slate-700",
  "In Progress": "bg-blue-100 text-blue-700",
  "Completed": "bg-green-100 text-green-700",
  "On Hold": "bg-amber-100 text-amber-700",
};

export default function RoadmapManager({ roadmap = [], onChange }) {
  const [milestones, setMilestones] = useState(roadmap.length > 0 ? roadmap : []);
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [newMilestone, setNewMilestone] = useState({
    title: "",
    description: "",
    due_date: "",
    status: "Planned",
  });

  const handleAdd = () => {
    if (!newMilestone.title) return;
    const updated = [...milestones, { ...newMilestone, id: Date.now().toString() }];
    setMilestones(updated);
    onChange(updated);
    setNewMilestone({ title: "", description: "", due_date: "", status: "Planned" });
    setShowForm(false);
  };

  const handleUpdate = () => {
    if (!newMilestone.title || editingIndex === null) return;
    const updated = [...milestones];
    updated[editingIndex] = { ...newMilestone, id: updated[editingIndex].id };
    setMilestones(updated);
    onChange(updated);
    setNewMilestone({ title: "", description: "", due_date: "", status: "Planned" });
    setEditingIndex(null);
    setShowForm(false);
  };

  const handleDelete = (index) => {
    const updated = milestones.filter((_, i) => i !== index);
    setMilestones(updated);
    onChange(updated);
  };

  const handleEdit = (index) => {
    setNewMilestone(milestones[index]);
    setEditingIndex(index);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingIndex(null);
    setNewMilestone({ title: "", description: "", due_date: "", status: "Planned" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Project Roadmap</h3>
        <Button size="sm" onClick={(e) => { e.stopPropagation(); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Add Milestone
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="space-y-1">
              <Label>Title *</Label>
              <Input
                value={newMilestone.title}
                onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                placeholder="e.g., Design Phase Complete"
              />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                value={newMilestone.description}
                onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                placeholder="Brief description of this milestone"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={newMilestone.due_date}
                  onChange={(e) => setNewMilestone({ ...newMilestone, due_date: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select
                  value={newMilestone.status}
                  onValueChange={(v) => setNewMilestone({ ...newMilestone, status: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MILESTONE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" onClick={editingIndex !== null ? handleUpdate : handleAdd}>
                {editingIndex !== null ? "Update" : "Add"} Milestone
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {milestones.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          <p className="text-sm">No roadmap milestones yet. Add your first milestone to track progress.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {milestones.map((m, index) => {
            const Icon = statusIcons[m.status] || Circle;
            return (
              <Card key={m.id || index}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-medium">{m.title}</h4>
                        <Badge className={statusColors[m.status]}>
                          <Icon className="w-3 h-3 mr-1" />
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
                        onClick={() => handleEdit(index)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(index)}
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