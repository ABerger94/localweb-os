import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function SendEmailModal({ open, onClose, client, checklistId }) {
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState(`Welcome to Local Web Connect, ${client?.business_name || ""}!`);
  const [body, setBody] = useState(
    `Hi ${client?.contact_name || "there"},\n\nWelcome aboard! We're thrilled to have ${client?.business_name || "your business"} as a client.\n\nWe'll be in touch shortly to get started.\n\nBest regards,\nLocal Web Connect`
  );
  const [sending, setSending] = useState(false);

  const updateChecklist = useMutation({
    mutationFn: (data) => base44.entities.OnboardingChecklist.update(checklistId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["onboarding-checklists"] }),
  });

  const handleSend = async () => {
    if (!client?.contact_email) return;
    setSending(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: client.contact_email,
        subject,
        body,
      });
      if (checklistId) {
        await updateChecklist.mutateAsync({ welcome_email_sent: true });
      }
      onClose();
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Welcome Email</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>To</Label>
            <Input value={client?.contact_email || ""} disabled />
          </div>
          <div>
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[160px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? "Sending..." : "Send Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}