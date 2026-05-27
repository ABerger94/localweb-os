import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, CheckCircle2, Hourglass } from "lucide-react";

export default function InlineCallScheduler({ client: _client, checklistId, onScheduled, onCancel }) {
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
        if (data?.meeting_proposal_history) {
          try {
            setProposalHistory(JSON.parse(data.meeting_proposal_history));
          } catch {
            setProposalHistory([]);
          }
        }
      });
    }
  }, [checklistId]);

  const proposeTime = useMutation({
    mutationFn: (payload) => base44.functions.invoke("proposeMeetingTime", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-checklists"] });
      base44.entities.OnboardingChecklist.get(checklistId).then((data) => {
        setChecklist(data);
        if (data?.meeting_proposal_history) {
          setProposalHistory(JSON.parse(data.meeting_proposal_history));
        }
      });
    },
  });

  const confirmTime = useMutation({
    mutationFn: (payload) => base44.functions.invoke("confirmMeetingTime", payload),
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
    });
  };

  const handleConfirm = async () => {
    await confirmTime.mutateAsync({
      checklistId,
      confirmedBy: "agency",
    });
  };

  const latestProposal = proposalHistory.length > 0 ? proposalHistory[proposalHistory.length - 1] : null;
  const isPending = latestProposal && !latestProposal.confirmed;

  return (
    <div className="mt-3 p-3 rounded-lg border bg-muted/30 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Clock className="w-4 h-4 text-primary" />
        Schedule Welcome Call
      </div>

      {latestProposal && (
        <div className={cn(
          "p-3 rounded-lg border flex items-start gap-3",
          latestProposal.confirmed 
            ? "bg-green-50 border-green-200" 
            : "bg-amber-50 border-amber-200"
        )}>
          {latestProposal.confirmed ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
          ) : (
            <Hourglass className="w-5 h-5 text-amber-600 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-medium text-sm">
              {latestProposal.confirmed ? "Call Confirmed" : "Awaiting Client Confirmation"}
            </p>
            <p className="text-sm text-muted-foreground">
              {new Date(latestProposal.datetime).toLocaleString(undefined, { 
                dateStyle: 'medium', 
                timeStyle: 'short' 
              })}
            </p>
            {latestProposal.notes && (
              <p className="text-xs text-muted-foreground mt-1">
                {latestProposal.notes}
              </p>
            )}
          </div>
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
          
          {isPending && (
            <Button 
              onClick={handleConfirm} 
              variant="secondary"
              disabled={confirmTime.isPending}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Confirm
            </Button>
          )}
          
          <Button variant="outline" onClick={onCancel}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
