import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function SendEmailModal({ open, onClose, client, checklistId }) {
  const queryClient = useQueryClient();
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    subject: `Welcome to Local Web Connect, ${client?.business_name || ""}!`,
    body: `Hi ${client?.contact_name || "there"},\n\nWelcome aboard! We're excited to work with you.\n\nPlease let us know if you have any questions.\n\nBest,\nLocal Web Connect`,
  });

  const handleSend = async () => {
    setSending(true);
    await base44.integrations.Core.SendEmail({
      to: client.contact_email,
      subject: form.subject,
      body: form.body,
    });
    if (checklistId) {
      await base44.entities.OnboardingChecklist.update(checklistId, { welcome_email_sent: true });
      queryClient.invalidateQueries({ queryKey: ["onboarding-checklists"] });
    }
    setSending(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Welcome Email</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label>To</Label>
            <Input value={client?.contact_email || ""} disabled className="mt-1" />
          </div>
          <div>
            <Label>Subject</Label>
            <Input
              className="mt-1"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea
              className="mt-1 h-40"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? "Sending..." : "Send Email"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}