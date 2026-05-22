import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, CheckCircle2, Hourglass } from "lucide-react";

export default function WelcomeCallScheduler({ open, onClose, client, checklistId }) {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(null);
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [checklist, setChecklist] = useState(null);
  const [proposalHistory, setProposalHistory] = useState([]);

  // Fetch checklist data
  useEffect(() => {
    if (open && checklistId) {
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
  }, [open, checklistId]);

  const proposeTime = useMutation({
    mutationFn: (payload) => base44.functions.invoke("proposeMeetingTime", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-checklists"] });
      // Refresh checklist data
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
      onClose();
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg" onOpenAutoFocus={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Schedule Welcome Call</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          {/* Client Info */}
          <div>
            <Label>Client</Label>
            <Input value={client?.business_name || ""} disabled className="bg-muted" />
          </div>

          {/* Current Status */}
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

          {/* Propose New Time */}
          <div className="space-y-3">
            <Label>{isPending ? "Propose Alternative Time" : "Schedule Call"}</Label>
            
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

            {selectedDate && time && (
              <Button 
                onClick={handlePropose} 
                className="w-full"
                disabled={proposeTime.isPending}
              >
                {isPending ? "Propose Alternative" : "Propose Time"} 
                {isPending ? "" : " & Notify Client"}
              </Button>
            )}
          </div>

          {/* Confirm Button */}
          {isPending && (
            <div className="pt-2 border-t">
              <Button 
                onClick={handleConfirm} 
                variant="secondary"
                className="w-full"
                disabled={confirmTime.isPending}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Confirm This Time
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}