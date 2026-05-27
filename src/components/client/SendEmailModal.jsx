import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function SendEmailModal({ open, onClose, client, checklistId }) {
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [checklist, setChecklist] = useState(null);

  // Fetch checklist data
  useEffect(() => {
    if (open && checklistId) {
      base44.entities.OnboardingChecklist.get(checklistId).then((data) => {
        setChecklist(data);
      });
    }
  }, [open, checklistId]);

  // Pre-fill email content when modal opens
  useEffect(() => {
    if (open && client) {
      const defaultSubject = `Welcome to Local Web Connect, ${client.business_name || ""}!`;
      const defaultBody = `Hi ${client.contact_name || "there"},

Welcome aboard! We're thrilled to have ${client.business_name || "your business"} as a client.

We'll be in touch shortly to get started on your project. If you have any questions in the meantime, please don't hesitate to reach out.

Best regards,
Local Web Connect Team`;
      
      setSubject(defaultSubject);
      setBody(defaultBody);
    }
  }, [open, client]);

  const sendEmail = useMutation({
    mutationFn: (payload) => base44.functions.invoke("sendWelcomeEmail", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-checklists"] });
      toast.success("Welcome email sent successfully!");
      onClose();
    },
    onError: (error) => {
      toast.error("Failed to send email: " + error.message);
    },
  });

  const handleSend = async () => {
    if (!subject || !body) {
      toast.error("Please fill in both subject and message");
      return;
    }

    await sendEmail.mutateAsync({
      checklistId,
      to: client.contact_email,
      subject,
      body,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg" onOpenAutoFocus={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Send Welcome Email</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          {/* Client Info */}
          <div>
            <Label>To</Label>
            <Input 
              value={client?.contact_email || ""} 
              disabled 
              className="bg-muted" 
            />
          </div>

          {/* Status Indicator */}
          {checklist?.welcome_email_sent && (
            <div className="p-3 rounded-lg border bg-green-50 border-green-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm text-green-900">Email Already Sent</p>
                <p className="text-xs text-green-700 mt-1">
                  You can send a follow-up email if needed
                </p>
              </div>
            </div>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
            />
          </div>

          {/* Message Body */}
          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your welcome message..."
              rows={10}
              className="resize-none"
            />
          </div>

          {/* Send Button */}
          <Button 
            onClick={handleSend} 
            className="w-full"
            disabled={sendEmail.isPending || !subject || !body}
          >
            <Send className="mr-2 h-4 w-4" />
            {sendEmail.isPending ? "Sending..." : "Send Email"}
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}