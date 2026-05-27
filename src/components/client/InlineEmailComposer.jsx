import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send } from "lucide-react";

export default function InlineEmailComposer({ client, checklistId, onSent, onCancel }) {
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("Welcome to Our Agency!");
  const [body, setBody] = useState(`Hi ${client?.contact_name || ''},

Welcome aboard! We're excited to work with you.

You now have access to your client portal where you can:
- View your projects and progress
- Track invoices and payments
- Submit support tickets
- Complete your onboarding questionnaire

If you have any questions, don't hesitate to reach out.

Best regards,
Your Agency Team`);
  const [isSending, setIsSending] = useState(false);

  const sendMutation = useMutation({
    mutationFn: (payload) => base44.functions.invoke("sendWelcomeEmail", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-checklists"] });
      onSent?.();
    },
  });

  const handleSend = async () => {
    setIsSending(true);
    await sendMutation.mutateAsync({
      clientId: client.id,
      checklistId,
      customSubject: subject,
      customBody: body,
    });
    setIsSending(false);
  };

  return (
    <div className="mt-3 p-3 rounded-lg border bg-muted/30 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Mail className="w-4 h-4 text-primary" />
        Compose Welcome Email
      </div>
      
      <div className="space-y-2">
        <div>
          <Label htmlFor="email-to">To</Label>
          <Input id="email-to" value={client?.contact_email || ""} disabled className="bg-muted" />
        </div>
        
        <div>
          <Label htmlFor="email-subject">Subject</Label>
          <Input 
            id="email-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
          />
        </div>
        
        <div>
          <Label htmlFor="email-body">Message</Label>
          <Textarea 
            id="email-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-[200px]"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button 
          onClick={handleSend} 
          disabled={isSending || !subject || !body}
          className="flex-1"
        >
          <Send className="w-4 h-4 mr-2" />
          {isSending ? "Sending..." : "Send Email"}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}