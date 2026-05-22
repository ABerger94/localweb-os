import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import Sidebar from "@/components/shared/Sidebar";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  { label: "Dashboard", href: "/client-portal" },
  { label: "Projects", href: "/client-portal/projects" },
  { label: "Invoices", href: "/client-portal/invoices" },
  { label: "Onboarding", href: "/client-portal/onboarding" },
];

// Client-facing checklist items (subset of admin items)
const CLIENT_STAGES = [
  {
    id: "welcome",
    label: "Welcome & Access",
    description: "Get set up and ready to start",
    items: [
      { key: "welcome_call_scheduled", label: "Confirm your welcome call time", clientAction: true },
      { key: "portal_access_granted", label: "Log into your client portal", clientAction: false },
    ],
  },
  {
    id: "info",
    label: "Share Your Information",
    description: "Help us understand your business",
    items: [
      { key: "brand_assets_collected", label: "Upload your brand assets (logo, colors, fonts)", clientAction: true },
      { key: "business_goals_documented", label: "Share your business goals & target audience", clientAction: true },
      { key: "questionnaire_completed", label: "Complete the onboarding questionnaire", clientAction: true },
    ],
  },
  {
    id: "strategy",
    label: "Strategy Session",
    description: "Plan your project together",
    items: [
      { key: "strategy_meeting_held", label: "Attend the strategy planning meeting", clientAction: false },
      { key: "communication_channels_set", label: "Confirm preferred communication channel", clientAction: true },
    ],
  },
  {
    id: "kickoff",
    label: "Project Kick-off",
    description: "Start your journey with us",
    items: [
      { key: "initial_invoice_sent", label: "Pay your setup invoice", clientAction: false },
      { key: "retainer_agreement_signed", label: "Review & sign your retainer agreement", clientAction: false },
    ],
  },
];

export default function ClientOnboarding() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentClient, setCurrentClient] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(console.error);
  }, []);

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: checklists = [], isLoading: checklistsLoading } = useQuery({
    queryKey: ["onboarding-checklists"],
    queryFn: () => base44.entities.OnboardingChecklist.list(),
  });

  useEffect(() => {
    if (currentUser && clients.length > 0) {
      const client = clients.find(
        (c) => c.user_email?.toLowerCase() === currentUser.email?.toLowerCase()
      );
      setCurrentClient(client || null);
    }
  }, [currentUser, clients]);

  const checklist = checklists.find((ch) => ch.client_id === currentClient?.id);

  const mutation = useMutation({
    mutationFn: async ({ key, value }) => {
      if (checklist) {
        await base44.entities.OnboardingChecklist.update(checklist.id, { [key]: value });
      } else if (currentClient) {
        await base44.entities.OnboardingChecklist.create({ client_id: currentClient.id, [key]: value });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["onboarding-checklists"] }),
  });

  const isLoading = !currentUser || clientsLoading || checklistsLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar items={navigationItems} isClientPortal />
        <div className="flex-1 lg:ml-64 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!currentClient) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar items={navigationItems} isClientPortal />
        <div className="flex-1 lg:ml-64 flex items-center justify-center p-6">
          <div className="text-center max-w-md p-8">
            <h2 className="text-xl font-semibold mb-2">Setting Up Your Account</h2>
            <p className="text-muted-foreground mb-4">
              Your account is not yet linked to a client profile. Your agency will set this up shortly — please check back soon or contact your account manager.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const allItems = CLIENT_STAGES.flatMap((s) => s.items);
  const completedCount = allItems.filter((i) => checklist?.[i.key] === true).length;
  const progressPct = Math.round((completedCount / allItems.length) * 100);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar items={navigationItems} isClientPortal />
      <div className="flex-1 lg:ml-64">
        <div className="p-4 sm:p-6 lg:p-8">
          <PageHeader
            title="Your Onboarding Checklist"
            description={`Welcome to ${currentClient.business_name}'s onboarding journey`}
          />

          {/* Progress */}
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-foreground">Overall Progress</p>
                <p className="text-sm font-semibold text-primary">{progressPct}% complete</p>
              </div>
              <Progress value={progressPct} className="h-3" />
              <p className="text-xs text-muted-foreground mt-2">
                {completedCount} of {allItems.length} steps completed
              </p>
            </CardContent>
          </Card>

          {progressPct === 100 && (
            <Card className="mb-6 border-green-300 bg-green-50">
              <CardContent className="pt-6 text-center">
                <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-green-800 text-lg">You're fully onboarded!</h3>
                <p className="text-green-700 text-sm mt-1">Your agency is ready to kick off your project.</p>
              </CardContent>
            </Card>
          )}

          {/* Stages */}
          <div className="space-y-4">
            {CLIENT_STAGES.map((stage, idx) => {
              const stageItems = stage.items;
              const stageDone = stageItems.every((i) => checklist?.[i.key] === true);
              const prevStageDone = idx === 0 || CLIENT_STAGES[idx - 1].items.every((i) => checklist?.[i.key] === true);

              return (
                <Card key={stage.id} className={cn(!prevStageDone && "opacity-60")}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                        stageDone ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                      )}>
                        {stageDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <div>
                        <CardTitle className="text-base">{stage.label}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">{stage.description}</p>
                      </div>
                      {!prevStageDone && <Lock className="w-4 h-4 text-muted-foreground ml-auto" />}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {stageItems.map((item) => {
                      const done = checklist?.[item.key] === true;
                      return (
                        <div key={item.key} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                          {item.clientAction ? (
                            <button
                              disabled={!prevStageDone}
                              onClick={() => mutation.mutate({ key: item.key, value: !done })}
                              className="mt-0.5 shrink-0 disabled:cursor-not-allowed"
                            >
                              {done ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : (
                                <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                              )}
                            </button>
                          ) : (
                            <div className="mt-0.5 shrink-0">
                              {done ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : (
                                <Circle className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                          )}
                          <div className="flex-1">
                            <p className={cn("text-sm font-medium", done && "line-through text-muted-foreground")}>
                              {item.label}
                            </p>
                            {item.clientAction && !done && (
                              <p className="text-xs text-primary mt-0.5">Action required by you</p>
                            )}
                            {!item.clientAction && !done && (
                              <p className="text-xs text-muted-foreground mt-0.5">Your agency will complete this</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}