import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import Sidebar from "@/components/shared/Sidebar";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Lock, Upload, X, CalendarClock, CreditCard, FileSignature, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import ClientProfileSetup from "@/components/client/ClientProfileSetup";
import OnboardingQuestionnaire from "@/components/client/OnboardingQuestionnaire";
import StripePaymentForm from "@/components/invoices/StripePaymentForm";

const navigationItems = [
  { label: "Dashboard", href: "/client-portal" },
  { label: "Projects", href: "/client-portal/projects" },
  { label: "Invoices", href: "/client-portal/invoices" },
  { label: "Onboarding", href: "/client-portal/onboarding" },
];

// Client-facing checklist items
const CLIENT_STAGES = [
  {
    id: "welcome",
    label: "Welcome & Access",
    description: "Get set up and ready to start",
    items: [
      { key: "portal_access_granted", label: "Log into your client portal", autoComplete: true },
    ],
  },
  {
    id: "info",
    label: "Share Your Information",
    description: "Help us understand your business",
    items: [
      { key: "brand_assets_collected", label: "Upload your brand assets (logo, colors, fonts)", form: "brandAssets" },
      { key: "business_goals_documented", label: "Share your business goals & target audience", form: "businessGoals" },
      { key: "questionnaire_completed", label: "Complete the onboarding questionnaire", form: "questionnaire" },
    ],
  },
  {
    id: "strategy",
    label: "Strategy Session",
    description: "Plan your project together",
    items: [
      { key: "strategy_meeting_held", label: "Schedule your strategy planning meeting", form: "strategyMeeting" },
      { key: "communication_channels_set", label: "Confirm preferred communication channel", form: "communicationChannel" },
    ],
  },
  {
    id: "kickoff",
    label: "Project Kick-off",
    description: "Start your journey with us",
    items: [
      { key: "initial_invoice_sent", label: "Pay your setup invoice", form: "invoicePayment" },
      { key: "retainer_agreement_signed", label: "Review & sign your retainer agreement", form: "retainerAgreement" },
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

  const { data: questionnaires = [] } = useQuery({
    queryKey: ["onboarding-questionnaire"],
    queryFn: () => base44.entities.OnboardingQuestionnaire.list(),
    enabled: !!currentClient,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => base44.entities.Invoice.list(),
    enabled: !!currentClient,
  });

  const { data: retainers = [] } = useQuery({
    queryKey: ["retainers"],
    queryFn: () => base44.entities.Retainer.list(),
    enabled: !!currentClient,
  });

  const existingQuestionnaire = questionnaires.find((q) => q.client_id === currentClient?.id);

  useEffect(() => {
    if (currentUser && clients.length > 0) {
      const client = clients.find(
        (c) => c.user_email?.toLowerCase() === currentUser.email?.toLowerCase()
      );
      setCurrentClient(client || null);
    }
  }, [currentUser, clients]);

  const checklist = checklists.find((ch) => ch.client_id === currentClient?.id);
  const [formData, setFormData] = useState({
    brandAssets: "",
    businessGoals: "",
    communicationChannel: "",
    notes: "",
  });

  // Auto-mark portal_access_granted as true when client views this page
  useEffect(() => {
    if (!currentClient || checklistsLoading) return;
    if (checklist && checklist.portal_access_granted) return;
    if (checklist) {
      base44.entities.OnboardingChecklist.update(checklist.id, { portal_access_granted: true })
        .then(() => queryClient.invalidateQueries({ queryKey: ["onboarding-checklists"] }));
    } else {
      base44.entities.OnboardingChecklist.create({ client_id: currentClient.id, portal_access_granted: true })
        .then(() => queryClient.invalidateQueries({ queryKey: ["onboarding-checklists"] }));
    }
  }, [currentClient, checklist, checklistsLoading, queryClient]);

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

  const [brandAssetFiles, setBrandAssetFiles] = useState([]);
  const [uploadingAssets, setUploadingAssets] = useState(false);
  const [meetingDateTime, setMeetingDateTime] = useState("");
  const [meetingNotes, setMeetingNotes] = useState("");

  const handleStrategyMeetingSubmit = async (e) => {
    e.preventDefault();
    if (!meetingDateTime) return;
    // Use backend function to propose meeting time with email notification
    try {
      if (checklist) {
        await base44.functions.invoke('proposeMeetingTime', {
          checklistId: checklist.id,
          datetime: meetingDateTime,
          notes: meetingNotes,
          proposedBy: 'client',
        });
      } else if (currentClient) {
        // Create checklist first if it doesn't exist
        const newChecklist = await base44.entities.OnboardingChecklist.create({
          client_id: currentClient.id,
          strategy_meeting_date: meetingDateTime,
          strategy_meeting_proposed_by: 'client',
          strategy_meeting_confirmed: false,
          meeting_proposal_history: JSON.stringify([{
            proposed_by: 'client',
            datetime: meetingDateTime,
            notes: meetingNotes,
            confirmed: false,
            timestamp: new Date().toISOString(),
          }]),
        });
        await base44.functions.invoke('proposeMeetingTime', {
          checklistId: newChecklist.id,
          datetime: meetingDateTime,
          notes: meetingNotes,
          proposedBy: 'client',
        });
      }
      queryClient.invalidateQueries({ queryKey: ["onboarding-checklists"] });
      setMeetingDateTime("");
      setMeetingNotes("");
    } catch (error) {
      console.error('Error proposing meeting:', error);
    }
  };

  const handleBrandAssetsSubmit = async (e) => {
    e.preventDefault();
    if (!formData.brandAssets.trim() && brandAssetFiles.length === 0) return;
    setUploadingAssets(true);
    try {
      // Upload all files and create DesignAsset records
      const uploadPromises = brandAssetFiles.map(async (file) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return base44.entities.DesignAsset.create({
          client_id: currentClient.id,
          asset_type: file.type.startsWith("image/") ? "image" : "image",
          asset_name: file.name,
          asset_value: file_url,
          description: formData.brandAssets,
        });
      });
      
      // Wait for all uploads to complete
      await Promise.all(uploadPromises);
      
      // Mark task as complete and refresh UI
      await mutation.mutateAsync({ key: "brand_assets_collected", value: true });
      queryClient.invalidateQueries({ queryKey: ["design-assets"] });
      setFormData(prev => ({ ...prev, brandAssets: "" }));
      setBrandAssetFiles([]);
    } catch (error) {
      console.error("Asset upload failed:", error);
      alert("Failed to upload assets. Please try again.");
    } finally {
      setUploadingAssets(false);
    }
  };

  const handleBusinessGoalsSubmit = async (e) => {
    e.preventDefault();
    if (formData.businessGoals.trim()) {
      // Save business goals to the client profile's brand_notes field
      await base44.entities.Client.update(currentClient.id, {
        brand_notes: [currentClient.brand_notes, `Business Goals: ${formData.businessGoals}`].filter(Boolean).join("\n\n"),
      });
      await mutation.mutateAsync({ key: "business_goals_documented", value: true });
      setFormData(prev => ({ ...prev, businessGoals: "" }));
    }
  };

  const handleCommunicationChannelSubmit = async (e) => {
    e.preventDefault();
    if (formData.communicationChannel.trim()) {
      // Save preferred communication channel to the client's notes
      await base44.entities.Client.update(currentClient.id, {
        notes: [currentClient.notes, `Preferred Communication: ${formData.communicationChannel}`].filter(Boolean).join("\n\n"),
      });
      await mutation.mutateAsync({ key: "communication_channels_set", value: true });
      setFormData(prev => ({ ...prev, communicationChannel: "" }));
    }
  };

  const clientInvoices = invoices.filter((inv) => inv.client_id === currentClient?.id);
  const setupInvoice = clientInvoices.find((inv) => inv.invoice_type === "setup" && inv.status !== "Paid");
  const clientRetainer = retainers.find((r) => r.client_id === currentClient?.id && r.status === "Active");

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [retainerSigning, setRetainerSigning] = useState(false);
  const [retainerAgreed, setRetainerAgreed] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);

  const handleInitiatePayment = async () => {
    if (!setupInvoice) return;
    try {
      setPaymentLoading(true);
      const res = await base44.functions.invoke("createStripePaymentLink", {
        invoiceId: setupInvoice.id,
        amount: setupInvoice.amount,
        clientEmail: currentClient.contact_email,
        clientName: currentClient.business_name,
      });
      
      if (res.data?.clientSecret && res.data?.publishableKey) {
        setClientSecret(res.data.clientSecret);
        setStripePromise(loadStripe(res.data.publishableKey));
        setPayingInvoice(setupInvoice);
      } else {
        alert("Payment setup failed. Please try again.");
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Failed to initiate payment: " + (error.response?.data?.error || error.message));
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    await base44.entities.Invoice.update(payingInvoice.id, {
      status: "Paid",
      paid_date: new Date().toISOString().split("T")[0],
    });
    setPayingInvoice(null);
    setClientSecret(null);
    await mutation.mutateAsync({ key: "initial_invoice_sent", value: true });
  };

  const handleSignRetainer = async () => {
    if (!retainerAgreed) return;
    setRetainerSigning(true);
    if (clientRetainer) {
      await base44.entities.Retainer.update(clientRetainer.id, { status: "Active" });
    }
    await mutation.mutateAsync({ key: "retainer_agreement_signed", value: true });
    setRetainerSigning(false);
    setRetainerAgreed(false);
  };

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
        <ClientProfileSetup
          currentUser={currentUser}
          onCreated={(client) => setCurrentClient(client)}
        />
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
                  <CardContent className="space-y-4">
                    {stageItems.map((item) => {
                      const done = checklist?.[item.key] === true;
                      const getFormField = () => {
                        if (item.form === "brandAssets") return formData.brandAssets;
                        if (item.form === "businessGoals") return formData.businessGoals;
                        if (item.form === "communicationChannel") return formData.communicationChannel;
                        if (item.form === "strategyMeeting") return meetingDateTime;
                        return "";
                      };

                      return (
                        <div key={item.key}>
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                            <button
                              disabled={!prevStageDone || !item.form || done}
                              onClick={() => {
                                if (!item.form) return;
                                if (item.form === "brandAssets" && !done) handleBrandAssetsSubmit({ preventDefault: () => {} });
                                else if (item.form === "businessGoals" && !done) handleBusinessGoalsSubmit({ preventDefault: () => {} });
                                else if (item.form === "communicationChannel" && !done) handleCommunicationChannelSubmit({ preventDefault: () => {} });
                              }}
                              className="mt-0.5 shrink-0 disabled:cursor-not-allowed"
                            >
                              {done ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : (
                                <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                              )}
                            </button>
                            <div className="flex-1">
                              <p className={cn("text-sm font-medium", done && "line-through text-muted-foreground")}>
                                {item.label}
                              </p>
                            </div>
                          </div>
                          {item.form && !done && prevStageDone && (
                            item.form === "questionnaire" ? (
                              <OnboardingQuestionnaire
                                clientId={currentClient.id}
                                existingResponse={existingQuestionnaire}
                                onComplete={() => mutation.mutate({ key: "questionnaire_completed", value: true })}
                              />
                            ) : item.form === "invoicePayment" ? (
                              <div className="mt-3 ml-8 space-y-3">
                                {setupInvoice ? (
                                  <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-sm font-medium">Setup Invoice</p>
                                        <p className="text-xs text-muted-foreground">{setupInvoice.description || "Initial setup & onboarding fee"}</p>
                                        {setupInvoice.due_date && (
                                          <p className="text-xs text-muted-foreground">Due: {new Date(setupInvoice.due_date).toLocaleDateString()}</p>
                                        )}
                                      </div>
                                      <p className="text-lg font-bold text-foreground">${setupInvoice.amount?.toFixed(2)}</p>
                                    </div>
                                    <Button
                                      size="sm"
                                      className="gap-2 w-full"
                                      onClick={handleInitiatePayment}
                                      disabled={paymentLoading}
                                    >
                                      <CreditCard className="w-4 h-4" />
                                      {paymentLoading ? "Loading..." : "Pay Now"}
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="p-4 rounded-lg border border-border bg-muted/30 text-center space-y-2">
                                    <p className="text-sm text-muted-foreground">No setup invoice has been issued yet.</p>
                                    <p className="text-xs text-muted-foreground">Your agency will send your invoice shortly. Check back soon.</p>
                                  </div>
                                )}
                              </div>
                            ) : item.form === "retainerAgreement" ? (
                              <div className="mt-3 ml-8 space-y-3">
                                {clientRetainer ? (
                                  <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
                                    <div>
                                      <p className="text-sm font-medium">Retainer Agreement</p>
                                      <p className="text-xs text-muted-foreground mt-0.5">{clientRetainer.description || "Monthly retainer services"}</p>
                                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                        <div className="bg-muted rounded p-2">
                                          <span className="text-muted-foreground">Monthly Amount</span>
                                          <p className="font-semibold text-foreground">${clientRetainer.monthly_amount?.toFixed(2)}/mo</p>
                                        </div>
                                        <div className="bg-muted rounded p-2">
                                          <span className="text-muted-foreground">Billing Cycle</span>
                                          <p className="font-semibold text-foreground capitalize">{clientRetainer.billing_cycle}</p>
                                        </div>
                                      </div>
                                    </div>
                                    <label className="flex items-start gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={retainerAgreed}
                                        onChange={(e) => setRetainerAgreed(e.target.checked)}
                                        className="mt-0.5 accent-primary"
                                      />
                                      <span className="text-xs text-muted-foreground">
                                        I have read and agree to the retainer agreement terms. I authorize recurring billing as described above.
                                      </span>
                                    </label>
                                    <Button
                                      size="sm"
                                      className="gap-2 w-full"
                                      onClick={handleSignRetainer}
                                      disabled={!retainerAgreed || retainerSigning}
                                    >
                                      <FileSignature className="w-4 h-4" />
                                      {retainerSigning ? "Signing..." : "Sign & Activate Retainer"}
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="p-4 rounded-lg border border-border bg-muted/30 text-center space-y-2">
                                    <p className="text-sm text-muted-foreground">No retainer agreement has been prepared yet.</p>
                                    <p className="text-xs text-muted-foreground">Your agency will prepare your retainer agreement shortly.</p>
                                  </div>
                                )}
                              </div>
                            ) : item.form === "strategyMeeting" ? (
                              checklist?.strategy_meeting_date && !checklist?.strategy_meeting_confirmed ? (
                                <div className="mt-3 ml-8 p-3 rounded-lg bg-blue-50 border border-blue-200 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs font-medium text-blue-800">
                                      {checklist.strategy_meeting_proposed_by === 'client' ? 'Your Request' : 'Agency Proposal'}
                                    </p>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-200 text-blue-800">
                                      {checklist.strategy_meeting_proposed_by === 'client' ? 'Pending agency confirmation' : 'Awaiting your confirmation'}
                                    </span>
                                  </div>
                                  <p className="text-sm font-medium text-blue-900">
                                    📅 {new Date(checklist.strategy_meeting_date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                  </p>
                                  {checklist.strategy_meeting_proposed_by === 'client' ? (
                                    <p className="text-xs text-blue-700">
                                      Your agency will review and confirm this time shortly. You'll receive an email confirmation.
                                    </p>
                                  ) : (
                                    <div className="space-y-2">
                                      <p className="text-xs text-blue-700">
                                        Your agency has proposed this time. Please confirm or suggest an alternative.
                                      </p>
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          className="h-8 text-xs"
                                          onClick={async () => {
                                            try {
                                              await base44.functions.invoke('confirmMeetingTime', {
                                                checklistId: checklist.id,
                                                confirmedBy: 'client',
                                              });
                                              queryClient.invalidateQueries({ queryKey: ['onboarding-checklists'] });
                                            } catch (error) {
                                              console.error('Error confirming:', error);
                                            }
                                          }}
                                        >
                                          ✓ Confirm This Time
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-8 text-xs"
                                          onClick={() => {
                                            setMeetingDateTime('');
                                            setMeetingNotes('');
                                            // Scroll to form
                                            const form = document.getElementById('strategy-meeting-form');
                                            if (form) form.scrollIntoView({ behavior: 'smooth' });
                                          }}
                                        >
                                          ↺ Suggest New Time
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : checklist?.strategy_meeting_confirmed ? (
                                <div className="mt-3 ml-8 p-3 rounded-lg bg-green-50 border border-green-200">
                                  <p className="text-xs font-medium text-green-800">✓ Meeting Confirmed</p>
                                  <p className="text-sm font-semibold text-green-900 mt-0.5">
                                    📅 {new Date(checklist.strategy_meeting_date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                  </p>
                                  <p className="text-xs text-green-700 mt-1">
                                    You'll receive a calendar invitation via email.
                                  </p>
                                </div>
                              ) : (
                                <form id="strategy-meeting-form" onSubmit={handleStrategyMeetingSubmit} className="mt-3 ml-8 space-y-3">
                                  <div className="space-y-2">
                                    <p className="text-xs font-medium text-foreground">Propose a date & time for your strategy session:</p>
                                    <Input
                                      type="datetime-local"
                                      value={meetingDateTime}
                                      onChange={(e) => setMeetingDateTime(e.target.value)}
                                      min={new Date().toISOString().slice(0, 16)}
                                      required
                                      className="text-sm"
                                    />
                                    <Textarea
                                      placeholder="Any specific topics you'd like to cover or questions you have?"
                                      value={meetingNotes}
                                      onChange={(e) => setMeetingNotes(e.target.value)}
                                      className="text-sm h-20"
                                    />
                                  </div>
                                  <Button size="sm" type="submit" className="gap-2">
                                    <CalendarClock className="w-4 h-4" />
                                    Propose Meeting Time
                                  </Button>
                                </form>
                              )
                            ) : (
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  if (item.form === "brandAssets") handleBrandAssetsSubmit(e);
                                  else if (item.form === "businessGoals") handleBusinessGoalsSubmit(e);
                                  else if (item.form === "communicationChannel") handleCommunicationChannelSubmit(e);
                                }}
                                className="mt-3 ml-8 space-y-3"
                              >
                                {item.form === "brandAssets" && (
                                  <div className="space-y-2">
                                    <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
                                      <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                                      <span className="text-xs text-muted-foreground">Click to upload logos, images, fonts</span>
                                      <input
                                        type="file"
                                        multiple
                                        accept="image/*,.pdf,.zip,.ttf,.otf,.woff"
                                        className="hidden"
                                        onChange={(e) => setBrandAssetFiles(Array.from(e.target.files))}
                                      />
                                    </label>
                                    {brandAssetFiles.length > 0 && (
                                      <div className="flex flex-wrap gap-2">
                                        {brandAssetFiles.map((f, i) => (
                                          <div key={i} className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
                                            <span className="max-w-[120px] truncate">{f.name}</span>
                                            <button type="button" onClick={() => setBrandAssetFiles(prev => prev.filter((_, j) => j !== i))}>
                                              <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                                <Textarea
                                  placeholder={item.form === "brandAssets" ? "Add any notes about your brand (colors, fonts, style preferences)..." : item.label}
                                  value={getFormField()}
                                  onChange={(e) => {
                                    if (item.form === "brandAssets") setFormData(prev => ({ ...prev, brandAssets: e.target.value }));
                                    else if (item.form === "businessGoals") setFormData(prev => ({ ...prev, businessGoals: e.target.value }));
                                    else if (item.form === "communicationChannel") setFormData(prev => ({ ...prev, communicationChannel: e.target.value }));
                                  }}
                                  className="text-sm h-20"
                                />
                                <Button size="sm" type="submit" disabled={item.form === "brandAssets" && uploadingAssets}>
                                  {item.form === "brandAssets" && uploadingAssets ? "Uploading..." : "Submit"}
                                </Button>
                              </form>
                            )
                          )}
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

      {/* Embedded Payment Modal */}
      {payingInvoice && stripePromise && clientSecret && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => {
                setPayingInvoice(null);
                setClientSecret(null);
              }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-lg font-semibold mb-4">
              Pay Setup Invoice
            </h3>
            
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <StripePaymentForm 
                amount={payingInvoice.amount} 
                onSuccess={handlePaymentSuccess}
              />
            </Elements>
          </div>
        </div>
      )}
    </div>
  );
}