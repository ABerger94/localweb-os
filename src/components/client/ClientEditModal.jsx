import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STATUSES = ["Lead", "Active", "Paused", "Churned"];
const PIPELINE_STAGES = ["Prospect", "Mockup Sent", "Pitch Meeting", "Onboarding", "Active Retainer", "Churned"];

export default function ClientEditModal({ client, open, onClose }) {
  const qc = useQueryClient();
  const isNew = !client?.id;

  const emptyForm = {
    business_name: "", business_type: "", contact_name: "", contact_email: "",
    phone: "", location: "", address: "", google_rating: "", status: "Lead",
    pipeline_stage: "Prospect", user_email: "", brand_notes: "", notes: "", competitor_urls: "",
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (open) {
      setForm(client ? {
        business_name: client.business_name || "",
        business_type: client.business_type || "",
        contact_name: client.contact_name || "",
        contact_email: client.contact_email || "",
        phone: client.phone || "",
        location: client.location || "",
        address: client.address || "",
        google_rating: client.google_rating || "",
        status: client.status || "Lead",
        pipeline_stage: client.pipeline_stage || "Prospect",
        user_email: client.user_email || "",
        brand_notes: client.brand_notes || "",
        notes: client.notes || "",
        competitor_urls: client.competitor_urls || "",
      } : emptyForm);
    }
  }, [client, open]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      const saved = isNew
        ? await base44.entities.Client.create(data)
        : await base44.entities.Client.update(client.id, data);

      // Auto-link the portal user when user_email is set
      if (data.user_email) {
        const clientId = isNew ? saved.id : client.id;
        await base44.functions.invoke('linkUserToClient', { client_id: clientId, user_email: data.user_email });
      }

      return saved;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      onClose();
    },
  });

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target?.value ?? e }));

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({ ...form, google_rating: form.google_rating ? Number(form.google_rating) : undefined });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{isNew ? "New Client" : `Edit — ${client?.business_name}`}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="mt-2">
            <TabsList className="mb-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Business Name *</Label>
                  <Input value={form.business_name} onChange={set("business_name")} required />
                </div>
                <div className="space-y-1">
                  <Label>Business Type</Label>
                  <Input value={form.business_type} onChange={set("business_type")} placeholder="e.g. Restaurant, Salon" />
                </div>
                <div className="space-y-1">
                  <Label>Contact Name</Label>
                  <Input value={form.contact_name} onChange={set("contact_name")} />
                </div>
                <div className="space-y-1">
                  <Label>Contact Email *</Label>
                  <Input type="email" value={form.contact_email} onChange={set("contact_email")} required />
                </div>
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={set("phone")} />
                </div>
                <div className="space-y-1">
                  <Label>Location</Label>
                  <Input value={form.location} onChange={set("location")} placeholder="City / Area" />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>Address</Label>
                  <Input value={form.address} onChange={set("address")} />
                </div>
                <div className="space-y-1">
                  <Label>Google Rating (1–5)</Label>
                  <Input type="number" min="1" max="5" step="0.1" value={form.google_rating} onChange={set("google_rating")} />
                </div>
                <div className="space-y-1">
                  <Label>Portal User Email</Label>
                  <Input type="email" value={form.user_email} onChange={set("user_email")} />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>Competitor URLs</Label>
                  <Input value={form.competitor_urls} onChange={set("competitor_urls")} placeholder="Comma-separated URLs" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="status" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Client Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Pipeline Stage</Label>
                  <Select value={form.pipeline_stage} onValueChange={(v) => setForm((f) => ({ ...f, pipeline_stage: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PIPELINE_STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <div className="space-y-1">
                <Label>Brand Notes</Label>
                <Textarea rows={4} value={form.brand_notes} onChange={set("brand_notes")} placeholder="Brand voice, colors, style guidelines..." />
              </div>
              <div className="space-y-1">
                <Label>General Notes</Label>
                <Textarea rows={4} value={form.notes} onChange={set("notes")} placeholder="Internal notes about the client..." />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : isNew ? "Create Client" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}