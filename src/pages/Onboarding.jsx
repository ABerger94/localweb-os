import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import Sidebar from "@/components/shared/Sidebar";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Users, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  { label: "Dashboard", href: "/" },
  { label: "Clients", href: "/clients" },
  { label: "Onboarding", href: "/onboarding" },
  { label: "Projects", href: "/projects" },
  { label: "Invoices", href: "/invoices" },
  { label: "Retainers", href: "/retainers" },
  { label: "Designer", href: "/designer" },
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
      { key: "strategy_meeting_held", label: "Hold strategy planning meeting" },
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

function ClientOnboardingCard({ client, checklist, onToggle }) {
  const [expanded, setExpanded] = useState(false);
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
                      return (
                        <button
                          key={item.key}
                          onClick={(e) => { e.stopPropagation(); onToggle(client.id, checklist, item.key, !done); }}
                          className="flex items-start gap-2 w-full text-left group"
                        >
                          {done ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0 group-hover:text-primary transition-colors" />
                          )}
                          <span className={cn("text-xs leading-tight", done ? "line-through text-muted-foreground" : "text-foreground")}>
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
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
    mutationFn: async ({ clientId, checklistId, key, value }) => {
      if (checklistId) {
        await base44.entities.OnboardingChecklist.update(checklistId, { [key]: value });
      } else {
        await base44.entities.OnboardingChecklist.create({ client_id: clientId, [key]: value });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["onboarding-checklists"] }),
  });

  const handleToggle = (clientId, checklist, key, value) => {
    mutation.mutate({ clientId, checklistId: checklist?.id, key, value });
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