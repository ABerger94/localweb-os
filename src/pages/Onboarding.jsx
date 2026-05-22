import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import Sidebar from "@/components/shared/Sidebar";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Users, Zap, CalendarCheck, CalendarX, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmailComposer, CallScheduler } from "@/components/client/ClientActionComponents.jsx";

const navigationItems = [
  { label: "Dashboard", href: "/" },
  { label: "Clients", href: "/clients" },
  { label: "Onboarding", href: "/onboarding" },
  { label: "Projects", href: "/projects" },
  { label: "Invoices", href: "/invoices" },
  { label: "Retainers", href: "/retainers" },
  { label: "Designer", href: "/designer" },
  { label: "QR Code", href: "/qr-code" },
];

const PIPELINE_STAGES = [
  {
    id: "welcome",
    label: "Welcome & Access",
    color: "bg-blue-100 text-blue-800 border-blue-300",
    items: [
      { key: "welcome_email_sent", label: "Send welcome email with portal link" },
      { key: "portal_access_granted", label: "Grant client portal access" },
      { key: "welcome_call_scheduled", label: "Schedule welcome / kickoff call" },
    ],
  },
  {
    id: "info",
    label: "Information Gathering",
    color: "bg-purple-100 text-purple-800 border-purple-300",
    items: [
      { key: "brand_assets_collected", label: "Collect brand assets (logo, colors, fonts)" },
      { key: "business_goals_documented", label: "Document business goals & target audience" },
      { key: "questionnaire_completed", label: "Client completes onboarding questionnaire" },
    ],
  },
  {
    id: "strategy",
    label: "Strategy & Planning",
    color: "bg-orange-100 text-orange-800 border-orange-300",
    items: [
      { key: "strategy_meeting_held", label: "Schedule strategy planning meeting" },
      { key: "project_plan_created", label: "Create project plan & scope document" },
      { key: "communication_channels_set", label: "Establish communication channels" },
    ],
  },
  {
    id: "kickoff",
    label: "Service Kick-off",
    color: "bg-green-100 text-green-800 border-green-300",
    items: [
      { key: "first_project_created", label: "Create & assign first project" },
      { key: "initial_invoice_sent", label: "Send initial setup invoice" },
      { key: "retainer_agreement_signed", label: "Sign & activate retainer agreement" },
    ],
  },
];

function getProgress(checklist) {
  if (!checklist) return 0;
  const allKeys = PIPELINE_STAGES.flatMap((s) => s.items.map((i) => i.key));
  const completed = allKeys.filter((k) => checklist[k] === true).length;
  return Math.round((completed / allKeys.length) * 100);
}

function getActiveStage(checklist) {
  if (!checklist) return 0;
  for (let i = PIPELINE_STAGES.length - 1; i >= 0; i--) {
    const stage = PIPELINE_STAGES[i];
    const anyDone = stage.items.some((item) => checklist[item.key] === true);
    if (anyDone) return i;
  }
  return 0;
}

function ClientOnboardingCard({ client, checklist, onToggle, onConfirmMeeting, onSuggestMeeting }) {
  const strategyMeetingDate = checklist?.strategy_meeting_date
    ? new Date(checklist.strategy_meeting_date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : null;
  const [expanded, setExpanded] = useState(false);
  const [suggestMode, setSuggestMode] = useState(false);
  const [suggestedTime, setSuggestedTime] = useState("");
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [showCallScheduler, setShowCallScheduler] = useState(false);
  const progress = getProgress(checklist);
  const activeStageIdx = getActiveStage(checklist);

  return (
    <Card className="overflow-hidden">
      <div
        className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">{client.business_name}</h3>
              <StatusBadge status={client.pipeline_stage} />
            </div>
            <p className="text-sm text-muted-foreground truncate">{client.contact_name} • {client.contact_email}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{progress}%</p>
              <p className="text-xs text-muted-foreground">complete</p>
            </div>
            <div className="w-24">
              <Progress value={progress} className="h-2" />
            </div>
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border">
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PIPELINE_STAGES.map((stage, idx) => {
              const stageCompleted = stage.items.every((i) => checklist?.[i.key] === true);
              return (
                <div key={stage.id} className={cn("rounded-lg border p-3", stageCompleted ? "bg-green-50 border-green-200" : "bg-card border-border")}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", stage.color)}>{idx + 1}</span>
                    <p className="text-xs font-semibold text-foreground">{stage.label}</p>
                  </div>
                  <div className="space-y-2">
                    {stage.items.map((item) => {
                      const done = checklist?.[item.key] === true;
                      const isEmailTask = item.key === "welcome_email_sent";
                      const isCallTask = item.key === "welcome_call_scheduled";
                      const showEmailAction = isEmailTask && !done;
                      const showCallAction = isCallTask && !done;
                      
                      return (
                        <div key={item.key}>
                          <button
                            onClick={(e) => { e.stopPropagation(); onToggle(client.id, checklist, item.key, !done); }}
                            className="flex items-start gap-2 w-full text-left group"
                          >
                            {done ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0 group-hover:text-primary transition-colors" />
                            )}
                            <div className="flex flex-col gap-0.5">
                              <span className={cn("text-xs leading-tight", done ? "line-through text-muted-foreground" : "text-foreground")}>
                                {item.label}
                              </span>
                              {item.key === "strategy_meeting_held" && strategyMeetingDate && !done && (
                                <span className="text-xs text-primary font-medium">{strategyMeetingDate}</span>
                              )}
                            </div>
                          </button>
                          {showEmailAction && (
                            <div className="ml-6 mt-2">
                              {!showEmailComposer ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs gap-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowEmailComposer(true);
                                  }}
                                >
                                  <Mail className="w-3 h-3" />
                                  Draft/Send Email
                                </Button>
                              ) : null}
                            </div>
                          )}
                          {showCallAction && (
                            <div className="ml-6 mt-2">
                              {!showCallScheduler ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs gap-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowCallScheduler(true);
                                  }}
                                >
                                  <Phone className="w-3 h-3" />
                                  Schedule Call
                                </Button>
                              ) : null}
                            </div>
                          )}
                          {showEmailAction && showEmailComposer && (
                            <EmailComposer
                              client={client}
                              checklistId={checklist?.id}
                              onSent={() => {
                                setShowEmailComposer(false);
                                onToggle(client.id, checklist, item.key, true);
                              }}
                              onCancel={() => setShowEmailComposer(false)}
                            />
                          )}
                          {showCallAction && showCallScheduler && (
                            <CallScheduler
                              client={client}
                              checklistId={checklist?.id}
                              onScheduled={() => {
                                setShowCallScheduler(false);
                                onToggle(client.id, checklist, item.key, true);
                              }}
                              onCancel={() => setShowCallScheduler(false)}
                            />
                          )}
                        </div>
                      );
                    })}
                    {/* Meeting confirmation UI — show when a time has been requested but not yet confirmed */}
                    {stage.id === "strategy" && checklist?.strategy_meeting_date && !checklist?.strategy_meeting_confirmed && (
                      <div onClick={(e) => e.stopPropagation()} className="mt-2 p-3 rounded-lg bg-blue-50 border border-blue-200 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-blue-800">
                            {checklist.strategy_meeting_proposed_by === 'client' ? 'Client proposed:' : 'Agency proposed:'}
                          </span>
                          {!suggestMode && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-200 text-blue-800">
                              Pending confirmation
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-blue-900">{strategyMeetingDate}</p>
                        {checklist.strategy_meeting_proposed_by === 'client' && !suggestMode && (
                          <div className="flex gap-1.5">
                            <Button
                              size="sm"
                              className="h-7 text-xs px-2 gap-1"
                              onClick={() => onConfirmMeeting(client.id, checklist)}
                            >
                              <CalendarCheck className="w-3 h-3" />
                              Confirm Time
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs px-2 gap-1"
                              onClick={() => setSuggestMode(true)}
                            >
                              <CalendarX className="w-3 h-3" />
                              Suggest New Time
                            </Button>
                          </div>
                        )}
                        {checklist.strategy_meeting_proposed_by === 'agency' && (
                          <p className="text-xs text-blue-700 italic">
                            Waiting for client confirmation...
                          </p>
                        )}
                        {!suggestMode && checklist.strategy_meeting_proposed_by === 'client' && (
                          <button
                            onClick={() => setSuggestMode(true)}
                            className="text-xs text-blue-700 hover:underline"
                          >
                            Can't make this time? Suggest alternative
                          </button>
                        )}
                        {suggestMode && (
                          <div className="space-y-2 mt-2 pt-2 border-t border-blue-200">
                            <Input
                              type="datetime-local"
                              value={suggestedTime}
                              onChange={(e) => setSuggestedTime(e.target.value)}
                              className="h-8 text-sm"
                              placeholder="Select alternative time"
                            />
                            <div className="flex gap-1.5">
                              <Button
                                size="sm"
                                className="h-7 text-xs px-2"
                                disabled={!suggestedTime}
                                onClick={() => {
                                  onSuggestMeeting(client.id, checklist, suggestedTime);
                                  setSuggestMode(false);
                                  setSuggestedTime("");
                                }}
                              >
                                Send Counter-Proposal
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs px-2"
                                onClick={() => { setSuggestMode(false); setSuggestedTime(""); }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

export default function Onboarding() {
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: checklists = [] } = useQuery({
    queryKey: ["onboarding-checklists"],
    queryFn: () => base44.entities.OnboardingChecklist.list(),
  });

  const mutation = useMutation({
    mutationFn: async ({ clientId, checklistId, updates }) => {
      if (checklistId) {
        await base44.entities.OnboardingChecklist.update(checklistId, updates);
      } else {
        await base44.entities.OnboardingChecklist.create({ client_id: clientId, ...updates });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["onboarding-checklists"] }),
  });

  const handleToggle = (clientId, checklist, key, value) => {
    mutation.mutate({ clientId, checklistId: checklist?.id, updates: { [key]: value } });
  };

  const handleConfirmMeeting = async (clientId, checklist) => {
    try {
      await base44.functions.invoke('confirmMeetingTime', {
        checklistId: checklist.id,
        confirmedBy: 'agency',
      });
      queryClient.invalidateQueries({ queryKey: ['onboarding-checklists'] });
    } catch (error) {
      console.error('Error confirming meeting:', error);
    }
  };

  const handleSuggestMeeting = async (clientId, checklist, newTime) => {
    try {
      await base44.functions.invoke('proposeMeetingTime', {
        checklistId: checklist.id,
        datetime: newTime,
        notes: 'Agency suggested new time',
        proposedBy: 'agency',
      });
      queryClient.invalidateQueries({ queryKey: ['onboarding-checklists'] });
    } catch (error) {
      console.error('Error suggesting meeting:', error);
    }
  };



  // Show only onboarding-relevant clients (not churned)
  const activeClients = clients.filter((c) => c.status !== "Churned");

  const totalComplete = activeClients.filter((c) => {
    const cl = checklists.find((ch) => ch.client_id === c.id);
    return getProgress(cl) === 100;
  }).length;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar items={navigationItems} />
      <div className="flex-1 lg:ml-64">
        <div className="p-4 sm:p-6 lg:p-8">
          <PageHeader
            title="Onboarding Pipeline"
            description="Track client onboarding progress across all stages"
          />

          {/* Summary stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{activeClients.length}</p>
                <p className="text-xs text-muted-foreground">Active Clients</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalComplete}</p>
                <p className="text-xs text-muted-foreground">Fully Onboarded</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <Zap className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{activeClients.length - totalComplete}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </Card>
          </div>

          {/* Stage legend */}
          <div className="flex flex-wrap gap-2 mb-6">
            {PIPELINE_STAGES.map((stage, idx) => (
              <span key={stage.id} className={cn("text-xs font-medium px-3 py-1 rounded-full border", stage.color)}>
                {idx + 1}. {stage.label}
              </span>
            ))}
          </div>

          {/* Client list */}
          <div className="space-y-3">
            {activeClients.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No active clients yet. Add clients to track their onboarding.</p>
              </Card>
            ) : (
              activeClients.map((client) => {
                const checklist = checklists.find((ch) => ch.client_id === client.id);
                return (
                  <ClientOnboardingCard
                    key={client.id}
                    client={client}
                    checklist={checklist}
                    onToggle={handleToggle}
                    onConfirmMeeting={handleConfirmMeeting}
                    onSuggestMeeting={handleSuggestMeeting}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}