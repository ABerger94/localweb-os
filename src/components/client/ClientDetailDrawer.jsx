import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Globe, Target, Users, Palette, FileText, Mail, Phone, Pencil } from "lucide-react";
import ClientEditModal from "@/components/client/ClientEditModal.jsx";
import { EmailComposer, CallScheduler } from "@/components/client/ClientActionComponents.jsx";

function Section({ title, icon: SectionIcon, children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b pb-1">
        <SectionIcon className="w-4 h-4 text-primary" />
        {title}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}

export default function ClientDetailDrawer({ client, open, onClose, onEdit }) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [showInlineEmail, setShowInlineEmail] = useState(false);
  const [showInlineCall, setShowInlineCall] = useState(false);

  const { data: questionnaires = [] } = useQuery({
    queryKey: ["onboarding-questionnaire"],
    queryFn: () => base44.entities.OnboardingQuestionnaire.list(),
    enabled: open && !!client,
  });

  const { data: checklists = [] } = useQuery({
    queryKey: ["onboarding-checklists"],
    queryFn: () => base44.entities.OnboardingChecklist.list(),
    enabled: open && !!client,
  });

  const { data: assets = [] } = useQuery({
    queryKey: ["design-assets"],
    queryFn: () => base44.entities.DesignAsset.list(),
    enabled: open && !!client,
  });

  if (!client) return null;

  const q = questionnaires.find((q) => q.client_id === client.id);
  const checklist = checklists.find((c) => c.client_id === client.id);
  const clientAssets = assets.filter((a) => a.client_id === client.id);

  const allChecklistKeys = [
    {
      key: "welcome_email_sent",
      label: "Welcome email sent",
      action: checklist && !checklist.welcome_email_sent && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setShowInlineEmail(!showInlineEmail); }}
          className="inline-flex items-center justify-center h-5 text-xs px-2 py-0 ml-auto rounded-md border border-input bg-transparent hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Mail className="w-3 h-3 mr-1" />
          {showInlineEmail ? "Cancel" : "Draft Email"}
        </button>
      ),
    },
    { key: "portal_access_granted", label: "Portal access granted" },
    {
      key: "welcome_call_scheduled",
      label: "Welcome call scheduled",
      action: checklist && !checklist.welcome_call_scheduled && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setShowInlineCall(!showInlineCall); }}
          className="inline-flex items-center justify-center h-5 text-xs px-2 py-0 ml-auto rounded-md border border-input bg-transparent hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Phone className="w-3 h-3 mr-1" />
          {showInlineCall ? "Cancel" : "Schedule Call"}
        </button>
      ),
    },
    { key: "brand_assets_collected", label: "Brand assets collected" },
    { key: "business_goals_documented", label: "Business goals documented" },
    { key: "questionnaire_completed", label: "Questionnaire completed" },
    { key: "strategy_meeting_held", label: "Strategy meeting held" },
    { key: "communication_channels_set", label: "Communication channels set" },
    { key: "first_project_created", label: "First project created" },
    { key: "initial_invoice_sent", label: "Initial invoice sent" },
    { key: "retainer_agreement_signed", label: "Retainer agreement signed" },
  ];

  const completedCount = allChecklistKeys.filter((i) => checklist?.[i.key]).length;
  const progressPct = Math.round((completedCount / allChecklistKeys.length) * 100);

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent 
          className="w-full sm:max-w-lg overflow-y-auto" 
          onOpenAutoFocus={(e) => e.preventDefault()} 
          onCloseAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <SheetHeader className="mb-6">
            <div className="flex items-start justify-between gap-2">
              <SheetTitle className="text-xl">{client.business_name}</SheetTitle>
              {onEdit && (
                <Button size="sm" variant="outline" className="shrink-0" onClick={() => { setEditModalOpen(true); onClose(); }}>
                  <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{client.contact_name} · {client.contact_email}</p>
            <div className="flex gap-2 flex-wrap mt-1">
              <Badge variant="outline">{client.status}</Badge>
              <Badge variant="outline">{client.pipeline_stage}</Badge>
              {client.business_type && <Badge variant="secondary">{client.business_type}</Badge>}
            </div>
          </SheetHeader>

          <div className="space-y-6">
            {/* Contact Info */}
            <Section title="Contact Details" icon={Users}>
              <div className="grid grid-cols-2 gap-3">
                <InfoRow label="Phone" value={client.phone} />
                <InfoRow label="Location" value={client.location} />
                <InfoRow label="Address" value={client.address} />
                <InfoRow label="Google Rating" value={client.google_rating ? `${client.google_rating} stars` : null} />
                <InfoRow label="Portal User Email" value={client.user_email} />
              </div>
            </Section>

            {/* Onboarding Progress */}
            <Section title={`Onboarding Progress (${progressPct}%)`} icon={CheckCircle2}>
              <div className="space-y-1.5">
                {allChecklistKeys.map((item) => (
                  <div key={item.key} className="flex items-center gap-2">
                    {checklist?.[item.key] ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    )}
                    <span className={`text-xs ${checklist?.[item.key] ? "text-foreground" : "text-muted-foreground"}`}>
                      {item.label}
                    </span>
                    {item.action || null}
                  </div>
                ))}
                {showInlineEmail && (
                  <EmailComposer 
                    client={client}
                    checklistId={checklist?.id}
                    onSent={() => { setShowInlineEmail(false); }}
                    onCancel={() => setShowInlineEmail(false)}
                  />
                )}
                {showInlineCall && (
                  <CallScheduler 
                    client={client}
                    checklistId={checklist?.id}
                    onScheduled={() => { setShowInlineCall(false); }}
                    onCancel={() => setShowInlineCall(false)}
                  />
                )}
              </div>
            </Section>

            {/* Questionnaire Data */}
            {q && (
              <>
                <Section title="Business Information" icon={Target}>
                  <div className="space-y-3">
                    <InfoRow label="Website" value={q.website_url} />
                    <InfoRow label="Products / Services" value={q.main_services} />
                    <InfoRow label="Target Audience" value={q.target_audience} />
                    <InfoRow label="Unique Value" value={q.unique_value} />
                    <InfoRow label="Competitors" value={q.competitor_names} />
                    <InfoRow label="Social Media" value={q.social_media_handles} />
                  </div>
                </Section>

                <Section title="Project Goals" icon={Globe}>
                  <div className="space-y-3">
                    <InfoRow label="Primary Goal" value={q.primary_goal === "Other" ? q.primary_goal_other : q.primary_goal} />
                    <InfoRow label="Timeline" value={q.timeline} />
                    {q.budget_range && (
                      <div>
                        <p className="text-xs text-muted-foreground">Monthly Budget</p>
                        <p className="text-sm font-semibold text-primary">
                          ${q.budget_range}{q.budget_range >= 500 ? "+" : ""}/mo
                        </p>
                      </div>
                    )}
                    <InfoRow label="Design Style" value={q.design_style} />
                    <InfoRow label="Additional Notes" value={q.additional_notes} />
                  </div>
                </Section>
              </>
            )}

            {/* Brand Assets */}
            {clientAssets.length > 0 && (
              <Section title="Brand Assets" icon={Palette}>
                <div className="space-y-2">
                  {clientAssets.map((asset) => (
                    <div key={asset.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/40">
                      {asset.asset_value?.startsWith("http") ? (
                        <img src={asset.asset_value} alt={asset.asset_name} className="w-10 h-10 object-contain rounded border bg-white" />
                      ) : null}
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{asset.asset_name}</p>
                        {asset.description && <p className="text-xs text-muted-foreground truncate">{asset.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Internal Notes */}
            {(client.brand_notes || client.notes) && (
              <Section title="Internal Notes" icon={FileText}>
                <InfoRow label="Brand Notes" value={client.brand_notes} />
                <InfoRow label="General Notes" value={client.notes} />
              </Section>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ClientEditModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        client={client}
      />
    </>
  );
}