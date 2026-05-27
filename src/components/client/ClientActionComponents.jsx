import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Mail, Send, Phone, Calendar as CalendarIcon, Clock, CheckCircle2, Hourglass, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Unified Email Composer Component
export function EmailComposer({ client, checklistId, onSent, onCancel, inline = true }) {
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("Welcome to Local Web Connect!");
  const [body, setBody] = useState(`Hi ${client?.contact_name || ''},

Welcome aboard! I'm excited to work with you.

You now have access to the client portal where you can:
- View the projects I am working on for you and their progress
- Track invoices and further monthly payments
- Submit support tickets for your apps/sites
- Complete your onboarding questionnaire

If you have any questions, ideas, etc. - don't hesitate to reach out.

You can login to your client portal/account by signing up with your email at https://local-web-connect.base44.app/client-portal. Once signed up, you can login and access the portal.

Best regards,
Alek`);
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

  const containerClasses = inline 
    ? "mt-3 p-3 rounded-lg border bg-muted/30 space-y-3" 
    : "space-y-4";

  return (
    <div className={containerClasses}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Mail className="w-4 h-4 text-primary" />
          {inline ? "Compose Welcome Email" : "Send Welcome Email"}
        </div>
        {onCancel && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCancel}>
            <X className="w-3 h-3" />
          </Button>
        )}
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
            className="min-h-[150px]"
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
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

// Unified Call Scheduler Component
export function CallScheduler({ client: _client, checklistId, onScheduled, onCancel, inline = true }) {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(null);
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [, setChecklist] = useState(null);
  const [proposalHistory, setProposalHistory] = useState([]);

  useEffect(() => {
    if (checklistId) {
      base44.entities.OnboardingChecklist.get(checklistId).then((data) => {
        setChecklist(data);
        if (data?.welcome_call_history) {
          try {
            setProposalHistory(JSON.parse(data.welcome_call_history));
          } catch {
            setProposalHistory([]);
          }
        }
      });
    }
  }, [checklistId]);

  const proposeTime = useMutation({
    mutationFn: (payload) => base44.functions.invoke("proposeMeetingTime", { ...payload, meetingType: 'welcome' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-checklists"] });
      base44.entities.OnboardingChecklist.get(checklistId).then((data) => {
        setChecklist(data);
        if (data?.welcome_call_history) {
          setProposalHistory(JSON.parse(data.welcome_call_history));
        }
      });
    },
  });

  const confirmTime = useMutation({
    mutationFn: (payload) => base44.functions.invoke("confirmMeetingTime", { ...payload, meetingType: 'welcome' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-checklists"] });
      onScheduled?.();
    },
  });

  const handlePropose = async () => {
  if (!selectedDate || !time) return;

  const datetime = new Date(selectedDate);
  const [hours, minutes] = time.split(":");
  datetime.setHours(parseInt(hours), parseInt(minutes));

  await proposeTime.mutateAsync({
    checklistId,
    datetime: datetime.toISOString(),
    notes,
    proposedBy: "agency",
    meetingType: "welcome",
  });
  };

  const handleConfirm = async () => {
  await confirmTime.mutateAsync({
    checklistId,
    confirmedBy: "agency",
    meetingType: "welcome",
  });
  };

  const latestProposal = proposalHistory.length > 0 ? proposalHistory[proposalHistory.length - 1] : null;
  const isPending = latestProposal && !latestProposal.confirmed;

  const containerClasses = inline 
    ? "mt-3 p-3 rounded-lg border bg-muted/30 space-y-3" 
    : "space-y-4";

  return (
    <div className={containerClasses}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Phone className="w-4 h-4 text-primary" />
          {inline ? "Schedule Welcome Call" : "Schedule Call"}
        </div>
        {onCancel && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCancel}>
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {latestProposal && (
        <div className={cn(
          "p-3 rounded-lg border space-y-2",
          latestProposal.confirmed 
            ? "bg-green-50 border-green-200" 
            : "bg-amber-50 border-amber-200"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {latestProposal.confirmed ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <Hourglass className="w-5 h-5 text-amber-600" />
              )}
              <p className="font-medium text-sm">
                {latestProposal.confirmed ? "Call Confirmed" : 
                 latestProposal.proposed_by === 'client' ? "Your Request" : "Agency Proposal"}
              </p>
            </div>
            {!latestProposal.confirmed && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">
                {latestProposal.proposed_by === 'client' ? "Awaiting agency confirmation" : "Awaiting your confirmation"}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-foreground">
            📅 {new Date(latestProposal.datetime).toLocaleString(undefined, { 
              dateStyle: 'medium', 
              timeStyle: 'short' 
            })}
          </p>
          {latestProposal.notes && (
            <p className="text-xs text-muted-foreground">
              {latestProposal.notes}
            </p>
          )}
          
          {!latestProposal.confirmed && latestProposal.proposed_by === 'client' && (
            <div className="flex gap-2 pt-2 border-t">
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleConfirm}
                disabled={confirmTime.isPending}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Confirm This Time
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setSelectedDate(null);
                  setTime("");
                  setNotes("");
                }}
              >
                ↺ Suggest Different Time
              </Button>
            </div>
          )}
          
          {!latestProposal.confirmed && latestProposal.proposed_by === 'agency' && (
            <p className="text-xs text-amber-700 italic">
              Waiting for client to confirm. They can also suggest an alternative time.
            </p>
          )}
        </div>
      )}
      
      <div className="space-y-3">
        <Label>{isPending ? "Propose Alternative Time" : "Select Date & Time"}</Label>
        
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex-1 justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <div className="relative flex-1">
            <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Input
          placeholder="Notes (optional) - e.g. Google Meet link, agenda..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex gap-2">
          {selectedDate && time && (
            <Button 
              onClick={handlePropose} 
              disabled={proposeTime.isPending}
              className="flex-1"
            >
              {isPending ? "Propose Alternative" : "Propose Time"} 
              {isPending ? "" : " & Notify Client"}
            </Button>
          )}
          
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
