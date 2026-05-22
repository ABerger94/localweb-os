import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ScheduleCallModal({ open, onClose, client, checklistId }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: "",
    time: "",
    notes: "",
    notify: true,
  });

  const handleSave = async () => {
    setSaving(true);
    if (form.notify && client?.contact_email) {
      const dateStr = form.date && form.time ? `${form.date} at ${form.time}` : form.date || form.time || "TBD";
      await base44.integrations.Core.SendEmail({
        to: client.contact_email,
        subject: `Welcome Call Scheduled – ${client.business_name}`,
        body: `Hi ${client.contact_name || "there"},\n\nYour welcome call has been scheduled for ${dateStr}.\n\n${form.notes ? `Notes: ${form.notes}\n\n` : ""}We look forward to speaking with you!\n\nBest,\nLocal Web Connect`,
      });
    }
    if (checklistId) {
      await base44.entities.OnboardingChecklist.update(checklistId, { welcome_call_scheduled: true });
      queryClient.invalidateQueries({ queryKey: ["onboarding-checklists"] });
    }
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Welcome Call</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date</Label>
              <Input type="date" className="mt-1" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <Label>Time</Label>
              <Input type="time" className="mt-1" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Notes (optional)</Label>
            <Textarea
              className="mt-1"
              placeholder="Agenda or call details..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="notify"
              checked={form.notify}
              onChange={(e) => setForm({ ...form, notify: e.target.checked })}
            />
            <label htmlFor="notify" className="text-sm text-muted-foreground">
              Send confirmation email to {client?.contact_email}
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Confirm & Schedule"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}