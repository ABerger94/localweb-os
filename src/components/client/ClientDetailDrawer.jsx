import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Globe, Target, Users, Palette, FileText, Mail, Phone, Pencil, Download, Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import ClientEditModal from "@/components/client/ClientEditModal.jsx";
import { EmailComposer, CallScheduler } from "@/components/client/ClientActionComponents.jsx";
import { toast } from "sonner";

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

  const exportClientData = (clientData, questionnaire, assets) => {
    const exportData = {
      client: {
        business_name: clientData.business_name,
        business_type: clientData.business_type,
        contact_name: clientData.contact_name,
        contact_email: clientData.contact_email,
        phone: clientData.phone,
        location: clientData.location,
        address: clientData.address,
        google_rating: clientData.google_rating,
        status: clientData.status,
        pipeline_stage: clientData.pipeline_stage,
        brand_notes: clientData.brand_notes,
        notes: clientData.notes,
        competitor_urls: clientData.competitor_urls,
      },
      questionnaire: questionnaire || null,
      brand_assets: assets.map(asset => ({
        asset_type: asset.asset_type,
        asset_name: asset.asset_name,
        asset_value: asset.asset_value,
        description: asset.description,
      })),
      onboarding_status: checklist ? {
        welcome_email_sent: checklist.welcome_email_sent,
        portal_access_granted: checklist.portal_access_granted,
        welcome_call_scheduled: checklist.welcome_call_scheduled,
        welcome_call_date: checklist.welcome_call_date,
        welcome_call_confirmed: checklist.welcome_call_confirmed,
        brand_assets_collected: checklist.brand_assets_collected,
        business_goals_documented: checklist.business_goals_documented,
        questionnaire_completed: checklist.questionnaire_completed,
        strategy_meeting_held: checklist.strategy_meeting_held,
        communication_channels_set: checklist.communication_channels_set,
        first_project_created: checklist.first_project_created,
        initial_invoice_sent: checklist.initial_invoice_sent,
        retainer_agreement_signed: checklist.retainer_agreement_signed,
      } : null,
      exported_date: new Date().toISOString(),
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${clientData.business_name.replace(/[^a-z0-9]/gi, "_")}_client_data.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Client data exported successfully");
  };

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
            <Section title="Brand Assets & Design Files" icon={Palette}>
              {clientAssets.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No brand assets uploaded yet</p>
              ) : (
                <div className="space-y-3">
                  {/* Logos */}
                  {clientAssets.filter(a => a.asset_type === "logo").length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" /> Logos
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {clientAssets.filter(a => a.asset_type === "logo").map((asset) => (
                          <div key={asset.id} className="flex flex-col items-center gap-2 p-2 rounded-lg bg-muted/40 border">
                            {asset.asset_value?.startsWith("http") ? (
                              <img src={asset.asset_value} alt={asset.asset_name} className="w-full h-20 object-contain rounded bg-white" />
                            ) : (
                              <div className="w-full h-20 flex items-center justify-center bg-white rounded border">
                                <span className="text-xs text-muted-foreground">{asset.asset_value}</span>
                              </div>
                            )}
                            <div className="text-center">
                              <p className="text-xs font-medium truncate max-w-[120px]">{asset.asset_name}</p>
                              {asset.description && <p className="text-xs text-muted-foreground truncate max-w-[120px]">{asset.description}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Colors */}
                  {clientAssets.filter(a => a.asset_type === "color").length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-2">Brand Colors</p>
                      <div className="flex flex-wrap gap-2">
                        {clientAssets.filter(a => a.asset_type === "color").map((asset) => (
                          <div key={asset.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border">
                            <div 
                              className="w-8 h-8 rounded border shadow-sm"
                              style={{ backgroundColor: asset.asset_value }}
                            />
                            <div>
                              <p className="text-xs font-medium">{asset.asset_name}</p>
                              <p className="text-xs text-muted-foreground font-mono">{asset.asset_value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Fonts */}
                  {clientAssets.filter(a => a.asset_type === "font").length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-2">Typography</p>
                      <div className="space-y-1">
                        {clientAssets.filter(a => a.asset_type === "font").map((asset) => (
                          <div key={asset.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border">
                            <div>
                              <p className="text-xs font-medium">{asset.asset_name}</p>
                              <p className="text-xs text-muted-foreground">{asset.asset_value}</p>
                            </div>
                            {asset.description && <p className="text-xs text-muted-foreground italic">{asset.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Images & Icons */}
                  {clientAssets.filter(a => ["image", "icon"].includes(a.asset_type)).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-2">Images & Icons</p>
                      <div className="grid grid-cols-3 gap-2">
                        {clientAssets.filter(a => ["image", "icon"].includes(a.asset_type)).map((asset) => (
                          <div key={asset.id} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/40 border">
                            {asset.asset_value?.startsWith("http") ? (
                              <img src={asset.asset_value} alt={asset.asset_name} className="w-12 h-12 object-cover rounded" />
                            ) : (
                              <div className="w-12 h-12 flex items-center justify-center bg-white rounded border">
                                <LinkIcon className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                            <p className="text-xs font-medium truncate max-w-full">{asset.asset_name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Section>

            {/* Export Client Data */}
            <Section title="Export for Website Building" icon={Download}>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Download all client information, questionnaire responses, and brand assets as a structured JSON file for use in your website building workflow.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => exportClientData(client, q, clientAssets)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Client JSON
                </Button>
              </div>
            </Section>

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