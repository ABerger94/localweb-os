import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ScheduleCallModal({ open, onClose, client, checklistId }) {
  const queryClient = useQueryClient();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const updateChecklist = useMutation({
    mutationFn: (data) => base44.entities.OnboardingChecklist.update(checklistId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["onboarding-checklists"] }),
  });

  const handleSchedule = async () => {
    setSaving(true);
    try {
      if (client?.contact_email && date && time) {
        await base44.integrations.Core.SendEmail({
          to: client.contact_email,
          subject: "Your Welcome Call is Scheduled",
          body: `Hi ${client?.contact_name || "there"},\n\nYour welcome call has been scheduled for ${date} at ${time}.\n\n${notes ? `Notes: ${notes}\n\n` : ""}We look forward to speaking with you!\n\nBest regards,\nLocal Web Connect`,
        });
      }
      if (checklistId) {
        await updateChecklist.mutateAsync({ welcome_call_scheduled: true });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Welcome Call</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Client</Label>
            <Input value={client?.business_name || ""} disabled />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Time</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Notes (optional)</Label>
            <Input
              placeholder="e.g. Google Meet link, agenda..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          {client?.contact_email && date && time && (
            <p className="text-xs text-muted-foreground">
              A confirmation email will be sent to {client.contact_email}.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSchedule} disabled={saving || !date || !time}>
            {saving ? "Scheduling..." : "Confirm & Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}